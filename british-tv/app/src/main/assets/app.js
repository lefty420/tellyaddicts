(function () {
  'use strict';

  var E = window.Engine;
  var DAY = 24 * 60 * 60 * 1000;
  // How long a channel's lineup (and the links in it) is kept before it is built again from archive.org. Chosen in
  // Options; it is also how often the running order changes, because the guide is worked out from the stored list.
  var KEEP = [
    { id: '1d', label: '24 hours', ms: DAY },
    { id: '2d', label: '48 hours', ms: 2 * DAY },
    { id: '1w', label: '1 week', ms: 7 * DAY },
    { id: '4w', label: '4 weeks', ms: 28 * DAY }
  ];
  function keepIndex(id) { for (var i = 0; i < KEEP.length; i++) if (KEEP[i].id === id) return i; return 2; }
  function planTtl() { return KEEP[keepIdx].ms; }
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
      var r = { i: p.id, u: u.indexOf(DL) === 0 ? u.slice(DL.length) : u, t: p.title, s: p.sub || '', d: p.dur };
      if (p.group && p.group.indexOf('-') > 0) r.g = p.group;   // advert tier (uk/g), kept so UK adverts stay preferred
      return r;
    });
  }
  function unpackPlan(rows) {
    return rows.map(function (r) {
      return { id: r.i, item: String(r.i).split('/')[0], url: E.canonicalUrl(/^https?:/.test(r.u) ? r.u : DL + r.u) || (/^https?:/.test(r.u) ? r.u : DL + r.u), title: r.t, sub: r.s, dur: r.d, group: r.g };
    });
  }
  var keepIdx = keepIndex((store.get('keep1') || '1w'));
  function savePlan(ch) {
    if (!ch.cacheKey || !ch.plan) return;
    store.set(ch.cacheKey, { t: ch.cacheT || Date.now(), p: packPlan(ch.plan), r: ch.report || [] });
  }

  /** Keep the groups in the wanted shares of screen time (by duration), e.g. {totp: .6, chart: .4}. */
  function balanceMix(progs, mix) {
    var groups = Object.keys(mix), by = {}, tot = {}, D = Infinity;
    groups.forEach(function (g) { by[g] = []; tot[g] = 0; });
    var rest = [];
    progs.forEach(function (p) { if (by[p.group]) { by[p.group].push(p); tot[p.group] += p.dur || 0; } else rest.push(p); });
    groups.forEach(function (g) { if (tot[g] > 0) D = Math.min(D, tot[g] / mix[g]); });
    if (!isFinite(D)) return progs;                         // a group is empty: leave things as they are
    var out = rest;
    groups.forEach(function (g) {
      var keep = Math.max(1, Math.round(by[g].length * (mix[g] * D) / tot[g]));
      out = out.concat(E.sample(by[g], keep));
    });
    return out;
  }

  // experimental Auto EPG (OSD toggle): programmes come from keyword searches instead of channels.js, and are re-picked daily
  var autoEpg = store.get('autoepg') === 'on';
  var AUTO_MIN = 8;   // fewer programmes than this from Auto EPG and the channel is topped up from its normal sources

  /** The same programme often sits in several uploads: keep one of each title. */
  function dedupeTitles(progs) {
    var seen = {};
    return progs.filter(function (p) {
      var k = String(p.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!k || seen[k]) return false;
      return (seen[k] = true);
    });
  }

  // ---- Auto EPG ready-made lists -------------------------------------------------------------------------------
  // Published by the scraper (tools/import_scrape.py --publish) as one small file per channel, so a new scrape
  // reaches the TV without a new APK and a channel only downloads its own list. data/index.json names a revision
  // per channel; that revision goes into the cache key, so pushing a scrape refreshes just the channels that
  // changed. If the published list cannot be reached, the copy built into the app (autodata.js) is used instead,
  // and failing that the channel falls back to its live searches.
  var DATA_BASE = 'https://raw.githubusercontent.com/lefty420/tellyaddicts/main/british-tv/data/';
  var autoDataP = null, indexP = null;

  /** The bundled autodata.js, loaded once and only when it is actually needed. */
  function loadAutoData() {
    if (window.AUTODATA) return Promise.resolve(window.AUTODATA);
    if (autoDataP) return autoDataP;
    autoDataP = new Promise(function (res) {
      var sc = document.createElement('script');
      sc.src = 'autodata.js';
      sc.onload = function () { res(window.AUTODATA || {}); };
      sc.onerror = function () { res({}); };
      document.head.appendChild(sc);
    });
    return autoDataP;
  }

  /** {channel: revision} for the published lists; {} when there are none or the fetch fails. */
  function loadDataIndex() {
    if (indexP) return indexP;
    indexP = getJSON(DATA_BASE + 'index.json').then(function (j) {
      return (j && j.channels) || {};
    }, function () { return {}; });
    return indexP;
  }

  /** One channel's published list, falling back to the bundled copy. */
  function loadChannelData(id, rev) {
    if (!rev) return loadAutoData().then(function (D) { return (D && D[id]) || null; });
    return getJSON(DATA_BASE + encodeURIComponent(id) + '.json').then(function (rows) {
      return rows && rows.length ? rows : null;
    }, function () {
      return loadAutoData().then(function (D) { return (D && D[id]) || null; });
    });
  }
  var AUTO_DUR = { 'The Bill': 1500 };      // typical running time (s) until the real length has been seen once
  function progsFromData(items) {
    var out = [];
    items.forEach(function (it) {
      var shows = {}, files = (it.f || []).map(function (f) {
        var name = typeof f === 'string' ? f : f[0];
        shows[name] = typeof f === 'string' ? (it.s || '') : f[1];
        return { name: name, size: '90000000' };                  // size/length are not in the scrape; real length is learned on first play
      });
      // the same naming rules as live results (episode codes, tidy titles, .ia.mp4 duplicates)
      E.pickPrograms(it.id, { metadata: { title: it.t }, files: files }, { requireEp: true, skipFile: AUTO && AUTO.NOT_EPISODE }).forEach(function (p) {
        var nm = p.id.slice(it.id.length + 1), show = shows[nm] || '';
        p.group = show;
        p.dur = AUTO_DUR[show] || 2700;
        out.push(p);
      });
    });
    return out;
  }
  /** No programme of one show should fill the channel (needs three or more shows to apply). */
  function capShows(progs, share) {
    var by = {}, n = 0;
    progs.forEach(function (p) { (by[p.group || ''] = by[p.group || ''] || []).push(p); });
    var keys = Object.keys(by);
    if (keys.length < 3) return progs;
    var cap = Math.max(25, Math.round(progs.length * share)), out = [];
    keys.forEach(function (k) { out = out.concat(by[k].length > cap ? E.sample(by[k], cap) : by[k]); });
    return out;
  }

  /** Auto EPG only: keep a programme off channels of another genre (a drama on CITV, a cartoon on the sitcom channel). */
  function genreFits(ch, p) { return !window.AUTO || AUTO.genreOk(ch.id, (p.group && p.group !== 'auto' ? p.group + ' ' : '') + (p.title || '') + ' ' + (p.sub || '') + ' ' + (p.id || '').split('/')[0].replace(/[-_]/g, ' ')); }

  function loadPrograms(ch, noAuto) {
    if (autoEpg && !noAuto && !ch.noCache && window.AUTO && AUTO.sourcesFor(ch.id)) {
      // Building a list from the scrape means running thousands of file names through the naming rules, so the
      // finished list is cached like any other: on the box that pass costs a second or two per channel. The
      // published revision is part of the key, so a newly scraped list is picked up straight away.
      return loadDataIndex().then(function (idx) {
        var rev = idx[ch.id] || '';
        var dkey = 'plan7d:' + ch.id + ':' + E.hash('v8|' + rev);
        ch.cacheKey = dkey;
        var dcached = store.get(dkey);
        if (dcached && dcached.p && dcached.p.length && Date.now() - dcached.t < planTtl()) {
          ch.autoUsed = true;
          ch.report = [];
          ch.cacheT = dcached.t;
          ch.plan = unpackPlan(dcached.p);
          return ch.plan;
        }
        return buildFromData(ch, noAuto, rev, dkey);
      });
    }
    return loadProgramsLive(ch, noAuto);
  }

  /** Turn a published (or bundled) channel list into this channel's programmes, and store the result. */
  function buildFromData(ch, noAuto, rev, dkey) {
    return loadChannelData(ch.id, rev).then(function (rows) {
      if (!rows || !rows.length) return loadProgramsLive(ch, noAuto);
      var progs = dedupeTitles(capShows(progsFromData(rows).filter(function (p) { return genreFits(ch, p); }), 0.25));
      ch.autoUsed = progs.length > 0;
      ch.report = [];
      ch.plan = E.sample(progs, MAX_STORED);
      if (ch.plan.length) {
        try {                                   // drop this channel's lists from earlier revisions
          for (var k = localStorage.length - 1; k >= 0; k--) {
            var kn = localStorage.key(k);
            if (kn && kn !== dkey && kn.indexOf('plan7d:' + ch.id + ':') === 0) localStorage.removeItem(kn);
          }
        } catch (e) { /* ignore */ }
        ch.cacheT = Date.now();
        savePlan(ch);
      }
      return ch.plan.length ? ch.plan : loadProgramsLive(ch, noAuto);
    });
  }

  function loadProgramsLive(ch, noAuto) {
    var auto = !noAuto && !ch.noCache && autoEpg && window.AUTO ? AUTO.sourcesFor(ch.id) : null;
    var sources = auto || ch.sources;
    ch.autoUsed = !!auto;
    var prefix = auto ? 'plan7a:' : 'plan7:';
    var key = prefix + ch.id + ':' + E.hash(JSON.stringify(sources) + (ch.perItem || '') + '|v7');   // bump when the naming/URL rules change so stored titles are rebuilt (how long it is kept is Options > Keep listings)
    ch.cacheKey = key;
    var cached = ch.noCache ? null : store.get(key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < planTtl()) {
      ch.report = cached.r || [];
      ch.cacheT = cached.t;
      ch.plan = unpackPlan(cached.p);
      return Promise.resolve(ch.plan);
    }
    var ids = [];
    var optsFor = {};
    var direct = [];                      // programmes from sources that already name their files
    var chain = Promise.resolve();
    sources.forEach(function (s) {
      var skip = s.exclude && !s.search ? null : (s.exclude ? new RegExp(s.exclude, 'i') : null);
      var skipTitle = s.skipTitle ? new RegExp(s.skipTitle, 'i') : null;
      if (s.files) {
        // A list of [url, title]: nothing to look up, so the channel is ready without a single request. The real
        // running time is not known until a clip has played once; until then each uses the source's dur.
        (s.files || []).forEach(function (f) {
          var url = E.canonicalUrl(f[0]) || f[0];
          if (!url || url.indexOf(DL) !== 0) return;
          var id = url.slice(DL.length).split('?')[0];
          direct.push({ id: decodeURIComponent(id), item: decodeURIComponent(id).split('/')[0], url: url,
                        title: f[1] || '', sub: '', dur: f[2] || s.dur || 150, group: s.group });
        });
        return;
      }
      if (s.item) {
        ids.push(s.item);
        optsFor[s.item] = { include: s.include, exclude: s.exclude, skipFile: s.skipFile, maxSize: s.maxSize, requireEp: s.requireEp, minDur: s.minDur, maxDur: s.maxDur, perItem: s.perItem, title: s.title, group: s.group };
      } else if (s.search) {
        chain = chain.then(function () {
          return getJSON(searchUrl(s.search, s.rows || 25)).then(function (j) {
            ((j.response && j.response.docs) || []).forEach(function (d) {
              if (skip && skip.test((d.title || '') + ' ' + d.identifier)) return; // unwanted result
              if (skipTitle && skipTitle.test((d.title || '') + ' ' + d.identifier)) return;
              ids.push(d.identifier);
              optsFor[d.identifier] = { exclude: s.exclude, skipFile: s.skipFile, maxSize: s.maxSize, requireEp: s.requireEp, minDur: s.minDur, maxDur: s.maxDur, perItem: s.perItem, title: s.title, group: s.group };
            });
          }, function () { /* a failed search just contributes nothing */ });
        });
      }
    });
    return chain.then(function () {
      var seen = {};
      var uniq = ids.filter(function (id) { return id && !seen[id] && (seen[id] = true); })
        .slice(0, auto ? 45 : (ch.maxItems || 40));
      return pool(uniq, ch.conc || 4, function (id) {
        var url = 'https://archive.org/metadata/' + encodeURIComponent(id);
        // one retry: a busy archive.org sometimes drops a request
        return getJSON(url).then(null, function () { return getJSON(url); });
      }).then(function (metas) {
        var progs = direct.slice();
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
          var grp = optsFor[uniq[i]] && optsFor[uniq[i]].group;
          if (grp) got.forEach(function (g) { g.group = grp; });
          Array.prototype.push.apply(progs, got);
        });
        ch.report = report;
        if (auto) progs = dedupeTitles(progs.filter(function (p) { return genreFits(ch, p); }));
        if (ch.mix) progs = balanceMix(progs, ch.mix);
        progs = E.sample(progs, MAX_STORED);
        if (progs.length && !ch.noCache) {
          // forget older cached lists for this channel (earlier versions of the sources, or the old cache format)
          try {
            for (var k = localStorage.length - 1; k >= 0; k--) {
              var kn = localStorage.key(k);
              if (kn && kn !== key && (kn.indexOf(prefix + ch.id + ':') === 0 || kn.indexOf('lib2:' + ch.id + ':') === 0)) localStorage.removeItem(kn);
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


  // ---- real running times, learned the first time each programme starts (the scrape has none), used for the guide afterwards
  var durMem = store.get('dur1') || {}, durTimer = null;
  function learnDur(id, secs) {
    if (!id || !isFinite(secs) || secs < 60 || secs > 14400) return;
    var r = Math.round(secs);
    if (durMem[id] === r) return;
    durMem[id] = r;
    clearTimeout(durTimer);
    durTimer = setTimeout(function () {
      var ks = Object.keys(durMem);
      if (ks.length > 4000) ks.slice(0, ks.length - 4000).forEach(function (k) { delete durMem[k]; });
      store.set('dur1', durMem);
    }, 5000);
  }

  // ---- files that take ages to start are remembered for two weeks and left out of the lineup
  var SLOW_MS = 15000, SLOW_MIN_TTL = 14 * DAY;
  /** A programme that would not play stays out of the listings at least as long as the listings themselves live. */
  function slowTtl() { return Math.max(SLOW_MIN_TTL, planTtl()); }
  var slow = store.get('slow1') || {};
  function isSlow(id) { return slow[id] && Date.now() - slow[id] < slowTtl(); }
  function markSlow(id) { if (!id) return; slow[id] = Date.now(); store.set('slow1', slow); }
  function dropSlow(progs) {
    var ok = progs.filter(function (p) { return !isSlow(p.id); });
    return ok.length >= 3 ? ok : progs;
  }

  // ------------------------------------------------------------------ channels

  var channels = window.CHANNELS.map(function (c) {
    return { n: c.n, id: c.id, name: c.name, sources: c.sources, maxItems: c.maxItems, perItem: c.perItem, mix: c.mix, report: [], status: 'loading', sched: null };
  });

  /** True once every channel has finished loading: optional extras (artwork, advert lists) wait for this so they never compete with start-up. */
  function quiet() { return channels.every(function (c) { return c.status !== 'loading'; }); }

  function ready() {
    return channels.filter(function (c) { return c.status === 'ready'; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  var statusSig = null;
  function renderStatus() {
    var lines = channels.map(function (c) {
      var mark = c.status === 'ready' ? '✓' : c.status === 'empty' ? '–' : '…';
      return mark + '  ' + c.n + '  ' + c.name +
        (c.status === 'ready' ? '  (' + Math.round(c.sched.total / 60) + ' min of programmes)' :
          c.status === 'empty' ? '  (nothing found)' : '');
    });
    var sig = lines.join('\n');
    if (sig !== statusSig) {        // only when a channel actually changed, not on every tick of the bars
      statusSig = sig;
      var box = $('chstatus');
      box.textContent = '';
      lines.forEach(function (text) {
        var line = document.createElement('div');
        line.textContent = text;
        box.appendChild(line);
      });
    }
    var on = Math.min(7, 1 + Math.floor(Date.now() / 400) % 7);
    var bars = $('bars').children;
    for (var i = 0; i < bars.length; i++) {
      var cn = i < on ? 'on' : '';
      if (bars[i].className !== cn) bars[i].className = cn;
    }
  }

  // ------------------------------------------------------------------ real episode names (TVmaze, free, no key)

  var TVM_DAY = 30 * 24 * 3600 * 1000;
  var tvmChain = Promise.resolve();
  var GENERIC_EP = /^(episode|ep|series|season|part|chapter)?\s*#?\d+(\s*[-:,]\s*\d+)?$|^episode\b|^series\b|^season\b/i;

  function normShow(s) {
    return String(s).toLowerCase().replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, '');
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /** Of the shows TVmaze returns for a name, the right one: matching name; British first; then the oldest (this is classic TV); a year in the title wins. */
  function pickShow(list, name, year) {
    var want = normShow(name), cands = [];
    (list || []).forEach(function (r) {
      var sh = r.show || {}, n = normShow(sh.name || '');
      if (!n || !(n === want || n.indexOf(want) === 0 || want.indexOf(n) === 0)) return;
      var gb = (sh.network && sh.network.country && sh.network.country.code === 'GB') ||
               (sh.webChannel && sh.webChannel.country && sh.webChannel.country.code === 'GB');
      cands.push({ sh: sh, gb: !!gb, exact: n === want, yr: sh.premiered ? +String(sh.premiered).slice(0, 4) : 9999 });
    });
    if (!cands.length) return null;
    cands.sort(function (x, y) {
      if (year) { var dx = Math.abs(x.yr - year), dy = Math.abs(y.yr - year); if (dx !== dy) return dx - dy; }
      if (x.exact !== y.exact) return x.exact ? -1 : 1;
      if (x.gb !== y.gb) return x.gb ? -1 : 1;
      return x.yr - y.yr;
    });
    return cands[0].sh;
  }

  /** {"4:12": ["Dainty Dish", 1992], ...} for a show, or null if TVmaze has no match. One request at a time (rate limit). */
  function tvmEpisodes(name) {
    var key = 'tvm4:' + normShow(name);
    var c = store.get(key);
    if (c && Date.now() - c.t < TVM_DAY) return Promise.resolve(c.eps);
    var job = tvmChain.then(function () {
      return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name)).then(function (list) {
        var best = pickShow(list, name);
        if (best) best = { id: best.id };
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
    var show, res = {};
    if (m) { show = m[1]; res.s = +m[2]; res.e = +m[3]; }
    else show = t.replace(/\s*\(.*$/, '').replace(/\s+(Series|Season)\s+\d+.*$/i, '').replace(/\s+[-\u2013]\s+.*$/, '');
    show = show.split(/\s+[-\u2013]\s+/).pop();                       // "Shows - Show S1E2" -> the part next to the code
    var y = /\b((?:19|20)\d\d)\b/.exec(show);
    if (y) { res.year = +y[1]; show = show.replace(/\s*\(?\b(?:19|20)\d\d\b\)?\s*/g, ' '); }
    res.show = show.replace(/[\s\-\u2013:]+$/, '').trim();
    return res;
  }

  function tvmFindShow(name, year) {
    return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name)).then(function (list) {
      return pickShow(list, name, year);
    });
  }

  function tvmInfo(p) {
    var key = 'info2:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0);
    var c = store.get(key);
    if (c && Date.now() - c.t < TVM_DAY) return Promise.resolve(c.d);
    var words = p.show.split(/\s+/), tries = [p.show];
    if (words.length > 3) tries.push(words.slice(0, 3).join(' '));
    if (words.length > 2) tries.push(words.slice(0, 2).join(' '));
    var job = tvmChain.then(function () {
      var i = 0;
      function next() {
        if (i >= tries.length) return null;
        return tvmFindShow(tries[i++], p.year).then(function (sh) { return sh || wait(500).then(next); });
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

  // fanart for the TV guide: just the show's backdrop (search + images), cached for a month
  function tvmArt(p) {
    var key = 'art1:' + normShow(p.show);
    var c = store.get(key);
    if (c && Date.now() - c.t < TVM_DAY) return Promise.resolve(c.d);
    var words = p.show.split(/\s+/), tries = [p.show];
    if (words.length > 3) tries.push(words.slice(0, 3).join(' '));
    if (words.length > 2) tries.push(words.slice(0, 2).join(' '));
    var job = tvmChain.then(function () {
      var i = 0;
      function next() {
        if (i >= tries.length) return null;
        return tvmFindShow(tries[i++], p.year).then(function (sh) { return sh || wait(500).then(next); });
      }
      return next();
    }).then(function (sh) {
      if (!sh) return { background: '' };
      return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/images'); }).then(function (imgs) {
        var bg = (imgs || []).filter(function (x) { return x.type === 'background'; })[0];
        return { background: bg && bg.resolutions && bg.resolutions.original ? https(bg.resolutions.original.url) : '' };
      }, function () { return { background: '' }; });
    });
    tvmChain = job.then(function () { return wait(400); }, function () { return wait(400); });
    return job.then(function (d) { store.set(key, { t: Date.now(), d: d }); return d; });
  }

  function guideArt(prog) {
    var el = $('gart');
    var title = gartOn && prog ? (prog.title || '') : '';
    if (title && !quiet()) return;
    if (title === gartFor) return;
    gartFor = title;
    clearTimeout(gartTimer);
    el.className = '';
    if (!title) return;
    gartTimer = setTimeout(function () {          // wait until the highlight stops moving before looking anything up
      var p = parseTitle(title);
      if (!p.show) return;
      tvmArt(p).then(function (a) {
        if (gartFor !== title || !a || !a.background) return;
        el.style.backgroundImage = 'url("' + a.background + '")';
        el.className = 'on';
      }, function () { /* no artwork */ });
    }, 1200);
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
    $('idbg').textContent = pbText();
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


  // ---- playback timing log (shown in the Info panel) so slow starts can be diagnosed
  var pb = { t0: 0, ev: [], url: '', offset: 0 };
  function pbStart(url, offset) { pb = { t0: Date.now(), ev: [], url: url, offset: offset || 0 }; }
  ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'seeked', 'error'].forEach(function (n) {
    v.addEventListener(n, function () {
      if (pb.ev.length < 14) pb.ev.push(n + ' ' + ((Date.now() - pb.t0) / 1000).toFixed(1) + 's');
    });
  });
  function pbText() {
    var o = pb.offset ? 'joined ' + fmtPos(pb.offset) + ' in   ' : 'from start   ';
    return (cur && cur.prog && isSlow(cur.prog.id) ? 'Slow to start: will be left out of the lineup next time.   ' : '') + 'Playback: ' + o + (pb.ev.join(' \u00b7 ') || 'no events yet') + '   (readyState ' + v.readyState + ')';
  }

  function playSlot(ch, index, offset, announce, tuning, progOverride) {
    var prog = progOverride || ch.sched.order[index];   // progOverride: Play Next plays an episode that is not in the schedule
    cur = { ch: ch, index: index, prog: prog, errors: cur && cur.ch === ch ? cur.errors : 0 };
    v.dataset.offset = String(offset || 0);
    pbStart(prog.url, offset);
    var meOne = cur;
    setTimeout(function () {
      if (cur === meOne && v.readyState < 1 && !meOne.ad) { markSlow(prog.id); nextInChannel(); }   // never even got the file header: move on
    }, 30000);
    setTimeout(function () {
      // header arrived but it still can't play 25 s in (slow index/seek on a mid-programme join): move on, and remember it
      if (cur === meOne && !meOne.ad && v.readyState < 3) { markSlow(prog.id); nextInChannel(); }
    }, 25000);
    v.src = prog.url;
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked or interrupted; error handler covers failures */ });
    store.set('last', ch.id);
    if (tuning) showStatic();   // static only when changing channel, not between episodes or ads
    if (announce) showBanner();
    loadAds(ch);
    setTimeout(function () { if (cur === meOne) osdArt(); }, 4000);   // have the artwork ready before the OSD is opened
  }

  function tune(ch, announce, quiet) {
    var slot = E.at(ch.sched, Date.now());
    if (!slot) return;
    cur = null;
    playSlot(ch, slot.index, slot.offsetSec, announce !== false, !quiet);
  }

  // ---- ad breaks (see ads.js): after a show, a short break of adverts that suit the channel and the era chosen in the OSD
  var adEra = (function () {
    var saved = store.get('adera');
    return ADS.ERAS.some(function (e) { return e.id === saved; }) ? saved : 'all';
  })();
  var adPools = {};                     // 'genre:era' -> filtered adverts (shared by every channel of that genre)
  var AD_TTL = 7 * 24 * 3600 * 1000;
  function adKey(ch) { var cat = ADS.categoryFor(ch.id); return cat && adEra !== 'off' ? cat + ':' + adEra : null; }
  function loadAds(ch, soon) {
    var key = adKey(ch);
    if (!key || adPools[key]) return;
    var cat = ADS.categoryFor(ch.id), era = adEra;
    var cached = store.get('ads2:' + key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < AD_TTL) { adPools[key] = unpackPlan(cached.p); return; }
    adPools[key] = [];                  // being fetched (or nothing found): breaks are skipped, and it is not retried until the next launch
    // wait a little so the lookups don't compete with the programme that is still starting up
    setTimeout(function fetchAds() {
      if (!quiet()) { setTimeout(fetchAds, 5000); return; }   // never while the channels are still loading
      loadPrograms({ id: 'ads-' + cat + '-' + era, noCache: true, report: [], maxItems: 40, conc: 2, sources: ADS.sourcesFor(cat, era) })
        .then(function (p) {
          p = ADS.filterPool(p, era);
          adPools[key] = p;
          if (p.length) store.set('ads2:' + key, { t: Date.now(), p: packPlan(p) });
        }, function () { /* no adverts this time */ });
    }, soon ? 1500 : 20000);
  }
  function playAd(ch, index, left) {
    var key = adKey(ch), pool = key && adPools[key];
    if (!pool || !pool.length) return nextInChannel();
    var ad = ADS.pickNext(pool, cur && cur.ad ? cur.prog.url : null);
    cur = { ch: ch, index: index, prog: { title: 'Advert', sub: ad.title, url: ad.url }, ad: true, adLeft: left - 1, errors: 0 };
    v.dataset.offset = '0';
    pbStart(ad.url, 0);
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
    var key = cur && !cur.ad && adKey(cur.ch);
    if (key && adPools[key] && adPools[key].length) {
      return playAd(cur.ch, cur.index, ADS.CATS[ADS.categoryFor(cur.ch.id)].count);
    }
    nextInChannel();
  }

  // ---- Play Next: the next episode of what is playing. Local link database first, archive.org search second.
  var nextBusy = false, linksSeeded = false;

  /** Put the links of every loaded channel into the local database (once per launch, after start-up, in small chunks). */
  function seedLinks() {
    if (linksSeeded || !window.LINKS) return;
    linksSeeded = true;
    var rows = [];
    channels.forEach(function (c) { if (c.plan) rows = rows.concat(LINKS.rowsFrom(c.plan, 'plan')); });
    (function chunk(i) {
      if (i >= rows.length) return;
      LINKS.putAll(rows.slice(i, i + 400)).then(function () { setTimeout(function () { chunk(i + 400); }, 60); });
    })(0);
  }

  /** Fetch an item's file list, save every episode found in it to the database, and say whether wantKey was among them. */
  function saveItemEpisodes(id, wantKey) {
    return getJSON('https://archive.org/metadata/' + encodeURIComponent(id)).then(function (meta) {
      var rows = LINKS.rowsFrom(E.pickPrograms(id, meta, {}), 'search');   // pickPrograms builds clean https://archive.org/download/<id>/<file> links
      return LINKS.putAll(rows).then(function () { return rows.some(function (r) { return r.k === wantKey; }); });
    }, function () { return false; });
  }

  /** Step 2: the current item first (the next episode is usually in it), then items found by searching for the show. */
  function searchAndSave(ref, curItem, wantKey) {
    function runIds(ids, i) {
      if (i >= ids.length) return Promise.resolve(false);
      return saveItemEpisodes(ids[i], wantKey).then(function (found) { return found || runIds(ids, i + 1); });
    }
    return (curItem ? saveItemEpisodes(curItem, wantKey) : Promise.resolve(false)).then(function (found) {
      if (found) return true;
      // search by show name plus the episode number first, then by show name alone
      var name = ref.show.replace(/"/g, ''), n = wantKey.split(':'), ss = +n[1], ee = +n[2], pad = function (x) { return (x < 10 ? '0' : '') + x; };
      var withCode = 'title:("' + name + '") AND mediatype:movies AND (title:("S' + pad(ss) + 'E' + pad(ee) + '" OR "S' + ss + 'E' + ee + '" OR "' + ss + 'x' + pad(ee) + '" OR "Season ' + ss + ' Episode ' + ee + '" OR "Series ' + ss + ' Episode ' + ee + '"))';
      var nameOnly = 'title:("' + name + '") AND mediatype:movies';
      function idsFor(q) {
        return getJSON(searchUrl(q, 8)).then(function (j) {
          return ((j.response && j.response.docs) || []).map(function (d) { return d.identifier; }).filter(function (id) { return id && id !== curItem; });
        }, function () { return []; });
      }
      return idsFor(withCode).then(function (a) {
        return idsFor(nameOnly).then(function (b) {
          var seen = {}, ids = a.concat(b).filter(function (id) { return !seen[id] && (seen[id] = 1); }).slice(0, 6);
          return runIds(ids, 0);
        });
      });
    });
  }

  function resolveNext(prog) {
    var ref = LINKS.parseEp(prog.title);
    if (!ref) return Promise.resolve(null);
    var c = LINKS.nextRefs(ref), k1 = LINKS.key(c[0].show, c[0].s, c[0].e), k2 = LINKS.key(c[1].show, c[1].s, c[1].e);
    return LINKS.get(k1).then(function (hit) {                       // step 1: local database
      if (hit) return hit;
      return searchAndSave(ref, prog.item, k1).then(function () {   // step 2: search (results are saved as they are found)
        return LINKS.get(k1);
      }).then(function (h) { return h || LINKS.get(k2); });         // no next episode in this season: first of the next
    });
  }

  /** Can this file start playing? Tried on a hidden second player, so the programme being watched keeps playing meanwhile. */
  function probeUrl(url, ms) {
    return new Promise(function (res) {
      var t = document.createElement('video'), done = false, timer;
      function finish(ok) {
        if (done) return;
        done = true; clearTimeout(timer);
        try { t.removeAttribute('src'); t.load(); } catch (e) { /* ignore */ }
        res(ok);
      }
      t.muted = true; t.preload = 'auto';
      t.addEventListener('canplay', function () { finish(true); });
      t.addEventListener('error', function () { finish(false); });
      timer = setTimeout(function () { finish(false); }, ms);
      t.src = url;
    });
  }

  /** The episode we switched to did not work out: go back to what was playing, at the same spot. */
  function revertTrial() {
    var t = cur && cur.trial;
    if (!t) return false;
    var bad = cur.prog;                 // it loaded but never started playing: treat that link as dead too
    if (bad) {
      var ref = LINKS.parseEp(bad.title);
      if (ref) LINKS.drop(LINKS.key(ref.show, ref.s, ref.e));
      markSlow(bad.id);
    }
    toast("Couldn't play the next episode - back to what you were watching", 3500);
    playSlot(t.ch, t.index, t.pos, false, false, t.prog);
    return true;
  }

  function playNext() {
    if (nextBusy || !cur) return;
    if (cur.ad || !window.LINKS || !LINKS.parseEp(cur.prog.title)) { toast('Next episode not found', 2500); return; }
    nextBusy = true;
    closeOsd();
    clearTimeout(spinTimer);
    $('spin').className = '';           // spinner straight away: the current programme keeps playing until the next one is found
    var me = cur;
    var limit = new Promise(function (res) { setTimeout(function () { res(null); }, 25000); });
    Promise.race([resolveNext(me.prog), limit]).then(function (hit) { return hit; }, function () { return null; }).then(function (hit) {
      nextBusy = false;
      if (cur !== me) return;           // the viewer changed channel meanwhile
      if (!hit) { spinOff(); toast('Next episode not found', 3000); return; }
      var url = E.canonicalUrl(hit.url) || hit.url;
      nextBusy = true;                  // keep the spinner up while the new file is tried out; the current programme keeps playing
      probeUrl(url, 15000).then(function (ok) {
        nextBusy = false;
        if (cur !== me) return;
        if (!ok) {                      // the file itself would not load: forget this link so next time searches again
          if (hit.k) LINKS.drop(hit.k);
          markSlow(hit.id);
          spinOff(); toast("Couldn't play the next episode", 3000); return;
        }
        var pos = v.currentTime || 0;
        playSlot(me.ch, me.index, 0, true, false, { id: hit.id, item: hit.item, url: url, title: hit.title, sub: '', dur: hit.dur });
        var started = cur;
        started.trial = { ch: me.ch, index: me.index, prog: me.prog, pos: pos };
        setTimeout(function () { if (cur === started && v.readyState < 3) revertTrial(); }, 20000);   // still not playing: go back
      });
    });
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
    if (cur && !cur.ad && cur.prog) learnDur(cur.prog.id, v.duration);
    if (cur && !cur.ad && pb.t0 && Date.now() - pb.t0 > SLOW_MS) markSlow(cur.prog.id);
    var off = parseFloat(v.dataset.offset) || 0;
    v.dataset.offset = '0';
    if (off > 0 && isFinite(v.duration)) {
      try { v.currentTime = Math.min(off, Math.max(0, v.duration - 2)); } catch (e) { /* not seekable */ }
    }
  });
  var spinTimer = null;
  function spinOn() { clearTimeout(spinTimer); spinTimer = setTimeout(function () { $('spin').className = ''; }, 700); }
  function spinOff() { if (nextBusy) return; clearTimeout(spinTimer); $('spin').className = 'hidden'; }   // Play Next keeps the spinner up while it looks for the episode
  var stuckTimer = null;
  function recoverIfStuck() {
    clearTimeout(stuckTimer);
    stuckTimer = setTimeout(function () {
      // stalled mid-programme for a long time: reload the same file at the same spot (never during the initial load)
      if (!cur || v.paused || v.readyState >= 3 || !(v.currentTime > 2)) return;
      v.dataset.offset = String(v.currentTime);
      pbStart(v.src, v.currentTime);
      var src = v.src;
      v.src = src;
      var p = v.play();
      if (p && p.catch) p.catch(function () { /* ignore */ });
    }, 20000);
  }
  v.addEventListener('waiting', function () {
    if (!v.paused && (v.currentTime > 0.2 || (cur && cur.ad))) { spinOn(); recoverIfStuck(); }
    // a file that was slow to start and stalls again straight away: give up on it after 10 s
    if (cur && !cur.ad && cur.prog && isSlow(cur.prog.id)) {
      var me = cur;
      setTimeout(function () { if (cur === me && v.readyState < 3 && !v.paused) nextInChannel(); }, 10000);
    }
  });
  v.addEventListener('playing', function () { clearTimeout(stuckTimer); if (!nextBusy) spinOff(); });
  v.addEventListener('seeking', spinOn);
  var sbTimer = null;
  function standbyOff() { clearTimeout(sbTimer); $('standby').className = 'hidden'; }
  function standbyOn() {
    clearTimeout(sbTimer);
    sbTimer = setTimeout(function () {
      if (!cur || cur.ad || v.readyState >= 3 || v.currentTime > 0.2) return;   // adverts and mid-show waits use the small spinner
      var next = cur.prog && cur.prog.title;
      $('sbnum').textContent = cur.ch.n;
      $('sbname').textContent = cur.ch.name;
      $('sbp').textContent = String(100 + cur.ch.n);
      $('sbprog').textContent = '';
      if (next) {
        $('sbprog').appendChild(document.createTextNode('Coming up: '));
        var sp = document.createElement('span');
        sp.textContent = next;
        $('sbprog').appendChild(sp);
      }
      $('standby').className = '';
    }, 1000);
  }
  v.addEventListener('loadstart', standbyOn);
  v.addEventListener('playing', standbyOff);
  v.addEventListener('timeupdate', function () { if (v.currentTime > 0.2 && !v.paused) standbyOff(); });
  v.addEventListener('error', standbyOff);
  v.addEventListener('seeked', spinOff);
  v.addEventListener('timeupdate', function () { if (!v.paused && v.currentTime > 0) spinOff(); });
  v.addEventListener('playing', function () {
    spinOff();
    hideStatic();
    if (cur) { cur.errors = 0; cur.trial = null; }   // it started fine: no going back
  });
  v.addEventListener('ended', onEnded);
  v.addEventListener('error', function () {
    if (!cur) return;
    if (cur.trial && revertTrial()) return;   // a Play Next episode that fails: back to the previous programme
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

  var gPaint = null;        // what the grid currently shows, so moving the highlight need not rebuild it

  /** Highlight, "on now" marks, clock and the details line: everything that changes without the grid changing. */
  function paintSelection(list) {
    var now = Date.now();
    $('gclock').textContent = fmtTime(now);
    gPaint.rows.forEach(function (row, i) {
      var want = 'gch' + (gPaint.top + i === gRow ? ' sel' : '');
      if (row.cell.className !== want) row.cell.className = want;
      if (row.ld) {                                 // channel still loading: one wide block, highlighted or not
        var lw = 'blk ld' + (row.ch === list[gRow] ? ' foc' : '');
        if (row.ld.className !== lw) row.ld.className = lw;
      }
      row.blocks.forEach(function (bl) {
        var w = bl.base +
          ((row.ch === list[gRow] && bl.b.startMs <= gFocus && gFocus < bl.b.endMs) ? ' foc' : '') +
          ((bl.b.startMs <= now && now < bl.b.endMs) ? ' now' : '');
        if (bl.el.className !== w) bl.el.className = w;
      });
    });

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
      $('gtime').textContent = fmtTime(fb.startMs) + ' \u2013 ' + fmtTime(fb.endMs) + '   ' + when;
      $('gsub').textContent = fb.count > 1
        ? 'Plus ' + (fb.count - 1) + ' more programme' + (fb.count > 2 ? 's' : '')
        : (fb.prog.sub || '');
    }
    guideArt(fb ? fb.prog : null);
  }

  /** light = the highlight moved; rebuild the grid only when the rows or the time window actually change. */
  function renderGuide(light) {
    var list = guideList();
    if (!list.length) return;
    var now = Date.now();
    gRow = list.indexOf(gChan);
    if (gRow < 0) { gRow = 0; gChan = list[0]; }
    if (gRow < gTop) gTop = gRow;
    if (gRow >= gTop + VISIBLE_ROWS) gTop = gRow - VISIBLE_ROWS + 1;

    if (light && gPaint && gPaint.top === gTop && gPaint.win === gWin && gPaint.len === list.length) {
      paintSelection(list);
      return;
    }

    $('gclock').textContent = fmtTime(now);

    var grid = $('ggrid');
    grid.textContent = '';
    gPaint = { top: gTop, win: gWin, len: list.length, rows: [] };

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
      var rec = { ch: ch, cell: cell, blocks: [] };
      gPaint.rows.push(rec);
      var line = div('tline');
      if (ch.status !== 'ready') {
        var ld = div('blk ld' + (ch === gChan ? ' foc' : ''));
        ld.style.left = '0';
        ld.style.width = 'calc(100% - .4vw)';
        ld.appendChild(div('t', 'Loading programmes\u2026'));
        rec.ld = ld;
        line.appendChild(ld);
        row.appendChild(line);
        grid.appendChild(row);
        continue;
      }
      (function (rec, line, ch) {
        E.blocks(ch.sched, gWin, gWin + SPAN).forEach(function (b) {
          var s = Math.max(b.startMs, gWin);
          var e = Math.min(b.endMs, gWin + SPAN);
          if (e <= s) return;
          var focused = (ch === list[gRow]) && b.startMs <= gFocus && gFocus < b.endMs;
          var frac = (e - s) / SPAN;
          var clipL = b.startMs < gWin, clipR = b.endMs > gWin + SPAN;
          var base = 'blk' + (clipL ? ' cl' : '') + (clipR ? ' cr' : '');
          var el = div(base + (focused ? ' foc' : '') + (b.startMs <= now && now < b.endMs ? ' now' : ''));
          el.style.left = ((s - gWin) / SPAN * 100) + '%';
          el.style.width = 'calc(' + (frac * 100) + '% - .4vw)';
          rec.blocks.push({ el: el, b: b, base: base });
          if (frac < 0.07) { line.appendChild(el); return; } // too narrow for text
          if (clipL) el.appendChild(div('arr l', '\u25c4'));
          if (clipR) el.appendChild(div('arr r', '\u25ba'));
          el.appendChild(div('t', b.prog.title));
          el.appendChild(div('s', b.count > 1 ? '+' + (b.count - 1) + ' more' : (b.prog.sub || '')));
          line.appendChild(el);
        });
      })(rec, line, ch);
      row.appendChild(line);
      grid.appendChild(row);
    }

    paintSelection(list);
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
      renderGuide(true);
    }, 20000);
  }

  function closeGuide() {
    gPaint = null;
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
    renderGuide(true);
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
    renderGuide(true);
  }

  function gJump(kind) {
    var now = Date.now();
    var base = floorHalf(now);
    if (kind === 'now') { gWin = base; gFocus = now; }
    else if (kind === 'later') { gWin += SPAN; gFocus = gWin; }
    else { gWin = Math.max(base, gWin - SPAN); gFocus = gWin === base ? now : gWin; }
    renderGuide(true);
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

  /** First press asks, a second press within 2.5 s exits. */
  function pressBackToExit() {
    if (exitArmed) { exitApp(); return; }
    exitArmed = true;
    toast('Press Back again to exit', 2500);
    clearTimeout(exitTimer);
    exitTimer = setTimeout(function () { exitArmed = false; }, 2500);
  }

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
    toast(c.name + (c.autoUsed ? ' [Auto EPG]' : '') + ': ' + (r.length ? 'not playing - ' + r.join('; ') : 'all sources loaded') + file, 12000);
  }

  // ------------------------------------------------------------------ OSD bar (OK while watching)

  var AR = [
    { id: 'auto', label: 'Auto' }, { id: '43', label: '4:3' }, { id: '169', label: '16:9' },
    { id: 'zoom', label: 'Zoom' }, { id: 'stretch', label: 'Stretch' }
  ];
  var arIdx = 0;
  var OB = ['guide', 'rew', 'pp', 'ff', 'next', 'restart', 'options', 'info'];   // buttons on the bar, left to right
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
  var FXMODES = ['off', 'vhs', 'vivid', 'sharp', 'lines', 'grille', 'glass', 'portable', 'dots'];
  var FXLABEL = { off: 'Off', vhs: 'VHS', vivid: 'Vivid', sharp: 'Sharp',
                  lines: 'Scanlines', grille: 'Aperture grille', glass: 'Curved glass',
                  portable: 'Portable set', dots: 'Shadow mask' };
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

  // ---- television cabinets: the picture is scaled into a 4:3 window with a cabinet drawn round it
  var TVSET = [
    { id: 'off', label: 'Off' },
    { id: 'wood', label: 'Portable (wood)' },
    { id: 'console', label: 'Console (walnut)' },
    { id: 'grey', label: 'Portable (grey)' }
  ];
  var tvIdx = 0;
  (function () {
    var saved = store.get('tv1');
    for (var i = 0; i < TVSET.length; i++) if (TVSET[i].id === saved) tvIdx = i;
  })();
  function applyTv() {
    TVSET.forEach(function (t) { document.body.classList.remove('tv-' + t.id); });
    document.body.classList.add('tv-' + TVSET[tvIdx].id);
    store.set('tv1', TVSET[tvIdx].id);
  }
  function changeTv(d) {
    tvIdx = (tvIdx + d + TVSET.length) % TVSET.length;
    applyTv();
    renderOpts();
  }

  function changeFx(d) {
    fxMode = FXMODES[(FXMODES.indexOf(fxMode) + d + FXMODES.length) % FXMODES.length];
    applyFx();
    renderOpts();
  }

  // ---- Options panel (OSD > Options): picture, enhancements, adverts, Auto EPG, how long listings are kept
  var OPTS = ['ar', 'fx', 'ovl', 'gart', 'ads', 'auto', 'keep'];
  var optsOpen = false, optsSel = 0, optsTimer = null;
  function optValue(id) {
    if (id === 'ar') return AR[arIdx].label;
    if (id === 'fx') return FXLABEL[fxMode];
    if (id === 'ovl') return TVSET[tvIdx].label;
    if (id === 'gart') return gartOn ? 'On' : 'Off';
    if (id === 'ads') return ADS.ERAS[ADS.eraIndex(adEra)].label + (adEra !== 'off' && cur && !ADS.categoryFor(cur.ch.id) ? '  (none on this channel)' : '');
    if (id === 'keep') return KEEP[keepIdx].label;
    return autoEpg ? 'On' : 'Off';
  }

  /** Picking longer keeps the lists already stored; picking shorter lets them run out. Links are never thrown away. */
  function changeKeep(d) {
    keepIdx = (keepIdx + (d < 0 ? KEEP.length - 1 : 1)) % KEEP.length;
    store.set('keep1', KEEP[keepIdx].id);
    renderOpts();
    toast('Listings kept for ' + KEEP[keepIdx].label + ', then built again', 2600);
  }

  function renderOpts() {
    OPTS.forEach(function (id, i) {
      $('ov-' + id).textContent = optValue(id);
      $('or-' + id).className = 'orow' + (i === optsSel ? ' sel' : '');
    });
  }
  function openOpts() {
    closeOsd();
    optsOpen = true; optsSel = 0;
    renderOpts();
    $('opts').className = '';
    optsTouch();
  }
  function closeOpts() { optsOpen = false; clearTimeout(optsTimer); $('opts').className = 'hidden'; }
  function optsTouch() { clearTimeout(optsTimer); optsTimer = setTimeout(closeOpts, 20000); }
  function optsChange(d) {
    var id = OPTS[optsSel];
    if (id === 'ar') changeAr(d);
    else if (id === 'fx') changeFx(d);
    else if (id === 'ovl') changeTv(d);
    else if (id === 'gart') { gartOn = !gartOn; store.set('gart', gartOn ? 'on' : 'off'); gartFor = '\u0000'; artFor = ''; osdArt(); renderOpts(); }
    else if (id === 'ads') changeAds(d);
    else if (id === 'keep') changeKeep(d);
    else toggleAuto();
  }
  function optsKey(k) {
    optsTouch();
    if (k === 'ArrowUp') optsSel = (optsSel + OPTS.length - 1) % OPTS.length;
    else if (k === 'ArrowDown') optsSel = (optsSel + 1) % OPTS.length;
    else if (k === 'ArrowLeft') { optsChange(-1); return true; }
    else if (k === 'ArrowRight' || k === 'Enter' || k === ' ') { optsChange(1); return true; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') closeOpts();
    else if (k === 'Guide' || k === 'Red') { closeOpts(); openGuide(); }
    renderOpts();
    return true;
  }

  var ERA_SHORT = { off: 'Off', all: 'All', '70': '70s', '80': '80s', '90': '90s' };
  function changeAds(d) {
    var ids = ADS.ERAS.map(function (e) { return e.id; });
    adEra = ids[(ids.indexOf(adEra) + d + ids.length) % ids.length];
    store.set('adera', adEra);
    if (cur) loadAds(cur.ch, true);
    renderOpts();
  }
  function toggleAuto() {
    autoEpg = !autoEpg;
    store.set('autoepg', autoEpg ? 'on' : 'off');
    toast(autoEpg ? 'Auto EPG on (experimental): rebuilding the guide...' : 'Auto EPG off: back to the normal guide...', 4000);
    renderOpts();
    setTimeout(function () { location.reload(); }, 1200);   // the start-up loading screen does the rebuild
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
    OB.forEach(function (id, i) { $('ob-' + id).className = 'ob' + (i === osdSel ? ' sel' : ''); });
  }

  function osdTouch() {
    clearTimeout(osdTimer);
    osdTimer = setTimeout(function () { if (v.paused) osdTouch(); else closeOsd(); }, 8000);
  }

  // "Extra metadata" (Options): one switch for the OSD poster/backdrop and the guide fanart
  var gartOn = store.get('gart') !== 'off', gartFor = '', gartTimer = null;
  // artwork on the OSD: show poster (and a faint fanart backdrop) from TVmaze; nothing shown if there is none
  var artFor = '';
  function osdArt() {
    var art = $('oart'), bg = $('obg');
    if (!gartOn || !cur || cur.ad) { art.className = 'hidden'; bg.className = ''; artFor = ''; return; }
    var title = cur.prog.title || '';
    if (title === artFor || !quiet()) return;
    artFor = title;
    art.className = 'hidden'; bg.className = '';
    var p = parseTitle(title);
    if (!p.show) return;
    tvmInfo(p).then(function (d) {
      if (!d || artFor !== title || !cur || cur.prog.title !== title) return;
      var pic = d.show.poster || (d.ep && d.ep.image) || '';
      if (pic) { art.onerror = function () { art.className = 'hidden'; }; art.src = pic; art.className = ''; }
      var back = d.show.background || (d.ep && d.ep.image) || '';
      if (back) { bg.style.backgroundImage = 'url("' + back + '")'; bg.className = 'on'; }
    }, function () { /* no artwork */ });
  }

  function openOsd() {
    if (!cur) { openGuide(); return; }
    osdOpen = true;
    osdArt();
    osdSel = OB.indexOf('pp');      // start on play/pause
    clearTimeout(bannerTimer);
    $('banner').className = 'off';
    renderOsd();
    $('osd').className = '';
    clearInterval(osdTick);
    osdTick = setInterval(function () { renderOsd(); osdArt(); }, 500);
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
    renderOpts();
  }

  function togglePlay() {
    if (v.paused) { v.play(); toast('Play', 1000); } else { v.pause(); toast('Paused', 1500); }
    setTimeout(renderOsd, 60);
  }

  applyAr();
  applyFx();
  applyTv();

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
    else if (id === 'next') { closeOsd(); playNext(); return; }
    else if (id === 'restart') { restartShow(); return; }
    else if (id === 'options') { openOpts(); return; }
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
    else if (k === 'MediaNext') osdAct('next');
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
      else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') pressBackToExit();   // in the guide: Back twice leaves the app
      else if (k === 'Guide') closeGuide();
      else if (k === 'Info') showReport();
      else handled = false;
    } else if (optsOpen) {
      handled = optsKey(k);
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
    else if (k === 'MediaNext') { playNext(); }
    else if (k === 'MediaPlay') { v.play(); }
    else if (k === 'MediaPause') { v.pause(); toast('Paused', 1500); }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { openGuide(); }   // watching: Back goes to the TV guide
    else handled = false;

    if (handled) e.preventDefault();
  });

  // ------------------------------------------------------------------ start up

  var bootedAt = Date.now();
  var FIRST_WAIT = 8000;      // how long to hold the loading screen for the channel we want to open on

  function begin() {
    var list = ready();
    if (started || !list.length) return;
    // The channel we would rather open on: the one that was on last, or else the first in the guide. On This Day
    // needs no requests at all, so it is ready before anything else; without this wait the app would always open on
    // it instead. Hold the loading screen a few seconds for the one we want, then start with whatever is ready.
    var want = store.get('last');
    var prefer = channels.filter(function (c) { return c.id === want; })[0] ||
                 channels.slice().sort(function (a, b) { return a.n - b.n; })[0];
    if (prefer && prefer.status === 'loading' && Date.now() - bootedAt < FIRST_WAIT) return;
    started = true;
    $('splash').className = 'hidden';
    var pick = (prefer && prefer.status === 'ready' ? prefer : null) || list[0];
    tune(pick, false, true);   // start on the last channel (its picture shows in the guide's window) ...
    openGuide();               // ... but land in the TV guide
  }

  function startLoading() {
    channels.forEach(function (c) { c.status = 'loading'; c.sched = null; });
    var finished = 0;
    // the native side now serves a few requests at a time, so ask in the order they are wanted: the channel that was
    // on last, then down the guide. The first rows fill in first instead of whichever channel happened to answer.
    var last = store.get('last');
    var order = channels.slice().sort(function (a, b) {
      return (a.id === last ? -1 : b.id === last ? 1 : 0) || a.n - b.n;
    });
    order.forEach(function (c) {
      loadPrograms(c).then(function (progs) {
        // Auto EPG found nothing for this channel: use its normal sources instead
        if (!c.autoUsed || (progs && progs.length >= AUTO_MIN)) return progs;
        // too little found (or nothing): fill the channel up from its normal sources
        var found = progs || [];
        return loadPrograms(c, true).then(function (extra) {
          c.autoUsed = found.length > 0;
          return dedupeTitles(found.concat(extra || []));
        });
      }).then(function (progs) {
        if (progs && progs.length) {
          progs = dropSlow(progs);
          progs.forEach(function (p) { if (durMem[p.id]) p.dur = durMem[p.id]; });   // real running time, once seen
          c.sched = E.buildSchedule(progs, c.id);
          c.status = 'ready';
          enrichNames(c, progs).then(null, function () { /* names stay as they are */ });
        } else {
          c.status = 'empty';
        }
      }, function () { c.status = 'empty'; }).then(function () {
        finished++;
        renderStatus();
        if (finished === channels.length) setTimeout(seedLinks, 4000);
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

  setInterval(function () { if (!started) { renderStatus(); begin(); } }, 400);   // also lets the wait above time out
  startLoading();
})();
