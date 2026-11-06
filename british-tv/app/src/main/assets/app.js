(function () {
  'use strict';

  var E = window.Engine;
  var DAY = 24 * 60 * 60 * 1000;
  var MAX_STORED = 1500;
  var MAX_ERRORS = 6;
  var RETRY_MS = 15000;

  function $(id) { return document.getElementById(id); }
  var v = $('v');

  // Picture looks (CRT / Vivid / Sharp) are CSS only: the browser may not read archive.org video pixels, so no shader.
  var guideOpen = false;

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
    var key = 'lib2:' + ch.id + ':' + E.hash(JSON.stringify(ch.sources) + (ch.perItem || '') + '|v3');
    var cached = store.get(key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < DAY) {
      ch.report = cached.r || [];
      return Promise.resolve(cached.p);
    }
    var ids = [];
    var optsFor = {};
    var chain = Promise.resolve();
    ch.sources.forEach(function (s) {
      var skip = s.exclude ? new RegExp(s.exclude, 'i') : null;
      if (s.item) {
        ids.push(s.item);
        optsFor[s.item] = { include: s.include, exclude: s.exclude, minDur: s.minDur, perItem: s.perItem };
      } else if (s.search) {
        chain = chain.then(function () {
          return getJSON(searchUrl(s.search, s.rows || 25)).then(function (j) {
            ((j.response && j.response.docs) || []).forEach(function (d) {
              if (skip && skip.test((d.title || '') + ' ' + d.identifier)) return; // unwanted result
              ids.push(d.identifier);
              optsFor[d.identifier] = { exclude: s.exclude, minDur: s.minDur, perItem: s.perItem };
            });
          }, function () { /* a failed search just contributes nothing */ });
        });
      }
    });
    return chain.then(function () {
      var seen = {};
      var uniq = ids.filter(function (id) { return id && !seen[id] && (seen[id] = true); })
        .slice(0, ch.maxItems || 40);
      return pool(uniq, 4, function (id) {
        var url = 'https://archive.org/metadata/' + encodeURIComponent(id);
        // one retry: a busy archive.org sometimes drops a request
        return getJSON(url).then(null, function () { return getJSON(url); });
      }).then(function (metas) {
        var progs = [];
        var report = [];
        metas.forEach(function (m, i) {
          if (!m) { report.push(uniq[i] + ': could not be loaded'); return; }
          var got = E.pickPrograms(uniq[i], m, optsFor[uniq[i]]);
          if (!got.length) report.push(uniq[i] + ': ' + E.whyEmpty(m, optsFor[uniq[i]]));
          // keep one busy item (hundreds of episodes) from drowning out the others
          var cap = (optsFor[uniq[i]] && optsFor[uniq[i]].perItem) || ch.perItem;
          if (cap) {
            // cap each show folder separately, so one busy show can't crowd out the rest of an item
            var byDir = {}, order = [];
            got.forEach(function (g) {
              var parts = g.id.split('/');
              var dir = parts.length > 2 ? parts[1] : '';
              if (!byDir[dir]) { byDir[dir] = []; order.push(dir); }
              byDir[dir].push(g);
            });
            got = [];
            order.forEach(function (d) { Array.prototype.push.apply(got, E.sample(byDir[d], cap)); });
          }
          Array.prototype.push.apply(progs, got);
        });
        ch.report = report;
        progs = E.sample(progs, MAX_STORED);
        if (progs.length) store.set(key, { t: Date.now(), p: progs, r: report });
        return progs;
      });
    });
  }

  // ------------------------------------------------------------------ channels

  var channels = window.CHANNELS.map(function (c) {
    return { n: c.n, id: c.id, name: c.name, sources: c.sources, maxItems: c.maxItems, perItem: c.perItem, report: [], status: 'loading', sched: null };
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

  // ------------------------------------------------------------------ real episode names (TVmaze, free, no key)

  var TVM_DAY = 30 * 24 * 3600 * 1000;
  var tvmChain = Promise.resolve();
  var GENERIC_EP = /^(episode|ep|series|season|part|chapter)?\s*#?\d+(\s*[-:,]\s*\d+)?$|^episode\b|^series\b|^season\b/i;

  function normShow(s) {
    return String(s).toLowerCase().replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '');
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /** {"4:12": ["Dainty Dish", 1992], ...} for a show, or null if TVmaze has no match. One request at a time (rate limit). */
  function tvmEpisodes(name) {
    var key = 'tvm2:' + normShow(name);
    var c = store.get(key);
    if (c && Date.now() - c.t < TVM_DAY) return Promise.resolve(c.eps);
    var job = tvmChain.then(function () {
      return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name)).then(function (list) {
        var want = normShow(name), best = null;
        (list || []).forEach(function (r) {
          var sh = r.show || {};
          var n = normShow(sh.name || '');
          if (!n || !(n === want || n.indexOf(want) === 0 || want.indexOf(n) === 0)) return;
          var gb = (sh.network && sh.network.country && sh.network.country.code === 'GB') ||
                   (sh.webChannel && sh.webChannel.country && sh.webChannel.country.code === 'GB');
          if (!best || (gb && !best.gb)) best = { id: sh.id, gb: gb };
        });
        if (!best) return null;
        return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + best.id + '/episodes'); }).then(function (eps) {
          var map = {};
          (eps || []).forEach(function (e) {
            if (e.season && e.number && e.name) map[e.season + ':' + e.number] = [e.name, e.airdate ? +String(e.airdate).slice(0, 4) : 0];
          });
          return map;
        });
      }).then(function (map) { store.set(key, { t: Date.now(), eps: map }); return map; },
              function () { return undefined; });   // network trouble: try again next time, cache nothing
    });
    tvmChain = job.then(function () { return wait(500); }, function () { return wait(500); });
    return job;
  }

  /** Swap file-name episode titles for the real ones: "Lovejoy S04E12 Dainty Dish". Only when show and number match. */
  function enrichNames(ch, progs) {
    var byShow = {};
    progs.forEach(function (p) {
      var m = /^(.*?)\s+S(\d{1,2})E(\d{1,3})(?:\s+(.*))?$/.exec(p.title || '');
      if (!m || p.tvDone) return;
      var show = m[1].replace(/[\s\-–:]+$/, '').trim();
      if (!show) return;
      var k = normShow(show);
      (byShow[k] = byShow[k] || { show: show, items: [] }).items.push({ p: p, s: +m[2], e: +m[3], rest: m[4] || '' });
    });
    var keys = Object.keys(byShow);
    var changed = false;
    return keys.reduce(function (chain, k) {
      return chain.then(function () {
        return tvmEpisodes(byShow[k].show).then(function (map) {
          if (!map) return;
          byShow[k].items.forEach(function (it) {
            var hit = map[it.s + ':' + it.e];
            if (!hit || GENERIC_EP.test(hit[0].trim())) return;
            var y = /(\d{4})$/.exec(it.p.sub || '');
            if (y && hit[1] && Math.abs(+y[1] - hit[1]) > 3) return;      // dates disagree: numbering does not line up
            var code = 'S' + (it.s < 10 ? '0' : '') + it.s + 'E' + (it.e < 10 ? '0' : '') + it.e;
            var t = byShow[k].show + ' ' + code + ' ' + hit[0];
            if (t !== it.p.title) { it.p.title = t; changed = true; }
            it.p.tvDone = true;
          });
        });
      });
    }, Promise.resolve()).then(function () {
      if (changed && guideOpen) renderGuide();
      return changed;
    });
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
    closeOsd();
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
      nb = E.stepBlock(sched, fb, -1);
      // land a second inside the block: sitting exactly on the boundary can round into the neighbour
      gFocus = Math.max(nb.startMs + 1000, now);
      if (nb.startMs < gWin) gWin = Math.max(floorHalf(now), floorHalf(nb.startMs));
    } else {
      nb = E.stepBlock(sched, fb, 1);
      gFocus = Math.min(nb.startMs + 1000, nb.endMs - 1);
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

  function showReport() {
    var c = gChan;
    if (!c) return;
    var r = c.report || [];
    var fb = c.status === 'ready' ? E.blockAt(c.sched, gFocus) : null;
    var file = fb && fb.prog && fb.prog.url ? ' | File: ' + decodeURIComponent(fb.prog.url.replace('https://archive.org/download/', '')) : '';
    toast(c.name + ': ' + (r.length ? 'not playing - ' + r.join('; ') : 'all sources loaded') + file, 12000);
  }

  // ------------------------------------------------------------------ OSD bar (OK while watching)

  var AR = [
    { id: 'auto', label: 'Auto' }, { id: '43', label: '4:3' }, { id: '169', label: '16:9' },
    { id: 'zoom', label: 'Zoom' }, { id: 'stretch', label: 'Stretch' }
  ];
  var arIdx = 0;
  var OB = ['guide', 'rew', 'pp', 'ff', 'ar', 'fx'];   // buttons on the bar, left to right
  var osdOpen = false, osdSel = 2, osdTimer = null, osdTick = null;
  (function () {
    var saved = store.get('ar');
    for (var i = 0; i < AR.length; i++) if (AR[i].id === saved) arIdx = i;
  })();

  function applyAr() {
    AR.forEach(function (a) { document.body.classList.remove('ar-' + a.id); });
    document.body.classList.add('ar-' + AR[arIdx].id);
    store.set('ar', AR[arIdx].id);
  }

  // ---- picture looks: CSS only (filters on the video, plus an overlay for CRT)
  var FXMODES = ['off', 'crt', 'vivid', 'sharp'];
  var FXLABEL = { off: 'Off', crt: 'CRT', vivid: 'Vivid', sharp: 'Sharp' };
  var fxMode = 'off';
  var fxWatch = null;
  (function () {
    var saved = store.get('fx2');
    if (FXMODES.indexOf(saved) >= 0) fxMode = saved;
  })();

  function applyFx() {
    FXMODES.forEach(function (m) { document.body.classList.remove('fx-' + m); });
    document.body.classList.add('fx-' + fxMode);
    store.set('fx2', fxMode);
    clearTimeout(fxWatch);
    if (fxMode === 'sharp' || fxMode === 'crt') {
      // if the TV cannot keep up (many dropped frames), back off to the cheap look
      var q0 = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
      var started = fxMode;
      fxWatch = setTimeout(function () {
        if (fxMode !== started || !q0 || v.paused) return;
        var q1 = v.getVideoPlaybackQuality();
        var total = q1.totalVideoFrames - q0.totalVideoFrames, dropped = q1.droppedVideoFrames - q0.droppedVideoFrames;
        if (total > 60 && dropped / total > 0.3) {
          fxMode = 'vivid';
          applyFx();
          toast(FXLABEL[started] + ' is too heavy for this TV: switched to Vivid', 4000);
          if (osdOpen) renderOsd();
        }
      }, 7000);
    }
  }

  function changeFx(d) {
    fxMode = FXMODES[(FXMODES.indexOf(fxMode) + d + FXMODES.length) % FXMODES.length];
    applyFx();
    renderOsd();
  }

  function fmtPos(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.floor(t % 60);
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function renderOsd() {
    if (!cur) return;
    var sched = cur.ch.sched;
    var next = sched.order[(cur.index + 1) % sched.order.length];
    $('onum').textContent = cur.ch.n;
    $('ochan').textContent = cur.ch.name;
    $('otitle').textContent = cur.prog.title;
    $('osub').textContent = cur.prog.sub || '';
    $('onext').textContent = '';
    if (next) {
      $('onext').appendChild(document.createTextNode('Next'));
      var nb = document.createElement('b');
      nb.textContent = next.title;
      $('onext').appendChild(nb);
    }
    var dur = v.duration, pos = v.currentTime;
    $('obar').style.width = (isFinite(dur) && dur > 0 ? Math.min(100, pos / dur * 100) : 0) + '%';
    $('otime').textContent = fmtPos(pos) + (isFinite(dur) && dur > 0 ? ' / ' + fmtPos(dur) : '');
    $('olbl-pp').textContent = v.paused ? 'Play' : 'Pause';
    $('oic-pp').textContent = v.paused ? '▶' : '❚❚';
    $('olbl-ar').textContent = 'Picture: ' + AR[arIdx].label;
    $('olbl-fx').textContent = 'Enhance: ' + FXLABEL[fxMode];
    OB.forEach(function (id, i) { $('ob-' + id).className = 'ob' + (i === osdSel ? ' sel' : ''); });
  }

  function osdTouch() {
    clearTimeout(osdTimer);
    osdTimer = setTimeout(function () { if (v.paused) osdTouch(); else closeOsd(); }, 8000);
  }

  function openOsd() {
    if (!cur) { openGuide(); return; }
    osdOpen = true;
    osdSel = OB.indexOf('pp');      // start on play/pause
    clearTimeout(bannerTimer);
    $('banner').className = 'off';
    renderOsd();
    $('osd').className = '';
    clearInterval(osdTick);
    osdTick = setInterval(renderOsd, 500);
    osdTouch();
  }

  function closeOsd() {
    osdOpen = false;
    clearTimeout(osdTimer);
    clearInterval(osdTick);
    $('osd').className = 'off';
  }

  function changeAr(d) {
    arIdx = (arIdx + d + AR.length) % AR.length;
    applyAr();
    renderOsd();
  }

  function togglePlay() {
    if (v.paused) { v.play(); toast('Play', 1000); } else { v.pause(); toast('Paused', 1500); }
    setTimeout(renderOsd, 60);
  }

  applyAr();
  applyFx();

  function osdAct(id) {
    if (id === 'rew') seek(-30);
    else if (id === 'ff') seek(30);
    else if (id === 'pp') togglePlay();
    else if (id === 'ar') changeAr(1);
    else if (id === 'fx') changeFx(1);
    else if (id === 'guide') { closeOsd(); openGuide(); }
    renderOsd();
  }

  function osdKey(k) {
    osdTouch();
    if (k === 'ArrowLeft') { osdSel = Math.max(0, osdSel - 1); renderOsd(); }
    else if (k === 'ArrowRight') { osdSel = Math.min(OB.length - 1, osdSel + 1); renderOsd(); }
    else if (k === 'Enter') osdAct(OB[osdSel]);
    else if (k === 'MediaRewind') osdAct('rew');
    else if (k === 'MediaFastForward') osdAct('ff');
    else if (k === 'MediaPlayPause' || k === ' ') osdAct('pp');
    else if (k === 'MediaPlay') { v.play(); setTimeout(renderOsd, 60); }
    else if (k === 'MediaPause') { v.pause(); setTimeout(renderOsd, 60); }
    else if (k === 'Guide' || k === 'Red') { closeOsd(); openGuide(); }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') closeOsd();
    else if (k === 'ArrowUp' || k === 'ChannelUp') { closeOsd(); surf(1); }
    else if (k === 'ArrowDown' || k === 'ChannelDown') { closeOsd(); surf(-1); }
    else if (k >= '0' && k <= '9' && k.length === 1) { closeOsd(); onDigit(k); }
    else return false;
    return true;
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
      else if (k === 'Info') showReport();
      else handled = false;
    } else if (osdOpen) {
      handled = osdKey(k);
    } else if (k >= '0' && k <= '9' && k.length === 1) {
      onDigit(k);
    } else if (k === 'ArrowUp' || k === 'ChannelUp') { surf(1); }
    else if (k === 'ArrowDown' || k === 'ChannelDown') { surf(-1); }
    else if (k === 'Guide' || k === 'Red') { openGuide(); }
    else if (k === 'Enter') { openOsd(); }
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
          enrichNames(c, progs).then(null, function () { /* names stay as they are */ });
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
