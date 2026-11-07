(function () {
  'use strict';

  var E = window.Engine;
  var DAY = 24 * 60 * 60 * 1000;
  var PLAN_TTL = 7 * DAY;   // the channel lineups (the 'EPG plan') are kept for a week, so the app starts instantly
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

  // Compact storage for a channel's programme list (a few thousand entries per channel adds up)
  var DL = 'https://archive.org/download/';
  function packPlan(progs) {
    return progs.map(function (p) {
      var u = p.url || '';
      return { i: p.id, u: u.indexOf(DL) === 0 ? u.slice(DL.length) : u, t: p.title, s: p.sub || '', d: p.dur };
    });
  }
  function unpackPlan(rows) {
    return rows.map(function (r) {
      return { id: r.i, item: String(r.i).split('/')[0], url: /^https?:/.test(r.u) ? r.u : DL + r.u, title: r.t, sub: r.s, dur: r.d };
    });
  }
  function savePlan(ch) {
    if (!ch.cacheKey || !ch.plan) return;
    store.set(ch.cacheKey, { t: ch.cacheT || Date.now(), p: packPlan(ch.plan), r: ch.report || [] });
  }

  function loadPrograms(ch) {
    var key = 'plan7:' + ch.id + ':' + E.hash(JSON.stringify(ch.sources) + (ch.perItem || '') + '|v1');
    ch.cacheKey = key;
    var cached = store.get(key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < PLAN_TTL) {
      ch.report = cached.r || [];
      ch.cacheT = cached.t;
      ch.plan = unpackPlan(cached.p);
      return Promise.resolve(ch.plan);
    }
    var ids = [];
    var optsFor = {};
    var chain = Promise.resolve();
    ch.sources.forEach(function (s) {
      var skip = s.exclude ? new RegExp(s.exclude, 'i') : null;
      if (s.item) {
        ids.push(s.item);
        optsFor[s.item] = { include: s.include, exclude: s.exclude, minDur: s.minDur, maxDur: s.maxDur, perItem: s.perItem, title: s.title };
      } else if (s.search) {
        chain = chain.then(function () {
          return getJSON(searchUrl(s.search, s.rows || 25)).then(function (j) {
            ((j.response && j.response.docs) || []).forEach(function (d) {
              if (skip && skip.test((d.title || '') + ' ' + d.identifier)) return; // unwanted result
              ids.push(d.identifier);
              optsFor[d.identifier] = { exclude: s.exclude, minDur: s.minDur, maxDur: s.maxDur, perItem: s.perItem, title: s.title };
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
          var fixed = optsFor[uniq[i]] && optsFor[uniq[i]].title;
          if (fixed) got.forEach(function (g) { g.title = fixed; g.sub = ''; });   // channels listing known titles
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
        if (progs.length) {
          // forget older cached lists for this channel (earlier versions of the sources, or the old cache format)
          try {
            for (var k = localStorage.length - 1; k >= 0; k--) {
              var kn = localStorage.key(k);
              if (kn && kn !== key && (kn.indexOf('plan7:' + ch.id + ':') === 0 || kn.indexOf('lib2:' + ch.id + ':') === 0)) localStorage.removeItem(kn);
            }
          } catch (e) { /* ignore */ }
          ch.cacheT = Date.now();
          ch.plan = progs;
          savePlan(ch);
        }
        return progs;
      });
    });
  }

  // ------------------------------------------------------------------ channels

  var channels = window.CHANNELS.map(function (c) {
    return { n: c.n, id: c.id, name: c.name, sources: c.sources, maxItems: c.maxItems, perItem: c.perItem, adBreak: c.adBreak, report: [], status: 'loading', sched: null };
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
    var key = 'tvm3:' + normShow(name);
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
          var map = {}, abs = 0;
          (eps || []).forEach(function (e) {
            if (!(e.season && e.number && e.name)) return;
            var hit = [e.name, e.airdate ? +String(e.airdate).slice(0, 4) : 0, e.season, e.number];
            map[e.season + ':' + e.number] = hit;
            if (!e.type || e.type === 'regular') map['a:' + (++abs)] = hit;   // n-th episode overall, for "S05D028"-style names
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
      var m = /^(.*?)\s+S(\d{1,2})([ED])(\d{1,3})(?:\s+(.*))?$/.exec(p.title || '');
      if (!m || p.tvDone) return;
      var show = m[1].replace(/[\s\-–:]+$/, '').trim();
      if (!show) return;
      var k = normShow(show);
      (byShow[k] = byShow[k] || { show: show, items: [] }).items.push({ p: p, s: +m[2], e: +m[4], disc: m[3] === 'D', rest: m[5] || '' });
    });
    var keys = Object.keys(byShow);
    var changed = false;
    return keys.reduce(function (chain, k) {
      return chain.then(function () {
        return tvmEpisodes(byShow[k].show).then(function (map) {
          if (!map) return;
          byShow[k].items.forEach(function (it) {
            var hit = it.disc ? map['a:' + it.e] : map[it.s + ':' + it.e];
            if (hit && it.disc && hit[2] !== it.s) hit = null;                 // overall number must fall in that series
            if (!hit || GENERIC_EP.test(hit[0].trim())) {
              if (it.disc) it.p.title = it.p.title.replace(/\bS(\d{1,2})D(\d{1,3})\b/, 'S$1E$2');   // disc number shown as episode
              return;
            }
            var y = /(\d{4})$/.exec(it.p.sub || '');
            if (y && hit[1] && Math.abs(+y[1] - hit[1]) > 3) return;      // dates disagree: numbering does not line up
            var sn = it.disc ? hit[2] : it.s, en = it.disc ? hit[3] : it.e;
            var code = 'S' + (sn < 10 ? '0' : '') + sn + 'E' + (en < 10 ? '0' : '') + en;
            var t = byShow[k].show + ' ' + code + ' ' + hit[0];
            if (t !== it.p.title) { it.p.title = t; changed = true; }
            it.p.tvDone = true;
          });
        });
      });
    }, Promise.resolve()).then(function () {
      if (changed) savePlan(ch);                 // next start already has the real episode names
      if (changed && guideOpen) renderGuide();
      return changed;
    });
  }


  // ------------------------------------------------------------------ programme info (TVmaze: summary, poster, fanart)

  var infoOpen = false, infoToken = 0;

  function plain(html) {
    if (!html) return '';
    var d = new DOMParser().parseFromString(String(html), 'text/html');
    return (d.body.textContent || '').trim();
  }
  function https(u) { return u ? String(u).replace(/^http:/, 'https:') : ''; }

  /** "Bread S01E05" -> {show:"Bread", s:1, e:5}; "Wheel of Fortune" -> {show:"Wheel of Fortune"} */
  function parseTitle(title) {
    var t = String(title || '').trim();
    var m = /^(.*?)\s+S(\d{1,2})[ED](\d{1,3})\b/.exec(t);
    if (m) return { show: m[1].replace(/[\s\-\u2013:]+$/, ''), s: +m[2], e: +m[3] };
    t = t.replace(/\s*\(.*$/, '').replace(/\s+(Series|Season)\s+\d+.*$/i, '').replace(/\s+[-\u2013]\s+.*$/, '');
    return { show: t.trim() };
  }

  function tvmFindShow(name) {
    return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name)).then(function (list) {
      var want = normShow(name), best = null;
      (list || []).forEach(function (r) {
        var sh = r.show || {}, n = normShow(sh.name || '');
        if (!n || !(n === want || n.indexOf(want) === 0 || want.indexOf(n) === 0)) return;
        var gb = (sh.network && sh.network.country && sh.network.country.code === 'GB') ||
                 (sh.webChannel && sh.webChannel.country && sh.webChannel.country.code === 'GB');
        if (!best || (gb && !best.gb)) best = { show: sh, gb: gb };
      });
      return best && best.show;
    });
  }

  function tvmInfo(p) {
    var key = 'info1:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0);
    var c = store.get(key);
    if (c && Date.now() - c.t < TVM_DAY) return Promise.resolve(c.d);
    var words = p.show.split(/\s+/), tries = [p.show];
    if (words.length > 3) tries.push(words.slice(0, 3).join(' '));
    if (words.length > 2) tries.push(words.slice(0, 2).join(' '));
    var job = tvmChain.then(function () {
      var i = 0;
      function next() {
        if (i >= tries.length) return null;
        return tvmFindShow(tries[i++]).then(function (sh) { return sh || wait(500).then(next); });
      }
      return next();
    }).then(function (sh) {
      if (!sh) return null;
      var d = { show: {
        name: sh.name, year: sh.premiered ? String(sh.premiered).slice(0, 4) : '', ended: sh.ended ? String(sh.ended).slice(0, 4) : '',
        network: (sh.network && sh.network.name) || (sh.webChannel && sh.webChannel.name) || '',
        genres: (sh.genres || []).slice(0, 3).join(', '), rating: sh.rating && sh.rating.average || 0,
        summary: plain(sh.summary), poster: https(sh.image && (sh.image.original || sh.image.medium)), background: ''
      }, ep: null };
      return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/images'); }).then(function (imgs) {
        var bg = (imgs || []).filter(function (x) { return x.type === 'background'; })[0];
        if (bg && bg.resolutions && bg.resolutions.original) d.show.background = https(bg.resolutions.original.url);
        if (!d.show.poster) { var pp = (imgs || []).filter(function (x) { return x.type === 'poster'; })[0]; if (pp) d.show.poster = https(pp.resolutions.original.url); }
      }, function () { /* no extra pictures */ }).then(function () {
        if (!p.e) return d;
        return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/episodes'); }).then(function (eps) {
          var hit = (eps || []).filter(function (e) { return e.season === p.s && e.number === p.e; })[0];
          if (hit) d.ep = { name: hit.name, season: hit.season, number: hit.number, airdate: hit.airdate || '', runtime: hit.runtime || 0, summary: plain(hit.summary), image: https(hit.image && (hit.image.original || hit.image.medium)) };
          return d;
        }, function () { return d; });
      });
    });
    tvmChain = job.then(function () { return wait(400); }, function () { return wait(400); });
    return job.then(function (d) { if (d) store.set(key, { t: Date.now(), d: d }); return d; });
  }

  function openInfo() {
    if (!cur) return;
    infoOpen = true;
    var token = ++infoToken;
    var title = cur.prog.title || '';
    $('info').className = '';
    $('ibg').style.backgroundImage = 'none';
    $('iposter').className = 'hidden';
    $('ishow').textContent = title;
    $('iep').textContent = '';
    $('imeta').textContent = cur.ch.name;
    $('isum').textContent = '';
    $('isrc').textContent = 'Looking up details…   (Back to close)';
    if (cur.ad) { $('isum').textContent = 'An advert between programmes: ' + decodeURIComponent(String(cur.prog.url || '').replace('https://archive.org/download/', '')); $('isrc').textContent = 'Back to close'; return; }
    var p = parseTitle(title);
    if (!p.show) { $('isrc').textContent = 'Back to close'; return; }
    tvmInfo(p).then(function (d) {
      if (token !== infoToken || !infoOpen) return;
      if (!d) {
        $('isum').textContent = 'No online details found for this one.';
        $('isrc').textContent = 'Back to close';
        return;
      }
      var s = d.show, e = d.ep;
      $('ishow').textContent = s.name;
      var bits = [];
      if (s.year) bits.push(s.year + (s.ended && s.ended !== s.year ? '\u2013' + s.ended : ''));
      if (s.network) bits.push(s.network);
      if (s.genres) bits.push(s.genres);
      if (s.rating) bits.push('\u2605 ' + s.rating);
      $('imeta').textContent = bits.join('   \u00b7   ');
      var parts = [];
      if (e) {
        $('iep').textContent = 'S' + e.season + 'E' + e.number + '  ' + e.name + (e.airdate ? '   (' + e.airdate.split('-').reverse().join('/') + ')' : '');
        if (e.summary) parts.push(e.summary);
      }
      if (!parts.length && s.summary) parts.push(s.summary);
      else if (e && s.summary && parts.join('').length < 160) parts.push(s.summary);
      var box = $('isum');
      box.textContent = '';
      parts.forEach(function (t) { var el = document.createElement('p'); el.textContent = t; box.appendChild(el); });
      var pic = (e && e.image) || s.poster;
      var ph = $('iposter');
      if (s.poster) { ph.src = s.poster; ph.className = ''; }
      if (s.background || pic) $('ibg').style.backgroundImage = 'url("' + (s.background || pic) + '")';
      $('isrc').textContent = 'Details from TVmaze   \u00b7   Back to close';
    }, function () {
      if (token !== infoToken || !infoOpen) return;
      $('isum').textContent = 'Could not look this up right now.';
      $('isrc').textContent = 'Back to close';
    });
  }

  function closeInfo() {
    infoOpen = false;
    infoToken++;
    $('info').className = 'hidden';
  }

  // ------------------------------------------------------------------ tuning static

  var staticEl = $('static');
  var sctx = staticEl.getContext('2d');
  var SW = 256, SH = 144;
  var sImage = sctx.createImageData(SW, SH);
  var sTimer = null, sToken = 0, sSince = 0, sOn = false;
  var audioCtx = null, noiseNode = null, noiseGain = null;
  var MIN_STATIC_MS = 1500;

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
    var tok = sToken;
    setTimeout(function () { if (tok === sToken && sOn) hideStatic(); }, 2000);   // never longer than about 2 seconds
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

  function playSlot(ch, index, offset, announce, tuning) {
    var prog = ch.sched.order[index];
    cur = { ch: ch, index: index, prog: prog, errors: cur && cur.ch === ch ? cur.errors : 0 };
    v.dataset.offset = String(offset || 0);
    v.src = prog.url;
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked or interrupted; error handler covers failures */ });
    store.set('last', ch.id);
    if (tuning) showStatic();   // static only when changing channel, not between episodes or ads
    if (announce) showBanner();
    loadAds(ch);
  }

  function tune(ch, announce, quiet) {
    var slot = E.at(ch.sched, Date.now());
    if (!slot) return;
    cur = null;
    playSlot(ch, slot.index, slot.offsetSec, announce !== false, !quiet);
  }

  // ---- ad breaks: after a show ends on a channel with adBreak, play a few random adverts, then carry on
  var adPools = {};
  function loadAds(ch) {
    var ab = ch.adBreak;
    if (!ab || adPools[ch.id]) return;
    adPools[ch.id] = [];
    loadPrograms({ id: ch.id + '-ads', maxItems: ab.rows || 40, report: [],
      sources: [{ search: ab.search, rows: ab.rows || 40, maxDur: ab.maxDur, perItem: 1 }] })
      .then(function (p) { adPools[ch.id] = p || []; }, function () { adPools[ch.id] = []; });
  }
  function playAd(ch, index, left) {
    var pool = adPools[ch.id];
    var ad = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && cur && cur.ad && cur.prog.url === ad.url) ad = pool[(pool.indexOf(ad) + 1) % pool.length];   // no immediate repeat
    cur = { ch: ch, index: index, prog: { title: 'Advert', sub: ad.title, url: ad.url }, ad: true, adLeft: left - 1, errors: 0 };
    v.dataset.offset = '0';
    v.src = ad.url;
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* error handler covers failures */ });
    // an advert that has not really started after a few seconds (stalled load) is skipped instead of sitting on one frame
    var me = cur;
    setTimeout(function () {
      if (cur !== me || !cur.ad) return;
      if (v.currentTime < 0.5) onEnded();
    }, 5000);
  }
  function onEnded() {
    if (cur && cur.ad && cur.adLeft > 0) return playAd(cur.ch, cur.index, cur.adLeft);
    if (cur && !cur.ad && cur.ch.adBreak && adPools[cur.ch.id] && adPools[cur.ch.id].length) {
      return playAd(cur.ch, cur.index, cur.ch.adBreak.count || 2);
    }
    nextInChannel();
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
  var spinTimer = null;
  function spinOn() { clearTimeout(spinTimer); spinTimer = setTimeout(function () { $('spin').className = ''; }, 700); }
  function spinOff() { clearTimeout(spinTimer); $('spin').className = 'hidden'; }
  v.addEventListener('waiting', function () { if (!v.paused) spinOn(); });
  v.addEventListener('seeking', spinOn);
  v.addEventListener('loadstart', spinOn);
  v.addEventListener('seeked', spinOff);
  v.addEventListener('timeupdate', function () { if (!v.paused && v.currentTime > 0) spinOff(); });
  v.addEventListener('playing', function () {
    spinOff();
    hideStatic();
    if (cur) cur.errors = 0;
  });
  v.addEventListener('ended', onEnded);
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
    var now = Date.now();
    var b = E.blockAt(c.sched, gFocus);
    closeGuide();
    if (b && !(b.startMs <= now && now < b.endMs)) {
      // any other programme in the guide: play it from the start, whatever the time; the channel carries on from there
      playSlot(c, c.sched.groups[b.gi].first, 0, true, !(cur && cur.ch === c));
      return;
    }
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
  var OB = ['guide', 'rew', 'pp', 'ff', 'restart', 'ar', 'fx', 'info'];   // buttons on the bar, left to right
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
  var FXMODES = ['off', 'vhs', 'vivid', 'sharp'];
  var FXLABEL = { off: 'Off', vhs: 'VHS', vivid: 'Vivid', sharp: 'Sharp' };
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
    if (fxMode === 'sharp') {
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

  function restartShow() {
    closeOsd();
    try { v.currentTime = 0; } catch (e) { /* not seekable */ }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* ignore */ });
    toast('Starting again from the beginning', 2000);
  }

  function osdAct(id) {
    if (id === 'rew') seek(-30);
    else if (id === 'ff') seek(30);
    else if (id === 'pp') togglePlay();
    else if (id === 'restart') { restartShow(); return; }
    else if (id === 'ar') changeAr(1);
    else if (id === 'fx') changeFx(1);
    else if (id === 'guide') { closeOsd(); openGuide(); }
    else if (id === 'info') { closeOsd(); openInfo(); return; }
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

    if (infoOpen) {                       // info panel: any of these closes it, everything else is ignored
      if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Enter' || k === ' ' || k === 'Info') closeInfo();
      e.preventDefault();
      return;
    }

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
    else if (k === 'Info') { openInfo(); }
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
    tune(pick, false, true);   // start on the last channel (its picture shows in the guide's window) ...
    openGuide();               // ... but land in the TV guide
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
