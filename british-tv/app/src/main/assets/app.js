(function () {
  'use strict';

  var E = window.Engine;
  var DAY = 24 * 60 * 60 * 1000;
  var MAX_STORED = 1500;
  var MAX_ERRORS = 6;
  var RETRY_MS = 15000;

  function $(id) { return document.getElementById(id); }
  var v = $('v');

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, x) { try { localStorage.setItem(k, JSON.stringify(x)); } catch (e) { /* storage full or blocked */ } }
  };

  // ------------------------------------------------------------------ network

  var reqId = 0;
  var pending = {};

  // Called by the Android shell when a request finishes.
  window.__http = function (id, status, body) {
    var p = pending[id];
    if (!p) return;
    delete pending[id];
    if (status >= 200 && status < 300) p.res(body); else p.rej(new Error('HTTP ' + status));
  };

  function http(url) {
    if (window.NativeHttp) {
      return new Promise(function (res, rej) {
        var id = ++reqId;
        pending[id] = { res: res, rej: rej };
        window.NativeHttp.get(id, url);
        setTimeout(function () {
          if (pending[id]) { delete pending[id]; rej(new Error('timeout')); }
        }, 40000);
      });
    }
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  function getJSON(url) { return http(url).then(JSON.parse); }

  function searchUrl(q, rows) {
    return 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(q) +
      '&fl%5B%5D=identifier&fl%5B%5D=title&rows=' + rows + '&sort%5B%5D=downloads+desc&output=json';
  }

  function pool(items, n, fn) {
    var out = new Array(items.length);
    var i = 0;
    function worker() {
      if (i >= items.length) return Promise.resolve();
      var k = i++;
      return Promise.resolve().then(function () { return fn(items[k], k); })
        .then(function (r) { out[k] = r; }, function () { out[k] = null; })
        .then(worker);
    }
    var workers = [];
    for (var w = 0; w < Math.min(n, items.length); w++) workers.push(worker());
    return Promise.all(workers).then(function () { return out; });
  }

  function loadPrograms(ch) {
    var key = 'lib2:' + ch.id + ':' + E.hash(JSON.stringify(ch.sources));
    var cached = store.get(key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < DAY) {
      return Promise.resolve(cached.p);
    }
    var ids = [];
    var optsFor = {};
    var chain = Promise.resolve();
    ch.sources.forEach(function (s) {
      var skip = s.exclude ? new RegExp(s.exclude, 'i') : null;
      if (s.item) {
        ids.push(s.item);
        optsFor[s.item] = { include: s.include, exclude: s.exclude };
      } else if (s.search) {
        chain = chain.then(function () {
          return getJSON(searchUrl(s.search, s.rows || 25)).then(function (j) {
            ((j.response && j.response.docs) || []).forEach(function (d) {
              if (skip && skip.test((d.title || '') + ' ' + d.identifier)) return; // unwanted result
              ids.push(d.identifier);
              optsFor[d.identifier] = { exclude: s.exclude };
            });
          }, function () { /* a failed search just contributes nothing */ });
        });
      }
    });
    return chain.then(function () {
      var seen = {};
      var uniq = ids.filter(function (id) { return id && !seen[id] && (seen[id] = true); })
        .slice(0, ch.maxItems || 40);
      return pool(uniq, 5, function (id) {
        return getJSON('https://archive.org/metadata/' + encodeURIComponent(id));
      }).then(function (metas) {
        var progs = [];
        metas.forEach(function (m, i) {
          if (m) Array.prototype.push.apply(progs, E.pickPrograms(uniq[i], m, optsFor[uniq[i]]));
        });
        progs = E.sample(progs, MAX_STORED);
        if (progs.length) store.set(key, { t: Date.now(), p: progs });
        return progs;
      });
    });
  }

  // ------------------------------------------------------------------ channels

  var channels = window.CHANNELS.map(function (c) {
    return { n: c.n, id: c.id, name: c.name, sources: c.sources, maxItems: c.maxItems, status: 'loading', sched: null };
  });

  function ready() {
    return channels.filter(function (c) { return c.status === 'ready'; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  function renderStatus() {
    var box = $('chstatus');
    box.textContent = '';
    channels.forEach(function (c) {
      var line = document.createElement('div');
      var mark = c.status === 'ready' ? '✓' : c.status === 'empty' ? '–' : '…';
      line.textContent = mark + '  ' + c.n + '  ' + c.name +
        (c.status === 'ready' ? '  (' + Math.round(c.sched.total / 60) + ' min of programmes)' :
          c.status === 'empty' ? '  (nothing found)' : '');
      box.appendChild(line);
    });
    var on = Math.min(7, 1 + Math.floor(Date.now() / 400) % 7);
    var bars = $('bars').children;
    for (var i = 0; i < bars.length; i++) bars[i].className = i < on ? 'on' : '';
  }

  // ------------------------------------------------------------------ tuning static

  var staticEl = $('static');
  var sctx = staticEl.getContext('2d');
  var SW = 256, SH = 144;
  var sImage = sctx.createImageData(SW, SH);
  var sTimer = null, sToken = 0, sSince = 0, sOn = false;
  var audioCtx = null, noiseNode = null, noiseGain = null;
  var MIN_STATIC_MS = 700;

  function drawStatic() {
    var d = sImage.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
    }
    // a few horizontal tear bands, like a badly tuned set
    for (var b = 0; b < 3; b++) {
      var y = (Math.random() * SH) | 0, h = 1 + ((Math.random() * 3) | 0), shift = (Math.random() * 40) | 0;
      for (var yy = y; yy < Math.min(SH, y + h); yy++) {
        for (var x = 0; x < SW; x++) {
          var p = (yy * SW + x) * 4, q = (yy * SW + ((x + shift) % SW)) * 4;
          var vv = d[q] > 128 ? 255 : 30;
          d[p] = vv; d[p + 1] = vv; d[p + 2] = vv;
        }
      }
    }
    sctx.putImageData(sImage, 0, 0);
  }

  function startHiss() {
    try {
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        var len = audioCtx.sampleRate * 2;
        var buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        var ch = buf.getChannelData(0);
        for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
        noiseNode = audioCtx.createBufferSource();
        noiseNode.buffer = buf;
        noiseNode.loop = true;
        noiseGain = audioCtx.createGain();
        noiseGain.gain.value = 0;
        noiseNode.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noiseNode.start();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      noiseGain.gain.value = 0.08;
    } catch (e) { /* audio is optional */ }
  }

  function stopHiss() {
    try { if (noiseGain) noiseGain.gain.value = 0; } catch (e) { /* ignore */ }
  }

  function showStatic() {
    sToken++;
    startHiss();
    if (sOn) return;
    sOn = true;
    sSince = Date.now();
    staticEl.className = '';
    drawStatic();
    clearInterval(sTimer);
    sTimer = setInterval(drawStatic, 60);
  }

  function hideStatic() {
    stopHiss();
    if (!sOn) return;
    var token = sToken;
    var wait = Math.max(0, MIN_STATIC_MS - (Date.now() - sSince));
    setTimeout(function () {
      if (token !== sToken) return; // another tune started meanwhile
      sOn = false;
      staticEl.className = 'hidden';
      clearInterval(sTimer);
    }, wait);
  }

  // ------------------------------------------------------------------ playback

  var cur = null; // { ch, index, prog, errors }
  var started = false;
  var bannerTimer = null;
  var toastTimer = null;

  function toast(msg, ms) {
    var t = $('toast');
    t.textContent = msg;
    t.className = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'off'; }, ms || 2000);
  }

  function fmtTime(ms) {
    var d = new Date(ms);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function showBanner() {
    if (!cur) return;
    var sched = cur.ch.sched;
    var next = sched.order[(cur.index + 1) % sched.order.length];
    $('bnum').textContent = cur.ch.n;
    $('bchan').textContent = cur.ch.name;
    $('btitle').textContent = cur.prog.title;
    $('bsub').textContent = cur.prog.sub || '';
    var nb = $('bnext');
    nb.textContent = '';
    if (next) {
      nb.appendChild(document.createTextNode('Next'));
      var b = document.createElement('b');
      b.textContent = next.title;
      nb.appendChild(b);
    }
    $('banner').className = '';
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { $('banner').className = 'off'; }, 5000);
  }

  function playSlot(ch, index, offset, announce) {
    var prog = ch.sched.order[index];
    cur = { ch: ch, index: index, prog: prog, errors: cur && cur.ch === ch ? cur.errors : 0 };
    v.dataset.offset = String(offset || 0);
    v.src = prog.url;
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked or interrupted; error handler covers failures */ });
    store.set('last', ch.id);
    showStatic();
    if (announce) showBanner();
  }

  function tune(ch, announce) {
    var slot = E.at(ch.sched, Date.now());
    if (!slot) return;
    cur = null;
    playSlot(ch, slot.index, slot.offsetSec, announce !== false);
  }

  function nextInChannel() {
    if (!cur) return;
    playSlot(cur.ch, (cur.index + 1) % cur.ch.sched.order.length, 0, true);
  }

  function surf(delta) {
    var list = ready();
    if (!list.length) return;
    var i = cur ? list.indexOf(cur.ch) : 0;
    i = (i + delta + list.length) % list.length;
    tune(list[i], true);
  }

  v.addEventListener('loadedmetadata', function () {
    var off = parseFloat(v.dataset.offset) || 0;
    v.dataset.offset = '0';
    if (off > 0 && isFinite(v.duration)) {
      try { v.currentTime = Math.min(off, Math.max(0, v.duration - 2)); } catch (e) { /* not seekable */ }
    }
  });
  v.addEventListener('playing', function () {
    hideStatic();
    if (cur) cur.errors = 0;
  });
  v.addEventListener('waiting', function () { if (!v.paused) showStatic(); });
  v.addEventListener('ended', nextInChannel);
  v.addEventListener('error', function () {
    if (!cur) return;
    cur.errors++;
    if (cur.errors >= MAX_ERRORS) {
      cur.errors = 0;
      showNoSignal('This channel is not playing right now.');
      setTimeout(function () { hideNoSignal(); nextInChannel(); }, RETRY_MS);
    } else {
      setTimeout(nextInChannel, 800);
    }
  });

  function showNoSignal(msg) {
    $('nsmsg').textContent = msg;
    $('nosignal').className = '';
  }
  function hideNoSignal() { $('nosignal').className = 'hidden'; }

  // ------------------------------------------------------------------ guide (grid, Sky-style)

  var HALF = 30 * 60 * 1000;
  var SPAN = 4 * HALF;          // two hours visible
  var VISIBLE_ROWS = 6;
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var guideOpen = false;
  var gChan = null;  // selected channel
  var gRow = 0;      // its row (derived)
  var gTop = 0;      // first visible row
  var gWin = 0;      // time at the left edge of the grid
  var gFocus = 0;    // time the cursor is on
  var guideTimer = null;

  function guideList() {
    return channels.filter(function (c) { return c.status !== 'empty'; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  function floorHalf(ms) { return Math.floor(ms / HALF) * HALF; }
  function dayLabel(ms) { var d = new Date(ms); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; }
  function div(cls, text) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    if (text !== undefined) d.textContent = text;
    return d;
  }

  function renderGuide() {
    var list = guideList();
    if (!list.length) return;
    var now = Date.now();
    gRow = list.indexOf(gChan);
    if (gRow < 0) { gRow = 0; gChan = list[0]; }
    if (gRow < gTop) gTop = gRow;
    if (gRow >= gTop + VISIBLE_ROWS) gTop = gRow - VISIBLE_ROWS + 1;

    $('gclock').textContent = fmtTime(now);

    var grid = $('ggrid');
    grid.textContent = '';

    var th = div('trow');
    th.appendChild(div('tday', dayLabel(gWin)));
    var ticks = div('tline');
    for (var i = 0; i < 4; i++) {
      var tick = div('tick', fmtTime(gWin + i * HALF));
      tick.style.left = (i * 25) + '%';
      ticks.appendChild(tick);
    }
    th.appendChild(ticks);
    grid.appendChild(th);

    for (var r = gTop; r < Math.min(list.length, gTop + VISIBLE_ROWS); r++) {
      var ch = list[r];
      var row = div('grow');
      var cell = div('gch' + (r === gRow ? ' sel' : ''));
      cell.appendChild(div('n', ch.n));
      cell.appendChild(div('name', ch.name));
      row.appendChild(cell);
      var line = div('tline');
      if (ch.status !== 'ready') {
        var ld = div('blk ld' + (ch === gChan ? ' foc' : ''));
        ld.style.left = '0';
        ld.style.width = 'calc(100% - .4vw)';
        ld.appendChild(div('t', 'Loading programmes\u2026'));
        line.appendChild(ld);
        row.appendChild(line);
        grid.appendChild(row);
        continue;
      }
      E.blocks(ch.sched, gWin, gWin + SPAN).forEach(function (b) {
        var s = Math.max(b.startMs, gWin);
        var e = Math.min(b.endMs, gWin + SPAN);
        if (e <= s) return;
        var focused = (ch === list[gRow]) && b.startMs <= gFocus && gFocus < b.endMs;
        var frac = (e - s) / SPAN;
        var clipL = b.startMs < gWin, clipR = b.endMs > gWin + SPAN;
        var el = div('blk' + (focused ? ' foc' : '') + (b.startMs <= now && now < b.endMs ? ' now' : '') +
          (clipL ? ' cl' : '') + (clipR ? ' cr' : ''));
        el.style.left = ((s - gWin) / SPAN * 100) + '%';
        el.style.width = 'calc(' + (frac * 100) + '% - .4vw)';
        if (frac < 0.07) { line.appendChild(el); return; } // too narrow for text
        if (clipL) el.appendChild(div('arr l', '◄'));
        if (clipR) el.appendChild(div('arr r', '►'));
        el.appendChild(div('t', b.prog.title));
        el.appendChild(div('s', b.count > 1 ? '+' + (b.count - 1) + ' more' : (b.prog.sub || '')));
        line.appendChild(el);
      });
      row.appendChild(line);
      grid.appendChild(row);
    }

    // programme details for the highlighted block
    var sel = list[gRow];
    var fb = sel.status === 'ready' ? E.blockAt(sel.sched, gFocus) : null;
    if (!fb) {
      $('gtitle').textContent = sel.name;
      $('gchan').textContent = sel.n + '  ' + sel.name;
      $('gtime').textContent = 'Loading programmes\u2026';
      $('gsub').textContent = '';
    } else {
      $('gtitle').textContent = fb.prog.title;
      $('gchan').textContent = sel.n + '  ' + sel.name;
      var when;
      if (fb.startMs <= now && now < fb.endMs) when = 'Showing now';
      else if (fb.startMs > now) {
        var mins = Math.round((fb.startMs - now) / 60000);
        when = mins < 60 ? 'Starts in ' + mins + ' min' : 'Starts at ' + fmtTime(fb.startMs);
      } else when = 'Earlier';
      $('gtime').textContent = fmtTime(fb.startMs) + ' – ' + fmtTime(fb.endMs) + '   ' + when;
      $('gsub').textContent = fb.count > 1
        ? 'Plus ' + (fb.count - 1) + ' more programme' + (fb.count > 2 ? 's' : '')
        : (fb.prog.sub || '');
    }
  }

  function openGuide() {
    var list = guideList();
    if (!list.length) return;
    guideOpen = true;
    var now = Date.now();
    gChan = cur && list.indexOf(cur.ch) >= 0 ? cur.ch : list[0];
    gRow = Math.max(0, list.indexOf(gChan));
    gTop = Math.max(0, gRow - VISIBLE_ROWS + 1);
    gWin = floorHalf(now);
    gFocus = now;
    document.body.classList.add('guide-open');
    $('guide').className = '';
    $('banner').className = 'off';
    renderGuide();
    clearInterval(guideTimer);
    guideTimer = setInterval(function () {
      var t = Date.now();
      if (gWin < floorHalf(t)) { gWin = floorHalf(t); if (gFocus < t) gFocus = t; }
      renderGuide();
    }, 20000);
  }

  function closeGuide() {
    guideOpen = false;
    document.body.classList.remove('guide-open');
    $('guide').className = 'hidden';
    clearInterval(guideTimer);
  }

  function gMove(delta, wrap) {
    var list = guideList();
    var n = list.length;
    var i = Math.max(0, list.indexOf(gChan));
    i = wrap ? (i + delta + n) % n : Math.max(0, Math.min(n - 1, i + delta));
    gChan = list[i];
    renderGuide();
  }

  function gHoriz(dir) {
    if (!gChan || gChan.status !== 'ready') return;
    var sched = gChan.sched;
    var fb = E.blockAt(sched, gFocus);
    var now = Date.now();
    var nb;
    if (dir < 0) {
      if (fb.startMs <= now) return;            // cannot go back before what is on now
      nb = E.blockAt(sched, fb.startMs - 1);
      gFocus = Math.max(nb.startMs, now);
      if (nb.startMs < gWin) gWin = Math.max(floorHalf(now), floorHalf(nb.startMs));
    } else {
      nb = E.blockAt(sched, fb.endMs);
      gFocus = nb.startMs;
      if (nb.startMs >= gWin + SPAN) gWin = floorHalf(nb.startMs);
    }
    renderGuide();
  }

  function gJump(kind) {
    var now = Date.now();
    var base = floorHalf(now);
    if (kind === 'now') { gWin = base; gFocus = now; }
    else if (kind === 'later') { gWin += SPAN; gFocus = gWin; }
    else { gWin = Math.max(base, gWin - SPAN); gFocus = gWin === base ? now : gWin; }
    renderGuide();
  }

  function watchFromGuide() {
    var c = gChan;
    if (!c) return;
    if (c.status !== 'ready') { toast(c.name + ' is still loading', 2000); return; }
    closeGuide();
    if (cur && cur.ch === c) showBanner(); else tune(c, true);
  }

  // ------------------------------------------------------------------ keys

  var digits = '';
  var digitTimer = null;
  var exitArmed = false;
  var exitTimer = null;

  function exitApp() {
    if (window.NativeHttp && window.NativeHttp.exit) window.NativeHttp.exit();
  }

  function onDigit(d) {
    digits += d;
    toast('Channel ' + digits, 1500);
    clearTimeout(digitTimer);
    digitTimer = setTimeout(function () {
      var n = parseInt(digits, 10);
      digits = '';
      var target = ready().filter(function (c) { return c.n === n; })[0];
      if (target) tune(target, true); else toast('No channel ' + n, 1500);
    }, 1400);
  }

  function seek(delta) {
    if (!isFinite(v.duration)) return;
    try { v.currentTime = Math.max(0, Math.min(v.duration - 1, v.currentTime + delta)); } catch (e) { /* ignore */ }
    toast((delta > 0 ? '+' : '−') + Math.abs(delta) + 's', 1000);
  }

  window.addEventListener('keydown', function (e) {
    if (!started) {
      if (e.key === 'GoBack' || e.key === 'Escape' || e.key === 'Backspace') { exitApp(); e.preventDefault(); }
      return;
    }
    var k = e.key;
    var handled = true;

    if (guideOpen) {
      if (k === 'ArrowUp') gMove(-1, true);
      else if (k === 'ArrowDown') gMove(1, true);
      else if (k === 'ChannelUp') gMove(-(VISIBLE_ROWS - 1), false);
      else if (k === 'ChannelDown') gMove(VISIBLE_ROWS - 1, false);
      else if (k === 'ArrowLeft') gHoriz(-1);
      else if (k === 'ArrowRight') gHoriz(1);
      else if (k === 'Red') gJump('now');
      else if (k === 'Green' || k === 'MediaFastForward') gJump('later');
      else if (k === 'Yellow' || k === 'MediaRewind') gJump('earlier');
      else if (k === 'Enter' || k === ' ' || k === 'Blue') watchFromGuide();
      else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Guide') closeGuide();
      else handled = false;
    } else if (k >= '0' && k <= '9' && k.length === 1) {
      onDigit(k);
    } else if (k === 'ArrowUp' || k === 'ChannelUp') { surf(1); }
    else if (k === 'ArrowDown' || k === 'ChannelDown') { surf(-1); }
    else if (k === 'Enter' || k === 'Guide' || k === 'Red') { openGuide(); }
    else if (k === 'Info') { showBanner(); }
    else if (k === 'ArrowRight' || k === 'MediaFastForward') { seek(30); }
    else if (k === 'ArrowLeft' || k === 'MediaRewind') { seek(-30); }
    else if (k === 'MediaPlayPause' || k === ' ') {
      if (v.paused) { v.play(); toast('Play', 1000); } else { v.pause(); toast('Paused', 1500); }
    }
    else if (k === 'MediaPlay') { v.play(); }
    else if (k === 'MediaPause') { v.pause(); toast('Paused', 1500); }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') {
      if (exitArmed) { exitApp(); }
      else {
        exitArmed = true;
        showBanner();
        toast('Press Back again to exit', 2500);
        clearTimeout(exitTimer);
        exitTimer = setTimeout(function () { exitArmed = false; }, 2500);
      }
    }
    else handled = false;

    if (handled) e.preventDefault();
  });

  // ------------------------------------------------------------------ start up

  function begin() {
    var list = ready();
    if (started || !list.length) return;
    started = true;
    $('splash').className = 'hidden';
    var last = store.get('last');
    var pick = list.filter(function (c) { return c.id === last; })[0] || list[0];
    tune(pick, true);
  }

  function startLoading() {
    channels.forEach(function (c) { c.status = 'loading'; c.sched = null; });
    var finished = 0;
    channels.forEach(function (c) {
      loadPrograms(c).then(function (progs) {
        if (progs && progs.length) {
          c.sched = E.buildSchedule(progs, c.id);
          c.status = 'ready';
        } else {
          c.status = 'empty';
        }
      }, function () { c.status = 'empty'; }).then(function () {
        finished++;
        renderStatus();
        begin();
        if (guideOpen) renderGuide();
        if (finished === channels.length && !started) {
          $('splash').className = 'hidden';
          showNoSignal('Could not find any programmes. Check the connection.');
          setTimeout(function () {
            hideNoSignal();
            $('splash').className = '';
            startLoading();
          }, RETRY_MS);
        }
      });
    });
    renderStatus();
  }

  setInterval(function () { if (!started) renderStatus(); }, 400);
  startLoading();
})();
