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
  var MAX_STORED = 800;      // each stored list is about 150 characters a programme, and the whole app has about 5 million to share between 28 channels
  var MAX_ERRORS = 6;
  var RETRY_MS = 15000;

  function $(id) { return document.getElementById(id); }
  var v = makeVideo($('v'));      // the page's video, with the app's own player behind it for files it cannot play (player.js)

  // Picture looks (CRT / Vivid / Sharp) are CSS only: the browser may not read archive.org video pixels, so no shader.
  var guideOpen = false;

  // Bulk saves (channel lists, episode guides, artwork answers) go to files through the app when it can, because the
  // page's own storage holds only about 5 million characters in all and 28 channels fill it. Small things (settings,
  // chosen artwork) stay in the page's storage. With no app around (a browser) everything stays there.
  var KV_BIG = /^(plan7|eps1:|info3:|art2:|tvm4:|artdb1:|film1:|lib2:|cast1:|libtxt1:|adcat1:)/;
  var KV_NATIVE = !!(window.NativeHttp && NativeHttp.kvGet && NativeHttp.kvSet && NativeHttp.kvKeys);
  var kv = {
    big: function (k) { return KV_NATIVE && KV_BIG.test(k); },
    getItem: function (k) {
      if (kv.big(k)) { try { return NativeHttp.kvGet(k); } catch (e) { return null; } }
      return localStorage.getItem(k);
    },
    setItem: function (k, v) {                        // throws when it will not fit, like localStorage
      if (kv.big(k)) { var ok = false; try { ok = NativeHttp.kvSet(k, v); } catch (e) { ok = false; } if (!ok) throw new Error('not saved'); return; }
      localStorage.setItem(k, v);
    },
    removeItem: function (k) {
      if (kv.big(k)) { try { NativeHttp.kvRemove(k); } catch (e) { /* nothing to remove */ } return; }
      localStorage.removeItem(k);
    },
    /** Every key, in the page's storage and in the files. */
    keys: function () {
      var out = [], i;
      try { for (i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) { /* blocked */ }
      if (KV_NATIVE) { try { String(NativeHttp.kvKeys() || '').split('\n').forEach(function (k) { if (k) out.push(k); }); } catch (e) { /* none */ } }
      return out;
    }
  };
  // lists and guides kept in the page's storage by earlier versions are cleared once: they are built or fetched again
  // into files, and would only keep taking up the room the page's storage has
  if (KV_NATIVE) {
    try {
      if (!localStorage.getItem('kvmig1')) {
        var olds = [];
        for (var oi = 0; oi < localStorage.length; oi++) { var ok0 = localStorage.key(oi); if (ok0 && KV_BIG.test(ok0)) olds.push(ok0); }
        olds.forEach(function (k0) { localStorage.removeItem(k0); });
        localStorage.setItem('kvmig1', '1');
      }
    } catch (e) { /* storage blocked */ }
  }
  var store = {
    get: function (k) { try { return JSON.parse(kv.getItem(k)); } catch (e) { return null; } },
    set: function (k, x) {
      var text = JSON.stringify(x);
      try { kv.setItem(k, text); return true; } catch (e) { /* storage full or blocked */ }
      // Only the page's own storage can fill up. A channel's list matters more than the artwork and episode guides
      // beside it, and those are fetched again when wanted: when a list will not fit, the oldest of them make room.
      if (!KV_NATIVE && /^plan7/.test(k)) {
        try {
          var old = [];
          kv.keys().forEach(function (kn) {
            if (/^(eps1|info3|art2|tvm4|artdb1):/.test(kn)) { var o = null; try { o = JSON.parse(kv.getItem(kn)); } catch (e2) { /* unreadable: goes first */ } old.push({ k: kn, t: (o && o.t) || 0 }); }
          });
          old.sort(function (p, q) { return p.t - q.t; });
          for (var j = 0; j < old.length; j++) {
            kv.removeItem(old[j].k);
            try { kv.setItem(k, text); return true; } catch (e3) { /* still full: remove the next */ }
          }
        } catch (e4) { /* storage blocked */ }
      }
      return false;
    }
  };

  // Artwork answers remembered by older versions include blank ones from failed requests, kept for a month.
  // They are thrown away once so those shows get looked up again.
  try {
    var gone = [];
    var _ks = kv.keys(); for (var ki = 0; ki < _ks.length; ki++) {
      var kk = _ks[ki];
      if (kk && (kk.indexOf('art1:') === 0 || kk.indexOf('info2:') === 0)) gone.push(kk);
    }
    gone.forEach(function (k2) { kv.removeItem(k2); });
  } catch (e) { /* storage blocked */ }
  // Programmes marked "slow to start" by versions whose buffer could not join a long programme part-way through:
  // the fault was the buffer's, not theirs, so they get a clean slate once.
  try { if (!kv.getItem('slowfix1')) { kv.removeItem('slow1'); kv.setItem('slowfix1', '1'); } } catch (e) { /* storage blocked */ }

  // ------------------------------------------------------------------ debug log
  //
  // What was played, how it went, and why it failed, kept on the TV so it can be sent when something will not
  // play. Options > Debug log puts it on the home network for a phone or computer to open and copy.
  var DLOG = store.get('dbglog1') || [], dlogTimer = null, httpFails = 0;
  if (!(DLOG instanceof Array)) DLOG = [];
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function dlog(text) {
    var d = new Date();
    DLOG.push(two(d.getDate()) + '/' + two(d.getMonth() + 1) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()) +
      '  ' + String(text).slice(0, 700));
    if (DLOG.length > 400) DLOG.splice(0, DLOG.length - 400);
    clearTimeout(dlogTimer);
    dlogTimer = setTimeout(function () { store.set('dbglog1', DLOG); }, 2000);
  }
  window.addEventListener('error', function (e) {
    dlog('SCRIPT ERROR ' + (e && e.message) + ' @' + String((e && e.filename) || '').split('/').pop() + ':' + (e && e.lineno));
  });
  /** Ask archive.org about a file that would not play: is it there, is it allowed, is it really an mp4? */
  var probeId = 0, probes = {};
  window.__probe = function (id, json) {
    var url = probes[id];
    delete probes[id];
    dlog('  ARCHIVE.ORG ' + json + (url ? '  ' + url : ''));
  };
  function diagnose(url) {
    if (!url || !window.NativeHttp || !NativeHttp.probe) return;
    var id = ++probeId;
    probes[id] = url;
    try { NativeHttp.probe(id, url); } catch (e) { delete probes[id]; }
  }
  function urlParts(u) {
    var m = /archive\.org\/download\/([^\/]+)\/(.+)$/.exec(String(u || ''));
    if (!m) return null;
    try { return { item: decodeURIComponent(m[1]), file: decodeURIComponent(m[2]) }; } catch (e) { return { item: m[1], file: m[2] }; }
  }
  function mins(sec) { return sec > 0 ? Math.round(sec / 60) + ' min' : '?'; }
  /**
   * Put everything known about the programme on screen into the log: what the app thinks it is, where it came from,
   * how long it should be and is, and what archive.org says the upload actually is. This is how a programme that is
   * not what it claims to be gets tracked down.
   */
  function reportProgramme(why) {
    if (!cur || !cur.prog || cur.ad) return;
    var p = cur.prog, u = urlParts(p.url);
    dlog('REPORT (' + why + ') ch ' + cur.ch.n + ' ' + cur.ch.name + ' | ' + (p.title || '?') + (p.sub ? ' - ' + p.sub : '') +
      ' | listed as show: ' + (p.show || p.group || '-') + ' | item: ' + (u ? u.item : '?') + ' | file: ' + (u ? u.file : '?') +
      ' | expected ' + mins(p.dur) + (isFinite(v.duration) && v.duration > 0 ? ', file is ' + mins(v.duration) : '') +
      (v.videoWidth ? ' | picture ' + v.videoWidth + 'x' + v.videoHeight : ''));
    if (u && window.NativeHttp && NativeHttp.probeItem) {
      var id = ++probeId;
      probes[id] = '';
      try { NativeHttp.probeItem(id, u.item, u.file); } catch (e) { delete probes[id]; }
    }
  }
  /** The whole log as text, with the buffer's own notes on the end. */
  /** What this TV's built-in player says it can play. canPlayType answers "probably", "maybe" or "" (no). */
  var PLAYER_TESTS = [
    ['MP4, H.264 + AAC', 'video/mp4; codecs="avc1.64001F, mp4a.40.2"'],
    ['MKV, H.264 + AAC', 'video/x-matroska; codecs="avc1.64001F, mp4a.40.2"'],
    ['MKV (any contents)', 'video/x-matroska'],
    ['MKV, H.264 + AC3 audio', 'video/x-matroska; codecs="avc1.64001F, ac-3"'],
    ['MKV, HEVC + AAC', 'video/x-matroska; codecs="hvc1.1.6.L93.B0, mp4a.40.2"'],
    ['WebM, VP9 + Opus', 'video/webm; codecs="vp9, opus"'],
    ['AVI', 'video/x-msvideo'],
    ['MP4, HEVC + AAC', 'video/mp4; codecs="hvc1.1.6.L93.B0, mp4a.40.2"']
  ];
  function playerSupport() {
    var out = [];
    PLAYER_TESTS.forEach(function (t) {
      var r = '';
      try { r = v.canPlayType(t[1]); } catch (e) { r = ''; }
      out.push(t[0] + ': ' + (r === 'probably' ? 'yes' : r === 'maybe' ? 'maybe' : 'no'));
    });
    return out;
  }
  function logText() {
    var head = ['Telly Addicts debug log', 'Version: ' + ((window.RELEASE && RELEASE.name) || 'unnumbered'),
      'Device: ' + (window.NativeHttp && NativeHttp.device ? NativeHttp.device() : 'not the TV app'),
      'Browser: ' + navigator.userAgent, 'Player can play: ' + playerSupport().join('; '), 'Written: ' + new Date().toString(), ''];
    var notes = '';
    try { notes = window.NativeHttp && NativeHttp.cacheLog ? NativeHttp.cacheLog() : ''; } catch (e) { notes = ''; }
    return head.concat(DLOG).join('\n') + '\n\n--- buffer notes (this run of the app) ---\n' + (notes || '(none)\n');
  }

  // ------------------------------------------------------------------ network

  var reqId = 0;
  var pending = {};

  // Called by the Android shell when a request finishes.
  window.__http = function (id, status, body) {
    var p = pending[id];
    if (!p) return;
    delete pending[id];
    if (status >= 200 && status < 300) p.res(body);
    else {
      // files that are optional until the scraper publishes them (art.json, routes.json) are not faults
      if (!/\/data\/(art|routes|removed-shows)\.json$|\/data\/eps\//.test(p.url || '') && ++httpFails <= 40) dlog('REQUEST FAILED ' + (status || 'no answer') + '  ' + p.url);
      p.rej(new Error('HTTP ' + status));
    }
  };

  function http(url) {
    if (window.NativeHttp) {
      return new Promise(function (res, rej) {
        var id = ++reqId;
        pending[id] = { res: res, rej: rej, url: url };
        window.NativeHttp.get(id, url);
        setTimeout(function () {
          if (pending[id]) { delete pending[id]; if (++httpFails <= 40) dlog('REQUEST TIMED OUT  ' + url); rej(new Error('timeout')); }
        }, /\/data\/library\.json/.test(url) ? 120000 : 40000);
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
      if (p.show) r.h = p.show;                                 // the scrape knew the real show name; don't lose it
      if (p.filmKey) r.f = p.filmKey;                           // where this film's TMDb details are kept
      if (p.cert) r.c = p.cert;                                 // BBFC certificate: decides what plays before nine
      if (p.group && p.group.indexOf('-') > 0) r.g = p.group;   // advert tier (uk/g), kept so UK adverts stay preferred
      return r;
    });
  }
  function unpackPlan(rows) {
    return rows.map(function (r) {
      return { show: r.h, id: r.i, item: String(r.i).split('/')[0], url: E.canonicalUrl(/^https?:/.test(r.u) ? r.u : DL + r.u) || (/^https?:/.test(r.u) ? r.u : DL + r.u), title: r.t, sub: r.s, dur: r.d, group: r.g, filmKey: r.f, cert: r.c };
    });
  }
  var keepIdx = keepIndex((store.get('keep1') || '1w'));
  // How much airtime each channel's guide is built to cover before it repeats (Options > Guide length). It only shapes
  // the guide and what plays on the channels: On Demand always lists everything.
  var SPANS = [
    { id: '24h', label: '24 hours', h: 24 },
    { id: '48h', label: '48 hours', h: 48 },
    { id: '1w', label: '1 week', h: 168 },
    { id: '1m', label: '1 month', h: 720 }
  ];
  // Guide themes: a class on <body> (gt-<id>) restyles the guide. 'auto' follows the channel: the decade channels get their own decade.
  var THEMES = [
    { id: 'auto', label: 'Match the channel' }, { id: 'classic', label: 'Classic Blue' }, { id: 'teletext', label: 'Teletext' },
    { id: 'paper', label: 'Radio Times' }, { id: 'seventies', label: '1970s' }, { id: 'eighties', label: '1980s' }, { id: 'nineties', label: '1990s' }
  ];
  var themeIdx = 0, themeNow = '';
  (function () { var id = store.get('gtheme1'); for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) themeIdx = i; })();
  var DECADE_THEME = { tv70s: 'seventies', tv80s: 'eighties', tv90s: 'nineties' };
  function applyTheme(ch) {
    var id = THEMES[themeIdx].id;
    if (id === 'auto') id = (ch && DECADE_THEME[ch.id]) || 'classic';
    if (id === themeNow) return;
    themeNow = id;
    THEMES.forEach(function (t) { document.body.classList.remove('gt-' + t.id); });
    if (id !== 'classic') document.body.classList.add('gt-' + id);
  }
  function changeTheme(d) {
    themeIdx = (themeIdx + (d < 0 ? THEMES.length - 1 : 1)) % THEMES.length;
    store.set('gtheme1', THEMES[themeIdx].id);
    applyTheme(gChan || (cur && cur.ch));
    renderOpts();
  }
  var spanIdx = 0;
  (function () { var id = store.get('span1'); for (var i = 0; i < SPANS.length; i++) if (SPANS[i].id === id) spanIdx = i; })();
  // Bumped by Options > Refresh listings. It goes into each channel's running order, so every channel comes back
  // with its programmes in different places, and into the cache keys, so the lists are gathered again from source.
  var epgGen = +(store.get('epggen') || 0) || 0;
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
  var autoEpg = true;   // Auto EPG is how every guide is built now; the hand-picked lists in channels.js are only a fallback for a channel it has nothing for
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

  // The scraper also sends its whole library (data/library.json): every show and episode with the best copy, and
  // TVmaze's titles and air dates. When it's there the TV decides the channels itself (libroute.js), with the genre
  // lists in tools/shows.json, so a list change needs neither a new APK nor a new scrape. Each channel's revision is
  // a hash of its own routed rows, so still only the channels that changed are rebuilt. Anything missing falls back
  // to the per-channel files, then the copy in the app.
  var SHOWS_URL = 'https://raw.githubusercontent.com/lefty420/tellyaddicts/main/tools/shows.json';
  var libP = null, libRevs = null;

  /** data/routes.json is the scraper's current word on where its shows go, and the latest copy wins: a show it lists
   *  is on the channel(s) it lists it under and nowhere else, even if tools/shows.json still puts it elsewhere (a show
   *  moved by hand from sitcoms to soaps). Shows it does not list keep the channels tools/shows.json gives them. */
  function mergeRoutes(shows, routes) {
    var chans = routes && routes.channels;
    if (!shows || !chans) return shows;
    var where = {}, any = false;
    Object.keys(chans).forEach(function (ch) {
      ((chans[ch] || {}).shows || []).forEach(function (n) {
        var k = LIBROUTE.norm(n);
        (where[k] = where[k] || {})[ch] = 1;
        any = true;
      });
    });
    if (!any) return shows;
    var out = {};
    Object.keys(shows).forEach(function (ch) {
      var had = shows[ch] || {}, merged = {};
      Object.keys(had).forEach(function (k) { merged[k] = had[k]; });
      merged.shows = (had.shows || []).filter(function (n) {
        var w = where[LIBROUTE.norm(n)];
        return !w || w[ch] || had.extra;         // listed by the scraper: only under the channel(s) it names (a channel marked "extra" is a mix: its shows stay on their own channels too)
      });
      out[ch] = merged;
    });
    Object.keys(chans).forEach(function (ch) {
      var have = {};
      ((out[ch] || {}).shows || []).forEach(function (n) { have[LIBROUTE.norm(n)] = 1; });
      var extra = ((chans[ch] || {}).shows || []).filter(function (n) { return !have[LIBROUTE.norm(n)]; });
      if (!extra.length) return;
      var base = out[ch] || { name: (chans[ch] || {}).name || ch, shows: [] }, merged = {};
      Object.keys(base).forEach(function (k) { merged[k] = base[k]; });
      merged.shows = (base.shows || []).concat(extra);
      out[ch] = merged;
    });
    return out;
  }

  /** The 8 MB library is the one file a slow TV connection can fail to get. Try up to three times, keep the last good
   *  copy on the TV, and use that copy when the download still fails, so shows keep their episode details. */
  function fetchLibrary(libRev) {
    var url = DATA_BASE + 'library.json', tries = 0;
    function cached() {
      var t = null; try { t = store.get('libtxt1:main'); } catch (e) { /* ignore */ }
      if (!t || typeof t !== 'string') throw new Error('no library');
      dlog('library.json: using the copy saved on this TV');
      return JSON.parse(t);
    }
    function go() {
      return http(url).then(function (txt) {
        var j = JSON.parse(txt);
        try { store.set('libtxt1:main', txt); } catch (e) { /* too big to keep: fine */ }
        return j;
      }, function (err) {
        if (++tries < 3) return new Promise(function (r) { setTimeout(r, 3000 * tries); }).then(go);
        return cached();
      });
    }
    return go();
  }

  /** {channel: rows} from the whole library; null if it or shows.json can't be had. */
  var removedRev = '';     // index.json "removed": revision of data/removed-shows.json
  function loadLibraryRoutes(libRev, showsText) {
    if (libP) return libP;
    var showsP = showsText ? Promise.resolve(JSON.parse(showsText)) : getJSON(SHOWS_URL);
    // routes.json is optional: when it is not published the lists in shows.json are used on their own
    var routesP = getJSON(DATA_BASE + 'routes.json').then(null, function () { return null; });
    // shows the scraper has removed for good: only asked for when the index says there are some
    var removedP = removedRev ? getJSON(DATA_BASE + 'removed-shows.json').then(function (x) { return (x && x.shows) || []; }, function () { return []; }) : Promise.resolve([]);
    libP = Promise.all([fetchLibrary(libRev), showsP, routesP, removedP]).then(function (r) {
      var lib = r[0], shows = r[1];
      if (!lib || !lib.shows || !shows || !window.LIBROUTE || (libRev && lib.rev && lib.rev !== libRev)) return null;
      return LIBROUTE.route(lib, mergeRoutes(shows, r[2]), r[3]);
    }).catch(function () { return null; });
    return libP;
  }

  /** {channel: revision} for the published lists; {} when there are none or the fetch fails. */
  function loadDataIndex() {
    if (indexP) return indexP;
    indexP = getJSON(DATA_BASE + 'index.json').then(function (j) {
      artRev = (j && j.art) || '';
      epsMap = (j && j.eps && typeof j.eps === 'object') ? j.eps : null;
      removedRev = (j && j.removed) ? String(j.removed) : '';
      adsRev = (j && j.adverts) ? String(j.adverts) : '';
      var chans = (j && j.channels) || {};
      if (!j || !j.library || !window.LIBROUTE) return chans;
      // Which channels changed only shows once the library is routed, so remember the answer per library and
      // shows.json revision: an unchanged library costs one small download, not the whole file.
      return http(SHOWS_URL).then(function (showsText) {
        // the routes revision is part of the key: a new routes.json moves shows between channels just as
        // an edit to shows.json does, so the answer stored for the old one must not be reused
        var key = 'librevs2:' + j.library + ':' + (j.routes || '-') + ':' + (j.removed || '-') + ':' + E.hash(showsText);
        var known = store.get(key);
        if (known && known.revs) { libRevs = known.revs; return known.revs; }
        return loadLibraryRoutes(j.library, showsText).then(function (routed) {
          if (!routed) return chans;
          var revs = {};
          // a channel with its own published file that the library routes nothing to (Food & Cooking) keeps that file
          Object.keys(chans).forEach(function (ch) { if (!routed[ch] || !routed[ch].length) revs[ch] = chans[ch]; });
          Object.keys(routed).forEach(function (ch) { revs[ch] = 'L' + E.hash(JSON.stringify(routed[ch])).toString(36); });
          try {                                 // forget answers for older libraries
            var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
              var kn = _ks[k];
              if (kn && kn !== key && kn.indexOf('librevs') === 0) kv.removeItem(kn);
            }
          } catch (e) { /* ignore */ }
          store.set(key, { revs: revs });
          libRevs = revs;
          return revs;
        });
      }, function () { return chans; });
    }, function () { return {}; });
    return indexP;
  }

  /** One channel's published list: from the whole library when that's in use, else its own file, else the bundled copy. */
  function loadChannelData(id, rev) {
    // a decade channel has no file of its own to compare against (the index lists none for 80's and 90's TV), so it
    // always takes what the library routed to it
    if (libRevs && ((rev && rev === libRevs[id]) || decadeOfChannel(id))) {
      return loadLibraryRoutes().then(function (routed) {
        if (routed && routed[id] && routed[id].length) return routed[id];
        return loadChannelFile(id, true);
      });
    }
    return loadChannelFile(id, rev);
  }

  /** A decade channel (70's, 80's, 90's TV) is built only from the library, which knows each episode's year. A stale
   *  per-channel file or the bundled copy can't say, so with no library the channel stays empty rather than guessing. */
  /** On a decade channel, anything with a known air date outside the decade is turned away (a second check after the library's own). */
  function decadeOk(ch, p) { return !ch.decade || !p.aired || Math.floor(parseInt(String(p.aired).slice(0, 4), 10) / 10) * 10 === ch.decade; }
  function decadeOfChannel(id) { for (var i = 0; i < channels.length; i++) if (channels[i].id === id) return channels[i].decade || 0; return 0; }
  function loadChannelFile(id, rev) {
    if (decadeOfChannel(id)) return Promise.resolve(null);
    if (!rev) return loadAutoData().then(function (D) { return (D && D[id]) || null; });
    return getJSON(DATA_BASE + encodeURIComponent(id) + '.json').then(function (rows) {
      return rows && rows.length ? rows : null;
    }, function () {
      return loadAutoData().then(function (D) { return (D && D[id]) || null; });
    });
  }
  var AUTO_DUR = { 'The Bill': 1500 };      // typical running time (s) until the real length has been seen once
  // Channels whose programmes carry no episode number: songs, films, Disney shorts ("How to Sleep"), MTV's
  // untitled and dated blocks, and news bulletins. Insisting on one empties them.
  var NO_EPISODES = { xmasmusic: 1, xmasmovies: 1, kidsmovies: 1, videoshop: 1, mtv: 1, disney: 1, tvarchive: 1, soaps: 1, cooking: 1, entertainment: 1, saturday: 0 };
  /** A row of songs or films: nothing in it will carry SxxExx, so insisting on one empties the channel. */
  function wantsEpisodes(channelId, it) {
    if (NO_EPISODES[channelId]) return false;
    var m = it.m;
    if (m) for (var k in m) if (m.hasOwnProperty(k) && (m[k].song || m[k].film)) return false;
    return true;
  }
  function progsFromData(items, channelId, everything) {   // everything: On Demand lists files whether or not their names carry an episode code
    var out = [];
    items.forEach(function (it) {
      var shows = {}, files = (it.f || []).map(function (f) {
        var name = typeof f === 'string' ? f : f[0];
        shows[name] = typeof f === 'string' ? (it.s || '') : f[1];
        return { name: name, size: '90000000' };                  // size/length are not in the scrape; real length is learned on first play
      });
      // the same naming rules as live results (episode codes, tidy titles, .ia.mp4 duplicates)
      E.pickPrograms(it.id, { metadata: { title: it.t }, files: files },
                     { video: true, requireEp: everything ? false : wantsEpisodes(channelId, it), skipFile: AUTO && AUTO.NOT_EPISODE }).forEach(function (p) {
        var nm = p.id.slice(it.id.length + 1), show = shows[nm] || '';
        p.group = show;
        p.show = show;        // used for the artwork and Info lookups, which beat guessing from the file name
        p.dur = AUTO_DUR[show] || 2700;
        // From the whole library: TVmaze's episode title, the air date and the real running time
        var d = it.m && it.m[nm];
        if (d) {
          var t = window.LIBROUTE && LIBROUTE.titleFor(show, d);
          // no TVmaze name for it, and the file name has no episode code the app can read ("Show.S01E01.1080p..."):
          // the library's own code for the episode still says where it belongs
          if (!t && d.c && show && /^S\d{1,4}E\d{1,3}$/i.test(d.c) && !(window.LINKS && LINKS.parseEp(p.title))) t = show + ' ' + d.c.toUpperCase();
          if (t) p.title = t;
          if (d.a) p.aired = d.a;
          if (d.l > 60) { p.dur = d.l; p.lenKnown = 1; }
          if (d.film) { p.filmKey = keepFilm(d); p.cert = d.cert || ''; }   // TMDb details, and the certificate
        }
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

  // Pornography has turned up in the scraped film list, so it is kept off every channel here rather than relying
  // on the list being clean. These markers were checked against the whole library: they catch what is there and
  // leave alone the things that merely sound like them (Adult Swim, The Naked Truth, Sex, Lies and Videotape).
  // Keyword matching cannot catch everything, which is why a film with no certificate is also kept out of the
  // daytime further down. The certificate the scraper is adding is the real answer.
  var BLOCKED = new RegExp([
    'adult footage', 'adult film', 'adult movie', 'adult version',
    '\\bxxx\\b', 'hardcore', 'softcore', 'sexual techniques',
    '\\bemanuelle\\b', '\\bemmanuelle\\b',
    '\\bytp\\b', 'youtube poop', 'donald duck comedy vs'      // fan-made YouTube Poop remixes, some of them crude
  ].join('|'), 'i');
  // Single words that mean one thing in a film's title and quite another in a programme's: "Porn Yesterday" is a
  // Steptoe and Son episode from 1974, and this list was throwing it away.
  var BLOCKED_FILM = /\bporn\b|\bporno\b|\berotica?\b|\badults?\b|\bplayboy\b|\bpenthouse\b/i;
  /** Keep adult material off every channel, whichever list it came in on. */
  // single archive.org items found to be the wrong thing (a dubbed or foreign-language copy, say), hidden until the scraper drops them
  var BAD_ITEMS = { 'the-goonies-1985_202510': 1, 'sailor-moon-1992-1080pcbr-': 1, 'bishoujo-senshi-sailor-moon-live': 1,
    'the-addams-family__season-2': 1, 'the-addams-family__season-1': 1,
    '20250604_20250604_0220': 1, '20250527_20250527_1334': 1, '20250601_20250601_0848': 1 };      // Russian first audio track, English second
  function blocked(p) {
    if (!p) return false;
    if (p.id && BAD_ITEMS[String(p.id).split('/')[0]]) return true;
    var t = (p.show || p.group || '') + ' ' + (p.title || '') + ' ' + (p.sub || '') + ' ' +
            String(p.id || '').replace(/[-_]/g, ' ');
    return BLOCKED.test(t) || (!!p.filmKey && BLOCKED_FILM.test(t));
  }

  // A film's details come from TMDb with the scraper's library: the plot and poster are far too big to repeat on
  // every stored listing, so each film is kept once under its own key and the listing only carries the key.
  var TMDB_IMG = 'https://image.tmdb.org/';
  function keepFilm(d) {
    var key = String(d.tm || '').trim() || normShow(d.n || '');
    if (!key) return '';
    var poster = String(d.p || '');
    var film = { title: d.n || '', plot: d.ov || '', poster: poster.indexOf(TMDB_IMG) === 0 ? poster : '',
                 genres: Array.isArray(d.g) ? d.g.join(', ') : (d.g || ''),
                 mins: +d.rt || 0, released: d.a || '', tmdb: d.tm || '', cert: d.cert || '',
                 cast: Array.isArray(d.cast) ? d.cast.slice(0, 10).map(function (m) {
                   if (typeof m === 'string') return { n: m, c: '', p: '' };
                   var ph = String(m.p || m.photo || m.profile || m.image || m.img || '');    // tolerate a spelled-out key
                   return { n: m.n || m.name || '', c: m.c || m.character || m.role || '', p: ph.indexOf(TMDB_IMG) === 0 ? ph : '' };
                 }) : [] };
    // stored even when TMDb knew nothing, so Info shows the film's own title instead of hunting for a TV series
    store.set('film1:' + key, film);
    return key;
  }
  function filmFor(prog) {
    if (!prog || !prog.filmKey) return null;
    return store.get('film1:' + prog.filmKey) || null;
  }

  /** Programmes from a channel's "files" sources: links already named, so there is nothing to look up. */
  function namedFiles(ch) {
    var out = [];
    (ch.sources || []).forEach(function (s) {
      (s.files || []).forEach(function (f) {
        var url = E.canonicalUrl(f[0]) || f[0];
        if (!url || url.indexOf(DL) !== 0) return;
        var id = decodeURIComponent(url.slice(DL.length).split('?')[0]);
        out.push({ id: id, item: id.split('/')[0], url: url, title: f[1] || '', sub: '',
                   dur: f[2] || s.dur || 150, group: s.group, show: s.group });
      });
    });
    return out;
  }

  /** A date in a file name or an item name: "15-01-1985", "1985-01-15", "15 Jan 1985". Returns "MM-DD" or ''. */
  var MON = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
              jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  function monthDay(text) {
    var s = String(text || '');
    var iso = /(19[789]\d)[-_. ](\d{2})[-_. ](\d{2})/.exec(s);                       // 1985-01-15
    if (iso && +iso[2] <= 12 && +iso[3] <= 31) return iso[2] + '-' + iso[3];
    var uk = /\b(\d{1,2})[-_. /](\d{1,2})[-_. /](19[789]\d)\b/.exec(s);              // 15-01-1985
    if (uk && +uk[2] <= 12 && +uk[1] <= 31) return pad2(uk[2]) + '-' + pad2(uk[1]);
    var named = /\b(\d{1,2})\s*([a-z]{3})[a-z]*\.?\s*(19[789]\d)\b/i.exec(s);        // 15 Jan 1985
    if (named && MON[named[2].toLowerCase()]) return MON[named[2].toLowerCase()] + '-' + pad2(named[1]);
    return '';
  }
  function pad2(n) { return (+n < 10 ? '0' : '') + (+n); }

  /**
   * Classic British telly means 1970 to 1999, so an episode the library dates to 2000 or later is left out.
   *
   * This is not about the show but about the episode: the scrape matches some shows to their modern remake or
   * to a revival, so "Sailor Moon" came back as Sailor Moon Crystal from 2012, Thomas as the 2007 series, and
   * The Bill brought 867 episodes made after the cut-off. Judging each episode by its own air date keeps the
   * early years of a long-running show and drops the later ones, which is exactly what is wanted.
   *
   * An episode with no air date is kept: most of the library has one, and throwing away everything unknown
   * would empty the channels that were built from file names alone.
   */
  var ERA_END = 1999;
  function inEra(p) {
    var a = p && p.aired;
    if (!a) return true;
    var y = parseInt(String(a).slice(0, 4), 10);
    return !(y > ERA_END);
  }

  /**
   * A film plays only if it carries a certificate.
   *
   * The scraped film list is an archive dump, and what came back included pornography, sex instructional tapes
   * and worse, sitting next to A Bug's Life with nothing to tell them apart. Neither a list of banned words nor
   * "has the film been identified" is enough: several of the identified films are adult titles with perfectly
   * ordinary TMDb entries. The certificate is the one piece of information that actually says what a film is and
   * when it may be shown, so a film without one is not scheduled at all.
   *
   * This only touches films from the library. Hand-picked items on a channel's own sources are unaffected.
   * Until films carry certificates the film channels find nothing and hide themselves, which is the right way
   * round: an empty channel is a far smaller problem than an 18 in the middle of the afternoon.
   */
  function certified(ch, progs) {
    var keep = progs.filter(function (p) { return !p.filmKey || !!String(p.cert || '').trim(); });
    if (keep.length !== progs.length) {
      ch.report = (ch.report || []).concat((progs.length - keep.length) +
        ' films left out: without a certificate there is no way to know what they are or when they may play');
    }
    var era = ch && ch.id === 'disney' ? keep : keep.filter(inEra);      // the Disney channel runs shorts from the 1930s on, mostly undated
    if (era.length !== keep.length) {
      ch.report = (ch.report || []).concat((keep.length - era.length) + ' episodes left out: made after ' + ERA_END);
    }
    return era;
  }

  /** TV Archive only: keep what went out on today's day and month, whatever the year. Undated clips stay, because
   *  that is what fills the time between the bulletins; if nothing at all is dated today, keep the lot rather
   *  than show an empty channel. */
  function datedToday(ch, progs) {
    if (ch.id !== 'tvarchive' || !progs.length) return progs;
    var seenNews = {};
    /** Undated items: BBC Archive clips stay; a BBC News 24 recording stays once per programme under a cleaned
     *  title (its file name starts with a recording id and ends -BBC-News-24); anything else with an id for a
     *  title is dropped, because a wall of "145D5B6D-Business-Briefing" is not what this channel is for. */
    function undatedOk(p) {
      if (p.group === 'BBC Archive') return true;
      var t = String(p.title || '');
      if (/BBC[- ]News[- ]24|^[0-9A-F]{6,}X?-/i.test(t)) {
        var c = t.replace(/^(BBC-News-24-Part\d+-tva - )?[0-9A-F]{6,}X?-/i, '').replace(/[- ]*-?BBC-News-24\s*$/i, '')
          .replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
        if (!c || /^[0-9A-F ]+$/i.test(c) || seenNews[c.toLowerCase()]) return false;
        seenNews[c.toLowerCase()] = 1;
        p.title = c;
        return true;
      }
      return true;
    }
    var now = new Date(), today = pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
    var dated = 0, keep = progs.filter(function (p) {
      var md = (p.aired && /^\d{4}-(\d{2}-\d{2})$/.exec(p.aired) || [])[1] ||
               monthDay(p.sub) || monthDay(p.title) || monthDay(p.id);
      if (!md) return undatedOk(p);                           // no date on it: the clips and odds and ends
      dated++;
      return md === today;
    });
    if (!dated) return progs;
    var onDay = keep.length - (progs.length - dated);
    ch.report = (ch.report || []).concat(onDay + ' of ' + dated + ' dated programmes are from today, ' + today);
    return keep;
  }

  /** Auto EPG only: keep a programme off channels of another genre (a drama on CITV, a cartoon on the sitcom channel). */
  function genreFits(ch, p) { return !window.AUTO || AUTO.genreOk(ch.id, (p.group && p.group !== 'auto' ? p.group + ' ' : '') + (p.title || '') + ' ' + (p.sub || '') + ' ' + (p.id || '').split('/')[0].replace(/[-_]/g, ' ')); }

  /** With Auto EPG on a channel is built only from the scraper's own library (the published lists, or the copy in
   *  the app when they cannot be reached). Nothing is searched for on archive.org and nothing is topped up from the
   *  hand-picked sources, so a channel the library has nothing for simply stays empty and hides itself. */
  function loadPrograms(ch, noAuto) {
    if (isAdChan(ch)) return Promise.resolve(adChannelPlan(ch));
    if (autoEpg && !noAuto && !ch.noCache && window.AUTO && AUTO.sourcesFor(ch.id)) {
      // Building a list from the scrape means running thousands of file names through the naming rules, so the
      // finished list is cached like any other: on the box that pass costs a second or two per channel. The
      // published revision is part of the key, so a newly scraped list is picked up straight away.
      return loadDataIndex().then(function (idx) {
        var rev = idx[ch.id] || '';
        var dkey = 'plan7d:' + ch.id + ':' + E.hash('v8|' + rev + '|' + epgGen);
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

  /** The Adverts channel has no files of its own: it is a run of commercial breaks of different lengths, and each one
   *  is filled with adverts from the checked catalogue as it plays (playAdBlock), the same way as the breaks inside
   *  other channels. */
  function adChannelPlan(ch) {
    var lens = [1800, 1200, 1800, 2400, 1800, 900, 3600, 1800, 1200, 2700], plan = [];
    for (var i = 0; i < 60; i++) {
      plan.push({ id: 'adbreak/' + i, item: 'adbreak', url: '', title: 'Commercial Break', sub: '', dur: lens[i % lens.length],
                  group: 'Commercial Break', show: 'Commercial Break', ad: true, adBlock: true });
    }
    ch.autoUsed = true; ch.report = []; ch.plan = plan;
    return plan;
  }

  /** Turn a published (or bundled) channel list into this channel's programmes, and store the result. */
  function buildFromData(ch, noAuto, rev, dkey) {
    return loadChannelData(ch.id, rev).then(function (rows) {
      if (!rows || !rows.length) { ch.autoUsed = true; ch.report = ['nothing in the library for this channel']; ch.plan = []; return []; }
      var progs = dedupeTitles(capShows(progsFromData(rows, ch.id).filter(function (p) {
        // a decade channel: anything with a known air date outside its decade is turned away, as a second check
        if (!decadeOk(ch, p)) return false;
        return genreFits(ch, p) && !blocked(p);
      }), 0.25));
      // hand-listed clips belong to the channel whichever way its programmes were gathered (TV Archive's BBC
      // Archive clips), and they need no lookups, so bring them in here too
      Array.prototype.push.apply(progs, namedFiles(ch));
      progs = datedToday(ch, certified(ch, progs));
      ch.autoUsed = progs.length > 0;
      ch.report = [];
      ch.plan = E.sample(progs, MAX_STORED);
      if (ch.plan.length) {
        try {                                   // drop this channel's lists from earlier revisions
          var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
            var kn = _ks[k];
            if (kn && kn !== dkey && kn.indexOf('plan7d:' + ch.id + ':') === 0) kv.removeItem(kn);
          }
        } catch (e) { /* ignore */ }
        ch.cacheT = Date.now();
        savePlan(ch);
      }
      return ch.plan;
    });
  }

  /** A channel whose sources read a published list (data/<id>.json) must notice when a new one is published, so
   *  its revision goes into the cache key. Everything else goes straight through. */
  function loadProgramsLive(ch, noAuto) {
    var reads = (ch.sources || []).map(function (s) { return s.data; }).filter(Boolean);
    if (!reads.length) return liveBuild(ch, noAuto, '');
    return loadDataIndex().then(function (idx) {
      return liveBuild(ch, noAuto, reads.map(function (d) { return d + (idx[d] || ''); }).join('|'));
    }, function () { return liveBuild(ch, noAuto, ''); });
  }

  function liveBuild(ch, noAuto, salt) {
    var auto = !noAuto && !ch.noCache && autoEpg && window.AUTO ? AUTO.sourcesFor(ch.id) : null;
    var sources = auto || ch.sources;
    ch.autoUsed = !!auto;
    var prefix = auto ? 'plan7a:' : 'plan7:';
    var key = prefix + ch.id + ':' + E.hash(JSON.stringify(sources) + (ch.perItem || '') + salt + '|v7|' + epgGen);   // bump when the naming/URL rules change so stored titles are rebuilt (how long it is kept is Options > Keep listings)
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
                        title: f[1] || '', sub: '', dur: f[2] || s.dur || 150, group: s.group, show: s.group });
        });
        return;
      }
      if (s.data) {
        // A published list (data/<id>.json, or that channel's slice of the whole library): already named and
        // already timed, so there is nothing to look up. Missing or empty means this source contributes nothing.
        chain = chain.then(function () {
          return loadDataIndex().then(function (idx) { return loadChannelData(s.data, idx[s.data] || ''); })
            .then(function (rows) {
              if (rows && rows.length) Array.prototype.push.apply(direct, progsFromData(rows, s.data).filter(function (p) { return decadeOk(ch, p); }));
            }, function () { /* nothing published for it */ });
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
        progs = progs.filter(function (p) { return !blocked(p); });
        progs = datedToday(ch, certified(ch, progs));
        if (ch.mix) progs = balanceMix(progs, ch.mix);
        progs = E.sample(progs, MAX_STORED);
        if (progs.length && !ch.noCache) {
          // forget older cached lists for this channel (earlier versions of the sources, or the old cache format)
          try {
            var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
              var kn = _ks[k];
              if (kn && kn !== key && (kn.indexOf(prefix + ch.id + ':') === 0 || kn.indexOf('lib2:' + ch.id + ':') === 0)) kv.removeItem(kn);
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

  var channels = window.CHANNELS.filter(function (c) { return !c.off; }).map(function (c) {
    return { n: c.n, id: c.id, name: c.name, sources: c.sources, maxItems: c.maxItems, perItem: c.perItem, mix: c.mix, decade: c.decade || 0, report: [], status: 'loading', sched: null };
  });

  /** True once every channel has finished loading: optional extras (artwork, advert lists) wait for this so they never compete with start-up. */
  function quiet() { return channels.every(function (c) { return c.status !== 'loading'; }); }

  function ready() {
    return channels.filter(function (c) { return c.status === 'ready'; })
      .sort(function (a, b) { return a.n - b.n; });
  }

  var statusSig = null;
  var spNoiseImg = null, spNoiseTimer = null, spLockUntil = 0, spShown = 0, spKnobs = 0;
  var spPort = {}, spSlot = 0, spLast = 0, spUsed = 0, doneSeen = {}, lastDone = null, spPics = [], spPosters = [], spCand = [], spSeen = {}, spPicsTried = 0, spPhase = 0, spTick = 0, spPic = false, spJit = false;
  /** Pull a handful of artwork from the scraper's art list so the set can flick through "channels" while it tunes. */
  /** Load the next few pictures from the shuffled list (each one is used once per start-up while there are any left). */
  function spMore(n) {
    while (n-- > 0 && spCand.length) {
      var c = spCand.shift();
      if (spPics.indexOf(c.u) >= 0 || spPosters.indexOf(c.u) >= 0) continue;
      (function (url, pl) { var im = new Image(); im.onload = function () { if (pl.indexOf(url) < 0) { pl.push(url); spFill(); } }; im.src = url; })(c.u, c.back ? spPics : spPosters);
    }
  }
  function spLoadPics() {
    if (spPicsTried) return;
    spPicsTried = 1;
    // Don't wait for the whole library (loadArt does): use the artwork list already saved on this TV straight away,
    // and only if there is none ask for art.json on its own.
    function use(idx) {
      if (!idx) return;
      var keys = Object.keys(idx).sort(function () { return Math.random() - 0.5; });
      keys.forEach(function (k) {                                  // every show once, in a random order: backdrops first, posters only for shows with none
        var e = idx[k], u = e && (e.b || e.p);
        if (!u) return;
        var isBack = !!e.b;
        spCand.push({ u: u.replace('/original_untouched/', isBack ? '/medium_landscape/' : '/medium_portrait/'), back: isBack });
      });
      spCand.sort(function (x, y) { return (y.back ? 1 : 0) - (x.back ? 1 : 0); });    // stable enough: backdrops come before posters
      spMore(30);
    }
    try {                                          // films seen on earlier runs: their posters join the shows
      var fk = kv.keys().filter(function (k) { return k && k.indexOf('film1:') === 0; }).sort(function () { return Math.random() - 0.5; }).slice(0, 40), fn = 0;
      fk.forEach(function (k) {
        var f = store.get(k), u = f && f.poster;
        if (!u || fn >= 14) return;
        fn++; u = u.replace('/original/', '/w500/');
        (function (url) { var im = new Image(); im.onload = function () { if (spPosters.indexOf(url) < 0) { spPosters.push(url); spFill(); } }; im.src = url; })(u);
      });
    } catch (e) { /* no films saved yet */ }
    var cachedIdx = null;
    try {
      kv.keys().forEach(function (k) { if (!cachedIdx && k && k.indexOf('artdb1:') === 0) { var c = store.get(k); if (c && c.idx) cachedIdx = c.idx; } });
    } catch (e) { /* none saved */ }
    if (cachedIdx) { use(cachedIdx); return; }
    getJSON(DATA_BASE + 'art.json').then(function (j) {
      var idx = {};
      Object.keys((j && j.shows) || {}).forEach(function (n) { idx[n] = j.shows[n]; });
      use(idx);
    }).then(null, function () { /* static only */ });
  }
  // Start-up TV, all moved by CSS animations (see index.html): this only makes the pieces and keeps the pictures topped up.
  var spSlots = [], spInited = false;
  function spInit() {
    if (spInited) return;
    spInited = true;
    var c = $('spnoise'), x = c.getContext('2d'), img = x.createImageData(c.width, c.height), d = img.data;     // four frames of static in one tall picture
    for (var i = 0; i < d.length; i += 4) { var v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    var box = $('spslides');
    for (var n = 0; n < 12; n++) {
      var el = document.createElement('div');
      el.className = 'spslot'; el.style.animationDelay = (n * 1.7) + 's'; el.setAttribute('data-ch', 'P--');
      // each time a picture comes round again it is a different one, on a different "channel"
      el.addEventListener('animationiteration', function (e) { if (e.animationName === 'spslot') spSet(e.target); });
      el.addEventListener('animationstart', function (e) { if (e.animationName === 'spslot') spSet(e.target); });
      box.appendChild(el); spSlots.push(el);
    }
    spFill();
  }
  function spSet(el) {
    var pool = spPics.length ? spPics : spPosters;                   // backdrops only; posters just until a backdrop has loaded
    if (!pool.length) return;
    var fresh = pool.filter(function (u) { return !spSeen[u]; });    // never one already shown, while there is a new one to show
    if (fresh.length < 8) spMore(10);                                // and keep fetching so there always is
    if (!fresh.length) { spSeen = {}; fresh = pool.slice(); }        // only when every one has been seen does it start over
    var u = fresh[(Math.random() * fresh.length) | 0], pn = 1 + ((Math.random() * 40) | 0);
    spSeen[u] = 1;
    el.style.backgroundImage = 'url("' + u + '")'; el.className = 'spslot has';
    el.setAttribute('data-ch', 'P' + (pn < 10 ? '0' : '') + pn);
  }
  /** A picture has loaded: any slot still empty can use it. */
  function spFill() { spSlots.forEach(function (el) { if (el.className.indexOf('has') < 0) spSet(el); }); }
  function renderStatus() {
    var lines = channels.map(function (c) {
      var mark = c.status === 'ready' ? '✓' : c.status === 'empty' ? '–' : '…';
      return mark + '  ' + c.n + '  ' + c.name +
        (c.status === 'ready' ? '  (' + Math.round(c.sched.total / 60) + ' min)' :
          c.status === 'empty' ? '  (nothing found)' : '');
    });
    var sig = lines.join('\n');
    if (sig !== statusSig) {        // only when a channel actually changed, not on every tick
      statusSig = sig;
      var box = $('chstatus');
      box.textContent = '';
      var done = 0, firstWait = null;
      channels.forEach(function (c, i) {
        var line = document.createElement('div');
        line.textContent = lines[i];
        if (c.status === 'ready' || c.status === 'empty') { line.className = 'done'; done++; if (!doneSeen[c.id]) { doneSeen[c.id] = 1; if (c.status === 'ready') lastDone = c; } }
        else if (!firstWait) { firstWait = c; line.className = 'cur'; }
        box.appendChild(line);
      });
      if (lastDone) $('spcount').textContent = lastDone.n + '  ' + lastDone.name;
    }
    spLoadPics();
    spInit();
    var on = Math.min(7, 1 + Math.floor(Date.now() / 400) % 7);
    var bars = $('bars').children;
    for (var i = 0; i < bars.length; i++) {
      var cn = i < on ? 'on' : '';
      if (bars[i].className !== cn) bars[i].className = cn;
    }
  }

  // ------------------------------------------------------------------ real episode names (TVmaze, free, no key)

  // How long artwork and episode details are kept before they are looked up again (Options > Keep artwork).
  var META_KEEP = [
    { id: '1w', label: '1 week', ms: 7 * 24 * 3600 * 1000 },
    { id: '4w', label: '4 weeks', ms: 28 * 24 * 3600 * 1000 },
    { id: 'perm', label: 'Permanent', ms: Infinity }
  ];
  var metaIdx = 2;
  (function () { var id = store.get('metakeep1'); for (var i = 0; i < META_KEEP.length; i++) if (META_KEEP[i].id === id) metaIdx = i; })();
  function metaTtl() { return META_KEEP[metaIdx].ms; }
  /** An entry has its own expiry (x) when it records a failure or a miss that should be tried again soon. */
  function metaFresh(c) { return !!c && (c.x ? Date.now() < c.x : Date.now() - c.t < metaTtl()); }
  var TVM_MISS = 5 * 24 * 3600 * 1000;   // a show TVmaze does not have: remember that too, but re-check sooner
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
    if (metaFresh(c)) return Promise.resolve(c.eps);
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
      var m = /^(.*?)\s+S(\d{1,4})([ED])(\d{1,3})(?:\s+(.*))?$/.exec(p.title || '');
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
              if (it.disc) it.p.title = it.p.title.replace(/\bS(\d{1,4})D(\d{1,3})\b/, 'S$1E$2');   // disc number shown as episode
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
  /** Show names we already know (the scraper's genre lists), longest first, for reading a show out of a messy title. */
  function normWords(s) {
    return ' ' + String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/['\u2019]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '') + ' ';
  }
  var KNOWN_SHOWS = (function () {
    var out = [], seen = {};
    if (window.AUTO && AUTO.SHOWS) Object.keys(AUTO.SHOWS).forEach(function (c) {
      AUTO.SHOWS[c].forEach(function (n) {
        var k = normWords(n).trim();
        if (k.length > 2 && !seen[k]) { seen[k] = 1; out.push({ k: k, name: n }); }
      });
    });
    return out.sort(function (a, b) { return b.k.length - a.k.length; });
  })();
  function knownShowIn(text) {
    var t = normWords(text);
    for (var i = 0; i < KNOWN_SHOWS.length; i++) {
      var k = KNOWN_SHOWS[i].k;
      // same rule as the genre guard: a one-word name must not be running into a different title
      if (t.indexOf(' ' + k + ' ') >= 0 && (!AUTO.okAfter || AUTO.okAfter(t, k))) return KNOWN_SHOWS[i].name;
    }
    return '';
  }

  function parseTitle(title) {
    var t = String(title || '').trim();
    var m = /^(.*?)\s+S(\d{1,4})[ED](\d{1,3})\b/.exec(t);
    var show, res = {};
    if (m) { show = m[1]; res.s = +m[2]; res.e = +m[3]; }
    else show = t.replace(/\s*\(.*$/, '').replace(/\s+(Series|Season)\s+\d+.*$/i, '').replace(/\s+[-\u2013]\s+.*$/, '');
    show = show.split(/\s+[-\u2013]\s+/).pop();                       // "Shows - Show S1E2" -> the part next to the code
    var y = /\b((?:19|20)\d\d)\b/.exec(show);
    if (y) { res.year = +y[1]; show = show.replace(/\s*\(?\b(?:19|20)\d\d\b\)?\s*/g, ' '); }
    res.show = show.replace(/[\s\-\u2013:]+$/, '').trim();
    // "Last of the Summer Wine - Christmas Special S01E01" would otherwise look up "Christmas Special"
    var known = knownShowIn(res.show) || knownShowIn(t);
    if (known) res.show = known;
    return res;
  }

  // ------------------------------------------------------------------ artwork the scraper already found (data/art.json)
  //
  // The scraper looks each show up once and publishes the answers: poster, backdrop, summary and so on, keyed by
  // the show's name. Every TV then has its artwork from the first visit, with no searching TVmaze one request at
  // a time. A show it does not list falls back to the live TVmaze lookup below, so this only ever adds.
  //   { format:"telly-addicts-art", v:1, rev, shows:{ "Bergerac": { p:poster, b:backdrop, s:summary, y:year,
  //     e:ended, n:network, g:"Crime, Drama", r:rating, i:tvmazeId } } }
  var artRev = '', artP = null, artIdx = null;

  function loadArt() {
    if (artP) return artP;
    artP = loadDataIndex().then(function () {
      var key = 'artdb1:' + (artRev || 'latest'), c = store.get(key);
      var fresh = c && c.idx && (artRev || Date.now() - c.t < 6 * 3600 * 1000);
      if (fresh) { artIdx = c.idx; return c.idx; }
      return getJSON(DATA_BASE + 'art.json').then(function (j) {
        var idx = {};
        Object.keys((j && j.shows) || {}).forEach(function (n) { idx[normShow(n)] = j.shows[n]; });
        try {                                          // only the newest copy is kept
          var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
            var kn = _ks[k];
            if (kn && kn !== key && kn.indexOf('artdb1:') === 0) kv.removeItem(kn);
          }
        } catch (e) { /* ignore */ }
        store.set(key, { t: Date.now(), idx: idx });
        artIdx = idx;
        return idx;
      }).then(null, function () { artIdx = (c && c.idx) || null; return artIdx; });      // not published yet, or offline
    }).then(null, function () { return null; });
    return artP;
  }

  /** The scraper's artwork entry for a show, or null. A longer title ("Bergerac Christmas Special") also finds its show. */
  function artShow(name) {
    var fx = name ? store.get('artfix:' + normShow(name)) : null;
    if (fx && fx.a) return Promise.resolve(fx.a);        // picked by hand on this TV
    return loadArt().then(function (idx) {
      if (!idx || !name) return null;
      var words = String(name).split(/\s+/);
      for (var n = words.length; n >= 1; n--) {
        var hit = idx[normShow(words.slice(0, n).join(' '))];
        if (hit && (n > 1 || words.length === 1)) return hit;
      }
      return null;
    });
  }

  /** TVmaze-shaped details for the Info screen from an art.json entry. */
  function showFromArt(a, name) {
    return {
      name: a.name || name, year: a.y ? String(a.y) : '', ended: a.e ? String(a.e) : '', network: a.n || '',
      genres: a.g || '', rating: +a.r || 0, summary: a.s || '', poster: https(a.p), background: https(a.b), id: a.i || 0
    };
  }

  /**
   * The artwork already on hand for a programme, found without any request, so it can be on screen the instant a
   * channel is chosen: a film's poster, the scraper's art.json, or what was looked up the last time this show was on.
   * null when there is none yet (the show is looked up in the background, so next time there is).
   */
  var FILM_NAMES = null;
  function isFilmChannelName(n) {
    if (!FILM_NAMES) { FILM_NAMES = {}; channels.forEach(function (c) { if (OD_FILMS[c.id]) FILM_NAMES[normShow(c.name)] = 1; }); }
    return !!FILM_NAMES[normShow(n)];
  }
  function knownArt(prog) {
    if (!gartOn || !prog || prog.ad) return null;
    var film = filmFor(prog);
    if (film) return film.poster ? { poster: film.poster, back: '' } : null;
    var p = parseTitle(prog.title || '');
    if (prog.show) p.show = prog.show;
    if (!p.show) return null;
    if (isFilmChannelName(p.show)) return null;      // "The Video Shop" / "Kids Movies" are channels, not shows: never look them up for a poster
    if (!artP) loadArt();
    var out = { poster: '', back: '' };
    var fxa = store.get('artfix:' + normShow(p.show));
    var a = (fxa && fxa.a) || artIdx && (function () {
      var w = p.show.split(/\s+/);
      for (var n = w.length; n >= 1; n--) { var h = artIdx[normShow(w.slice(0, n).join(' '))]; if (h && (n > 1 || w.length === 1)) return h; }
      return null;
    })();
    if (a) { out.poster = https(a.p); out.back = https(a.b); }
    if (!out.poster || !out.back) {
      var i = store.get('info3:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0));
      if (i && i.d && i.d.show) { out.poster = out.poster || i.d.show.poster || ''; out.back = out.back || i.d.show.background || ''; }
      var g = store.get('art2:' + normShow(p.show));
      if (g && g.d && g.d.background) out.back = out.back || g.d.background;
    }
    return out.poster || out.back ? out : null;
  }

  function tvmFindShow(name, year) {
    return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name)).then(function (list) {
      return pickShow(list, name, year);
    });
  }

  function tvmInfo(p) {
    return artShow(p.show).then(function (a) { return a ? infoFromArt(a, p) : tvmInfoLive(p); });
  }

  /** From the scraper's entry: no search at all, and at most one request (this episode's details, when the id is known). */
  function infoFromArt(a, p) {
    var d = { show: showFromArt(a, p.show), ep: null };
    if (!p.e || !a.i) return Promise.resolve(d);
    var key = 'info3:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0), c = store.get(key);
    if (c && c.d && c.d.ep && metaFresh(c)) return Promise.resolve(Object.assign({}, d, { ep: c.d.ep }));
    var job = tvmChain.then(function () { return getJSON('https://api.tvmaze.com/shows/' + a.i + '/episodes'); }).then(function (eps) {
      var hit = (eps || []).filter(function (e) { return e.season === p.s && e.number === p.e; })[0];
      if (hit) d.ep = { name: hit.name, season: hit.season, number: hit.number, airdate: hit.airdate || '', runtime: hit.runtime || 0, summary: plain(hit.summary), image: https(hit.image && (hit.image.original || hit.image.medium)) };
      if (d.ep) store.set(key, { t: Date.now(), d: d });
      return d;
    }, function () { return d; });
    tvmChain = job.then(function () { return wait(400); }, function () { return wait(400); });
    return job;
  }

  function tvmInfoLive(p) {
    var key = 'info3:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0);
    var c = store.get(key);
    if (c && (c.d ? metaFresh(c) : Date.now() - c.t < TVM_MISS)) return Promise.resolve(c.d);
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
        summary: plain(sh.summary), poster: https(sh.image && (sh.image.original || sh.image.medium)), background: '', id: sh.id
      }, ep: null };
      return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/images'); }).then(function (imgs) {
        var bg = (imgs || []).filter(function (x) { return x.type === 'background'; })[0];
        if (bg && bg.resolutions && bg.resolutions.original) d.show.background = https(bg.resolutions.original.url);
        if (!d.show.poster) { var pp = (imgs || []).filter(function (x) { return x.type === 'poster'; })[0]; if (pp) d.show.poster = https(pp.resolutions.original.url); }
      }, function () { d.picsFailed = true; /* no extra pictures: try again soon */ }).then(function () {
        if (!p.e) return d;
        return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/episodes'); }).then(function (eps) {
          var hit = (eps || []).filter(function (e) { return e.season === p.s && e.number === p.e; })[0];
          if (hit) d.ep = { name: hit.name, season: hit.season, number: hit.number, airdate: hit.airdate || '', runtime: hit.runtime || 0, summary: plain(hit.summary), image: https(hit.image && (hit.image.original || hit.image.medium)) };
          return d;
        }, function () { return d; });
      });
    });
    tvmChain = job.then(function () { return wait(400); }, function () { return wait(400); });
    return job.then(function (d) {
      // a show with no pictures only because that request failed is looked at again in an hour, not in a month
      var retry = d && d.picsFailed;
      if (d) delete d.picsFailed;
      store.set(key, { t: Date.now(), x: retry ? Date.now() + 3600 * 1000 : 0, d: d || null });
      return d;
    });
  }

  // fanart for the TV guide: just the show's backdrop (search + images), cached for a month
  function tvmArt(p) {
    return artShow(p.show).then(function (a) { return a && a.b ? { background: https(a.b) } : tvmArtLive(p); });
  }

  function tvmArtLive(p) {
    var key = 'art2:' + normShow(p.show);
    var c = store.get(key);
    if (metaFresh(c)) return Promise.resolve(c.d);
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
      if (!sh) return { background: '', miss: true };
      return wait(400).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/images'); }).then(function (imgs) {
        var bg = (imgs || []).filter(function (x) { return x.type === 'background'; })[0];
        return { background: bg && bg.resolutions && bg.resolutions.original ? https(bg.resolutions.original.url) : '' };
      }, function () { return { background: '', failed: true }; });     // rate-limited or offline: not that the show has none
    });
    tvmChain = job.then(function () { return wait(400); }, function () { return wait(400); });
    return job.then(function (d) {
      // A show TVmaze does not have is re-checked in days, and a request that merely failed in an hour; only a real
      // answer is kept for a month. Remembering a failure for a month is how shows went without artwork for good.
      var until = d.failed ? Date.now() + 3600 * 1000 : d.miss ? Date.now() + TVM_MISS : 0;
      store.set(key, { t: Date.now(), x: until, d: { background: d.background } });
      return d;
    });
  }


  // ------------------------------------------------------------------ background artwork scan
  //
  // Some shows have no picture or details in the scraper's artwork list, and the lookup On Demand makes when you
  // reach one can miss. Once the channels have loaded this quietly looks those shows up on TVmaze, one at a time
  // and slowly, and keeps what it finds with the rest of the artwork. It pauses while On Demand is open, gives up
  // after a run of failures, and having finished it does not run again until the channels are rebuilt (Refresh EPG)
  // or the library changes.
  var artScan = { running: false, fails: 0 };
  function artScanKey() { return epgGen + ':' + (artRev || '') + ':' + E.hash(JSON.stringify(libRevs || {})); }
  function artScanStart() {
    if (artScan.running || !gartOn) return;
    var key = artScanKey();
    if (store.get('artscan_run') === key) return;                       // already done for this library and EPG build
    artScan.running = true; artScan.fails = 0;
    Promise.all([loadArt(), libP || Promise.resolve(null)]).then(function () {
      var names = {}, list = [];
      function add(n) { if (n && n.length > 1 && !names[normShow(n)]) { names[normShow(n)] = n; list.push(n); } }
      return (libP || Promise.resolve(null)).then(function (routed) {
        if (routed) Object.keys(routed).forEach(function (ch) {
          routed[ch].forEach(function (it) {
            var film = false;
            if (it.m) for (var f in it.m) if (it.m.hasOwnProperty(f) && (it.m[f].film || it.m[f].song)) film = true;
            if (film) return;
            if (it.s) add(it.s); else (it.f || []).forEach(function (f) { if (Array.isArray(f)) add(f[1]); });
          });
        });
        else channels.forEach(function (c) { if (OD_FILMS[c.id]) return; (c.plan || []).forEach(function (p) { if (!p.filmKey && !p.ad) add(p.show || p.group); }); });
        var noPic = [], noBack = [];
        list.forEach(function (n) {
          var m = store.get('artscan1:' + normShow(n));
          if (m && Date.now() - m.t < TVM_MISS) return;               // TVmaze had nothing a few days ago
          var k = knownArt({ title: n, show: n });
          if (!k || !k.poster) noPic.push(n); else if (!k.back) noBack.push(n);
        });
        return noPic.concat(noBack);
      });
    }).then(function (queue) {
      var found = 0, missed = 0, total = queue.length;
      dlog('ARTSCAN start: ' + total + ' shows to look up');
      function finish(done) {
        artScan.running = false;
        if (done) store.set('artscan_run', key);
        dlog('ARTSCAN ' + (done ? 'done' : 'stopped (will try again next time)') + ': ' + found + ' found, ' + missed + ' with no match, ' + queue.length + ' left');
        odKGen++;
      }
      (function step() {
        if (!queue.length) { finish(true); return; }
        if (odOpen || odm || !gartOn) { setTimeout(step, 8000); return; }     // never compete with On Demand
        var name = queue.shift();
        artScanOne(name).then(function (r) {
          if (r === 'found') found++; else if (r === 'miss') missed++;
          if (r === 'fail') { if (++artScan.fails >= 5) { queue.unshift(name); finish(false); return; } } else artScan.fails = 0;
          setTimeout(step, 1500);
        });
      })();
    }, function () { artScan.running = false; });
  }
  function artScanOne(name) {
    var nk = normShow(name), words = name.split(/\s+/), tries = [name];
    if (words.length > 3) tries.push(words.slice(0, 3).join(' '));
    if (words.length > 2) tries.push(words.slice(0, 2).join(' '));
    function search(i) {
      if (i >= tries.length) return Promise.resolve(null);
      return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(tries[i])).then(function (l) {
        return pickShow(l, tries[i], 0) || wait(700).then(function () { return search(i + 1); });
      });
    }
    return search(0).then(function (sh) {
      if (!sh) { store.set('artscan1:' + nk, { t: Date.now() }); return 'miss'; }
      return wait(600).then(function () { return getJSON('https://api.tvmaze.com/shows/' + sh.id + '/images'); }).then(function (imgs) {
        var bg = (imgs || []).filter(function (x) { return x.type === 'background'; })[0];
        var poster = https(sh.image && (sh.image.original || sh.image.medium));
        if (!poster) { var pp = (imgs || []).filter(function (x) { return x.type === 'poster'; })[0]; if (pp && pp.resolutions && pp.resolutions.original) poster = https(pp.resolutions.original.url); }
        var key = 'info3:' + nk + ':0:0', old = store.get(key), os = old && old.d && old.d.show || {};
        var show = {
          name: sh.name, year: sh.premiered ? String(sh.premiered).slice(0, 4) : '', ended: sh.ended ? String(sh.ended).slice(0, 4) : '',
          network: (sh.network && sh.network.name) || (sh.webChannel && sh.webChannel.name) || '',
          genres: (sh.genres || []).slice(0, 3).join(', '), rating: sh.rating && sh.rating.average || 0, summary: plain(sh.summary),
          poster: os.poster || poster, background: os.background || (bg && bg.resolutions && bg.resolutions.original ? https(bg.resolutions.original.url) : ''), id: sh.id
        };
        store.set(key, { t: Date.now(), x: 0, d: { show: show, ep: null } });
        if (!show.poster && !show.background) store.set('artscan1:' + nk, { t: Date.now() });
        return show.poster || show.background ? 'found' : 'miss';
      });
    }).then(null, function () { return 'fail'; });          // rate-limited or offline: not that TVmaze has nothing
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
      var film = filmFor(prog);
      if (film) {
        if (film.poster && gartFor === title) { el.style.backgroundImage = 'url("' + film.poster + '")'; el.className = 'on'; }
        return;
      }
      var p = parseTitle(title);
      if (prog && prog.show) p.show = prog.show;
      if (!p.show) return;
      tvmArt(p).then(function (a) {
        if (gartFor !== title || !a || !a.background) return;
        el.style.backgroundImage = 'url("' + a.background + '")';
        el.className = 'on';
      }, function () { /* no artwork */ });
    }, 1200);
  }

  function openInfo(over) {
    var cp = over || cur;          // a programme picked in the guide, or what is playing
    if (!cp) return;
    if (!over) reportProgramme('Info opened');
    infoOpen = true;
    var token = ++infoToken;
    var title = cp.prog.title || '';
    $('info').className = '';
    $('ibg').style.backgroundImage = 'none';
    $('iposter').className = 'hidden';
    $('ishow').textContent = title;
    $('iep').textContent = '';
    $('imeta').textContent = cp.ch.name;
    $('isum').textContent = '';
    $('icast').textContent = '';
    $('isrc').textContent = 'Looking up details…   (Back to close)';
    if (cp.ad) { $('isum').textContent = 'An advert between programmes: ' + decodeURIComponent(String(cp.prog.url || '').replace('https://archive.org/download/', '')); $('isrc').textContent = 'Back to close'; return; }
    var film = filmFor(cp.prog);
    if (film) { showFilmInfo(film, cp); return; }                 // a film: TMDb already told us everything
    var p = parseTitle(title);
    if (cp.prog && cp.prog.show) p.show = cp.prog.show;
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
      if (s.id) tvmCast(s.id).then(function (list) { if (token === infoToken && infoOpen) showCast(list); });
    }, function () {
      if (token !== infoToken || !infoOpen) return;
      $('isum').textContent = 'Could not look this up right now.';
      $('isrc').textContent = 'Back to close';
    });
  }

  /** The main cast of a show (TVmaze, free): name, character and a photo. Kept once per show. */
  function tvmCast(id) {
    var key = 'cast1:' + id, c = store.get(key);
    if (c && metaFresh(c)) return Promise.resolve(c.l || []);
    return getJSON('https://api.tvmaze.com/shows/' + id + '/cast').then(function (rows) {
      var seen = {}, l = [];
      (rows || []).forEach(function (r) {
        var p = r && r.person; if (!p || seen[p.id]) return; seen[p.id] = 1;
        l.push({ n: p.name || '', c: (r.character && r.character.name) || '', p: https(p.image && (p.image.medium || p.image.original)) });
      });
      l = l.slice(0, 10);
      store.set(key, { t: Date.now(), l: l });
      return l;
    }, function () { return (c && c.l) || []; });
  }
  /** A row of round photos on the Info screen. A film's cast comes with the scraper's film details. */
  function showCast(list) {
    var box = $('icast');
    box.textContent = '';
    (list || []).slice(0, 8).forEach(function (m) {
      if (!m || !m.n) return;
      var card = document.createElement('div'); card.className = 'icm';
      var ph = document.createElement('div'); ph.className = 'icp';
      if (m.p) ph.style.backgroundImage = 'url("' + m.p + '")'; else ph.textContent = m.n.charAt(0);
      var nm = document.createElement('b'); nm.textContent = m.n;
      card.appendChild(ph); card.appendChild(nm);
      if (m.c) { var ch = document.createElement('small'); ch.textContent = m.c; card.appendChild(ch); }
      box.appendChild(card);
    });
  }

  /** A film's Info screen, straight from the details the scraper gathered: no lookup, so it is up at once. */
  function showFilmInfo(f, cp) {
    $('ishow').textContent = f.title || (cp.prog.title || '');
    var bits = [];
    if (f.released) bits.push(String(f.released).slice(0, 4));
    if (f.cert) bits.push(f.cert);
    if (f.genres) bits.push(f.genres);
    if (f.mins) bits.push(f.mins + ' min');
    bits.push(cp.ch.name);
    $('imeta').textContent = bits.join('   ·   ');
    var box = $('isum');
    box.textContent = '';
    if (f.plot) { var el = document.createElement('p'); el.textContent = f.plot; box.appendChild(el); }
    if (f.poster) {
      var ph = $('iposter');
      ph.src = f.poster; ph.className = '';
      $('ibg').style.backgroundImage = 'url("' + f.poster + '")';
    }
    // just where it came from, as the TVmaze screens say. The credit TMDb's terms ask for, with their logo,
    // lives in Options > About & credits rather than on top of every film.
    $('isrc').textContent = 'Details from TMDB   ·   Back to close';
    showCast(f.cast);
  }

  function closeInfo() {
    infoOpen = false;
    infoToken++;
    $('info').className = 'hidden';
  }

  // ------------------------------------------------------------------ tuning static

  var sToken = 0, sbHoldUntil = 0, sbHoldTimer = null;
  var audioCtx = null, noiseNode = null, noiseGain = null;
  var MIN_STATIC_MS = 1500;     // when tuning, the little TV stays up at least this long, so it is seen and not a flash
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
      noiseGain.gain.value = 0.03;
    } catch (e) { /* audio is optional */ }
  }

  function stopHiss() {
    try { if (noiseGain) noiseGain.gain.value = 0; } catch (e) { /* ignore */ }
  }

  /** Changing channel: the "Please stand by" TV comes up at once (the programme's art on its screen, or static if
   *  there is none) with a short hiss, instead of a full-screen burst of static. */
  function showStatic() {
    var tok = ++sToken;
    startHiss();
    sbHoldUntil = Date.now() + MIN_STATIC_MS;
    renderStandby(true);
    setTimeout(function () { if (tok === sToken) stopHiss(); }, 2000);     // the hiss never lasts more than about 2 seconds
  }

  function hideStatic() { stopHiss(); }

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
    var next = cur.od ? odPeek() : sched.order[(cur.index + 1) % sched.order.length];
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
  // ---- the backup player (player.js, NativePlayer.java): Auto = the web view first, the app's own player for files
  // it cannot play (remembered, so the next time they go straight there); Standard only; Always.
  var PLAYERS = [{ id: 'auto', label: 'Auto' }, { id: 'off', label: 'Standard only' }, { id: 'always', label: 'Always backup' }];
  var playerIdx = (function () { var s = store.get('player1'); for (var i = 0; i < PLAYERS.length; i++) if (PLAYERS[i].id === s) return i; return 0; })();
  var npKnown = store.get('np1') || {};                // file -> when it needed the backup player
  function playerMode() { return PLAYERS[playerIdx].id; }
  v.wantNative = function () {
    var m = playerMode();
    if (m === 'off') return false;
    if (m === 'always') return true;
    var t = cur && cur.prog && cur.prog.url && npKnown[cur.prog.url];
    return !!(t && Date.now() - t < 30 * 86400000);      // a file that needed it a month ago may have been replaced since
  };
  function backupSwitch(why) {
    if (playerMode() === 'off' || v.native || !v.canNative() || !cur || !cur.prog || !cur.prog.url) return false;
    if (!v.switchToNative()) return false;
    npKnown[cur.prog.url] = Date.now();
    var ks = Object.keys(npKnown);
    if (ks.length > 400) ks.sort(function (a, b) { return npKnown[a] - npKnown[b]; }).slice(0, ks.length - 400).forEach(function (k) { delete npKnown[k]; });
    store.set('np1', npKnown);
    dlog('BACKUP PLAYER ' + (cur.prog.title || '') + ': ' + why + ' in the web view, carrying on in the app\u2019s own player');
    return true;
  }
  function changePlayer(d) {
    playerIdx = (playerIdx + d + PLAYERS.length) % PLAYERS.length;
    store.set('player1', PLAYERS[playerIdx].id);
    renderOpts();
  }
  function pbStart(url, offset) { pb = { t0: Date.now(), ev: [], url: url, offset: offset || 0 }; }
  ['loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'playing', 'waiting', 'stalled', 'seeked', 'error'].forEach(function (n) {
    v.addEventListener(n, function () {
      if (pb.ev.length < 14) pb.ev.push(n + ' ' + ((Date.now() - pb.t0) / 1000).toFixed(1) + 's');
    });
  });
  /** Where the player has got to, in the browser's own terms, for the debug log. */
  function playState() {
    var err = v.error ? 'error ' + v.error.code + (v.error.message ? ' "' + v.error.message + '"' : '') + ', ' : '';
    return err + 'ready ' + v.readyState + ', network ' + v.networkState + ', at ' + Math.round(v.currentTime || 0) + 's, events: ' + (pb.ev.join(', ') || 'none');
  }
  v.addEventListener('loadedmetadata', function () {
    // a file much shorter than the listing says is usually not the programme it was filed as
    if (!cur || cur.ad || !cur.prog || !(cur.prog.dur > 0) || !(v.duration > 0) || cur.mism === cur.prog.url) return;
    if (v.duration < cur.prog.dur * 0.7 || (cur.prog.lenKnown && v.duration > cur.prog.dur * 1.4)) {
      cur.mism = cur.prog.url;
      dlog('MISMATCH the listing expects ' + mins(cur.prog.dur) + ' but the file is ' + mins(v.duration));
      reportProgramme('length does not match');
    }
  });
  v.addEventListener('playing', function () {
    if (pb.said) return;
    pb.said = true;
    dlog('  ok, playing after ' + ((Date.now() - pb.t0) / 1000).toFixed(1) + 's' + (cur && cur.ad ? ' (advert)' : ''));
    // sound but no picture (an audio-only file, or a video track this TV cannot decode): log it and move on
    var watched = cur;
    setTimeout(function () {
      if (cur !== watched || !cur || v.paused || !(v.currentTime > 2)) return;
      var q = v.getVideoPlaybackQuality ? v.getVideoPlaybackQuality() : null;
      if (v.videoWidth > 0 && !(q && q.totalVideoFrames === 0)) return;
      dlog('NO PICTURE ' + (cur.prog ? (cur.prog.title || '') : '') + ': sound is playing but the video shows no frames (size ' + v.videoWidth + 'x' + v.videoHeight + ', frames ' + (q ? q.totalVideoFrames : '?') + ')');
      if (cur.ad || !cur.prog) return;
      markSlow(cur.prog.id); nextInChannel();
    }, 5000);
  });
  // The reverse: a picture but no sound. A file whose audio this TV cannot decode (AC3/DTS in an .mkv, mostly) plays
  // in silence with nothing to say so. The page can see how many audio bytes were decoded.
  v.addEventListener('playing', function () {
    var watched = cur;
    setTimeout(function () {
      if (cur !== watched || !cur || cur.ad || !cur.prog || v.paused || v.muted || !(v.currentTime > 3)) return;
      if (typeof v.webkitAudioDecodedByteCount !== 'number' || v.webkitAudioDecodedByteCount > 0) return;
      var mkv = !/\.(mp4|m4v)(\?|$)/i.test(cur.prog.url || '');
      if (backupSwitch('no sound')) return;
      dlog('NO SOUND ' + (cur.prog.title || '') + ': the picture plays but no audio was decoded (' + (mkv ? 'not an mp4: probably audio this TV cannot play' : 'an mp4, so it may simply have no sound') + ')');
      if (!mkv) return;
      markSlow(cur.prog.id);
      if (cur.od) toast('No sound on this file. In the guide, hold OK on it and choose Try another version', 6000);
      else nextInChannel();
    }, 6000);
  });
  v.addEventListener('error', function () {
    dlog('FAILED ' + (cur && cur.ad ? 'advert ' : '') + (cur && cur.prog ? (cur.prog.title || '') : '') + ' (' + playState() + ')');
    diagnose(pb.url);
  });
  /** How far into the programme the picture is loaded: the end of the stretch the player holds around now. */
  function loadedTo() {
    try {
      var b = v.buffered, at = v.currentTime;
      for (var i = 0; i < b.length; i++) if (b.start(i) <= at + 0.5 && b.end(i) >= at) return b.end(i);
      return b.length ? b.end(b.length - 1) : 0;
    } catch (e) { return 0; }                  // some players refuse buffered until a frame has shown
  }
  /** True when the picture is coming off this device's own copy rather than straight from archive.org. */
  function playingLocally() { return String(v.currentSrc || v.src || '').indexOf('http://127.0.0.1:') === 0; }

  function pbText() {
    var o = pb.offset ? 'joined ' + fmtPos(pb.offset) + ' in   ' : 'from start   ';
    var ahead = Math.max(0, Math.round(loadedTo() - v.currentTime));
    var how = !BUF[bufIdx].mb ? 'Buffer off: playing from archive.org'
            : playingLocally() ? 'Buffer on (' + BUF[bufIdx].label + '): playing from this device'
            : 'Buffer set to ' + BUF[bufIdx].label + ' but this programme is playing from archive.org';
    return (cur && cur.prog && isSlow(cur.prog.id) ? 'Slow to start: will be left out of the lineup next time.   ' : '') +
      'Playback: ' + o + (pb.ev.join(' \u00b7 ') || 'no events yet') + '   (readyState ' + v.readyState + ')' +
      '\n' + how + '   \u00b7   ' + fmtPos(ahead) + ' loaded ahead';
  }

  function playSlot(ch, index, offset, announce, tuning, progOverride) {
    var prog = progOverride || ch.sched.order[index];   // progOverride: Play Next plays an episode that is not in the schedule
    cur = { ch: ch, index: index, prog: prog, errors: cur && cur.ch === ch ? cur.errors : 0 };
    v.dataset.offset = String(offset || 0);
    pbStart(prog.url, offset);
    if (prog.adBlock) { playAdBlock(ch, index, offset, announce, tuning); return; }
    var meOne = cur;
    setTimeout(function () {
      if (cur === meOne && v.readyState < 1 && !meOne.ad) {       // never even got the file header: move on
        dlog('GAVE UP after 30s: nothing arrived at all (' + playState() + ')');
        diagnose(prog.url); markSlow(prog.id); nextInChannel();
      }
    }, 30000);
    setTimeout(function () {
      // header arrived but it still can't play 25 s in (slow index/seek on a mid-programme join): move on, and remember it
      if (cur === meOne && !meOne.ad && !meOne.played && v.readyState < 3) {    // not one that did start and then paused to buffer
        dlog('GAVE UP after 25s: it never got going (' + playState() + ')');
        diagnose(prog.url); markSlow(prog.id); nextInChannel();
      }
    }, 25000);
    v.src = playUrl(prog.url);      // buffered through this device when Options > Buffer is on
    dlog('PLAY ' + ch.n + ' ' + ch.name + ' | ' + (prog.title || '?') + ' | from ' + Math.round(offset || 0) + 's of ' + Math.round(prog.dur || 0) + 's | ' +
      (v.src.indexOf('http://127.0.0.1') === 0 ? 'buffered' : 'direct') + ' | ' + prog.url);
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked or interrupted; error handler covers failures */ });
    store.set('last', ch.id);
    if (tuning) showStatic();   // static only when changing channel, not between episodes or ads
    if (announce) showBanner();
    loadAds(ch);
    setTimeout(function () { if (cur === meOne) osdArt(); }, 4000);   // have the artwork ready before the OSD is opened
  }

  /** A commercial break on the Adverts channel: adverts for the rest of the block, starting wherever the clock has us.
   *  The adverts are fetched first on a fresh start, so wait (a little) for them rather than skipping on. */
  function playAdBlock(ch, index, offset, announce, tuning, tries) {
    var prog = ch.sched.order[index], me = cur;
    if (tuning) showStatic();
    if (announce) showBanner();
    loadAds(ch, true);
    if (!adPool(ch).length) {
      if ((tries || 0) >= 20) { showNoSignal('No adverts could be loaded. Trying again shortly...'); setTimeout(function () { hideNoSignal(); if (cur === me) tune(ch, false, true); }, 8000); return; }
      setTimeout(function () { if (cur === me) playAdBlock(ch, index, offset, false, false, (tries || 0) + 1); }, 1500);
      return;
    }
    var left = Math.max(10, (prog.dur || 1800) - (offset || 0));
    store.set('last', ch.id);
    playAd(ch, index, left);
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
    return saved === 'off' ? 'off' : 'all';      // adverts are simply on or off: each break picks adverts from the programme's own year (or the channel's decade)
  })();
  var adsRev = '', adCatP = null;        // the scraper's checked advert catalogue, when it has published one
  var adPools = {};                     // 'genre:era' -> filtered adverts (shared by every channel of that genre)
  var AD_TTL = 7 * 24 * 3600 * 1000;
  /** Real television lists the breaks inside the programme's time, so do the same: a programme on a channel that has
   *  breaks (and is long enough to have one) is listed a break longer, and the adverts fill the end of its slot.
   *  Films never get one, and neither does anything shorter than a quarter of an hour. */
  var BREAK_MIN = 900;
  function breakFor(ch, p) {
    var cat = ADS.categoryFor(ch.id);
    if (!cat || adEra === 'off' || p.filmKey || p.song || p.ad || !(p.dur >= BREAK_MIN)) return 0;
    return ADS.CATS[cat].breakSec;
  }
  function withBreaks(ch, progs) {
    if (!ADS.categoryFor(ch.id) || adEra === 'off') return progs;
    return progs.map(function (p) {
      var b = breakFor(ch, p);
      if (!b) return p;
      var q = {}; for (var k in p) if (p.hasOwnProperty(k)) q[k] = p[k];
      q.dur = p.dur + b; q.adPad = b;
      return q;
    });
  }
  var adRecent = [];                    // adverts shown lately, so a break does not repeat one
  function adYear(ch, prog) {
    var y = prog && prog.aired ? parseInt(String(prog.aired).slice(0, 4), 10) : 0;
    if (y >= 1970 && y <= 1999) return y;
    return ch.decade ? ch.decade + 5 : 0;      // a decade channel: the middle of the decade
  }
  /** The Adverts channel is all adverts, so with the break setting Off it still plays them, from every era. */
  function isAdChan(ch) { return !!ch && ch.id === 'adbreak'; }
  function eraFor(ch) { return isAdChan(ch) && adEra === 'off' ? 'all' : adEra; }
  /** 'only' on a Christmas channel, 'off' elsewhere until December (then they join every break). */
  function xmasMode(ch) { return ADS.isXmasChannel(ch.id) ? 'only' : (new Date().getMonth() === 11 ? 'on' : 'off'); }
  function adKey(ch) { var cat = ADS.categoryFor(ch.id), era = eraFor(ch); return cat && era !== 'off' ? cat + ':' + era + ':' + xmasMode(ch) : null; }
  function loadAdCatalogue() {
    if (adCatP) return adCatP;
    var ck = 'adcat1:' + adsRev, hit = store.get(ck);
    if (hit && hit.length) return (adCatP = Promise.resolve(hit));
    adCatP = getJSON(DATA_BASE + 'adverts.json').then(function (j) {
      var list = (j && j.format === 'telly-addicts-adverts' && j.adverts) || [];
      if (list.length) {
        try { var ks = kv.keys(); for (var i = 0; i < ks.length; i++) if (/^adcat1:/.test(ks[i]) && ks[i] !== ck) kv.removeItem(ks[i]); } catch (e) { /* nothing to tidy */ }
        store.set(ck, list);
      }
      return list;
    });
    return adCatP;
  }
  function loadAds(ch, soon) {
    var key = adKey(ch);
    if (!key || adPools[key]) return;
    var cat = ADS.categoryFor(ch.id), era = eraFor(ch);
    var cached = store.get('ads2:' + key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < AD_TTL) { adPools[key] = unpackPlan(cached.p); return; }
    adPools[key] = [];                  // being fetched (or nothing found): breaks are skipped, and it is not retried until the next launch
    if (adsRev) {                       // the checked catalogue: one small file, no searching
      loadAdCatalogue().then(function (list) {
        var p = ADS.fromCatalogue(list, cat, era, xmasMode(ch));
        if (p.length) { adPools[key] = p; return; }
        adsRev = '';                    // an empty or unreadable catalogue: fall back to searching, once
        adPools[key] = null; loadAds(ch, soon);
      }, function () { adsRev = ''; adPools[key] = null; loadAds(ch, soon); });
      return;
    }
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
  /** The adverts this channel can play: the hand-picked ones for it, plus whatever the search found. */
  function adPool(ch) {
    var key = adKey(ch);
    if (!key) return [];
    var fixed = (window.ADS && ADS.fixedFor) ? ADS.fixedFor(ch.id, eraFor(ch)) : [];
    return fixed.concat(adPools[key] || []);
  }

  function playAd(ch, index, left) {
    var key = adKey(ch), pool = adPool(ch);
    if (!pool.length) return nextInChannel();
    var was = cur;
    var ad = ADS.pickNext(pool, was && was.ad ? was.prog.url : null,
      { year: was ? was.adYear : 0, cat: ADS.categoryFor(ch.id), hour: new Date().getHours(), recent: adRecent });
    if (!ad) return nextInChannel();
    adRecent.push(ad.url); if (adRecent.length > 24) adRecent.shift();
    cur = { ch: ch, index: index, prog: { title: 'Advert', sub: ad.title, url: ad.url }, ad: true, adLeft: left, errors: 0, adYear: was ? was.adYear : 0 };
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
    if (cur && cur.od) return odStep(1);
    // the break is a time budget (seconds), not a number of adverts: each one that ends uses up its own length
    if (cur && cur.ad) {
      var left = cur.adLeft - Math.max(5, isFinite(v.duration) ? v.duration : 30);
      if (left > 8) return playAd(cur.ch, cur.index, left);
    } else if (cur && !cur.prog.filmKey && !cur.prog.song && cur.prog.adPad && adKey(cur.ch) && adPool(cur.ch).length) {
      var y = adYear(cur.ch, cur.prog);
      cur.adYear = y;                                // carried onto the first advert
      return playAd(cur.ch, cur.index, cur.prog.adPad);
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

  /** End the advert break that is playing and go straight on to the next programme. */
  function skipAds() {
    if (!cur || !cur.ad || isAdChan(cur.ch)) return;
    toast('Adverts skipped', 1500);
    nextInChannel();
  }
  function nextInChannel() {
    if (!cur) return;
    if (cur.od) return odStep(1);               // On Demand: the next episode of the show, not the channel's running order
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
      dlog('STALLED 20s mid-programme, reloading at ' + Math.round(v.currentTime) + 's');
      pbStart(cur && cur.prog ? cur.prog.url : v.src, v.currentTime);
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
  var sbNoiseTimer = null, sbNoiseImg = null;
  /** The slow flicker of static over the little TV's picture. */
  function sbNoise() {
    var c = $('sbnoise'), x = c.getContext('2d');
    if (!sbNoiseImg) sbNoiseImg = x.createImageData(c.width, c.height);
    var d = sbNoiseImg.data;
    for (var i = 0; i < d.length; i += 4) { var n = (Math.random() * 255) | 0; d[i] = n; d[i + 1] = n; d[i + 2] = n; d[i + 3] = 255; }
    var y = (Math.random() * c.height) | 0;                       // and the odd bright tear
    for (var xx = 0; xx < c.width; xx++) { var q = (y * c.width + xx) * 4; d[q] = d[q + 1] = d[q + 2] = 255; }
    x.putImageData(sbNoiseImg, 0, 0);
  }
  function standbyOff() {
    clearTimeout(sbTimer);
    var wait = sbHoldUntil - Date.now();
    if (wait > 0) {                                  // just tuned: let the TV be seen for a moment
      clearTimeout(sbHoldTimer);
      sbHoldTimer = setTimeout(standbyOff, wait + 20);
      return;
    }
    clearInterval(sbNoiseTimer); $('standby').className = 'hidden';
  }
  function standbyOn() {
    clearTimeout(sbTimer);
    sbTimer = setTimeout(function () { renderStandby(false); }, 1000);
  }
  function renderStandby(force) {
    {
      if (!cur || cur.ad) return;                                                  // adverts use the small spinner
      if (!force && (v.readyState >= 3 || v.currentTime > 0.2)) return;           // mid-show waits only if still loading
      var next = cur.prog && cur.prog.title;
      $('sbnum').textContent = cur.ch.n;
      $('sbname').textContent = cur.ch.name;
      $('sbp').textContent = String(100 + cur.ch.n);
      var art = knownArt(cur.prog), sb = $('standby'), me = cur;
      var style = store.get('sbstyle') === 'card' ? 'card' : 'tv';
      /** Put a picture (or none: static) on the set. */
      function paint(art) {
        var cls = art ? 'withart ' + style : (style === 'tv' ? 'withart tv noart' : '');   // no art: the set stays, tuned to static
        sb.className = cls;
        // the little TV: a backdrop fills its screen; with only a poster, a blurred copy fills it and the poster sits on top
        $('sbpic').style.backgroundImage = art ? 'url("' + (art.back || art.poster) + '")' : 'none';
        $('sbpic').className = art && !art.back ? 'blurred' : '';
        if (art && !art.back) { $('sbpicposter').src = art.poster; $('sbpicposter').className = 'on'; } else $('sbpicposter').className = '';
        clearInterval(sbNoiseTimer);
        if (style === 'tv') { sbNoise(); sbNoiseTimer = setInterval(sbNoise, 110); }
        $('sbart').style.backgroundImage = art ? 'url("' + (art.back || art.poster) + '")' : 'none';
        if (art && art.poster) { $('sbposter').src = art.poster; $('sbposter').className = ''; }
        else $('sbposter').className = 'hidden';
      }
      paint(art);
      if (!art && gartOn && !cur.prog.ad && !filmFor(cur.prog)) {
        // not known yet: look it up now and swap it onto the screen when it arrives (if we are still waiting for this programme)
        var p = parseTitle(cur.prog.title || ''); if (cur.prog.show) p.show = cur.prog.show;
        if (p.show) tvmInfo(p).then(function (d) {
          if (!d || cur !== me || sb.className === 'hidden') return;
          var got = knownArt(me.prog);
          if (got) paint(got);
        }, function () { /* no artwork: stays on static */ });
      }
      $('sbprog').textContent = '';
      if (next) {
        $('sbprog').appendChild(document.createTextNode('Coming up: '));
        var sp = document.createElement('span');
        sp.textContent = next;
        $('sbprog').appendChild(sp);
      }
    }
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
    if (cur) cur.played = true;
    if (cur) { cur.errors = 0; cur.trial = null; }   // it started fine: no going back
  });
  v.addEventListener('ended', onEnded);
  v.addEventListener('error', function () {
    if (!cur) return;
    if (backupSwitch('would not load')) return;     // the web view cannot play this file: the app's own player can try
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
  var VISIBLE_ROWS = 7;   // the colour-button legend is gone, so the grid takes its space
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
    if (seasonOv) seasonOv.touch();
    var list = guideList();
    if (!list.length) return;
    var now = Date.now();
    gRow = list.indexOf(gChan);
    if (gRow < 0) { gRow = 0; gChan = list[0]; }
    applyTheme(gChan);
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
          var base = 'blk' + (clipL ? ' cl' : '') + (clipR ? ' cr' : '') + (frac < 0.07 ? ' nw' : '');
          var el = div(base + (focused ? ' foc' : '') + (b.startMs <= now && now < b.endMs ? ' now' : ''));
          el.style.left = ((s - gWin) / SPAN * 100) + '%';
          el.style.width = 'calc(' + (frac * 100) + '% - .4vw)';
          rec.blocks.push({ el: el, b: b, base: base });
          if (frac < 0.07) { line.appendChild(el); return; } // too narrow for text: no padding either, or it would stick out past the edge
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

  // ---- seasonal effects (seasons.js): a decorative overlay over the guide, only while it is open and a season is on
  var seasonOn = store.get('seasonal') !== 'off', seasonOv = null;
  function seasonUpdate() {
    if (!window.SEASONS) return;
    var want = seasonOn && guideOpen && !!SEASONS.current();
    if (want && !seasonOv) seasonOv = SEASONS.snow($('gsnow'), function () {
      var rows = document.querySelectorAll('#guide .grow'), last = rows.length ? rows[rows.length - 1] : null;
      return last ? window.innerHeight - last.getBoundingClientRect().bottom : 40;
    });
    if (want) seasonOv.start(); else if (seasonOv) seasonOv.stop();
    SEASONS.hat(want ? SEASONS.current() : null);
  }
  function openGuide() {
    closeOsd();
    gOdSet(false);
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
    seasonUpdate();
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
    if (seasonOv) seasonOv.stop();
    document.body.classList.remove('season-hat');
  }

  var gOd = false;
  function gOdSet(on) { gOd = on; $('godbtn').className = on ? 'sel' : ''; }
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
      if (fb.startMs <= now) { gOdSet(true); return; }   // already on what is on now: one more Left reaches the On Demand button
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

  function watchFromGuide(fromStart) {
    var c = gChan;
    if (!c) return;
    if (c.status !== 'ready') { toast(c.name + ' is still loading', 2000); return; }
    var now = Date.now();
    var b = E.blockAt(c.sched, gFocus);
    closeGuide();
    if (b && (fromStart || !(b.startMs <= now && now < b.endMs))) {
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

  /** With nothing playing a single Back has nowhere to go: say how to leave. */
  function pressBackToExit() { toast('Press Back twice quickly to quit', 2500); }

  // Two quick presses of Back, wherever you are, ask whether to quit. Yes and No are buttons: Left / Right and OK on
  // the remote, or a click.
  var quitOpen = false, quitSel = 1, lastBack = 0, DOUBLE_BACK_MS = 800;
  function renderQuit() {
    $('qyes').className = quitSel === 0 ? 'sel' : '';
    $('qno').className = quitSel === 1 ? 'sel' : '';
  }
  function openQuit() {
    quitOpen = true; quitSel = 1;                         // No is already chosen: an accidental OK does no harm
    renderQuit();
    $('quit').className = '';
  }
  function closeQuit() { quitOpen = false; $('quit').className = 'hidden'; }
  $('qyes').addEventListener('click', function () { exitApp(); });
  $('qno').addEventListener('click', closeQuit);
  $('qyes').addEventListener('mouseenter', function () { quitSel = 0; renderQuit(); });
  $('qno').addEventListener('mouseenter', function () { quitSel = 1; renderQuit(); });
  function quitKey(k) {
    if (k === 'ArrowLeft') quitSel = 0;
    else if (k === 'ArrowRight') quitSel = 1;
    else if (k === 'Enter' || k === ' ') { if (quitSel === 0) exitApp(); else closeQuit(); return true; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { closeQuit(); return true; }
    renderQuit();
    return true;
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

  function showReport() {
    var c = gChan;
    if (!c) return;
    var r = c.report || [];
    var fb = c.status === 'ready' ? E.blockAt(c.sched, gFocus) : null;
    var file = fb && fb.prog && fb.prog.url ? ' | File: ' + decodeURIComponent(fb.prog.url.replace('https://archive.org/download/', '')) : '';
    toast(c.name + (c.autoUsed ? ' [Auto EPG]' : '') + ': ' + (r.length ? 'not playing - ' + r.join('; ') : 'all sources loaded') + file, 12000);
  }


  // ------------------------------------------------------------------ guide menu (hold OK on a programme)

  var gm = null;
  function gmName(p) { return (p && (p.show || p.group || parseTitle(p.title || '').show || p.title)) || ''; }
  function gmOpen() {
    var c = gChan;
    if (!c) return;
    if (c.status !== 'ready') { toast(c.name + ' is still loading', 2000); return; }
    var b = E.blockAt(c.sched, gFocus);
    if (!b || !b.prog) return;
    var p = b.prog, name = gmName(p), now = Date.now(), live = b.startMs <= now && now < b.endMs;
    var items = [];
    items.push({ t: 'On Demand', sub: name, f: function () {
      gmClose();
      if (odChannels().indexOf(c) < 0) { toast('Nothing on demand for ' + c.name, 3000); return; }
      odOpenUi(); odJump(c, p);
    } });
    if (live) items.push({ t: 'Watch now', f: function () { gmClose(); watchFromGuide(); } });
    items.push({ t: 'Watch from the start', f: function () { gmClose(); watchFromGuide(true); } });
    var ref = window.LINKS && LINKS.parseEp(p.title), film = !!p.filmKey;
    if (ref) items.push({ t: 'Stream next episode', f: function () { gmClose(); gmNext(c, p); } });
    if (ref || film) items.push({ t: 'Try another version', f: function () { gmClose(); gmAlt(c, p); } });
    items.push({ t: 'Info', f: function () { gmClose(); openInfo({ prog: p, ch: c }); } });
    items.push({ t: film ? 'Scrape this film' : 'Scrape this show', f: function () { gmClose(); gmScrape(c, p, name, film); } });
    items.push({ t: 'Options', f: function () { gmClose(); closeGuide(); openOpts(); } });
    gm = { items: items, i: 0, title: name, sub: c.n + '  ' + c.name };
    gmRender();
  }

  /** The show this programme belongs to on its channel, and where the programme sits in its episode list. */
  function gmFind(c, p, fn) {
    odLoadChannel(c).then(function () {
      var sh = odShowsOf(c) || [], key = LIBROUTE.norm(gmName(p)), ref = LINKS.parseEp(p.title), g = null, i = -1;
      sh.forEach(function (x) { if (!g && (LIBROUTE.norm(x.name) === key || x.eps.some(function (ep) { return ep.p.url === p.url; }))) g = x; });
      if (g) g.flat.forEach(function (ep, n) { if (i < 0 && (ep.p.url === p.url || (ref && ep.s === ref.s && ep.e === ref.e))) i = n; });
      fn(g, i, ref);
    });
  }
  /** Stream the episode after this one, and carry on through the show from there. */
  function gmNext(c, p) {
    toast('Finding the next episode\u2026', 2000);
    gmFind(c, p, function (g, i) {
      if (!g || i < 0 || i + 1 >= g.flat.length) { toast('No next episode of ' + gmName(p) + ' is stored', 3500); return; }
      closeGuide();
      odStart(c, g.flat, i + 1);
    });
  }
  var altTried = {};
  /** Play a different stored copy of the same episode (or film); each press tries the next copy. */
  function gmAlt(c, p) {
    toast('Looking for another version\u2026', 2000);
    var ref = LINKS.parseEp(p.title), name = LIBROUTE.norm(gmName(p));
    var tk = c.id + '|' + (p.filmKey || (name + ':' + (ref ? ref.s + 'x' + ref.e : '')));
    // every stored copy: this channel's files first, then the other channels' (a show is often on more than one)
    loadDataIndex().then(function (idx) {
      var order = [c].concat(channels.filter(function (x) { return x !== c && x.id !== c.id; })), all = [];
      return order.reduce(function (chain, ch) {
        return chain.then(function () {
          return loadChannelData(ch.id, idx[ch.id] || '').then(function (rows) {
            if (rows && rows.length) all = all.concat(progsFromData(rows, ch.id, true));
          }, function () { /* that channel has no data */ });
        });
      }, Promise.resolve()).then(function () { return all; });
    }).then(function (all) {
      var seen = {}, cands = [];
      all.forEach(function (q) {
        if (!q.url || seen[q.url] || blocked(q)) return;
        var same = p.filmKey ? q.filmKey === p.filmKey
          : (function () { var r = LINKS.parseEp(q.title); return r && ref && r.s === ref.s && r.e === ref.e && LIBROUTE.norm(gmName(q)) === name; })();
        if (same) { seen[q.url] = 1; cands.push(q); }
      });
      return (ref ? LINKS.get(LINKS.key(gmName(p), ref.s, ref.e)) : Promise.resolve(null)).then(function (row) {
        if (row && row.url && !seen[row.url] && row.url !== p.url) cands.push({ id: row.id || row.url, item: row.item, url: row.url, title: row.title || p.title, dur: row.dur || p.dur, show: p.show, group: p.group });
        var tried = altTried[tk] = altTried[tk] || [p.url];
        if (tried.indexOf(p.url) < 0) tried.push(p.url);
        var others = cands.filter(function (q) { return q.url !== p.url; });
        if (!others.length) { toast('No other version of this is stored', 3500); return; }
        var next = others.filter(function (q) { return tried.indexOf(q.url) < 0; })[0];
        if (!next) { altTried[tk] = [p.url]; next = others[0]; }
        altTried[tk].push(next.url);
        gmFind(c, p, function (g, i) {
          closeGuide();
          if (g && i >= 0) { var list = g.flat.slice(); list[i] = Object.assign({}, list[i], { p: next }); odStart(c, list, i); }
          else odStart(c, [{ p: next, s: ref ? ref.s : 0, e: ref ? ref.e : 0 }], 0);
          toast('Trying another version (' + (altTried[tk].length - 1) + ' of ' + (others.length + 1) + ')', 3500);
        });
      });
    }, function () { toast('Could not load the stored versions', 3500); });
  }
  /** Look the show up again on TVmaze, pin the match, and rebuild how its stored files are sorted into seasons. */
  function gmScrape(c, p, name, film) {
    if (film) { toast('Films use the details that came with them', 3000); return; }
    toast('Looking for ' + name + '\u2026', 15000);
    getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(name)).then(function (list) {
      var sh = pickShow(Array.isArray(list) ? list : [], name, 0);
      if (!sh) { toast('No clear match for ' + name + ' on TVmaze', 4000); return null; }
      return tvmImages(sh.id).then(function (imgs) {
        var e = tvmEntry(sh), bg = imgs.filter(function (x) { return x.type === 'background'; })[0];
        if (bg) e.b = odImgUrl(bg, true, 'background');
        if (!e.p) { var po = imgs.filter(function (x) { return x.type === 'poster'; })[0]; if (po) e.p = odImgUrl(po, true, 'poster'); }
        store.set('artfix:' + normShow(name), { a: e });
        try {                                                  // forget what was worked out before, so it is all looked up fresh
          kv.removeItem('eps1:' + odSlug(name)); kv.removeItem('cast1:' + e.i);
          kv.keys().forEach(function (k) { if (k.indexOf('info3:' + normShow(name) + ':') === 0) kv.removeItem(k); });
        } catch (err) { /* nothing stored */ }
        delete odData[c.id]; odKGen++; odArtFor = ''; odBgFor = ''; artFor = ''; gartFor = '';
        dlog('SCRAPE ' + name + ': ' + e.name + ' (TVmaze ' + e.i + ')');
        return odLoadChannel(c).then(function () {
          var g = (odShowsOf(c) || []).filter(function (x) { return LIBROUTE.norm(x.name) === LIBROUTE.norm(name); })[0];
          if (!g) { toast('Found ' + e.name + ', but no stored files matched it', 4500); return; }
          return odMeta(g).then(function () {
            toast('Found ' + e.name + (e.y ? ' (' + e.y + ')' : '') + ': ' + g.flat.length + ' stored episodes sorted into ' + g.sea.length + (g.sea.length === 1 ? ' group' : ' groups'), 5000);
          });
        });
      });
    }, function () { toast('Could not reach TVmaze', 3500); });
  }

  function gmClose() { gm = null; $('gmenu').className = 'hidden'; }
  function gmRender() {
    var box = $('gml'); box.textContent = '';
    $('gmt').textContent = gm.title;
    $('gms').textContent = gm.sub;
    gm.items.forEach(function (it, i) {
      var r = document.createElement('div'); r.className = 'gmr' + (i === gm.i ? ' sel' : '');
      var b = document.createElement('b'); b.textContent = it.t; r.appendChild(b);
      if (it.sub) { var sm = document.createElement('small'); sm.textContent = it.sub; r.appendChild(sm); }
      box.appendChild(r);
    });
    $('gmenu').className = '';
  }
  function gmKey(k) {
    if (k === 'ArrowUp') gm.i = (gm.i + gm.items.length - 1) % gm.items.length;
    else if (k === 'ArrowDown') gm.i = (gm.i + 1) % gm.items.length;
    else if (k === 'Enter' || k === ' ') { gm.items[gm.i].f(); return; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft' || k === 'Menu' || k === 'ContextMenu') { gmClose(); return; }
    gmRender();
  }

  // ------------------------------------------------------------------ OSD bar (OK while watching)

  var AR = [
    { id: 'auto', label: 'Auto' }, { id: '43', label: '4:3' }, { id: '169', label: '16:9' },
    { id: 'zoom', label: 'Zoom' }, { id: 'stretch', label: 'Stretch' }
  ];
  var arIdx = 0;
  var OB_ALL = ['guide', 'pp', 'skipad', 'next', 'restart', 'info', 'od', 'options'];   // buttons on the bar, left to right
  /** The buttons showing now: Skip adverts is only there while a break is playing (and never on the Adverts channel, which is all adverts). */
  function obList() { return OB_ALL.filter(function (id) { return id !== 'skipad' || (cur && cur.ad && !isAdChan(cur.ch)); }); }
  var osdOpen = false, osdSel = 1, osdTimer = null, osdTick = null;
  // The progress bar is a scrubber: Left / Right on it wind through the video (hold to go faster), Down reaches the buttons.
  var osdZone = 'btn', scrubT = null, scrubTimer = null, scrubLast = 0, scrubHold = 0, scrubDir = 0;
  function scrubApply() {
    clearTimeout(scrubTimer);
    if (scrubT === null) return;
    var t = scrubT; scrubT = null;
    try { v.currentTime = t; } catch (e) { /* ignore */ }
    if (osdOpen) renderOsd();
  }
  function scrubKey(dir) {
    if (!cur || cur.ad || !isFinite(v.duration) || v.duration <= 0) return;
    var now = Date.now();
    if (!osdOpen) openOsd();
    osdZone = 'bar'; osdTouch();
    var holding = scrubDir === dir && now - scrubLast < 600, step = 10;
    if (!holding) scrubHold = now;
    else { var dt = now - scrubHold; step = (dt < 800 ? 20 : dt < 2000 ? 60 : dt < 4000 ? 150 : 300) * (now - scrubLast) / 1000; }
    scrubDir = dir; scrubLast = now;
    var base = scrubT === null ? v.currentTime : scrubT;
    scrubT = Math.max(0, Math.min(v.duration - 1, base + dir * step));
    clearTimeout(scrubTimer); scrubTimer = setTimeout(scrubApply, 700);   // wind, then jump once you let go
    renderOsd();
  }
  (function () {
    var saved = store.get('ar');
    for (var i = 0; i < AR.length; i++) if (AR[i].id === saved) arIdx = i;
  })();

  function applyAr() {
    AR.forEach(function (a) { document.body.classList.remove('ar-' + a.id); });
    document.body.classList.add('ar-' + AR[arIdx].id);
    store.set('ar', AR[arIdx].id);
    clearInterval(ambTimer); ambTimer = null; setFill(false);
    if (AR[arIdx].id === 'smart') ambTimer = setInterval(ambTick, 100);
  }

  // ---- Smart aspect ratio: a 4:3 programme keeps its true shape (no stretching) and the empty sides of a 16:9 screen
  // are filled from a tiny 48x27 copy of the picture, enlarged and dimmed. That is a few thousand pixels a tick, so
  // even the oldest box copes.
  var ambTimer = null, ambFill = false, ambX = null;
  function setFill(on) {
    if (on === ambFill) return;
    ambFill = on;
    document.body.classList.toggle('smartfill', on);
  }
  function ambTick() {
    if (document.body.classList.contains('guide-open')) { setFill(false); return; }
    if (v.native) { setFill(false); return; }          // the backup player draws on its own surface: nothing to sample
    var w = v.videoWidth, h = v.videoHeight;
    if (!w || !h || v.readyState < 2 || w / h >= 1.6) { setFill(false); return; }   // already wide: nothing to fill
    try {
      if (!ambX) ambX = document.getElementById('amb').getContext('2d');
      var sh = w * 9 / 16;
      ambX.drawImage(v.el, 0, (h - sh) / 2, w, sh, 0, 0, 48, 27);
      ambX.fillStyle = 'rgba(0,0,0,.45)';
      ambX.fillRect(0, 0, 48, 27);
      setFill(true);
    } catch (e) { setFill(false); }
  }

  // ---- picture looks: CSS only (filters on the video, plus an overlay for CRT)
  var FXMODES = ['off', 'vhs', 'vhs2', 'vivid', 'sharp', 'lines', 'grille', 'glass', 'portable', 'dots'];
  var FXLABEL = { off: 'Off', vhs: 'VHS', vhs2: 'VHS 2', vivid: 'Vivid', sharp: 'Sharp',
                  lines: 'Scanlines', grille: 'Aperture grille', glass: 'Curved glass',
                  portable: 'Portable set', dots: 'Shadow mask' };
  var fxMode = 'off';
  var fxWatch = null;
  (function () {
    var saved = store.get('fx2');
    if (FXMODES.indexOf(saved) >= 0) fxMode = saved;
  })();

  // VHS and VHS 2 filter the video itself, which a TV cannot always do for heavy live-action files. If frames are
  // being dropped, only the blur is taken off (the rest of the look stays); the next programme starts with it on again.
  var fxTimer = null, fxLast = null;
  function fxGuardStart() {
    clearInterval(fxTimer); fxLast = null;
    document.body.classList.remove('fx-lite');
    if ((fxMode !== 'vhs' && fxMode !== 'vhs2') || !v.getVideoPlaybackQuality) return;
    fxTimer = setInterval(function () {
      if (v.paused || document.body.classList.contains('guide-open')) { fxLast = null; return; }
      var q = v.getVideoPlaybackQuality(), p = fxLast;
      fxLast = { t: q.totalVideoFrames, d: q.droppedVideoFrames };
      if (!p || document.body.classList.contains('fx-lite')) return;
      var total = fxLast.t - p.t, dropped = fxLast.d - p.d;
      if (total >= 60 && dropped / total > 0.2) {
        document.body.classList.add('fx-lite');
        dlog('VIDEO EFFECT lightened: ' + dropped + ' of ' + total + ' frames dropped with ' + FXLABEL[fxMode] + ' on  ' + String(v.currentSrc || '').split('/').slice(-2).join('/'));
      }
    }, 4000);
  }
  v.addEventListener('loadstart', function () { fxLast = null; document.body.classList.remove('fx-lite'); });
  function applyFx() {
    FXMODES.forEach(function (m) { document.body.classList.remove('fx-' + m); });
    document.body.classList.add('fx-' + fxMode);
    if (fxMode === 'vhs2') {
      // lines and gaps in whole device pixels, so they do not drift into thick and thin bands
      var dpr = window.devicePixelRatio || 1, N = Math.max(3, Math.round(window.innerHeight * dpr / 216));
      var d = Math.max(1, Math.round(N * 0.28));
      document.body.style.setProperty('--lp', (N / dpr) + 'px');
      document.body.style.setProperty('--ld', (d / dpr) + 'px');
    }
    store.set('fx2', fxMode);
    fxGuardStart();
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

  // ---- buffer: the native side keeps the programme ahead of the picture and serves it from this device
  var BUF = [
    { id: 'off', label: 'Off', mb: 0 },
    { id: '50', label: '50 MB', mb: 50 },
    { id: '100', label: '100 MB', mb: 100 },
    { id: '250', label: '250 MB', mb: 250 }
  ];
  var bufIdx = 0;
  (function () {
    var saved = store.get('buf1');
    for (var i = 0; i < BUF.length; i++) if (BUF[i].id === saved) bufIdx = i;
  })();
  function bufferAvailable() { return !!(window.NativeHttp && NativeHttp.buffer); }
  /** The address to play: the buffered copy when that is on and possible, otherwise archive.org itself. */
  function playUrl(url) {
    if (!url || !bufferAvailable() || !BUF[bufIdx].mb) return url;
    try { return NativeHttp.buffer(url, BUF[bufIdx].mb) || url; } catch (e) { return url; }
  }
  function releaseBuffer() {
    if (!bufferAvailable() || !NativeHttp.release) return;
    try { NativeHttp.release(); } catch (e) { /* nothing held */ }
  }
  function changeBuf(d) {
    bufIdx = (bufIdx + d + BUF.length) % BUF.length;
    store.set('buf1', BUF[bufIdx].id);
    if (!BUF[bufIdx].mb) releaseBuffer();
    renderOpts();
    toast(BUF[bufIdx].mb ? 'Buffering ' + BUF[bufIdx].label + ' ahead from the next programme'
                         : 'Buffering off: playing from archive.org directly', 3000);
  }

  function changeFx(d) {
    fxMode = FXMODES[(FXMODES.indexOf(fxMode) + d + FXMODES.length) % FXMODES.length];
    applyFx();
    renderOpts();
  }

  // ---- What's new: what came with this build. version.js is written from CHANGELOG.md by tools/make_version.py,
  // so this panel and the changelog in the APK zip can never say different things.
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var relOpen = false;
  function release() { return window.RELEASE || null; }
  function relName() { var r = release(); return (r && r.name) || 'unnumbered build'; }
  /** "2026-11-09" as "9 November 2026". Empty for anything else, so a missing date just shows nothing. */
  function relDate(d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return '';
    var p = d.split('-');
    return (+p[2]) + ' ' + MONTHS[+p[1] - 1] + ' ' + p[0];
  }
  function relList(notes) {
    var ul = document.createElement('ul');
    (notes || []).forEach(function (n) {
      var li = document.createElement('li');
      li.textContent = n;                      // text, never markup: notes are written by hand in the changelog
      ul.appendChild(li);
    });
    return ul;
  }
  /** Where everything on this channel list comes from, and the credits those sources ask for. */
  var CREDITS = [
    { who: 'archive.org', what: 'Every programme is played from a public upload at archive.org. Nothing is hosted by this app.' },
    { who: 'TVmaze', what: 'Episode titles, air dates, posters and summaries for television programmes.' },
    { who: 'TMDB', tmdb: true,
      what: 'Film titles, plots, posters and running times. This product uses the TMDB API but is not endorsed or certified by TMDB.' },
    { who: 'Telly Addict Scraper', what: 'The listings behind Auto EPG, and the film and programme details that come with them.' }
  ];
  function buildAbout() {
    var body = $('rbody');
    body.textContent = '';
    $('rkick').textContent = 'About';
    $('rver').textContent = 'Telly Addicts';
    $('rdate').textContent = relName() + (relDate((release() || {}).date) ? '   ·   ' + relDate(release().date) : '');
    CREDITS.forEach(function (c) {
      var head = document.createElement('h3');
      head.textContent = c.who;
      if (c.tmdb) {
        var logo = document.createElement('img');
        logo.className = 'tmdb';
        logo.alt = '';
        logo.onerror = function () { logo.parentNode && logo.parentNode.removeChild(logo); };
        logo.src = 'tmdb.svg';
        head.appendChild(logo);
      }
      body.appendChild(head);
      body.appendChild(relList([c.what]));
    });
  }

  /** The debug log: where to open it from another device, and the latest things that went wrong. */
  function buildLog() {
    var body = $('rbody');
    body.textContent = '';
    $('rkick').textContent = 'Debug log';
    $('rver').textContent = 'What went wrong';
    var fails = DLOG.filter(function (l) { return /  (FAILED|GAVE UP|STALLED|MISMATCH)/.test(l); });
    var reports = DLOG.filter(function (l) { return /  REPORT /.test(l) || /  ARCHIVE\.ORG /.test(l); });
    $('rdate').textContent = DLOG.length + ' entries kept   ·   ' + fails.length + ' programmes failed or stalled';
    var where = '';
    try { where = window.NativeHttp && NativeHttp.shareLog ? NativeHttp.shareLog(logText()) : ''; } catch (e) { where = ''; }
    var h1 = document.createElement('h3');
    h1.textContent = 'Send the whole log';
    body.appendChild(h1);
    body.appendChild(relList(where
      ? ['On a phone or computer on the same Wi-Fi, type this into the browser exactly as shown, starting with http://', where, 'Copy everything on that page and send it.']
      : ['The log can be opened from a phone or computer when the TV is on the home network.']));
    var hp = document.createElement('h3');
    hp.textContent = 'What this TV\u2019s player can play';
    body.appendChild(hp);
    body.appendChild(relList(playerSupport()));
    var h2 = document.createElement('h3');
    h2.textContent = 'Something not right?';
    body.appendChild(h2);
    body.appendChild(relList(['If a programme is not what it says it is, press Info while it is playing (hold OK), then send the log. It records where the programme came from and what archive.org says the upload really is.']));
    var h3 = document.createElement('h3');
    h3.textContent = 'Latest programmes you checked';
    body.appendChild(h3);
    body.appendChild(relList(reports.length ? reports.slice(-4).reverse() : ['None yet.']));
    var h4 = document.createElement('h3');
    h4.textContent = 'Latest failures';
    body.appendChild(h4);
    body.appendChild(relList(fails.length ? fails.slice(-6).reverse() : ['Nothing has failed since the log began.']));
  }

  function buildRel() {
    var r = release(), body = $('rbody');
    body.textContent = '';
    $('rkick').textContent = 'What’s new';
    $('rver').innerHTML = '';
    $('rdate').textContent = '';
    if (!r) {                                  // version.js missing: say so rather than showing an empty screen
      $('rver').textContent = 'Version unknown';
      body.appendChild(relList(['This build carries no release notes.']));
      return;
    }
    var name = document.createElement('i');
    name.textContent = r.name;
    $('rver').appendChild(name);
    $('rdate').textContent = relDate(r.date);
    body.appendChild(relList(r.notes));
    (r.history || []).forEach(function (h) {
      var head = document.createElement('h3');
      head.textContent = h.name + (relDate(h.date) ? '  ·  ' + relDate(h.date) : '');
      body.appendChild(head);
      body.appendChild(relList(h.notes));
    });
  }

  // ------------------------------------------------------------------ missing episodes
  // What On Demand has for every show, set against the episode guide (the scraper's, else TVmaze's), so the gaps can be
  // handed to the scraper. The scan runs in the background, one show at a time, and the guides it fetches are kept
  // (eps1:) so a second scan is quick. Only episodes aired by ERA_END count: Casualty is not missing its 2020s.
  var gapState = { running: false, done: 0, total: 0, report: null, note: '' };
  try { var _g = store.get('gaps1'); if (_g && _g.report) gapState.report = _g.report; } catch (e) { /* none yet */ }
  function gapRanges(nums) {
    nums = nums.slice().sort(function (a, b) { return a - b; });
    var out = [], i = 0;
    while (i < nums.length) {
      var j = i;
      while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++;
      out.push(j > i ? nums[i] + '-' + nums[j] : String(nums[i]));
      i = j + 1;
    }
    return out.join(',');
  }
  function gapAnalyse(name, chans, have, others, g) {
    var rec = { show: name, channels: chans, files: 0, other: others };
    if (g && g.art && g.art.i) rec.tvmaze = g.art.i;          // TVmaze's id for the show, when the scraper's art list has it
    var hs = Object.keys(have);
    hs.forEach(function (sn) { rec.files += have[sn].length; });
    rec.have = {};
    hs.forEach(function (sn) { rec.have[sn] = gapRanges(have[sn]); });
    if (!g.meta) { rec.guide = false; return rec; }
    rec.guide = true;
    var bySeason = {};
    Object.keys(g.meta).forEach(function (k) {
      var e = g.meta[k], yr = e.a ? parseInt(String(e.a).slice(0, 4), 10) : 0;
      if (yr && yr > ERA_END) return;
      (bySeason[e.s] = bySeason[e.s] || []).push(e.e);
    });
    rec.missing = {}; rec.missingSeasons = []; var miss = 0, total = 0;
    Object.keys(bySeason).map(Number).sort(function (a, b) { return a - b; }).forEach(function (sn) {
      var all = bySeason[sn], got = {};
      (have[sn] || []).forEach(function (n) { got[n] = 1; });
      var lack = all.filter(function (n) { return !got[n]; });
      total += all.length; miss += lack.length;
      if (!lack.length) return;
      if (lack.length === all.length) rec.missingSeasons.push(sn);
      else rec.missing[sn] = gapRanges(lack);
    });
    rec.guideEpisodes = total; rec.missingCount = miss;
    return rec;
  }
  function gapStart(force) {
    if (gapState.running) return;
    var r = gapState.report;
    if (!force && r && Date.now() - r.t < 24 * 3600 * 1000) return;
    gapState.running = true; gapState.done = 0; gapState.total = 0; gapState.note = 'Reading the library…';
    var byName = {};
    var chans = odChannels().filter(function (c) { return !OD_FILMS[c.id]; });
    var chain = Promise.resolve();
    chans.forEach(function (c) {
      chain = chain.then(function () { return odLoadChannel(c); }).then(function (rec) {
        (rec.shows || []).forEach(function (g) {
          if (g.film) return;
          var k = LIBROUTE.norm(g.name), x = byName[k] = byName[k] || { name: g.name, chans: [], have: {}, others: 0, g: g };
          if (x.chans.indexOf(c.id) < 0) x.chans.push(c.id);
          g.eps.forEach(function (ep) {
            if (ep.s > 0 && ep.e > 0) { var a = x.have[ep.s] = x.have[ep.s] || []; if (a.indexOf(ep.e) < 0) a.push(ep.e); }
            else x.others++;
          });
        });
      });
    });
    chain.then(function () {
      var list = Object.keys(byName).map(function (k) { return byName[k]; }), out = [], i = 0;
      gapState.total = list.length; gapState.note = '';
      function next() {
        if (i >= list.length) return finish();
        var x = list[i++];
        return Promise.race([odMeta(x.g), new Promise(function (r) { setTimeout(r, 15000); })]).then(null, function () { /* no guide */ })
          .then(function () {
            out.push(gapAnalyse(x.name, x.chans, x.have, x.others, x.g));
            gapState.done = i;
            if (relOpen && relRow === 'gaps') buildGaps();
            return new Promise(function (r) { setTimeout(r, 120); });
          }).then(next);
      }
      function finish() {
        out.sort(function (a, b) { return (b.missingCount || 0) - (a.missingCount || 0); });
        var gaps = out.filter(function (r) { return r.guide && (r.missingCount || 0) > 0; }).length;
        var report = {
          t: Date.now(), app: (window.RELEASE && RELEASE.name) || '', era: '1970-' + ERA_END, shows: out,
          summary: { shows: out.length, withGuide: out.filter(function (r) { return r.guide; }).length, gaps: gaps,
                     noGuide: out.filter(function (r) { return !r.guide; }).length }
        };
        gapState.report = report; gapState.running = false;
        try { store.set('gaps1', { report: report }); } catch (e) { /* too big to keep: rebuilt on the next scan */ }
        if (relOpen && relRow === 'gaps') buildGaps();
      }
      return next();
    }, function () { gapState.running = false; gapState.note = 'Could not read the library.'; });
  }
  /** The report as the plain text a phone opens: JSON for the scraper, only the shows that have something missing. */
  function gapText() {
    var r = gapState.report;
    var shows = r.shows.filter(function (x) { return x.guide ? (x.missingCount || 0) > 0 : true; }).map(function (x) {
      var o = { show: x.show, channels: x.channels, have_files: x.files, other_videos: x.other, have: x.have };
      if (x.tvmaze) o.tvmaze_id = x.tvmaze;
      if (x.guide) { o.missing_seasons = x.missingSeasons; o.missing_episodes = x.missing; o.guide_episodes = x.guideEpisodes; o.missing_count = x.missingCount; }
      else o.no_episode_guide = true;
      return o;
    });
    return JSON.stringify({ format: 'telly-addicts-missing', v: 1, generated: new Date(r.t).toISOString(), app: r.app, era: r.era, summary: r.summary,
      note: 'have/missing are season -> episode ranges. missing_seasons are seasons with nothing on the TV; missing_episodes are gaps inside a season we do have. Ranges are comma-separated and inclusive, like "1-6,9". Counts only episodes aired 1999 or earlier.',
      shows: shows }, null, 1);
  }
  function buildGaps() {
    var body = $('rbody'), top = body.scrollTop;
    body.textContent = '';
    $('rkick').textContent = 'Missing episodes';
    var r = gapState.report;
    $('rver').textContent = 'What the scraper still needs to find';
    $('rdate').textContent = gapState.running ? 'Checking ' + gapState.done + ' of ' + (gapState.total || '…') + ' shows  ' + gapState.note : (r ? r.summary.shows + ' shows checked' : '');
    var h1 = document.createElement('h3'); h1.textContent = 'Send this to the scraper';
    body.appendChild(h1);
    if (!r) { body.appendChild(relList([gapState.running ? 'Working out which episodes are missing. This takes a few minutes the first time; you can leave this open.' : 'Nothing yet.'])); return; }
    var where = '';
    try { where = window.NativeHttp && NativeHttp.shareLog ? NativeHttp.shareLog(gapText()) : ''; } catch (e) { where = ''; }
    body.appendChild(relList(where
      ? ['On a phone or computer on the same Wi-Fi, open this exactly as shown, starting with http://', where, 'Copy everything on that page and send it to the scraper. (It replaces the debug log on that address until you open the debug log again.)']
      : ['This can be opened from a phone or computer when the TV is on the home network.']));
    var h2 = document.createElement('h3'); h2.textContent = 'Summary';
    body.appendChild(h2);
    body.appendChild(relList([r.summary.shows + ' shows on the TV', r.summary.withGuide + ' have an episode guide to compare against', r.summary.gaps + ' have episodes or seasons missing',
      r.summary.noGuide + ' have no guide (listed with what the TV has)', gapState.running ? 'Still checking: this list grows as it goes.' : 'Checked ' + new Date(r.t).toLocaleString()]));
    var h3 = document.createElement('h3'); h3.textContent = 'Biggest gaps';
    body.appendChild(h3);
    body.appendChild(relList(r.shows.filter(function (x) { return x.guide && x.missingCount; }).slice(0, 12).map(function (x) {
      return x.show + ':  ' + x.missingCount + ' of ' + x.guideEpisodes + ' missing' + (x.missingSeasons.length ? '  (no season ' + x.missingSeasons.join(', ') + ')' : '');
    })));
    body.scrollTop = top;
  }
  // ------------------------------------------------------------------ EPG debug (Options > EPG debug)
  var epgDbgCh = null;
  function epgDbgChannels() { return channels.filter(function (c) { return c.status === 'ready' && c.sched; }); }
  function epgDbgMove(d) {
    var list = epgDbgChannels(); if (!list.length) return;
    var i = Math.max(0, list.indexOf(epgDbgCh));
    epgDbgCh = list[(i + (d < 0 ? list.length - 1 : 1)) % list.length];
    buildEpgDebug(true);
  }
  /** Everything the debug page says about one channel, as plain lines (the page and the copy for a browser both use it). */
  function epgInfo(c) {
    var s = c.sched, now = Date.now();
    var rows = [], b = E.blockAt(s, now), n = 0;
    while (b && n < 600 && (!rows.length || b.startMs < rows[0].startMs + 24 * 3600 * 1000)) { rows.push(b); b = E.stepBlock(s, b, 1); n++; }     // exactly one day from the block on now, so a daily timetable does not count its own repeat
    var key = function (p) { return String(p.show || p.group || String(p.title || '').replace(/\s+S\d+E\d+.*$/i, '')).toLowerCase(); };
    var cnt = {}, urls = {}, dupes = [], unknownLen = 0, uncoded = 0, runs = [];
    var uniq = {};
    s.order.forEach(function (p) { var k = key(p); cnt[k] = (cnt[k] || 0) + 1; uniq[k] = p.show || p.group || p.title; if (!(p.lenKnown)) unknownLen++; if (!/S\d+E\d+/i.test(p.title || '') && !p.filmKey) uncoded++; });
    var run = 0, prev = '', runStart = 0;
    rows.forEach(function (bl) {
      var k = key(bl.prog);
      if (k === prev) run++; else { if (run >= 3) runs.push({ show: uniq[prev] || prev, n: run, at: runStart }); run = 1; prev = k; runStart = bl.startMs; }
      if (urls[bl.prog.url]) dupes.push(bl.prog.title); urls[bl.prog.url] = 1;
    });
    if (run >= 3) runs.push({ show: uniq[prev] || prev, n: run, at: runStart });
    var kind = s.cycle === 'multi' ? 'a clock timetable, ' + s.n + ' ' + (s.unit === 604800 ? 'weeks' : 'days') + ' before it repeats'
      : s.cycle === 'week' ? 'a clock timetable that repeats every week' : s.cycle === 'day' ? 'a clock timetable that repeats every day'
      : 'one shuffled loop of ' + (s.total / 3600).toFixed(1) + ' hours';
    var probs = [];
    runs.forEach(function (r) { probs.push(r.show + ' is on ' + r.n + ' times in a row from ' + fmtTime(r.at)); });
    if (dupes.length) probs.push(dupes.length + ' programme' + (dupes.length > 1 ? 's repeat' : ' repeats') + ' within the day: ' + dupes.slice(0, 3).join('; '));
    var byCount = Object.keys(cnt).sort(function (x, y) { return cnt[y] - cnt[x]; }), topShow = byCount[0];
    if (topShow && cnt[topShow] / s.order.length > 0.4 && byCount.length > 1) probs.push(uniq[topShow] + ' fills ' + Math.round(100 * cnt[topShow] / s.order.length) + '% of the schedule');
    var prevK = '', runN = 0;
    return {
      head: [
        'Guide length setting: ' + SPANS[spanIdx].label,
        'Built as ' + kind,
        s.order.length + ' programmes in the schedule, ' + byCount.length + ' different shows, ' + (s.total / 3600).toFixed(1) + ' hours in all',
        (c.plan ? c.plan.length : '?') + ' programmes stored for this channel before the guide length is applied',
        'Where it comes from: ' + (c.decade ? 'the library, only ' + c.decade + 's (' + (c.decade + 9) + ')' : c.autoUsed ? 'the scraper’s whole library' : 'the channel’s own list'),
        unknownLen + ' programmes have no confirmed running time; ' + uncoded + ' have no season and episode'
      ],
      probs: probs,
      tops: byCount.slice(0, 10).map(function (k) { return uniq[k] + ': ' + cnt[k]; }),
      blocks: rows.map(function (bl) {
        var k = key(bl.prog); runN = k === prevK ? runN + 1 : 1; prevK = k;
        return fmtTime(bl.startMs) + '  ' + Math.round((bl.endMs - bl.startMs) / 60000) + ' min   ' + (bl.prog.title || '?') + (bl.count > 1 ? '  (+' + (bl.count - 1) + ' more)' : '') + (runN >= 3 ? '    ← ' + runN + ' in a row' : '');
      })
    };
  }
  /** Every ready channel, as text for a browser: problems first, then each channel's next 24 hours. */
  function epgText() {
    var list = epgDbgChannels(), out = ['Telly Addicts EPG debug', 'Version: ' + relName(), 'Written: ' + new Date().toString(), 'Guide length setting: ' + SPANS[spanIdx].label, ''];
    var infos = list.map(function (c) { return { c: c, i: epgInfo(c) }; });
    out.push('PROBLEMS, ALL CHANNELS');
    var any = false;
    infos.forEach(function (x) { x.i.probs.forEach(function (t) { any = true; out.push(x.c.n + ' ' + x.c.name + ': ' + t); }); });
    if (!any) out.push('None.');
    infos.forEach(function (x) {
      out.push('', '=== ' + x.c.n + ' ' + x.c.name + ' ===');
      x.i.head.forEach(function (t) { out.push(t); });
      out.push('Most common shows: ' + x.i.tops.join('; '), 'Next 24 hours:');
      x.i.blocks.forEach(function (t) { out.push('  ' + t); });
    });
    return out.join('\n');
  }
  function buildEpgDebug(keepScroll) {
    var body = $('rbody'), top = body.scrollTop;
    body.textContent = '';
    $('rkick').textContent = 'EPG debug';
    var list = epgDbgChannels();
    if (!epgDbgCh || list.indexOf(epgDbgCh) < 0) epgDbgCh = (gChan && list.indexOf(gChan) >= 0 ? gChan : (cur && list.indexOf(cur.ch) >= 0 ? cur.ch : list[0])) || null;
    var c = epgDbgCh;
    if (!c) { $('rver').textContent = ''; $('rdate').textContent = ''; body.appendChild(relList(['No channel is ready yet.'])); return; }
    $('rver').textContent = c.n + '  ' + c.name;
    $('rdate').textContent = '◀ ▶ change channel   ·   what the guide is made of, and what it shows for the next 24 hours';
    function h3(t) { var e = document.createElement('h3'); e.textContent = t; body.appendChild(e); }
    var info = epgInfo(c);
    // the same report for every channel, ready to open from a phone or computer on the home network
    if (!keepScroll || !buildEpgDebug.where) { try { buildEpgDebug.where = window.NativeHttp && NativeHttp.shareLog ? NativeHttp.shareLog(epgText()) : ''; } catch (e) { buildEpgDebug.where = ''; } }
    h3('Open on a phone or computer');
    body.appendChild(relList(buildEpgDebug.where
      ? ['On the same Wi-Fi, open this exactly as shown, starting with http://', buildEpgDebug.where, 'It shows every channel, not just this one. (It replaces the debug log on that address until you open the debug log again.)']
      : ['This can be opened from a phone or computer when the TV is on the home network.']));
    h3('This channel');
    body.appendChild(relList(info.head));
    h3('Problems found in the next 24 hours');
    body.appendChild(relList(info.probs.length ? info.probs : ['None: no show three times in a row, no repeats within the day.']));
    h3('Most common shows');
    body.appendChild(relList(info.tops));
    h3('Next 24 hours');
    body.appendChild(relList(info.blocks));
    body.scrollTop = keepScroll ? top : 0;
    relMore();
  }

  var relRow = 'rel';
  function openRel(which) {
    closeOpts();
    relRow = which === 'about' || which === 'log' || which === 'gaps' || which === 'epg' ? which : 'rel';
    if (relRow === 'about') buildAbout(); else if (relRow === 'log') buildLog(); else if (relRow === 'gaps') { buildGaps(); gapStart(false); } else if (relRow === 'epg') { buildEpgDebug.where = ''; buildEpgDebug(); } else buildRel();
    relOpen = true;
    $('rel').className = '';
    $('rbody').scrollTop = 0;
    relMore();
  }
  function closeRel() {
    relOpen = false;
    $('rel').className = 'hidden';
    openOpts();
    optsSel = Math.max(0, OPTS.indexOf(relRow));   // back on the row it was opened from
    optsCat = catOfRow(relRow); optsZone = 1;
    renderOpts();
  }
  /** Only promise scrolling, and only fade the last line, while there is something below the fold. */
  function relMore() {
    var b = $('rbody'), left = b.scrollHeight - b.clientHeight - b.scrollTop;
    $('rmore').className = left > 4 ? 'on' : '';
    $('rfade').style.opacity = left > 4 ? '1' : '0';
  }
  function relKey(k) {
    var b = $('rbody'), step = Math.max(80, Math.round(b.clientHeight * 0.55));
    if (k === 'ArrowDown' || k === 'ChannelDown') { b.scrollTop += step; relMore(); }
    else if (k === 'ArrowUp' || k === 'ChannelUp') { b.scrollTop -= step; relMore(); }
    else if (relRow === 'epg' && (k === 'ArrowLeft' || k === 'ArrowRight')) epgDbgMove(k === 'ArrowLeft' ? -1 : 1);
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Enter' || k === ' ' || k === 'Info') closeRel();
    else if (k === 'Guide' || k === 'Red') { relOpen = false; $('rel').className = 'hidden'; openGuide(); }
    else return false;
    return true;
  }
  /** Mention a new version once, the first time it runs, and leave the detail in Options. */
  function greetRelease() {
    var r = release();
    if (!r || !r.name) return;
    if (store.get('relseen') === r.name) return;
    store.set('relseen', r.name);
    toast('Updated to ' + r.name + '  ·  Options > What’s new', 6000);
  }

  // ---- Options panel (OSD > Options): picture, enhancements, adverts, Auto EPG, how long listings are kept
  // The categories down the left of Options, and the rows in each. OPTS is those rows in order.
  var OCATS = [
    { id: 'watch', rows: ['od'] },
    { id: 'picture', rows: ['ar', 'fx'] },
    { id: 'guide', rows: ['span', 'theme', 'season', 'keep', 'refresh'] },
    { id: 'art', rows: ['gart', 'mkeep', 'mclear'] },
    { id: 'play', rows: ['player', 'buf', 'ads'] },
    { id: 'tools', rows: ['rel', 'about', 'gaps', 'epg', 'log', 'live'] }
  ];
  var OPTS = [];
  OCATS.forEach(function (c) { OPTS = OPTS.concat(c.rows); });
  var optsCat = 0, optsZone = 0;      // optsZone: 0 = the category list, 1 = a row in the chosen category
  function catOfRow(id) { for (var i = 0; i < OCATS.length; i++) if (OCATS[i].rows.indexOf(id) >= 0) return i; return 0; }
  var optsOpen = false, optsSel = 0, optsTimer = null;
  function optValue(id) {
    if (id === 'ar') return AR[arIdx].label;
    if (id === 'fx') return FXLABEL[fxMode];
    if (id === 'gart') return gartOn ? 'On' : 'Off';
    if (id === 'ads') return (adEra === 'off' ? 'Off' : 'On') + (adEra !== 'off' && cur && !ADS.categoryFor(cur.ch.id) ? '  (none on this channel)' : '');
    if (id === 'buf') return BUF[bufIdx].label + (BUF[bufIdx].mb && !bufferAvailable() ? '  (needs a newer app)' : '');
    if (id === 'player') return PLAYERS[playerIdx].label + (v.canNative() ? '' : '  (needs a newer app)') + (Object.keys(npKnown).length && playerMode() === 'auto' ? '  (' + Object.keys(npKnown).length + ' files)' : '');
    if (id === 'span') return SPANS[spanIdx].label;
    if (id === 'theme') return THEMES[themeIdx].label;
    if (id === 'season') return seasonOn ? (SEASONS.current() ? 'Auto  (' + SEASONS.current().label + ' on now)' : 'Auto  (nothing on at the moment)') : 'Off';
    if (id === 'keep') return KEEP[keepIdx].label;
    if (id === 'refresh') return refreshArmed ? 'Press OK again to confirm' : '';
    if (id === 'rel') return relName();
    if (id === 'mkeep') return META_KEEP[metaIdx].label;
    if (id === 'mclear') return metaSizeText || '\u2026';
    if (id === 'gaps') return gapState.report ? gapState.report.summary.gaps + ' shows with gaps' : '';
    if (id === 'live') return liveAddr ? 'On: ' + liveAddr : 'Off';
    if (id === 'about' || id === 'log' || id === 'od' || id === 'epg') return '';
    return '';
  }

  /** Picking longer keeps the lists already stored; picking shorter lets them run out. Links are never thrown away. */
  var META_KEYS = /^(info3|art2|tvm4|eps1|artdb1|cast1):/;
  /** How much saved artwork and episode detail there is, as text for the Options row. */
  function metaSize() {
    var bytes = 0, n = 0;
    try {
      var _ks = kv.keys(); for (var k = 0; k < _ks.length; k++) {
        var kn = _ks[k];
        if (kn && META_KEYS.test(kn)) { bytes += kn.length + (kv.getItem(kn) || '').length; n++; }
      }
    } catch (e) { /* unavailable */ }
    return n ? (bytes / 1048576 < 0.1 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1048576).toFixed(1) + ' MB') : 'Nothing saved';
  }
  // Adding up everything saved means reading every saved file, far too slow to do on each key press in the options:
  // the row shows the last answer and the sum is redone once, a moment after the options open or after a clear
  var metaSizeText = '', metaSizeTimer = null;
  function refreshMetaSize() {
    clearTimeout(metaSizeTimer);
    metaSizeTimer = setTimeout(function () {
      metaSizeText = metaSize();
      if (optsOpen) renderOpts();
    }, 400);
  }
  function changeMetaKeep(d) {
    metaIdx = (metaIdx + (d < 0 ? META_KEEP.length - 1 : 1)) % META_KEEP.length;
    store.set('metakeep1', META_KEEP[metaIdx].id);
    renderOpts();
    toast('Artwork and episode details kept: ' + META_KEEP[metaIdx].label.toLowerCase(), 2600);
  }
  function clearMeta() {
    var gone = 0;
    try {
      var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
        var kn = _ks[k];
        if (kn && META_KEYS.test(kn)) { kv.removeItem(kn); gone++; }
      }
    } catch (e) { /* ignore */ }
    try { if (window.NativeHttp && NativeHttp.clearImages) NativeHttp.clearImages(); } catch (e) { /* older app */ }
    artIdx = null; artP = null; artRev = ''; gartFor = '\u0000'; artFor = '';
    odData = {};
    metaSizeText = ''; refreshMetaSize();
    renderOpts();
    toast('Cleared ' + gone + ' saved items and the picture cache', 3500);
  }
  var spanTimer = null;
  function changeSpan(d) {
    spanIdx = (spanIdx + (d < 0 ? SPANS.length - 1 : 1)) % SPANS.length;
    store.set('span1', SPANS[spanIdx].id);
    renderOpts();
    toast('Guide length: ' + SPANS[spanIdx].label + '. Building the guides\u2026', 3000);
    clearTimeout(spanTimer);       // more than one press in a row: rebuild once, after the last
    spanTimer = setTimeout(function () { location.reload(); }, 2200);
  }
  function changeKeep(d) {
    keepIdx = (keepIdx + (d < 0 ? KEEP.length - 1 : 1)) % KEEP.length;
    store.set('keep1', KEEP[keepIdx].id);
    renderOpts();
    toast('Listings kept for ' + KEEP[keepIdx].label + ', then built again', 2600);
  }

  var ACTION = { epg: 1, mclear: 1, od: 1, refresh: 1, rel: 1, log: 1, about: 1 };   // rows that do something on OK, so they show no left/right arrows
  // one line under the list saying what the highlighted row is for
  var OPT_HELP = {
    season: 'A light pixel-art decoration over the TV guide that comes and goes with the calendar: snow from 1 November to 6 January. Auto uses the date; Off never draws it.',
    theme: 'How the TV guide looks. Match the channel gives the 70s, 80s and 90s channels a guide from their own decade; the rest keep Classic Blue.',
    mkeep: 'How long artwork and episode details are remembered before they are looked up again. Permanent keeps them until you clear them.',
    mclear: 'Forgets the saved artwork, episode details and downloaded pictures, so they are fetched again fresh. Shows what is stored now.',
    od: 'Browse every channel\u2019s shows, series and episodes, and play any of them from the start.',
    ar: 'Auto, Smart, 4:3, 16:9, Zoom or Stretch. Auto shows each programme in the ratio it was made in. Smart keeps old 4:3 pictures the right shape and fills the sides with a soft copy of the picture.',
    fx: 'A period look for the picture: VHS softness, vivid colour or extra sharpness.',
    gart: 'Posters and backdrops in the guide and on the bar. Off keeps things plain.',
    ads: 'Adverts between programmes, matched to the year of what you are watching. UK first, and never on the BBC.',
    player: 'Auto plays everything normally and switches to the app\u2019s own player for a file that has no sound or will not load (AC3/DTS sound, some MKVs). Always uses it for every file; Standard only never does. The VHS and Smart ratio looks do not apply to the backup player.',
    buf: 'Loads the programme ahead of the picture on this device, to ride out slow spells.',
    span: 'How much airtime each channel\u2019s guide is built to cover before it repeats. Shorter picks a varied mix; longer shows more days. On Demand always lists everything.',
    keep: 'How long a channel\u2019s line-up stays as it is before it is built afresh.',
    refresh: 'Throws away every line-up and builds them all again in a new running order.',
    rel: 'What changed in this version and the ones before it.',
    about: 'Where the programmes, artwork and details come from.',
    epg: 'What each channel\u2019s guide is built from and what it will show for the next 24 hours, with any problems such as the same show three times in a row.',
    log: 'What failed to play and why, ready to send when something goes wrong.'
  };
  var optsShown = {};     // what each row last said, so a key press only touches the rows that changed
  function setIf(el, prop, val) { if (el[prop] !== val) el[prop] = val; }
  /** The choices a row cycles through, shown as buttons while the row is highlighted; null for a row with none. */
  function optChoices(id) {
    if (id === 'player') return { l: PLAYERS.map(function (x) { return x.label; }), i: playerIdx };
    if (id === 'theme') return { l: THEMES.map(function (x) { return x.label; }), i: themeIdx };
    if (id === 'season') return { l: ['Auto', 'Off'], i: seasonOn ? 0 : 1 };
    if (id === 'span') return { l: SPANS.map(function (x) { return x.label; }), i: spanIdx };
    if (id === 'keep') return { l: KEEP.map(function (x) { return x.label; }), i: keepIdx };
    if (id === 'mkeep') return { l: META_KEEP.map(function (x) { return x.label; }), i: metaIdx };
    if (id === 'buf') return { l: BUF.map(function (x) { return x.label; }), i: bufIdx };
    if (id === 'ar') return { l: AR.map(function (x) { return x.label; }), i: arIdx };
    if (id === 'ads') return { l: ['Off', 'On'], i: adEra === 'off' ? 0 : 1 };
    if (id === 'fx') { var ks = Object.keys(FXLABEL); return { l: ks.map(function (k) { return FXLABEL[k]; }), i: Math.max(0, ks.indexOf(fxMode)) }; }
    return null;
  }
  function renderOpts() {
    // the size of everything saved takes a moment to add up, so it is only worked out once its row is reached
    if (OPTS[optsSel] !== 'mclear' || !optsZone) clearTimeout(metaSizeTimer);            // scrolled past it: no need to add it up
    else if (optsOpen && !metaSizeText) refreshMetaSize();
    var cat = OCATS[optsCat];
    OCATS.forEach(function (c, i) {
      var cls = 'ocat' + (i === optsCat ? (optsZone ? ' cur' : ' sel') : ''), el = $('oc-cat-' + c.id), g = $('og-' + c.id), gc = 'ogrp' + (i === optsCat ? ' on' : '');
      if (el.className !== cls) el.className = cls;
      if (g.className !== gc) g.className = gc;
    });
    cat.rows.forEach(function (id) {
      var i = OPTS.indexOf(id), ch = optChoices(id), sel = !!optsZone && i === optsSel;
      var val = optValue(id), cls = 'orow' + (ACTION[id] ? ' act' : '') + (sel ? ' sel' : '') + (ch ? ' hasc' : ''), was = optsShown[id] || {};
      if (was.v !== val) setIf($('ov-' + id), 'textContent', val);
      if (was.c !== cls) setIf($('or-' + id), 'className', cls);
      var sig = ch ? ch.l.join('|') + '#' + ch.i : '';
      if (sig !== was.s) {
        var box = $('oc-' + id);
        box.textContent = '';
        if (ch) ch.l.forEach(function (t, n) { var d = document.createElement('div'); d.className = 'ochip' + (n === ch.i ? ' on' : ''); d.textContent = t; box.appendChild(d); });
      }
      optsShown[id] = { v: val, c: cls, s: sig };
    });
    applyTheme(gChan || (cur && cur.ch));
    var pv = $('otpv'), pc = 'otpv' + (themeNow === 'classic' || !themeNow ? '' : ' gt-' + themeNow);
    if (pv && pv.className !== pc) pv.className = pc;
    var help = optsZone ? (OPT_HELP[OPTS[optsSel]] || '') : '', ver = relName();
    if (optsShown._h !== help) { $('ohelp').textContent = help; optsShown._h = help; }
    if (optsShown._r !== ver) { $('over').textContent = ver; optsShown._r = ver; }
    var back = optsZone ? 'Back to categories' : 'Back to close';
    if (optsShown._b !== back) { $('oback').lastChild.textContent = ' ' + back.slice(5); optsShown._b = back; }
  }
  function openOpts() {
    closeOsd();
    optsOpen = true; optsCat = 0; optsZone = 0; optsSel = OPTS.indexOf(OCATS[0].rows[0]);
    renderOpts();
    $('opts').className = '';
    optsTouch();
  }
  function closeOpts() { optsOpen = false; clearTimeout(optsTimer); $('opts').className = 'hidden'; }
  function optsTouch() { clearTimeout(optsTimer); optsTimer = setTimeout(closeOpts, 20000); }
  /** Throw away every stored lineup and gather them again, in a new running order. Asks twice: it reloads. */
  var refreshArmed = false, refreshTimer = null;
  function refreshEpg() {
    if (!refreshArmed) {
      refreshArmed = true;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(function () { refreshArmed = false; renderOpts(); }, 5000);
      renderOpts();
      toast('Press OK again to build every channel afresh', 4500);
      return;
    }
    refreshArmed = false;
    clearTimeout(refreshTimer);
    epgGen = (epgGen + 1) % 100000;
    store.set('epggen', epgGen);
    try {
      var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
        var kn = _ks[k];
        if (kn && /^plan7[ad]?:/.test(kn)) kv.removeItem(kn);
      }
    } catch (e) { /* ignore */ }
    toast('Building every channel afresh\u2026', 4000);
    renderOpts();
    setTimeout(function () { location.reload(); }, 1200);   // the start-up loading screen does the rebuild
  }

  // Debug Live view: shows this screen, the debug text and a remote on a browser on the home network. Off until switched
  // on here, and off again each time the app starts.
  var liveAddr = '', liveTimer = null;
  function liveText() {
    var o = ['Telly Addicts live view', 'Version: ' + relName(), 'Written: ' + new Date().toString(),
      'Channel: ' + (cur && cur.ch ? cur.ch.n + ' ' + cur.ch.name : '(none)'), 'Programme: ' + (cur && cur.prog ? cur.prog.title : '(none)'),
      'Playing: ' + (v && !v.paused && v.currentTime > 0 ? 'yes at ' + Math.round(v.currentTime) + 's' : 'no'),
      'Screen: ' + (optsOpen ? 'Options' : odOpen ? 'On Demand' : guideOpen ? 'Guide' : 'Playing'), ''];
    return o.concat(DLOG.slice(-80)).join('\n');
  }
  function liveToggle() {
    if (!window.NativeHttp || !NativeHttp.liveStart) { toast('Needs a newer app', 2500); return; }
    if (liveAddr) {
      try { NativeHttp.liveStop(); } catch (e) { /* ignore */ }
      liveAddr = ''; clearInterval(liveTimer); liveTimer = null;
    } else {
      try { liveAddr = NativeHttp.liveStart() || ''; } catch (e) { liveAddr = ''; }
      if (!liveAddr) toast('No home network found', 2500);
      else { liveTimer = setInterval(function () { try { NativeHttp.liveState(liveText()); } catch (e) { /* ignore */ } }, 2000); try { NativeHttp.liveState(liveText()); } catch (e) { /* ignore */ } }
    }
    renderOpts();
  }

  function optsChange(d) {
    var id = OPTS[optsSel];
    if (id === 'od') odOpenUi();
    else if (id === 'ar') changeAr(d);
    else if (id === 'fx') changeFx(d);
    else if (id === 'gart') { gartOn = !gartOn; store.set('gart', gartOn ? 'on' : 'off'); gartFor = '\u0000'; artFor = ''; osdArt(); renderOpts(); }
    else if (id === 'ads') changeAds(d);
    else if (id === 'season') { seasonOn = !seasonOn; store.set('seasonal', seasonOn ? 'auto' : 'off'); seasonUpdate(); renderOpts(); }
    else if (id === 'player') changePlayer(d);
    else if (id === 'buf') changeBuf(d);
    else if (id === 'span') changeSpan(d);
    else if (id === 'theme') changeTheme(d);
    else if (id === 'keep') changeKeep(d);
    else if (id === 'mkeep') changeMetaKeep(d);
    else if (id === 'mclear') clearMeta();
    else if (id === 'refresh') refreshEpg();
    else if (id === 'rel') openRel('rel');
    else if (id === 'log') openRel('log');
    else if (id === 'live') liveToggle();
    else if (id === 'gaps') openRel('gaps');
    else if (id === 'epg') openRel('epg');
    else if (id === 'about') openRel('about');
  }
  function optsKey(k) {
    optsTouch();
    var rows = OCATS[optsCat].rows;
    if (k === 'Guide' || k === 'Red') { closeOpts(); openGuide(); return true; }
    if (!optsZone) {
      if (k === 'ArrowUp') optsCat = (optsCat + OCATS.length - 1) % OCATS.length;
      else if (k === 'ArrowDown') optsCat = (optsCat + 1) % OCATS.length;
      else if (k === 'ArrowRight' || k === 'Enter' || k === ' ') { optsZone = 1; optsSel = OPTS.indexOf(OCATS[optsCat].rows[0]); }
      else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') closeOpts();
      if (optsOpen) { optsSel = OPTS.indexOf(OCATS[optsCat].rows[0]); renderOpts(); }
      return true;
    }
    var id = OPTS[optsSel], at = rows.indexOf(id);
    if (k === 'ArrowUp') optsSel = OPTS.indexOf(rows[(at + rows.length - 1) % rows.length]);
    else if (k === 'ArrowDown') optsSel = OPTS.indexOf(rows[(at + 1) % rows.length]);
    else if (k === 'ArrowLeft') { if (ACTION[id]) optsZone = 0; else { optsChange(-1); return true; } }
    else if (k === 'ArrowRight' || k === 'Enter' || k === ' ') { optsChange(1); return true; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') optsZone = 0;
    renderOpts();
    return true;
  }

  var ERA_SHORT = { off: 'Off', all: 'All', '70': '70s', '80': '80s', '90': '90s' };
  function changeAds(d) {
    var wasOff = adEra === 'off';
    adEra = wasOff ? 'all' : 'off';
    store.set('adera', adEra);
    if (wasOff !== (adEra === 'off')) {              // the guide has breaks listed in it, or not: rebuild it
      renderOpts();
      toast('Adverts ' + (adEra === 'off' ? 'off' : 'on') + '. Rebuilding the guides\u2026', 3000);
      clearTimeout(spanTimer);
      spanTimer = setTimeout(function () { location.reload(); }, 2200);
      return;
    }
    if (cur) loadAds(cur.ch, true);
    renderOpts();
  }
  function fmtPos(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = Math.floor(t % 60);
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function renderOsd() {
    if (!cur) return;
    var sched = cur.ch.sched;
    var next = cur.od ? odPeek() : sched.order[(cur.index + 1) % sched.order.length];
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
    var dur = v.duration, pos = scrubT === null ? v.currentTime : scrubT;
    $('oprog').className = (osdZone === 'bar' ? 'sel' : '') + (scrubT !== null ? ' scrub' : '');
    var pct = (isFinite(dur) && dur > 0 ? Math.min(100, pos / dur * 100) : 0) + '%';
    $('obar').style.width = pct; $('othumb').style.left = pct;
    var ahead = loadedTo();
    var buf = $('obuf');
    buf.style.width = (isFinite(dur) && dur > 0 && ahead > 0 ? Math.min(100, ahead / dur * 100) : 0) + '%';
    buf.className = playingLocally() ? 'local' : '';
    var secs = ahead > pos ? Math.round(ahead - pos) : 0;
    $('otime').textContent = (scrubT !== null ? '\u25b6\u25b6 ' : '') + fmtPos(pos) + (isFinite(dur) && dur > 0 ? ' / ' + fmtPos(dur) : '') +
      (secs > 1 ? '   ·   ' + fmtPos(secs) + ' ahead' + (playingLocally() ? ' on this device' : '') : '');
    $('olbl-pp').textContent = v.paused ? 'Play' : 'Pause';
    $('oic-pp').textContent = v.paused ? '▶' : '❚❚';
    var ob = obList();
    if (osdSel > ob.length - 1) osdSel = ob.length - 1;
    OB_ALL.forEach(function (id) { var i = ob.indexOf(id), e = $('ob-' + id); e.className = 'ob' + (i < 0 ? ' hidden' : '') + (osdZone === 'btn' && i === osdSel ? ' sel' : ''); });
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
    var film = filmFor(cur.prog);                              // a film already has its poster: no lookup needed
    if (film) {
      if (film.poster) {
        art.onerror = function () { art.className = 'hidden'; };
        art.src = film.poster; art.className = '';
        bg.style.backgroundImage = 'url("' + film.poster + '")'; bg.className = 'on';
      }
      return;
    }
    var p = parseTitle(title);
    if (cur.prog && cur.prog.show) p.show = cur.prog.show;
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
    osdSel = obList().indexOf('pp');      // start on play/pause
    osdZone = 'btn'; scrubT = null;
    clearTimeout(bannerTimer);
    $('banner').className = 'off';
    renderOsd();
    $('osd').className = '';
    clearInterval(osdTick);
    osdTick = setInterval(function () { renderOsd(); osdArt(); }, 500);
    osdTouch();
  }

  function closeOsd() {
    scrubApply();
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

  function restartShow() {
    closeOsd();
    try { v.currentTime = 0; } catch (e) { /* not seekable */ }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* ignore */ });
    toast('Starting again from the beginning', 2000);
  }

  function osdAct(id) {
    if (id === 'pp') togglePlay();
    else if (id === 'next') { closeOsd(); if (cur && cur.ad && !isAdChan(cur.ch)) skipAds(); else playNext(); return; }
    else if (id === 'skipad') { closeOsd(); skipAds(); return; }
    else if (id === 'restart') { restartShow(); return; }
    else if (id === 'options') { openOpts(); return; }
    else if (id === 'od') { closeOsd(); odOpenUi(); return; }
    else if (id === 'guide') { closeOsd(); openGuide(); }
    else if (id === 'info') { closeOsd(); openInfo(); return; }
    renderOsd();
  }

  function osdKey(k) {
    osdTouch();
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (osdZone === 'bar') scrubKey(k === 'ArrowLeft' ? -1 : 1);
      else { osdSel = Math.max(0, Math.min(obList().length - 1, osdSel + (k === 'ArrowLeft' ? -1 : 1))); renderOsd(); }
    }
    else if (k === 'Enter') { if (osdZone === 'bar') { if (scrubT !== null) scrubApply(); else osdAct('pp'); } else osdAct(obList()[osdSel]); }
    else if (k === 'MediaRewind') scrubKey(-1);
    else if (k === 'MediaFastForward') scrubKey(1);
    else if (k === 'MediaNext') osdAct('next');
    else if (k === 'MediaPlayPause' || k === ' ') osdAct('pp');
    else if (k === 'MediaPlay') { v.play(); setTimeout(renderOsd, 60); }
    else if (k === 'MediaPause') { v.pause(); setTimeout(renderOsd, 60); }
    else if (k === 'Guide' || k === 'Red') { closeOsd(); openGuide(); }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') closeOsd();
    else if (k === 'ArrowUp' && osdZone === 'btn') { osdZone = 'bar'; renderOsd(); }
    else if (k === 'ArrowDown' && osdZone === 'bar') { scrubApply(); osdZone = 'btn'; renderOsd(); }
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

    if (quitOpen) { quitKey(k); e.preventDefault(); return; }
    if (!odOpen && (k === 'GoBack' || k === 'Escape' || k === 'Backspace')) {
      var nowT = Date.now();
      // only a Back pressed on the plain picture (or the guide with nothing playing) counts towards quitting:
      // one that closes the guide, the bar, the options or a panel never does
      if (relOpen || infoOpen || optsOpen || osdOpen || gm || (guideOpen && cur)) lastBack = 0;
      else if (!e.repeat && nowT - lastBack < DOUBLE_BACK_MS) { lastBack = 0; openQuit(); e.preventDefault(); return; }
      else if (!e.repeat) lastBack = nowT;
    }

    if (relOpen) {                        // What's new sits above the options panel it was opened from
      if (relKey(k)) e.preventDefault();
      return;
    }

    if (infoOpen) {                       // info panel: any of these closes it, everything else is ignored
      if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Enter' || k === ' ' || k === 'Info') closeInfo();
      e.preventDefault();
      return;
    }

    if (odOpen) { odKey(k); e.preventDefault(); return; }
    if (gm) { if (k !== 'Info') gmKey(k); e.preventDefault(); return; }
    if (k === 'Menu' || k === 'ContextMenu') { odOpenUi(); e.preventDefault(); return; }

    if (guideOpen) {
      // On Demand is a button at the top of the guide: Left from what is on now (or Up from the first channel) reaches it, OK opens it
      if (gOd && (k === 'Enter' || k === ' ')) { gOdSet(false); odOpenUi(); }
      else if (gOd && k === 'ArrowDown') gOdSet(false);
      else if (gOd && k === 'ArrowUp') { gOdSet(false); gMove(-1, true); }
      else if (gOd && k === 'ArrowRight') gOdSet(false);
      else if (gOd && (k === 'ArrowLeft' || k === 'ChannelUp' || k === 'ChannelDown')) { /* nothing to move along */ }
      else if (k === 'ArrowUp') gMove(-1, true);                      // from the first channel it wraps round to the last (the On Demand button is reached with Left)
      else if (k === 'ArrowDown') gMove(1, true);
      else if (k === 'ChannelUp') gMove(-(VISIBLE_ROWS - 1), false);
      else if (k === 'ChannelDown') gMove(VISIBLE_ROWS - 1, false);
      else if (k === 'ArrowLeft') gHoriz(-1);
      else if (k === 'ArrowRight') gHoriz(1);
      else if (k === 'Red') gJump('now');
      else if (k === 'Green' || k === 'MediaFastForward') gJump('later');
      else if (k === 'Yellow' || k === 'MediaRewind') gJump('earlier');
      else if (k === 'Enter' || k === ' ') watchFromGuide();
      else if (k === 'Blue') watchFromGuide();
      // in the guide: Back goes back to what is playing; with nothing playing, Back twice leaves the app
      else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { if (cur) closeGuide(); else pressBackToExit(); }
      else if (k === 'Guide') closeGuide();
      else if (k === 'Info') gmOpen();
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
    else if (k === 'ArrowRight' || k === 'MediaFastForward') { scrubKey(1); }
    else if (k === 'ArrowLeft' || k === 'MediaRewind') { scrubKey(-1); }
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


  // ------------------------------------------------------------------ On Demand
  // Browse by channel, then show, then series and episode, and play any of it from the start. Not clock-synced:
  // it plays like a recording, with the usual bar to pause and skip, and carries on to the next episode.
  var odOpen = false, odFrom = '', odGuide = null, odData = {}, odArtFor = '', odBgFor = '';
  var odView = 'home', odRi = 0, odRc = null, odTop = 0, odPos = {}, odZone = 0, odSea = 0, odEi = 0;
  var OD_VIS = 7;           // posters across a row
  var OD_EPS = 3;           // episodes on screen at once
  var OD_SKIP = { xmasmusic: 1, tvarchive: 1 };         // songs and dated clips are not shows
  var OD_FILMS = { kidsmovies: 1, videoshop: 1, xmasmovies: 1 };       // the film channels: each film is its own one-video title
  function odChannels() {
    return guideList().filter(function (c) { return c.status === 'ready' && !OD_SKIP[c.id]; });
  }
  function odPad(n) { return n < 10 ? '0' + n : String(n); }
  function odEpLabel(p, ref) {
    var m = /^(.*?)\s+S\d{1,4}[ED]\d{1,3}\b\s*(.*)$/i.exec(p.title || '');
    if (ref && m) return 'E' + odPad(ref.e) + (m[2] ? '   ' + m[2] : '');
    return p.title || '';
  }
  /** A flat card colour for a show with no picture: the same name always gets the same colour. */
  function odTone(name) {
    var h = 0, s = String(name || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return 'linear-gradient(160deg,hsl(' + h + ',42%,30%),hsl(' + h + ',46%,11%))';
  }
  /** A show's episodes in seasons: every real season in order, then everything that does not fit one
   *  (specials, unnumbered files, odd names) in "Other videos" at the end. A show with no seasons at all is one list. */
  function odSeasons(g) {
    var by = {}, other = [], list = [];
    g.eps.forEach(function (ep) { if (ep.s > 0) (by[ep.s] = by[ep.s] || []).push(ep); else other.push(ep); });
    Object.keys(by).map(Number).sort(function (x, y) { return x - y; }).forEach(function (n) { list.push({ name: n >= 1900 ? String(n) : 'Season ' + n, eps: by[n] }); });
    if (other.length) list.push({ name: list.length ? 'Other videos' : 'Videos', eps: other });
    var per = {};
    g.eps.forEach(function (ep) { var m = /\/download\/([^/]+)\//.exec(ep.p.url || ''); ep.item = m ? m[1] : ''; if (ep.item) per[ep.item] = (per[ep.item] || 0) + 1; });
    g.eps.forEach(function (ep) { ep.thumb = ep.item && per[ep.item] === 1 ? 'https://archive.org/services/img/' + ep.item : ''; });   // a shared item would repeat one picture
    g.sea = list;
    g.flat = [];
    list.forEach(function (sn) { g.flat = g.flat.concat(sn.eps); });
  }
  /** A channel's programmes grouped into shows, each with its seasons and episodes in order. */
  function odGroup(progs, films) {          // films: a film channel, where every video is its own title
    var by = {}, shows = [];
    progs.forEach(function (p) {
      var name = (p.filmKey || films) ? (p.title || 'Film') : (p.show || p.group || (parseTitle(p.title || '').show) || 'Other');   // a film is its own title
      var k = 'k' + LIBROUTE.norm(name);
      var g = by[k];
      if (!g) { g = by[k] = { name: name, eps: [], seen: {} }; shows.push(g); }
      var ref = window.LINKS && LINKS.parseEp(p.title);
      var key = ref ? ref.s + 'x' + ref.e : '';
      if (key) { if (g.seen[key]) return; g.seen[key] = 1; }
      g.eps.push({ p: p, s: ref ? ref.s : 0, e: ref ? ref.e : 0, label: odEpLabel(p, ref), year: p.aired ? String(p.aired).slice(0, 4) : '' });
    });
    shows.sort(function (a, b) { var x = LIBROUTE.norm(a.name), y = LIBROUTE.norm(b.name); return x < y ? -1 : x > y ? 1 : 0; });
    shows.forEach(function (g) {
      g.eps.sort(function (a, b) {
        return (a.s - b.s) || (a.e - b.e) || (String(a.p.aired || '') < String(b.p.aired || '') ? -1 : String(a.p.aired || '') > String(b.p.aired || '') ? 1 : 0) ||
               String(a.label).localeCompare(String(b.label), undefined, { numeric: true, sensitivity: 'base' });
      });
      g.film = !!films || !!(g.eps[0] && g.eps[0].p.filmKey);
      odSeasons(g);
    });
    return shows;
  }
  function odLoadChannel(ch) {
    if (ch.id === '_cw') return Promise.resolve(odData._cw || { shows: [] });     // the Continue watching row is made from the others
    var rec = odData[ch.id];
    if (rec) return rec.p;
    rec = odData[ch.id] = { shows: null };
    rec.p = loadDataIndex().then(function (idx) { return loadChannelData(ch.id, idx[ch.id] || ''); }).then(function (rows) {
      var progs = rows && rows.length ? progsFromData(rows, ch.id, true).filter(function (p) { return (OD_FILMS[ch.id] || !p.filmKey) && !blocked(p); }) : [];
      // On Demand shows everything that is stored: no certificate is needed for a film, and the two film channels
      // are not trimmed by era either. (The schedule on the guide still applies those rules.)
      rec.shows = odGroup(OD_FILMS[ch.id] ? progs : progs.filter(function (p) { return ch.id === 'disney' || inEra(p); }), !!OD_FILMS[ch.id]);
      rec.shows.forEach(function (g) { g.chan = ch; });
      odRowsMemo = null;
      return rec;
    }, function () { rec.shows = []; return rec; });
    return rec.p;
  }
  /** A show's episode details (titles, summaries, stills) from the scraper's data/eps/<slug>.json, kept for a week. */
  function odSlug(name) { return LIBROUTE.norm(name).replace(/ /g, '-'); }
  var epsMap = null;      // index.json "eps": {slug: revision} of the episode guides the scraper has published
  function odMeta(g) {
    if (g.metaP) return g.metaP;
    var slug = odSlug(g.name), key = 'eps1:' + slug, c = store.get(key);
    var done = function (m) {
      g.meta = null;
      if (m && m.eps) {
        g.meta = {};
        m.eps.forEach(function (e) {
          // the guide's stills are TVmaze's full-size originals: a TV decodes the medium size far faster and it is plenty for a thumbnail
          if (e.img) e.img = String(e.img).replace('/original_untouched/', '/medium_landscape/');
          g.meta[e.s + 'x' + e.e] = e;
        });
        g.seasons = m.seasons || {};
      }
    };
    /** TVmaze's own episode list, one request for the whole show, for a show the scraper has no guide for. */
    var fromTvmaze = function () {
      return artShow(g.name).then(function (art) {
        if (!art || !art.i) return { m: null, x: Date.now() + 24 * 3600 * 1000 };
        return getJSON('https://api.tvmaze.com/shows/' + art.i + '/episodes').then(function (list) {
          var eps = (Array.isArray(list) ? list : []).filter(function (e) { return e && e.season && e.number; }).map(function (e) {
            var o = { s: e.season, e: e.number };
            if (e.name) o.t = e.name;
            if (e.airdate) o.a = e.airdate;
            if (e.runtime) o.l = e.runtime;
            var d = plain(e.summary); if (d) o.d = d.length > 400 ? d.slice(0, 397) + '...' : d;
            var img = https(e.image && (e.image.medium || e.image.original)); if (img) o.img = img;
            return o;
          });
          // looked at again in a week, so the scraper's own guide takes over once it is published
          return { m: eps.length ? { eps: eps } : null, x: Date.now() + (eps.length ? 7 * 24 * 3600 * 1000 : 3600 * 1000) };
        }, function () { return { m: null, x: Date.now() + 3600 * 1000 }; });
      });
    };
    var save = function (r) { store.set(key, { t: Date.now(), x: r.x, rev: r.rev || '', m: r.m }); done(r.m); };
    g.metaP = loadDataIndex().then(function () {
      var rev = epsMap && epsMap[slug];
      if (rev) {                                       // the scraper has a guide: kept for as long as its revision stays the same
        if (c && c.rev === rev && c.m) { done(c.m); return; }
        return getJSON(DATA_BASE + 'eps/' + encodeURIComponent(slug) + '.json').then(function (m) {
          if (m && m.eps) return save({ m: m, x: 0, rev: rev });
          return fromTvmaze().then(save);
        }, function () { return c && c.m ? done(c.m) : fromTvmaze().then(save); });
      }
      if (metaFresh(c)) { done(c.m); return; }
      if (epsMap) return fromTvmaze().then(save);      // the scraper publishes guides and has none for this show
      // an older index that does not list guides: try the scraper's file, then TVmaze
      return getJSON(DATA_BASE + 'eps/' + encodeURIComponent(slug) + '.json').then(function (m) { return m && m.eps ? m : null; }, function () { return null; })
        .then(function (m) { return m ? { m: m, x: 0 } : fromTvmaze(); }).then(save);
    });
    return g.metaP;
  }
  // ---- Continue watching: the last few On Demand shows you were part-way through, newest first
  var cwList = null, cwGen = 0, CW_MAX = 12;
  function cwGet() { if (!cwList) cwList = store.get('cw1') || []; return cwList; }
  function cwPut(name, chId, url, pos, dur) {
    var l = cwGet().filter(function (e) { return e.n !== name; });
    l.unshift({ n: name, ch: chId, url: url, pos: Math.round(pos), dur: Math.round(dur || 0), t: Date.now() });
    cwList = l.slice(0, CW_MAX); cwGen++;
    store.set('cw1', cwList);
  }
  function cwDrop(name) {
    cwList = cwGet().filter(function (e) { return e.n !== name; }); cwGen++;
    store.set('cw1', cwList);
    Object.keys(odData).forEach(function (k) { var r = odData[k]; if (r && r.shows) r.shows.forEach(function (g) { if (g._cw && g._cw.n === name) g._cw = null; }); });
  }
  var cwLast = 0;
  v.addEventListener('timeupdate', function () {         // every 10 s of an On Demand episode, remember where you are
    var o = cur && cur.od;
    if (!o || cur.ad || !o.name || v.paused || !(v.currentTime > 5)) return;
    var now = Date.now();
    if (now - cwLast < 10000) return;
    cwLast = now;
    cwPut(o.name, cur.ch.id, cur.prog.url, v.currentTime, isFinite(v.duration) ? v.duration : 0);
  });
  var cwPseudo = { id: '_cw', n: '', name: 'Continue watching' }, cwSig = '';
  /** The Continue watching row, or null when there is nothing in it. It reuses the shows of the channel lists
   *  (so posters and details come for free); a show whose channel list is not built yet simply is not in it yet. */
  function odCwRow() {
    var shows = [], sig = '';
    cwGet().forEach(function (e) {
      var rec = odData[e.ch], g = null;
      if (rec && rec.shows) for (var i = 0; i < rec.shows.length; i++) if (rec.shows[i].name === e.n) { g = rec.shows[i]; break; }
      if (g) { g._cw = e; shows.push(g); sig += e.n + e.pos + ','; }
    });
    if (!shows.length) return null;
    if (sig !== cwSig || !odData._cw) { cwSig = sig; odData._cw = { shows: shows }; }
    return cwPseudo;
  }
  /** Where to start an episode: where it was left, unless that was the first half-minute or the last minute. */
  function odResumeAt(g, ep) {
    var e = g && g._cw;
    return e && ep && ep.p && e.url === ep.p.url && e.pos > 30 && (!e.dur || e.pos < e.dur - 60) ? e.pos : 0;
  }
  var odRowsMemo = null;
  function odRowList() {
    if (odRowsMemo) return odRowsMemo;
    setTimeout(function () { odRowsMemo = null; }, 0);
    var rows = odChannels().filter(function (c) { var r = odData[c.id]; return !(r && r.shows && !odShowsOf(c).length); });
    var cw = odCwRow();
    return (odRowsMemo = cw ? [cw].concat(rows) : rows);
  }
  /** On Demand has no clock, but films keep the watershed: family films all day, 15s from eight, the rest after nine,
   *  as on the film channels. Without a certificate a film counts as an 18. */
  /** A channel's shows in On Demand: everything stored, whatever a film's certificate says. */
  function odShowsOf(c) {
    var r = c && odData[c.id];
    return r && r.shows;
  }
  /** Where the highlight is: the channel row, and the show in it. */
  function odSel() {
    var rows = odRowList();
    // the channel row is followed by channel, not by number: rows with nothing in them drop out as lists load, which would slide the highlight onto a neighbour
    var at = odRc ? rows.indexOf(odRc) : -1;
    if (at >= 0) odRi = at;
    odRi = Math.max(0, Math.min(odRi, rows.length - 1));
    odRc = rows[odRi] || null;
    var c = rows[odRi], sh = odShowsOf(c), i = c ? (odPos[c.id] || 0) : 0;
    return { c: c, rows: rows, sh: sh, g: sh && sh.length ? sh[Math.min(i, sh.length - 1)] : null };
  }
  function odEl(tag, cls, text) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (text != null) d.textContent = text;
    return d;
  }
  /** The artwork already on hand for a show; a film's is its own poster. */
  var odKGen = 0;       // bumped whenever artwork is chosen, so remembered pictures are looked up again
  function odKnown(g) {
    if (!g) return null;
    if (g._k && g._kg === odKGen) return g._k;
    var k = knownArt(g.film ? g.eps[0].p : { title: g.name, show: g.name });
    if (k && (k.poster || k.back)) { g._k = k; g._kg = odKGen; }     // only a found picture is remembered; a missing one is asked again
    return k;
  }
  function odDesc(g) {
    if (g.film) { var f = filmFor(g.eps[0].p); return f && f.plot || ''; }
    return (g.art && g.art.s) || '';
  }
  var odBgTimer = null, odLastG = '', odLastS = '';
  function odSetBg(g) {
    var k = odKnown(g);
    var want = g ? g.name + '|' + (k && k.back || '') : '';
    if (want === odBgFor) return;
    odBgFor = want;
    var img = k && k.back ? 'url("' + k.back + '")' : (g ? odTone(g.name) : 'none');
    clearTimeout(odBgTimer);                      // a big picture takes a moment to decode: wait until the highlight rests
    odBgTimer = setTimeout(function () { var b = $('odbg'); b.style.backgroundImage = img; if (b.animate) try { b.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' }); } catch (e) { /* no animation */ } }, 140);
  }
  /** The show's own details (network, years, summary) and artwork, looked up once the highlight has rested on it. */
  var odMetaTimer = null;
  function odLookups(g) {
    clearTimeout(odMetaTimer);
    if (!g || g.film) return;                     // a film's details came with the library
    odMetaTimer = setTimeout(function () {
      if (!odOpen) return;
      if (g.art === undefined) { g.art = null; artShow(g.name).then(function (x) { g.art = x || null; odKGen++; if (odOpen && odSel().g === g) odRender(); }); }
      if (gartOn && !odKnown(g) && odArtFor !== g.name) {
        odArtFor = g.name;
        var p = parseTitle(g.name + ' S01E01'); p.show = g.name;
        tvmInfo(p).then(function () { odKGen++; if (odOpen && odSel().g === g) odRender(); }, function () { /* no artwork */ });
      }
    }, 350);
  }
  /** The show's clear logo (a transparent title picture the scraper found, art.json "l") in place of the plain title.
   *  The text stays until the picture has loaded, and comes back if it fails. */
  function odLogo(img, h1, g) {
    var url = g && !g.film && g.art && g.art.l ? https(g.art.l) : '';
    if (!url) { if (img.dataset.src) { img.dataset.src = ''; img.className = 'hidden'; img.removeAttribute('src'); } h1.style.display = ''; return; }
    if (img.dataset.src === url) return;
    img.dataset.src = url; img.className = 'hidden'; h1.style.display = '';
    img.onload = function () { if (img.dataset.src === url) { img.className = ''; h1.style.display = 'none'; } };
    img.onerror = function () { img.className = 'hidden'; h1.style.display = ''; };
    img.src = url;
  }
  function odInfoLine(g) {
    if (g.film) { var f = filmFor(g.eps[0].p) || {}; return [f.released ? String(f.released).slice(0, 4) : '', f.genres || '', f.mins ? f.mins + ' min' : '', g.eps[0].p.cert || ''].filter(Boolean).join('  \u00b7  '); }
    var x = g.art;
    return x ? [x.n || '', x.y ? x.y + (x.e && x.e !== x.y ? '–' + x.e : '') : '', x.g || ''].filter(Boolean).join('  ·  ') : '';
  }
  var odBusy = false;     // opening straight onto the show that is playing: nothing to show until it is found
  function odRender() {
    $('odload').className = odOpen && (odBusy || (odView === 'home' && odSel().sh == null)) ? '' : 'hidden';
    if (odView === 'show') odRenderShow(); else odRenderHome();
    $('odfoot').textContent = odView === 'show'
      ? '▲ ▼ move   ◀ seasons   ▶ episodes   OK play   Back'
      : '◀ ▶ browse   ▲ ▼ channels   OK open   Back';
  }
  var rowIsCw = false;
  /** One poster element per show, kept and reused: moving along a row re-attaches the ones already built (and decoded)
   *  instead of making new ones, which is what made browsing stutter on the TV. */
  function odCard(g, sel) {
    var key = rowIsCw ? '_elc' : '_el', d = g[key], gen = odKGen + ':' + cwGen;
    if (!d) { d = g[key] = odEl('div', 'odc'); d._g = ''; }
    if (d._g !== gen) {
      d._g = gen; d.textContent = '';
      var k = odKnown(g);
      if (k && (k.poster || k.back)) d.style.backgroundImage = 'url("' + (k.poster || k.back) + '")';
      else { d.style.backgroundImage = odTone(g.name); d.appendChild(odEl('b', '', g.name)); }
      var w = g._cw && g._cw.dur ? Math.min(100, Math.round(100 * g._cw.pos / g._cw.dur)) : 0;
      if (w > 1 && rowIsCw) { var pg = odEl('div', 'odpg'); var bar = odEl('i'); bar.style.width = w + '%'; pg.appendChild(bar); d.appendChild(pg); }
    }
    d.className = 'odc' + (sel ? ' sel' : '');
    return d;
  }
  /** Slide freshly placed items in from where they were: by n units (vw or vh) along x or y. Quicker while a key is held. */
  var odSlideAt = 0;
  function odSlide(els, n, unit, vert) {
    if (!els[0] || !els[0].animate) return;
    var now = Date.now(), dur = now - odSlideAt < 220 ? 90 : 170;
    odSlideAt = now;
    var t = vert ? 'translateY' : 'translateX';
    for (var i = 0; i < els.length; i++) {
      var sc = els[i].classList.contains('sel') ? ' scale(1.06)' : '';
      try { els[i].animate([{ transform: t + '(' + n + unit + ')' + sc }, { transform: t + '(0)' + sc }], { duration: dur, easing: 'ease-out' }); } catch (e) { /* no animation */ }
    }
  }
  /** Fade a piece of text in when it changes to another show. */
  function odFade(el) { if (el.animate) try { el.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); } catch (e) { /* no animation */ } }
  var odDom = [];       // what the home rows on screen were built from: a key press that stays inside them only moves the highlight
  function odRenderHome() {
    var s = odSel(), rows = s.rows, box = $('odrows');
    odTop = odRi;                                  // the highlighted row is always the first on screen; the next one peeks below it
    var want = [];
    for (var ri = odTop; ri < Math.min(rows.length, odTop + 2); ri++) {
      var c = rows[ri], sh = odShowsOf(c), n = sh ? sh.length : 0;
      var pos = n ? Math.min(odPos[c.id] || 0, n - 1) : 0, start = n ? Math.max(0, Math.min(pos - 2, n - OD_VIS)) : 0;
      want.push({ ri: ri, c: c, sh: sh, pos: pos, start: start, n: n });
    }
    var same = odDom.length === want.length && box.children.length === want.length;
    for (var w = 0; same && w < want.length; w++) same = odDom[w].c === want[w].c && odDom[w].sh === want[w].sh && odDom[w].start === want[w].start && odDom[w].n === want[w].n && odDom[w].gen === odKGen;
    if (same) {                                   // cheap path: move the highlight, touch nothing else
      want.forEach(function (x, wi) {
        var cards = box.children[wi].lastChild.children, old = odDom[wi].sel, now = x.ri === odRi && x.n ? x.pos - x.start : -1;
        if (old !== now) {
          if (cards[old]) cards[old].classList.remove('sel');
          if (cards[now]) cards[now].classList.add('sel');
          odDom[wi].sel = now;
        }
      });
    } else {
      var prevDom = odDom;
      box.textContent = '';
      odDom = [];
      var frag = document.createDocumentFragment();
      want.forEach(function (x) {
        var row = odEl('div', 'odrow'), h = odEl('h3', '', (x.c.n ? x.c.n + '   ' : '') + x.c.name);
        if (x.sh) h.appendChild(odEl('span', '', x.n + (x.n === 1 ? ' show' : ' shows')));
        row.appendChild(h);
        var cards = odEl('div', 'odcards');
        if (!x.sh) { for (var q = 0; q < OD_VIS; q++) cards.appendChild(odEl('div', 'odc odsk')); }     // no list yet: plain blocks where the posters will be
        else { rowIsCw = x.c === cwPseudo; for (var i = x.start; i < Math.min(x.n, x.start + OD_VIS); i++) cards.appendChild(odCard(x.sh[i], x.ri === odRi && i === x.pos)); rowIsCw = false; }
        row.appendChild(cards); frag.appendChild(row);
        odDom.push({ c: x.c, sh: x.sh, start: x.start, n: x.n, gen: odKGen, sel: x.ri === odRi && x.n ? x.pos - x.start : -1 });
      });
      box.appendChild(frag);
      // moving along a row slides the posters across by the distance moved instead of jumping
      want.forEach(function (x, wi) {
        var o = prevDom[wi], d = o && o.c === x.c && o.sh === x.sh && o.gen === odKGen ? x.start - o.start : 0;
        if (d) odSlide(box.children[wi].lastChild.children, d * 13.2, 'vw');
      });
    }
    var g = s.g;
    odSetBg(g);
    if ((g && g.name) !== odLastG) { odLastG = g && g.name; ['odh1', 'odlogo', 'odm', 'odp'].forEach(function (id) { odFade($(id)); }); }
    var tc = g && g.chan || s.c;
    $('odch').textContent = tc ? (tc.n ? tc.n + '  \u00b7  ' : '') + tc.name : '';
    $('odh1').textContent = g ? g.name : (s.c ? s.c.name : '');
    odLogo($('odlogo'), $('odh1'), g);
    $('odm').textContent = g ? (odInfoLine(g) || s.c.name) : '';
    $('odp').textContent = g ? (odDesc(g) || (g.film ? '' : g.eps.length + (g.eps.length === 1 ? ' video' : ' videos'))) : '';
    $('odhint').className = g ? '' : 'hidden';
    odLookups(g);
  }
  /** Episode title for the list: the library's own, else the scraper's guide, else just the number. */
  function odEpTitle(ep, m) {
    var lab = String(ep.label || '');
    if (ep.s > 0) {
      if (/^E\d+$/.test(lab)) return (m && m.t) || 'Episode ' + ep.e;
      if (/^E\d+\s+/.test(lab)) return lab.replace(/^E\d+\s+/, '');
    }
    return lab;
  }
  function odRenderShow() {
    var s = odSel(), g = s.g;
    if (!g) { odView = 'home'; $('odhome').className = ''; $('odshow').className = 'hidden'; odRenderHome(); return; }
    odSetBg(g);
    odLookups(g);                                  // the show's details and clear logo, also when you go straight onto its page
    if (g.name !== odLastS) { odLastS = g.name; ['odpost', 'odst', 'odsm', 'odsp'].forEach(function (id) { odFade($(id)); }); }
    var k = odKnown(g), post = $('odpost');
    post.style.backgroundImage = k && (k.poster || k.back) ? 'url("' + (k.poster || k.back) + '")' : odTone(g.name);
    $('odst').textContent = g.name;
    odLogo($('odlogo2'), $('odst'), g);
    var seasons = g.sea.filter(function (x) { return /^Season/.test(x.name); }).length;
    $('odsm').textContent = g.film ? odInfoLine(g) : [odInfoLine(g), seasons ? seasons + (seasons === 1 ? ' season' : ' seasons') : '', g.eps.length + (g.eps.length === 1 ? ' video' : ' videos')].filter(Boolean).join('  ·  ');
    $('odsp').textContent = odDesc(g);
    var first = g.flat[0], btn = $('odbtn'); btn.textContent = '';
    var rs = g._cw && g.flat.filter(function (e) { return odResumeAt(g, e); })[0];
    var lead = rs || first;
    btn.appendChild(odEl('div', 'odb' + (odZone === 0 ? ' sel' : ''), '▶  ' + (rs ? 'Resume' : 'Play') + (lead && lead.s ? ' S' + odPad(lead.s) + 'E' + odPad(lead.e) : (g.film ? ' film' : ''))));
    var rail = $('odrail');
    var multi = g.sea.length > 1;
    $('odeps').className = multi ? '' : 'wide';
    var cs = multi ? Math.max(0, Math.min(odSea - 3, g.sea.length - 7)) : 0, rsig = g.name + '|' + cs + '|' + g.sea.length + '|' + multi;
    if (rsig === odRailSig && rail.children.length === Math.min(g.sea.length, 7) * (multi ? 1 : 0)) {      // same list: just move the highlight
      for (var ri = 0; ri < rail.children.length; ri++) rail.children[ri].className = 'odsn' + (cs + ri === odSea ? ' on' : '') + (cs + ri === odSea && odZone === 1 ? ' sel' : '');
    } else {
      odRailSig = rsig; rail.textContent = '';
      if (multi) {
        for (var i = cs; i < Math.min(g.sea.length, cs + 7); i++) {
          var sn = odEl('div', 'odsn' + (i === odSea ? ' on' : '') + (i === odSea && odZone === 1 ? ' sel' : ''), g.sea[i].name);
          sn.appendChild(odEl('small', '', String(g.sea[i].eps.length)));
          rail.appendChild(sn);
        }
      }
    }
    var list = (g.sea[odSea] || { eps: [] }).eps, box = $('odeps');
    odEi = Math.max(0, Math.min(odEi, list.length - 1));
    var top = Math.max(0, Math.min(odEi - 1, list.length - OD_EPS));
    var base = g.name + '|' + odSea + '|' + odKGen + '|' + (g.meta ? 1 : 0) + '|' + list.length, esig = base + '|' + top;
    if (esig === odEpSig && box.children.length) {
      for (var ei = 0; ei < box.children.length; ei++) box.children[ei].className = 'ode' + (top + ei === odEi && odZone === 2 ? ' sel' : '');
      return;
    }
    var slideBy = base === odEpBase ? top - odEpTop : 0;
    odEpSig = esig; odEpBase = base; odEpTop = top;
    box.textContent = '';
    for (var j = top; j < Math.min(list.length, top + OD_EPS); j++) {
      var ep = list[j], m = g.meta && g.meta[ep.s + 'x' + ep.e], row = odEl('div', 'ode' + (j === odEi && odZone === 2 ? ' sel' : ''));
      row.appendChild(odEl('i', '', ep.s > 0 ? String(ep.e) : '•'));
      var kn = odKnown(g), still = (m && m.img) || ep.thumb || (kn && (kn.back || kn.poster)) || '';   // no still of its own: the show's own picture beats a flat colour
      if (still) {
        var im = document.createElement('img'); im.alt = '';
        im.onerror = function () { var t = odEl('div', 'odth'); t.style.backgroundImage = odTone(g.name); if (this.parentNode) this.parentNode.replaceChild(t, this); };
        im.src = still; row.appendChild(im);
      } else { var th = odEl('div', 'odth'); th.style.backgroundImage = odTone(g.name); row.appendChild(th); }
      var tx = odEl('div'); tx.appendChild(odEl('b', '', odEpTitle(ep, m)));
      if (m && m.d) tx.appendChild(odEl('small', '', m.d));
      row.appendChild(tx);
      row.appendChild(odEl('em', '', m && m.l ? m.l + ' min' : (ep.year || (m && m.a ? String(m.a).slice(0, 4) : ''))));
      box.appendChild(row);
    }
    if (slideBy) odSlide(box.children, slideBy * 13.2, 'vh', true);
  }
  var odRailSig = '', odEpSig = '', odEpBase = '', odEpTop = 0;
  function odShowView(on) {
    odView = on ? 'show' : 'home';
    $('odhome').className = on ? 'hidden' : '';
    $('odshow').className = on ? '' : 'hidden';
  }
  function odOpenShow() {
    var s0 = odSel(), g = s0.g;
    if (!g) return;
    if (g.film && g.flat && g.flat.length === 1) { odClose(false); odStart(s0.c, g.flat, 0); return; }     // a film is one video: OK plays it
    odZone = 0; odSea = 0; odEi = 0;
    odShowView(true);
    if (!g.metaP) odMeta(g).then(function () { if (odOpen && odView === 'show' && odSel().g === g) odRender(); });
    odRender();
  }
  function odOpenUi() {
    var chs = odChannels();
    if (!chs.length) { toast('On Demand is not ready yet', 2500); return; }
    odFrom = guideOpen ? 'guide' : (cur ? 'watch' : '');
    odGuide = guideOpen ? { chan: gChan, win: gWin, focus: gFocus } : null;     // so leaving On Demand lands back on the same programme
    closeOsd(); closeOpts();
    if (guideOpen) closeGuide();
    odOpen = true; odArtFor = ''; odBgFor = ''; odTop = 0;
    odShowView(false);
    var rows = odRowList(), at = cur ? rows.indexOf(cur.ch) : 0;
    odRi = Math.max(0, at); odRc = rows[odRi] || null;
    $('od').className = '';
    v.muted = true;
    odBusy = !!(odFrom === 'watch' && cur && cur.prog && !cur.ad && at >= 0);
    odEnter();
    // the other channels are built only once the one you are looking at is ready, so they never delay it
    var first = rows[odRi];
    (first ? odLoadChannel(first) : Promise.resolve()).then(function () { setTimeout(function () { if (odOpen) odPreload(chs, first); }, 300); });
    if (odFrom === 'watch' && cur && cur.prog && !cur.ad && at >= 0) odJump(cur.ch, cur.prog);
  }
  /** Opened while something is playing: go straight to that show's page, on the season and episode that is on. */
  function odJump(c, prog) {
    odLoadChannel(c).then(function () {
      odBusy = false;
      if (!odOpen || odView !== 'home') return;
      var rows = odRowList(), ri = rows.indexOf(c), sh = odShowsOf(c) || [];
      var name = prog.show || prog.group || (parseTitle(prog.title || '').show) || '', key = LIBROUTE.norm(name), si = -1;
      sh.forEach(function (g, i) { if (si < 0 && (LIBROUTE.norm(g.name) === key || g.eps.some(function (ep) { return ep.p.url === prog.url; }))) si = i; });
      if (ri < 0 || si < 0) { odRender(); return; }
      odRi = ri; odRc = c; odPos[c.id] = si;
      if (sh[si].film) { odRender(); return; }      // a film is one video: land on its poster, don't start it again
      odOpenShow();
      var g = sh[si];
      for (var s = 0; s < g.sea.length; s++) {
        var e = g.sea[s].eps.map(function (ep) { return ep.p.url; }).indexOf(prog.url);
        if (e >= 0) { odSea = s; odEi = e; odZone = 2; break; }
      }
      odRender();
    });
  }
  function odClose(restore) {
    odOpen = false;
    clearTimeout(odMetaTimer);
    $('od').className = 'hidden';
    v.muted = false;
    if (restore && odFrom === 'guide') {
      openGuide();
      if (odGuide && guideList().indexOf(odGuide.chan) >= 0) {
        var now = Date.now();
        gChan = odGuide.chan;
        gWin = Math.max(odGuide.win, floorHalf(now));
        gFocus = Math.max(odGuide.focus, now);
        if (gFocus >= gWin + SPAN) gFocus = gWin;
        renderGuide();
      }
    }
  }
  /** Load every channel's list in the background, one after another, so the counts fill in and browsing is instant. */
  var odPre = 0;
  function odPreload(chs, first) {
    var tok = ++odPre, i = 0;
    if (first) chs = chs.slice().sort(function (a, b) { return Math.abs(chs.indexOf(a) - chs.indexOf(first)) - Math.abs(chs.indexOf(b) - chs.indexOf(first)); });
    (function next() {
      if (tok !== odPre || !odOpen || i >= chs.length) return;
      var c = chs[i++];
      odLoadChannel(c).then(function () { if (odOpen && odView === 'home') odRender(); setTimeout(next, 30); });
    })();
  }
  /** Build every channel's On Demand list in the background after start-up, one at a time and only while nothing else
   *  is loading, so opening On Demand later finds them ready instead of building them while you wait. */
  var odWarmed = false;
  function odWarm() {
    if (odWarmed) return;
    odWarmed = true;
    var i = 0, list = odChannels().slice().sort(function (a, b) { return (a.id === store.get('last') ? -1 : b.id === store.get('last') ? 1 : 0); });
    (function next() {
      if (i >= list.length) return;
      if (odOpen || !quiet()) { setTimeout(next, 4000); return; }   // never while On Demand is on screen (it loads its own) or channels are still loading
      var c = list[i++];
      odLoadChannel(c).then(function () { setTimeout(next, 1500); }, function () { setTimeout(next, 1500); });
    })();
  }
  /** Load the focused channel's shows first, then show them. */
  function odEnter() {
    var c = odSel().c;
    odRender();
    if (!c) return;
    odLoadChannel(c).then(function () { if (odOpen && odSel().c === c) odRender(); });
  }
  function odKey(k) {
    if (odm) return k === 'Info' ? true : odmKey(k);
    if (k === 'Menu' || k === 'ContextMenu' || k === 'Info') { odmOpen(); return true; }   // a held OK arrives as Info (see MainActivity)
    if (k === 'Guide' || k === 'Red') { odClose(false); openGuide(); return true; }
    if (odView === 'show') return odKeyShow(k);
    var s = odSel(), c = s.c, sh = s.sh, pos = c ? (odPos[c.id] || 0) : 0;
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      var ni = odRi + (k === 'ArrowUp' ? -1 : 1);
      if (ni >= 0 && ni < s.rows.length) { odRi = ni; odRc = s.rows[ni]; odEnter(); return true; }
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (sh && sh.length) odPos[c.id] = Math.max(0, Math.min(sh.length - 1, pos + (k === 'ArrowLeft' ? -1 : 1)));
    } else if (k === 'ChannelUp' || k === 'ChannelDown') {
      if (sh && sh.length) odPos[c.id] = Math.max(0, Math.min(sh.length - 1, pos + (k === 'ChannelUp' ? -OD_VIS + 1 : OD_VIS - 1)));
    } else if (k === 'Enter' || k === ' ') { odOpenShow(); return true; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { odClose(true); return true; }
    odRender();
    return true;
  }
  /** The show page: the play button on top, the seasons down the left and the episodes beside them.
   *  Zones: 0 play, 1 seasons, 2 episodes. Up and down change season in the list; left goes onto it, right comes back. */
  function odKeyShow(k) {
    var g = odSel().g;
    if (!g) { odShowView(false); odRender(); return true; }
    var multi = g.sea.length > 1, list = (g.sea[odSea] || { eps: [] }).eps;
    if (k === 'ArrowUp') {
      if (odZone === 2) { if (odEi > 0) odEi--; else odZone = 0; }
      else if (odZone === 1) { if (odSea > 0) { odSea--; odEi = 0; } else odZone = 0; }
    } else if (k === 'ArrowDown') {
      if (odZone === 0) odZone = 2;
      else if (odZone === 1) { if (odSea < g.sea.length - 1) { odSea++; odEi = 0; } }
      else odEi = Math.min(list.length - 1, odEi + 1);
    } else if (k === 'ArrowLeft') {
      if (odZone === 2 && multi) odZone = 1;
      else if (odZone === 1 || (odZone === 2 && !multi)) { odShowView(false); }      // nothing further left: back to the shows
    } else if (k === 'ArrowRight') {
      if (odZone === 1) { odZone = 2; }
      else if (odZone === 0) odZone = 2;
    } else if (k === 'ChannelUp' || k === 'ChannelDown') {
      if (odZone === 2) odEi = Math.max(0, Math.min(list.length - 1, odEi + (k === 'ChannelUp' ? -OD_EPS + 1 : OD_EPS - 1)));
    } else if (k === 'Enter' || k === ' ') {
      if (odZone === 0) { var rs0 = g._cw && g.flat.filter(function (e) { return odResumeAt(g, e); })[0]; if (rs0 || g.flat[0]) odPlay(rs0 || g.flat[0]); return true; }
      if (odZone === 1) { odZone = 2; }
      else if (list[odEi]) { odPlay(list[odEi]); return true; }
    } else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { odShowView(false); }
    odRender();
    return true;
  }
  // ---- artwork menu: hold OK (or Menu) on a show. Scrape it again, choose the right show, or pick a poster or background
  // from what TVmaze has, like the scrapers in Kodi. What is picked is kept on this TV and used from then on.
  var odm = null;
  function tvmEntry(s) {
    var net = (s.network && s.network.name) || (s.webChannel && s.webChannel.name) || '';
    var o = { name: s.name, i: s.id, p: https(s.image && (s.image.medium || s.image.original)), b: '', n: net,
              y: s.premiered ? String(s.premiered).slice(0, 4) : '', e: s.ended ? String(s.ended).slice(0, 4) : '',
              g: (s.genres || []).join(', '), s: plain(s.summary) };
    if (s.rating && s.rating.average) o.r = s.rating.average;
    return o;
  }
  function tvmImages(id) {
    return getJSON('https://api.tvmaze.com/shows/' + id + '/images').then(function (l) { return Array.isArray(l) ? l : []; }, function () { return []; });
  }
  /** A TVmaze picture's address. Posters use the medium size (plenty for a poster on a TV, and a few tens of KB): the
   *  "original" is the untouched upload and can be many megabytes, which a TV is slow or unable to show. */
  function odImgUrl(x, full, kind) {
    var r = x && x.resolutions || {};
    var pick = kind === 'poster' ? (r.medium || r.original) : (full ? r.original : (r.medium || r.original));
    return https((pick || { url: x && x.main || '' }).url);
  }
  /** Apply a pick only once its picture has really loaded, so a choice never looks like nothing happened. */
  function odFixDone(g, entry, msg, testUrl) {
    var test = testUrl || entry.p, shown = false;
    if (!entry.name) entry.name = g.name;
    if (!test) { odFixApply(g, entry, msg); return; }
    odmWait('Loading the picture\u2026');
    var im = new Image(), timer = setTimeout(function () { fail(); }, 20000);
    function fail() {
      if (shown) return; shown = true; clearTimeout(timer);
      dlog('ARTWORK picture would not load: ' + test);
      odmClose(); toast('That picture would not load, so nothing was changed', 4500);
    }
    im.onload = function () { if (shown) return; shown = true; clearTimeout(timer); odFixApply(g, entry, msg); };
    im.onerror = fail;
    im.src = test;
  }
  function odFixApply(g, entry, msg) {
    store.set('artfix:' + normShow(g.name), { a: entry });
    try { kv.removeItem('eps1:' + odSlug(g.name)); } catch (e) { /* ignore */ }
    g.art = entry; g.metaP = null; g.meta = null; odArtFor = ''; odBgFor = ''; odKGen++;
    dlog('ARTWORK picked for ' + g.name + ': ' + (entry.name || '') + ' (TVmaze ' + (entry.i || '?') + ')' + (entry.p ? ' poster ' + entry.p : '') + (entry.b ? ' background ' + entry.b : ''));
    odmClose(); toast(msg, 3500);
    if (odView === 'show') odMeta(g).then(function () { if (odOpen && odView === 'show' && odSel().g === g) odRender(); });
    odRender();
  }
  function odmOpen() {
    var g = odSel().g;
    if (!g) return;
    if (g.film) { toast('Films use the poster that came with them', 2500); return; }
    odm = { mode: 'menu', g: g, i: 0, items: [
      { t: 'Scrape artwork', f: function () { odmScrape(g); } },
      { t: 'Choose the right show', f: function () { odmShows(g); } },
      { t: 'Choose a poster', f: function () { odmPics(g, 'poster'); } },
      { t: 'Choose a background', f: function () { odmPics(g, 'background'); } },
      { t: 'Back to automatic', f: function () {
        try { kv.removeItem('artfix:' + normShow(g.name)); kv.removeItem('eps1:' + odSlug(g.name)); } catch (e) { /* ignore */ }
        g.art = undefined; g.metaP = null; g.meta = null; odArtFor = ''; odBgFor = ''; odmClose(); toast('Artwork back to automatic', 2500); odRender(); } }
    ], title: g.name };
    odmRender();
  }
  function odmClose() { odm = null; $('odmenu').className = 'hidden'; }
  function odmWait(text) { if (odm) { odm.mode = 'wait'; odm.items = []; odm.note = text; odmRender(); } }
  function odmSearch(g) {
    return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(g.name)).then(function (l) { return Array.isArray(l) ? l : []; }, function () { return null; });
  }
  /** Look the show up again; take the match if it is clearly the one, otherwise let the person choose. */
  function odmScrape(g) {
    odmWait('Looking for ' + g.name + '…');
    odmSearch(g).then(function (list) {
      if (!odm) return;
      if (list === null) { odm.mode = 'wait'; odm.note = 'Could not reach TVmaze'; odmRender(); return; }
      var sh = pickShow(list, g.name, 0);
      if (!sh) { odmShowList(g, list, 'No clear match. Choose the right show'); return; }
      tvmImages(sh.id).then(function (imgs) {
        var e = tvmEntry(sh), bg = imgs.filter(function (x) { return x.type === 'background'; })[0];
        if (bg) e.b = odImgUrl(bg, true, 'background');
        if (!e.p) { var po = imgs.filter(function (x) { return x.type === 'poster'; })[0]; if (po) e.p = odImgUrl(po, true, 'poster'); }
        odFixDone(g, e, 'Found ' + e.name + (e.y ? ' (' + e.y + ')' : ''));
      });
    });
  }
  function odmShows(g) { odmWait('Searching TVmaze…'); odmSearch(g).then(function (list) { if (odm) { if (list === null) { odm.note = 'Could not reach TVmaze'; odmRender(); } else odmShowList(g, list, 'Choose the right show'); } }); }
  function odmShowList(g, list, title) {
    if (!odm) return;
    var items = list.slice(0, 8).map(function (r) {
      var s = r.show || {}, e = tvmEntry(s);
      return { t: s.name || '', sub: [e.y, e.n, e.g].filter(Boolean).join('  ·  '), img: https(s.image && s.image.medium), f: function () {
        odmWait('Getting pictures…');
        tvmImages(s.id).then(function (imgs) {
          var bg = imgs.filter(function (x) { return x.type === 'background'; })[0];
          if (bg) e.b = odImgUrl(bg, true, 'background');
          if (!e.p) { var po = imgs.filter(function (x) { return x.type === 'poster'; })[0]; if (po) e.p = odImgUrl(po, true, 'poster'); }
          odFixDone(g, e, 'Using ' + e.name + (e.y ? ' (' + e.y + ')' : ''));
        });
      } };
    });
    odm.mode = items.length ? 'shows' : 'wait'; odm.note = items.length ? '' : 'TVmaze has nothing for “' + g.name + '”'; odm.items = items; odm.i = 0; odm.title = title || 'Choose the right show';
    odmRender();
  }
  function odmPics(g, kind) {
    odmWait('Getting pictures…');
    artShow(g.name).then(function (base) {
      if (!base || !base.i) { odmShows(g); toast('Choose the right show first', 3000); return; }
      tvmImages(base.i).then(function (imgs) {
        if (!odm) return;
        var items = imgs.filter(function (x) { return x.type === kind; }).slice(0, 12).map(function (x) {
          return { img: odImgUrl(x, false), f: function () {
            var e = {}; Object.keys(base).forEach(function (k) { e[k] = base[k]; });
            var url = odImgUrl(x, true, kind);
            e[kind === 'poster' ? 'p' : 'b'] = url;
            odFixDone(g, e, kind === 'poster' ? 'Poster changed' : 'Background changed', url);
          } };
        });
        odm.mode = items.length ? (kind === 'poster' ? 'posters' : 'backs') : 'wait'; odm.note = items.length ? '' : 'No ' + kind + 's on TVmaze for this show';
        odm.items = items; odm.i = 0; odm.title = kind === 'poster' ? 'Choose a poster' : 'Choose a background';
        odmRender();
      });
    });
  }
  function odmRender() {
    var m = odm, box = $('odml'), el = $('odmenu');
    if (!m) return;
    el.className = '';
    $('odmt').textContent = m.title || '';
    box.textContent = '';
    box.className = m.mode === 'posters' || m.mode === 'backs' ? 'strip' : '';
    if (m.mode === 'wait') { box.appendChild(odEl('div', 'odnone', m.note || '')); return; }
    if (m.mode === 'posters' || m.mode === 'backs') {
      var per = m.mode === 'posters' ? 6 : 3, st = Math.max(0, Math.min(m.i - Math.floor(per / 2), m.items.length - per));
      for (var k = st; k < Math.min(m.items.length, st + per); k++) {
        var c = odEl('div', 'odmc ' + (m.mode === 'posters' ? 'po' : 'bk') + (k === m.i ? ' sel' : ''));
        c.style.backgroundImage = 'url("' + m.items[k].img + '")';
        box.appendChild(c);
      }
      box.appendChild(odEl('div', 'odmn', (m.i + 1) + ' of ' + m.items.length));
      return;
    }
    var top = Math.max(0, Math.min(m.i - 2, m.items.length - 6));
    for (var i = top; i < Math.min(m.items.length, top + 6); i++) {
      var it = m.items[i], r = odEl('div', 'odmr' + (i === m.i ? ' sel' : ''));
      if (m.mode === 'shows') { var th = odEl('div', 'odmth'); if (it.img) th.style.backgroundImage = 'url("' + it.img + '")'; r.appendChild(th); }
      var tx = odEl('div'); tx.appendChild(odEl('b', '', it.t));
      if (it.sub) tx.appendChild(odEl('small', '', it.sub));
      r.appendChild(tx); box.appendChild(r);
    }
  }
  function odmKey(k) {
    var m = odm;
    if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') {
      if (m.mode === 'menu' || m.mode === 'wait') odmClose(); else odmOpen();
      return true;
    }
    if (m.mode === 'wait') return true;
    var strip = m.mode === 'posters' || m.mode === 'backs';
    var back = strip ? 'ArrowLeft' : 'ArrowUp', fwd = strip ? 'ArrowRight' : 'ArrowDown';
    if (k === back) m.i = Math.max(0, m.i - 1);
    else if (k === fwd) m.i = Math.min(m.items.length - 1, m.i + 1);
    else if (k === 'Enter' || k === ' ') { var it = m.items[m.i]; if (it) it.f(); return true; }
    odmRender();
    return true;
  }
  function odPlay(ep) {
    var s = odSel(), g = s.g;
    if (!s.c || !g || !ep || !ep.p) return;
    var i = g.flat.indexOf(ep), c = g.chan || s.c;     // the Continue watching row is not a channel: the show knows its own
    var at = odResumeAt(g, ep);
    odClose(false);
    odStart(c, g.flat, i, at, g.name);
  }
  function odStart(c, list, i, offset, name) {
    var info = { list: list, i: i, name: name || '' };
    playSlot(c, 0, offset || 0, true, true, list[i].p);
    if (cur) cur.od = info;
    if (name) cwPut(name, c.id, list[i].p.url, offset || 0, 0);
    dlog('ON DEMAND ' + c.n + ' ' + c.name + ' | ' + (list[i].p.title || ''));
  }
  /** What comes after the episode playing, for the "Next" on the bar. */
  function odPeek() {
    var o = cur && cur.od, r = o && o.list[o.i + 1];
    return r ? r.p : null;
  }
  /** The next (or previous) episode of the show; at the end of the show, back to the browser. */
  function odStep(d) {
    var o = cur && cur.od;
    if (!o) return;
    var n = o.i + d;
    if (n < 0 || n >= o.list.length) { if (o.name) cwDrop(o.name); v.pause(); toast('That was the last episode', 3000); odOpenUi(); return; }
    if (o.name && n === 0) { /* first episode */ }
    odStart(cur.ch, o.list, n, 0, o.name);
  }

  // ------------------------------------------------------------------ start up

  var bootedAt = Date.now();
  var FIRST_WAIT = 8000;      // how long to hold the loading screen for the channel we want to open on
  var ALL_WAIT = 30000;       // ... and for every other channel to finish, so the guide opens complete, not still filling in

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
    // stay on the loading screen until every channel has answered (or a slow connection runs out the clock)
    if (Date.now() - bootedAt < ALL_WAIT && channels.some(function (c) { return c.status === 'loading'; })) return;
    started = true;
    $('splash').className = 'hidden';
    clearInterval(spNoiseTimer); spNoiseTimer = null; clearInterval(bootTimer);   // nothing needs waking up 9 times a second now
    var pick = (prefer && prefer.status === 'ready' ? prefer : null) || list[0];
    tune(pick, false, true);   // start on the last channel (its picture shows in the guide's window) ...
    openGuide();               // ... but land in the TV guide
    greetRelease();            // and say once if this is a version they have not run before
  }

  /** Throw away stored lineups for channels that no longer exist, so a retired channel (On This Day, which
   *  became TV Archive) does not sit in storage for ever taking up room. */
  function forgetOldChannels() {
    var live = {};
    channels.forEach(function (c) { live[c.id] = 1; });
    try {
      var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
        var kn = _ks[k], m = /^plan7[ad]?:([^:]+):/.exec(kn || '');
        if (m && !live[m[1]]) kv.removeItem(kn);
      }
    } catch (e) { /* storage unavailable: nothing to tidy */ }
  }

  function startLoading() {
    forgetOldChannels();
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
        return progs;   // Auto EPG stands on the library alone; a channel it has nothing for stays empty
      }).then(function (progs) {
        if (progs && progs.length) {
          progs = dropSlow(progs);
          progs.forEach(function (p) { if (durMem[p.id]) p.dur = durMem[p.id]; });   // real running time, once seen
          progs = withBreaks(c, progs);
          var seed = c.id + (epgGen ? ':' + epgGen : '');
          // a channel with a daypart plan is laid out against the clock; the rest are one shuffled loop
          var spanH = SPANS[spanIdx].h;
          c.sched = (window.DAYPARTS && DAYPARTS.has(c.id) && DAYPARTS.schedule(c.id, progs, seed, spanH / 24)) ||
                    E.buildSchedule(E.selectSpan(progs, spanH * 3600, seed), seed);
          c.status = 'ready';
          if (!isAdChan(c)) enrichNames(c, progs).then(null, function () { /* names stay as they are */ });
        } else {
          c.status = 'empty';
        }
      }, function () { c.status = 'empty'; }).then(function () {
        finished++;
        renderStatus();
        if (finished === channels.length) setTimeout(seedLinks, 4000);
        if (finished === channels.length) setTimeout(artScanStart, 60000);
        if (finished === channels.length) setTimeout(odWarm, 4000);
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

  var bootTimer = setInterval(function () { if (!started) { renderStatus(); begin(); } else clearInterval(bootTimer); }, 400);   // also lets the wait above time out
  startLoading();
})();
