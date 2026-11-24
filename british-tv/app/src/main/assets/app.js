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
  var KV_BIG = /^(plan7|eps1:|info3:|art2:|tvm4:|artdb1:|film1:|lib2:|rt1:|odi1:|sched1:|librevs2:|librev1$|cast1:|libtxt1:|libtxt2:|adcat1:|epdb1$|filmdb1$|epl1:)/;
  var KV_NATIVE = !!(window.NativeHttp && NativeHttp.kvGet && NativeHttp.kvSet && NativeHttp.kvKeys);
  // The files' names, read from the app once per start and kept up to date here: listing the folder over the bridge
  // was done for every channel built, and the folder holds thousands of files.
  var kvNames = null;
  function kvNative() {
    if (!kvNames) { kvNames = {}; try { String(NativeHttp.kvKeys() || '').split('\n').forEach(function (k) { if (k) kvNames[k] = 1; }); } catch (e) { /* none */ } }
    return kvNames;
  }
  var kv = {
    big: function (k) { return KV_NATIVE && KV_BIG.test(k); },
    getItem: function (k) {
      if (kv.big(k)) { try { return NativeHttp.kvGet(k); } catch (e) { return null; } }
      // settings are written to the file at once but to the page's storage only some seconds later, so when the file has a
      // value it is the newer one (a setting changed just before the app closed is only in the file)
      if (kv.mirrored(k)) { try { var fv = NativeHttp.kvGet('ls:' + k); if (fv) { try { localStorage.setItem(k, fv); } catch (e3) { /* the file still has it */ } return fv; } } catch (e4) { /* no file: use the page's storage */ } }
      var v = localStorage.getItem(k);
      // settings are also kept as files (below): if the page's storage lost them, they are read back from there
      if (v === null && kv.mirrored(k)) { try { v = NativeHttp.kvGet('ls:' + k); if (v) { try { localStorage.setItem(k, v); } catch (e2) { /* read from the file next time */ } } } catch (e) { v = null; } if (v === undefined || v === '') v = null; }
      return v;
    },
    /** The page's storage is written to disk some seconds after a change, so closing or updating the app quickly after changing a
     *  setting (Experimental, Test snow, a favourite) lost it. Small saved things are written to a file at once as well. */
    mirrored: function (k) { return KV_NATIVE && k !== 'dbglog1' && !/^(ls:|tvdbtok)/.test(k); },
    setItem: function (k, v) {                        // throws when it will not fit, like localStorage
      if (kv.big(k)) { var ok = false; try { ok = NativeHttp.kvSet(k, v); } catch (e) { ok = false; } if (!ok) throw new Error('not saved'); if (kvNames) kvNames[k] = 1; return; }
      // the file first: the page's storage can be full (it throws), and a setting must still be kept
      var filed = false;
      if (kv.mirrored(k) && v.length < 60000) { try { filed = !!NativeHttp.kvSet('ls:' + k, v); } catch (e) { /* the page's storage still has it */ } }
      try { localStorage.setItem(k, v); } catch (e5) { if (!filed) throw e5; }
    },
    removeItem: function (k) {
      if (kv.big(k)) { try { NativeHttp.kvRemove(k); } catch (e) { /* nothing to remove */ } if (kvNames) delete kvNames[k]; return; }
      localStorage.removeItem(k);
      if (kv.mirrored(k)) { try { NativeHttp.kvRemove('ls:' + k); } catch (e) { /* none */ } }
    },
    /** Every key, in the page's storage and in the files. */
    keys: function () {
      var out = [], i;
      try { for (i = 0; i < localStorage.length; i++) out.push(localStorage.key(i)); } catch (e) { /* blocked */ }
      if (KV_NATIVE) out = out.concat(Object.keys(kvNative()).filter(function (k) { return k.indexOf('ls:') !== 0; }));
      return out;
    }
  };
  // Settings saved by an earlier version are only in the page's storage: copy them to files once, shortly after start
  if (KV_NATIVE) setTimeout(function () {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && kv.mirrored(k) && !kv.big(k) && !kvNative()['ls:' + k]) { var t = localStorage.getItem(k); if (t && t.length < 60000) NativeHttp.kvSet('ls:' + k, t); if (kvNames) kvNames['ls:' + k] = 1; }
      }
    } catch (e) { /* the page's storage still has them */ }
  }, 4000);
  // What is saved of the choices made with "Choose the right show" and the artwork menu, written to the log at each start so a pick that
  // did not survive a restart can be told from one that was never saved: in the page's storage, in the files, or both.
  setTimeout(function () {
    try {
      var pg = [], fl = [], i;
      for (i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('artfix:') === 0) pg.push(k.slice(7)); }
      if (KV_NATIVE) Object.keys(kvNative()).forEach(function (kn) { if (kn.indexOf('ls:artfix:') === 0) fl.push(kn.slice(10)); });
      dlog('SAVED PICKS: ' + pg.length + ' in the page storage, ' + fl.length + ' in files' + (fl.length ? ' (' + fl.slice(0, 6).join(', ') + (fl.length > 6 ? ', \u2026' : '') + ')' : ''));
    } catch (e) { /* storage blocked */ }
  }, 9000);
  var getStat = {};      // saved things read this run, by kind: how many, how big, time reading them from storage and time parsing them
  var store = {
    get: function (k) {
      var t0 = performance.now(), txt = null, out = null, t1;
      try { txt = kv.getItem(k); } catch (e) { txt = null; }
      t1 = performance.now();
      try { out = JSON.parse(txt); } catch (e) { out = null; }
      var g = getStat[String(k).split(':')[0]] || (getStat[String(k).split(':')[0]] = { n: 0, kb: 0, read: 0, parse: 0 });
      g.n++; g.kb += txt ? txt.length / 1024 : 0; g.read += t1 - t0; g.parse += performance.now() - t1;
      return out;
    },
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

  // ------------------------------------------------------------------ debug log
  //
  // What was played, how it went, and why it failed, kept on the TV so it can be sent when something will not
  // play. Options > Debug log puts it on the home network for a phone or computer to open and copy.
  var DLOG = store.get('dbglog1') || [], dlogTimer = null, httpFails = 0;
  if (!(DLOG instanceof Array)) DLOG = [];
  // An addon's address holds its settings, and with them the debrid key ("…/realdebrid=KEY/…"), and a debrid play link
  // is a key of its own. So for any site but the app's fixed ones only the site's name is written down, and any long run
  // of letters and digits (the shape keys have) is blanked as well.
  var LOG_OPEN = /^(?:[a-z0-9-]+\.)*(?:archive\.org|tvmaze\.com|githubusercontent\.com|tmdb\.org|open-meteo\.com|wikipedia\.org|thetvdb\.com)$/i;
  function logSafe(t) {
    return String(t).replace(/(https?:\/\/)([^\/\s?#|]+)\S*/gi, function (all, sch, host) {
      return LOG_OPEN.test(host) ? all : sch + host + '/\u2026';
    }).replace(/\/(?:[A-Za-z0-9_-]{80,}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/g, '/\u2026')
      .replace(/[A-Za-z0-9]{32,}/g, '\u2026');
  }
  DLOG = DLOG.map(logSafe);       // lines kept by earlier versions may hold a key: saved again without them
  if (DLOG.length) store.set('dbglog1', DLOG);
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function dlog(text) {
    var d = new Date();
    DLOG.push(two(d.getDate()) + '/' + two(d.getMonth() + 1) + ' ' + two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()) +
      '  ' + logSafe(text).slice(0, 700));
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
    if (!url || /^yt:/.test(url) || !window.NativeHttp || !NativeHttp.probe) return;
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
        }, /\/data\/(library|epdb[-\d]*)\.json/.test(url) ? 120000 : 40000);      // the big files get longer
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
      if (p.tvDone) r.v = 1;                                    // its episode name has been checked: not looked up again at every start
      if (p.cert) r.c = p.cert;                                 // BBFC certificate: decides what plays before nine
      if (p.group && p.group.indexOf('-') > 0) r.g = p.group;   // advert tier (uk/g), kept so UK adverts stay preferred
      return r;
    });
  }
  function unpackPlan(rows) {
    return rows.map(function (r) {
      return { show: r.h, id: r.i, item: String(r.i).split('/')[0], url: E.canonicalUrl(/^https?:/.test(r.u) ? r.u : DL + r.u) || (/^https?:/.test(r.u) ? r.u : DL + r.u), title: r.t, sub: r.s, dur: r.d, group: r.g, filmKey: r.f, cert: r.c, tvDone: r.v ? true : undefined };
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
    { id: 'classic', label: 'Classic Blue' }, { id: 'teletext', label: 'Teletext' },
    { id: 'paper', label: 'Radio Times' }, { id: 'seventies', label: '1970s' }, { id: 'eighties', label: '1980s' }, { id: 'nineties', label: '1990s' }
  ];
  var themeIdx = 0, themeNow = '';             // Classic Blue unless one was picked: the look only changes when it is changed in Options
  (function () { var id = store.get('gtheme1'); for (var i = 0; i < THEMES.length; i++) if (THEMES[i].id === id) themeIdx = i; })();
  var DECADE_THEME = { tv70s: 'seventies', tv80s: 'eighties', tv90s: 'nineties' };
  function applyTheme(ch) {
    var id = THEMES[themeIdx].id;
    // "Match the channel" follows the channel being watched, not the row the cursor is on: otherwise scrolling down the
    // guide re-dresses the whole screen each time it passes the 70's, 80's and 90's channels
    if (id === 'auto') { var w = (cur && cur.ch) || ch; id = (w && DECADE_THEME[w.id]) || 'classic'; }
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
    if (!store.set(ch.cacheKey, { t: ch.cacheT || Date.now(), p: packPlan(ch.plan), r: ch.report || [] })) dlog('COULD NOT SAVE the list for ' + ch.name + ': it will be built again at the next start');
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
  // Published by the scraper (at first; now the library below) as one small file per channel, so a new scrape
  // reaches the TV without a new APK and a channel only downloads its own list. data/index.json names a revision
  // per channel; that revision goes into the cache key, so pushing a scrape refreshes just the channels that
  // changed. If the published list cannot be reached, the channel falls back to its live searches.
  var DATA_BASE = 'https://raw.githubusercontent.com/lefty420/tellyaddicts/main/british-tv/data/';
  var indexP = null;


  // The scraper also sends its whole library (data/library.json): every show and episode with the best copy, and
  // TVmaze's titles and air dates. When it's there the TV decides the channels itself (libroute.js), with the genre
  // lists in tools/shows.json, so a list change needs neither a new APK nor a new scrape. Each channel's revision is
  // a hash of its own routed rows, so still only the channels that changed are rebuilt. Anything missing falls back
  // to the per-channel files.
  var SHOWS_URL = 'https://raw.githubusercontent.com/lefty420/tellyaddicts/main/tools/shows.json';
  var dataRevs = null, libP = null, libRevs = null, libCatchUp = null, libRevsOld = false;
  var listStats = { saved: 0, none: 0, old: 0, ms: 0, names: [] };      // this start: lists read from storage, rebuilt for want of one, rebuilt for age   // libCatchUp: set when this start opened on an earlier library's lists

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
  var libWant = '';        // index.json "library": the revision now published
  function fetchLibrary(libRev) {
    var url = DATA_BASE + 'library.json', tries = 0, want = libRev || libWant;
    // The text is kept as it came (not wrapped in JSON again: that doubled the work for a 10 MB file), with the
    // revision it belongs to beside it, so an unchanged library is read from this TV and never downloaded again.
    function saved() { var t = null; try { t = kv.getItem('libtxt2:main'); } catch (e) { /* none */ } return t && typeof t === 'string' ? t : null; }
    function cached(why) {
      var t = saved();
      if (!t) throw new Error('no library');
      var t0 = Date.now(), j = JSON.parse(t);
      dlog('library.json: using the copy saved on this TV' + (why ? ' (' + why + ')' : '') + ', read in ' + (Date.now() - t0) + ' ms');
      return j;
    }
    function go() {
      var d0 = Date.now();
      return http(url).then(function (txt) {
        var t0 = Date.now(), j = JSON.parse(txt);
        dlog('library.json: downloaded ' + (txt.length / 1048576).toFixed(1) + ' MB in ' + (t0 - d0) + ' ms, read in ' + (Date.now() - t0) + ' ms');
        try { kv.setItem('libtxt2:main', txt); store.set('librev1', (j && j.rev) || want || ''); } catch (e) { /* too big to keep: fine */ }
        try { kv.removeItem('libtxt1:main'); } catch (e) { /* the old double-wrapped copy */ }
        return j;
      }, function (err) {
        if (++tries < 3) return new Promise(function (r) { setTimeout(r, 3000 * tries); }).then(go);
        return cached('download failed');
      });
    }
    if (want && store.get('librev1') === want && saved()) {
      try { var j0 = cached('unchanged'); if (j0 && j0.shows && (!j0.rev || j0.rev === want)) return Promise.resolve(j0); } catch (e) { /* damaged: download it */ }
    }
    return go();
  }

  /** Run fn on each item in turn, giving the screen a turn every 25 ms or so: sorting or saving a whole library in one go froze the TV for seconds. */
  function eachSliced(items, fn) {
    return new Promise(function (resolve) {
      var i = 0;
      (function pump() {
        var t0 = Date.now();
        while (i < items.length && Date.now() - t0 < 25) fn(items[i++]);
        if (i < items.length) setTimeout(pump, 0); else resolve();
      })();
    });
  }
  /** What the sort gave one channel is kept on the TV under the hash of its rows (the revision in libRevs), so On Demand and
   *  any rebuilt channel read their own small file instead of loading and sorting the whole library again at every start. */
  function readSorted(id, rev) {
    if (!KV_NATIVE || !rev) return null;
    try { var t = kv.getItem('rt1:' + id + ':' + rev), rows = t && JSON.parse(t); return rows && rows.length ? rows : null; } catch (e) { return null; }
  }
  function keepSorted(id, rev, text) {
    if (!KV_NATIVE || !rev) return;
    var key = 'rt1:' + id + ':' + rev;
    try {
      if (!kvNative()[key]) kv.setItem(key, text);
      Object.keys(kvNative()).forEach(function (kn) { if (kn !== key && kn.indexOf('rt1:' + id + ':') === 0) kv.removeItem(kn); });
    } catch (e) { /* too big to keep: sorted again when wanted */ }
  }

  /** {channel: rows} from the whole library; null if it or shows.json can't be had. */
  var removedRev = '';     // index.json "removed": revision of data/removed-shows.json
  function loadLibraryRoutes(libRev, showsText) {
    if (libP) return libP;
    var showsP = (showsText ? Promise.resolve(JSON.parse(showsText)) : getJSON(SHOWS_URL)).then(function (sj) {
      if (!sj || magicOn) return sj;
      var o = {}; Object.keys(sj).forEach(function (k) { if (!(sj[k] && sj[k].magic)) o[k] = sj[k]; });
      return o;
    });
    // routes.json is optional: when it is not published the lists in shows.json are used on their own
    var routesP = getJSON(DATA_BASE + 'routes.json').then(null, function () { return null; });
    // shows the scraper has removed for good: only asked for when the index says there are some
    var removedP = removedRev ? getJSON(DATA_BASE + 'removed-shows.json').then(function (x) { return (x && x.shows) || []; }, function () { return []; }) : Promise.resolve([]);
    libP = Promise.all([fetchLibrary(libRev), showsP, routesP, removedP]).then(function (r) {
      var lib = r[0], shows = r[1];
      if (!lib || !lib.shows || !shows || !window.LIBROUTE || (libRev && lib.rev && lib.rev !== libRev)) return null;
      var t0 = Date.now(), job = LIBROUTE.routeBegin(lib, mergeRoutes(shows, r[2]), r[3]);
      return new Promise(function (resolve) {
        (function pump() {
          if (job.step(25)) { var routed = job.done(); dlog('library: sorted into channels in ' + (Date.now() - t0) + ' ms'); resolve(routed); }
          else setTimeout(pump, 0);
        })();
      });
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
      ukRev = (j && j.uk) ? String(j.uk) : '';
      epdbRev = (j && j.epdb) ? String(j.epdb) : ''; filmdbRev = (j && j.filmdb) ? String(j.filmdb) : ''; epdbFiles = j && j.epdbFiles instanceof Array && j.epdbFiles.length ? j.epdbFiles : null;
      var chans = (j && j.channels) || {};
      libWant = (j && j.library) ? String(j.library) : '';
      if (!j || !j.library || !window.LIBROUTE) return chans;
      // Which channels changed only shows once the library is routed, so remember the answer per library and
      // shows.json revision: an unchanged library costs one small download, not the whole file.
      return http(SHOWS_URL).then(function (showsText) {
        // the routes revision is part of the key: a new routes.json moves shows between channels just as
        // an edit to shows.json does, so the answer stored for the old one must not be reused
        var key = 'librevs2:' + j.library + ':' + (j.routes || '-') + ':' + (j.removed || '-') + ':' + E.hash(showsText) + (magicOn ? 'm' : '');
        var known = store.get(key);
        if (known && known.revs) { libRevs = known.revs; dlog('START: channel lists found from the saved answer'); return known.revs; }
        var route = function () { return loadLibraryRoutes(j.library, showsText).then(function (routed) {
          if (!routed) return chans;
          var revs = {};
          // a channel with its own published file that the library routes nothing to (Food & Cooking) keeps that file
          Object.keys(chans).forEach(function (ch) { if (!routed[ch] || !routed[ch].length) revs[ch] = chans[ch]; });
          var texts = {};
          return eachSliced(Object.keys(routed), function (ch) {
            texts[ch] = JSON.stringify(routed[ch]);
            revs[ch] = 'L' + E.hash(texts[ch]).toString(36);
          }).then(function () {
          // the per-channel copies are saved once the channels are on their way, not before the first one can start
          setTimeout(function () { eachSliced(Object.keys(texts), function (ch) { keepSorted(ch, revs[ch], texts[ch]); delete texts[ch]; }); }, 3000);
          try {                                 // forget answers for older libraries
            var _ks = kv.keys(); for (var k = _ks.length - 1; k >= 0; k--) {
              var kn = _ks[k];
              if (kn && kn !== key && kn.indexOf('librevs') === 0) { kv.removeItem(kn); try { localStorage.removeItem(kn); } catch (e2) { /* none */ } }
            }
          } catch (e) { /* ignore */ }
          if (!store.set(key, { revs: revs })) dlog('COULD NOT SAVE which list each channel gets: the whole library will be sorted again at the next start');
          libRevs = revs; libRevsOld = false;
          return revs;
          });
        }); };
        // A new library (the scraper pushes several a day) used to mean downloading and sorting all of it before the
        // guide could open. When this TV has the answer for an earlier library, open on that (every channel's saved
        // list still fits it) and catch up once the guide is up: libCatchUp.
        var oldKey = null;
        try { kv.keys().forEach(function (kn) { if (kn && kn.indexOf('librevs2:') === 0 && (kn.slice(-1) === 'm') === magicOn) oldKey = kn; }); } catch (e) { /* none */ }
        var old = oldKey && store.get(oldKey);
        if (!old || !old.revs) { dlog('START: no saved answer for this library, sorting it before any channel can load'); return route(); }
        dlog('START: new library, opening on the lists already saved; sorting it in the background later');
        libRevs = old.revs; libRevsOld = true;      // an earlier library's answer: nothing is saved under these revisions
        libCatchUp = function () {
          route().then(function (revs) {
            indexP = Promise.resolve(revs);   // what this start is still missing is built and saved now, so the next start opens on it straight away
            dlog('library: caught up with the new library in the background');
            odiMem = {}; odiJobs = {}; odWarmed = false; setTimeout(odWarm, 5000);      // On Demand's rows for the new revisions
            channels.forEach(function (c) { if (!isAdChan(c)) loadPrograms(Object.create(c)).then(null, function () { /* built at the next start */ }); });
          });
        };
        return old.revs;
      }, function () { return chans; });
    }, function () { return {}; });
    indexP.then(function (r) { dataRevs = r || null; }, function () { /* no revisions */ });      // On Demand's index is keyed by them
    return indexP;
  }

  /** One channel's published list: from the whole library when that's in use, else its own file, else nothing (live searches). */
  function loadChannelData(id, rev) {
    // a decade channel has no file of its own to compare against (the index lists none for 80's and 90's TV), so it
    // always takes what the library routed to it
    if (libRevs && ((rev && rev === libRevs[id]) || decadeOfChannel(id))) {
      var saved = readSorted(id, libRevs[id]);
      if (saved) return Promise.resolve(saved);
      return loadLibraryRoutes().then(function (routed) {
        if (routed && routed[id] && routed[id].length) {
          // keep it for the next start (not while the revisions are an older library's: these rows are the new one's)
          if (!libRevsOld && libRevs && libRevs[id]) keepSorted(id, libRevs[id], JSON.stringify(routed[id]));
          return routed[id];
        }
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
    if (!rev) return Promise.resolve(null);
    return getJSON(DATA_BASE + encodeURIComponent(id) + '.json').then(function (rows) {
      return rows && rows.length ? rows : null;
    }, function () { return null; });
  }
  var AUTO_DUR = { 'The Bill': 1500 };      // typical running time (s) until the real length has been seen once
  // Channels whose programmes carry no episode number: songs, films, Disney shorts ("How to Sleep"), MTV's
  // untitled and dated blocks, and news bulletins. Insisting on one empties them.
  var NO_EPISODES = { mc_action: 1, mc_horror: 1, mc_scifi_movies: 1, mc_comedy_movies: 1, mc_thriller: 1, mc_drama_movies: 1, mc_xmas_pop: 1, mc_aussie: 1, mc_uk_soaps: 1, mc_us_soaps: 1, mc_kitchen: 1, mc_light_ent: 1, xmasmusic: 1, xmasmovies: 1, kidsmovies: 1, videoshop: 1, mtv: 1, disney: 1, tvarchive: 1, soaps: 1, cooking: 1, entertainment: 1, saturday: 0 };
  /** A row of songs or films: nothing in it will carry SxxExx, so insisting on one empties the channel. */
  function wantsEpisodes(channelId, it) {
    if (NO_EPISODES[channelId]) return false;
    var m = it.m;
    if (m) for (var k in m) if (m.hasOwnProperty(k) && (m[k].song || m[k].film)) return false;
    return true;
  }
  /** A soap file named by its overall number ("Neighbours Episode 2965", "Neighbours 1000") has no season or episode in its
   *  name, so it was filed as a "Special" and Magic EPG filled the same episode in again. absnum.js (made from the episode
   *  guides) turns the number into the season and episode. Only shows listed there; a number outside the guide is left alone. */
  function absEp(show, file) {
    var T = window.ABSNUM && ABSNUM[normShow(show)];
    if (!T) return null;
    var b = String(file || '').split('/').pop().replace(/\.[A-Za-z0-9]{2,4}$/, '').replace(/\.ia$/i, '');
    if (/\bS\d+\s*E\d+|\b\d+x\d+\b/i.test(b)) return null;
    var m = /\bEpisode\s*0*(\d{1,5})\b/i.exec(b) || /\bEp\.?\s*0*(\d{1,5})\b/i.exec(b);
    if (!m) { var w = normShow(show).split(' ')[0]; m = new RegExp('^' + w + '[\\s_.-]+0*(\\d{1,5})(?!\\d)', 'i').exec(b); }
    if (!m) return null;
    var n = +m[1], lo = 0, hi = T.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (T[mid][0] <= n) lo = mid; else hi = mid - 1; }
    var r = T[lo];
    return r && n >= r[0] && n < r[0] + r[3] ? { s: r[1], e: r[2] + (n - r[0]), n: n } : null;
  }
  /** The same lookup for a list read back from storage, whose programmes were named before absnum.js knew the numbers. */
  function codeByNumber(progs) {
    if (!window.ABSNUM) return progs;
    progs.forEach(function (p) {
      var show = p.show || p.group;
      if (!show || !ABSNUM[normShow(show)] || (window.LINKS && LINKS.parseEp(p.title))) return;
      var ac = absEp(show, String(p.id || '').split('/').pop()) || absEp(show, p.title);
      if (ac) p.title = show + ' S' + pad2(ac.s) + 'E' + pad2(ac.e) + ' Episode ' + ac.n;
    });
    return progs;
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
          if (d.shorts) p.shorts = 1;          // a Disney short: no season or episode, no series art, no TVmaze lookups
          if (d.film) { p.filmKey = keepFilm(d); p.cert = d.cert || ''; }   // TMDb details, and the certificate
        }
        if (show && window.ABSNUM && !(window.LINKS && LINKS.parseEp(p.title))) {
          var ac = absEp(show, nm);
          if (ac) p.title = show + ' S' + pad2(ac.s) + 'E' + pad2(ac.e) + ' Episode ' + ac.n;
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
  var BAD_ITEMS = { '1x-02-edward-helps-out': 1, '02a.-james-learns-a-lesson-us-vhs-strand-vci-1990_202402': 1, 'thomas-friends-us': 1, 'thomas-and-the-special-letter-us-vhs-original-1995-720p-60': 1, 'cranky-bugs-us-vhs-original-1999': 1, 'thomas-and-friends-series-1-us-george-carlin': 1, 'thomas-friends-series-1-2-ringo-starr-us': 1, 'ttte-cgi-series-us-hd': 1, 'thomas-and-friends-a-new-friend-for-thomas-us-rs-custom-echo_202303': 1, 'thomas-and-the-rumors-us-custom-echo': 1, 'drew-thomas-season-1': 1, 'getting-coffee-vroom': 1, 'thomas-friends_202212': 1, 'care-bears-adventures-in-care-a-lot': 1, 'Thomas-UK-HD': 1, 'the-lion-king-musical': 1, 'get-smart-s-01-e-01-mr.-big-pilot': 1, 'PCTV214710103-OvercomingThroughTheWord_BookOfPhillipiansPart1_12-20-18': 1, 'mvgproductionsarchivewofs2': 1, 'mrandmrsnorthseries': 1, 'angels-of-light-truth-expo-25': 1, 'short-noise-work-by-james-cleeland': 1, 'SERMONINDEX_gPi7vI0XPQ0': 1, 'budgie-the-little-helicopter-series-2-episode-8-surprise-surprise': 1, 'mr-and-mrs-is-the-name-1935-restored': 1, 'the-busy-world-of-richard-scarry-s-01-e-07-the-snowstorm-professor-dig-and-his-e': 1, 'AngelsinHeat2': 1, '00AIH1': 1, '1993TvsCounterCam': 1, '1992VideoShopTedsBooksAdamsCainingMagicMt': 1, 'tamers12345-sonic-underground': 1, 'the-goonies-1985_202510': 1, 'sailor-moon-1992-1080pcbr-': 1, 'bishoujo-senshi-sailor-moon-live': 1,
    'the-addams-family__season-2': 1, 'the-addams-family__season-1': 1,
    '20250604_20250604_0220': 1, '20250527_20250527_1334': 1, '20250601_20250601_0848': 1 };      // Russian first audio track, English second
  // Shows hidden on this TV from the hold-OK menus (Options > TV Guide > Hidden shows brings them back).
  var hid = store.get('hid1') || {}, hidCount = Object.keys(hid).length;
  function hidKey(p) { return LIBROUTE.norm(p.filmKey ? (p.title || '') : (p.show || p.group || '')); }
  function hidSave() { store.set('hid1', hid); hidCount = Object.keys(hid).length; }
  function dropHidden(list) { return hidCount ? list.filter(function (p) { var k = hidKey(p); return !(k && hid[k]); }) : list; }
  var BAD_SALT = E.hash(Object.keys(BAD_ITEMS).join(','));       // stored lineups and plans are rebuilt whenever this block list changes
  // The American Price Is Right (Barker/Carey, Buzzr, TPIR ids); only Bruce's Price Is Right is the UK one.
  var US_TPIR = /price\s*is\s*right|\btpir|barker\s*era/i;
  function blocked(p) {
    if (!p) return false;
    if (p.id && (BAD_ITEMS[String(p.id).split('/')[0]] || /^mvgproductions/i.test(String(p.id)))) return true;   // MVG Productions Archive = Big Jon's American game shows
    if (hidCount) { var hk = hidKey(p); if (hk && hid[hk]) return true; }
    var t = (p.show || p.group || '') + ' ' + (p.title || '') + ' ' + (p.sub || '') + ' ' +
            String(p.id || '').replace(/[-_]/g, ' ');
    if (US_TPIR.test(t) && !/bruce/i.test(t)) return true;
    return BLOCKED.test(t) || (!!p.filmKey && BLOCKED_FILM.test(t));
  }

  // A film's details come from TMDb with the scraper's library: the plot and poster are far too big to repeat on
  // every stored listing, so each film is kept once under its own key and the listing only carries the key.
  var TMDB_IMG = 'https://image.tmdb.org/';
  function keepFilm(d) {
    var key = String(d.tm || '').trim() || normShow(d.n || '');
    if (!key) return '';
    var poster = String(d.p || ''), logo = String(d.lg || '');
    var film = { title: d.n || '', plot: d.ov || '', poster: poster.indexOf(TMDB_IMG) === 0 ? poster : '',
                 logo: logo.indexOf(TMDB_IMG) === 0 ? logo : '',          // a clear (transparent title) image, when the scraper found one
                 genres: Array.isArray(d.g) ? d.g.join(', ') : (d.g || ''),
                 mins: +d.rt || 0, released: d.a || '', tmdb: d.tm || '', cert: d.cert || '', col: d.col || '', cn: d.cn || '',
                 cast: Array.isArray(d.cast) ? d.cast.slice(0, 10).map(function (m) {
                   if (typeof m === 'string') return { n: m, c: '', p: '' };
                   var ph = String(m.p || m.photo || m.profile || m.image || m.img || '');    // tolerate a spelled-out key
                   return { n: m.n || m.name || '', c: m.c || m.character || m.role || '', p: ph.indexOf(TMDB_IMG) === 0 ? ph : '' };
                 }) : [] };
    // stored even when TMDb knew nothing, so Info shows the film's own title instead of hunting for a TV series.
    // Written only when it differs from the saved copy: every channel build runs this for every film, and each save is
    // a synced file write on the TV (thousands of them froze the start-up when Magic Channels was on).
    var fk = 'film1:' + key, text = JSON.stringify(film), h = E.hash(text);
    if (filmSeen[fk] === h) return key;
    filmSeen[fk] = h;
    var had = null; try { had = kv.getItem(fk); } catch (e) { /* none */ }
    if (had !== text) store.set(fk, film);
    return key;
  }
  var filmSeen = {};      // film key -> hash of the details last checked or saved in this run
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
        var dkey = 'plan7d:' + ch.id + ':' + E.hash('v8|' + rev + '|' + epgGen + '|' + BAD_SALT);
        ch.cacheKey = dkey;
        var dcached = store.get(dkey);
        if (dcached && dcached.p && dcached.p.length && Date.now() - dcached.t < planTtl()) {
          ch.autoUsed = true;
          ch.report = [];
          ch.cacheT = dcached.t;
          ch.plan = dropHidden(unpackPlan(dcached.p));
          listStats.saved++;
          return ch.plan;
        }
        if (dcached && dcached.p && dcached.p.length) listStats.old++; else listStats.none++;
        if (listStats.names.length < 8) listStats.names.push(ch.name);
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
    // every channel waiting for the library gets it at the same moment: a turn of the event loop before each build keeps
    // them from running back to back in one stretch, so the tuning count climbs and the loading screen can time out
    return loadChannelData(ch.id, rev).then(function (rows) { return new Promise(function (r) { setTimeout(function () { r(rows); }, 0); }); }).then(function (rows) {
      var bt0 = Date.now();
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
      listStats.ms += Date.now() - bt0;
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
    var key = prefix + ch.id + ':' + E.hash(JSON.stringify(sources) + (ch.perItem || '') + salt + '|v7|' + epgGen + '|' + BAD_SALT);   // bump when the naming/URL rules change so stored titles are rebuilt (how long it is kept is Options > Keep listings)
    ch.cacheKey = key;
    var cached = ch.noCache ? null : store.get(key);
    if (cached && cached.p && cached.p.length && Date.now() - cached.t < planTtl()) {
      ch.report = cached.r || [];
      ch.cacheT = cached.t;
      ch.plan = dropHidden(unpackPlan(cached.p));
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
  /** One programme, one place in the list. The same episode or film can arrive twice (two sources, or a file and a filled-in
   *  gap); a file we have always wins over a virtual one, and a second copy of either is dropped. */
  function dedupeProgs(progs) {
    var seen = {}, kk = function (p) {
      if (p.ad || p.adBlock || p.song || p.shorts) return '';
      if (p.filmKey) return 'f:' + p.filmKey;
      var ref = window.LINKS && LINKS.parseEp(p.title), nm = gmName(p);
      return ref && nm ? 'e:' + normShow(nm) + ':' + ref.s + ':' + ref.e : '';
    };
    progs.forEach(function (p) { if (!p.virtual) { var k = kk(p); if (k && !seen[k]) seen[k] = 1; } });
    var taken = {}, out = progs.filter(function (p) {
      var k = kk(p); if (!k) return true;
      if (p.virtual) { if (seen[k]) return false; if (taken[k]) return false; taken[k] = 1; return true; }
      if (taken[k]) return false; taken[k] = 1; return true;
    });
    return out.length >= 3 ? out : progs;
  }
  function dropSlow(progs) {
    var ok = progs.filter(function (p) { return !isSlow(p.id); });
    return ok.length >= 3 ? ok : progs;
  }

  // ------------------------------------------------------------------ channels

  /** Magic Channels (experimental): the extra themed channels from the library. Off, they are not even routed. */
  var magicOn = store.get('mc1') === 'on';
  var channels = window.CHANNELS.filter(function (c) { return !c.off && (!c.magic || magicOn); }).map(function (c) {
    return { n: c.n, id: c.id, name: c.name, sources: c.sources, maxItems: c.maxItems, perItem: c.perItem, mix: c.mix, decade: c.decade || 0, report: [], status: 'loading', sched: null };
  });

  /** True once every channel has finished loading: optional extras (artwork, advert lists) wait for this so they never compete with start-up. */
  function quiet() { return channels.every(function (c) { return c.status !== 'loading'; }); }
  /** Someone is pressing buttons right now: background work waits so it never makes the screen stutter. */
  function userBusy() { return Date.now() - lastKeyAt < 900; }
  /** Resolves once no button has been pressed for ms: heavy background steps wait here so they never land between two presses. */
  function idleFor(ms) { return new Promise(function (r) { (function chk() { if (Date.now() - lastKeyAt >= ms && !playingOd()) r(); else setTimeout(chk, 400); })(); }); }
  /** An On Demand show is playing, or On Demand is home and anything is: the TV is busy decoding, so background jobs wait rather than land between a press and its picture. */
  function playingOd() { return !!(cur && !v.paused && (!odOpen || odPip) && (cur.od || (expOn && startOdOn))); }
  /** progsFromData for a long list, in small slices with a breath between them (and a longer wait while a button is
   *  being pressed), so building a big channel in the background cannot freeze the screen for a second. */
  function progsFromDataSliced(items, channelId, everything) {
    return new Promise(function (resolve) {
      var out = [], i = 0, n = 4;                                     // items per slice: learned as it goes, aiming at about 8 ms
      (function step() {
        if (!odOpen && userBusy()) { setTimeout(step, 250); return; }      // On Demand on screen is waiting for this: no pausing then
        var t0 = performance.now(), part = progsFromData(items.slice(i, i + n), channelId, everything), ms = performance.now() - t0;
        for (var k = 0; k < part.length; k++) out.push(part[k]);
        i += n;
        n = ms < 5 ? n * 2 : ms > 10 ? Math.max(1, n >> 1) : n;
        if (i < items.length) setTimeout(step, 0); else resolve(out);
      })();
    });
  }

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
      spMore(60);
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
  var SP_SURF_MS = 900;       // a new picture tunes in this often (it was 1.7 s)
  var OD_SPLASH_MIN = 5000;   // starting in On Demand: the loading screen stays at least this long (ms since launch), so the tuning can be seen
  var spSlots = [], spInited = false, spSurfTimer = null, spStep = 0;
  function spInit() {
    if (spInited) return;
    spInited = true;
    var c = $('spnoise'), x = c.getContext('2d'), img = x.createImageData(c.width, c.height), d = img.data;     // four frames of static in one tall picture
    for (var i = 0; i < d.length; i += 4) { var v = (Math.random() * 255) | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    // One screen that surfs the dial: every couple of seconds the needle moves to the next channel's place on the scale, the green number
    // shows that channel, and the picture and the room's backdrop change to the same new picture together, after a burst of static.
    var el = document.createElement('div');
    el.className = 'spslot has now'; el.setAttribute('data-ch', 'P--');
    $('spslides').appendChild(el); spSlots.push(el);
    var bgb = $('spbg');
    if (bgb) { var tw = document.createElement('div'); tw.className = 'spbgslot now'; bgb.appendChild(tw); el._tw = tw; }
    spSurf();
    spSurfTimer = setInterval(spSurf, SP_SURF_MS);
  }
  var spRecent = [], spChi = 0, spDone = -1, spEver = false;
  function spSurf() {
    var el = spSlots[0]; if (!el) return;
    var pool = spPics.length ? spPics : spPosters;                   // backdrops only; posters just until a backdrop has loaded
    var list = channels.slice().sort(function (a, b) { return a.n - b.n; }), k = list.length ? spStep++ % list.length : 0, c = list[k];
    var u = '';
    if (pool.length) {
      var fresh = pool.filter(function (p) { return !spSeen[p]; });  // never one already shown, while there is a new one to show
      if (fresh.length < 14) spMore(12);                              // and keep fetching so there always is
      if (!fresh.length) {                                            // every one seen: start over, never with one of the last few shown
        spSeen = {};
        fresh = pool.filter(function (p) { return spRecent.indexOf(p) < 0; });
        if (!fresh.length) fresh = pool.slice();
      }
      u = fresh[(Math.random() * fresh.length) | 0];
      spSeen[u] = 1; spRecent.push(u); if (spRecent.length > 6) spRecent.shift();
    }
    var pn = c ? c.n : 1 + k;
    var nd = $('spneedle');
    if (nd) { nd.style.animation = 'none'; nd.style.transition = 'left .45s ease-out'; nd.style.left = (list.length ? (k + 0.5) / list.length * 100 : 50) + '%'; }
    el.setAttribute('data-ch', 'P' + (pn < 10 ? '0' : '') + pn);
    el.style.backgroundImage = 'none'; if (el._tw) el._tw.style.backgroundImage = 'none';     // static between channels, then the picture
    setTimeout(function () {
      if (!u) return;
      spEver = true;
      el.style.backgroundImage = 'url("' + u + '")'; if (el._tw) el._tw.style.backgroundImage = 'url("' + u + '")';
    }, 160);
  }
  /** A picture has loaded: if the screen is still on static, give it one. */
  function spFill() { if (!spEver && spSlots[0] && (spPics.length || spPosters.length)) spSurf(); }
  /** The loading screen is the splash at launch, On Demand as home or not; it is shown again when the guide is opened before every channel is in. */
  var spGuide = false, spGuideT = null;
  function guideSplashCheck() {
    if (!(expOn && startOdOn) || spGuide) return;
    var left = function () { return channels.filter(function (c) { return c.status === 'loading'; }).length; };
    if (!left()) return;
    spGuide = true; $('splash').className = ''; statusSig = ''; renderStatus();
    if (spInited && !spSurfTimer) spSurfTimer = setInterval(spSurf, SP_SURF_MS);
    clearInterval(spGuideT);
    spGuideT = setInterval(function () {
      renderStatus();
      if (!left() || !guideOpen) { clearInterval(spGuideT); spGuide = false; $('splash').className = 'hidden'; clearInterval(spSurfTimer); spSurfTimer = null; }
    }, 400);
  }
  function renderStatus() {
    if (started && !spGuide) return;           // the loading screen is gone: nothing to draw while the rest of the channels finish (it is up at launch, and again if the guide is opened before every channel is in)
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
    // the little TV shows the real tuning: a green bar fills along the scale and the label counts the channels that have finished;
    // the needle, knobs and pictures keep going on their own (CSS), so something moves even while the guides are being built
    var settled = channels.filter(function (c) { return c.status === 'ready' || c.status === 'empty'; }).length;
    if (channels.length && settled < channels.length && !$('splash').classList.contains('busy')) {
      var sm0 = $('spmsg'), mt = 'Loading channels ' + settled + ' of ' + channels.length + (performance.now() > 20000 ? '\nThe first start takes longest' : '');
      if (sm0 && sm0.textContent !== mt) sm0.textContent = mt;
    }
    if (settled !== spDone && channels.length) {
      var first = spDone < 0;
      spDone = settled;
      $('sptrack').style.setProperty('--p', Math.round(100 * settled / channels.length) + '%');
      var allIn = settled >= channels.length;                    // every channel has answered: say so, rather than sit on "31 / 31"
      $('spscale').firstChild.textContent = allIn ? 'READY  ' + settled + ' / ' + channels.length : 'TUNING  ' + settled + ' / ' + channels.length;
      $('splash').classList.toggle('ready', allIn);
      if (allIn) $('spmsg').textContent = 'Opening the guide\u2026';
      var scr = $('spscreen');
    }
    if (!started && channels.length && expOn && startOdOn) {          // On Demand opens after a couple of channels: let the green bar creep along with the time so it visibly tunes, and finish when it is ready
      var realP = 100 * settled / channels.length, creepP = Math.min(92, performance.now() / OD_SPLASH_MIN * 92);
      $('sptrack').style.setProperty('--p', Math.round(settled >= channels.length ? 100 : Math.max(realP, creepP)) + '%');
    }
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
      }).then(function (map) { return idleFor(1500).then(function () { store.set(key, { t: Date.now(), eps: map }); return map; }); },
              function () { return undefined; });   // network trouble: try again next time, cache nothing
    });
    tvmChain = job.then(function () { return wait(500); }, function () { return wait(500); });
    return job;
  }

  /** Swap file-name episode titles for the real ones: "Lovejoy S04E12 Dainty Dish". Only when show and number match. */
  // The episode-name check is not needed to open the guide, and reading every show's saved episode list while the channels load made a start
  // take twice as long. Channels wait here until the guide is up, then are checked one at a time in the background.
  var enrichQ = [], enrichRun = false;
  function enrichLater(c, progs) {
    enrichQ.push([c, progs]);
    if (enrichRun) return;
    enrichRun = true;
    (function next() {
      if (!started || Date.now() - lastKeyAt < 2500 || playingOd()) { setTimeout(next, 1000); return; }
      var j = enrichQ.shift();
      if (!j) { enrichRun = false; return; }
      enrichNames(j[0], j[1]).then(function () { setTimeout(next, 50); }, function () { setTimeout(next, 50); });
    })();
  }
  var nameLast = 0, nameStat = { n: 0, read: 0, loop: 0 };      // episode-name look-ups made at a start: how many, and the time reading them and comparing
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
      return chain.then(function () { return idleFor(2500); }).then(function () { return new Promise(function (r) { setTimeout(r, odOpen ? Math.max(1200, nameLast * 8) : Date.now() - lastKeyAt < 5000 ? 1500 : cur && !v.paused ? Math.max(250, nameLast * 8) : Math.max(40, nameLast * 4)); }); }).then(function () {      // a breath between shows (four times as long as the last one took, so the picture and the snow keep drawing), longer while a button is pressed
        var tq = performance.now();
        return tvmEpisodes(byShow[k].show).then(function (map) {
          var tr = performance.now();
          jm('episode names ' + byShow[k].show);
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
          byShow[k].items.forEach(function (it) { if (!it.p.tvDone) { it.p.tvDone = true; changed = true; } });      // checked and nothing to change: not asked again at every start
          nameStat.n++; nameStat.read += tr - tq; nameStat.loop += performance.now() - tr; nameLast = performance.now() - tq;
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
    if (!gartOn || !prog || prog.ad || prog.shorts) return null;
    var film = filmFor(prog);
    var p = parseTitle(prog.title || '');
    if (prog.show) p.show = prog.show;
    if (film) { p.show = film.title || prog.title || ''; p.s = 0; p.e = 0; }     // a film has its own poster, but a backdrop may be on file under its title
    if (!p.show) return film && film.poster ? { poster: film.poster, back: '' } : null;
    if (!film && isFilmChannelName(p.show)) return null;      // "The Video Shop" / "Kids Movies" are channels, not shows: never look them up for a poster
    if (!artP) loadArt();
    var out = { poster: '', back: '' };
    var fxa = store.get('artfix:' + normShow(p.show));
    var a = (fxa && fxa.a) || !film && artIdx && (function () {      // never for a film: "Jumanji" or "Police Academy" are also TV cartoons
      var w = p.show.split(/\s+/);
      for (var n = w.length; n >= 1; n--) { var h = artIdx[normShow(w.slice(0, n).join(' '))]; if (h && (n > 1 || w.length === 1)) return h; }
      return null;
    })();
    if (a) { out.poster = https(a.p); out.back = https(a.b); }
    if (!film && (!out.poster || !out.back)) {
      var i = store.get('info3:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0));
      if (i && i.d && i.d.show) { out.poster = out.poster || i.d.show.poster || ''; out.back = out.back || i.d.show.background || ''; }
      var g = store.get('art2:' + normShow(p.show));
      if (g && g.d && g.d.background) out.back = out.back || g.d.background;
    }
    if (film && film.poster && !(fxa && fxa.a && fxa.a.p)) out.poster = film.poster;      // the film's own poster, unless one was picked by hand
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

  // ---- TheTVDB: the person's own key (Options > Artwork). Tried first for posters, backdrops, summaries and episodes,
  // with TVmaze kept for whatever it has nothing on. No key, or a key it will not accept: nothing here runs.
  var tvdbStat = { found: 0, none: 0, fail: 0, last: '' };
  var tvdbKey = String(store.get('tvdbkey') || ''), tvdbPause = 0, tvdbTokP = null, tvdbChain = Promise.resolve();
  var TVDB = 'https://api4.thetvdb.com/v4';
  function tvdbReady() { return !!tvdbKey && Date.now() > tvdbPause && !!(window.NativeHttp && NativeHttp.httpx); }
  function httpx(method, url, headers, body) {
    return new Promise(function (res, rej) {
      var id = ++reqId;
      pending[id] = { res: res, rej: rej, url: url };
      window.NativeHttp.httpx(id, method, url, JSON.stringify(headers || {}), body || '');
      setTimeout(function () { if (pending[id]) { delete pending[id]; rej(new Error('timeout')); } }, 40000);
    });
  }
  function tvdbLogin() {
    var c = store.get('tvdbtok');
    if (c && c.k === tvdbKey && Date.now() - c.t < 20 * 24 * 3600 * 1000) return Promise.resolve(c.tok);
    if (tvdbTokP) return tvdbTokP;
    var key = tvdbKey;
    tvdbTokP = httpx('POST', TVDB + '/login', { 'Content-Type': 'application/json', Accept: 'application/json' }, JSON.stringify({ apikey: key })).then(JSON.parse).then(function (j) {
      var t = j && j.data && j.data.token;
      if (!t) throw new Error('HTTP 401');
      store.set('tvdbtok', { k: key, t: Date.now(), tok: t });
      tvdbTokP = null; return t;
    }, function (e) {
      tvdbTokP = null;
      if (/HTTP 4\d\d/.test(e.message)) { tvdbPause = Date.now() + 3600 * 1000; dlog('TVDB key not accepted: ' + e.message); }     // wrong key: leave it alone for an hour
      throw e;
    });
    return tvdbTokP;
  }
  function tvdbGet(path) {
    return tvdbLogin().then(function (tok) {
      return httpx('GET', TVDB + path, { Authorization: 'Bearer ' + tok, Accept: 'application/json' }).then(JSON.parse);
    }).then(null, function (e) {
      if (/HTTP 401/.test(e.message)) { try { kv.removeItem('tvdbtok'); } catch (x) { /* none */ } }
      throw e;
    });
  }
  /** One request at a time, a moment apart. */
  function tvdbQueue(fn) {
    var job = tvdbChain.then(fn);
    tvdbChain = job.then(function () { return wait(150); }, function () { return wait(150); });
    return job;
  }
  /** The show as TheTVDB has it, in the shape the rest of the app reads; null when it has no match. Kept per show. */
  /** The Disney cartoons that have no series of their own on TheTVDB (Donald Duck, Goofy, Pluto and the rest) are all in one
   *  series there, "Disney Animated Shorts". For pictures only they share its poster and backdrop; episodes and summaries are
   *  not taken from it, because its numbering is not theirs. */
  var DISNEY_SHORTS = { 'donald duck': 1, 'goofy': 1, 'pluto': 1, 'mickey mouse': 1, 'minnie mouse': 1, 'daisy duck': 1, 'humphrey the bear': 1,
    'scrooge mcduck': 1, 'silly symphonies': 1, 'silly symphony': 1, 'disney classic': 1, 'disney short': 1, 'disney shorts': 1, 'walt disney cartoon': 1, 'walt disney cartoons': 1 };
  function disneyShort(name) { return !!DISNEY_SHORTS[normShow(name)]; }
  function tvdbShow(name, year, shared) {
    if (shared && disneyShort(name)) {
      return tvdbShow('Disney Animated Shorts', 0).then(function (d) {
        return d ? Object.assign({}, d, { name: name, summary: '', cast: [], year: '', ended: '', shared: 1 }) : null;
      });
    }
    var key = 'tvdb1:' + normShow(name), c = store.get(key);
    if (c && (c.d ? metaFresh(c) : Date.now() - c.t < TVM_MISS)) return Promise.resolve(c.d);
    var words = name.split(/\s+/), tries = [name];
    if (words.length > 3) tries.push(words.slice(0, 3).join(' '));
    if (words.length > 2) tries.push(words.slice(0, 2).join(' '));
    return tvdbQueue(function () {
      var i = 0;
      function next() {
        if (i >= tries.length) return null;
        return tvdbFind(tries[i++], year).then(function (r) { return r || next(); });
      }
      return next();
    }).then(function (hit) {
      if (!hit) { tvdbCount('none', name); return null; }
      return tvdbQueue(function () { return tvdbGet('/series/' + hit.tvdb_id + '/extended?short=true'); }).then(function (j) {
        var d = tvdbBuild((j && j.data) || {}, hit);
        if (!d.poster && !d.background) d = null;
        store.set(key, { t: Date.now(), d: d });
        tvdbCount(d ? 'found' : 'none', name);
        return d;
      });
    }).then(null, function (e) { tvdbCount('fail', name + ' (' + e.message + ')'); throw e; });
  }
  function tvdbCount(kind, name) {
    tvdbStat[kind]++; tvdbStat.last = name;
    dlog('TVDB ' + (kind === 'found' ? 'found ' : kind === 'none' ? 'no match for ' : 'failed for ') + name);
    if (optsOpen) renderOpts();
  }
  /** TheTVDB's extended record for a series -> the show shape the app reads. */
  function tvdbBest(arts, type) {
    var l = arts.filter(function (a) { return a.type === type && a.image && (!a.language || a.language === 'eng'); });
    if (!l.length) l = arts.filter(function (a) { return a.type === type && a.image; });
    l.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    return l[0] ? https(l[0].image) : '';
  }
  function tvdbBuild(x, hit) {
    var arts = x.artworks || [];
    function best(type) { return tvdbBest(arts, type); }
        var net = (x.originalNetwork && x.originalNetwork.name) || (x.latestNetwork && x.latestNetwork.name) || '';
        var ended = x.status && /ended/i.test(x.status.name || '') && x.lastAired ? String(x.lastAired).slice(0, 4) : '';
        var cast = (x.characters || []).filter(function (m) { return m.type === 3 && m.personName; })
          .sort(function (a, b) { return (a.sort || 99) - (b.sort || 99); }).slice(0, 10)
          .map(function (m) { return { n: m.personName, c: m.name || '', p: https(m.personImgURL || m.image || '') }; });
        var d = {
          name: x.name || hit.name, year: x.firstAired ? String(x.firstAired).slice(0, 4) : (x.year || hit.year || ''), ended: ended, network: net,
          genres: (x.genres || []).slice(0, 3).map(function (g) { return g.name; }).join(', '), rating: 0,
          summary: plain(hit.overview || x.overview), poster: https(x.image) || best(2) || https(hit.image_url), background: best(3), id: 0, cast: cast, tvdb: hit.tvdb_id
        };
        return d;
  }
  /** Search TheTVDB; the best match for the name (exact first, then British, then the nearest year). */
  function tvdbFind(name, year) {
    return tvdbGet('/search?type=series&limit=10&query=' + encodeURIComponent(name)).then(function (j) {
      var want = normShow(name), cands = [];
      ((j && j.data) || []).forEach(function (r) {
        var n = normShow(r.name || '');
        if (!n || !r.tvdb_id || !(n === want || n.indexOf(want) === 0 || want.indexOf(n) === 0)) return;
        cands.push({ r: r, exact: n === want, gb: r.country === 'gbr', yr: +r.year || 9999 });
      });
      if (!cands.length) return null;
      cands.sort(function (x, y) {
        if (year) { var dx = Math.abs(x.yr - year), dy = Math.abs(y.yr - year); if (dx !== dy) return dx - dy; }
        if (x.exact !== y.exact) return x.exact ? -1 : 1;
        if (x.gb !== y.gb) return x.gb ? -1 : 1;
        return x.yr - y.yr;
      });
      return cands[0].r;
    });
  }
  /** A TheTVDB show as an artwork-list entry (what a pick made on this TV is saved as). */
  function tvdbEntry(d) {
    return { name: d.name, i: 0, tvdb: d.tvdb, p: d.poster || '', b: d.background || '', n: d.network || '', y: d.year || '', e: d.ended || '', g: d.genres || '', s: d.summary || '' };
  }
  function tvdbExtended(hit) {
    return tvdbQueue(function () { return tvdbGet('/series/' + hit.tvdb_id + '/extended?short=true'); }).then(function (j) { return tvdbBuild((j && j.data) || {}, hit); });
  }
  // ---- films on TheTVDB: a backdrop (films come with a poster only), and pictures to choose from
  function filmArtName(prog) { var f = filmFor(prog); return (f && f.title) || (prog && prog.title) || ''; }
  function filmYear(prog) {
    var f = filmFor(prog), m = /\((\d{4})\)/.exec((prog && prog.title) || '');
    return (f && f.released ? +String(f.released).slice(0, 4) : 0) || (m ? +m[1] : 0);
  }
  function filmQuery(name) { return String(name).replace(/\s*\(\d{4}\)\s*$/, '').trim(); }
  /** A film's artworks sorted best first: posters (upright) or backgrounds (wide). TheTVDB types 14 and 15, else by shape. */
  function tvdbFilmArts(arts, kind) {
    var type = kind === 'poster' ? 14 : 15;
    var l = (arts || []).filter(function (a) { return a.image && a.type === type; });
    if (!l.length) l = (arts || []).filter(function (a) {
      if (!a.image || !a.width || !a.height) return false;
      var r = a.width / a.height;
      return kind === 'poster' ? r < 0.8 : (r > 1.5 && r < 2.1);
    });
    var en = l.filter(function (a) { return !a.language || a.language === 'eng'; });
    if (en.length) l = en;
    return l.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
  }
  function tvdbFilmSearch(name, year) {
    return tvdbQueue(function () { return tvdbGet('/search?type=movie&limit=10&query=' + encodeURIComponent(filmQuery(name)) + (year ? '&year=' + year : '')); }).then(function (j) {
      return ((j && j.data) || []).filter(function (r) { return r.tvdb_id; });
    });
  }
  function tvdbFilmExtended(hit) {
    return tvdbQueue(function () { return tvdbGet('/movies/' + hit.tvdb_id + '/extended?short=true'); }).then(function (j) {
      var x = (j && j.data) || {}, bg = tvdbFilmArts(x.artworks, 'background')[0], po = tvdbFilmArts(x.artworks, 'poster')[0];
      return { name: x.name || hit.name, year: x.year || hit.year || '', tvdb: hit.tvdb_id, film: 1,
               poster: https(x.image || (po && po.image) || hit.image_url || ''), background: bg ? https(bg.image) : '' };
    });
  }
  /** The best match for a film: the same name, then the nearest year. null when TheTVDB has none. */
  function tvdbFilm(name, year) {
    var want = normShow(filmQuery(name));
    function pick(list) {
      var c = list.filter(function (r) { return normShow(r.name || '') === want; });
      if (!c.length) return null;
      c.sort(function (a, b) { return Math.abs((+a.year || 9999) - (year || 0)) - Math.abs((+b.year || 9999) - (year || 0)); });
      return year && Math.abs((+c[0].year || 9999) - year) > 1 ? null : c[0];
    }
    return tvdbFilmSearch(name, year).then(function (l) { return pick(l) || (year ? tvdbFilmSearch(name, 0).then(pick) : null); })
      .then(function (hit) { return hit ? tvdbFilmExtended(hit) : null; });
  }
  function tvdbEpisode(sh, p) {
    return tvdbQueue(function () { return tvdbGet('/series/' + sh.tvdb + '/episodes/default?page=0&season=' + p.s + '&episodeNumber=' + p.e); }).then(function (j) {
      var e = j && j.data && j.data.episodes && j.data.episodes[0];
      if (!e) return null;
      return { name: e.name || '', season: e.seasonNumber, number: e.number, airdate: e.aired || '', runtime: e.runtime || 0, summary: plain(e.overview), image: https(e.image) };
    }, function () { return null; });
  }
  /** What the Info screen wants, from TheTVDB; null (so TVmaze is asked) when it has nothing. */
  function tvdbInfo(p) {
    return tvdbShow(p.show, p.year, true).then(function (sh) {
      if (!sh) return null;
      var d = { show: Object.assign({}, sh), ep: null };
      if (!p.e || sh.shared) return d;
      return tvdbEpisode(sh, p).then(function (ep) { d.ep = ep; return d; });
    });
  }
  function tvmInfoLive(p) {
    if (!tvdbReady()) return tvmInfoMaze(p);
    var key = 'info3:' + normShow(p.show) + ':' + (p.s || 0) + ':' + (p.e || 0), c = store.get(key);
    if (c && (c.d ? metaFresh(c) : Date.now() - c.t < TVM_MISS)) return Promise.resolve(c.d);
    return tvdbInfo(p).then(function (d) {
      if (!d) return tvmInfoMaze(p);
      store.set(key, { t: Date.now(), d: d });
      return d;
    }, function () { return tvmInfoMaze(p); });
  }

  function tvmInfoMaze(p) {
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
    if (!tvdbReady()) return tvmArtMaze(p);
    var key = 'art2:' + normShow(p.show), c = store.get(key);
    if (metaFresh(c)) return Promise.resolve(c.d);
    return tvdbShow(p.show, p.year, true).then(function (sh) {
      if (!sh || !sh.background) return tvmArtMaze(p);
      var d = { background: sh.background };
      store.set(key, { t: Date.now(), d: d });
      return d;
    }, function () { return tvmArtMaze(p); });
  }
  function tvmArtMaze(p) {
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
  /** Every show name in the library (films left out), once each. */
  function artNames() {
    var names = {}, list = [];
    function add(n) { if (n && n.length > 1 && !names[normShow(n)]) { names[normShow(n)] = n; list.push(n); } }
    return Promise.all([loadArt(), libP || Promise.resolve(null)]).then(function () {
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
        return list;
      });
    });
  }
  var artScan = { running: false, fails: 0 };
  function artScanKey() { return 'dsh1:' + epgGen + ':' + (artRev || '') + ':' + E.hash(JSON.stringify(libRevs || {})); }
  function artScanStart() {
    if (artScan.running || !gartOn) return;
    if (odOpen || odm || playingOd() || Date.now() - lastKeyAt < 6000) { setTimeout(artScanStart, 15000); return; }       // working out what to look up is heavy: never while On Demand is open or a button is being pressed
    var key = artScanKey();
    if (store.get('artscan_run') === key) return;                       // already done for this library and EPG build
    artScan.running = true; artScan.fails = 0;
    artNames().then(function (list) {
      return new Promise(function (res) {
        var noPic = [], noBack = [], at = 0;
        (function slice() {                              // a few dozen names at a time, so the screen never freezes while this is worked out
          var end = Math.min(list.length, at + 40);
          for (; at < end; at++) {
            var n = list[at], m = store.get('artscan1:' + normShow(n));
            if (m && Date.now() - m.t < TVM_MISS && !disneyShort(n)) continue;               // TVmaze had nothing a few days ago (the Disney shorts are asked again: they share a series now)
            var k = knownArt({ title: n, show: n });
            if (!k || !k.poster) noPic.push(n); else if (!k.back) noBack.push(n);
          }
          if (at < list.length) setTimeout(slice, 40); else res(noPic.concat(noBack));
        })();
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
        if (odOpen || odm || !gartOn || playingOd() || Date.now() - lastKeyAt < 6000) { setTimeout(step, 8000); return; }     // never compete with On Demand, or with a button that was just pressed
        var name = queue.shift();
        artScanOne(name).then(function (r) {
          if (r === 'found') found++; else if (r === 'miss') missed++;
          if (r === 'fail') { if (++artScan.fails >= 5) { queue.unshift(name); finish(false); return; } } else artScan.fails = 0;
          setTimeout(step, cur && !v.paused ? 4000 : 1500);       // slower while something plays
        });
      })();
    }, function () { artScan.running = false; });
  }
  function artScanOne(name) {
    jm('artwork ' + name);
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

  // ------------------------------------------------------------------ Options > Artwork > Scan my artwork
  // On request: every show in the library that is missing a poster, a backdrop or its episode pictures is looked up,
  // TheTVDB first when a key is entered and TVmaze otherwise, one show at a time, with a progress bar and Cancel.
  var scanUi = { running: false, cancel: false, i: 0, n: 0, name: '', art: 0, eps: 0, miss: 0, fail: 0, result: '' };
  function scanRender() { if (optsOpen) renderOpts(); }
  function scanEpsMap(list, sh) {      // either service's episode list -> the guide format On Demand reads (s, e, t, a, l, d, img)
    return list.filter(function (e) { return e && (e.season || e.seasonNumber != null) && (e.number); }).map(function (e) {
      var o = { s: e.season != null ? e.season : e.seasonNumber, e: e.number };
      if (e.name) o.t = e.name;
      var air = e.airdate || e.aired; if (air) o.a = air;
      if (e.runtime) o.l = e.runtime;
      var d = plain(e.summary || e.overview); if (d) o.d = d.length > 400 ? d.slice(0, 397) + '...' : d;
      var img = https(typeof e.image === 'string' ? e.image : (e.image && (e.image.medium || e.image.original))); if (img) o.img = img;
      return o;
    });
  }
  // ---- episode lists for the Magic EPG experiment: one call, whichever source is chosen in Options (TVmaze unless changed)
  var EPSRC = [{ id: 'tvmaze', label: 'TVmaze' }, { id: 'tvdb', label: 'TheTVDB' }, { id: 'tmdb', label: 'TMDB' }];
  var tmdbKey = String(store.get('tmdbkey') || '');
  var epSrcIdx = Math.max(0, EPSRC.map(function (x) { return x.id; }).indexOf(store.get('epsrc1') || 'tvmaze'));
  function tmdbGet(path) { return getJSON('https://api.themoviedb.org/3' + path + (path.indexOf('?') < 0 ? '?' : '&') + 'api_key=' + encodeURIComponent(tmdbKey)); }
  /** { imdb, eps: [{ season, number, name, airdate }] } or null. */
  function tmdbEpisodes(name, year) {
    if (!tmdbKey) return Promise.resolve(null);
    return tmdbGet('/search/tv?query=' + encodeURIComponent(name) + (year ? '&first_air_date_year=' + year : '')).then(function (r) {
      var w = normShow(name), l = (r && r.results) || [], hit = null;
      for (var i = 0; i < l.length && !hit; i++) if (normShow(l[i].name) === w || normShow(l[i].original_name || '') === w) hit = l[i];
      if (!hit) return null;
      return tmdbGet('/tv/' + hit.id + '?append_to_response=external_ids').then(function (d) {
        var ns = (d.seasons || []).filter(function (x) { return x.season_number > 0; }), eps = [];
        return ns.reduce(function (p, sn) {
          return p.then(function () { return tmdbGet('/tv/' + hit.id + '/season/' + sn.season_number).then(function (sj) {
            (sj.episodes || []).forEach(function (e) { eps.push({ season: e.season_number, number: e.episode_number, name: e.name || '', airdate: e.air_date || '' }); });
          }); });
        }, Promise.resolve()).then(function () { return { imdb: (d.external_ids && d.external_ids.imdb_id) || '', eps: eps }; });
      });
    });
  }
  function tvdbEpisodeList(name, year) {
    if (!tvdbReady()) return Promise.resolve(null);
    return tvdbShow(name, year || 0).then(function (sh) { return sh ? tvdbAllEpisodes(sh.tvdb) : null; }).then(function (l) {
      return l ? { imdb: '', eps: l.filter(function (e) { return e.seasonNumber > 0; }).map(function (e) { return { season: e.seasonNumber, number: e.number, name: e.name || '', airdate: e.aired || '' }; }) } : null;
    });
  }
  function mazeEpisodeList(name) {
    return getJSON('https://api.tvmaze.com/singlesearch/shows?q=' + encodeURIComponent(name) + '&embed=episodes').then(function (sh) {
      return { imdb: (sh.externals && sh.externals.imdb) || '', eps: ((sh._embedded && sh._embedded.episodes) || []).filter(function (e) { return e.season > 0 && e.number; }).map(function (e) { return { season: e.season, number: e.number, name: e.name || '', airdate: e.airdate || '' }; }) };
    }, function () { return null; });
  }
  function episodeList(name, year) {
    var id = EPSRC[epSrcIdx].id, first = id === 'tmdb' ? tmdbEpisodes(name, year) : id === 'tvdb' ? tvdbEpisodeList(name, year) : Promise.resolve(null);
    return first.then(function (r) { return r && r.eps.length ? r : mazeEpisodeList(name); }, function () { return mazeEpisodeList(name); });
  }
  function tmdbSetKey(key) {
    tmdbKey = key; store.set('tmdbkey', key); renderOpts();
    if (!key) { toast('TMDB key cleared', 3000); return; }
    toast('Checking the key with TMDB\u2026', 3000);
    tmdbGet('/search/tv?query=Fawlty%20Towers').then(function (r) { toast(r && r.results && r.results.length ? 'TMDB is working' : 'TMDB answered but found nothing', 4000); },
      function (e) { toast(/401|403/.test(e.message) ? 'TMDB would not accept that key' : 'Could not reach TMDB to check the key', 5000); });
  }
  function tmdbKeyOpen() { keyAsk('tmdb'); }

  // ---- Magic EPG (experimental): every episode of every show in the guides, not just the ones the scraper has a file for.
  // The missing ones become "virtual" programmes (no link) that play through the addons when the clock reaches them.
  // Episode lists are fetched slowly in the background and kept (epl1:<show>); the guides use what is kept when they are built.
  var depgOn = store.get('depg1') === 'on', veRun = false, veStat = { shows: 0, listed: 0, virtual: 0 };
  function depgActive() { return depgOn && expOn && adLive().length > 0; }
  // The complete-episodes database (data/epdb.json, built by tools/build_epdb.py from the whole library) comes first;
  // a show it does not have falls back to this device's own lookups (epl1:<show>).
  var epdb = null, epdbP = null, epdbRev = '', epdbFiles = null;
  var filmdb = null, filmdbP = null, filmdbRev = '';       // Magic EPG for films: data/filmdb.json lists every film the scrapers know, with or without a file
  // ---- Content: British hides the shows the scraper flags as never on UK TV (data/uk.json, u:0). Unknown shows stay in.
  var ukOn = store.get('uk1') === 'on', ukMap = null, ukP = null, ukRev = '';
  function loadUk() {
    if (!ukOn) return Promise.resolve();
    if (ukP) return ukP;
    return (ukP = loadDataIndex().then(null, function () { /* no index: the plain file name below */ }).then(function () {
      var c = store.get('uk1m'), kept = c && c.d;
      if (kept && (ukRev ? c.rev === ukRev : Date.now() - c.t < 86400000)) { ukMap = c.d; return; }
      // nothing published yet: every channel waits for this answer before its guide is built, and a request that finds
      // nothing used to queue behind the other downloads at every start (5 to 40 s), so a "none yet" is remembered for six hours
      if (c && c.none && !ukRev && Date.now() - c.t < 21600000) { ukMap = null; return; }
      return getJSON(DATA_BASE + 'uk.json').then(function (j) {
        var m = {};
        if (j && j.shows) Object.keys(j.shows).forEach(function (k) { if (j.shows[k] && j.shows[k].u === 0) m[k] = 1; });   // only the "no"s matter
        ukMap = m; try { store.set('uk1m', { t: Date.now(), rev: ukRev, d: m }); } catch (e) { /* fetched again next start */ }
      }, function () { ukMap = kept ? c.d : null; dlog('CONTENT: no uk.json published yet'); if (!kept) { try { store.set('uk1m', { t: Date.now(), rev: ukRev, d: null, none: 1 }); } catch (e) { /* asked again next start */ } } });
    }));
  }
  function ukHide(p) { return !!(ukOn && ukMap && ukMap[normShow(gmName(p))]); }
  /** British: drop the flagged shows; never leaves a channel with fewer than three programmes. */
  function ukFilter(progs) {
    if (!ukOn || !ukMap) return progs;
    var f = progs.filter(function (p) { return !ukHide(p); }), gone = {};
    progs.forEach(function (p) { if (ukHide(p)) gone[gmName(p)] = (gone[gmName(p)] || 0) + 1; });
    if (progs.length !== f.length) dlog('CONTENT British: hid ' + (progs.length - f.length) + ' programmes: ' + Object.keys(gone).map(function (k) { return k + ' x' + gone[k]; }).join(', '));
    return f.length >= 3 ? f : progs;
  }
  function changeMc() {
    magicOn = !magicOn; store.set('mc1', magicOn ? 'on' : 'off'); renderOpts();
    toast(magicOn ? 'Magic Channels on. Rebuilding the guides\u2026' : 'Magic Channels off. Rebuilding the guides\u2026', 3000);
    clearTimeout(spanTimer);
    spanTimer = setTimeout(function () { location.reload(); }, 2200);
  }
  function changeUk() {
    ukOn = !ukOn; store.set('uk1', ukOn ? 'on' : 'off'); renderOpts();
    toast(ukOn ? 'Content: British. Rebuilding the guides\u2026' : 'Content: Everything. Rebuilding the guides\u2026', 3000);
    clearTimeout(spanTimer);
    spanTimer = setTimeout(function () { location.reload(); }, 2200);
  }
  function loadEpdb(any) {           // any: Info's episode row wants it even when Magic EPG is off
    if (!any && !depgActive()) return Promise.resolve();
    if (epdbP) return epdbP;
    return (epdbP = loadDataIndex().then(null, function () { /* no index: the plain file name below */ }).then(function () {
      var c = store.get('epdb1'), kept = c && c.d;
      if (kept && (epdbRev ? c.rev === epdbRev : Date.now() - c.t < 86400000)) { epdb = c.d; return; }
      // the scraper publishes one file, or several (epdb-1.json ...) when it passes 10 MB; index.json lists them
      return Promise.all((epdbFiles || ['epdb.json']).map(function (n) {
        return getJSON(DATA_BASE + n).then(function (j) { return (j && j.shows) || {}; }, function () { return null; });
      })).then(function (parts) {
        var all = {}, short = false;
        parts.forEach(function (p) { if (!p) short = true; else Object.keys(p).forEach(function (k) { all[k] = p[k]; }); });
        // a part that did not arrive must not be saved as the whole of this revision: it would stay missing until the next one
        if (short) dlog('MAGIC EPG: ' + parts.filter(function (p) { return !p; }).length + ' of ' + parts.length + ' files did not arrive; not kept, asked for again next start');
        if (Object.keys(all).length) { epdb = all; if (!short) { try { store.set('epdb1', { t: Date.now(), rev: epdbRev, d: all }); } catch (e) { /* too big to keep: fetched again next start */ } } }
        else { epdb = kept ? c.d : null; dlog('MAGIC EPG: no epdb.json published yet'); }
      });
    }));
  }
  function loadFilmdb() {
    if (!depgActive()) return Promise.resolve();
    if (filmdbP) return filmdbP;
    return (filmdbP = loadDataIndex().then(null, function () { /* no index */ }).then(function () {
      var c = store.get('filmdb1'), kept = c && c.d;
      if (kept && (filmdbRev ? c.rev === filmdbRev : Date.now() - c.t < 86400000)) { filmdb = c.d; return; }
      if (c && c.none && !filmdbRev && Date.now() - c.t < 21600000) return;          // nothing published: not asked again for six hours
      return getJSON(DATA_BASE + 'filmdb.json').then(function (j) {
        var l = j && j.films;
        if (l && l.length) { filmdb = l; try { store.set('filmdb1', { t: Date.now(), rev: filmdbRev, d: l }); } catch (e) { /* fetched again next start */ } }
        else filmdb = kept || null;
      }, function () { filmdb = kept || null; dlog('MAGIC EPG: no filmdb.json published yet'); if (!kept) { try { store.set('filmdb1', { t: Date.now(), rev: filmdbRev, d: null, none: 1 }); } catch (e) { /* asked again next start */ } } });
    }));
  }
  // The Magic movie channels take the genres of the adult shelf (the same lists as tools/magic_channels.py)
  var MC_FILM_GENRES = { mc_action: ['Action', 'Adventure', 'War', 'Western'], mc_horror: ['Horror'], mc_scifi_movies: ['Science Fiction', 'Fantasy'],
                         mc_comedy_movies: ['Comedy'], mc_thriller: ['Thriller', 'Crime', 'Mystery'], mc_drama_movies: ['Drama', 'Romance', 'History', 'Music'] };
  /** Add the films the channel has no file for, from the film database. They play through the addons like the missing episodes. */
  function virtualFilms(c, progs, full) {
    if (!depgActive() || !filmdb || !OD_FILMS[c.id]) return progs;
    var have = {}, out = progs.slice(), gen = MC_FILM_GENRES[c.id], n = 0;
    var room = full ? 1e9 : Math.max(0, MAX_STORED - progs.length);       // a guide channel keeps a list this long, like the missing episodes
    progs.forEach(function (p) { if (p.filmKey) have[p.filmKey] = 1; });
    filmdb.forEach(function (f) {
      if (n >= room || !f || !f.t || !f.y) return;
      var chs = f.ch || [];
      // No certificate means no safe slot on the clock. Our own kids list is all family films, so it gets U; everything else skips it (Christmas has Die Hard and Lethal Weapon in it).
      var cert = f.cert || (chs.indexOf('kidsmovies') >= 0 ? 'U' : '');
      if (!cert) return;
      if (gen ? !(chs.indexOf('videoshop') >= 0 && String(f.g || '').split(/\s*,\s*/).some(function (x) { return gen.indexOf(x) >= 0; })) : chs.indexOf(c.id) < 0) return;
      if (adCut && f.y >= 2000) return;
      var title = f.t + ' (' + f.y + ')', key = keepFilm({ tm: f.tm, n: title, ov: f.ov, p: f.p, lg: f.lg, g: f.g, rt: f.rt, a: String(f.y), cert: cert, cast: f.cast });
      if (!key || have[key]) return;
      var id = 'virt/film/' + key;
      if (!full && isSlow(id)) return;
      have[key] = 1; n++;
      out.push({ id: id, item: 'virtual', url: '', virtual: true, afilm: true, imdb: f.im || '', filmKey: key, cert: cert, show: title, group: title,
                 title: title, sub: '', dur: (f.rt > 20 ? f.rt : 100) * 60, aired: String(f.y) });
    });
    veStat.virtual += n;
    return out;
  }
  function veGet(show) {
    var k = normShow(show), e = epdb && epdb[k];
    if (e && e.e && e.e.length) return { imdb: e.imdb || e.i || '', eps: e.e };      // rows are [season, episode, title, date, minutes]: the last ones may be missing
    var c = store.get('epl1:' + k);
    return c && c.d && Date.now() - c.t < 30 * 86400000 ? c.d : null;
  }
  /** Add the episodes the channel has no file for, from the kept episode lists. */
  function virtualFill(c, progs, full) {         // full: On Demand lists every episode, with no cap and none left out for having had no source
    if (!depgActive()) return progs;
    // a Christmas channel carries only a show's Christmas episodes: filling in the rest of the show would put its
    // ordinary episodes there (one Only Fools special brought every episode of Only Fools with it)
    if (window.ADS && ADS.isXmasChannel(c.id)) return progs;
    var by = {}, out = progs.slice();
    progs.forEach(function (p) {
      var ref = window.LINKS && LINKS.parseEp(p.title), nm = gmName(p);
      if (!ref || !nm || p.ad || p.adBlock || p.song || p.filmKey || p.addon || p.shorts) return;
      var k = normShow(nm), g = by[k] = by[k] || { name: nm, have: {}, durs: [] };
      g.have[ref.s + ':' + ref.e] = 1; if (p.dur > 600) g.durs.push(p.dur);
    });
    // A guide channel gets at most MAX_STORED missing episodes (as many as it keeps real ones), the earliest of each
    // show taken in turn: filling every gap put 20,000 programmes on 80's TV, all laid out again at every start.
    // On Demand (full) still lists every one.
    var each = [], today = new Date().toISOString().slice(0, 10);
    Object.keys(by).forEach(function (k) {
      var g = by[k], d = veGet(g.name);
      if (!d || !d.eps || !d.eps.length) return;
      var first = 9999; d.eps.forEach(function (e) { var y = +String(e[3] || '').slice(0, 4); if (y && y < first) first = y; });
      if (adCut && first >= 2000) return;                       // the addons only look up older titles, like the rest of the app
      g.durs.sort(function (a, b) { return a - b; });
      each.push({ k: k, g: g, eps: d.eps, i: 0, n: 0, dur: g.durs.length ? g.durs[g.durs.length >> 1] : 1800 });
    });
    /** The show's next missing episode, or null when it has none left (or has given its 400). */
    function nextOf(w) {
      while (w.i < w.eps.length && (full || w.n < 400)) {
        var e = w.eps[w.i++];
        if (w.g.have[e[0] + ':' + e[1]] || (e[3] && e[3] > today)) continue;
        var id = 'virt/' + w.k + '/' + e[0] + '/' + e[1];
        if (!full && isSlow(id)) continue;                      // no source last time
        w.n++;
        return { id: id, item: 'virtual', url: '', virtual: true, show: w.g.name, group: w.g.name, dur: e[4] > 5 ? e[4] * 60 : w.dur,
                 title: w.g.name + ' S' + pad2(e[0]) + 'E' + pad2(e[1]) + (e[2] ? ' ' + e[2] : ''), sub: '', aired: e[3] || '' };
      }
      return null;
    }
    var added = 0;
    if (full) each.forEach(function (w) { for (var p = nextOf(w); p; p = nextOf(w)) { out.push(p); added++; } });   // show by show, as before
    else while (each.length && added < MAX_STORED) {
      each = each.filter(function (w) {
        var p = added < MAX_STORED && nextOf(w); if (!p) return false;
        out.push(p); added++; return true;
      });
    }
    veStat.virtual += added;
    return out;
  }
  /** One show at a time, a moment apart: look up every show in the guides that has no kept episode list yet. */
  var veWaiting = false;
  function veFill() {
    if (veRun || !depgActive()) return;
    var seen = {}, todo = [];
    channels.forEach(function (c) { (c.plan || []).forEach(function (p) {
      var nm = gmName(p), ref = window.LINKS && LINKS.parseEp(p.title);
      if (!nm || !ref || p.ad || p.adBlock || p.song || p.filmKey || p.shorts) return;
      var k = normShow(nm); if (seen[k]) return; seen[k] = 1;
      var c0 = store.get('epl1:' + k);
      if (c0 && Date.now() - c0.t < (c0.d ? 30 : 3) * 86400000) return;
      todo.push(nm);
    }); });
    if (!todo.length) return;
    veRun = true; var i = 0, got = 0;
    dlog('DEBRID EPG: looking up episode lists for ' + todo.length + ' shows');
    (function next() {
      if (!depgActive() || i >= todo.length) {
        veRun = false;
        if (got) toast('Magic EPG: episode lists ready for ' + got + ' shows. They join the guides the next time the app starts.', 8000);
        return;
      }
      var nm = todo[i++];
      episodeList(nm, 0).then(function (r) {
        var ok = r && r.eps && r.eps.length;
        store.set('epl1:' + normShow(nm), { t: Date.now(), d: ok ? { imdb: r.imdb || '', eps: r.eps.map(function (e) { return [e.season, e.number, e.name, e.airdate]; }) } : null });
        if (ok) got++;
      }, function () { /* try again another day */ }).then(function () { setTimeout(next, 1500); });
    })();
  }
  function changeDepg() {
    if (!expOn) { toast('Turn Experimental on first', 3000); return; }
    depgOn = !depgOn; store.set('depg1', depgOn ? 'on' : 'off'); renderOpts();
    if (depgOn && !adLive().length) toast('Magic EPG is on. Now add an addon (Options > Experimental).', 5000);
    else toast(depgOn ? 'Magic EPG on: building episode lists, then rebuilding the guides\u2026' : 'Magic EPG off: rebuilding the guides\u2026', 3000);
    clearTimeout(spanTimer);
    spanTimer = setTimeout(function () { location.reload(); }, 2200);
  }

  // ---- Real world (experimental): a show's episodes air in order, and each day carries on where the last one stopped.
  // The schedule already says WHEN each of a show's slots is; this decides WHICH episode goes in each: S01E01, S01E02 ...
  // and the next day (the next time the schedule's cycle comes round) the next ones, like a real channel. The days follow the
  // TV's own clock, which is UK time on a UK TV. Programmes with no episode number (specials, one-offs, music, films) are left alone.
  var rwOn = store.get('rw1') === 'on';
  /** Which time through its cycle the schedule is on at tMs: a new number each day (or week) at midnight. */
  function rwCycle(sched, tMs) {
    var d = new Date(tMs), di = Math.floor((tMs / 60000 - d.getTimezoneOffset()) / 1440);    // whole local days since 1 Jan 1970
    if (sched.cycle === 'multi') return sched.unit === 604800 ? Math.floor(Math.floor((di + 4) / 7) / sched.n) : Math.floor(di / sched.n);
    if (sched.cycle === 'week') return Math.floor((di + 4) / 7);
    if (sched.cycle) return di;
    return Math.floor(tMs / 1000 / (sched.total || 86400));
  }
  function rwApply(sched, C) {
    var r = sched._rw; r.C = C;
    Object.keys(r.slots).forEach(function (k) {
      var eps = r.by[k].eps, pos = r.slots[k], n = eps.length;
      pos.forEach(function (at, j) {
        var src = eps[(r.st[k] + C * pos.length + j) % n].p;
        sched.order[at] = Object.assign({}, src, { dur: r.base[at].dur });      // the slot keeps its length, so the guide's times do not move
      });
    });
  }
  function realWorld(sched, progs, seed) {
    if (!rwOn || !sched || !sched.order || !window.LINKS) return;
    var by = {};
    progs.forEach(function (p) {
      if (p.ad || p.adBlock || p.song || p.filmKey || p.shorts) return;
      var ref = LINKS.parseEp(p.title); if (!ref || !(ref.s > 0)) return;
      var k = normShow(gmName(p)), g = by[k] = by[k] || { eps: [], seen: {} }, id = ref.s + ':' + ref.e;
      if (!g.seen[id]) { g.seen[id] = 1; g.eps.push({ p: p, s: +ref.s, e: +ref.e }); }
    });
    var slots = {}, st = {};
    sched.order.forEach(function (p, i) {
      if (p.ad || p.adBlock || p.song || p.filmKey || p.shorts) return;
      var ref = LINKS.parseEp(p.title); if (!ref || !(ref.s > 0)) return;
      var k = normShow(gmName(p)); if (by[k] && by[k].eps.length > 1) (slots[k] = slots[k] || []).push(i);
    });
    Object.keys(slots).forEach(function (k) {
      by[k].eps.sort(function (a, b) { return (a.s - b.s) || (a.e - b.e); });
      var firsts = []; by[k].eps.forEach(function (x, i) { if (x.e === 1) firsts.push(i); });      // begin at the start of a season, somewhere in the show
      var pool = firsts.length ? firsts : by[k].eps.map(function (x, i) { return i; });
      st[k] = pool[E.hash(k + '|' + seed) % pool.length];
    });
    sched._rw = { by: by, slots: slots, st: st, base: sched.order.slice(), C: 0 };
    rwApply(sched, rwCycle(sched, Date.now()));
  }
  /** At midnight every channel moves on to the next episodes. */
  setInterval(function () {
    if (!rwOn) return;
    var now = Date.now(), moved = false;
    channels.forEach(function (c) {
      var r = c.sched && c.sched._rw;
      if (r) { var C = rwCycle(c.sched, now); if (C !== r.C) { rwApply(c.sched, C); moved = true; } }
    });
    if (moved && guideOpen) renderGuide();
  }, 60000);
  function changeRw() {
    rwOn = !rwOn; store.set('rw1', rwOn ? 'on' : 'off'); renderOpts();
    toast(rwOn ? 'Live TV mode on: a new episode each day. Rebuilding the guides\u2026' : 'Live TV mode off: rebuilding the guides\u2026', 3000);
    clearTimeout(spanTimer);
    spanTimer = setTimeout(function () { location.reload(); }, 2200);
  }
  function tvdbAllEpisodes(id) {
    var out = [];
    function page(n) {
      return tvdbQueue(function () { return tvdbGet('/series/' + id + '/episodes/default?page=' + n); }).then(function (j) {
        var eps = (j && j.data && j.data.episodes) || [];
        out = out.concat(eps);
        return eps.length && j.links && j.links.next && n < 8 ? page(n + 1) : out;
      });
    }
    return page(0);
  }
  /** Poster and backdrop for one show; 'skip' when it has both already. */
  function scanArtOne(name) {
    var nk = normShow(name), k = knownArt({ title: name, show: name });
    if (k && k.poster && k.back) return Promise.resolve('skip');
    if (!tvdbReady()) return artScanOne(name);
    var c = store.get('tvdb1:' + nk); if (c && !c.d) { try { kv.removeItem('tvdb1:' + nk); } catch (e) { /* none */ } }     // a miss is tried again when asked
    return tvdbShow(name, 0, true).then(function (d) {
      if (!d) return artScanOne(name);                                   // TheTVDB has nothing: TVmaze
      var key = 'info3:' + nk + ':0:0', old = store.get(key), os = old && old.d && old.d.show || {};
      var show = Object.assign({}, d, { poster: os.poster || d.poster, background: os.background || d.background });
      store.set(key, { t: Date.now(), x: 0, d: { show: show, ep: null } });
      return show.poster || show.background ? 'found' : 'miss';
    }, function () { return artScanOne(name); });
  }
  /** The episode guide with its pictures for one show, when it has none; 'skip' when the scraper or an earlier look has them. */
  function scanEpsOne(name) {
    var slug = odSlug(name), key = 'eps1:' + slug, c = store.get(key);
    if (epsMap && epsMap[slug]) return Promise.resolve('skip');           // the scraper publishes this show's guide
    if (c && c.m && c.m.eps && c.m.eps.some(function (e) { return e.img; })) return Promise.resolve('skip');
    function save(eps) {
      if (!eps.length) return 'none';
      store.set(key, { t: Date.now(), x: Date.now() + 14 * 24 * 3600 * 1000, rev: '', m: { eps: eps } });
      return eps.some(function (e) { return e.img; }) ? 'found' : 'none';
    }
    function maze() {
      return artShow(name).then(function (a) {
        var id = a && a.i;
        if (!id) { var o = store.get('info3:' + normShow(name) + ':0:0'); id = o && o.d && o.d.show && o.d.show.id; }
        if (!id) return 'none';
        return wait(600).then(function () { return getJSON('https://api.tvmaze.com/shows/' + id + '/episodes'); }).then(function (list) {
          return save(scanEpsMap(Array.isArray(list) ? list : []));
        });
      });
    }
    if (tvdbReady()) {
      return tvdbShow(name, 0).then(function (sh) { return sh ? tvdbAllEpisodes(sh.tvdb) : null; }).then(function (list) {
        var r = list ? save(scanEpsMap(list)) : 'none';
        return r === 'found' ? r : maze().then(function (m) { return m === 'found' ? m : r; });
      }, function () { return maze(); });
    }
    return maze();
  }
  /** A film's backdrop from TheTVDB; 'skip' when it has one. Kept with the looked-up artwork, not as a hand pick. */
  function scanFilmOne(prog) {
    var k = knownArt(prog);
    if (k && k.back) return Promise.resolve('skip');
    var name = filmArtName(prog), nk = normShow(name);
    return tvdbFilm(name, filmYear(prog)).then(function (d) {
      if (!d || !d.background) return 'miss';
      store.set('info3:' + nk + ':0:0', { t: Date.now(), x: 0, d: { show: { name: d.name, year: String(d.year || ''), poster: '', background: d.background, id: 0, tvdb: d.tvdb }, ep: null } });
      return 'found';
    }, function () { return 'fail'; });
  }
  function scanFilms() {
    var seen = {}, out = [];
    if (!tvdbReady()) return out;
    channels.forEach(function (c) { (c.plan || []).forEach(function (p) {
      if (!p.filmKey || p.ad || seen[p.filmKey] || blocked(p)) return;
      seen[p.filmKey] = 1;
      var k = knownArt(p); if (!k || !k.back) out.push(p);
    }); });
    return out;
  }
  function scanStart() {
    if (scanUi.running) {                                                 // OK again while it runs: cancel
      scanUi.cancel = true; scanUi.result = 'Stopping…'; scanRender(); return;
    }
    if (artScan.running) { toast('A quiet scan is already running. Try again in a few minutes.', 4000); return; }
    scanUi = { running: true, cancel: false, i: 0, n: 0, name: 'Working out what is missing…', art: 0, eps: 0, miss: 0, fail: 0, result: '' };
    scanRender();
    var fails = 0;
    Promise.all([artNames(), loadDataIndex()]).then(function (r) {
      var queue = r[0].filter(function (n) {
        var k = knownArt({ title: n, show: n }), slug = odSlug(n), c = store.get('eps1:' + slug);
        var needArt = !k || !k.poster || !k.back;
        var needEps = !(epsMap && epsMap[slug]) && !(c && c.m && c.m.eps && c.m.eps.some(function (e) { return e.img; }));
        return needArt || needEps;
      });
      var films = scanFilms();
      queue = queue.concat(films);
      scanUi.n = queue.length;
      dlog('SCAN ARTWORK start: ' + queue.length + ' of ' + r[0].length + ' shows need something, ' + films.length + ' films need a backdrop' + (tvdbReady() ? ' (TheTVDB first)' : ' (TVmaze)'));
      function finish(stopped) {
        var res = (stopped ? 'Stopped' : 'Done') + ': ' + scanUi.art + ' artwork, ' + scanUi.eps + ' episode guides' + (scanUi.miss ? ', ' + scanUi.miss + ' not found' : '') + (scanUi.fail ? ', ' + scanUi.fail + ' failed' : '');
        scanUi.running = false; scanUi.result = res; dlog('SCAN ARTWORK ' + res);
        odKGen++; scanRender();
        toast(res, 6000);
      }
      (function step() {
        if (scanUi.cancel) { finish(true); return; }
        if (!queue.length) { finish(false); return; }
        var name = queue.shift();
        if (typeof name !== 'string') {                                   // a film: its backdrop only
          scanUi.name = filmQuery(filmArtName(name)); scanUi.i++; scanRender();
          scanFilmOne(name).then(function (a) {
            if (a === 'found') scanUi.art++; else if (a === 'miss') scanUi.miss++; else if (a === 'fail') scanUi.fail++;
            if (a === 'fail') { if (++fails >= 6) { scanUi.cancel = true; dlog('SCAN ARTWORK: too many failures, stopping'); } } else fails = 0;
            setTimeout(step, 300);
          });
          return;
        }
        scanUi.name = name; scanUi.i++; scanRender();
        scanArtOne(name).then(function (a) {
          if (a === 'found') scanUi.art++; else if (a === 'miss') scanUi.miss++; else if (a === 'fail') scanUi.fail++;
          return scanEpsOne(name).then(function (e) { if (e === 'found') scanUi.eps++; return [a, e]; });
        }).then(function (res) {
          if (res[0] === 'fail') { if (++fails >= 6) { scanUi.cancel = true; dlog('SCAN ARTWORK: too many failures, stopping'); } } else fails = 0;
          setTimeout(step, 400);
        }, function () { scanUi.fail++; setTimeout(step, 400); });
      })();
    }, function () { scanUi.running = false; scanUi.result = 'Could not read the library'; scanRender(); });
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

  // ---- Info: the details, then rows the remote moves through: buttons, cast, and below them the episodes and
  // "more like this". OK presses what is highlighted, Back goes back one step (an actor's list > Info > closed).
  var info = null;          // { cp, live, film, rows: {id: {items, ...}}, order: [ids], r: row id, at: {id: index}, actor }
  var infoStack = [];       // what Back returns to: { over } or { actor }
  function openInfo(over, keep) {
    var cp = over || cur;          // a programme picked in the guide, or what is playing
    if (!cp) return;
    if (!keep) infoStack = [];
    if (!over) reportProgramme('Info opened');
    infoOpen = true;
    var token = ++infoToken;
    var title = cp.prog.title || '';
    $('info').className = '';
    $('iactor').className = 'hidden';
    $('ipanel').className = '';
    $('ibg').style.backgroundImage = 'none';
    $('iposter').className = 'hidden';
    $('ishow').textContent = title;
    $('iep').textContent = '';
    $('imeta').textContent = cp.ch.name;
    $('isum').textContent = '';
    $('inext').textContent = '';
    $('icast').textContent = '';
    $('ilow').textContent = '';
    $('isrc').textContent = 'Looking up details…';
    var film = filmFor(cp.prog);
    info = { cp: cp, live: !over, film: !!film, rows: {}, order: [], r: 'btns', at: {}, token: token, actor: null };
    if (cp.ad) {
      $('isum').textContent = 'An advert between programmes: ' + decodeURIComponent(String(cp.prog.url || '').replace('https://archive.org/download/', ''));
      infoFoot(''); infoSetRow('btns', infoButtons(cp, false)); return;
    }
    infoSetRow('btns', infoButtons(cp, !!film));
    infoNextOn(cp);
    infoMore(cp, !!film);
    if (film) { showFilmInfo(film, cp); return; }                 // a film: TMDb already told us everything
    infoEpisodes(cp);
    var p = parseTitle(title);
    if (cp.prog && cp.prog.show) p.show = cp.prog.show;
    if (!p.show) { infoFoot(''); return; }
    tvmInfo(p).then(function (d) {
      if (token !== infoToken || !infoOpen) return;
      if (!d) {
        $('isum').textContent = 'No online details found for this one.';
        infoFoot('');
        return;
      }
      var s = d.show, e = d.ep;
      $('ishow').textContent = s.name;
      var bits = [];
      if (s.year) bits.push(s.year + (s.ended && s.ended !== s.year ? '–' + s.ended : ''));
      if (s.network) bits.push(s.network);
      if (s.genres) bits.push(s.genres);
      if (s.rating) bits.push('★ ' + s.rating);
      bits.push(cp.ch.name);
      $('imeta').textContent = bits.join('   ·   ');
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
      infoFoot(s.tvdb ? 'TheTVDB' : 'TVmaze');
      var keepCast = function (list) { castLearn(gmName(cp.prog) || s.name, cp.ch, list); showCast(list); };
      if (s.cast && s.cast.length) keepCast(s.cast);
      else if (s.id) tvmCast(s.id).then(function (list) { if (token === infoToken && infoOpen) keepCast(list); });
    }, function () {
      if (token !== infoToken || !infoOpen) return;
      $('isum').textContent = 'Could not look this up right now.';
      infoFoot('');
    });
  }
  function infoFoot(from) {
    $('isrc').textContent = (from ? 'Details from ' + from + '   ·   ' : '') + 'OK select   ·   Back ' + (infoStack.length ? 'go back' : 'close');
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
  /** A row of round photos on the Info screen. A film's cast comes with the scraper's film details. OK on one lists
   *  what else they are in; the small gold number says how many. */
  function showCast(list) {
    if (!info) return;
    var cp = info.cp, items = [];
    (list || []).slice(0, 8).forEach(function (m) {
      if (!m || !m.n) return;
      items.push({ m: m, f: function () {
        if (actIdx && !actorCount(m.n)) { toast('Nothing else with ' + m.n + ' on this TV yet', 3000); return; }
        infoActor(m.n);
      } });
    });
    infoSetRow('cast', items);
    actorIndex().then(function () { if (info && info.cp === cp) infoDraw(); });      // the gold numbers, once the films are in
  }

  /** A film's Info screen, straight from the details the scraper gathered: no lookup, so it is up at once. */
  function showFilmInfo(f, cp) {
    $('ishow').textContent = String(f.title || cp.prog.title || '').replace(/\s*\((19|20)\d\d\)\s*$/, '');    // the year is on the line below
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
    infoFoot('TMDB');
    showCast(f.cast);
  }

  // ---- the rows
  /** Watch now (or Keep watching), the next episode, and Hide. */
  function infoButtons(cp, film) {
    var p = cp.prog, b = [], live = !!(info && info.live), ref = window.LINKS && LINKS.parseEp(p.title || '');
    if (live) b.push({ t: 'Keep watching', play: 1, f: function () { closeInfo(); } });
    else b.push({ t: 'Watch now', play: 1, f: function () { infoPlay(cp.ch, p, 0); } });
    if (ref && !p.ad) b.push({ t: 'Next episode', f: function () { infoPlay(cp.ch, p, 1); } });
    if (!p.ad && !live) b.push({ t: film ? 'Hide this film' : 'Hide this show', f: function () {
      var name = film ? p.title : gmName(p);
      closeInfo(); hideShow(name, film);
    } });
    return b;
  }
  /** Play this programme (d 0) or the one after it (d 1) as On Demand does, carrying on through the show. */
  function infoPlay(c, p, d) {
    if (!c || !p) return;
    gmFind(c, p, function (g, i) {
      if (d && (!g || i < 0 || i + d >= g.flat.length)) { toast('No next episode of ' + gmName(p) + ' is stored', 3500); return; }
      closeInfo();
      if (gm) gmClose();
      if (odOpen) odClose(false);
      if (guideOpen) closeGuide();
      if (g && i >= 0) odStart(c, g.flat, i + d, 0, g.name);
      else odStart(c, [{ p: p }], 0);
    });
  }
  /** Where this show or film is on next in the guides (today and tomorrow), under the summary. */
  function infoNextOn(cp) {
    var p = cp.prog, key = p.filmKey ? 'f' + p.filmKey : 's' + normShow(gmName(p)), now = Date.now(), best = null;
    if (!p || p.ad || key.length < 2) return;
    guideList().forEach(function (c) {
      if (c.status !== 'ready' || !c.sched) return;
      var bl = [];
      try { bl = E.blocks(c.sched, now, now + 2 * 86400000); } catch (e) { return; }
      bl.forEach(function (b) {
        var q = b.prog;
        if (!q || q === p || b.endMs <= now || q.ad) return;
        if ((q.filmKey ? 'f' + q.filmKey : 's' + normShow(gmName(q))) !== key) return;
        if (!best || b.startMs < best.b.startMs) best = { b: b, c: c };
      });
    });
    if (!best) return;
    var t = best.b.startMs, day = new Date(t).toDateString() === new Date(now).toDateString() ? '' : ['Sun ', 'Mon ', 'Tue ', 'Wed ', 'Thu ', 'Fri ', 'Sat '][new Date(t).getDay()];
    $('inext').textContent = t <= now ? 'On now on ' + best.c.name : 'Next on ' + best.c.name + ': ' + day + fmtTime(t);
  }
  /** A series: its episodes, from On Demand (with Magic EPG, every one the scrapers know), and the episode guide
   *  (data/epdb.json) for the ones there is no file for, shown as not in the library. */
  function infoEpisodes(cp) {
    var c = cp.ch, p = cp.prog, cpNow = cp;
    if (!c || p.filmKey || p.ad) return;
    Promise.all([loadEpdb(true).then(null, function () {}), new Promise(function (res) { gmFind(c, p, function (g, i) { res({ g: g, i: i }); }); })]).then(function (r) {
      if (!info || info.cp !== cpNow) return;
      var g = r[1].g, at = r[1].i;
      var list = [], have = {};
      if (g) g.flat.forEach(function (ep, n) {
        if (ep.s > 0) have[ep.s + ':' + ep.e] = 1;
        list.push({ s: ep.s, e: ep.e, t: String(ep.label || '').replace(/^E\d+\s*/, ''), miss: !!ep.p.virtual, n: n, here: n === at, thumb: ep.thumb || '' });
      });
      var d = veGet(gmName(p));
      if (d && d.eps) d.eps.forEach(function (row) {
        if (!row[0] || have[row[0] + ':' + row[1]]) return;
        list.push({ s: row[0], e: row[1], t: row[2] || '', miss: true, n: -1, gone: true });
      });
      list = list.filter(function (x) { return x.s > 0; });
      if (list.length < 2) return;
      list.sort(function (a, b) { return (a.s - b.s) || (a.e - b.e); });
      var items = list.map(function (x) {
        x.f = x.gone ? function () { toast('Series ' + x.s + ' episode ' + x.e + ' is not in the library yet', 3000); }
                     : function () { infoPlayAt(c, g, x.n); };
        return x;
      });
      var here = 0; items.forEach(function (x, n) { if (x.here) here = n; });
      info.at.eps = here;
      infoSetRow('eps', items);
      // The scraper's stills (data/eps/<show>.json, else TVmaze) are the real picture of each episode; they come in a moment
      // after the strip, and replace the archive.org thumbnail or the flat colour. Episodes with no file get one too.
      if (g) odMeta(g).then(function () {
        if (!info || info.cp !== cpNow || !g.meta) return;
        var got = 0;
        items.forEach(function (x) { var m = g.meta[x.s + 'x' + x.e]; if (m && m.img && x.thumb !== m.img) { x.thumb = m.img; got++; } });
        if (got) infoSetRow('eps', items);
      }, function () { /* the strip keeps its colours */ });
    });
  }
  function infoPlayAt(c, g, n) {
    closeInfo();
    if (gm) gmClose();
    if (odOpen) odClose(false);
    if (guideOpen) closeGuide();
    odStart(c, g.flat, n, 0, g.name);
  }
  /** More like this: for a film, the other films that share a genre (the same decade first); for a series, the other
   *  shows on its channel. OK opens its Info. */
  function infoMore(cp, film) {
    var c = cp.ch, p = cp.prog, cpNow = cp;
    if (!c || p.ad || !c.id || c.id.charAt(0) === '_') return;
    var chans = film ? odChannels().filter(function (x) { return OD_FILMS[x.id]; }) : [c];
    if (!chans.length) chans = [c];
    Promise.all(chans.map(odLoadChannel)).then(function () {
      if (!info || info.cp !== cpNow) return;
      var me = infoKeyFor(p), out = [], seen = {};
      var f0 = film ? filmFor(p) : null, gs = f0 ? String(f0.genres || '').split(/\s*,\s*/).filter(Boolean) : [];
      var yr = f0 ? +String(f0.released || '').slice(0, 4) : 0;
      chans.forEach(function (ch) {
        (odShowsOf(ch) || []).forEach(function (g) {
          var k = infoKeyG(g), e0 = g.flat && g.flat[0];
          if (!e0 || k === me || seen[k]) return;
          seen[k] = 1;
          var sc = 0;
          if (film) {
            var f = filmFor(e0.p); if (!f) return;
            var share = String(f.genres || '').split(/\s*,\s*/).filter(function (x) { return gs.indexOf(x) >= 0; }).length;
            if (!share) return;
            var y = +String(f.released || '').slice(0, 4);
            sc = share * 10 + (yr && y && Math.floor(y / 10) === Math.floor(yr / 10) ? 25 : 0) - (yr && y ? Math.min(20, Math.abs(y - yr)) / 4 : 5);
          } else {
            var h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) % 997;    // a steady mix, not always A to Z
            sc = h;
          }
          out.push({ g: g, sc: sc });
        });
      });
      out.sort(function (a, b) { return b.sc - a.sc; });
      var items = out.slice(0, 12).map(function (x) {
        var g = x.g;
        return { g: g, f: function () { var e0 = g.flat[0]; infoStack.push(infoHere()); openInfo({ prog: e0.p, ch: g.chan || c }, true); } };
      });
      if (!items.length) return;
      info.moreTitle = film ? 'More like this' : 'More on ' + c.name;
      infoSetRow('more', items);
    });
  }
  /** Where Back should come back to. */
  /** One key per title, so a film filed under two file names, or on two channels, counts once. */
  function infoKeyFor(p) {
    var f = p && p.filmKey ? filmFor(p) : null;
    return f ? 'f' + (f.tmdb || LIBROUTE.norm(f.title || p.title || '')) : 's' + LIBROUTE.norm(gmName(p));
  }
  function infoKeyG(g) { var e0 = g && g.flat && g.flat[0]; return e0 ? infoKeyFor(e0.p) : 's' + LIBROUTE.norm(g ? g.name : ''); }
  /** A title as people know it: a film's own name rather than its file's, without the year in brackets. */
  function infoNameG(g) {
    var e0 = g && g.flat && g.flat[0], f = e0 && e0.p.filmKey ? filmFor(e0.p) : null;
    return String((f && f.title) || (g && g.name) || '').replace(/\s*\((19|20)\d\d\)\s*$/, '');
  }
  function infoMe() { return info ? infoKeyFor(info.cp.prog) : ''; }
  function infoHere() { return { over: info && !info.live ? info.cp : null, actor: info && info.actor || null }; }

  // ---- actors: who is in what, across the film channels and the series whose cast has been seen on Info
  var actIdx = null, actP = null;
  function actorIndex() {
    if (actP) return actP;
    var fc = odChannels().filter(function (x) { return OD_FILMS[x.id]; });
    actP = Promise.all(fc.map(odLoadChannel)).then(function () {
      var m = {}, seen = {};
      fc.forEach(function (ch) {
        (odShowsOf(ch) || []).forEach(function (g) {
          var e0 = g.flat && g.flat[0], f = e0 && filmFor(e0.p), k = infoKeyG(g);
          if (!f || !f.cast || seen[k]) return;
          seen[k] = 1;
          f.cast.forEach(function (x) { if (x && x.n) (m[x.n] = m[x.n] || []).push({ g: g, role: x.c || '', ch: ch, f: f, k: k }); });
        });
      });
      actIdx = m;
      return m;
    }, function () { actIdx = {}; return actIdx; });
    return actP;
  }
  /** A series' cast, kept when its Info shows it, so the actor lists can include it. */
  function castLearn(name, ch, list) {
    if (!name || !ch || !ch.id || ch.id.charAt(0) === '_' || !list || !list.length) return;
    var m = store.get('castidx1') || {}, k = LIBROUTE.norm(name);
    m[k] = { n: name, ch: ch.id, c: list.slice(0, 10).map(function (x) { return [x.n || '', x.c || '']; }) };
    try { store.set('castidx1', m); } catch (e) { /* not kept: the films still work */ }
  }
  /** Everything an actor is in that this TV can play: films first, then series. */
  function actorTitles(name) {
    var out = (actIdx && actIdx[name] || []).map(function (x) { return { g: x.g, ch: x.ch, role: x.role, film: x.f, k: x.k }; });
    var m = store.get('castidx1') || {};
    Object.keys(m).forEach(function (k) {
      var s = m[k];
      (s.c || []).forEach(function (x) {
        if (x[0] !== name) return;
        var ch = channels.filter(function (c) { return c.id === s.ch; })[0];
        if (ch) out.push({ show: s.n, ch: ch, role: x[1] || '', k: 's' + k });
      });
    });
    return out;
  }
  function actorCount(name) {
    var me = infoMe();
    return actorTitles(name).filter(function (x) { return x.k !== me; }).length;
  }
  function infoActor(name, keep) {
    if (!info) return;
    if (!keep) infoStack.push(infoHere());
    var cpNow = info.cp;
    actorIndex().then(function () {
      if (!info || info.cp !== cpNow) return;
      var list = actorTitles(name);
      info.actor = name;
      info.al = list;
      info.ai = 0;
      var me = infoMe(), first = -1;
      list.forEach(function (x, n) { if (first < 0 && x.k !== me) first = n; });
      info.ai = Math.max(0, first);
      $('ipanel').className = 'hidden';
      $('ilow').textContent = '';
      $('iactor').className = '';
      $('ianame').textContent = name;
      var fl = list.filter(function (x) { return x.g; }).length, sl = list.length - fl;
      var chs = {}; list.forEach(function (x) { chs[x.ch.name] = 1; });
      $('iasub').textContent = (list.length ? (fl ? fl + (fl === 1 ? ' film' : ' films') : '') + (fl && sl ? ' and ' : '') + (sl ? sl + (sl === 1 ? ' series' : ' series') : '') +
        ' you can watch   ·   ' + Object.keys(chs).join(', ') : 'Nothing else with them yet');
      var ph = $('iaph'), pic = '';
      ((info.rows.cast && info.rows.cast.items) || []).forEach(function (it) { if (it.m.n === name && it.m.p) pic = it.m.p; });
      ph.style.backgroundImage = pic ? 'url("' + pic + '")' : 'none';
      ph.textContent = pic ? '' : name.charAt(0);
      $('isrc').textContent = 'OK open   ·   Back go back';
      infoActorDraw();
    });
  }
  function infoActorDraw() {
    var box = $('iagrid'), list = info.al || [], me = infoMe();
    box.textContent = '';
    var top = Math.max(0, Math.floor(info.ai / 3) - 1) * 3;           // two rows of three at a time
    list.slice(top, top + 6).forEach(function (x, n) {
      var i = top + n, card = document.createElement('div');
      card.className = 'iac' + (i === info.ai ? ' ifoc' : '');
      var pic = document.createElement('div'); pic.className = 'iacp';
      var k = x.g ? odKnown(x.g) : knownArt({ title: x.show, show: x.show });
      var url = x.film && x.film.poster || (k && k.poster) || '';
      if (url) pic.style.backgroundImage = 'url("' + url + '")'; else pic.style.background = odTone(x.g ? infoNameG(x.g) : x.show);
      var tx = document.createElement('div'); tx.className = 'iact';
      var b = document.createElement('b'); b.textContent = x.g ? infoNameG(x.g) : x.show;
      var yr = x.film && x.film.released ? String(x.film.released).slice(0, 4) + '   ·   ' : '';
      var s1 = document.createElement('span'); s1.textContent = yr + x.ch.name;
      tx.appendChild(b); tx.appendChild(s1);
      if (x.role) { var s2 = document.createElement('small'); s2.textContent = x.role; tx.appendChild(s2); }
      if (x.k === me) { var y = document.createElement('i'); y.textContent = 'YOU CAME FROM HERE'; tx.appendChild(y); }
      card.appendChild(pic); card.appendChild(tx);
      card.addEventListener('click', function () { info.ai = i; infoActorOpen(); });
      box.appendChild(card);
    });
    if (list.length > top + 6) { var more = document.createElement('div'); more.className = 'iamore'; more.textContent = '▼ ' + (list.length - top - 6) + ' more'; box.appendChild(more); }
  }
  function infoActorOpen() {
    var x = info.al && info.al[info.ai];
    if (!x) return;
    if (x.k === infoMe()) { infoBack(); return; }           // the title Info came from: just go back to it
    var go = function (g, ch) {
      var e0 = g && g.flat && g.flat[0];
      if (!e0) { toast('Could not find ' + (x.show || '') + ' on ' + ch.name + ' any more', 3000); return; }
      infoStack.push(infoHere());
      openInfo({ prog: e0.p, ch: g.chan || ch }, true);
    };
    if (x.g) { go(x.g, x.ch); return; }
    odLoadChannel(x.ch).then(function () {
      var k = LIBROUTE.norm(x.show);
      go((odShowsOf(x.ch) || []).filter(function (g) { return LIBROUTE.norm(g.name) === k; })[0], x.ch);
    });
  }

  // ---- drawing and keys
  var INFO_ORDER = ['btns', 'cast', 'eps', 'more'];
  function infoSetRow(id, items) {
    if (!info) return;
    if (items && items.length) info.rows[id] = { items: items }; else delete info.rows[id];
    info.order = INFO_ORDER.filter(function (x) { return info.rows[x]; });
    if (!info.rows[info.r]) info.r = info.order[0] || 'btns';
    if (!info.actor) infoDraw();
  }
  function infoAt(id) {
    var r = info.rows[id], n = r ? r.items.length : 0;
    var i = Math.max(0, Math.min(info.at[id] || 0, n - 1));
    info.at[id] = i;
    return i;
  }
  function infoDraw() {
    if (!info || info.actor) return;
    var foc = info.r;
    // buttons
    var bb = $('ibtns'); bb.textContent = '';
    ((info.rows.btns && info.rows.btns.items) || []).forEach(function (b, i) {
      var el = document.createElement('button');
      el.className = 'ib' + (b.play ? ' play' : '') + (foc === 'btns' && i === infoAt('btns') ? ' ifoc' : '');
      el.textContent = b.t;
      el.addEventListener('click', function () { info.r = 'btns'; info.at.btns = i; b.f(); });
      bb.appendChild(el);
    });
    // cast
    var cb = $('icast'); cb.textContent = '';
    var cast = info.rows.cast;
    $('icasth').textContent = cast ? 'Cast   ·   OK on a name for what else they are in' : '';
    if (cast) {
      var ci = infoAt('cast'), c0 = Math.max(0, Math.min(ci - 2, cast.items.length - 6));
      cast.items.slice(c0, c0 + 6).forEach(function (it, n) {
        var m = it.m, i = c0 + n;
        var card = document.createElement('div'); card.className = 'icm' + (foc === 'cast' && i === ci ? ' ifoc' : '');
        var ph = document.createElement('div'); ph.className = 'icp';
        if (m.p) ph.style.backgroundImage = 'url("' + m.p + '")'; else ph.textContent = m.n.charAt(0);
        var cnt = actIdx ? actorCount(m.n) : 0;
        if (cnt) { var bd = document.createElement('span'); bd.className = 'icn'; bd.textContent = '+' + cnt; ph.appendChild(bd); }
        var nm = document.createElement('b'); nm.textContent = m.n;
        card.appendChild(ph); card.appendChild(nm);
        if (m.c) { var ch = document.createElement('small'); ch.textContent = m.c.replace(/\s*\(voice\)\s*$/i, ''); card.appendChild(ch); }
        card.addEventListener('click', function () { info.r = 'cast'; info.at.cast = i; it.f(); });
        cb.appendChild(card);
      });
    }
    // the low row: the one with the highlight, else the first there is
    var low = (foc === 'eps' || foc === 'more') ? foc : (info.rows.eps ? 'eps' : info.rows.more ? 'more' : '');
    var lb = $('ilow'); lb.textContent = '';
    $('ipanel').className = low ? 'withlow' : '';
    if (!low) return;
    var r = info.rows[low], li = infoAt(low), N = 6, s0 = Math.max(0, Math.min(li - 1, r.items.length - N));
    var head = document.createElement('div'); head.className = 'ilh';
    if (low === 'eps') {
      var cur0 = r.items[li], seas = [], tot = 0, got = 0;
      r.items.forEach(function (x) { if (seas.indexOf(x.s) < 0) seas.push(x.s); if (x.s === cur0.s) { tot++; if (!x.gone) got++; } });
      var h = document.createElement('span'); h.textContent = 'Episodes'; head.appendChild(h);
      seas.slice(0, 14).forEach(function (sn) { var b = document.createElement('i'); b.textContent = sn === cur0.s ? 'Series ' + sn : String(sn); if (sn === cur0.s) b.className = 'on'; head.appendChild(b); });
      var cnt = document.createElement('em'); cnt.textContent = 'Series ' + cur0.s + ': ' + got + ' of ' + tot + ' in your library'; head.appendChild(cnt);
    } else {
      var h2 = document.createElement('span'); h2.textContent = info.moreTitle || 'More like this'; head.appendChild(h2);
    }
    lb.appendChild(head);
    var row = document.createElement('div'); row.className = 'ilr';
    r.items.slice(s0, s0 + N).forEach(function (x, n) {
      var i = s0 + n, card = document.createElement('div');
      card.className = 'ilc' + (foc === low && i === li ? ' ifoc' : '') + (x.gone ? ' gone' : '');
      var pic = document.createElement('div'); pic.className = 'ilp';
      var cap = document.createElement('div'); cap.className = 'ilt';
      if (low === 'eps') {
        if (x.thumb) pic.style.backgroundImage = 'url("' + x.thumb + '")';
        else if (!x.gone) pic.style.background = odTone('S' + x.s + (info.cp && gmName(info.cp.prog)));
        var tag = document.createElement('b'); tag.textContent = 'S' + x.s + ' E' + x.e; pic.appendChild(tag);
        if (x.here) { var hh = document.createElement('i'); hh.textContent = 'THIS ONE'; pic.appendChild(hh); }
        if (x.gone) { var gg = document.createElement('em'); gg.textContent = 'Not in library'; pic.appendChild(gg); }
        else if (x.miss) { var vv = document.createElement('em'); vv.textContent = 'From your addons'; pic.appendChild(vv); }
        cap.textContent = x.t || ('Episode ' + x.e);
      } else {
        var k = odKnown(x.g), f = x.g.film && filmFor(x.g.flat[0].p);
        var url = (k && (k.back || k.poster)) || (f && f.poster) || '';
        if (url) pic.style.backgroundImage = 'url("' + url + '")'; else pic.style.background = odTone(x.g.name);
        cap.textContent = infoNameG(x.g);
      }
      card.appendChild(pic); card.appendChild(cap);
      card.addEventListener('click', function () { info.r = low; info.at[low] = i; x.f(); });
      row.appendChild(card);
    });
    lb.appendChild(row);
  }
  function infoKey(k) {
    if (k === 'Info') { closeInfo(); return; }
    if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { infoBack(); return; }
    if (!info) { closeInfo(); return; }
    if (info.actor) {
      var n = (info.al || []).length;
      if (k === 'ArrowLeft') info.ai = Math.max(0, info.ai - 1);
      else if (k === 'ArrowRight') info.ai = Math.min(n - 1, info.ai + 1);
      else if (k === 'ArrowUp') info.ai = Math.max(0, info.ai - 3);
      else if (k === 'ArrowDown') info.ai = Math.min(n - 1, info.ai + 3);
      else if (k === 'Enter' || k === ' ') { infoActorOpen(); return; }
      else return;
      infoActorDraw();
      return;
    }
    var o = info.order, ri = o.indexOf(info.r), r = info.rows[info.r];
    if (k === 'ArrowUp' && ri > 0) info.r = o[ri - 1];
    else if (k === 'ArrowDown' && ri < o.length - 1) info.r = o[ri + 1];
    else if (k === 'ArrowLeft' && r) info.at[info.r] = Math.max(0, infoAt(info.r) - 1);
    else if (k === 'ArrowRight' && r) info.at[info.r] = Math.min(r.items.length - 1, infoAt(info.r) + 1);
    else if ((k === 'Enter' || k === ' ') && r) { var it = r.items[infoAt(info.r)]; if (it) it.f(); return; }
    else return;
    infoDraw();
  }
  function infoBack() {
    var b = infoStack.pop();
    if (!b) { closeInfo(); return; }
    openInfo(b.over || null, true);
    if (b.actor) infoActor(b.actor, true);
  }

  function closeInfo() {
    infoOpen = false;
    infoToken++;
    info = null;
    infoStack = [];
    $('info').className = 'hidden';
  }
  // ------------------------------------------------------------------ tuning static

  var sToken = 0, sbHoldUntil = 0, sbHoldTimer = null, sbOutTimer = null, sbInTimer = null;
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

  function toast(msg, ms, low) {
    if (guideOpen || odOpen) low = true;          // low: bottom of the screen, so it never covers the guide's header or clock
    var t = $('toast'), lo = low ? 'low ' : '';
    t.textContent = msg;
    t.className = lo.trim();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = lo + 'off'; }, ms || 2000);
  }

  function fmtTime(ms) {
    var d = new Date(ms);
    return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function showBanner() {
    if (!cur) return;
    if (cur.od || odHomeMode()) { $('banner').className = 'off'; return; }   // On Demand has its own bar; the old blue one stays away
    var sched = cur.ch.sched;
    var next = cur.od ? odPeek() : sched.order[(cur.index + 1) % sched.order.length];
    $('bnum').textContent = cur.ch.n;
    $('bchan').textContent = cur.ch.name;
    var bs = splitTitle(cur.prog.title), bes = cur.prog.sub || '';
    $('btitle').textContent = bs.show;
    $('bsub').textContent = bs.ep ? bs.ep + (bes && bs.ep.indexOf(bes) < 0 ? ' \u00b7 ' + bes : '') : bes;
    var nb = $('bnext');
    nb.textContent = '';
    if (next) {
      nb.appendChild(document.createTextNode('Next'));
      var b = document.createElement('b');
      var ns = splitTitle(next.title); b.textContent = ns.show + (ns.ep ? '  ' + ns.ep.split(' ')[0] : '');
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
  var PLAYERS = [{ id: 'auto', label: 'Automatic' }, { id: 'off', label: 'Never' }, { id: 'always', label: 'Always' }];
  var playerIdx = (function () { var s = store.get('player1'); for (var i = 0; i < PLAYERS.length; i++) if (PLAYERS[i].id === s) return i; return 0; })();
  var npKnown = store.get('np1') || {};                // file -> when it needed the backup player
  function playerMode() { return PLAYERS[playerIdx].id; }
  v.wantNative = function (u) {
    if (cur && cur.prog && cur.prog.addon) return true;     // addon files are often mkv with Dolby audio: the app's own player
    if (/^yt:/.test(u || '')) return true;                 // YouTube videos are looked up and played by the app's own player
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
  // ---- sound and subtitle tracks (OSD "Audio & subtitles"). Only the app's own player can see the tracks inside a file;
  // the web view plays one sound and no subtitles. A choice is kept as a language, so the next programme starts the same
  // way where it can (NativePlayer.prefs). Subtitles come back as text or pictures and are drawn here, over the picture.
  var trPref = store.get('tracks1') || { a: '', t: '' };      // a: sound language; t: '' the file's own, 'off', 'any' or a language
  v.trackPrefs(trPref.a, trPref.t);
  var LANG = { en: 'English', eng: 'English', fr: 'French', fre: 'French', fra: 'French', de: 'German', ger: 'German', deu: 'German',
    es: 'Spanish', spa: 'Spanish', it: 'Italian', ita: 'Italian', nl: 'Dutch', dut: 'Dutch', pt: 'Portuguese', por: 'Portuguese',
    sv: 'Swedish', swe: 'Swedish', da: 'Danish', dan: 'Danish', no: 'Norwegian', nor: 'Norwegian', fi: 'Finnish', fin: 'Finnish',
    pl: 'Polish', pol: 'Polish', ru: 'Russian', rus: 'Russian', ja: 'Japanese', jpn: 'Japanese', zh: 'Chinese', chi: 'Chinese',
    ko: 'Korean', kor: 'Korean', ar: 'Arabic', ara: 'Arabic', hi: 'Hindi', hin: 'Hindi', tr: 'Turkish', tur: 'Turkish', el: 'Greek', gre: 'Greek' };
  var CODEC = { 'audio/ac3': 'Dolby Digital', 'audio/eac3': 'Dolby Digital+', 'audio/eac3-joc': 'Dolby Atmos', 'audio/true-hd': 'Dolby TrueHD',
    'audio/vnd.dts': 'DTS', 'audio/vnd.dts.hd': 'DTS-HD', 'audio/mp4a-latm': 'AAC', 'audio/opus': 'Opus', 'audio/mpeg': 'MP3', 'audio/flac': 'FLAC' };
  function langName(l) {
    if (!l || l === 'und') return '';
    var b = String(l).toLowerCase().split(/[-_]/)[0];
    return LANG[b] || String(l).toUpperCase();
  }
  function trName(t, n) {
    var bits = [];
    var lang = langName(t.lang);
    if (t.label && t.label.toLowerCase() !== lang.toLowerCase()) bits.push(t.label);
    if (lang) bits.unshift(lang);
    if (!bits.length) bits.push((t.k === 'audio' ? 'Sound ' : 'Subtitles ') + n);
    return bits.join(' · ');
  }
  function trSub(t) {
    var x = [];
    if (t.k === 'audio') {
      if (CODEC[t.mime]) x.push(CODEC[t.mime]);
      if (t.ch) x.push(t.ch === 1 ? 'Mono' : t.ch === 2 ? 'Stereo' : t.ch === 6 ? '5.1' : t.ch === 8 ? '7.1' : t.ch + ' channels');
      if (t.desc) x.push('Audio description');
    } else {
      if (t.forced) x.push('Forced');
      if (t.desc) x.push('SDH');
      if (/pgs|vobsub|dvb/.test(t.mime || '')) x.push('Picture subtitles');
    }
    return x.join(', ');
  }
  function trOf(k) { return v.tracks().filter(function (t) { return t.k === k; }); }
  function trHas() { return trOf('audio').length > 1 || trOf('text').length > 0; }
  function trSave() { store.set('tracks1', trPref); v.trackPrefs(trPref.a, trPref.t); }
  function trNow(k) {
    var on = trOf(k).filter(function (t) { return t.on; })[0];
    return on ? trName(on, trOf(k).indexOf(on) + 1) : (k === 'text' ? 'Off' : 'None');
  }
  function trMenu(k, parent) {
    var list = trOf(k), items = [];
    if (k === 'text') items.push({ t: (trNow('text') === 'Off' ? '✓ ' : '') + 'Off', f: function () {
      v.selectTrack(null); trPref.t = 'off'; trSave(); gmClose(); subLog = 0; toast('Subtitles off', 1500);
    } });
    list.forEach(function (t, n) {
      var name = trName(t, n + 1);
      items.push({ t: (t.on ? '✓ ' : '') + name, sub: trSub(t), f: function () {
        v.selectTrack(t);
        if (k === 'audio') trPref.a = t.lang && t.lang !== 'und' ? t.lang : ''; else trPref.t = t.lang && t.lang !== 'und' ? t.lang : 'any';
        trSave(); gmClose(); if (k === 'text') subLog = 0;
        toast((k === 'audio' ? 'Sound: ' : 'Subtitles: ') + name, 2000);
        dlog('TRACK ' + k + ' ' + name + (t.mime ? ' (' + t.mime + ')' : ''));
      } });
    });
    var cur0 = 0;
    items.forEach(function (it, i) { if (it.t.indexOf('✓') === 0) cur0 = i; });
    gm = { items: items, i: cur0, title: k === 'audio' ? 'Sound' : 'Subtitles', sub: list.length + (k === 'audio' ? ' sound tracks' : ' subtitle tracks') + ' in this file', parent: parent || null };
    gmRender();
  }
  function trOpen() {
    if (!trHas()) { toast('This file has only one sound and no subtitles', 2500); return; }
    var top = [];
    if (trOf('audio').length > 1) top.push({ t: 'Sound', sub: trNow('audio'), f: function () { trMenu('audio', gm); } });
    if (trOf('text').length) top.push({ t: 'Subtitles', sub: trNow('text'), f: function () { trMenu('text', gm); } });
    if (top.length === 1) { trMenu(trOf('audio').length > 1 ? 'audio' : 'text'); return; }
    gm = { items: top, i: 0, title: 'Audio & subtitles', sub: (cur && cur.prog && cur.prog.title) || '' };
    gmRender();
  }
  v.addEventListener('tracks', function () {
    var ts = v.tracks();
    if (!ts.length) return;
    dlog('  tracks: ' + ts.map(function (t, n) { return (t.on ? '*' : '') + t.k + ' ' + (t.lang || '?') + (t.mime ? ' ' + t.mime.replace(/^\w+\//, '') : '') + (t.ch ? ' ' + t.ch + 'ch' : ''); }).join(', '));
  });
  var subLog = 0;                                      // the first few subtitle deliveries after a choice go in the debug log, so a silent track can be told from a hidden one
  window.__npCues = function (json) {
    var box = $('subs'), list = [];
    try { list = JSON.parse(json) || []; } catch (e) { /* nothing to show */ }
    if (subLog < 6 && list.length) { subLog++; dlog('SUBTITLE cue: ' + list.filter(function (c) { return c.t; }).length + ' text, ' + list.filter(function (c) { return c.img; }).length + ' picture' + (list[0] && list[0].t ? ', ' + list[0].t.length + ' characters' : '')); }
    box.textContent = '';
    if (!list.length) { box.className = 'hidden'; return; }
    // the box covers the picture itself (not the black bars), since picture subtitles are placed by where they sit in the frame
    var ar = v.videoWidth > 0 && v.videoHeight > 0 ? v.videoWidth / v.videoHeight : 16 / 9;
    var w = Math.min(window.innerWidth, window.innerHeight * ar);
    box.style.width = w + 'px'; box.style.height = (w / ar) + 'px';
    var text = [];
    list.forEach(function (c) {
      if (c.t) { text.push(c.t); return; }
      if (!c.img) return;
      var im = document.createElement('img'); im.src = c.img;
      im.style.width = (c.w * 100) + '%';
      im.style.left = (c.x * 100) + '%'; im.style.top = (c.y * 100) + '%';
      im.style.transform = 'translate(' + (c.ax === 1 ? -50 : c.ax === 2 ? -100 : 0) + '%,' + (c.ay === 1 ? -50 : c.ay === 2 ? -100 : 0) + '%)';
      box.appendChild(im);
    });
    if (text.length) {
      var d = document.createElement('div'); d.className = 'st';
      text.join('\n').split('\n').forEach(function (line, i) {
        if (i) d.appendChild(document.createElement('br'));
        var sp = document.createElement('span'); sp.textContent = line; d.appendChild(sp);
      });
      box.appendChild(d);
    }
    box.className = '';
  };

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
  /** A debrid service whose link has gone bad often answers with a short clip that says "Something went wrong" instead of an error, which plays happily.
   *  An addon source that is only a few seconds long is that clip: treat the link as failed and go on to the next one. */
  function adBadClip() {
    var c = cur;
    if (!c || c.ad || !c.prog || !c.prog.addon || c.badClip === c.prog.url || !adFall) return;
    var d = v.duration;
    if (!(d > 0) || !isFinite(d) || d >= 45) return;
    c.badClip = c.prog.url;
    dlog('ADDON: ' + (c.prog.sub || 'the addon') + ' gave a ' + Math.round(d) + ' s clip for ' + (c.prog.title || '') + ', the "something went wrong" video; trying the next link');
    nextInChannel();
  }
  v.addEventListener('loadedmetadata', adBadClip);
  v.addEventListener('durationchange', adBadClip);
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
      if (v.videoWidth > 0 && (v.native || !(q && q.totalVideoFrames === 0))) return;      // the app's own player cannot count frames, so a known picture size is taken as a picture
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
    if (prog.virtual && !depgActive()) { playSlot(ch, (index + 1) % ch.sched.order.length, 0, announce, tuning); return; }   // no addon to play it: on to the next
    if (amMsg) amNoteOff();                                      // a new channel or programme: the old scraping message goes
    if (amTake(ch, index, offset, announce, tuning, progOverride, prog)) return;
    cur = { ch: ch, index: index, prog: prog, errors: cur && cur.ch === ch ? cur.errors : 0 };
    v.dataset.offset = String(offset || 0);
    pbStart(prog.url, offset);
    if (prog.adBlock) { playAdBlock(ch, index, offset, announce, tuning); return; }
    var meOne = cur;
    // a YouTube video may need up to 5 servers tried (12 s each) before one starts, so it gets longer before giving up
    var isYt = /^yt:/.test(prog.url || '');
    setTimeout(function () {
      if (cur === meOne && v.readyState < 1 && !meOne.ad) {       // never even got the file header: move on
        dlog('GAVE UP after ' + (isYt ? 120 : 30) + 's: nothing arrived at all (' + playState() + ')');
        diagnose(prog.url); markSlow(prog.id); nextInChannel();
      }
    }, isYt ? 120000 : 30000);
    setTimeout(function () {
      // header arrived but it still can't play 25 s in (slow index/seek on a mid-programme join): move on, and remember it
      if (cur === meOne && !meOne.ad && !meOne.played && v.readyState < 3) {    // not one that did start and then paused to buffer
        dlog('GAVE UP after ' + (isYt ? 110 : 25) + 's: it never got going (' + playState() + ')');
        diagnose(prog.url); markSlow(prog.id); nextInChannel();
      }
    }, isYt ? 110000 : 25000);
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
  var adRecentAds = [];                 // adverts shown lately, so a break does not repeat one
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
      { year: was ? was.adYear : 0, cat: ADS.categoryFor(ch.id), hour: new Date().getHours(), recent: adRecentAds });
    if (!ad) return nextInChannel();
    adRecentAds.push(ad.url); if (adRecentAds.length > 24) adRecentAds.shift();
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
  // On Demand only: after 3 episodes in a row (or 90 minutes) with no key pressed, ask before playing another
  var odAuto = 0, odRunAt = 0, odNxHide = false, odNxFor = null, odStill = false;
  function odNxEl(on, html) { var e = $('odnx'); if (!e) return; e.classList.toggle('hidden', !on); if (on) e.innerHTML = html; }
  var odStillSel = 0, odStillT = null;
  function odStillDraw() {
    var e = $('odsw'); if (!e) return;
    e.classList.toggle('hidden', !odStill);
    if (!odStill) return;
    e.innerHTML = '<h2>Are you still watching?</h2><div><span class="' + (odStillSel === 0 ? 'sel' : '') + '">Keep watching</span><span class="' + (odStillSel === 1 ? 'sel' : '') + '">Stop</span></div>';
  }
  function odStillShow() {
    odStill = true; odStillSel = 0; v.pause(); odStillDraw(); odNxEl(false);
    clearTimeout(odStillT); odStillT = setTimeout(function () { if (odStill) odStillEnd(true); }, 5 * 60000);     // nobody there: stop on its own
    dlog('ON DEMAND: still watching? asked after ' + odAuto + ' episodes');
  }
  function odStillEnd(stop) {
    clearTimeout(odStillT); odStill = false; odAuto = 0; odRunAt = Date.now(); odStillDraw();
    if (stop) odOpenUi(); else odStep(1);
  }
  function odStillKey(k) {
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') { odStillSel = 1 - odStillSel; odStillDraw(); }
    else if (k === 'Enter' || k === ' ') odStillEnd(odStillSel === 1);
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') odStillEnd(true);
  }
  function onEnded() {
    if (cur && cur.od && !cur.ad) {
      odNxEl(false);
      if (!odRunAt) odRunAt = lastKeyAt || Date.now();
      if (lastKeyAt > odRunAt) { odRunAt = lastKeyAt; odAuto = 0; }
      odAuto++;
      if (cur.od.list[cur.od.i + 1] && (odAuto >= 3 || Date.now() - odRunAt > 90 * 60000)) return odStillShow();
    }
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
    if (cur && cur.am && !cur.od) { var am = cur.am; adFall = null; playSlot(am.ch, (am.index + 1) % am.ch.sched.order.length, 0, true); return; }   // main-source mode: on to the channel's next programme
    if (cur && cur.prog && cur.prog.addon) {                  // it played to the end: nothing to fall back to
      var fe = adFall; adFall = null;
      if (fe && fe.auto && !fe.g.film && fe.ep) { adSources(fe.g, { s: fe.ep.s || 1, e: (fe.ep.e || 1) + 1 }, false, fe.ch, true); return; }     // auto-play: the next episode, same release group first
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
      if (Date.now() - lastKeyAt < 4000) { setTimeout(function () { chunk(i); }, 3000); return; }       // not while a button is being pressed
      LINKS.putAll(rows.slice(i, i + 120)).then(function () { setTimeout(function () { chunk(i + 120); }, 250); });      // small pieces: each one is a burst of database callbacks on the main thread
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
    if (cur.prog && cur.prog.addon && adFall) {                // an addon source failed: the next best one, then give up
      try { delete adLast[adKeyOf(adFall.g, adFall.ep)]; store.set('adlast1', adLast); } catch (e) { /* ignore */ }
      var nx = adFall.q.shift();
      if (!nx && adFall.retry) { var f0 = adFall; adFall = null; toast('That source has stopped working, looking again', 3000); adSources(f0.g, f0.ep, true, f0.ch, !!f0.auto); return; }
      if (nx) { toast('That source failed, trying the next', 3000); adPlay(adFall.ch, adFall.g, adFall.ep, nx); return; }
      var fl = adFall.lib; adFall = null;
      if (fl) { toast('No addon source worked, using the library', 3500); amFallback(fl, 'every source failed'); return; }
      v.pause(); toast('No other source worked', 4000); odOpenUi(); return;
    }
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
    var sbe = $('standby');
    if (sbe.className === 'hidden' || /snowout/.test(sbe.className)) return;
    sbStageEnd();
    // leaving: the picture breaks up into static and the set fades out, the way a real TV lost its signal
    sbe.className += ' snowout';
    clearTimeout(sbOutTimer);
    sbOutTimer = setTimeout(function () { clearInterval(sbNoiseTimer); sbe.className = 'hidden'; }, 320);
  }
  function standbyOn() {
    clearTimeout(sbTimer);
    sbTimer = setTimeout(function () { renderStandby(false); }, 1000);
  }
  function renderStandby(force) {
    {
      if (!cur || cur.ad) return;                                                  // adverts use the small spinner
      if (!force && (v.readyState >= 3 || v.currentTime > 0.2)) return;           // mid-show waits only if still loading
      if (!force && cur.sbShown) return;                                           // this programme already had its loading screen: never a second one (seek/restart)
      cur.sbShown = true;
      var next = cur.prog && cur.prog.title;
      $('sbnum').textContent = cur.ch.n;
      $('sbosd').textContent = 'P' + (cur.ch.n < 10 ? '0' : '') + cur.ch.n;
      $('sbname').textContent = cur.ch.name;
      $('sbp').textContent = String(100 + cur.ch.n);
      var art = knownArt(cur.prog), sb = $('standby'), me = cur;
      if (!sb.className || /hidden/.test(sb.className)) applyLd();      // a new loading screen: Surprise me picks again
      var style = store.get('sbstyle') === 'card' ? 'card' : 'tv';
      /** Put a picture (or none: static) on the set. */
      function paint(art) {
        var cls = art ? 'withart ' + style : (style === 'tv' ? 'withart tv noart' : '');   // no art: the set stays, tuned to static
        clearTimeout(sbOutTimer); clearTimeout(sbInTimer);
        var wasUp = sb.className && !/hidden|snowout/.test(sb.className);
        sb.className = cls + (wasUp ? '' : ' snowin');          // coming up: a burst of static first, then the picture comes through it
        if (!wasUp) sbInTimer = setTimeout(function () { sb.className = sb.className.replace(' snowin', ''); }, 260);
        // the little TV: a backdrop fills its screen; with only a poster, a blurred copy fills it and the poster sits on top
        $('sbpic').style.backgroundImage = art ? 'url("' + (art.back || art.poster) + '")' : 'none';
        $('sbpic').className = art && !art.back ? 'blurred' : '';
        $('sbpicposter').className = '';               // never a poster on the screen: a backdrop, or (until one is found) the poster only as a dim blurred background
        clearInterval(sbNoiseTimer);
        if (style === 'tv') { sbNoise(); sbNoiseTimer = setInterval(sbNoise, 110); }
        $('sbart').style.backgroundImage = art ? 'url("' + (art.back || art.poster) + '")' : 'none';
        $('sbposter').className = 'hidden';
      }
      paint(art);
      if (!(art && art.back) && gartOn && !cur.prog.ad && filmFor(cur.prog)) {
        // a film with no backdrop yet: ask TheTVDB for one (needs the key), keep the poster dimmed behind until it comes
        if (tvdbReady()) scanFilmOne(cur.prog).then(function () {
          if (cur !== me || sb.className === 'hidden') return;
          var fi = store.get('info3:' + normShow(filmArtName(me.prog)) + ':0:0'), bk = fi && fi.d && fi.d.show && fi.d.show.background;
          if (bk) paint({ back: bk, poster: art ? art.poster : '' });
        }, function () { /* the poster stays */ });
      } else if (!(art && art.back) && gartOn && !cur.prog.ad) {
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
    if (cur.od && cur.prog && cur.prog.alts && cur.prog.alts.length) {       // another stored copy of this episode
      var o = cur.od, nx = cur.prog.alts[0], list = o.list.slice();
      dlog('FALLBACK ' + (cur.prog.title || '') + ': that copy would not play (' + String(cur.prog.url).slice(0, 60) + '), trying ' + String(nx.url).slice(0, 60));
      if (cur.prog.yt && ytGone(v.error && v.error.message)) ytMarkDead(String(cur.prog.url).slice(3));
      list[o.i] = Object.assign({}, list[o.i], { p: Object.assign({}, nx, { alts: cur.prog.alts.slice(1) }) });
      toast('That copy would not play, trying another', 3500);
      odStart(cur.ch, list, o.i, 0, o.name);
      return;
    }
    if (cur.prog && cur.prog.yt && cur.od) {
      dlog('YOUTUBE FAILED ' + (cur.prog.title || '') + ' ' + cur.prog.url + ': ' + (v.error && v.error.message || ''));
      var why = String((v.error && v.error.message) || 'no reason given');
      toast('That YouTube video would not play: ' + why.replace(/^YouTube \S+: /, '').slice(0, 110), 8000);
      if (ytGone(why)) { ytMarkDead(String(cur.prog.url).slice(3)); odStep(1); }      // gone: on to the next; any other reason stays put, so one problem is not repeated down the whole list
      return;
    }
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
  // A cell only a few letters wide shows "Sc…" or "O…", which says nothing (the big header names it on focus): give it the first
  // word if that fits, else a dot. Wider cells keep the whole title and let CSS trim it. Rough: a letter is ~.55 of the text height wide.
  // File-name style titles ("Tekken.Bloodline.S01E02 .HEVC.x265", "01 Saturday ...", "Show (1981) S02E46 Name") are split into the show
  // and its episode, and lose the dots, release tags and series year, so a cell and the header read as a name, not a file.
  function splitTitle(t) {
    t = String(t || '');
    if (!/\s/.test(t.trim()) || (t.match(/[._]/g) || []).length > 2) t = t.replace(/[._]+/g, ' ');
    t = t.replace(/\b(HEVC|x26[45]|h\.?26[45]|AAC\d?|AC3|DDP?\d?|10bit|(?:2160|1080|720|480)p|4K|WEB-?DL|WEB-?Rip|BluRay|BDRip|DVDRip|HDTV|REPACK|PROPER)\b.*$/i, '');
    t = t.replace(/\s*[|\u2013\-]\s*\[[^\]]{1,12}\]/, '').replace(/\s*\[[^\]]{1,12}\]\s*$/, '').replace(/\s*\|\s*$/, '');   // an uploader tag such as "| [WRR]"
    var m = /\bS(\d{1,2})[\s._-]*E(?:p(?:isode)?\.?\s*)?(\d{1,3})\b/i.exec(t), show = t, ep = '';
    if (m && m.index > 0) { show = t.slice(0, m.index); ep = 'S' + m[1] + 'E' + m[2]; var rest = t.slice(m.index + m[0].length).replace(/^[\s\-\u2013:|]+/, '').trim(); if (rest) ep += ' \u00b7 ' + rest; }
    if (!ep) { var m2 = /\s+S(\d{1,2})\b/i.exec(t); if (m2 && m2.index > 0) { show = t.slice(0, m2.index); ep = 'S' + m2[1]; } }     // a whole season ("The Bill (1983) S11 DVD Rip")
    show = show.replace(/\s*\((?:19|20)\d\d\)/g, '').replace(/[\s\-\u2013:|]+$/, '').replace(/^\d{1,2}\s+(?=[A-Za-z])/, '').replace(/\s+/g, ' ').trim();
    return { show: show || t.trim(), ep: ep.replace(/\s+/g, ' ').trim() };
  }
  // A cell only a few letters wide shows "Sc…" or "O…", which says nothing (the big header names it on focus): give it the first
  // word if that fits, else a dot, and no arrows. Wider cells keep the whole title and let CSS trim it. Rough: a letter is ~.55 of the text height wide.
  function fitTitle(t, frac, arrows) {
    var wpx = frac * window.innerWidth, cap = Math.floor((wpx * 0.8 - window.innerHeight * 0.03 * uiF) / (window.innerHeight * 0.026 * uiF * 0.62));
    if (wpx >= 170 * window.innerWidth / 1920) { cap -= 3 * arrows; if (cap >= 8) return t; }   // each arrow takes about three letters of room
    var w = String(t).split(/[\s:\-\u2013]+/)[0];
    return w.length <= cap && !/^(the|a|an)$/i.test(w) ? w : '\u2022';                   // "The" or half a word says nothing: a dot
  }
  var SPAN = 4 * HALF;          // two hours visible
  var VISIBLE_ROWS = window.PHONE ? 4 : 7;   // the colour-button legend is gone, so the grid takes its space
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  var gChan = null;  // selected channel
  var gRow = 0;      // its row (derived)
  var gTop = 0;      // first visible row
  var gFree = false; // phone: the view has been scrolled by hand, so the highlight need not be on screen
  var gWin = 0;      // time at the left edge of the grid
  var gFocus = 0;    // time the cursor is on
  var guideTimer = null;

  var favs = (function () { var a = store.get('fav1'); return Array.isArray(a) ? a : []; })();
  var favOnly = !!store.get('favonly1');
  function isFav(c) { return !!c && favs.indexOf(c.id) >= 0; }
  function favSave() { store.set('fav1', favs); store.set('favonly1', favOnly); }
  function guideList() {
    var all = channels.filter(function (c) { return c.status !== 'empty'; })
      .sort(function (a, b) { return a.n - b.n; });
    if (guideOpen && favOnly) {                       // the guide alone: channel surfing and digits still see every channel
      var f = all.filter(isFav);
      if (f.length) return f;
    }
    return all;
  }
  /** Add or remove a channel from the favourites, and redraw the guide so the star shows. */
  function favToggle(c) {
    var i = favs.indexOf(c.id);
    if (i >= 0) favs.splice(i, 1); else favs.push(c.id);
    if (!favs.length) favOnly = false;
    favSave();
    toast(i >= 0 ? 'Removed ' + c.name + ' from Favourites' : 'Added ' + c.name + ' to Favourites', 2200);
    if (i < 0) store.set('favhint1', 1);
    odRowsMemo = null; onSig = '';
    if (guideOpen) { gPaint = null; renderGuide(); }
  }
  function favFilter() {
    if (!favOnly && !favs.length) { toast('No favourites yet: hold OK on a channel and choose Add to favourites', 4000); return; }
    favOnly = !favOnly;
    favSave();
    gPaint = null; gTop = 0; renderGuide();
    toast(favOnly ? 'Showing favourite channels only' : 'Showing all channels', 2200);
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
  /** The block of what is being watched right now: marked in the guide like the NOW tag in the channel schedule. */
  function isPlayingBlock(ch, b, now) {
    if (!cur || cur.ad || cur.od || cur.ch !== ch || !(b.startMs <= now && now < b.endMs)) return false;
    var g = ch.sched && ch.sched.groups && ch.sched.groups[b.gi];
    return !!g && cur.index >= g.first && cur.index < g.first + g.count;
  }
  function paintSelection(list) {
    var now = Date.now();
    $('gclock').textContent = fmtTime(now);
    gPaint.rows.forEach(function (row, i) {
      var want = 'gch' + (!gOd && (gPaint.first || 0) + i === gRow ? ' sel' : '') + (cur && !cur.ad && cur.ch === row.ch ? ' on' : '');
      if (row.cell.className !== want) row.cell.className = want;
      if (row.ld) {                                 // channel still loading: one wide block, highlighted or not
        var lw = 'blk ld' + (!gOd && row.ch === list[gRow] ? ' foc' : '');
        if (row.ld.className !== lw) row.ld.className = lw;
      }
      row.blocks.forEach(function (bl) {
        var w = bl.base +
          ((!gOd && row.ch === list[gRow] && bl.b.startMs <= gFocus && gFocus < bl.b.endMs) ? ' foc' : '') +
          ((bl.b.startMs <= now && now < bl.b.endMs) ? ' now' : '') +
          (isPlayingBlock(row.ch, bl.b, now) ? ' play' : '');
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
      var sp = splitTitle(fb.prog.title);
      $('gtitle').textContent = sp.show;
      $('gchan').textContent = sel.n + '  ' + sel.name;
      var when;
      if (fb.startMs <= now && now < fb.endMs) when = 'Showing now';
      else if (fb.startMs > now) {
        var mins = Math.round((fb.startMs - now) / 60000);
        when = mins < 60 ? 'Starts in ' + mins + ' min' : 'Starts at ' + fmtTime(fb.startMs);
      } else when = 'Earlier';
      $('gtime').textContent = fmtTime(fb.startMs) + ' \u2013 ' + fmtTime(fb.endMs) + '   ' + when;
      var esub = fb.prog.sub || '';
      $('gsub').textContent = fb.count > 1
        ? 'Plus ' + (fb.count - 1) + ' more programme' + (fb.count > 2 ? 's' : '')
        : (sp.ep ? sp.ep + (esub && sp.ep.indexOf(esub) < 0 ? ' \u00b7 ' + esub : '') : esub);
    }
    guideArt(fb ? fb.prog : null);
  }

  /** light = the highlight moved; rebuild the grid only when the rows or the time window actually change. */
  /** Phone: a programme that is mostly off the side of the guide is scrolled back so it can be read. */
  function bringIntoView(b) {
    var base = floorHalf(Date.now()), vis = Math.min(b.endMs, gWin + SPAN) - Math.max(b.startMs, gWin);
    if (b.startMs < gWin || vis < Math.min(b.endMs - b.startMs, SPAN) * 0.6) gWin = Math.max(base, floorHalf(b.startMs));
  }
  /** Phone: a tap on a channel or programme in the guide selects it; a tap on what is already selected watches it. */
  function tapGuide(el, ch, b) {
    el.setAttribute('data-tap', '1');
    el.addEventListener('phoneselect', function () { gOdSet(false); gChan = ch; if (b) { var n0 = Date.now(); gFocus = b.startMs <= n0 && n0 < b.endMs ? n0 : Math.min(b.startMs + 1000, b.endMs - 1); bringIntoView(b); } renderGuide(true); });
    el.addEventListener('click', function () {
      var now = Date.now(), same = gChan === ch && (!b || (b.startMs <= gFocus && gFocus < b.endMs));
      if (same && (b || gChan === ch)) { gOdSet(false); watchFromGuide(); return; }
      gOdSet(false);
      gChan = ch;
      if (b) {
        gFocus = b.startMs <= now && now < b.endMs ? now : Math.min(b.startMs + 1000, b.endMs - 1);
        bringIntoView(b);
      }
      renderGuide(true);
    });
  }
  function renderGuide(light) {
    if (seasonOv) seasonOv.touch();
    var list = guideList();
    if (!list.length) return;
    var now = Date.now();
    gRow = list.indexOf(gChan);
    if (gRow < 0) { gRow = 0; gChan = list[0]; }
    applyTheme(gChan);
    if (!(window.PHONE && gFree)) {
      if (gRow < gTop) gTop = gRow;
      if (gRow >= gTop + VISIBLE_ROWS) gTop = gRow - VISIBLE_ROWS + 1;
    }
    var PH = !!window.PHONE, r0 = PH ? Math.max(0, gTop - 1) : gTop, r1 = Math.min(list.length, gTop + VISIBLE_ROWS + (PH ? 1 : 0));

    if (light && gPaint && gPaint.top === gTop && gPaint.win === gWin && gPaint.len === list.length) {
      paintSelection(list);
      return;
    }

    $('gclock').textContent = fmtTime(now);
    var gt = $('gtop').firstElementChild; if (gt) gt.textContent = favOnly && list.every(isFav) ? '\u2605 Favourites' : 'TV Guide';

    var grid = $('ggrid');
    grid.textContent = '';
    gPaint = { top: gTop, first: r0, win: gWin, len: list.length, rows: [] };

    var th = div('trow');
    th.appendChild(div('tday', dayLabel(gWin)));
    var ticks = div('tline'), tickHost = ticks;
    if (PH) { tickHost = div('tin'); ticks.appendChild(tickHost); }
    for (var i = PH ? -1 : 0; i < (PH ? 6 : 4); i++) {
      var tick = div('tick', fmtTime(gWin + i * HALF));
      tick.style.left = (i * 25) + '%';
      tickHost.appendChild(tick);
    }
    th.appendChild(ticks);
    grid.appendChild(th);
    var rowHost = grid, gin2 = null;
    if (PH) {
      var gwrap = div('gwrap'); gin2 = div('gin2'); gin2.style.top = (-(gTop - r0) * 15.2) + 'vh';
      gwrap.appendChild(gin2); grid.appendChild(gwrap); rowHost = gin2;
    }

    for (var r = r0; r < r1; r++) {
      var ch = list[r];
      var row = div('grow');
      var cell = div('gch' + (r === gRow ? ' sel' : ''));
      if (window.PHONE) tapGuide(cell, ch, null);
      cell.appendChild(div('n', ch.n));
      cell.appendChild(div('name', (isFav(ch) ? '\u2605 ' : '') + ch.name));
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
        rowHost.appendChild(row);
        continue;
      }
      var bhost = line;
      if (PH) { bhost = div('tin'); line.appendChild(bhost); }
      (function (rec, line, ch) {
        var lo = PH ? gWin - HALF : gWin, hi = PH ? gWin + SPAN + HALF : gWin + SPAN;
        E.blocks(ch.sched, lo, hi).forEach(function (b) {
          var s = Math.max(b.startMs, lo);
          var e = Math.min(b.endMs, hi);
          if (e <= s) return;
          var focused = (ch === list[gRow]) && b.startMs <= gFocus && gFocus < b.endMs;
          var frac = (e - s) / SPAN;
          var clipL = b.startMs < lo, clipR = b.endMs > hi;
          var base = 'blk' + (clipL ? ' cl' : '') + (clipR ? ' cr' : '') + (frac < 0.07 ? ' nw' : '');
          var el = div(base + (focused ? ' foc' : '') + (b.startMs <= now && now < b.endMs ? ' now' : ''));
          el.style.left = ((s - gWin) / SPAN * 100) + '%';
          el.style.width = 'calc(' + (frac * 100) + '% - .4vw)';
          if (PH && b.startMs < gWin && b.endMs > gWin) {            // runs in from the left: its words start at the edge you can see
            var padPct = Math.min((gWin - s) / SPAN * 100, frac * 100 - 14);
            if (padPct > 0) el.style.paddingLeft = 'calc(' + padPct.toFixed(2) + '% + 1.4vw)';
          }
          if (window.PHONE) tapGuide(el, ch, b);
          rec.blocks.push({ el: el, b: b, base: base });
          if (frac < 0.07) { line.appendChild(el); return; } // too narrow for text: no padding either, or it would stick out past the edge
          var tiny = frac * window.innerWidth < 170 * window.innerWidth / 1920, st = splitTitle(b.prog.title);
          if (clipL && !tiny) el.appendChild(div('arr l', '\u25c4'));
          if (clipR && !tiny) el.appendChild(div('arr r', '\u25ba'));
          var shown = fitTitle(st.show, frac, (clipL ? 1 : 0) + (clipR ? 1 : 0)), ec = st.ep ? st.ep.split(' ')[0] : '', es = b.prog.sub || '';
          el.appendChild(div('t', shown));      // the show's name; its episode code goes on the second line
          if (shown !== '\u2022') { var sEl = div('s', b.count > 1 ? b.count + (frac * window.innerWidth >= 380 * window.innerWidth / 1920 ? ' programmes' : ' items') : (ec && es && es.indexOf(ec) < 0 && ec.indexOf(es) < 0 ? ec + ' \u00b7 ' + es : ec || es)); sEl.textContent = sEl.textContent.replace(/\bS(\d{1,2})E(\d{1,3})\b/g, 'S$1 E$2'); el.appendChild(sEl); }
          line.appendChild(el);
        });
      })(rec, bhost, ch);
      row.appendChild(line);
      rowHost.appendChild(row);
    }

    paintSelection(list);
  }


  // The backup player (YouTube and some files) draws on a surface behind the page, so the guide's little TV was blank. While the
  // guide is open over it, the surface is shrunk into the little TV's place and a hole is cut in the guide to show it through.
  var npWin = false;
  function npMini() {
    if (!window.NativeHttp || !NativeHttp.npRect) return;
    var b = document.body.classList, want = b.contains('np') && b.contains('guide-open') && !$('guide').classList.contains('hidden');
    if (want) {
      var r = $('v').getBoundingClientRect(), d = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
      if (r.width < 10) return;
      var l = Math.round(r.left), t = Math.round(r.top), rr = Math.round(r.right), bb = Math.round(r.bottom);
      try { NativeHttp.npRect(Math.round(l * d), Math.round(t * d), Math.round((rr - l) * d), Math.round((bb - t) * d)); } catch (e) { /* older app */ }
      $('guide').style.clipPath = 'polygon(evenodd, 0 0, ' + W + 'px 0, ' + W + 'px ' + H + 'px, 0 ' + H + 'px, 0 0, ' +
        l + 'px ' + t + 'px, ' + l + 'px ' + bb + 'px, ' + rr + 'px ' + bb + 'px, ' + rr + 'px ' + t + 'px, ' + l + 'px ' + t + 'px)';
      npWin = true;
    } else if (npWin) {
      npWin = false;
      $('guide').style.clipPath = '';
      try { NativeHttp.npRect(0, 0, 0, 0); } catch (e) { /* older app */ }
    }
  }
  try {
    var npMo = new MutationObserver(function () { npMini(); });
    npMo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    npMo.observe($('guide'), { attributes: true, attributeFilter: ['class'] });
  } catch (e) { /* no observer */ }

  // ---- seasonal effects (seasons.js): a decorative overlay over the guide, only while it is open and a season is on
  var seasonOn = store.get('seasonal') !== 'off', seasonOv = null, seasonLogged = -1;
  /** Measures how smoothly the page draws while the snow is on, and writes it to the debug log: frames per second, the slowest frame, and
   *  how many took over 50 ms, with how many snow animations are really running. It waits 20 s after the snow starts (so start-up work is
   *  over), measures for 12 s, and says nothing if the guide closes meanwhile. The mode (Auto or Test) is logged when the snow starts. */
  var probeAt = 0, probeRun = 0;
  function snowProbe() {
    dlog('SNOW: starting, ' + Math.round(SEASONS.cfg.CYCLE_MS / 1000) + ' s cycle, saved choice "' + (store.get('seasonal') || '') + '", screen ' + window.innerWidth + 'x' + window.innerHeight + ' at ' + (window.devicePixelRatio || 1) + 'x');
    if (!window.requestAnimationFrame || Date.now() - probeAt < 120000) return;
    probeAt = Date.now();
    var run = ++probeRun;
    // the plough's own crossing: frames while it drives, and where the blade and the cut are against each other at the half way mark
    try {
      var pl = seasonOv.plough();
      setTimeout(function () {
        if (run !== probeRun || !guideOpen) return;
        var t0 = performance.now(), last = t0, n = 0, worst = 0, slow = 0, span = Math.max(3000, pl.run - 800);
        (function tick(t) {
          if (run !== probeRun) return;
          var d = t - last; last = t;
          if (n > 0) { n++; if (d > worst) worst = d; if (d > 50) slow++; } else n = 1;
          if (t - t0 < span) { requestAnimationFrame(tick); return; }
          dlog('SNOW: plough crossing: ' + Math.round(n * 1000 / (t - t0)) + ' fps over ' + Math.round((t - t0) / 1000) + ' s, slowest frame ' + Math.round(worst) + ' ms, ' + slow + ' over 50 ms');
        })(t0);
      }, pl.due + 400);
    } catch (e) { /* no plough timing */ }
    snowMeasure(run, 15000);
  }
  /** The snow looks after its own speed: once the guide has been up for a while, count the frames for eight seconds. Under
   *  about 87% of what the screen can show (60, or 30 on a screen that only does 30), drop to the next lighter tier and measure
   *  again, up to tier 3. The tier is kept for the next start. The log says what each step gave. */
  function snowMeasure(run, delay, tries) {
    tries = tries || 0;
    setTimeout(function () {
      if (run !== probeRun || !seasonOv) return;
      if (!guideOpen) { if (tries < 120) snowMeasure(run, 5000, tries + 1); return; }      // the guide is not on screen yet (or was closed): try again in five seconds, for up to ten minutes
      var t0 = performance.now(), last = t0, n = 0, worst = 0, slow = 0, ds = [];
      (function tick(t) {
        if (run !== probeRun) return;
        if (!guideOpen) { snowMeasure(run, 5000, tries + 1); return; }   // closed meanwhile: that was a measurement of something else, start again when it is back
        var d = t - last; last = t;
        if (n > 0) { n++; ds.push(d); if (d > worst) worst = d; if (d > 50) slow++; } else n = 1;
        if (t - t0 < 8000) { requestAnimationFrame(tick); return; }
        var an = 0; try { an = document.getAnimations().filter(function (x) { return x.playState === 'running'; }).length; } catch (e) { /* older browser */ }
        ds.sort(function (a, b) { return a - b; });
        var fps = n * 1000 / (t - t0), target = (ds[ds.length >> 1] || 16) > 25 ? 30 : 60, ok = fps >= target * 0.87 && slow <= 3;
        dlog('SNOW: tier ' + snowTier + ': ' + Math.round(fps) + ' fps over ' + Math.round((t - t0) / 1000) + ' s (screen about ' + target + ' Hz), slowest frame ' + Math.round(worst) + ' ms, ' + slow + ' over 50 ms, ' + an + ' animations running' + (ok ? ', fine' : ''));
        if (!ok && tries < 40 && (worst > 1000 || enrichRun)) {                 // a stall of a second or more, or the episode-name check still running: that is start-up work, not the snow, so it is not blamed on it
          dlog('SNOW: that measurement was spoilt by other work (slowest frame ' + Math.round(worst) + ' ms' + (enrichRun ? ', episode names still being checked' : '') + '), measuring again in 30 s');
          snowMeasure(run, 30000, tries + 1); return;
        }
        if (!ok && snowTier < 3) {
          snowTier++; store.set('snowtier2', snowTier);
          dlog('SNOW: not keeping up, moving to tier ' + snowTier + (snowTier === 1 ? ' (no mask round the words)' : snowTier === 2 ? ' (two depths of flakes, not four)' : ' (fewer flakes, no sway)'));
          if (seasonOv) seasonOv.stop(); seasonOv = null; probeAt = 0; seasonUpdate();
        }
      })(t0);
    }, delay);
  }
  /** The snow falls over the episode picture but not over the words: the area it must keep clear is cut round the real text (each line as wide as
   *  its own words), the little TV's neighbour the grid, and nothing else. Redone whenever the words change. */
  var snowClipObs = null, snowClipRaf = 0, snowTier = Math.max(0, Math.min(3, +store.get('snowtier2') || 0));
  function snowClip() {
    var box = $('gsnow'); if (!box) return;
    if (snowTier >= 1) { box.style.clipPath = 'none'; return; }          // a mask makes the TV draw all the snow into a spare full-screen picture every frame
    var W = window.innerWidth, H = window.innerHeight, holes = [];
    function rectOf(el, pad) {
      if (!el || !el.textContent) return;
      var r; try { var rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect(); } catch (e) { return; }
      if (!r || !r.width || !r.height) return;
      holes.push([Math.max(0, r.left - pad), Math.max(0, r.top - 1), Math.min(W, r.right + pad), Math.min(H, r.bottom + 1)]);
    }
    ['gtitle', 'gchan', 'gtime', 'gsub'].forEach(function (id) { rectOf($(id), 6); });
    var gt = $('gtop'); if (gt) Array.prototype.forEach.call(gt.children, function (c) { rectOf(c, 8); });
    var g = $('ggrid'), rows = document.querySelectorAll('#guide .grow');      // the rows, down to the last one: the strip under them is where the drifts lie
    if (g && rows.length) { var gr = g.getBoundingClientRect(), lb = rows[rows.length - 1].getBoundingClientRect().bottom; if (gr.width) holes.push([gr.left, gr.top, gr.right, Math.min(H, lb)]); }
    // holes must not overlap (even-odd fill would give the snow back where two meet): later ones give way to earlier
    var kept = [];
    holes.forEach(function (h) {
      kept.forEach(function (k) { if (h[0] < k[2] && h[2] > k[0] && h[1] < k[3] && h[3] > k[1]) { if (h[1] < k[1]) h[3] = Math.min(h[3], k[1]); else h[1] = Math.max(h[1], k[3]); } });
      if (h[2] > h[0] && h[3] > h[1]) kept.push(h);
    });
    var p = 'M0 0H' + W + 'V' + H + 'H0Z';
    kept.forEach(function (h) { p += 'M' + Math.round(h[0]) + ' ' + Math.round(h[1]) + 'H' + Math.round(h[2]) + 'V' + Math.round(h[3]) + 'H' + Math.round(h[0]) + 'Z'; });
    box.style.clipPath = 'path(evenodd, "' + p + '")';
  }
  function snowClipWatch(on) {
    if (!on) { if (snowClipObs) { snowClipObs.disconnect(); snowClipObs = null; } return; }
    snowClip();
    if (snowClipObs || !window.MutationObserver) return;
    snowClipObs = new MutationObserver(function () { if (snowClipRaf) return; snowClipRaf = requestAnimationFrame(function () { snowClipRaf = 0; snowClip(); }); });
    var gi = $('ginfo'); if (gi) snowClipObs.observe(gi, { childList: true, characterData: true, subtree: true });
    var gg = $('ggrid'); if (gg) snowClipObs.observe(gg, { childList: true });
  }
  function seasonUpdate() {
    if (!window.SEASONS) return;
    var want = seasonOn && guideOpen && !!SEASONS.current();
    SEASONS.cfg.TIER = snowTier; document.body.classList.toggle('snow-lite', snowTier >= 1);
    if (want && !seasonOv) seasonOv = SEASONS.snow($('gsnow'), function () {
      var rows = document.querySelectorAll('#guide .grow'), last = rows.length ? rows[rows.length - 1] : null;
      var free = last ? window.innerHeight - last.getBoundingClientRect().bottom : 40;
      if (free !== seasonLogged) { seasonLogged = free; dlog('SNOW: free strip under the last row ' + Math.round(free) + ' px at ' + window.innerWidth + 'x' + window.innerHeight); }
      return free;
    }, dlog);
    var was = seasonOv && seasonOv.on ? seasonOv.on() : false;
    if (want) seasonOv.start(); else if (seasonOv) seasonOv.stop();
    if (want && !was) snowProbe(); else if (!want) probeRun++;
    snowClipWatch(want);
    if (seasonOv) seasonOv.hold(!!gm);        // a hold-OK menu is open: the snow holds still
    SEASONS.hat(want ? SEASONS.current() : null);
  }
  function openGuide() {
    if (veWaiting) { veWaiting = false; setTimeout(veFill, 8000); }
    closeOsd();
    gOdSet(false);
    var list = guideList();
    if (!list.length) return;
    guideOpen = true;
    if (!favs.length && !store.get('favhint1')) { store.set('favhint1', 1); setTimeout(function () { if (guideOpen && !favs.length) toast('Hold OK on a channel to add it to Favourites', 5000); }, 1200); }
    gFree = false;
    var now = Date.now();
    gChan = cur && list.indexOf(cur.ch) >= 0 ? cur.ch : list[0];
    gRow = Math.max(0, list.indexOf(gChan));
    gTop = Math.max(0, Math.min(gRow, list.length - VISIBLE_ROWS));       // the channel that is on is the top row (the last screenful when it is near the end)
    gWin = floorHalf(now);
    gFocus = now;
    // Back to the picture and then back into the guide: it comes back exactly as it was left (same channel, rows and time), as long as
    // the same thing is still playing and it was not long ago; otherwise it opens on what is playing
    var m = gMem;
    if (m && m.cur === cur && now - m.t < 600000 && list.indexOf(m.chan) >= 0) {
      gChan = m.chan; gRow = list.indexOf(gChan);
      gTop = Math.max(0, Math.min(m.top, Math.max(0, list.length - VISIBLE_ROWS)));
      if (gRow < gTop) gTop = gRow; else if (gRow >= gTop + VISIBLE_ROWS) gTop = gRow - VISIBLE_ROWS + 1;
      gWin = Math.max(m.win, floorHalf(now));
      gFocus = Math.max(m.focus, now);
      if (gFocus >= gWin + SPAN) gFocus = gWin;
    }
    document.body.classList.add('guide-open');
    $('guide').className = '';
    $('banner').className = 'off';
    renderGuide();
    seasonUpdate();
    guideSplashCheck();
    clearInterval(guideTimer);
    guideTimer = setInterval(function () {
      var t = Date.now();
      if (gWin < floorHalf(t)) { gWin = floorHalf(t); if (gFocus < t) gFocus = t; }
      renderGuide(true);
    }, 20000);
  }

  var gMem = null;                       // where the guide was left: openGuide puts it back (see there)
  function closeGuide() {
    osdStopped = false;
    if (guideOpen && gChan) gMem = { cur: cur, chan: gChan, top: gTop, win: gWin, focus: gFocus, t: Date.now() };
    gPaint = null;
    guideOpen = false;
    document.body.classList.remove('guide-open');
    $('guide').className = 'hidden';
    clearInterval(guideTimer);
    if (seasonOv) seasonOv.stop();
    document.body.classList.remove('season-hat');
  }

  var gOd = false;
  function gOdSet(on) {
    var was = gOd; gOd = on; $('godbtn').className = on ? 'sel' : '';
    if (was !== on && guideOpen) renderGuide(true);      // one highlight at a time: the grid's gold goes while the On Demand button has it
  }
  function gMove(delta, wrap) {
    gFree = false;
    var list = guideList();
    var n = list.length;
    var i = Math.max(0, list.indexOf(gChan));
    i = wrap ? (i + delta + n) % n : Math.max(0, Math.min(n - 1, i + delta));
    gChan = list[i];
    renderGuide(true);
  }

  function gHoriz(dir) {
    gFree = false;
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


  // Phone: the guide follows the finger. PG.drag(dx, dy) moves the view by pixels (whole rows and half hours are committed as it
  // goes, the rest is a CSS offset); PG.end(vx, vy) lets it glide to rest on a row / half hour.
  if (window.PHONE) window.PG = (function () {
    var gy = 0, gx = 0;
    function grid() { return $('ggrid'); }
    function metrics() {
      var g = document.querySelector('.gin2 .grow'), tl = document.querySelector('#ggrid .tline');
      var row = g ? g.getBoundingClientRect().height + parseFloat(getComputedStyle(g).marginBottom || 0) : 100;
      var half = tl ? tl.getBoundingClientRect().width * HALF / SPAN : 100;
      return { row: row || 100, half: half || 100 };
    }
    function maxTop() { return Math.max(0, guideList().length - VISIBLE_ROWS); }
    function winOk(w) { var base = floorHalf(Date.now()), max = Math.max(base, base + SPANS[spanIdx].h * 3600000 - SPAN); return w >= base && w <= max; }
    function vars() { var g = grid(); g.style.setProperty('--gy', gy + 'px'); g.style.setProperty('--gx', gx + 'px'); }
    function commit(dRows, dHalves) {
      var any = false;
      while (dRows > 0 && gTop < maxTop()) { gTop++; dRows--; any = true; }
      while (dRows < 0 && gTop > 0) { gTop--; dRows++; any = true; }
      while (dHalves > 0 && winOk(gWin + HALF)) { gWin += HALF; dHalves--; any = true; }
      while (dHalves < 0 && winOk(gWin - HALF)) { gWin -= HALF; dHalves++; any = true; }
      return any;
    }
    return {
      drag: function (dx, dy) {
        if (!guideOpen) return;
        grid().classList.remove('snap'); gFree = true;
        var m = metrics(), moved = false;
        gy += dy; gx += dx;
        while (gy <= -m.row && gTop < maxTop()) { gTop++; gy += m.row; moved = true; }
        while (gy >= m.row && gTop > 0) { gTop--; gy -= m.row; moved = true; }
        while (gx <= -m.half && winOk(gWin + HALF)) { gWin += HALF; gx += m.half; moved = true; }
        while (gx >= m.half && winOk(gWin - HALF)) { gWin -= HALF; gx -= m.half; moved = true; }
        if (gTop >= maxTop() && gy < 0) gy = Math.max(gy, -m.row * 0.18);        // the end of the list: a little give, no more
        if (gTop <= 0 && gy > 0) gy = Math.min(gy, m.row * 0.18);
        if (!winOk(gWin + HALF) && gx < 0) gx = Math.max(gx, -m.half * 0.18);
        if (!winOk(gWin - HALF) && gx > 0) gx = Math.min(gx, m.half * 0.18);
        if (moved) renderGuide();
        vars();
      },
      end: function (vx, vy) {
        if (!guideOpen) return;
        var m = metrics();
        var nRows = Math.round(-(gy + vy * 0.2) / m.row), nHalf = Math.round(-(gx + vx * 0.2) / m.half);
        nRows = Math.max(-6, Math.min(6, nRows)); nHalf = Math.max(-6, Math.min(6, nHalf));
        var t0 = gTop, w0 = gWin;
        commit(nRows, nHalf);
        gy += (gTop - t0) * m.row; gx += ((gWin - w0) / HALF) * m.half;
        if (gTop !== t0 || gWin !== w0) renderGuide();
        vars(); void grid().offsetHeight;
        grid().classList.add('snap');
        gy = 0; gx = 0; vars();
        setTimeout(function () { grid().classList.remove('snap'); }, 420);
      }
    };
  })();

  function gJump(kind) {
    var now = Date.now();
    var base = floorHalf(now);
    if (kind === 'now') { gWin = base; gFocus = now; }
    else if (kind === 'later') { gWin += SPAN; gFocus = gWin; }
    else { gWin = Math.max(base, gWin - SPAN); gFocus = gWin === base ? now : gWin; }
    renderGuide(true);
  }

  /** Real world: a channel plays only what is on now. Any other programme opens in On Demand, with a Yes / No to play it. */
  function rwAsk(c, prog) {
    odOpenUi();
    odJump(c, prog, function () {
      var g = odSel().g, ep = g && (g.film ? g.flat[0] : g.sea && g.sea[odSea] && g.sea[odSea].eps[odEi]);
      if (!ep) return;
      askYesNo('Play it now?', (prog.title || 'This episode') + ' is not on this channel at this time.', function () { odPlay(ep); }, function () { odClose(true); });
    }, true);
  }
  function watchFromGuide(fromStart) {
    var c = gChan;
    if (!c) return;
    if (c.status !== 'ready') { toast(c.name + ' is still loading', 2000); return; }
    var now = Date.now();
    var b = E.blockAt(c.sched, gFocus);
    if (rwOn && b && c.sched._rw && !(b.startMs <= now && now < b.endMs)) { rwAsk(c, c.sched.order[c.sched.groups[b.gi].first]); return; }
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
  var quitYes = null, quitNo = null;           // set when the dialog asks something else (Real world: play it now?)
  function openQuit() {
    quitYes = quitNo = null; $('qh').textContent = 'Quit Telly Addicts?'; $('qp').textContent = 'You will go back to the Google TV home screen.';
    quitOpen = true; quitSel = 1;                         // No is already chosen: an accidental OK does no harm
    renderQuit();
    $('quit').className = '';
  }
  function closeQuit() { quitOpen = false; $('quit').className = 'hidden'; }
  function quitDo(yes) { var f = yes ? quitYes : quitNo; closeQuit(); if (f) f(); else if (yes) exitApp(); }
  /** The same Yes / No box, asking something else. No is chosen to start with. */
  function askYesNo(head, text, onYes, onNo) {
    $('qh').textContent = head; $('qp').textContent = text;
    quitYes = onYes; quitNo = onNo || function () {};
    quitOpen = true; quitSel = 1; renderQuit(); $('quit').className = '';
  }
  $('qyes').addEventListener('click', function () { quitDo(true); });
  $('qno').addEventListener('click', function () { quitDo(false); });
  $('qyes').addEventListener('mouseenter', function () { quitSel = 0; renderQuit(); });
  $('qno').addEventListener('mouseenter', function () { quitSel = 1; renderQuit(); });
  function quitKey(k) {
    if (k === 'ArrowLeft') quitSel = 0;
    else if (k === 'ArrowRight') quitSel = 1;
    else if (k === 'Enter' || k === ' ') { quitDo(quitSel === 0); return true; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { quitDo(false); return true; }
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

  /** Hide a show (or film) on this TV: it goes from On Demand now, and from the guide the next time the lists are built. */
  function hideShow(name, film) {
    var k = LIBROUTE.norm(name || '');
    if (!k) { toast('Nothing to hide', 2000); return; }
    hid[k] = name; hidSave();
    Object.keys(odData).forEach(function (id) { var r = odData[id]; if (r && r.shows) r.shows = r.shows.filter(function (x) { return LIBROUTE.norm(x.name) !== k; }); });
    odRowsMemo = null;
    dlog('HIDDEN on this TV: ' + name);
    toast('Hidden: ' + name + '. Gone from On Demand now, and from the guide after Refresh listings. Undo in Options > TV Guide.', 7000);
    if (odOpen) { odmClose(); if (odView === 'show') odShowView(false); Object.keys(odData).forEach(function (id) { if (/^_g_/.test(id)) delete odData[id]; }); odHero = odHero.filter(function (x) { return LIBROUTE.norm(x.name) !== k; }); odRender(); }
  }
  var unhideArmed = false, unhideTimer = null;
  function unhideAll() {
    if (!hidCount) { toast('Nothing is hidden', 2000); return; }
    if (!unhideArmed) {
      unhideArmed = true; clearTimeout(unhideTimer);
      unhideTimer = setTimeout(function () { unhideArmed = false; renderOpts(); }, 5000);
      renderOpts(); toast('Press OK again to show all ' + hidCount + ' hidden again', 4500); return;
    }
    unhideArmed = false; clearTimeout(unhideTimer);
    hid = {}; hidSave(); odData = {}; odRowsMemo = null; renderOpts();
    toast('Everything is back. The guide catches up after Refresh listings.', 5000);
  }
  var gm = null;
  function gmName(p) { return (p && (p.show || p.group || parseTitle(p.title || '').show || p.title)) || ''; }
  /** Every long-press menu ends with Options. */
  function optsLast(items) {
    var it = null;
    for (var i = items.length - 1; i >= 0; i--) if (items[i].t === 'Options') { it = items.splice(i, 1)[0]; }
    items.push(it || { t: 'Options', sub: 'Settings, help and debug', f: function () { if (gm) gmClose(); if (odm) odmClose(); closeGuide(); openOpts(); } });
  }
  function gmOpen() {
    var c = gChan;
    if (!c) return;
    if (c.status !== 'ready') { toast(c.name + ' is still loading', 2000); return; }
    var b = E.blockAt(c.sched, gFocus);
    if (!b || !b.prog) return;
    var favItems = [
      { t: isFav(c) ? 'Remove channel from favourites' : 'Add channel to favourites', sub: c.n + '  ' + c.name, f: function () { gmClose(); favToggle(c); } },
      { t: favOnly ? 'Show all channels' : 'Show favourites only', sub: favs.length ? favs.length + ' favourite channel' + (favs.length > 1 ? 's' : '') : 'None chosen yet', f: function () { gmClose(); favFilter(); } }
    ];
    var p = b.prog, name = gmName(p), now = Date.now(), live = b.startMs <= now && now < b.endMs;
    var items = [];
    items.push({ t: 'Episodes', sub: 'Open ' + name + ' in On Demand', f: function () {
      gmClose();
      if (odChannels().indexOf(c) < 0) { toast('Nothing on demand for ' + c.name, 3000); return; }
      odOpenUi(true); odJump(c, p);
    } });
    items.push({ t: 'Channel schedule', sub: 'Everything on ' + c.name + ', with times', f: function () { gmClose(); csOpen(c, 'guide'); } });
    items.push({ t: 'Watch from the start', sub: 'Begin this programme at the beginning', f: function () { gmClose(); watchFromGuide(true); } });
    var mlg = { name: name, chan: c };    // favourite shows are kept as the old My list
    items.push({ t: mlHas(mlg) ? 'Remove show from favourites' : 'Add show to favourites', sub: name, f: function () { gmClose(); mlToggle(mlg); } });
    items.push(favItems[0], favItems[1]);
    var ref = window.LINKS && LINKS.parseEp(p.title), film = !!p.filmKey;
    if (ref) items.push({ t: 'Stream next episode', sub: 'Play the next episode of the series', f: function () { gmClose(); gmNext(c, p); } });
    if (ref || film) items.push({ t: 'Try another version', sub: 'Look for a different copy if this one is poor', f: function () { gmClose(); gmAlt(c, p); } });
    if (expOn && adLive().length) {
      items.push({ t: 'Auto play with debrid', sub: 'Find a source with your addons and play it', f: function () { gmClose(); adFromProg(p, c, true); } });
      items.push({ t: 'Find sources', sub: 'Ask your addons and choose from what they find', f: function () { gmClose(); adFromProg(p, c, false); } });
    }
    items.push({ t: 'Info', sub: 'Details, cast and the file it plays', f: function () { gmClose(); openInfo({ prog: p, ch: c }); } });
    items.push({ t: 'Teletext', sub: 'Pages built from your guide', f: function () { gmClose(); ttOpen(100); } });
    items.push({ t: 'Fix artwork & details', sub: film ? 'Look the film up again or choose the right one' : 'Look its artwork and episode details up again', f: function () { gmClose(); gmScrape(c, p, name, film); } });
    items.push({ t: 'Options', sub: 'Settings, help and debug', f: function () { gmClose(); closeGuide(); openOpts(); } });
    items.push({ t: film ? 'Hide this film' : 'Hide this show', sub: 'Take it off this TV (Options > TV Guide > Hidden shows)', f: function () { gmClose(); hideShow(film ? p.title : name, film); } });
    items.push({ t: 'Report a problem', sub: 'Note it in the debug log', f: function () {
      gmClose();
      dlog('REPORT (menu) ch ' + c.n + ' ' + c.name + ' | ' + (p.title || '') + ' | show: ' + name + ' | item: ' + String(p.id || '').split('/')[0] + ' | file: ' + decodeURIComponent(String(p.url || '').replace('https://archive.org/download/', '')));
      toast('Noted in the debug log', 2500);
    } });
    // five items at most on the first screen; everything else sits under More...
    var TOPS = /^(Watch from the start|Episodes|Add show to|Remove show from|Add channel to|Remove channel from)/;
    var first = items.filter(function (x) { return TOPS.test(x.t); }), rest = items.filter(function (x) { return !TOPS.test(x.t); });
    first.sort(function (x, y) { function r(t) { return /^Watch/.test(t) ? 0 : /^Episodes/.test(t) ? 1 : /show/.test(t) ? 2 : 3; } return r(x.t) - r(y.t); });
    var top = { title: name, sub: c.n + '  ' + c.name };
    optsLast(rest);
    items = first;
    items.push({ t: 'More\u2026', sub: 'Channel schedule, Info, Teletext and more', f: function () {
      gm = { items: rest, i: 0, title: name, sub: 'More', parent: gm };
      gmRender();
    } });
    gm = { items: items, i: 0, title: top.title, sub: top.sub };
    gmRender();
    seasonUpdate();
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
      }, Promise.resolve()).then(function () { return ytLoad().then(function (yt) { return all.concat(ytProgs(yt, null)); }); });
    }).then(function (all) {
      var seen = {}, cands = [];
      all.forEach(function (q) {
        if (!q.url || seen[q.url] || blocked(q)) return;
        var same = p.filmKey ? q.filmKey === p.filmKey
          : (function () { var r = LINKS.parseEp(q.title); return r && ref && r.s === ref.s && r.e === ref.e && LIBROUTE.norm(gmName(q)) === name; })();
        if (same) { seen[q.url] = 1; cands.push(q); }
      });
      cands.sort(function (a, b) { return copyScore(b, p.dur) - copyScore(a, p.dur); });     // the likeliest good copy first
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
    if (film) {                                            // a film: open its artwork menu in On Demand (Scrape artwork, Choose the right film)
      gmClose();
      if (odChannels().indexOf(c) < 0) { toast('Nothing on demand for ' + c.name, 3000); return; }
      odOpenUi(true); odJump(c, p, odmOpen);
      return;
    }
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

  function gmClose() { gm = null; $('gmenu').className = 'hidden'; seasonUpdate(); }
  function gmRender() {
    var box = $('gml'); box.textContent = '';
    $('gmt').textContent = gm.title;
    var N = 8, n = gm.items.length;                       // more choices than fit: show eight at a time, following the highlight
    gm.top = Math.max(0, Math.min(gm.top || 0, n - N));
    if (gm.i < gm.top) gm.top = gm.i; else if (gm.i >= gm.top + N) gm.top = gm.i - N + 1;
    $('gms').textContent = gm.sub + (n > N ? '  \u00b7  ' + (gm.i + 1) + ' of ' + n : '') + (gm.top > 0 ? '  \u25b2' : '') + (gm.top + N < n ? '  \u25bc' : '');
    gm.items.forEach(function (it, i) {
      if (i < gm.top || i >= gm.top + N) return;
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
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'ArrowLeft' || k === 'Menu' || k === 'ContextMenu') { if (gm.parent) { gm = gm.parent; gmRender(); } else gmClose(); return; }
    gmRender();
  }


  // ------------------------------------------------------------------ channel schedule (guide menu, OSD, Options)
  // Every programme on one channel for a day, with its start time, like the schedule pages of a real EPG. Day by day:
  // Left / Right change the day, Channel +/- the channel, OK joins what is on or plays a programme from its start.
  var cs = null, csTimer = null;
  function csDayStart(off) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d.getTime(); }
  function csLen(ms) { var m = Math.round(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) : '') : m + ' min'; }
  function csDayName(off) {
    if (off === -1) return 'Yesterday'; if (off === 0) return 'Today'; if (off === 1) return 'Tomorrow';
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(csDayStart(off)).getDay()];
  }
  function csLoad() {
    var from = csDayStart(cs.day), to = csDayStart(cs.day + 1), now = Date.now();
    cs.rows = cs.c.status === 'ready' ? E.blocks(cs.c.sched, from, to).filter(function (b) { return b.endMs > from && b.startMs < to; }) : [];
    cs.i = 0;
    for (var i = 0; i < cs.rows.length; i++) if (cs.rows[i].startMs <= now && now < cs.rows[i].endMs) { cs.i = i; break; }
    if (cs.day !== 0 && cs.rows.length) cs.i = 0;
  }
  function csOpen(c, from) {
    c = c || (cur && cur.ch) || gChan;
    if (!c) return;
    if (c.status !== 'ready') { toast(c.name + ' is still loading', 2000); return; }
    cs = { c: c, day: 0, from: from || '', rows: [], i: 0, top: 0 };
    csLoad(); csRender();
    $('csched').className = '';
    clearInterval(csTimer); csTimer = setInterval(function () { if (cs) csRender(); }, 30000);
  }
  function csClose() { cs = null; clearInterval(csTimer); $('csched').className = 'hidden'; }
  function csRender() {
    var c = cs.c, now = Date.now(), N = window.PHONE ? 4 : 9, n = cs.rows.length;
    $('csnum').textContent = c.n; $('csname').textContent = c.name;
    var d = new Date(csDayStart(cs.day));
    $('csdate').textContent = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] + ' ' + d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
    var tabs = $('cstabs'); tabs.textContent = '';
    [-1, 0, 1].forEach(function (o) {
      var t = document.createElement('b'); t.textContent = csDayName(o); t.className = o === cs.day ? 'on' : '';
      t.addEventListener('click', function () { cs.day = o; csLoad(); csRender(); }); tabs.appendChild(t);
    });
    if (cs.day > 1 || cs.day < -1) { var t2 = document.createElement('b'); t2.className = 'on'; t2.textContent = csDayName(cs.day); tabs.appendChild(t2); }
    if (cs.i < cs.top) cs.top = cs.i; else if (cs.i >= cs.top + N) cs.top = cs.i - N + 1;
    cs.top = Math.max(0, Math.min(cs.top, Math.max(0, n - N)));
    var box = $('cslist'); box.textContent = '';
    if (!n) { var e0 = document.createElement('div'); e0.className = 'csr'; e0.textContent = 'Nothing scheduled'; box.appendChild(e0); }
    cs.rows.forEach(function (b, i) {
      if (i < cs.top || i >= cs.top + N) return;
      var r = document.createElement('div');
      r.className = 'csr' + (b.endMs <= now ? ' past' : '') + (b.startMs <= now && now < b.endMs ? ' now' : '') + (i === cs.i ? ' sel' : '');
      var t = document.createElement('span'); t.className = 't'; t.textContent = fmtTime(b.startMs); r.appendChild(t);
      var nm = document.createElement('span'); nm.className = 'n'; nm.textContent = b.prog.title || '';
      var sub = b.count > 1 ? b.count + ' programmes' : (b.prog.sub || '');
      if (sub) { var s = document.createElement('i'); s.textContent = sub; nm.appendChild(s); }
      r.appendChild(nm);
      var dd = document.createElement('span'); dd.className = 'd'; dd.textContent = csLen(b.endMs - b.startMs); r.appendChild(dd);
      r.addEventListener('click', function () { if (cs.i === i) csAct(); else { cs.i = i; csRender(); } });
      box.appendChild(r);
    });
    $('csfoot').textContent = '';
    ['\u25c4 \u25ba Day', 'Ch +/\u2212 Channel', 'OK ' + (n && cs.rows[cs.i] && cs.rows[cs.i].startMs <= now && cs.rows[cs.i].endMs > now ? 'Watch now' : 'Play from the start'), 'Back'].forEach(function (x) {
      var s = document.createElement('span'); s.textContent = x; $('csfoot').appendChild(s);
    });
  }
  function csAct() {
    var b = cs.rows[cs.i]; if (!b) return;
    var c = cs.c, now = Date.now();
    csClose();
    if (osdOpen) closeOsd();
    if (optsOpen) closeOpts();
    gChan = c; gFocus = b.startMs <= now && now < b.endMs ? now : b.startMs + 1000;
    watchFromGuide();
  }
  function csChannel(d) {
    var list = guideList().filter(function (x) { return x.status === 'ready'; }), i = list.indexOf(cs.c);
    if (!list.length) return;
    cs.c = list[((i < 0 ? 0 : i) + d + list.length) % list.length]; csLoad(); csRender();
  }
  /** Hold OK on a programme in a channel schedule: Auto play with debrid, Find sources, Options. */
  function csMenu() {
    var b = cs.rows[cs.i], c = cs.c;
    if (!b || !b.prog) return;
    var p = b.prog, items = [];
    if (expOn && adLive().length) {
      items.push({ t: 'Auto play with debrid', sub: 'Find a source with your addons and play it', f: function () { gmClose(); csClose(); adFromProg(p, c, true); } });
      items.push({ t: 'Find sources', sub: 'Ask your addons and choose from what they find', f: function () { gmClose(); csClose(); adFromProg(p, c, false); } });
    }
    items.push({ t: 'Options', sub: 'Settings, help and debug', f: function () { gmClose(); csClose(); openOpts(); } });
    gm = { items: items, i: 0, title: gmName(p), sub: fmtTime(b.startMs) + '  ' + c.n + '  ' + c.name };
    gmRender();
  }
  function csKey(k) {
    var n = cs.rows.length;
    if (k === 'ArrowUp') { if (n) cs.i = (cs.i + n - 1) % n; }
    else if (k === 'ArrowDown') { if (n) cs.i = (cs.i + 1) % n; }
    else if (k === 'ArrowLeft' || k === 'Yellow' || k === 'MediaRewind') { if (cs.day > -1) { cs.day--; csLoad(); } }
    else if (k === 'ArrowRight' || k === 'Green' || k === 'MediaFastForward') { if (cs.day < 6) { cs.day++; csLoad(); } }
    else if (k === 'ChannelUp') { csChannel(1); return; }
    else if (k === 'ChannelDown' || k === 'Blue') { csChannel(-1); return; }
    else if (k === 'Enter' || k === ' ') { csAct(); return; }
    else if (k === 'Info' || k === 'Menu' || k === 'ContextMenu') { csMenu(); return; }              // hold OK
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Guide' || k === 'Red') { csClose(); return; }
    csRender();
  }


  // ------------------------------------------------------------------ Experimental: Stremio addons (phase 1)
  // Addons are paste-in links to a Stremio addon (…/manifest.json). They are asked, with the title's IMDb id only,
  // for streams; only plain web links and YouTube are played. Torrents, usenet and archives are never started.

  var expOn = store.get('exp1') === 'on';
  // Experimental: the start-up TV in another look (CSS only, see #splash[data-ld] in index.html). Picked at each start; Classic is the default.
  var LD = [{ id: 'classic', label: 'Classic' }, { id: 'room', label: 'Set in the room' }, { id: 'full', label: 'Whole screen' }, { id: 'mix', label: 'Surprise me' }], ldIdx = 0;
  (function () { var id = store.get('ld1'); for (var i = 0; i < LD.length; i++) if (LD[i].id === id) ldIdx = i; })();
  function applyLd() {
    var t = expOn ? LD[ldIdx].id : 'classic';
    if (t === 'mix') t = Math.random() < 0.5 ? 'room' : 'full';
    var sp = $('splash'); if (sp) sp.setAttribute('data-ld', t);
    var sb = $('standby'); if (sb) sb.setAttribute('data-ld', t);      // the "Please stand by" screen shown while a channel, episode or film loads
  }
  applyLd();
  // Experimental: Interface size. Every size in the page is a multiple of --u (1vh) and --uw (1vw), so one number scales it all.
  var UI = [{ id: 'small', label: 'Small', f: 0.92 }, { id: 'normal', label: 'Normal', f: 1 }, { id: 'large', label: 'Large', f: 1.08 }], uiIdx = 1, uiF = 1;
  (function () { var id = store.get('ui1'); for (var i = 0; i < UI.length; i++) if (UI[i].id === id) uiIdx = i; })();
  function applyUi() {
    uiF = expOn ? UI[uiIdx].f : 1;
    var st = document.documentElement.style;
    if (uiF === 1) { st.removeProperty('--u'); st.removeProperty('--uw'); } else { st.setProperty('--u', uiF + 'vh'); st.setProperty('--uw', uiF + 'vw'); }
    // the guide grid starts 41 units down and each row takes 6.8, so a larger interface fits fewer rows before the last one runs off the screen
    if (!window.PHONE) VISIBLE_ROWS = Math.max(5, Math.min(7, Math.floor((100 / uiF - 46.9) / 6.8)));
  }
  applyUi();
  function changeUi(d) {
    if (!expOn) { toast('Turn Experimental on first', 3000); return; }
    uiIdx = (uiIdx + (d < 0 ? -1 : 1) + UI.length) % UI.length;
    store.set('ui1', UI[uiIdx].id);
    applyUi(); renderOpts();
  }
  function changeLd(d) {
    if (!expOn) { toast('Turn Experimental on first', 3000); return; }
    ldIdx = (ldIdx + (d < 0 ? -1 : 1) + LD.length) % LD.length;
    store.set('ld1', LD[ldIdx].id);
    applyLd(); renderOpts();
    toast('Loading screen: ' + LD[ldIdx].label + '. Every loading screen uses it.', 3000);
  }
  var adLang = store.get('adlang1') || 'en';                 // audio language: en = skip links that say they are in another language, any = take everything
  var adHist = store.get('adhist1') || [];                  // sources that worked, newest first, so a title can start again at once
  var adLast = store.get('adlast1') || {}, adBg = store.get('adbg1') || {};   // the source that last worked per episode (1 hour), and the release group chosen per show
  if (!store.get('adfilm87')) {                     // once: sources saved for films may be the wrong film (the first search result was taken), so forget them
    store.set('adfilm87', 1);
    adHist = adHist.filter(function (h) { return !h.film; }); store.set('adhist1', adHist);
    Object.keys(adLast).forEach(function (k) { if (/\|f$/.test(k)) delete adLast[k]; }); store.set('adlast1', adLast);
  }
  function adKeyOf(g, ep) { return normShow(g.name) + '|' + (g.film ? 'f' : (ep.s || 1) + ':' + (ep.e || 1)); }
  var adFall = null;                                          // the sources still to try if the one playing fails
  var adCut = store.get('adcut1') !== 'off';                 // only titles from before 2000
  var addons = store.get('addons1') || [];
  var ad = null, adTimer = null;
  function adSave() { store.set('addons1', addons); }
  function adLive() { return expOn ? addons.filter(function (a) { return a.on; }) : []; }
  function adTmo(p, ms) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('timeout')); }, ms); p.then(function (x) { clearTimeout(t); res(x); }, function (e) { clearTimeout(t); rej(e); }); }); }
  function adLan(h) { return /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || /\.local$/.test(h); }
  /** What was pasted -> the addon's base web address, or { err }. */
  function adBase(s) {
    s = String(s || '').trim();
    if (!s) return { err: 'Nothing entered' };
    if (s.charAt(0) === '{') return { err: 'Paste the addon’s link (it ends in manifest.json), not the JSON itself' };
    s = s.replace(/^stremio:\/\//i, 'https://');
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    var m = /^(https?):\/\/([^\/?#]+)([^?#]*)/i.exec(s);
    if (!m) return { err: 'That is not a web address' };
    if (m[1].toLowerCase() === 'http') return { err: 'Only https:// addresses are allowed' };
    var path = m[3].replace(/\/manifest\.json$/i, '').replace(/\/+$/, '');
    return { base: m[1].toLowerCase() + '://' + m[2] + path };
  }
  function adRes(a, name) {        // the types / id prefixes an addon offers for one resource, or null
    var out = null;
    (a.resources || []).forEach(function (r) {
      if (typeof r === 'string') { if (r === name) out = { types: a.types || [], pre: a.idPrefixes || null }; }
      else if (r && r.name === name) out = { types: r.types || a.types || [], pre: r.idPrefixes || a.idPrefixes || null };
    });
    return out;
  }
  /** A GET to an addon (any https address the person added); the app's own network code does it, as the page may only reach a few sites. */
  function adHttp(url) {
    if (!(window.NativeHttp && NativeHttp.addonGet)) return http(url);
    return new Promise(function (res, rej) {
      var id = ++reqId;
      pending[id] = { res: res, rej: rej, url: url };
      NativeHttp.addonGet(id, url);
      setTimeout(function () { if (pending[id]) { delete pending[id]; rej(new Error('timeout')); } }, 20000);
    });
  }
  function adFetch(base) {
    return adTmo(adHttp(base + '/manifest.json'), 10000).then(function (t) {
      var m; try { m = JSON.parse(t); } catch (e) { throw new Error('That address did not give an addon'); }
      if (!m || !m.id || !m.name || !Array.isArray(m.resources)) throw new Error('That address did not give an addon');
      return m;
    });
  }
  function adOpen(o) { ad = o; ad.i = o.i || 0; ad.top = 0; adQr(o.qr || ''); $('csched').classList.remove('hidden'); adRender(); }
  function adQr(text) {          // draw a QR code of this text, or hide it
    var cv = $('csqr'), m = text && window.QR ? QR.make(text) : null;
    $('csched').classList.toggle('qr', !!m);
    if (!m) return;
    var n = m.length, q = 2, k = 8, ctx;
    cv.width = cv.height = (n + 2 * q) * k;
    ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.fillStyle = '#000';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (m[r][c]) ctx.fillRect((c + q) * k, (r + q) * k, k, k);
  }
  function adClose() { ad = null; adQr(''); $('csched').className = 'hidden'; }
  function adRender() {
    var N = window.PHONE ? 4 : 9, n = ad.rows.length;
    $('csnum').textContent = ''; $('csname').textContent = ad.title; $('csdate').textContent = ad.sub || ''; $('cstabs').textContent = '';
    if (ad.i < ad.top) ad.top = ad.i; else if (ad.i >= ad.top + N) ad.top = ad.i - N + 1;
    ad.top = Math.max(0, Math.min(ad.top, Math.max(0, n - N)));
    var box = $('cslist'); box.textContent = '';
    if (!n) { var e0 = document.createElement('div'); e0.className = 'csr'; e0.textContent = ad.empty || 'Nothing here'; box.appendChild(e0); }
    ad.rows.forEach(function (b, i) {
      if (i < ad.top || i >= ad.top + N) return;
      var r = document.createElement('div');
      r.className = 'csr' + (b.dim ? ' past' : '') + (i === ad.i ? ' sel' : '');
      var t = document.createElement('span'); t.className = 't'; t.textContent = b.t || ''; r.appendChild(t);
      var nm = document.createElement('span'); nm.className = 'n'; nm.textContent = b.n || '';
      if (b.s) { var s = document.createElement('i'); s.textContent = b.s; nm.appendChild(s); }
      r.appendChild(nm);
      var dd = document.createElement('span'); dd.className = 'd'; dd.textContent = b.d || ''; r.appendChild(dd);
      r.addEventListener('click', function () { if (ad.i === i) adAct(); else { ad.i = i; adRender(); } });
      box.appendChild(r);
    });
    $('csfoot').textContent = '';
    (ad.foot || ['OK Choose', 'Back']).forEach(function (x) { var s = document.createElement('span'); s.textContent = x; $('csfoot').appendChild(s); });
  }
  function adAct() {
    var b = ad.rows[ad.i]; if (!b) return;
    if (b.why) { toast(b.why, 4000); return; }
    if (b.f) b.f();
  }
  function adBack() { if (ad && ad.back) ad.back(); else adClose(); }
  function adnKey(k) {
    var n = ad.rows.length;
    if (k === 'ArrowUp') { if (n) ad.i = (ad.i + n - 1) % n; }
    else if (k === 'ArrowDown') { if (n) ad.i = (ad.i + 1) % n; }
    else if (k === 'Enter' || k === ' ') { adAct(); return; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Guide' || k === 'Red' || k === 'Info') { adBack(); return; }
    adRender();
  }

  // ---- the addon list (Options > Experimental > Addons)
  function adList(keep) {
    var rows = addons.map(function (a, i) {
      return { t: !a.on ? 'Off' : a.bad ? 'Offline' : 'On', n: a.name, s: a.version ? 'v' + a.version : '', d: i === 0 ? 'First' : '#' + (i + 1), f: function () { adMenu(i); } };
    });
    if (window.NativeHttp && NativeHttp.addonInbox) rows.push({ t: '\u2709', n: 'Add from your phone', s: 'easiest: no typing', d: '', f: adPhone });
    rows.push({ t: '+', n: 'Add an addon', s: 'type its link', d: '', f: adAsk });
    adOpen({ title: 'Addons', sub: expOn ? 'Asked in this order' : 'Experimental is off', rows: rows, i: keep == null ? 0 : keep, foot: ['OK Choose', 'Back'], empty: '',
      back: function () { adClose(); if (!optsOpen) openOpts(); else renderOpts(); } });
  }
  /** Saved sources: everything that worked, newest first. OK plays it; if the link has died the app looks again. */
  function adRecent() {
    var ago = function (t) { var m = Math.round((Date.now() - t) / 60000); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; };
    var rows = adHist.map(function (h, i) {
      return { t: h.q ? h.q + 'p' : '\u2014', n: h.name + (h.film ? '' : '  S' + pad2(h.se || 1) + 'E' + pad2(h.ep || 1)), s: (h.deb ? 'debrid \u00b7 ' : '') + h.addon, d: ago(h.t), f: function () {
        var ch = channels.filter(function (c) { return c.id === h.ch; })[0] || (cur && cur.ch) || ready()[0], g = { name: h.name, film: h.film, fk: h.fk || '' }, ep = { s: h.se, e: h.ep };
        adFall = { ch: ch, g: g, ep: ep, q: [], retry: 1, auto: 1 };
        closeOpts(); adClose();
        adPlay(ch, g, ep, { s: h.s, addon: h.addon, label: h.label, q: h.q });
      } };
    });
    if (rows.length) rows.push({ t: '\u2715', n: 'Clear this list', s: '', d: '', f: function () { adHist = []; store.set('adhist1', adHist); adLast = {}; store.set('adlast1', adLast); adRecent(); } });
    adOpen({ title: 'Saved sources', sub: rows.length ? 'OK plays it again' : '', rows: rows, i: 0, foot: ['OK Play', 'Back'], empty: 'Nothing yet. A source is saved each time one plays.',
      back: function () { adClose(); openOpts(); } });
  }
  var adPoll = null;
  function adPhoneStop() { clearInterval(adPoll); adPoll = null; try { NativeHttp.addonStop(); } catch (e) { /* ignore */ } }
  /** The phone route: a small page on the TV's address takes the long link; this screen waits for it. */
  function adPhone() {
    var code = String(1000 + Math.floor(Math.random() * 9000)), addr = '';
    try { addr = NativeHttp.addonInbox(code) || ''; } catch (e) { addr = ''; }
    if (!addr) { toast('The TV is not on a network', 4000); return; }
    var back = function () { adPhoneStop(); adList(addons.length); };
    adOpen({ title: 'Add from your phone', sub: 'same Wi-Fi', back: back, foot: ['Back'], qr: addr + '/?c=' + code, rows: [
      { t: '1', n: 'Scan the code', s: '', d: '', dim: true, f: function () {} },
      { t: '', n: 'or open ' + addr.replace(/^http:\/\//, ''), s: '', d: '', dim: true, f: function () {} },
      { t: '2', n: 'Paste the link, press Send', s: '', d: '', dim: true, f: function () {} },
      { t: '', n: 'Code ' + code + ' is filled in', s: '', d: '', dim: true, f: function () {} }], i: 0 });
    clearInterval(adPoll);
    adPoll = setInterval(function () {
      var l = ''; try { l = NativeHttp.addonTake() || ''; } catch (e) { l = ''; }
      if (!l) return;
      adPhoneStop();
      var b = adBase(l);
      if (b.err) { toast(b.err, 5000); adList(addons.length); return; }
      adOpen({ title: 'Checking the addon\u2026', sub: '', rows: [], empty: 'Asking it for its details\u2026', back: function () { adList(addons.length); } });
      adFetch(b.base).then(function (m) { adPreview(b.base, m); }, function (e) { adFail(b.base, e); });
    }, 1500);
  }
  /** An API key is long, so the phone route comes first: scan the code, tap "Get your key", paste it, Send. The remote keyboard is the second row. */
  var KEYS = { tvdb: { name: 'TheTVDB', row: 'tvdb', set: function (k) { tvdbSetKey(k); }, cur: function () { return tvdbKey; } },
               tmdb: { name: 'TMDB', row: 'tmdb', set: function (k) { tmdbSetKey(k); }, cur: function () { return tmdbKey; } } };
  function keyBack(kind) {
    adPhoneStop(); adClose(); openOpts();
    optsCat = catOfRow(KEYS[kind].row); optsZone = 1; optsSel = OPTS.indexOf(KEYS[kind].row); renderOpts();
  }
  function keyAsk(kind) {
    var K = KEYS[kind], code = String(1000 + Math.floor(Math.random() * 9000)), addr = '';
    var remote = { t: '\u2328', n: 'Type it with the remote instead', s: '', d: '', f: function () {
      adPhoneStop(); adClose();
      kbOpen({ title: K.name + ' key', label: 'Save', value: K.cur(), save: function (key) { K.set(key); keyBack(kind); } });
    } };
    try { addr = NativeHttp.addonInbox(code) || ''; } catch (e) { addr = ''; }
    if (!addr) { adOpen({ title: K.name + ' key', sub: '', back: function () { keyBack(kind); }, foot: ['OK Select', 'Back'], rows: [remote], i: 0 }); return; }
    adOpen({ title: K.name + ' key from your phone', sub: 'same Wi-Fi', back: function () { keyBack(kind); }, foot: ['OK Select', 'Back'], qr: addr + '/?c=' + code + '&k=' + kind, rows: [
      { t: '1', n: 'Scan the code with your phone', s: '', d: '', dim: true, f: function () {} },
      { t: '2', n: 'Tap Get your key, paste it, Send', s: '', d: '', dim: true, f: function () {} },
      remote], i: 2 });
    clearInterval(adPoll);
    adPoll = setInterval(function () {
      var l = ''; try { l = NativeHttp.addonTake() || ''; } catch (e) { l = ''; }
      if (!l) return;
      var key = l.replace(/^(tvdb|tmdb):/, '').trim();
      keyBack(kind);
      K.set(key);
    }, 1500);
  }
  function adAsk() {
    adClose();
    kbOpen({ title: 'Addon link (ends in manifest.json)', label: 'Add', sym: 1, value: '', save: function (txt) {
      if (!txt) { adList(addons.length); return; }
      var b = adBase(txt);
      if (b.err) { toast(b.err, 5000); adList(addons.length); return; }
      adOpen({ title: 'Checking the addon…', sub: b.base, rows: [], empty: 'Asking it for its details…', back: function () { adList(addons.length); } });
      adFetch(b.base).then(function (m) { adPreview(b.base, m); }, function (e) { adFail(b.base, e); });
    } });
  }
  /** Say plainly why an addon could not be added, and stay on screen until Back. */
  function adFail(base, e) {
    var msg = /^HTTP (0|undefined)$/.test(e.message) || e.message === 'timeout' ? 'Could not reach it. Check the link, and that the TV is online.' : /^HTTP \d+/.test(e.message) ? 'The address answered with an error (' + e.message.slice(5) + ')' : e.message;
    dlog('ADDON ADD FAILED ' + base + ' | ' + e.message);
    adOpen({ title: 'Could not add it', sub: base.replace(/^https?:\/\//, '').split('/')[0], rows: [{ t: '!', n: msg, s: '', d: '', dim: true, f: function () {} }, { t: 'Back', n: 'Back to the list', s: '', d: '', f: function () { adList(addons.length); } }], i: 1, back: function () { adList(addons.length); } });
  }
  function adPreview(base, m) {
    var dup = addons.filter(function (a) { return a.base === base; })[0];
    var strm = adRes(m, 'stream'), flags = m.behaviorHints || {};
    var rows = [];
    var why = dup ? 'Already installed' : flags.adult ? 'This addon says it is for adults only; those are not allowed here' : !strm ? 'It has no stream source, so there is nothing to play' : flags.configurationRequired ? 'This addon needs setting up on its own website first' : '';
    rows.push({ t: 'Add', n: 'Install “' + m.name + '”', s: m.version ? 'v' + m.version : '', d: '', dim: !!why, why: why, f: function () {
      addons.push({ base: base, name: m.name, version: m.version || '', on: true, resources: m.resources, types: m.types || [], idPrefixes: m.idPrefixes || null, catalogs: (m.catalogs || []).length });
      adSave(); toast(m.name + ' added', 3000); adList(addons.length - 1); } });
    rows.push({ t: 'Gives', n: strm ? 'Streams for ' + (strm.types.join(', ') || 'anything') : 'No streams', s: '', d: '', dim: true, f: function () {} });
    if (m.description) rows.push({ t: 'About', n: String(m.description).replace(/\s+/g, ' ').slice(0, 140), s: '', d: '', dim: true, f: function () {} });
    rows.push({ t: 'Note', n: 'Only direct web links and YouTube play; torrents never start', s: '', d: '', dim: true, f: function () {} });
    rows.push({ t: 'Back', n: 'Cancel', s: '', d: '', f: function () { adList(addons.length); } });
    adOpen({ title: 'Add this addon?', sub: base.replace(/^https?:\/\//, '').split('/')[0], rows: rows, foot: ['OK Choose', 'Back'], back: function () { adList(addons.length); } });
  }
  function adMenu(i) {
    var a = addons[i], mv = function (d) { return function () { var j = i + d; var x = addons.splice(i, 1)[0]; addons.splice(j, 0, x); adSave(); adList(j); }; };
    var rows = [
      { t: a.on ? 'Off' : 'On', n: a.on ? 'Turn off' : 'Turn on', f: function () { a.on = !a.on; adSave(); adList(i); } },
      { t: 'Up', n: 'Ask it earlier', dim: i === 0, f: i === 0 ? null : mv(-1) },
      { t: 'Down', n: 'Ask it later', dim: i === addons.length - 1, f: i === addons.length - 1 ? null : mv(1) },
      { t: 'Test', n: 'Check it answers', f: function () {
        adTmo(adFetch(a.base), 10000).then(function (m) { a.bad = false; a.version = m.version || a.version; a.resources = m.resources; a.types = m.types || []; a.idPrefixes = m.idPrefixes || null; adSave(); toast(a.name + ' is working', 3000); }, function () { a.bad = true; adSave(); toast(a.name + ' did not answer', 4000); }); } },
      { t: 'Remove', n: 'Remove this addon', f: function () { addons.splice(i, 1); adSave(); adList(Math.max(0, i - 1)); } },
      { t: 'Back', n: 'Back to the list', f: function () { adList(i); } }
    ];
    adOpen({ title: a.name, sub: a.base.replace(/^https?:\/\//, '').split('/')[0], rows: rows.map(function (r) { if (r.dim) r.why = 'Not possible'; return r; }), back: function () { adList(i); } });
  }

  // ---- finding a title's streams
  var adIds = store.get('adid2') || {};
  function adResolve(name, film, year, imdb) {
    if (imdb) return Promise.resolve({ imdb: imdb, year: year || 0 });                       // the film database knows its IMDb number
    var key = normShow(name) + (film ? '|f' + (year || '') : '');
    var ed = !film && epdb && epdb[normShow(name)];                       // the scrapers' own IMDb number beats a name search
    if (ed && ed.imdb) {
      var y0 = 9999; (ed.e || []).forEach(function (e) { var y = +String(e[3] || '').slice(0, 4); if (y && y < y0) y0 = y; });
      return Promise.resolve({ imdb: ed.imdb, year: y0 < 9999 ? y0 : 0 });
    }
    if (adIds[key]) return Promise.resolve(adIds[key]);
    var done = function (r) { if (r && r.imdb) { adIds[key] = r; var ks = Object.keys(adIds); if (ks.length > 300) delete adIds[ks[0]]; store.set('adid2', adIds); } return r; };
    if (!film) {
      return adTmo(getJSON('https://api.tvmaze.com/singlesearch/shows?q=' + encodeURIComponent(name)), 10000).then(function (s) {
        return done({ imdb: (s.externals && s.externals.imdb) || '', year: s.premiered ? +String(s.premiered).slice(0, 4) : 0 });
      }, function () { return null; });
    }
    // films: a title like "Family Plot (1976)" is searched as "Family Plot" and the year used to pick between films of the same name
    var ym = /\s*\((\d{4})\)\s*$/.exec(name), wantYear = ym ? +ym[1] : (year || 0), clean = String(name).replace(/\s*\(\d{4}\)\s*$/, '').trim();
    var searchable = function (c) {
      if (c.type !== 'movie') return false;
      var ex = (c.extra || []).some(function (x) { return x && x.name === 'search'; }) || (c.extraSupported || []).indexOf('search') >= 0 || (c.extraRequired || []).indexOf('search') >= 0;
      return ex;
    };
    var pick = function (metas) {
      var l = (metas || []).filter(function (x) { return /^tt\d+/.test(x.id || ''); });
      var w = normShow(clean), yr = function (x) { return +String(x.releaseInfo || x.year || '').slice(0, 4) || 0; };
      // Only a result that really is this film: the same name, or one name inside the other with the same year. Taking the first result
      // played "Blackadder's Christmas Carol" for "Mickey's Christmas Carol". Nothing found is better than the wrong film.
      var near = function (x) { var n = normShow(x.name || ''); return n && w && (n.indexOf(w) >= 0 || w.indexOf(n) >= 0) && wantYear && yr(x) === wantYear; };
      var hit = l.filter(function (x) { return normShow(x.name || '') === w && (!wantYear || yr(x) === wantYear); })[0] || l.filter(function (x) { return normShow(x.name || '') === w; })[0] || l.filter(near)[0];
      return hit ? { imdb: hit.id, year: yr(hit) } : null;
    };
    var viaAddon = function (a) {
      return adTmo(adHttp(a.base + '/manifest.json'), 8000).then(function (t) {
        var m = JSON.parse(t), cat = (m.catalogs || []).filter(searchable)[0];
        if (!cat) { dlog('ADDON film search: ' + a.name + ' has no movie search catalog'); return null; }
        return adTmo(adHttp(a.base + '/catalog/movie/' + encodeURIComponent(cat.id) + '/search=' + encodeURIComponent(clean) + '.json'), 8000).then(function (t2) {
          var r = pick(JSON.parse(t2).metas); dlog('ADDON film search: ' + a.name + ' for "' + clean + '" -> ' + (r ? r.imdb : 'nothing')); return r;
        });
      }).catch(function (e) { dlog('ADDON film search failed: ' + a.name + ' | ' + (e && e.message)); return null; });
    };
    var viaCinemeta = function () {
      return adTmo(adHttp('https://v3-cinemeta.strem.io/catalog/movie/top/search=' + encodeURIComponent(clean) + '.json'), 10000).then(function (t) {
        var r = pick(JSON.parse(t).metas); dlog('CINEMETA film search for "' + clean + '" -> ' + (r ? r.imdb : 'nothing')); return r;
      }).catch(function (e) { dlog('CINEMETA film search failed | ' + (e && e.message)); return null; });
    };
    return pool(adLive(), 3, viaAddon).then(function (l) { return (l || []).filter(Boolean)[0] || viaCinemeta(); }).then(done);
  }
  function adQuality(s) { var t = (s.name || '') + ' ' + (s.title || '') + ' ' + (s.description || ''); return /2160p|\b4k\b|uhd/i.test(t) ? 2160 : /1080/.test(t) ? 1080 : /720/.test(t) ? 720 : /480|\bsd\b/i.test(t) ? 480 : 0; }
  function adSize(s) {
    var t = (s.title || '') + ' ' + (s.description || ''), m = /(\d+(?:\.\d+)?)\s*(GB|MB)/i.exec(t);
    if (m) return m[2].toUpperCase() === 'GB' ? +m[1] * 1024 : +m[1];
    var b = s.behaviorHints && s.behaviorHints.videoSize; return b ? b / 1048576 : 0;
  }
  /** Which spoken languages a stream says it has, from the flags and words addons put in its text: {en: bool, other: ['French', ...]}. Nothing said = unknown. */
  var AD_FLAGS = { '🇬🇧': 'en', '🇺🇸': 'en', '🇦🇺': 'en', '🇨🇦': 'en', '🇫🇷': 'French', '🇩🇪': 'German', '🇮🇹': 'Italian', '🇪🇸': 'Spanish', '🇲🇽': 'Spanish', '🇵🇹': 'Portuguese', '🇧🇷': 'Portuguese', '🇷🇺': 'Russian', '🇯🇵': 'Japanese', '🇰🇷': 'Korean', '🇨🇳': 'Chinese', '🇮🇳': 'Hindi', '🇵🇱': 'Polish', '🇳🇱': 'Dutch', '🇹🇷': 'Turkish', '🇸🇪': 'Swedish', '🇺🇦': 'Ukrainian', '🇨🇿': 'Czech', '🇷🇴': 'Romanian', '🇬🇷': 'Greek', '🇸🇦': 'Arabic' };
  var AD_WORDS = [[/\b(french|vostfr|vff|vfq|truefrench|fran[cç]ais)\b/i, 'French'], [/\b(german|deutsch|ger)\b/i, 'German'], [/\b(italian|ita)\b/i, 'Italian'], [/\b(spanish|castellano|latino)\b/i, 'Spanish'], [/\b(portuguese|dublado)\b/i, 'Portuguese'], [/\b(russian|rus|rusub|lostfilm|kerob|hdrezka|rezka|newstudio|alexfilm|jaskier|baibako|coldfilm|kubik|kinozal|rutor|rutracker|nnmclub|toloka|dub(?:bed)?\s*ru|ru\s*dub|sub\s*ru)\b/i, 'Russian'], [/[\u0400-\u04FF]/, 'Russian'], [/\b(hindi|tamil|telugu)\b/i, 'Hindi'], [/\b(japanese|jpn)\b/i, 'Japanese'], [/\b(korean|kor)\b/i, 'Korean'], [/\b(chinese|mandarin|cantonese)\b/i, 'Chinese'], [/\b(polish|pl|pldub|pl[ ._-]?dub|dub[ ._-]?pl|lektor|napisy|polskie)\b/i, 'Polish'], [/\b(dutch)\b/i, 'Dutch'], [/\b(turkish)\b/i, 'Turkish'], [/\b(arabic)\b/i, 'Arabic']];
  var adCurTitle = '';                                      // the title being searched: its own words ("The Italian Job") are not a language
  function adLangs(s) {
    var t = (s.name || '') + ' ' + (s.title || '') + ' ' + (s.description || '') + ' ' + ((s.behaviorHints && s.behaviorHints.filename) || ''), en = false, other = [];
    if (adCurTitle) { var tw = adCurTitle.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).join('[ ._-]+'); if (tw) t = t.replace(new RegExp(tw, 'ig'), ' '); }
    Object.keys(AD_FLAGS).forEach(function (f) { if (t.indexOf(f) >= 0) { if (AD_FLAGS[f] === 'en') en = true; else if (other.indexOf(AD_FLAGS[f]) < 0) other.push(AD_FLAGS[f]); } });
    if (/\b(english|eng|en)\b|multi|dual.?audio|\bdual\b/i.test(t.replace(/\bpl\b/ig, ''))) en = true;
    AD_WORDS.forEach(function (w) { if (w[0].test(t) && other.indexOf(w[1]) < 0) other.push(w[1]); });
    return { en: en, other: other };
  }
  /** A link an addon made through the person's debrid account: Torrentio-style "[RD+]" tags, or the service named. */
  function adIsDebrid(s) {
    var t = (s.name || '') + ' ' + (s.title || '') + ' ' + (s.description || '');
    return /\[(RD|AD|PM|DL|TB|OC|ED|PP|DR)[^\]]{0,12}\]|real.?debrid|all.?debrid|premiumize|debrid.?link|torbox|offcloud|easydebrid|debrid/i.test(t);
  }
  /** A debrid link the service has not downloaded yet (it would sit on a "please wait" video). */
  function adUncached(s) {
    var t = (s.name || '') + ' ' + (s.title || '') + ' ' + (s.description || '');
    return adIsDebrid(s) && /\[(RD|AD|PM|DL|TB|OC|ED|PP|DR)\s*(download|\u2193)\]|not cached|uncached|\bdownload\b.*\bdebrid|\u2193/i.test(t);
  }
  /** Can this stream be played here? '' = yes, otherwise why not. */
  function adWhy(s) {
    if (s.url && /^https?:\/\//i.test(s.url)) {
      if (s.behaviorHints && s.behaviorHints.proxyHeaders) return 'Needs special request headers (not supported yet)';
      if (adUncached(s)) return 'Not on the debrid service yet (it would have to download first)';
      if (adLang === 'en') { var L = adLangs(s); if (!L.en && L.other.length) return L.other[0] + ' audio (Audio language: English only)'; }
      return '';
    }
    if (s.ytId) return '';
    if (s.infoHash) return 'Torrent: not supported here';
    if (s.nzbUrl) return 'Usenet: not supported here';
    if (s.rarUrls || s.zipUrls || s.tgzUrls || s.tarUrls || s['7zipUrls']) return 'Archive: not supported here';
    if (s.externalUrl) return 'Opens a website: not supported here';
    return 'Not something this TV can play';
  }
  /** auto: play the best link by itself (Auto play with debrid); otherwise just list what the addons found and let the person choose (Find sources). */
  /** Does this link belong to the release group (bingeGroup) that played this show last time? */
  function adBgOf(x, g) { var h = x.s.behaviorHints, w = adBg[normShow(g.name)]; return !!(w && h && h.bingeGroup === w); }
  /** The one order for addon links, used by Find sources and by Use addons as a main source: links with a problem last, then the
   *  audio language (English only, then says nothing, then English plus other tracks), the same release group as last time, 1080p over 720p. */
  function adRank(all, g) {
    var pref = function (q) { return q === 1080 ? 3 : q === 720 ? 2 : 1; };
    var lang = function (x) { var L = adLangs(x.s); return L.en ? (L.other.length ? 0 : 2) : 1; };
    return all.map(function (x, k) { x.k = k; return x; }).sort(function (a, b) {
      if (!!a.why !== !!b.why) return a.why ? 1 : -1;
      return (adLang === 'en' ? lang(b) - lang(a) : 0) || (adBgOf(b, g) ? 1 : 0) - (adBgOf(a, g) ? 1 : 0) || pref(b.q) - pref(a.q) || a.k - b.k;
    });
  }
  function adSources(g, ep, noCache, chOv, auto) {
    var name = g.name, film = !!g.film, ch = chOv || g.chan || odSel().c;
    adCurTitle = String(name || '');
    var live = adLive();
    var hit = auto && !noCache && adLast[adKeyOf(g, ep)];
    if (hit && Date.now() - hit.t < 259200000) {                 // the same source worked in the last three days: straight back to it (if it has died, the next lines look again)
      adFall = { ch: ch, g: g, ep: ep, q: [], retry: 1, auto: 1 };
      toast('Playing the source that worked last time', 3000);
      adPlay(ch, g, ep, { s: hit.s, addon: hit.addon, label: hit.label }); return;
    }
    if (!live.length) { toast('No addon is on (Options > Experimental > Addons)', 4000); return; }
    adOpen({ title: name, sub: film ? 'Finding sources…' : 'S' + pad2(ep.s || 1) + 'E' + pad2(ep.e || 1) + '  ·  finding sources…', rows: [], empty: 'Looking up the title…', back: adClose });
    adResolve(odArtName ? odArtName(g) : name, film, film ? (g.year || (g.eps && g.eps[0] && filmYear(g.eps[0].p)) || 0) : 0, g.imdb || (g.eps && g.eps[0] && g.eps[0].p && g.eps[0].p.imdb)).then(function (r) {
      if (!ad) return;
      if (!r || !r.imdb) { ad.rows = []; ad.empty = film ? 'Could not find this film in the film search (check the TV is online).' : 'Could not find this show’s IMDb number'; ad.sub = ''; adRender(); return; }
      if (adCut && r.year && r.year >= 2000) { ad.rows = []; ad.empty = 'From ' + r.year + ': not allowed while “Only before 2000” is on'; ad.sub = ''; adRender(); return; }
      var id = film ? r.imdb : r.imdb + ':' + (ep.s || 1) + ':' + (ep.e || 1), type = film ? 'movie' : 'series';
      var all = [], asked = 0, answered = 0;
      var targets = live.filter(function (a) { var s = adRes(a, 'stream'); return s && s.types.indexOf(type) >= 0 && (!s.pre || s.pre.some(function (p) { return id.indexOf(p) === 0; })); });
      if (!targets.length) { ad.rows = []; ad.empty = 'None of your addons give streams for ' + (film ? 'films' : 'shows'); adRender(); return; }
      var bgOf = function (x) { return adBgOf(x, g); };
      var show = function (final) {
        if (!ad) return;
        var list = adRank(all, g);
        ad.rows = list.map(function (x) {
          return { t: x.q ? x.q + 'p' : '—', n: (function () { var L = adLangs(x.s); return (L.other.length && !L.en ? '[' + L.other[0].slice(0, 2).toUpperCase() + '] ' : '') + x.label; })(), s: x.addon, d: x.size ? (x.size >= 1024 ? (x.size / 1024).toFixed(1) + ' GB' : Math.round(x.size) + ' MB') : '', dim: !!x.why, why: x.why,
            f: function () { adFall = { ch: ch, g: g, ep: ep, q: list.filter(function (y) { return !y.why && y !== x && list.indexOf(y) > list.indexOf(x); }), auto: auto }; adPlay(ch, g, ep, x); } };
        });
        ad.sub = (film ? '' : 'S' + pad2(ep.s || 1) + 'E' + pad2(ep.e || 1) + '  ·  ') + (final ? list.length + ' found' : 'asking ' + (targets.length - answered) + ' addon' + (targets.length - answered === 1 ? '' : 's') + '…');
        ad.empty = final ? 'Nothing found. Try another addon.' : 'Asking your addons…';
        adRender();
        var q0 = auto && !ad.auto ? list.filter(function (x) { return !x.why; }) : [];
        if (q0.length && (final || bgOf(q0[0]) || q0[0].q === 1080)) {    // a good one has arrived: no need to wait for the slow addons
          var q = q0;
          ad.auto = 1;
          if (q.length) { adFall = { ch: ch, g: g, ep: ep, q: q.slice(1), auto: 1 }; adPlay(ch, g, ep, q[0]); toast('Playing the best source: ' + q[0].addon, 3500); }
        }
      };
      targets.forEach(function (a) {
        adTmo(adHttp(a.base + '/stream/' + type + '/' + encodeURIComponent(id).replace(/%3A/g, ':') + '.json'), 8000).then(function (t) {
          var ss = (JSON.parse(t).streams || []);
          a.bad = false;
          ss.slice(0, 40).forEach(function (s) {
            var label = String(s.title || s.description || s.name || 'Stream').split('\n')[0].slice(0, 90);
            all.push({ s: s, q: adQuality(s), size: adSize(s), why: adWhy(s), label: label, addon: a.name });
          });
        }).catch(function () { a.bad = true; }).then(function () { answered++; adSave(); show(answered >= targets.length); });
      });
    });
  }
  function adPlay(ch, g, ep, x, offset) {
    var s = x.s, url = s.ytId ? 'yt:' + s.ytId : s.url;
    var fk = g.fk || (g.film && g.eps && g.eps[0] && g.eps[0].p && g.eps[0].p.filmKey) || '';   // the library's own film record: Info and artwork come from it, not from a TV show search
    var prog = { id: 'addon/' + x.addon + '/' + (g.name || ''), item: 'addon', url: url, title: g.name + (g.film ? '' : ' S' + pad2(ep.s || 1) + 'E' + pad2(ep.e || 1)), sub: x.addon, dur: 0, lenKnown: 0, show: g.name, group: g.name, addon: 1, afilm: !!g.film, q: x.q || adQuality(s) };
    if (g.film && fk) { prog.filmKey = fk; prog.cert = (filmFor(prog) || {}).cert || ''; }
    var bgp = s.behaviorHints && s.behaviorHints.bingeGroup;
    if (bgp) { adBg[normShow(g.name)] = bgp; store.set('adbg1', adBg); }
    adLast[adKeyOf(g, ep)] = { t: Date.now(), s: s, addon: x.addon, label: x.label };
    var lk = Object.keys(adLast); if (lk.length > 150) { lk.sort(function (a, b) { return adLast[a].t - adLast[b].t; }); delete adLast[lk[0]]; }
    store.set('adlast1', adLast);
    // the record of what worked: one line per title, newest first, so "Saved sources" can start it again
    var hk = adKeyOf(g, ep);
    adHist = adHist.filter(function (h) { return h.k !== hk; });
    adHist.unshift({ k: hk, name: g.name, film: !!g.film, fk: g.film ? fk : '', se: ep.s || 0, ep: ep.e || 0, ch: ch && ch.id, addon: x.addon, label: x.label, q: x.q || 0, deb: adIsDebrid(s) ? 1 : 0, t: Date.now(), s: s });
    if (adHist.length > 100) adHist.length = 100;
    store.set('adhist1', adHist);
    adClose(); if (odm) odmClose();
    if (guideOpen) closeGuide();
    if (osdOpen) closeOsd();
    if (odOpen) odClose(false);                               // the picture must not stay hidden behind On Demand
    dlog('ADDON PLAY ' + x.addon + ' | ' + x.label + ' | ' + url);
    odStart(ch, [{ p: prog, s: 0, e: 0 }], 0, offset || 0, '');
  }
  // ---- Use addons as a main source (Options > Experimental): every programme with an episode number, and every film,
  // is first looked up with the addons and played from the best link; the library's own link is the fallback.
  var amOn = store.get('am1') === 'on', amSkip = false, amPre = null, amMsg = false;   // amMsg: the 'Scraping your debrid' message is on screen
  // While a programme is being found, the "Please stand by" screen is already up with what is happening on its last line, so the one
  // screen stays from the press of OK until the picture plays (it does not swap to a second screen when the video starts loading).
  var amSplash = false, amSplashT = 0;
  // the last line of the "Please stand by" screen says what step it is on, and after 8 s how long it has been
  var sbWaitT0 = 0, sbWaitBase = '', sbWaitTimer = null;
  function sbStage(msg) {
    sbWaitBase = msg; if (!sbWaitT0) sbWaitT0 = Date.now();
    $('sbfoot').textContent = msg;
    if (!sbWaitTimer) sbWaitTimer = setInterval(function () {
      if ($('standby').className === 'hidden') { sbStageEnd(); return; }       // the screen has gone: stop counting
      var n = Math.round((Date.now() - sbWaitT0) / 1000);
      $('sbfoot').textContent = sbWaitBase + (n >= 8 ? '  \u00b7  ' + n + ' sec' : '');
    }, 1000);
  }
  function sbStageEnd() { clearInterval(sbWaitTimer); sbWaitTimer = null; sbWaitT0 = 0; $('sbfoot').textContent = 'This channel is loading'; }
  function amActive() { return amOn && expOn && adLive().length > 0; }
  function amNote(msg) {
    amMsg = true;
    if (!started || !cur || cur.ad) { toast(msg, 15000); return; }
    applyLd();                                                   // Surprise me picks again for each one
    renderStandby(true);
    sbStage(msg);
    $('standby').classList.remove('hidden');
    amSplash = true;
    clearTimeout(amSplashT); amSplashT = setTimeout(function () { amNoteOff(); }, 40000);
  }
  /** The lookup is over. With a next step the screen stays up on it, still counting, until the picture plays. */
  function amNoteOff(next) {
    amMsg = false; clearTimeout(amSplashT);
    if (amSplash) { amSplash = false; if (next) sbStage(next); }
    toast('', 1);
  }
  function amReq(p) {
    if (!p || p.ad || p.adBlock || p.addon || p.song) return null;
    var ref = window.LINKS && LINKS.parseEp(p.title), film = !!(p.filmKey || p.afilm);
    if (!film && !ref) return null;
    var name = film && p.filmKey ? (filmFor(p) || {}).title || gmName(p) : gmName(p);
    return { g: { name: String(name).replace(/\s*\(\d{4}\)\s*$/, ''), film: film, fk: film ? p.filmKey || '' : '', year: film ? filmYear(p) : 0, imdb: p.imdb || '' }, ep: ref ? { s: ref.s, e: ref.e } : {} };
  }
  /** Ask the addons without any screen of their own: resolves with the usable sources, best first (empty when none). */
  function amScrape(g, ep, ms) {
    return new Promise(function (resolve) {
      var done = false, finish = function (list) { if (!done) { done = true; resolve(list || []); } };
      setTimeout(function () { finish([]); }, ms || 15000);
      var hit = adLast[adKeyOf(g, ep)];
      if (hit && Date.now() - hit.t < 259200000) { finish([{ s: hit.s, addon: hit.addon, label: hit.label, q: 0 }]); return; }
      adCurTitle = String(g.name || '');
      var film = !!g.film, live = adLive();
      adResolve(g.name, film, film ? (g.year || 0) : 0, g.imdb).then(function (r) {
        if (!r || !r.imdb || (adCut && r.year && r.year >= 2000)) { finish([]); return; }
        var id = film ? r.imdb : r.imdb + ':' + (ep.s || 1) + ':' + (ep.e || 1), type = film ? 'movie' : 'series';
        var targets = live.filter(function (a) { var x = adRes(a, 'stream'); return x && x.types.indexOf(type) >= 0 && (!x.pre || x.pre.some(function (q) { return id.indexOf(q) === 0; })); });
        if (!targets.length) { finish([]); return; }
        var all = [], answered = 0;
        targets.forEach(function (a) {
          adTmo(adHttp(a.base + '/stream/' + type + '/' + encodeURIComponent(id).replace(/%3A/g, ':') + '.json'), 8000).then(function (t) {
            (JSON.parse(t).streams || []).slice(0, 40).forEach(function (s) {
              all.push({ s: s, q: adQuality(s), size: adSize(s), why: adWhy(s), label: String(s.title || s.description || s.name || 'Stream').split('\n')[0].slice(0, 90), addon: a.name });
            });
          }).catch(function () { /* this addon did not answer */ }).then(function () {
            answered++;
            var l = adRank(all, g).filter(function (x) { return !x.why; });
            if (l.length && (answered >= targets.length || l[0].q === 1080 || adBgOf(l[0], g))) finish(l);
            else if (answered >= targets.length) finish([]);
          });
        });
      }, function () { finish([]); });
    });
  }
  var joinOn = store.get('join1') === 'on';
  var vSkips = 0;
  /** The stored YouTube copy of one episode (show, season, episode), the likeliest good one first; null when there is none. */
  function ytFind(ref) {
    return ytLoad().then(function (data) {
      var want = LIBROUTE.norm(ref.show || ''), best = null, bs = -1e9;
      ytProgs(data, null).forEach(function (p) {
        if (LIBROUTE.norm(p.show || '') !== want) return;
        var r = window.LINKS && LINKS.parseEp(p.title);
        if (!r || r.s !== ref.s || r.e !== ref.e) return;
        var sc = copyScore(p, 0);
        if (sc > bs) { bs = sc; best = p; }
      });
      return best;
    });
  }
  /** A virtual episode no addon had: remember that, and go to the next programme (a real one after a few misses in a row). */
  function vMiss(ch, index, prog, announce) {
    var me = cur, skip = function () {
      if (cur === me && me && me.od) {                  // picked in On Demand: say so, do not play a different show
        amNoteOff('');
        dlog('MAGIC EPG: no source for ' + prog.title + ' (picked in On Demand, staying put)');
        try { v.pause(); } catch (e) { /* nothing playing */ }
        toast('No source found for ' + prog.title, 4000);
        odOpenUi(true);
        return;
      }
      amNoteOff('Moving on to the next programme\u2026');
      markSlow(prog.id); vSkips++;
      dlog('MAGIC EPG: no source for ' + prog.title);
      toast('No source for ' + prog.title + ', moving on', 3000);
      var n = ch.sched.order.length, j = (index + 1) % n;
      if (vSkips >= 3) { for (var t = 0; t < n && ch.sched.order[j].virtual; t++) j = (j + 1) % n; vSkips = 0; }
      playSlot(ch, j, 0, announce, false);
    };
    // no addon had it: archive.org may (the same lookup Play Next uses, for this exact episode)
    var ref = window.LINKS && LINKS.parseEp(prog.title);
    if (!ref) { skip(); return; }
    var skipAr = skip;
    skip = function () {                                         // addon, then archive.org, then YouTube
      if (cur !== me) return;
      if (!ytAvailable() || !ytOn) { skipAr(); return; }
      amNote('Not on archive.org, trying YouTube\u2026');
      ytFind(ref).then(function (yp) {
        if (cur !== me) return;
        if (!yp) { skipAr(); return; }
        amNoteOff('Found it on YouTube, starting\u2026'); vSkips = 0;
        dlog('MAGIC EPG: YouTube copy for ' + prog.title + ' | ' + yp.url);
        amSkip = true;
        try { playSlot(ch, index, 0, announce, false, Object.assign({}, yp, { title: prog.title, show: prog.show, group: prog.group })); }
        finally { amSkip = false; }
      }, skipAr);
    };
    amNote('No addon had it, trying archive.org\u2026');
    var k = LINKS.key(ref.show, ref.s, ref.e);
    var look = LINKS.get(k).then(function (hit) { return hit || searchAndSave(ref, '', k).then(function () { return LINKS.get(k); }); });
    Promise.race([look, new Promise(function (res) { setTimeout(function () { res(null); }, 25000); })]).then(function (hit) {
      if (cur !== me) return;                                    // the viewer changed channel meanwhile
      var url = hit && (E.canonicalUrl(hit.url) || hit.url);
      if (!url) { skip(); return; }
      probeUrl(url, 15000).then(function (ok) {
        if (cur !== me) return;
        if (!ok) { skip(); return; }
        amNoteOff('Found it on archive.org, starting\u2026'); vSkips = 0;
        dlog('MAGIC EPG: archive.org link for ' + prog.title);
        amSkip = true;
        try { playSlot(ch, index, 0, announce, false, { id: hit.id || prog.id, item: hit.item || 'archive', url: url, title: prog.title, sub: '', dur: hit.dur || prog.dur, show: prog.show, group: prog.group, aired: prog.aired }); }
        finally { amSkip = false; }
      });
    }, skip);
  }
  /** Play the library's own link (the fallback), carrying On Demand's place in its list when there was one. */
  function amFallback(lib, why) {
    var vp = lib.po || (lib.ch.sched && lib.ch.sched.order[lib.index]);
    if (vp && vp.virtual) { vMiss(lib.ch, lib.index, vp, !!lib.announce); return; }     // a Magic EPG episode has no library file: archive.org, else on
    amNoteOff('Playing the library copy\u2026');
    dlog('ADDONS MAIN SOURCE: ' + why + ', playing the library link');
    amSkip = true;
    var od = lib.me && lib.me.od;
    try { playSlot(lib.ch, lib.index, lib.offset, !!lib.announce, !!lib.tuning, lib.po); if (od && cur) cur.od = od; }
    finally { amSkip = false; }
  }
  /** Called at the top of playSlot: true when the addons are going to be tried first (the library plays only if they fail). */
  function amTake(ch, index, offset, announce, tuning, po, prog) {
    if (amSkip || !(amActive() || depgActive())) return false;          // Magic EPG: every episode and film is looked up with the addons first
    var rq = amReq(prog);
    if (!rq) return false;
    var lib = { ch: ch, index: index, offset: offset, announce: announce, tuning: tuning, po: po };
    cur = { ch: ch, index: index, prog: prog, errors: 0, amWait: 1 };
    var me = cur; lib.me = me;                                   // On Demand saves its place on this (odStart does it just after playSlot returns)
    try { v.pause(); } catch (e) { /* nothing was playing */ }
    store.set('last', ch.id);
    if (announce) showBanner();
    var pre = amPre && amPre.k === adKeyOf(rq.g, rq.ep) ? amPre : null; amPre = null;
    var go = function (list) {
      if (cur !== me) return;                                  // the viewer changed channel while it was looking
      if (!list.length) { if (prog && prog.virtual) { vMiss(ch, index, prog, announce); return; } amFallback(lib, 'no source found'); return; }
      amNoteOff('Found a source, starting\u2026');
      adFall = { ch: ch, g: rq.g, ep: rq.ep, q: list.slice(1), auto: 0, lib: lib };
      vSkips = 0;
      dlog('ADDONS MAIN SOURCE: ' + rq.g.name + ' | ' + list[0].addon);
      var jo = joinOn && offset > 30 ? Math.round(offset) : 0;                // Join in progress: where the clock says the programme has got to
      if (jo) dlog('ADDONS MAIN SOURCE: joining ' + rq.g.name + ' at ' + jo + 's');
      adPlay(ch, rq.g, rq.ep, list[0], jo);
      if (cur && cur.prog && cur.prog.addon) { if (me.od) cur.od = me.od; else cur.am = { ch: ch, index: index }; }
    };
    if (pre) { go(pre.list); return true; }
    amNote('Scraping your debrid\u2026');
    amScrape(rq.g, rq.ep).then(go, function () { go([]); });
    return true;
  }
  /** Find sources and auto play for a programme from the guide or the one playing (the OSD bar and the guide's hold-OK menu). */
  function adFromProg(p, ch, auto) {
    if (!p) return;
    if (!expOn || !adLive().length) { toast('Turn on Experimental and an addon first (Options > Experimental)', 4000); return; }
    var ref = window.LINKS && LINKS.parseEp(p.title), film = !!(p.filmKey || p.afilm);
    if (!film && !ref) { toast('This needs an episode number or a film', 3500); return; }
    var name = film && p.filmKey ? (filmFor(p) || {}).title || gmName(p) : gmName(p);
    adSources({ name: String(name).replace(/\s*\(\d{4}\)\s*$/, ''), film: film, fk: film ? p.filmKey || '' : '', year: film ? filmYear(p) : 0 }, ref ? { s: ref.s, e: ref.e } : {}, !!p.addon, ch, !!auto);
  }
  /** On Demand's hold-OK menu: add "Find sources" when Experimental is on and an addon is on. */
  function adOdm(g) {
    if (!odm || !adLive().length) return;
    var ep = (odView === 'show' && g.sea && g.sea[odSea] && g.sea[odSea].eps[odEi] && g.sea[odSea].eps[odEi].p) || (g.flat && g.flat[0] && g.flat[0].p) || {};
    odm.items.splice(2, 0,
      { t: 'Auto play with debrid', sub: 'Find a source with your addons and play it', f: function () { odmClose(); adSources(g, { s: ep.s, e: ep.e }, false, null, true); } },
      { t: 'Find sources', sub: 'Ask your addons and choose from what they find', f: function () { odmClose(); adSources(g, { s: ep.s, e: ep.e }, false, null, false); } });
  }
  function changeExp() { expOn = !expOn; store.set('exp1', expOn ? 'on' : 'off'); applyUi(); applyLd(); dbgOpenApply(); renderOpts(); }
  function changeLang() { adLang = adLang === 'en' ? 'any' : 'en'; store.set('adlang1', adLang); renderOpts(); }
  var dbgOpen = store.get('dbgopen1') === 'on';
  function dbgOpenApply() { try { if (window.NativeHttp && NativeHttp.debugOpen) NativeHttp.debugOpen(true); } catch (e) { /* older app */ } }
  dbgOpenApply();
  function changeDbgOpen() { dbgOpen = !dbgOpen; store.set('dbgopen1', dbgOpen ? 'on' : 'off'); dbgOpenApply(); renderOpts(); toast(dbgOpen ? 'Debug address: no code. Open the debug log again to see it.' : 'Debug address: code back on', 3500); }
  function changeAdcut() { adCut = !adCut; store.set('adcut1', adCut ? 'on' : 'off'); renderOpts(); }

  // ------------------------------------------------------------------ Teletext (pages the app builds from its own guide)
  var tt = null;
  var TTP = window.TTPages({ ready: ready, channels: channels, E: E, fmtTime: fmtTime, gmName: gmName, http: http, pad2: pad2, filmFor: filmFor, blocked: blocked });
  var T = TTP.T, ttAscii = TTP.ttAscii, ttPad = TTP.ttPad, ttPages = TTP.ttPages, ttBuild = TTP.ttBuild, ttWeather = TTP.ttWeather, ttWxPages = TTP.ttWxPages, ttNews = TTP.ttNews, ttNewsPages = TTP.ttNewsPages;
  function ttOpen(n) {
    if (!T()) return;
    tt = { num: 0, sub: 0, pages: null, links: [], li: 0, hist: [], pad: null };
    $('tt').className = '';
    ttGo(n || 100, true);
    clearInterval(tt.timer);
    tt.timer = setInterval(function () {
      if (!tt || tt.pad || !tt.pages || tt.pages.length < 2) return;
      tt.sub = (tt.sub + 1) % tt.pages.length; ttDraw();
    }, 8000);
  }
  function ttClose() { $('ttq').className = 'hidden'; if (tt) { clearInterval(tt.timer); } tt = null; $('tt').className = 'hidden'; }
  function ttGo(n, noHist) {
    if (n === 300 || n === 301 || n === 310) {
      if (!noHist && tt.num) tt.hist.push(tt.num);
      tt.num = n; tt.sub = 0; tt.li = 0;
      tt.pages = ttPages(n, n === 310 ? ' NEWS' : ' WEATHER', ['', '{y}One moment, loading\u2026'], [100, 300, 310, 120]);
      ttDraw();
      (n === 310 ? ttNews().then(ttNewsPages) : ttWeather().then(function (j) { return ttWxPages(n, j); })).then(function (pg) {
        if (tt && tt.num === n) { tt.pages = pg; tt.sub = 0; tt.li = 0; ttDraw(); }
      }, function () {
        if (tt && tt.num === n) { tt.pages = ttPages(n, ' NOT AVAILABLE', ['', '{r}Could not load this page.', '{w}Check the TV is online and try again.'], [100, 300, 310, 120]); tt.sub = 0; ttDraw(); }
      });
      return;
    }
    var pg = ttBuild(n);
    if (!pg) { toast('Page ' + n + ' is not available', 2500); return; }
    if (!noHist && tt.num) tt.hist.push(tt.num);
    tt.num = n; tt.pages = pg; tt.sub = 0; tt.li = 0;
    ttDraw();
  }
  function ttDraw() {
    var pg = tt.pages[tt.sub], cv = $('ttc');
    tt.links = T().links(pg).filter(function (l) { return !(pg.acts && pg.acts[l.row]); });
    Object.keys(pg.acts || {}).forEach(function (r) { tt.links.push({ row: +r, c0: 0, c1: 40, act: pg.acts[r] }); });
    tt.links.sort(function (a, b) { return a.row - b.row || a.c0 - b.c0; });
    if (tt.li >= tt.links.length) tt.li = 0;
    T().draw(cv, pg, true);
    T().mark(cv, tt.links[tt.li]);
  }
  function ttPadRender() {
    var el = $('ttpad');
    if (!tt || !tt.pad) { el.className = 'hidden'; return; }
    var p = tt.pad, keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Del', '0', 'Go'], h = '<div id="ttpn">P' + (p.d + '___').slice(0, 3) + '</div>';
    keys.forEach(function (k, i) { h += '<b class="' + (i === p.i ? 'sel' : '') + '" data-k="' + k + '">' + k + '</b>'; });
    el.innerHTML = h; el.className = '';
  }
  function ttPadPress(k) {
    var p = tt.pad;
    if (k === 'Del') p.d = p.d.slice(0, -1);
    else if (k === 'Go') { if (p.d.length === 3) { var n = +p.d; tt.pad = null; ttPadRender(); ttGo(n); return; } }
    else if (p.d.length < 3) p.d += k;
    if (p.d.length === 3) { var m = +p.d; tt.pad = null; ttPadRender(); ttGo(m); return; }
    ttPadRender();
  }
  /** OK on a programme row: ask, then play it (now if it is on, otherwise from its start). */
  function ttAsk(act) {
    var now = Date.now(), live = act.b.startMs <= now && now < act.b.endMs, el = $('ttq');
    tt.q = { act: act, i: 0 };
    el.innerHTML = '<div id="ttqt">Play ' + ttAscii(gmName(act.b.prog)).replace(/[<>&]/g, '') + '?</div><div id="ttqs">' + ttAscii(act.c.name).replace(/[<>&]/g, '') + ' \u00b7 ' + (live ? 'on now' : 'from the start (' + fmtTime(act.b.startMs) + ')') + '</div><div id="ttqb"><b data-i="0" class="sel">Yes</b><b data-i="1">No</b></div>';
    el.className = '';
    Array.prototype.forEach.call(el.querySelectorAll('b'), function (b) { b.onclick = function () { tt.q.i = +b.getAttribute('data-i'); ttQKey('Enter'); }; });
  }
  function ttQKey(k) {
    var q = tt.q;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') q.i = 1 - q.i;
    else if (k === 'Enter' || k === ' ') {
      var act = q.act, yes = q.i === 0;
      tt.q = null; $('ttq').className = 'hidden';
      if (yes) {
        var now = Date.now(), b = act.b;
        ttClose();
        if (osdOpen) closeOsd();
        gChan = act.c; gFocus = b.startMs <= now && now < b.endMs ? now : b.startMs + 1000;
        watchFromGuide();
      }
      return;
    }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { tt.q = null; $('ttq').className = 'hidden'; return; }
    Array.prototype.forEach.call($('ttq').querySelectorAll('b'), function (b, n) { b.className = n === q.i ? 'sel' : ''; });
  }
  function ttKey(k) {
    if (tt.q) { ttQKey(k); return; }
    if (tt.pad) {
      var p = tt.pad;
      if (/^[0-9]$/.test(k)) { ttPadPress(k); return; }
      if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') { tt.pad = null; ttPadRender(); return; }
      if (k === 'ArrowLeft') p.i = p.i % 3 ? p.i - 1 : p.i + 2;
      else if (k === 'ArrowRight') p.i = p.i % 3 < 2 ? p.i + 1 : p.i - 2;
      else if (k === 'ArrowUp') p.i = (p.i + 9) % 12;
      else if (k === 'ArrowDown') p.i = (p.i + 3) % 12;
      else if (k === 'Enter' || k === ' ') { ttPadPress(['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Del', '0', 'Go'][p.i]); return; }
      ttPadRender();
      return;
    }
    if (/^[0-9]$/.test(k)) { tt.pad = { d: '', i: 0 }; ttPadPress(k); return; }
    if (k === 'Info' || k === 'Menu' || k === 'ContextMenu') { tt.pad = { d: '', i: 0 }; ttPadRender(); return; }
    if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') {
      if (tt.hist.length) { var n = tt.hist.pop(); tt.num = 0; ttGo(n, true); } else ttClose();
      return;
    }
    var L = tt.links;
    if (k === 'ArrowDown' || k === 'ArrowRight') { if (L.length) { tt.li = (tt.li + 1) % L.length; ttDraw(); } }
    else if (k === 'ArrowUp' || k === 'ArrowLeft') { if (L.length) { tt.li = (tt.li + L.length - 1) % L.length; ttDraw(); } }
    else if (k === 'Enter' || k === ' ') { if (L[tt.li]) { if (L[tt.li].act) ttAsk(L[tt.li].act); else ttGo(L[tt.li].target); } }
    else if (k === 'PageDown' && tt.pages.length > 1) { tt.sub = (tt.sub + 1) % tt.pages.length; ttDraw(); }
    else if (k === 'PageUp' && tt.pages.length > 1) { tt.sub = (tt.sub + tt.pages.length - 1) % tt.pages.length; ttDraw(); }
  }
  function ttTap(e) {
    if (!tt || tt.pad) return;
    var cv = $('ttc'), r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * T().COLS, y = (e.clientY - r.top) / r.height * T().ROWS;
    for (var i = 0; i < tt.links.length; i++) { var l = tt.links[i]; if (Math.floor(y) === l.row && (l.act || (x >= l.c0 - .5 && x <= l.c1 + .5))) { tt.li = i; if (l.act) ttAsk(l.act); else ttGo(l.target); return; } }
  }

  // ------------------------------------------------------------------ OSD bar (OK while watching)

  var AR = [
    { id: 'auto', label: 'Auto' }, { id: '43', label: '4:3' }, { id: '169', label: '16:9' },
    { id: 'zoom', label: 'Zoom' }, { id: 'stretch', label: 'Stretch' }
  ];
  var arIdx = 0;
  // Buttons on the bar, left to right: playback on the left, then two short lists (Guide, Sources) and the settings.
  // During an ad break Next reads "Skip adverts" (it always skipped the break there).
  var OB_ALL = ['pp', 'next', 'restart', 'stop', 'gguide', 'gsrc', 'tracks', 'options'];     // every button stays on the bar; only the look is slimmer
  var OB_POP = {
    gguide: [{ id: 'guide', t: 'TV Guide', key: 'GUIDE' }, { id: 'sched', t: 'Channel schedule' }, { id: 'od', t: 'On Demand' }],
    gsrc: [{ id: 'src', t: 'Auto play from addons' }, { id: 'find', t: 'Find sources' }]
  };
  function popRows(g) { return OB_POP[g]; }
  /** The buttons showing now: Audio & subs only when the file has tracks to pick; Sources only with Experimental on and an addon. */
  function obList() { return OB_ALL.filter(function (id) { return id === 'tracks' ? trHas() : id === 'gsrc' ? !!(expOn && cur && !cur.ad && cur.prog && adLive().length) : true; }); }
  var osdOpen = false, osdSel = 1, osdTimer = null, osdTick = null;
  var osdPop = null;                     // the open list above the bar: { g: 'gguide' | 'gsrc', i: row }
  var osdStopped = false;                // Stop pressed: the picture is held and the guide is up; Back from the guide joins the channel again
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
  var FXMODES = ['off', 'vhsoled', 'vhs', 'vhs2', 'vivid', 'sharp', 'lines', 'grille', 'glass', 'portable', 'dots'];
  var FXLABEL = { off: 'Off', vhsoled: 'VHS OLED', vhs: 'VHS', vhs2: 'VHS 2', vivid: 'Vivid', sharp: 'Sharp',
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
  var fxTimer = null, fxLast = null, fxLiteCount = 0;      // after two programmes in a row needed it, the rest of the session starts light
  function fxGuardStart() {
    clearInterval(fxTimer); fxLast = null;
    if (fxLiteCount >= 2) { document.body.classList.add('fx-lite'); return; }      // this TV cannot keep up with the blur: no point dropping frames to find out again
    document.body.classList.remove('fx-lite');
    if ((fxMode !== 'vhs' && fxMode !== 'vhsoled' && fxMode !== 'vhs2') || !v.getVideoPlaybackQuality) return;
    fxTimer = setInterval(function () {
      if (v.paused || document.body.classList.contains('guide-open')) { fxLast = null; return; }
      var q = v.getVideoPlaybackQuality(), p = fxLast;
      fxLast = { t: q.totalVideoFrames, d: q.droppedVideoFrames };
      if (!p || document.body.classList.contains('fx-lite')) return;
      var total = fxLast.t - p.t, dropped = fxLast.d - p.d;
      if (total >= 45 && dropped / total > 0.05) {
        document.body.classList.add('fx-lite'); fxLiteCount++;
        dlog('VIDEO EFFECT lightened: ' + dropped + ' of ' + total + ' frames dropped with ' + FXLABEL[fxMode] + ' on  ' + String(v.currentSrc || '').split('/').slice(-2).join('/'));
      }
    }, 3000);
  }
  v.addEventListener('loadstart', function () { fxLast = null; if (fxLiteCount < 2) document.body.classList.remove('fx-lite'); });
  // VHS OLED: the VHS lines swap places with their gaps every ten minutes, so no row of an OLED panel is always the dimmed one.
  // Which of the two positions is shown comes from the clock (ten-minute slots, odd or even), not from when the app started: a
  // restart cannot favour one position, however short each viewing is. The line spacing is a whole, even number of device pixels
  // so the swap lands exactly on pixel rows.
  var fxShifted = -1, fxShiftTimer = null;
  function fxShift(on) {                              // on: true = start, false = stop
    clearInterval(fxShiftTimer); fxShiftTimer = null; fxShifted = -1;
    var st = document.body.style;
    if (!on) { st.removeProperty('--fxs'); st.removeProperty('--fxp'); return; }
    var dpr = window.devicePixelRatio || 1, N = Math.max(4, 2 * Math.round(window.innerHeight * dpr * 0.004 / 2));
    st.setProperty('--fxp', (N / dpr) + 'px');
    function tick() {
      var ph = Math.floor(Date.now() / 600000) % 2;
      if (ph === fxShifted) return;
      fxShifted = ph; st.setProperty('--fxs', ph ? (N / 2 / dpr) + 'px' : '0px');
    }
    tick(); fxShiftTimer = setInterval(tick, 30000);
  }
  function applyFx() {
    FXMODES.concat('vhs').forEach(function (m) { document.body.classList.remove('fx-' + m); });
    document.body.classList.add('fx-' + fxMode);
    if (fxMode === 'vhsoled') document.body.classList.add('fx-vhs');     // the VHS look, plus lines that move (below)
    fxShift(fxMode === 'vhsoled');
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
    if (!url || /^yt:/.test(url) || !bufferAvailable() || !BUF[bufIdx].mb) return url;
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
    fxLiteCount = 0;                       // a look chosen afresh gets a fair try
    applyFx();
    renderOpts();
  }

  // ---- What's new: what came with this build. version.js is written from CHANGELOG.md by tools/make_version.py,
  // so this panel and the changelog in the APK zip can never say different things.
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var relOpen = false;
  function release() { return window.RELEASE || null; }
  function relName() { var r = release(); return (r && r.name) || 'unnumbered build'; }
  /** "2026-11-09" as "9 November 2026". Empty for anything else, so a missing date just shows nothing. */
  function relDate(d) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return '';
    var p = d.split('-');
    return (+p[2]) + ' ' + MONTHS_LONG[+p[1] - 1] + ' ' + p[0];
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
    { who: 'TheTVDB', what: 'Artwork and episode details, when a key is entered in Options > Artwork. Metadata provided by TheTVDB.com; please consider adding missing information or subscribing.' },
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
    var hrs = {}; s.order.forEach(function (p) { var k = key(p); cnt[k] = (cnt[k] || 0) + 1; hrs[k] = (hrs[k] || 0) + (p.dur || 0) / 3600; uniq[k] = p.show || p.group || p.title; if (!(p.lenKnown)) unknownLen++; if (!/S\d+E\d+/i.test(p.title || '') && !p.filmKey) uncoded++; });
    var run = 0, prev = '', runStart = 0;
    rows.forEach(function (bl) {
      var k = bl.prog.filmKey ? 'f:' + bl.prog.filmKey : key(bl.prog);
      if (k === prev) run++; else { if (run >= 3) runs.push({ show: uniq[prev] || prev, n: run, at: runStart }); run = 1; prev = k; runStart = bl.startMs; }
      var ik = bl.prog.filmKey ? 'f:' + bl.prog.filmKey : bl.prog.id || bl.prog.title;
      urls[ik] = (urls[ik] || 0) + 1; if (urls[ik] === 3) dupes.push(bl.prog.title);
    });
    if (run >= 3) runs.push({ show: uniq[prev] || prev, n: run, at: runStart });
    var kind = s.cycle === 'multi' ? 'a clock timetable, ' + s.n + ' ' + (s.unit === 604800 ? 'weeks' : 'days') + ' before it repeats'
      : s.cycle === 'week' ? 'a clock timetable that repeats every week' : s.cycle === 'day' ? 'a clock timetable that repeats every day'
      : 'one shuffled loop of ' + (s.total / 3600).toFixed(1) + ' hours';
    var probs = [];
    runs.forEach(function (r) { probs.push(r.show + ' is on ' + r.n + ' times in a row from ' + fmtTime(r.at)); });
    if (dupes.length) probs.push(dupes.length + ' programme' + (dupes.length > 1 ? 's are' : ' is') + ' on more than twice in the day: ' + dupes.slice(0, 3).join('; '));
    var byCount = Object.keys(cnt).sort(function (x, y) { return cnt[y] - cnt[x]; }), topShow = byCount[0];
    var byHrs = Object.keys(hrs).sort(function (x, y) { return hrs[y] - hrs[x]; }), topH = byHrs[0];
    if (topH && hrs[topH] / (s.total / 3600) > 0.4 && byHrs.length > 1) probs.push(uniq[topH] + ' fills ' + Math.round(100 * hrs[topH] / (s.total / 3600)) + '% of the airtime');
    var prevK = '', runN = 0;
    return {
      head: [
        'Guide length setting: ' + SPANS[spanIdx].label,
        'Built as ' + kind,
        (c.poolInfo ? 'Fed to the timetable: ' + c.poolInfo.n + ' programmes (' + c.poolInfo.virt + ' filled in from the episode lists); lengths: bite ' + c.poolInfo.cls.bite + ', half ' + c.poolInfo.cls.half + ', hour ' + c.poolInfo.cls.hour + ', long ' + c.poolInfo.cls.long + ', film ' + c.poolInfo.cls.film + '; ' + Object.keys(c.poolInfo.shows).length + ' shows, the biggest: ' + Object.keys(c.poolInfo.shows).sort(function (a, b) { return c.poolInfo.shows[b].a - c.poolInfo.shows[a].a; }).slice(0, 8).map(function (k) { var g = c.poolInfo.shows[k]; return g.n + ' ' + g.a + (g.v ? ' (' + g.v + ' filled in)' : ''); }).join(', ') : 'Fed to the timetable: not recorded'),
        'Pool: ' + s.order.length + ' programmes, ' + (s.total / 3600).toFixed(1) + ' h' + (s.cycle ? '' : (s.total < 43200 ? ' (under 12 h, so each programme comes round more than twice a day)' : ' (each programme at most twice a day)')),
        s.order.length + ' programmes in the schedule, ' + byCount.length + ' different shows, ' + (s.total / 3600).toFixed(1) + ' hours in all',
        (c.plan ? c.plan.length : '?') + ' programmes stored for this channel before the guide length is applied',
        'Where it comes from: ' + (c.decade ? 'the library, only ' + c.decade + 's (' + (c.decade + 9) + ')' : c.autoUsed ? 'the scraper’s whole library' : 'the channel’s own list'),
        unknownLen + ' programmes have no confirmed running time; ' + uncoded + ' have no season and episode'
      ],
      probs: probs,
      tops: byHrs.slice(0, 10).map(function (k) { return uniq[k] + ': ' + cnt[k] + ' (' + Math.round(hrs[k]) + ' h)'; }),
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
    toast('Updated to ' + r.name + '  ·  Options > What’s new', 6000, true);
  }

  // ---- Options panel (OSD > Options): picture, enhancements, adverts, Auto EPG, how long listings are kept
  // The categories down the left of Options, and the rows in each. OPTS is those rows in order.
  var OCATS = [
    { id: 'picture', rows: ['ar', 'fx'] },
    { id: 'guide', rows: ['sched', 'od', 'real', 'span', 'theme', 'season', 'keep', 'refresh', 'unhide'] },
    { id: 'art', rows: ['gart', 'epsrc', 'tvdb', 'tmdb', 'scan', 'mkeep', 'mclear'] },
    { id: 'play', rows: ['player', 'buf', 'ads', 'yt'] },
    { id: 'help', rows: ['rel', 'about'] },
    { id: 'exp', rows: ['exp', 'startup', 'ldscr', 'uisize', 'mc', 'rw', 'uk', 'addons', 'ammain', 'depg', 'join', 'adlang', 'adrec', 'adcut', 'dbgopen'] },
    { id: 'debug', rows: ['live', 'log', 'epg', 'gaps'] }
  ];
  var OPTS = [];
  OCATS.forEach(function (c) { OPTS = OPTS.concat(c.rows); });
  var optsCat = 0, optsZone = 0;      // optsZone: 0 = the category list, 1 = a row in the chosen category
  function catOfRow(id) { for (var i = 0; i < OCATS.length; i++) if (OCATS[i].rows.indexOf(id) >= 0) return i; return 0; }
  var optsOpen = false, optsSel = 0, optsTimer = null, optsShut = '';      // optsShut: the row whose choices were confirmed with OK, shown folded away (its value only)
  function optValue(id) {
    if (id === 'exp') return expOn ? 'On' : 'Off  \u00b7  turn on to use the dimmed rows';
    if (id === 'uisize') return expOn ? UI[uiIdx].label + (uiIdx === 1 ? '  \u00b7  as designed' : '') : 'Turn Experimental on first';
    if (id === 'ldscr') return expOn ? LD[ldIdx].label : 'Turn Experimental on first';
    if (id === 'startup') return !expOn ? 'Turn Experimental on first' : startOdOn ? 'On Demand' : 'EPG  \u00b7  the TV guide';
    if (id === 'addons') return addons.length ? addons.length + ' installed  \u00b7  OK to manage' : 'None  \u00b7  OK to add';
    if (id === 'ammain') return amOn ? 'On  \u00b7  library links are the fallback' : 'Off';
    if (id === 'depg') return depgOn ? 'On  \u00b7  ' + (veStat.virtual ? veStat.virtual + ' extra episodes in the guides' : 'building episode lists') : 'Off';
    if (id === 'join') return joinOn ? 'On  \u00b7  starts where the clock is' : 'Off  \u00b7  starts from the beginning';
    if (id === 'uk') return ukOn ? 'British  \u00b7  US shows that were never on UK TV are hidden' : 'Everything';
    if (id === 'mc') return magicOn ? 'On  \u00b7  ' + channels.filter(function (c) { return c.magic; }).length + ' extra channels' : 'Off';
    if (id === 'rw') return rwOn ? 'On  \u00b7  episodes run in order' : 'Off';
    if (id === 'adlang') return adLang === 'en' ? 'English only' : 'Any';
    if (id === 'adrec') return adHist.length ? adHist.length + ' saved' : 'None yet';
    if (id === 'adcut') return adCut ? 'On' : 'Off';
    if (id === 'dbgopen') return !expOn ? 'Turn Experimental on first' : dbgOpen ? 'On  \u00b7  the debug address needs no code' : 'Off  \u00b7  the address has a code that changes each launch';
    if (id === 'ar') return AR[arIdx].label;
    if (id === 'fx') return FXLABEL[fxMode];
    if (id === 'gart') return gartOn ? 'On' : 'Off';
    if (id === 'real') return realOn ? 'On' : 'Off';
    if (id === 'scan') return scanUi.running ? (scanUi.i + ' of ' + scanUi.n + '  \u00b7  ' + scanUi.name + '  \u00b7  OK to cancel') : (scanUi.result || 'OK to start');
    if (id === 'tvdb') return !tvdbKey ? 'Not set  \u00b7  OK to enter' : (Date.now() < tvdbPause ? 'Key not accepted' : !(window.NativeHttp && NativeHttp.httpx) ? 'Needs a newer app' : 'On  \u00b7  ' + tvdbStat.found + ' found' + (tvdbStat.none ? ', ' + tvdbStat.none + ' no match' : '') + (tvdbStat.fail ? ', ' + tvdbStat.fail + ' failed' : '') + (tvdbStat.found + tvdbStat.none + tvdbStat.fail ? '' : '  \u00b7  OK to test'));
    if (id === 'epsrc') return EPSRC[epSrcIdx].label + (epSrcIdx === 1 && !tvdbKey ? '  (needs a TheTVDB key)' : epSrcIdx === 2 && !tmdbKey ? '  (needs a TMDB key)' : '');
    if (id === 'tmdb') return !tmdbKey ? 'Not set  \u00b7  OK to enter' : 'Saved  \u00b7  OK to change';
    if (id === 'yt') return !ytAvailable() ? 'Needs the TV app' : ytOn ? 'On' : 'Off';
    if (id === 'ads') return (adEra === 'off' ? 'Off' : 'On') + (adEra !== 'off' && cur && !ADS.categoryFor(cur.ch.id) ? '  (none on this channel)' : '');
    if (id === 'buf') return BUF[bufIdx].label + (BUF[bufIdx].mb && !bufferAvailable() ? '  (needs a newer app)' : '');
    if (id === 'player') return PLAYERS[playerIdx].label + (v.canNative() ? '' : '  (needs the newest app)') + (Object.keys(npKnown).length && playerMode() === 'auto' ? '  \u00b7  rescued ' + Object.keys(npKnown).length + (Object.keys(npKnown).length === 1 ? ' video' : ' videos') + ' so far' : '');
    if (id === 'span') return SPANS[spanIdx].label;
    if (id === 'theme') return THEMES[themeIdx].label;
    if (id === 'season') return seasonOn ? (SEASONS.current() ? 'Auto  (' + SEASONS.current().label + ' on now)' : 'Auto  (nothing on at the moment)') : 'Off';
    if (id === 'keep') return KEEP[keepIdx].label;
    if (id === 'refresh') return refreshArmed ? 'Press OK again to confirm' : '';
    if (id === 'unhide') return unhideArmed ? 'Press OK again to confirm' : hidCount ? hidCount + ' hidden  \u00b7  OK to show all' : 'None';
    if (id === 'rel') return relName();
    if (id === 'mkeep') return META_KEEP[metaIdx].label;
    if (id === 'mclear') return metaSizeText || '\u2026';
    if (id === 'gaps') return gapState.report ? gapState.report.summary.gaps + ' shows with gaps' : '';
    if (id === 'live') return liveAddr ? 'On' : 'Off';
    if (id === 'about' || id === 'log' || id === 'od' || id === 'epg' || id === 'sched') return '';
    return '';
  }

  /** Picking longer keeps the lists already stored; picking shorter lets them run out. Links are never thrown away. */
  var META_KEYS = /^(info3|art2|tvm4|eps1|artdb1|cast1|tvdb1):/;
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
  function changeReal() {
    realOn = !realOn; store.set('real1', realOn ? 'on' : 'off');
    renderOpts();
    toast(realOn ? 'Broadcast schedule on: building a real week for every channel\u2026' : 'Broadcast schedule off: building the guides\u2026', 3000);
    clearTimeout(spanTimer);
    spanTimer = setTimeout(function () { location.reload(); }, 2200);
  }
  function changeYt() {
    ytOn = !ytOn; store.set('yt1', ytOn ? 'on' : 'off');
    ytP = null; odData = {}; odRowsMemo = null; odKGen++;
    renderOpts();
    toast(ytOn ? 'YouTube videos are on in On Demand' : 'YouTube videos are off', 3000);
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

  var NEEDS_EXP = { startup: 1, ldscr: 1, uisize: 1, addons: 1, ammain: 1, depg: 1, join: 1 };           // greyed out while Experimental is off
  var ACTION = { scan: 1, tvdb: 1, tmdb: 1, unhide: 1, epg: 1, mclear: 1, od: 1, refresh: 1, rel: 1, log: 1, about: 1, gaps: 1, addons: 1 };   // rows that do something on OK, so they show no left/right arrows
  // one line under the list saying what the highlighted row is for
  var OPT_HELP = {
    exp: 'Experimental features that may change or break. Turning this on lets you add Stremio addons, which are asked for streams of what you are watching. Nothing is added for you, and no addon is recommended.',
    addons: 'Paste the link of a Stremio addon (it ends in manifest.json). Your addons are asked in this order with only the title\u2019s IMDb number. Only direct web links and YouTube play; torrents and downloads never start.',
    ammain: 'With this on, every programme that has an episode number, and every film, is first looked up with your addons while the loading screen or a "Scraping your debrid" message is showing, and plays from the best link they find. If they find nothing, or the link will not play, the library link plays instead. It plays from the start rather than joining part way through.',
    mc: 'Adds themed channels made from the whole library: movies by genre (action, horror, sci-fi, comedy, thrillers, drama), sci-fi, cops and detectives, quiz and challenge game shows, sitcoms, sketch shows, kids cartoons by era, nursery and teen TV, pop and rock music, soaps, cooking and Christmas comedy, soaps, cartoons and pop. They sit after the usual channels. Turning it on or off restarts the guides.',
    rw: 'Treats the guide like live television. A show\'s episodes come in order and each day carries on where the last one stopped (Monday S01E01, Tuesday S01E02 ...). A channel plays only what is on now: pick anything else in the guide and it opens in On Demand, asking "Play it now?". Specials, one-offs and music are left as they are. Guide times do not change. (Broadcast schedule, in Guide, sets the times; this sets which episode airs.)',
    uk: 'Everything shows the whole library. British hides shows the scraper has marked as never shown on UK TV (mostly US drama), and keeps UK-made shows and the US ones that did air here, such as cartoons. Shows it is unsure about stay.',
    depg: 'Fills the channel guides with every episode of each show, from the episode source in Options > Artwork, even where the library has no file. Every programme is looked up with your addons first (the library link is only the fallback), and On Demand lists every episode too. An episode no addon has is skipped. Needs an addon.',
    uisize: 'Makes the whole app a little smaller (room round the edges if your TV cuts them off) or a little bigger (easier to read from the sofa). Normal is how it was designed. It changes at once.',
    startup: 'Experimental. Off, the app opens on the TV guide (EPG), as it always has. On, it opens in On Demand instead, on its home screen. Back from On Demand goes to the guide. Takes effect from the next start.',
    ldscr: 'The TV you see while the app starts. Classic is the little set on a blue screen. Set in the room puts a bigger set in front of blurred artwork. Whole screen makes the picture the TV. Surprise me picks one of those two each start.',
    join: 'For programmes played from your addons (Magic EPG episodes, and everything when Use addons as a main source is on). Off starts them from the beginning. On starts them where the guide says the programme has got to, like a real channel. A slow or unseekable source may take longer to start.',
    adlang: 'Addon results say which language they are in (flags such as the French one, or words like FRENCH, ITA, VOSTFR). English only greys out links that name another language and no English, so they are never auto-played. Links that say nothing about language, and Multi or Dual Audio ones, are kept. Any takes everything.',
    adrec: 'Every source that worked is kept here, so a title you watched before can start again straight away. If a saved link has stopped working, the app looks again by itself.',
    dbgopen: 'Experimental. On: the debug log and Live view addresses carry no code, so the same plain address works every time. Anyone on your home network can then open them, so leave it off unless you are the only one on it. Takes effect from the next time the address is shown.',
    adcut: 'Only look for sources for shows and films from before 2000, like the rest of the app.',
    season: 'A light pixel-art decoration over the TV guide and On Demand that comes and goes with the calendar: snow from 1 November to 6 January. Auto uses the date; Off never draws it. It stays off while a video plays behind On Demand.',
    theme: 'How the TV guide looks. It only changes when you change it here.',
    yt: 'Episodes that are not on archive.org but are on YouTube, shown in On Demand. They play without adverts or a sign-in, through the app\u2019s own player, and where an episode has more than one copy the best plays first. Turn this off if they cause trouble.',
    real: 'Lays each channel out like a real week of television: programmes on the hour and half hour, short ones in the morning and at lunchtime, half hours through the early evening, hour-long programmes and films in prime time and on weekend afternoons, and Saturday and Sunday different from the weekdays. A series plays in order, one episode after another. Channels with a plan of their own (News, Saturday Night, Soaps, Drama, Video Shop) keep it. Off is the endless shuffle.',
    mkeep: 'How long artwork and episode details are remembered before they are looked up again. Permanent keeps them until you clear them.',
    mclear: 'Forgets the saved artwork, episode details and downloaded pictures, so they are fetched again fresh. Shows what is stored now.',
    od: 'Browse every channel\u2019s shows, series and episodes, and play any of them from the start.',
    ar: 'Auto, Smart, 4:3, 16:9, Zoom or Stretch. Auto shows each programme in the ratio it was made in. Smart keeps old 4:3 pictures the right shape and fills the sides with a soft copy of the picture.',
    fx: 'A period look for the picture: VHS softness, vivid colour or extra sharpness. VHS OLED is the VHS look with its lines swapped with the gaps every ten minutes, so an OLED screen wears evenly.',
    gart: 'Posters and backdrops in the guide and on the bar. Off keeps things plain.',
    ads: 'Adverts between programmes, matched to the year of what you are watching. UK first, and never on the BBC.',
    player: 'A few videos have no sound, or will not play at all, in the normal player. When that happens the app can switch to a second, built-in player that handles them. Automatic does this by itself, only for the videos that need it, and remembers them. Never keeps the normal player for everything. Always uses the second player for every video (the VHS and Smart ratio looks do not work with it).',
    buf: 'Downloads the next part of a programme to this device before you reach it, so it keeps playing through slow spells on your internet. A bigger amount copes with slower connections but uses more space. Off plays straight from archive.org.',
    span: 'How much airtime each channel\u2019s guide is built to cover before it repeats. Shorter picks a varied mix; longer shows more days. On Demand always lists everything.',
    keep: 'How often each channel\u2019s line-up of programmes is shuffled into a new running order. Shorter means the guide changes more often.',
    scan: 'Looks up every show in the library that is missing a poster, a backdrop or its episode pictures, and (with a TheTVDB key) every film missing a backdrop, one at a time, with TheTVDB first when a key is entered and TVmaze otherwise. Takes a few minutes the first time. OK again while it runs to cancel. Shows are skipped when they already have everything, so a second scan is quick.',
    epsrc: 'Where episode lists come from (for the Magic EPG experiment). TVmaze needs no key; the others use your keys below.',
    tmdb: 'Your free API key from themoviedb.org (Settings > API), used when Episode lists is TMDB.',
    tvdb: 'Your own key from thetvdb.com (a free account gives you one). With a key, posters, backdrops, summaries, episode details and cast are looked up on TheTVDB first, and TVmaze fills in whatever it does not have. Clear the key to go back to TVmaze alone.',
    unhide: 'Shows hidden from the hold-OK menu (Hide this show). OK twice brings them all back.',
    refresh: 'Throws away every line-up and builds them all again in a new running order.',
    rel: 'What changed in this version and the ones before it.',
    about: 'Where the programmes, artwork and details come from.',
    epg: 'What each channel\u2019s guide is built from and what it will show for the next 24 hours, with any problems such as the same show three times in a row.',
    log: 'What failed to play and why, ready to send when something goes wrong.',
    live: 'On: the debug log, the screen and a remote can be opened from a browser on the same Wi-Fi at the address shown here (no code), so a problem can be looked at without sending anything. Once it is on it stays on: it starts again by itself each time the app launches, until you switch it off here.',
    gaps: 'Shows with episodes or seasons missing, set against the episode guide.'
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
    if (id === 'uisize') return { l: UI.map(function (x) { return x.label; }), i: uiIdx };
    if (id === 'ldscr') return { l: LD.map(function (x) { return x.label; }), i: ldIdx };
    if (id === 'yt') return { l: ['Off', 'On'], i: ytOn ? 1 : 0 };
    if (id === 'real') return { l: ['Off', 'On'], i: realOn ? 1 : 0 };
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
      var val = optValue(id), cls = 'orow' + (ACTION[id] ? ' act' : '') + (sel ? ' sel' : '') + (ch && optsShut !== id ? ' hasc' : '') + (!expOn && NEEDS_EXP[id] ? ' dim' : ''), was = optsShown[id] || {};
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
    var bar = $('ob-scan'), pct = scanUi.running && scanUi.n ? Math.round(100 * (scanUi.i - 1) / scanUi.n) : 0;
    if (bar) { var w = pct + '%'; if (optsShown._p !== w) { bar.style.width = w; optsShown._p = w; } var bc = 'obar' + (scanUi.running ? ' on' : ''); if ($('obar-scan').className !== bc) $('obar-scan').className = bc; }
    {                                                // keep the chosen row fully inside the panel (the panel clips; it scrolls to follow)
      var pn = $('opane'), rw = optsZone ? $('or-' + OPTS[optsSel]) : null;
      if (!rw) pn.scrollTop = 0;
      else if (rw.offsetHeight) {
        // The chosen row opens up to show its choices, so the rows around it change height as the highlight moves. To stop the list
        // jumping, the highlighted row is held at one place a little way down the panel (the list slides past it, one row a press),
        // except near the top and bottom of the list, where it simply stops. The opened row is always kept whole inside the panel.
        var rt = rw.offsetTop, rb = rt + rw.offsetHeight, gap = Math.round(window.innerHeight * 0.02);
        var hd = $('or-' + cat.rows[0]).offsetTop;                  // where the rows start: under the heading, which stays put at the top
        var hold = Math.round(pn.clientHeight * 0.16), want = rt - hd - hold;
        if (rb + gap - want > pn.clientHeight) want = rb + gap - pn.clientHeight;
        want = Math.max(0, Math.min(want, pn.scrollHeight - pn.clientHeight));
        if (pn.scrollTop !== want) pn.scrollTop = want;
      }
    }
    applyTheme(gChan || (cur && cur.ch));
    var pv = $('otpv'), pc = 'otpv' + (themeNow === 'classic' || !themeNow ? '' : ' gt-' + themeNow);
    if (pv && pv.className !== pc) pv.className = pc;
    var ad = $('oaddr'), at = liveAddr || '';
    if (ad && optsShown._a !== at) { ad.textContent = at; ad.className = at ? '' : 'hidden'; optsShown._a = at; }
    var help = optsZone ? (OPT_HELP[OPTS[optsSel]] || '') : '', ver = relName();
    if (optsShown._h !== help) { $('ohelp').textContent = help; optsShown._h = help; }
    if (optsShown._r !== ver) { $('over').textContent = ver; optsShown._r = ver; }
    var back = optsZone ? 'Back to categories' : 'Back to close';
    if (optsShown._b !== back) { $('oback').lastChild.textContent = ' ' + back.slice(5); optsShown._b = back; }
  }
  function openOpts() {
    dlog('OPTIONS opened from ' + (odOpen ? 'On Demand' : guideOpen ? 'the guide' : 'the picture'));
    closeOsd();
    optsOpen = true; optsCat = catOfRow('od'); optsZone = 0; optsSel = OPTS.indexOf(OCATS[optsCat].rows[0]);
    renderOpts();
    $('opts').className = '';
    optsTouch();
  }
  var optsKeys = 0;
  function closeOpts(why) { if (optsOpen) dlog('OPTIONS closed' + (why === 'idle' ? ' by itself after 20s without a key' : '') + ', ' + optsKeys + ' keys handled'); optsOpen = false; optsKeys = 0; clearTimeout(optsTimer); $('opts').className = 'hidden'; }
  function optsTouch() { clearTimeout(optsTimer); optsTimer = setTimeout(function () { closeOpts('idle'); }, 20000); }
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
        if (kn && /^(plan7[ad]?|sched1):/.test(kn)) kv.removeItem(kn);
      }
    } catch (e) { /* ignore */ }
    toast('Building every channel afresh\u2026', 4000);
    renderOpts();
    setTimeout(function () { location.reload(); }, 1200);   // the start-up loading screen does the rebuild
  }

  // Debug Live view: shows this screen, the debug text and a remote on a browser on the home network. Off until switched
  // on here, and off again each time the app starts.
  var liveAddr = '', liveTimer = null;
  // While Live view is on: how long the screen takes to answer a button (press to the next painted frame) and every
  // stall over 50 ms, so how smooth the guide feels can be read off without being in the room.
  var perfKeys = [], perfStalls = [], perfObs = null, perfMarks = [];
  /** Notes what is about to run, so a long stall can be traced to the job that caused it (see STALL lines in the log). */
  function jm(name) { perfMarks.push([performance.now(), name]); if (perfMarks.length > 80) perfMarks.splice(0, 40); }
  function perfStart() {
    if (perfObs || !window.PerformanceObserver) return;
    try {
      perfObs = new PerformanceObserver(function (l) {
        l.getEntries().forEach(function (e) {
          perfStalls.push([Date.now(), Math.round(e.duration)]);
          if (e.duration >= 250) {
            var a = e.startTime - 1500, b = e.startTime + e.duration, names = [];
            perfMarks.forEach(function (m) { if (m[0] >= a && m[0] <= b && names.indexOf(m[1]) < 0) names.push(m[1]); });
            dlog('STALL ' + Math.round(e.duration) + ' ms on ' + (optsOpen ? 'options' : odOpen ? 'ondemand' : guideOpen ? 'guide' : 'play') + ', jobs just before: ' + (names.join(', ') || 'none noted'));
          }
        });
        if (perfStalls.length > 200) perfStalls.splice(0, perfStalls.length - 200);
      });
      perfObs.observe({ entryTypes: ['longtask'] });
    } catch (e) { perfObs = null; }
  }
  function perfKey(k) {
    if (!liveAddr) return;
    var t0 = performance.now();
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      perfKeys.push([Date.now(), Math.round(performance.now() - t0), k, optsOpen ? 'options' : odOpen ? 'ondemand' : guideOpen ? 'guide' : 'play']);
      if (perfKeys.length > 300) perfKeys.splice(0, perfKeys.length - 300);
    }); });
  }
  function perfText() {
    function pct(a, p) { if (!a.length) return 0; var s = a.slice().sort(function (x, y) { return x - y; }); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; }
    var out = ['PERFORMANCE (since Live view was switched on)'], now = Date.now();
    ['guide', 'ondemand', 'options', 'play'].forEach(function (scr) {
      var r = perfKeys.filter(function (x) { return x[3] === scr; }).map(function (x) { return x[1]; });
      if (r.length) out.push(scr + ': ' + r.length + ' button presses, press-to-picture p50 ' + pct(r, 0.5) + ' ms, p90 ' + pct(r, 0.9) + ' ms, worst ' + Math.max.apply(null, r) + ' ms');
    });
    var st = perfStalls.filter(function (x) { return now - x[0] < 300000; }).map(function (x) { return x[1]; });
    out.push('stalls over 50 ms in the last 5 minutes: ' + st.length + (st.length ? ', worst ' + Math.max.apply(null, st) + ' ms, total ' + st.reduce(function (a, b) { return a + b; }, 0) + ' ms' : ''));
    var slow = perfKeys.slice(-40).filter(function (x) { return x[1] > 100; }).slice(-6).map(function (x) { return x[2] + ' on ' + x[3] + ' took ' + x[1] + ' ms'; });
    if (slow.length) out.push('slowest recent presses: ' + slow.join('; '));
    return out.join('\n');
  }
  function liveText() {
    var o = ['Telly Addicts live view', 'Version: ' + relName(), 'Written: ' + new Date().toString(),
      'Channel: ' + (cur && cur.ch ? cur.ch.n + ' ' + cur.ch.name : '(none)'), 'Programme: ' + (cur && cur.prog ? cur.prog.title : '(none)'),
      'Playing: ' + (v && !v.paused && v.currentTime > 0 ? 'yes at ' + Math.round(v.currentTime) + 's' : 'no'),
      'Screen: ' + (optsOpen ? 'Options' : odOpen ? 'On Demand' : guideOpen ? 'Guide' : 'Playing'), '', perfText(), ''];
    return o.concat(DLOG.slice(-400)).join('\n');
  }
  /** Start or stop the Live view. The choice is kept (live1), so a Live view that was on starts again by itself at the next launch. */
  function liveSet(on, quiet) {
    if (!window.NativeHttp || !NativeHttp.liveStart) { if (!quiet) toast('Needs a newer app', 2500); return false; }
    if (!on) {
      try { NativeHttp.liveStop(); } catch (e) { /* ignore */ }
      liveAddr = ''; clearInterval(liveTimer); liveTimer = null;
      store.set('live1', 'off');
      return true;
    }
    if (liveAddr) return true;
    try { liveAddr = NativeHttp.liveStart() || ''; } catch (e) { liveAddr = ''; }
    if (!liveAddr) { if (!quiet) toast('No home network found', 2500); return false; }
    store.set('live1', 'on');
    perfStart(); liveTimer = setInterval(function () { try { NativeHttp.liveState(liveText()); } catch (e) { /* ignore */ } liveServe(); }, 2000);
    try { NativeHttp.liveState(liveText()); } catch (e) { /* ignore */ }
    return true;
  }
  /** Pages the browser asked for (/epg, /gaps, /log): built now, handed to the app's server, which answers the waiting request. */
  function liveServe() {
    var want = '';
    try { want = NativeHttp.liveWanted ? NativeHttp.liveWanted() : ''; } catch (e) { want = ''; }
    if (!want) return;
    want.split(',').forEach(function (w) {
      var name = w.split(':')[0], fresh = w.indexOf(':fresh') > 0, text = '';
      try {
        if (name === 'epg') text = epgDbgChannels().length ? epgText() : 'No channel is ready yet.';
        else if (name === 'log') text = logText();
        else if (name === 'gaps') {
          gapStart(fresh);
          var r = gapState.report;
          text = (gapState.running ? 'STILL CHECKING: ' + gapState.done + ' of ' + (gapState.total || '?') + ' shows. ' + (r ? 'This is the last full report; ask again in a few minutes.' : 'Ask again in a few minutes.') + '\n' : '') +
                 (r ? gapText() : '');
        }
      } catch (e) { text = 'Could not build ' + name + ': ' + e.message; }
      try { NativeHttp.liveBlob(name, text); } catch (e) { /* ignore */ }
    });
  }
  function liveToggle() { liveSet(!liveAddr, false); renderOpts(); }
  // it was on when the app last ran: on again now (the home network can take a few seconds to come up, so it tries a few times)
  (function () {
    if (store.get('live1') !== 'on') return;
    var tries = 0;
    setTimeout(function again() {
      if (liveAddr) return;
      if (!liveSet(true, true) && ++tries < 8) setTimeout(again, 5000); else if (liveAddr) { renderOpts(); dlog('LIVE VIEW: back on from the last run, ' + liveAddr); }
    }, 2000);
  })();

  function optsChange(d) {
    var id = OPTS[optsSel];
    if (id === 'od') odOpenUi();
    else if (id === 'exp') changeExp();
    else if (id === 'ammain') { if (!expOn) toast('Turn Experimental on first', 3000); else { amOn = !amOn; store.set('am1', amOn ? 'on' : 'off'); if (amOn && !adLive().length) toast('Now add an addon (Options > Experimental > Addons)', 4000); renderOpts(); } }
    else if (id === 'ldscr') changeLd(d);
    else if (id === 'startup') { if (!expOn) toast('Turn Experimental on first', 3000); else changeStartup(); }
    else if (id === 'uisize') changeUi(d);
    else if (id === 'uk') changeUk();
    else if (id === 'mc') changeMc();
    else if (id === 'rw') changeRw();
    else if (id === 'depg') changeDepg();
    else if (id === 'join') { if (!expOn) toast('Turn Experimental on first', 3000); else { joinOn = !joinOn; store.set('join1', joinOn ? 'on' : 'off'); renderOpts(); } }
    else if (id === 'adlang') changeLang();
    else if (id === 'adrec') { closeOpts(); adRecent(); }
    else if (id === 'adcut') changeAdcut();
    else if (id === 'dbgopen') { if (!expOn) toast('Turn Experimental on first', 3000); else changeDbgOpen(); }
    else if (id === 'addons') { if (!expOn) toast('Turn Experimental on first', 3000); else { adList(0); } }
    else if (id === 'sched') csOpen((cur && cur.ch) || gChan, 'opts');
    else if (id === 'ar') changeAr(d);
    else if (id === 'fx') changeFx(d);
    else if (id === 'gart') { gartOn = !gartOn; store.set('gart', gartOn ? 'on' : 'off'); gartFor = '\u0000'; artFor = ''; osdArt(); renderOpts(); }
    else if (id === 'ads') changeAds(d);
    else if (id === 'yt') changeYt();
    else if (id === 'real') changeReal();
    else if (id === 'season') { seasonOn = !seasonOn; store.set('seasonal', seasonOn ? 'auto' : 'off'); if (seasonOv) seasonOv.stop(); seasonUpdate(); odSeasonUpdate(); renderOpts(); }
    else if (id === 'player') changePlayer(d);
    else if (id === 'buf') changeBuf(d);
    else if (id === 'span') changeSpan(d);
    else if (id === 'theme') changeTheme(d);
    else if (id === 'keep') changeKeep(d);
    else if (id === 'mkeep') changeMetaKeep(d);
    else if (id === 'mclear') clearMeta();
    else if (id === 'refresh') refreshEpg();
    else if (id === 'unhide') unhideAll();
    else if (id === 'tvdb') keyAsk('tvdb');
    else if (id === 'tmdb') tmdbKeyOpen();
    else if (id === 'epsrc') { epSrcIdx = (epSrcIdx + (d < 0 ? EPSRC.length - 1 : 1)) % EPSRC.length; store.set('epsrc1', EPSRC[epSrcIdx].id); renderOpts(); }
    else if (id === 'scan') scanStart();
    else if (id === 'rel') openRel('rel');
    else if (id === 'log') openRel('log');
    else if (id === 'live') liveToggle();
    else if (id === 'gaps') openRel('gaps');
    else if (id === 'epg') openRel('epg');
    else if (id === 'about') openRel('about');
  }

  // ---- on-screen keyboard (for the TheTVDB key): arrows to move, OK to type, the number keys type digits too
  var kbShown = false, kbVal = '', kbShift = false, kbR = 0, kbC = 0;
  var KB_BASE = [
    '1234567890-'.split(''), 'abcdefghij'.split(''), 'klmnopqrst'.split(''), ['u', 'v', 'w', 'x', 'y', 'z', '_', '⌫'],
    ['⇧ ABC', 'Space', 'Clear', 'Cancel', 'Save']
  ];
  var KB_SYM = '.:/?=&%@+~'.split('');          // for web addresses
  var KB_ROWS = KB_BASE;
  var kbMode = null;        // null: the TheTVDB key. Otherwise { title, label, value, save(text) } for another use (On Demand search)
  function kbLabel(k) { return kbShift && /^[a-z]$/.test(k) ? k.toUpperCase() : k === '⇧ ABC' ? (kbShift ? '⇧ abc' : '⇧ ABC') : k === 'Save' && kbMode ? kbMode.label : k; }
  function kbDraw() {
    $('kbtext').textContent = kbVal;
    var box = $('kbkeys'); box.textContent = '';
    KB_ROWS.forEach(function (row, r) {
      var line = document.createElement('div'); line.className = 'kbrow';
      row.forEach(function (k, c) {
        var d = document.createElement('div'); d.className = 'kbk' + (r === KB_ROWS.length - 1 ? ' w2' : '') + (k === 'Save' ? ' go' : '') + (r === kbR && c === kbC ? ' sel' : ''); d.textContent = kbLabel(k);
        line.appendChild(d);
      });
      box.appendChild(line);
    });
  }
  function kbOpen(mode) {
    kbMode = mode || null;
    KB_ROWS = kbMode && kbMode.sym ? KB_BASE.slice(0, 4).concat([KB_SYM], KB_BASE.slice(4)) : KB_BASE;
    kbShown = true; kbVal = kbMode ? (kbMode.value || '') : tvdbKey; kbShift = false;
    kbR = kbMode && !kbVal ? 1 : KB_ROWS.length - 1; kbC = kbMode && !kbVal ? 0 : 4;          // an empty search starts on the letters, a key to check starts on Save
    $('kbtitle').textContent = kbMode ? kbMode.title : 'TheTVDB key';
    $('kbd').className = ''; kbDraw();
  }
  function kbClose() { kbShown = false; $('kbd').className = 'hidden'; if (optsOpen) renderOpts(); }
  function kbSave() {
    var key = kbVal.trim();
    kbClose();
    if (kbMode) { kbMode.save(key); return; }
    tvdbSetKey(key);
  }
  function tvdbSetKey(key) {
    tvdbKey = key; tvdbPause = 0; tvdbTokP = null;
    store.set('tvdbkey', key);
    try { kv.removeItem('tvdbtok'); } catch (e) { /* none */ }
    renderOpts();
    if (!key) { toast('TheTVDB off: TVmaze only', 3000); return; }
    if (!(window.NativeHttp && NativeHttp.httpx)) { toast('Saved, but this app version cannot reach TheTVDB. Update the app.', 5000); return; }
    toast('Checking the key with TheTVDB\u2026', 3000);
    tvdbLogin().then(function () { return tvdbShow('Fawlty Towers', 1975); }).then(function (d) { toast(d ? 'TheTVDB is working: found Fawlty Towers and its artwork' : 'Key accepted, but the test show was not found', 5000); renderOpts(); },
      function (e) { toast(/HTTP 4\d\d/.test(e.message) ? 'TheTVDB would not accept that key' : 'Could not reach TheTVDB to check the key', 5000); renderOpts(); });
  }
  function kbKey(e) {
    var k = e.key;
    if (k.length === 1 && (kbMode && kbMode.sym ? /[A-Za-z0-9_\-.:\/?=&%@+~]/ : /[A-Za-z0-9_\-]/).test(k)) { kbVal += k; kbDraw(); return; }
    if (k === 'ArrowUp') kbR = (kbR + KB_ROWS.length - 1) % KB_ROWS.length;
    else if (k === 'ArrowDown') kbR = (kbR + 1) % KB_ROWS.length;
    else if (k === 'ArrowLeft') kbC = (kbC + KB_ROWS[kbR].length - 1) % KB_ROWS[kbR].length;
    else if (k === 'ArrowRight') kbC = (kbC + 1) % KB_ROWS[kbR].length;
    else if (k === 'GoBack' || k === 'Escape' || (k === 'Backspace' && !kbVal)) { kbClose(); return; }
    else if (k === 'Backspace') kbVal = kbVal.slice(0, -1);
    else if (k === 'Enter' || k === ' ') {
      var key = KB_ROWS[kbR][Math.min(kbC, KB_ROWS[kbR].length - 1)];
      if (key === 'Save') { kbSave(); return; }
      if (key === 'Cancel') { kbClose(); return; }
      if (key === 'Clear') kbVal = '';
      else if (key === 'Space') { if (kbVal && !/ $/.test(kbVal)) kbVal += ' '; }
      else if (key === '⌫') kbVal = kbVal.slice(0, -1);
      else if (key === '⇧ ABC') kbShift = !kbShift;
      else kbVal += kbLabel(key);
    }
    kbC = Math.min(kbC, KB_ROWS[kbR].length - 1);
    kbDraw();
  }
  function optsKey(k) {
    optsTouch(); optsKeys++;
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
    // A row with choices: Left and Right pick one (applied at once); OK confirms it, which folds the choices away so the row shows
    // its value again, and pressing OK again opens them. Any other press leaves the folded state.
    if (k === 'ArrowUp') { optsShut = ''; optsSel = OPTS.indexOf(rows[(at + rows.length - 1) % rows.length]); }
    else if (k === 'ArrowDown') { optsShut = ''; optsSel = OPTS.indexOf(rows[(at + 1) % rows.length]); }
    else if (k === 'ArrowLeft') { if (ACTION[id]) optsZone = 0; else { optsShut = ''; optsChange(-1); return true; } }
    else if (k === 'ArrowRight') { optsShut = ''; optsChange(1); return true; }
    else if (k === 'Enter' || k === ' ') {
      if (optChoices(id) && !ACTION[id] && !(!expOn && NEEDS_EXP[id])) { optsShut = optsShut === id ? '' : id; renderOpts(); return true; }
      optsChange(1); return true;
    }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace' || k === 'Info') { optsShut = ''; optsZone = 0; }
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

  /** The source badge for what is playing: the addons (green) or the archive (blue); nothing for anything else (adverts, YouTube). */
  function osdSource(p) {
    if (!p || p.ad) return null;
    if (p.addon) return { c: 'addon', t: '\u26A1 ADDON' + (p.q ? ' \u00b7 ' + (p.q === 2160 ? '4K' : p.q + 'p') : '') };
    if (/^https?:\/\/([a-z0-9-]+\.)*archive\.org\//i.test(String(p.url || ''))) return { c: 'archive', t: 'ARCHIVE.ORG' };
    return null;
  }
  // ---- Mini guide in the bar of a channel: the channels either side of this one (the higher numbers above, as Up moves), with what
  // is on now and what is next on each. Up from the progress line moves into it, OK on a channel tunes to it, Down comes back.
  var omgI = 0, omgRows = [], omgSig = '';
  function omgBuild() {
    omgRows = [];
    if (!cur || cur.od || cur.ad || window.PHONE) return;
    var list = ready().filter(function (c) { return c.id !== 'adbreak' && c.sched; }), i = list.indexOf(cur.ch), seen = {};
    if (i < 0 || list.length < 2) return;
    [2, 1, 0, -1].forEach(function (d) { var j = (i + d + list.length * 2) % list.length; if (!seen[j]) { seen[j] = 1; omgRows.push(list[j]); } });
  }
  function renderMg() {
    var box = $('omg');
    if (!omgRows.length || !cur || osdZone !== 'mg') { box.className = 'hidden'; box.textContent = ''; omgSig = ''; return; }     // shown only once Up from the progress line reaches it, so the bar stays thin
    var now = Date.now(), sig = Math.floor(now / 30000) + '|' + osdZone + '|' + omgI + '|' + cur.ch.id;
    if (sig === omgSig) return;
    omgSig = sig; box.className = ''; box.textContent = '';
    omgRows.forEach(function (c, n) {
      var bl; try { bl = E.blocks(c.sched, now, now + 4 * 3600000); } catch (e) { bl = []; }
      var b = bl[0], nx = bl[1], row = div('omgr' + (c === cur.ch ? ' cur' : '') + (osdZone === 'mg' && n === omgI ? ' sel' : ''));
      row.appendChild(div('omgn', String(c.n)));
      row.appendChild(div('omgc', c.name));
      row.appendChild(div('omgt', b && b.prog && !b.prog.ad ? splitTitle(b.prog.title).show : ''));
      if (nx && nx.prog && !nx.prog.ad) { var d = new Date(nx.startMs); row.appendChild(div('omgx', 'Next ' + two(d.getHours()) + ':' + two(d.getMinutes()) + '  ' + splitTitle(nx.prog.title).show)); }
      box.appendChild(row);
    });
  }
  function renderOsd() {
    if (!cur) return;
    renderMg();
    var sched = cur.ch.sched;
    var next = cur.od ? odPeek() : sched.order[(cur.index + 1) % sched.order.length];
    $('onum').textContent = cur.ch.n;
    $('ochan').textContent = cur.ch.name;
    // where the picture comes from: a badge beside the channel name
    var sb = osdSource(cur.prog);
    if (sb) { var bd = document.createElement('span'); bd.className = 'srcb ' + sb.c; bd.textContent = sb.t; $('ochan').appendChild(bd); }
    var ol = cur.ad ? { title: cur.prog.title, sub: cur.prog.sub || '' } : osdLines(cur.prog);
    $('otitle').textContent = ol.title;
    $('osub').textContent = ol.sub;
    $('onext').textContent = '';
    if (next && !cur.od && !cur.ad) {
      $('onext').appendChild(document.createTextNode('Next'));
      var nb = document.createElement('b');
      var nl = osdLines(next), nm2 = /^(.*?)\s+S(\d{1,4})[ED](\d{1,3})\b/.exec(String(next.title || ''));
      nb.textContent = nm2 ? nl.title + '  S' + (+nm2[2]) + ' E' + (+nm2[3]) : nl.title;
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
      (secs > 1 ? '  ·  ' + fmtPos(secs) + ' ahead' : '');
    $('olbl-pp').textContent = v.paused ? 'Play' : 'Pause';
    var inBreak = !!(cur.ad && !isAdChan(cur.ch));
    $('olbl-next').textContent = inBreak ? 'Skip adverts' : 'Next';
    $('oic-next').textContent = inBreak ? '\u23e9' : '\u25b6\u2758';
    $('oic-pp').textContent = v.paused ? '▶' : '❚❚';
    var ob = obList();
    if (osdSel > ob.length - 1) osdSel = ob.length - 1;
    if (osdPop && ob.indexOf(osdPop.g) < 0) osdPop = null;
    OB_ALL.forEach(function (id) { var i = ob.indexOf(id), e = $('ob-' + id); e.className = 'ob' + (i < 0 ? ' hidden' : '') + (osdZone === 'btn' && i === osdSel ? ' sel' : ''); });
    var bx = $('obtns'); bx.className = '';                               // widest first; step down until every button is on screen
    if (bx.scrollWidth > bx.clientWidth + 1) { bx.className = 'tight'; if (bx.scrollWidth > bx.clientWidth + 1) bx.className = 'tighter'; }
    renderPop();
  }

  /** The short list above a Guide or Sources button. */
  function renderPop() {
    var box = $('opop');
    if (!osdPop) { box.className = 'hidden'; return; }
    var rows = popRows(osdPop.g), btn = $('ob-' + osdPop.g);
    box.textContent = '';
    rows.forEach(function (r, i) {
      var d = document.createElement('div');
      d.className = 'opi' + (i === osdPop.i ? ' sel' : '');
      d.setAttribute('data-id', r.id);
      d.appendChild(document.createTextNode(r.t));
      if (r.key) { var k = document.createElement('span'); k.className = 'key'; k.textContent = r.key; d.appendChild(k); }
      box.appendChild(d);
    });
    box.className = '';
    box.style.left = Math.max(0, btn.offsetLeft - box.offsetWidth / 2 + btn.offsetWidth / 2) + 'px';
  }
  function popOpen(g) { osdPop = { g: g, i: 0 }; renderOsd(); }
  function popClose() { osdPop = null; renderPop(); }

  function osdTouch() {
    clearTimeout(osdTimer);
    osdTimer = setTimeout(function () { if (v.paused) osdTouch(); else closeOsd(); }, 8000);
  }

  // "Extra metadata" (Options): one switch for the OSD poster/backdrop and the guide fanart
  var gartOn = store.get('gart') !== 'off', gartFor = '', gartTimer = null;
  // artwork on the OSD: show poster (and a faint fanart backdrop) from TVmaze; nothing shown if there is none
  var artFor = '';
  /** A tile for when there is no picture (yet): the same size as a poster, in the show's own colours, with its first letter. */
  var osdPhCache = {};
  function osdPh(name) {
    var n = String(name || '?'); if (osdPhCache[n]) return osdPhCache[n];
    var h = 0; for (var i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360;
    var c = document.createElement('canvas'); c.width = 140; c.height = 210; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 140, 210); g.addColorStop(0, 'hsl(' + h + ',48%,40%)'); g.addColorStop(1, 'hsl(' + ((h + 45) % 360) + ',55%,16%)');
    x.fillStyle = g; x.fillRect(0, 0, 140, 210);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.font = '700 84px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(n.replace(/^(the|a|an)\s+/i, '').charAt(0).toUpperCase(), 70, 108);
    return (osdPhCache[n] = c.toDataURL());
  }
  /** What the bar says about whatever is playing, the same shape for a film, an episode and anything else:
   *  a title line (the film, or the show) and a line under it (year, certificate and length / series, episode and its name). */
  function osdLines(p) {
    var t = String(p.title || ''), f = filmFor(p);
    if (f || p.afilm) {
      var name = (f && f.title) || t.replace(/\s*\(\d{4}\)\s*$/, ''), y = filmYear(p), mins = f && +f.mins || 0;
      return { title: name, sub: [y || '', (f && f.cert) || p.cert || '', mins ? (mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60 ? mins % 60 + 'm' : '') : mins + ' min') : ''].filter(Boolean).join('  \u00b7  ').replace(/\s+$/, '') };
    }
    var m = /^(.*?)\s+S(\d{1,4})[ED](\d{1,3})\b\s*[-\u2013:]?\s*(.*)$/.exec(t);
    if (m) {
      return { title: p.show || m[1], sub: [(+m[2] < 1900 ? 'Series ' + (+m[2]) + '  \u00b7  ' : '') + 'Episode ' + (+m[3])].concat(m[4] ? [m[4]] : (p.addon || !p.sub ? [] : [p.sub])).join('  \u00b7  ') };
    }
    return { title: t, sub: p.addon ? '' : (p.sub || '') };
  }
  function osdArt() {
    var art = $('oart'), bg = $('obg');
    if (!gartOn || !cur || cur.ad) { art.className = 'hidden'; bg.className = ''; artFor = ''; return; }
    var title = cur.prog.title || '';
    if (title === artFor || !quiet()) return;
    artFor = title;
    bg.className = '';
    var nm = osdLines(cur.prog).title;
    var holder = function () { art.onerror = null; art.removeAttribute('src'); art.className = 'hidden'; };    // no real picture: nothing, and the title moves left
    holder();
    var film = filmFor(cur.prog);                              // a film already has its poster: no lookup needed
    if (film) {
      if (film.poster) {
        art.onerror = holder;
        art.src = film.poster;
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
      if (pic) { art.onerror = holder; art.src = pic; art.className = ''; }
      var back = d.show.background || (d.ep && d.ep.image) || '';
      if (back) { bg.style.backgroundImage = 'url("' + back + '")'; bg.className = 'on'; }
    }, function () { /* no artwork: the tile stays */ });
  }

  function openOsd() {
    if (!cur) { openGuide(); return; }
    omgBuild(); omgSig = '';
    osdOpen = true;
    document.body.classList.add('osdup');      // lifts any subtitles above the bar
    osdArt();
    osdSel = obList().indexOf('pp');      // start on play/pause
    osdZone = 'btn'; scrubT = null; osdPop = null;
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
    osdPop = null; $('opop').className = 'hidden';
    document.body.classList.remove('osdup');
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

  /** Stop: hold the picture and bring up the guide to pick something else. Back from the guide joins the channel again where it is now. */
  function stopShow() {
    closeOsd();
    scrubT = null;
    try { v.pause(); } catch (e) { /* nothing playing */ }
    if (odHomeMode()) { osdStopped = false; odBackFromPlay(true); toast('Stopped', 1500); return; }      // On Demand is home: stopping lands there, not in the guide
    openGuide();
    osdStopped = guideOpen;
    toast('Stopped', 1500);
  }
  /** Back (or Guide) in the guide: to what was playing; after Stop, tune the channel again (or carry on with an On Demand show). */
  function guideBack() {
    var again = osdStopped && cur && v.paused;
    closeGuide();
    if (!again) return;
    if (cur.od || !cur.ch.sched) { var p = v.play(); if (p && p.catch) p.catch(function () { /* ignore */ }); }
    else tune(cur.ch);
  }

  function osdAct(id) {
    if (OB_POP[id]) { popOpen(id); return; }
    if (id === 'stop') { stopShow(); return; }
    if (id === 'pp') togglePlay();
    else if (id === 'next') { closeOsd(); if (cur && cur.ad && !isAdChan(cur.ch)) skipAds(); else playNext(); return; }
    else if (id === 'skipad') { closeOsd(); skipAds(); return; }
    else if (id === 'restart') { restartShow(); return; }
    else if (id === 'options') { openOpts(); return; }
    else if (id === 'tracks') { trOpen(); return; }
    else if (id === 'od') { closeOsd(); odOpenUi(); return; }
    else if (id === 'src') { closeOsd(); adFromProg(cur && cur.prog, cur && cur.ch, true); return; }
    else if (id === 'find') { closeOsd(); adFromProg(cur && cur.prog, cur && cur.ch, false); return; }
    else if (id === 'guide') { closeOsd(); openGuide(); }
    else if (id === 'info') { closeOsd(); openInfo(); return; }
    else if (id === 'sched') { closeOsd(); csOpen(cur && cur.ch, 'osd'); return; }
    renderOsd();
  }

  function osdKey(k) {
    osdTouch();
    if (osdPop) {                       // a list is open above the bar: Up/Down pick, OK runs it, Left/Right go back to the bar
      var rows = popRows(osdPop.g);
      if (k === 'ArrowUp') { osdPop.i = (osdPop.i + rows.length - 1) % rows.length; renderPop(); return true; }
      if (k === 'ArrowDown') { osdPop.i = (osdPop.i + 1) % rows.length; renderPop(); return true; }
      if (k === 'Enter') { var id = rows[osdPop.i].id; popClose(); osdAct(id); return true; }
      if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { popClose(); return true; }
      if (k === 'ArrowLeft' || k === 'ArrowRight') popClose();
    }
    if (osdZone === 'mg' && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Enter')) {
      if (k === 'ArrowUp') omgI = (omgI + omgRows.length - 1) % omgRows.length;
      else if (k === 'ArrowDown') omgI = (omgI + 1) % omgRows.length;
      else if (k === 'ArrowLeft' || k === 'ArrowRight') osdZone = 'bar';        // sideways leaves the list for the bar (Down no longer does: it wraps)
      else if (k === 'Enter') { var mc = omgRows[omgI]; closeOsd(); if (mc && cur && mc !== cur.ch) tune(mc, true); return true; }
      renderOsd(); return true;
    }
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (osdZone === 'bar') scrubKey(k === 'ArrowLeft' ? -1 : 1);
      else { var _n = obList().length; osdSel = (osdSel + (k === 'ArrowLeft' ? -1 : 1) + _n) % _n; renderOsd(); }
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
    else if (k === 'ArrowUp' && osdZone === 'bar' && omgRows.length) { scrubApply(); osdZone = 'mg'; omgI = Math.max(0, omgRows.indexOf(cur.ch)); renderOsd(); }
    else if (k === 'ArrowDown' && osdZone === 'bar') { scrubApply(); osdZone = 'btn'; renderOsd(); }
    else if (k === 'ArrowUp' || k === 'ChannelUp') { closeOsd(); surf(1); }
    else if (k === 'ArrowDown' || k === 'ChannelDown') { closeOsd(); surf(-1); }
    else if (k >= '0' && k <= '9' && k.length === 1) { closeOsd(); onDigit(k); }
    else return false;
    return true;
  }

  // Phone: the bar that comes up over the picture can be touched. Its buttons work with a tap; the progress line is a scrubber you
  // can tap or drag.
  if (window.PHONE) (function () {
    $('obtns').addEventListener('click', function (e) {
      if (!osdOpen || !e.target.closest) return;
      var pi = e.target.closest('.opi');
      if (pi) { osdTouch(); popClose(); osdAct(pi.getAttribute('data-id')); return; }
      var t = e.target.closest('.ob');
      if (!t) return;
      osdTouch();
      var g = t.id.slice(3);
      if (osdPop && osdPop.g === g) popClose(); else { popClose(); osdAct(g); }
    });
    var pr = $('oprog');
    pr.setAttribute('data-own', '1');
    function at(e) { var t = (e.touches && e.touches[0]) || e.changedTouches[0], r = pr.getBoundingClientRect(); return Math.max(0, Math.min(1, (t.clientX - r.left) / r.width)); }
    function set(e) {
      if (!cur || cur.ad || !isFinite(v.duration) || v.duration <= 0) return;
      osdZone = 'bar'; osdTouch();
      scrubT = Math.max(0, Math.min(v.duration - 1, at(e) * v.duration));
      renderOsd();
    }
    pr.addEventListener('touchstart', set, { passive: true });
    pr.addEventListener('touchmove', set, { passive: true });
    pr.addEventListener('touchend', function () { scrubApply(); }, { passive: true });
  })();

  // A screen that stays put for minutes (the guide, On Demand, the bar, Info, Options, Teletext, a paused picture) is what wears an OLED panel, far more than moving
  // video does. With one of them open and no key or touch for five minutes the screen fades to a dim; any key or touch brings it back.
  var uiAt = Date.now();
  function uiTouched() { uiAt = Date.now(); document.body.classList.remove('idle-dim'); }
  // The key that wakes a dimmed screen only wakes it: it must not also press OK on whatever the guide had highlighted.
  window.addEventListener('keydown', function (e) {
    if (started && document.body.classList.contains('idle-dim')) { uiTouched(); e.preventDefault(); e.stopImmediatePropagation(); }
    else uiTouched();
  }, true);
  window.addEventListener('pointerdown', uiTouched, true);
  setInterval(function () {
    if (!started || Date.now() - uiAt < 300000) return;
    var still = guideOpen || odOpen || osdOpen || optsOpen || infoOpen || relOpen || !!tt || !!cs || !!gm || quitOpen || !!(cur && v.paused);      // a paused frame is the stillest picture of all
    document.body.classList.toggle('idle-dim', !!still);
  }, 20000);
  var lastKeyAt = 0;
  window.addEventListener('keydown', function (e) {
    lastKeyAt = Date.now();
    perfKey(e.key);
    if (!started) {
      if (e.key === 'GoBack' || e.key === 'Escape' || e.key === 'Backspace') { exitApp(); e.preventDefault(); }
      return;
    }
    var k = e.key;
    var handled = true;

    if (quitOpen) { quitKey(k); e.preventDefault(); return; }
    if (k === 'OnDemand') {                                   // the phone's remote: On Demand from anywhere that is not already a panel
      e.preventDefault();
      if (!odOpen && !optsOpen && !infoOpen && !relOpen && !gm && !kbShown && !cs) odOpenUi();
      return;
    }
    if (!odOpen && (k === 'GoBack' || k === 'Escape' || k === 'Backspace')) {
      var nowT = Date.now();
      // only a Back pressed on the plain picture (or the guide with nothing playing) counts towards quitting:
      // one that closes the guide, the bar, the options or a panel never does
      if (relOpen || infoOpen || optsOpen || osdOpen || gm || cs || tt) lastBack = 0;
      else if (!e.repeat && nowT - lastBack < DOUBLE_BACK_MS) { lastBack = 0; openQuit(); e.preventDefault(); return; }   // includes the guide a first Back has just opened
      else if (guideOpen && cur) lastBack = 0;               // a Back that closes the guide on its own never counts
      else if (!e.repeat) lastBack = nowT;
    }

    if (kbShown) { kbKey(e); e.preventDefault(); return; }
    if (odStill) { odStillKey(k); e.preventDefault(); return; }
    if (cur && cur.od && !odOpen && !guideOpen && !osdOpen && !gm && !$('odnx').classList.contains('hidden')) {
      if (k === 'Enter' || k === ' ') { odNxEl(false); odStep(1); e.preventDefault(); return; }
      if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { odNxFor = cur.prog.url + '|x'; odNxEl(false); e.preventDefault(); return; }
    }
    if (ad) { adnKey(k); e.preventDefault(); return; }
    if (tt) { ttKey(k); e.preventDefault(); return; }
    if (gm && cs) { if (k !== 'Info') gmKey(k); e.preventDefault(); return; }
    if (cs) { csKey(k); e.preventDefault(); return; }

    if (relOpen) {                        // What's new sits above the options panel it was opened from
      if (relKey(k)) e.preventDefault();
      return;
    }

    if (infoOpen) {                       // Info: the arrows move through its rows, OK presses, Back goes back a step
      if (!(e.repeat && (k === 'Enter' || k === ' '))) infoKey(k);     // an OK still held from opening Info presses nothing
      e.preventDefault();
      return;
    }

    // Options opened from On Demand (its hold-OK menu) sits on top of it: the keys are for Options, not the screen underneath
    if (odOpen && optsOpen) { if (k === 'Guide' || k === 'Red') closeOpts(); else optsKey(k); e.preventDefault(); return; }
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
      else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { if (odHomeMode()) odOpenUi(true); else if (cur) guideBack(); else pressBackToExit(); }
      else if (k === 'Guide') guideBack();
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
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') {          // watching: Back goes to the TV guide, or to On Demand when On Demand is home and this was picked there
      if (odHomeMode()) odBackFromPlay(); else openGuide();
    }
    else handled = false;

    if (handled) e.preventDefault();
  });


  // ------------------------------------------------------------------ On Demand
  // Browse by channel, then show, then series and episode, and play any of it from the start. Not clock-synced:
  // it plays like a recording, with the usual bar to pause and skip, and carries on to the next episode.
  var odOpen = false, odFrom = '', odGuide = null, odData = {}, odArtFor = '', odBgFor = '';
  var odView = 'home', odRi = 0, odRc = null, odTop = 0, odPos = {}, odZone = 0, odSea = 0, odEi = 0;
  var OD_VIS = window.PHONE ? 10 : 7;            // posters across a row
  var OD_EPS = 6;
  var OD_SEA = 6;           // seasons listed down the left at once
  var odSb = false;         // the Search pill in the header has the highlight           // episodes on screen at once
  var OD_SKIP = { xmasmusic: 1, tvarchive: 1, adbreak: 1 };         // songs and dated clips are not shows
  var OD_FILMS = { kidsmovies: 1, videoshop: 1, xmasmovies: 1, mc_action: 1, mc_horror: 1, mc_scifi_movies: 1, mc_comedy_movies: 1, mc_thriller: 1, mc_drama_movies: 1 };       // the film channels: each film is its own one-video title
  function odChannels() {
    return guideList().filter(function (c) { return c.status === 'ready' && !OD_SKIP[c.id]; });
  }
  function odPad(n) { return n < 10 ? '0' + n : String(n); }
  function odEpLabel(p, ref) {
    var m = /^(.*?)\s+S\d{1,4}[ED]\d{1,3}\b\s*(.*)$/i.exec(p.title || '');
    if (!p.shorts && ref && m) return 'E' + odPad(ref.e) + (m[2] ? '   ' + m[2] : '');
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

  // ---- YouTube as a second source (data/yt.json from the scraper). The files are not on archive.org: the app's own
  // player looks the stream up when you press play (NativePlayer.java), so a video is stored here as "yt:<id>".
  var realOn = store.get('real1') !== 'off';       // on unless it was switched off
  var ytOn = store.get('yt1') !== 'off';
  var ytP = null, ytDead = store.get('ytdead2') || {};
  function ytAvailable() { try { return !!(window.NativeHttp && window.NativeHttp.npOpen); } catch (e) { return false; } }
  // A channel's saved On Demand list has to be built again when the YouTube list for it changes: a small stamp per channel, kept between starts.
  var ytRevMap = store.get('ytrev2') || {};
  function ytRevOf(id) { return ytOn && ytRevMap[id] ? ':y' + ytRevMap[id] : ''; }
  function ytRevSet(d) {
    var acc = {};
    Object.keys(d || {}).forEach(function (name) {
      var sh = d[name]; if (!sh || !sh.videos) return;
      var ch = sh.channel || 'gameshows';
      acc[ch] = ((acc[ch] || 7) * 31 + sh.videos.length * 17 + name.length) % 1000000007;
    });
    var out = {}, changed = false;
    Object.keys(acc).forEach(function (k) { out[k] = acc[k].toString(36); });
    Object.keys(out).forEach(function (k) { if (ytRevMap[k] !== out[k]) { changed = true; delete odiJobs[k]; delete odiMem[k]; } });
    if (!changed) return;
    ytRevMap = out; store.set('ytrev2', out);
    dlog('YOUTUBE: the list changed (' + Object.keys(d).length + ' shows); On Demand lists for its channels are built again');
    odWarmed = false; setTimeout(odWarm, 15000);
  }
  /** After start-up, load the YouTube list quietly so a changed list is noticed and the channels it touches are rebuilt. */
  function ytWarm() {
    if (!ytOn || !ytAvailable()) return;
    if (!quiet() || Date.now() - lastKeyAt < 4000 || cur && !v.paused) { setTimeout(ytWarm, 8000); return; }
    ytLoad();
  }
  function ytLoad() {
    if (!ytOn || !ytAvailable()) return Promise.resolve({});
    if (ytP) return ytP;
    var c = store.get('yt2');
    ytP = (c && c.d && Date.now() - c.t < 6 * 3600000 ? Promise.resolve(c.d)
      : getJSON(DATA_BASE + 'yt.json?' + Math.floor(Date.now() / 3600000)).then(function (d) { store.set('yt2', { t: Date.now(), d: d }); return d; }))
      .then(function (d) { d = d && typeof d === 'object' ? d : {}; try { ytRevSet(d); } catch (e) { /* stamp not updated */ } return d; }, function () { return (c && c.d) || {}; });
    return ytP;
  }
  var YT_JUNK = /\b(best of|compilation|highlights?|reaction|reacts?|review|live ?stream|live:|music video|official video|trailer|behind the scenes|interview|bloopers?|billionaire|ceo)\b/i;      // the last two: short-drama channels that turn up under show names like Blind Date
  /** After the cut-off year, or a title and air date that disagree, so the scraper's match to the guide was wrong. */
  function ytLate(x) {
    var ys = String(x.title || '').match(/\b(?:19|20)\d\d\b/g) || [];
    for (var i = 0; i < ys.length; i++) if (+ys[i] > ERA_END) return true;
    var a = parseInt(String(x.airdate || '').slice(0, 4), 10);
    return a > ERA_END;
  }
  function ytAired(x) {
    var a = String(x.airdate || ''), y = parseInt(a.slice(0, 4), 10), ys = (String(x.title || '').match(/\b(?:19|20)\d\d\b/g) || []).map(Number);
    if (!y) return '';
    for (var i = 0; i < ys.length; i++) if (Math.abs(ys[i] - y) > 1) return '';     // the title's year says otherwise: leave the date out
    return a;
  }
  /** The stored videos as programmes, for one channel (or for every channel when chId is null). */
  /** names: shows (normalised) the channel already lists, whose YouTube copies come too wherever yt.json files them. */
  function ytNames(progs) {
    var m = {};
    (progs || []).forEach(function (p) { var n = LIBROUTE.norm(p.show || p.group || (parseTitle(p.title || '').show) || ''); if (n) m[n] = 1; });
    return m;
  }
  /** Season and episode of a stored video: the scraper's numbers, else read from the title ("S2 Ep1", "Series 3 Episode 4", "S4 || Episode 33"). */
  function ytSE(x) {
    var sn = +x.season || 0, ep = +x.ep || 0, t = String(x.title || '');
    if (!sn) { var a = /\b(?:S|Series|Season)\.?\s*0*(\d{1,2})\b/i.exec(t); if (a) sn = +a[1]; }
    if (!ep) { var b = /\b(?:E|Ep|Episode|Show)\.?\s*0*(\d{1,3})\b/i.exec(t); if (b) ep = +b[1]; }
    return { s: sn, e: ep };
  }
  function ytProgs(data, chId, names) {
    var out = [];
    Object.keys(data || {}).forEach(function (name) {
      var sh = data[name];
      if (!sh || !sh.videos || (chId && (sh.channel || 'gameshows') !== chId && !(names && names[LIBROUTE.norm(name)]))) return;
      var show = name === name.toLowerCase() ? name.replace(/\b[a-z]/g, function (m) { return m.toUpperCase(); }) : name;
      sh.videos.forEach(function (x) {
        if (!x || !x.id || !(x.dur > 120) || ytDead[x.id] || YT_JUNK.test(x.title || '') || ytLate(x)) return;
        var se = ytSE(x), sn = se.s, ep = se.e, coded = sn > 0 && ep > 0;
        var et = x.epTitle && !/^(?:episode|show|series \d+,? show)\s*\d*$/i.test(x.epTitle) ? ' ' + x.epTitle : '';
        out.push({ id: 'yt/' + x.id, item: 'yt', url: 'yt:' + x.id, title: coded ? show + ' S' + pad2(sn) + 'E' + pad2(ep) + et : (x.title || show),
          sub: '', dur: x.dur, lenKnown: 1, show: show, group: show, aired: ytAired(x), yt: 1, by: x.by || '', ytTitle: x.title || '' });
      });
    });
    return out;
  }
  function ytMarkDead(id) { ytDead[id] = Date.now(); Object.keys(ytDead).forEach(function (k) { if (Date.now() - ytDead[k] > 86400000) delete ytDead[k]; }); store.set('ytdead2', ytDead); }
  /** Only a video YouTube calls gone, private or blocked is left out; a refusal that hits every video (bot check, network) says nothing about this one. */
  function ytGone(msg) { return /UNPLAYABLE|unavailable|private|removed|deleted|not available|copyright|terminated/i.test(String(msg || '')) && !/LOGIN_REQUIRED|bot/i.test(String(msg || '')); }
  /**
   * How good a stored copy of an episode is, to pick the one that plays first (the others are kept as fall-backs and
   * for "Try another version"). An archive.org file is a plain file with no lookup, so it leads; a YouTube copy is next.
   * Copies of the right running time beat ones that are far off it (a part, a stitched pair, a clip), and a copy that
   * keeps the adverts, or is a file the web view often cannot play, ranks below a clean one.
   */
  function copyScore(p, med) {
    var sc = p.yt ? 20 : 60, u = String(p.url || '');
    if (!p.yt) { if (/\.mkv$/i.test(u)) sc -= 8; }
    else {
      var t = p.ytTitle || '';
      if (/\bads?\b|adverts?|commercials?/i.test(t)) sc -= 8;
      if (/\b(?:hd|hq|1080p|720p|remaster(?:ed)?)\b/i.test(t)) sc += 4;
    }
    if (med && p.dur && (p.lenKnown || p.yt)) sc -= Math.min(30, Math.round(Math.abs(p.dur - med) / med * 60));
    if (!p.yt) sc = Math.max(sc, 26);          // order of play: the addon first (Magic EPG), then the archive copy, then YouTube; a poor archive copy still leads a YouTube one
    return sc;
  }
  window.__ytNote = function (t) { dlog('YOUTUBE stream: ' + t); };
  function odSeasons(g) {
    var by = {}, other = [], list = [];
    var otherYt = [];
    g.eps.forEach(function (ep) {
      if (ep.s > 0) { (by[ep.s] = by[ep.s] || []).push(ep); return; }
      if (ep.p.yt) {                          // an upload with no season number but a year: it sits in that year with the rest of the show, not in a list of its own
        var yr = /^(?:19|20)\d\d/.exec(String(ep.p.aired || '')) || /\b(19[5-9]\d|200\d)\b/.exec(ep.p.ytTitle || '');
        if (yr && +yr[0] <= ERA_END) { (by[+yr[0]] = by[+yr[0]] || []).push(ep); return; }
        otherYt.push(ep);
      } else other.push(ep);
    });
    Object.keys(by).map(Number).sort(function (x, y) { return x - y; }).forEach(function (n) { list.push({ name: n >= 1900 ? String(n) : 'Season ' + n, eps: by[n] }); });
    if (other.length) list.push({ name: list.length ? 'Other videos' : g.shorts ? 'Shorts' : 'Videos', eps: other });
    if (otherYt.length) list.push({ name: 'More from YouTube', eps: otherYt });
    var per = {};
    g.eps.forEach(function (ep) { var m = /\/download\/([^/]+)\//.exec(ep.p.url || ''); ep.item = m ? m[1] : ''; if (ep.item) per[ep.item] = (per[ep.item] || 0) + 1; });
    g.eps.forEach(function (ep) { ep.thumb = ep.item && per[ep.item] === 1 ? 'https://archive.org/services/img/' + ep.item : ''; });   // a shared item would repeat one picture
    g.sea = list;
    g.flat = [];
    list.forEach(function (sn) { g.flat = g.flat.concat(sn.eps); });
  }
  // Shows the library names two ways ("Poirot" and "Agatha Christies Poirot" both turn up), so On Demand showed each twice,
  // with the same episodes. Until the scraper settles on one name, these are brought together here.
  var SHOW_ALIAS = { 'poirot': "Agatha Christie's Poirot", 'agatha christies poirot': "Agatha Christie's Poirot", 'agatha christie poirot': "Agatha Christie's Poirot" };
  /** A channel's programmes grouped into shows, each with its seasons and episodes in order. */
  /** "Choose the right show" renames the show: a library name picked as another show reads, groups and fills as that show. */
  function odRenamed(name) {
    var fx = store.get('artfix:' + normShow(name));
    return fx && fx.rn && fx.a && fx.a.name ? fx.a.name : name;
  }
  function odRenameProgs(progs) {
    var memo = {};
    return progs.map(function (p) {
      if (p.filmKey) return p;
      var n = p.show || p.group || parseTitle(p.title || '').show; if (!n) return p;
      var r = memo[n] || (memo[n] = odRenamed(n));
      return r === n ? p : Object.assign({}, p, { show: r, group: r });
    });
  }
  /** The title a programme is listed under in On Demand: a film is its own title, and two spellings of one show are one show. */
  function odShowName(p, films) {
    var name = (p.filmKey || films) ? (p.title || 'Film') : (p.show || p.group || (parseTitle(p.title || '').show) || 'Other');
    if (!films && !p.filmKey && SHOW_ALIAS[LIBROUTE.norm(name)]) name = SHOW_ALIAS[LIBROUTE.norm(name)];
    return name;
  }
  function odGroup(progs, films) {          // films: a film channel, where every video is its own title
    var by = {}, shows = [];
    progs.forEach(function (p) {
      var name = odShowName(p, films);
      var k = 'k' + LIBROUTE.norm(name);
      var g = by[k];
      if (!g) { g = by[k] = { name: name, eps: [], seen: {} }; shows.push(g); }
      var ref = window.LINKS && LINKS.parseEp(p.title);
      var key = ref ? ref.s + 'x' + ref.e : '';
      if (key && g.seen[key]) { g.seen[key].cands.push(p); return; }       // another copy of the same episode
      var ent = { p: p, s: ref ? ref.s : 0, e: ref ? ref.e : 0, label: odEpLabel(p, ref), year: p.aired ? String(p.aired).slice(0, 4) : '', cands: [p], ref: ref };
      if (key) g.seen[key] = ent;
      g.eps.push(ent);
    });
    // where an episode has several copies, the best plays and the rest stay behind it as fall-backs
    shows.forEach(function (g) {
      var ds = [];
      g.eps.forEach(function (en) { var q = en.cands[0]; if (q.dur && (q.lenKnown || q.yt)) ds.push(q.dur); });
      ds.sort(function (a, b) { return a - b; });
      var med = ds.length ? ds[Math.floor(ds.length / 2)] : 0;
      g.eps.forEach(function (en) {
        if (en.cands.length > 1) {
          var sc = en.cands.map(function (q, i) { return { q: q, s: copyScore(q, med), i: i }; });
          sc.sort(function (a, b) { return (b.s - a.s) || (a.i - b.i); });          // ties keep the order the files were found in
          var rest = sc.slice(1).map(function (x) { return x.q; });
          en.p = sc[0].q === en.cands[0] && !rest.length ? sc[0].q : Object.assign({}, sc[0].q, { alts: rest });
          en.label = odEpLabel(en.p, en.ref);
          en.year = en.p.aired ? String(en.p.aired).slice(0, 4) : en.year;
        }
        delete en.cands; delete en.ref;
      });
      delete g.seen;
    });
    shows.sort(function (a, b) { var x = LIBROUTE.norm(a.name), y = LIBROUTE.norm(b.name); return x < y ? -1 : x > y ? 1 : 0; });
    shows.forEach(function (g) {
      g.eps.sort(function (a, b) {
        return (a.s - b.s) || (a.e - b.e) || (String(a.p.aired || '') < String(b.p.aired || '') ? -1 : String(a.p.aired || '') > String(b.p.aired || '') ? 1 : 0) ||
               String(a.label).localeCompare(String(b.label), undefined, { numeric: true, sensitivity: 'base' });
      });
      g.film = !!films || !!(g.eps[0] && g.eps[0].p.filmKey);
      g.shorts = !g.film && g.eps.length > 0 && g.eps.every(function (e) { return e.p.shorts; });
      odSeasons(g);
    });
    return shows;
  }
  // ---- On Demand index. One small row per show (name, slug, poster p, logo l, backdrop b, certificate, year, how many
  // episodes and seasons, and which rows of the channel's list it is made of), kept per channel under the revision of the
  // library like rt1:, and built in slices after the guide is up. The home rows, the hero and Browse read only this: the
  // heavy steps (virtualFill, odGroup) run for one show when its page is opened (odHydrate), never for a whole channel.
  var odiJobs = {}, odiMem = {}, odRaw = {}, odRawOrder = [];
  function odRevOf(id) { return (libRevs && libRevs[id]) || (dataRevs && dataRevs[id]) || ''; }
  function odiSig() { return E.hash(['4', depgActive() ? 'm' : '', adCut ? 'c' : '', ukOn ? ukRev : '', removedRev, filmdbRev, artRev, BAD_SALT, E.hash(Object.keys(hid).sort().join(','))].join('.')).toString(36); }
  function odiKey(id) { var r = odRevOf(id); return r ? 'odi1:' + id + ':' + r + ':' + odiSig() + ytRevOf(id) : ''; }
  /** Whether a channel's rows are saved for this library revision (without reading them). */
  function odiHas(id) { var key = odiKey(id), m = odiMem[id]; return !!((m && m.key === key) || (key && KV_NATIVE && kvNative()[key])); }
  /** The saved rows of a channel for this library revision, or null when they have not been built yet. */
  function odiRead(id) {
    var key = odiKey(id), m = odiMem[id];
    if (m && m.key === key) return m.rows;
    if (!key || !KV_NATIVE) return null;
    jm('read saved index ' + id);
    try { var t = kv.getItem(key), j = t && JSON.parse(t); if (j && j.rows) { odiMem[id] = { key: key, rows: j.rows }; return j.rows; } } catch (e) { /* built again */ }
    return null;
  }
  function odiKeep(id, rows) {
    var key = odiKey(id);
    odiMem[id] = { key: key, rows: rows };
    if (!key || !KV_NATIVE) return;
    try {
      kv.setItem(key, JSON.stringify({ rows: rows }));
      Object.keys(kvNative()).forEach(function (kn) { if (kn !== key && kn.indexOf('odi1:' + id + ':') === 0) kv.removeItem(kn); });
    } catch (e) { /* too big to keep: built again when wanted */ }
  }
  function odiDrop(id) {
    var key = odiKey(id); delete odiMem[id]; delete odiJobs[id]; delete odRaw[id];
    try { if (key) kv.removeItem(key); } catch (e) { /* ignore */ }
  }
  /** The library rows of a channel turned into programmes, in small slices; each programme remembers the row it came from (_ix). */
  function odiConvert(items, chId) {
    return new Promise(function (resolve) {
      var out = [], i = 0, n = 4;
      (function step() {
        if (!odOpen && userBusy()) { setTimeout(step, 250); return; }
        var t0 = performance.now(), end = Math.min(items.length, i + n);
        for (var j = i; j < end; j++) { var part = progsFromData([items[j]], chId, true); for (var k = 0; k < part.length; k++) { part[k]._ix = j; out.push(part[k]); } }
        var ms = performance.now() - t0; i = end;
        n = ms < 5 ? n * 2 : ms > 10 ? Math.max(1, n >> 1) : n;
        if (i < items.length) setTimeout(step, 0); else resolve(out);
      })();
    });
  }
  function odiArt(name) {
    if (!artIdx || !name) return null;
    var w = String(name).split(/\s+/);
    for (var n = w.length; n >= 1; n--) { var h = artIdx[normShow(w.slice(0, n).join(' '))]; if (h && (n > 1 || w.length === 1)) return h; }
    return null;
  }
  /** Build and keep one channel's rows. */
  function odiBuild(ch) {
    if (odiJobs[ch.id]) return odiJobs[ch.id];
    var films = !!OD_FILMS[ch.id], t0 = Date.now();
    return (odiJobs[ch.id] = odiItems(ch).then(function (items) {
      return odiConvert(items || [], ch.id);
    }).then(function (all) {
      return ytLoad().then(function (yt) { var y = ytProgs(yt, ch.id, ytNames(all)); y.forEach(function (p) { p._ix = -1; }); return y.length ? all.concat(y) : all; });
    }).then(function (all) {
      return Promise.all([loadFilmdb(), loadUk(), loadArt()]).then(function () { return all; });
    }).then(function (all) {
      jm('group index ' + ch.id);
      var progs = ukFilter(all.filter(function (p) { return (films || !p.filmKey) && !blocked(p); }));
      progs = films ? virtualFilms(ch, progs, true) : odRenameProgs(progs).filter(function (p) { return ch.id === 'disney' || inEra(p); });
      var by = {}, rows = [];
      progs.forEach(function (p) {
        var nm = odShowName(p, films), k = LIBROUTE.norm(nm), r = by[k];
        if (!r) { r = by[k] = { n: nm, ix: [], ne: 0, ses: {}, y: 0 }; rows.push(r); }
        if (p._ix >= 0) { if (r.ix.indexOf(p._ix) < 0) r.ix.push(p._ix); } else if (p._ix === -1) r.yt = 1; else if (p.virtual) r.v = 1;
        r.ne++;
        if (p.shorts) r.sh = 1;
        if (p.filmKey) { r.f = 1; r.k = r.k || p.filmKey; }
        if (p.cert && !r.c) r.c = String(p.cert);
        var ref = window.LINKS && LINKS.parseEp(p.title); if (ref && ref.s > 0) r.ses[ref.s] = 1;
        var a = parseInt(String(p.aired || '').slice(0, 4), 10); if (a > 1900 && (!r.y || a < r.y)) r.y = a;
      });
      rows.forEach(function (r) {
        r.ns = Object.keys(r.ses).length; delete r.ses; r.s = odSlug(r.n);
        if (r.f) { delete r.yt; if (r.v) delete r.ix; } else { r.f = 0; }
        if (!r.ix || !r.ix.length) delete r.ix;
        var a = !r.f && !r.sh && odiArt(r.n); if (a) { if (a.p) r.p = a.p; if (a.b) r.b = a.b; if (a.l) r.l = a.l; }
      });
      rows.sort(function (a, b) { var x = LIBROUTE.norm(a.n), y = LIBROUTE.norm(b.n); return x < y ? -1 : x > y ? 1 : 0; });
      odiKeep(ch.id, rows);
      dlog('ONDEMAND: index built for ' + ch.id + ': ' + rows.length + ' shows in ' + (Date.now() - t0) + ' ms');
      return rows;
    }));
  }
  /** A channel's raw library rows, the last three kept for the shows being opened. */
  function odiItems(ch) {
    if (odRaw[ch.id]) return odRaw[ch.id];
    var rev = odRevOf(ch.id);
    jm('load library ' + ch.id);
    var p = odRaw[ch.id] = loadDataIndex().then(function (idx) { return loadChannelData(ch.id, rev || idx[ch.id] || ''); });
    odRawOrder = odRawOrder.filter(function (x) { return x !== ch.id; }); odRawOrder.push(ch.id);
    while (odRawOrder.length > 3) delete odRaw[odRawOrder.shift()];
    return p;
  }
  /** A row of the index as a show that has no episodes yet: enough to draw its card, the hero and Browse. */
  function odiStub(r, ch) {
    var g = { name: r.n, chan: ch, film: !!r.f, eps: [], sea: [], flat: [], stub: true, ix: r.ix || null, k: r.k || '', virt: !!r.v, yt: !!r.yt,
              shorts: !!r.sh, nEps: r.ne || 0, nSea: r.ns || 0, cert: r.c || '', yr: r.y || 0, il: r.l || '' };
    if (r.f) g.eps = [{ p: { filmKey: r.k, title: r.n, show: '', cert: r.c || '', aired: r.y ? String(r.y) : '' }, s: 0, e: 0 }];
    else if (!r.sh && (r.p || r.b)) { g._k = { poster: https(r.p || ''), back: https(r.b || '') }; g._kg = odKGen; }
    return g;
  }
  /** Put a show's episodes, seasons and copies together, for this one show: what opening its page needs. */
  function odHydrate(g) {
    if (!g || !g.stub) return Promise.resolve(g);
    if (g._hp) return g._hp;
    var ch = g.chan, films = !!OD_FILMS[ch.id], key = LIBROUTE.norm(g.name);
    return (g._hp = Promise.all([g.ix ? odiItems(ch) : null, ytLoad(), loadEpdb(), loadFilmdb(), loadUk()]).then(function (r) {
      jm('open show ' + g.name);
      var items = r[0] || [], rows = (g.ix || []).map(function (i) { return items[i]; }).filter(Boolean);
      var all = rows.length ? progsFromData(rows, ch.id, true) : [];
      if (g.yt) all = all.concat(ytProgs(r[1], ch.id, ytNames(all)));
      all = all.filter(function (p) { return (films || !p.filmKey) && !blocked(p); });
      if (films) { if (g.virt) all = virtualFilms(ch, [], true).filter(function (p) { return p.filmKey === g.k; }); }
      else all = virtualFill(ch, odRenameProgs(all), true);
      all = all.filter(function (p) { return LIBROUTE.norm(odShowName(p, films)) === key && (films || ch.id === 'disney' || inEra(p)); });
      var h = odGroup(all, films).filter(function (x) { return LIBROUTE.norm(x.name) === key; })[0];
      g._hp = null;
      if (!h || !h.eps.length) throw new Error('no episodes found for ' + g.name);
      g.eps = h.eps; g.sea = h.sea; g.flat = h.flat; g.film = h.film; g.shorts = h.shorts; g.stub = false; g.ix = null;
      return g;
    }, function (e) { g._hp = null; throw e; }));
  }
  function odLoadChannel(ch) {
    if (ch.id === '_sr') return Promise.resolve(odData._sr || { shows: [] });       // the search row, like Continue watching, is made from the others
    if (ch.id === '_cw') return Promise.resolve(odData._cw || { shows: [] });     // the Continue watching row is made from the others
    var rec = odData[ch.id];
    if (rec) return rec.p;
    rec = odData[ch.id] = { shows: null };
    var take = function (rows) { rec.shows = rows.map(function (r) { return odiStub(r, ch); }); odRowsMemo = null; return rec; };
    var saved = odiRead(ch.id);
    if (saved) { take(saved); return (rec.p = Promise.resolve(rec)); }      // built before: read at once, nothing to wait for
    return (rec.p = odiBuild(ch).then(take, function () { rec.shows = []; return rec; }));
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
  var cwBlock = '';          // a show taken off Continue watching while it plays is not put straight back
  function cwDrop(name) {
    cwBlock = name;
    cwList = cwGet().filter(function (e) { return e.n !== name; }); cwGen++;
    store.set('cw1', cwList);
    Object.keys(odData).forEach(function (k) { var r = odData[k]; if (r && r.shows) r.shows.forEach(function (g) { if (g._cw && g._cw.n === name) g._cw = null; }); });
  }
  v.addEventListener('timeupdate', function () {         // the last 12 s of an On Demand episode: say what is next
    var o = cur && cur.od, nx = o && !cur.ad && !odStill && odPeek();
    if (!nx || !isFinite(v.duration) || v.duration < 120) { odNxEl(false); return; }
    var left = v.duration - v.currentTime;
    if (left > 12 || left <= 0.3 || osdOpen || odNxFor === cur.prog.url + '|x') { odNxEl(false); return; }     // the bar and the mini guide win
    odNxEl(true, '<b>Next in ' + Math.ceil(left) + ' s</b><span>' + (nx.title || 'Next episode').replace(/[<&]/g, '') + '</span><span>OK plays now, Back stays</span>');
  });
  var cwLast = 0;
  v.addEventListener('timeupdate', function () {         // every 10 s of an On Demand episode, remember where you are
    var o = cur && cur.od;
    if (!o || cur.ad || !o.name || o.name === cwBlock || v.paused || !(v.currentTime > 5)) return;
    var now = Date.now();
    if (now - cwLast < 10000) return;
    cwLast = now;
    cwPut(o.name, cur.ch.id, cur.prog.url, v.currentTime, isFinite(v.duration) ? v.duration : 0);
  });
  var cwPseudo = { id: '_cw', n: '', name: 'Continue watching' }, cwSig = '';
  /** The Continue watching row, or null when there is nothing in it. It reuses the shows of the channel lists
   *  (so posters and details come for free); a show whose channel list is not built yet simply is not in it yet. */
  function odCwRow() {
    var shows = [], sig = '', chs = null, wait = false;
    cwGet().forEach(function (e) {
      if (!odData[e.ch]) { chs = chs || odChannels(); if (chs.some(function (x) { return x.id === e.ch; })) wait = true; }
    });
    if (wait) return odData._cw && odData._cw.shows.length ? cwPseudo : null;      // some of its channels are still loading: the row is drawn once, complete, not a few posters at a time
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
  // ---- search: Yellow (or the hold-OK menu) asks for a name; the matches from every channel become the top row
  var srPseudo = { id: '_sr', n: '', name: 'Search' }, odQuery = '', odNone = '', odNoneI = 0;   // odNone: the search that found nothing, shown as a page of its own
  function odSearchAsk() {
    kbOpen({ title: 'Search On Demand', label: 'Search', value: odQuery, save: odSearchRun });
  }
  function odSearchRun(q) {
    odQuery = q; odNone = '';
    if (!q) { odData._sr = null; odRowsMemo = null; if (odOpen) odRender(); return; }
    toast('Searching…', 1500);
    Promise.all(odChannels().map(function (c) { return odLoadChannel(c).then(null, function () { /* that channel is skipped */ }); })).then(function () {
      var words = normShow(q).split(' ').filter(Boolean), seen = {}, hits = [];
      odChannels().forEach(function (c) {
        ((odData[c.id] && odData[c.id].shows) || []).forEach(function (g) {
          var n = normShow(g.name), k = n + (g.film ? '|film' : '');
          if (seen[k] || !words.length || !words.every(function (w) { return n.indexOf(w) >= 0; })) return;
          seen[k] = 1; hits.push({ g: g, n: n, r: n.indexOf(words[0]) === 0 ? 0 : 1 });
        });
      });
      hits.sort(function (a, b) { return a.r - b.r || (a.n < b.n ? -1 : a.n > b.n ? 1 : 0); });
      odRowsMemo = null;
      if (!hits.length) { odData._sr = null; odNone = q; odNoneI = 0; odRet = null; odJumpRow = null; if (odView !== 'home') odSetView('home'); odZn = 'rows'; if (odOpen) odRender(); return; }
      odData._sr = { shows: hits.map(function (h) { return h.g; }) };
      srPseudo.name = 'Search: ' + q + '   (' + hits.length + ')';
      odPos._sr = 0; odRet = null; odJumpRow = null; odRowsMemo = null; odRc = srPseudo; odRi = 0; odZn = 'rows';
      if (odOpen) { if (odView !== 'home') odSetView('home'); odRender(); }
    });
  }
  // ---- On Demand home: filter chips, a rotating hero, then "On now", Continue watching, My list and rows by genre.
  // The rows are built from the channel lists (a genre row joins a few channels), and only the rows near the highlight
  // are loaded, one channel at a time, so opening On Demand never builds everything at once.
  var OD_CHIPS = ['Home', 'Shows', 'Films', 'Kids', 'Channels', 'Favourites'], OD_TOOLS = ['Search', 'Guide', 'Options'];
  /** The stops on the top bar that exist here: all nine on TV; on a phone the rail has the rest. */
  function odBarVis() { return window.PHONE ? [0, 1, 2, 3, 6] : [0, 7, 1, 2, 3, 4, 5, 6, 8]; }      // on the TV the bar reads Home, Guide, Shows, Films, Kids, Channels, Favourites, then Search and Options
  /** The bar has focus: on the home page, in Browse, or in Favourites. */
  function odBarOn() { return odView === 'home' ? odZn === 'chips' : odView === 'grid' ? odGz === 'bar' : odView === 'fav' ? odFz === 'bar' : false; }
  /** Which tab is the current one. */
  function odBarCur() { return odView === 'grid' ? 4 : odView === 'fav' ? 5 : odChip; }
  var OD_GENRES = [
    { id: '_g_drama', name: 'Drama', k: 'tv', ch: ['drama', 'usdrama', 'mc_crime', 'mc_period', 'mc_action_tv', 'mc_scifi'] },
    { id: '_g_mix', name: 'A bit of everything', k: 'tv film kids', mix: 60, ch: ['drama', 'sitcoms', 'gameshows', 'comedy', 'usdrama', 'soaps', 'music', 'cooking', 'entertainment', 'tv70s', 'tv80s', 'tv90s', 'mc_scifi', 'mc_crime', 'mc_period', 'mc_sketch', 'mc_toons_classic', 'mc_xmas_comedy', 'videoshop', 'mc_horror', 'mc_comedy_movies', 'mc_thriller', 'kidsmovies', 'mc_rock'] },
    { id: '_g_nostalgia', name: 'Throwback telly', k: 'tv kids', mix: 40, ch: ['tv70s', 'tv80s', 'tv90s', 'mc_toons80', 'mc_toons90', 'mc_sitcom90', 'mc_sitcom_gold', 'mc_teen', 'childrens', 'citv', 'saturday'] },
    { id: '_g_kids', name: 'Kids’ TV and cartoons', k: 'kids', ch: ['citv', 'childrens', 'offschool', 'disney', 'mc_cbbc', 'mc_toons80', 'mc_toons90', 'mc_toons_classic', 'mc_nursery', 'mc_teen', 'kidsxmas', 'mc_xmas_toons'] },
    { id: '_g_films', name: 'Films', k: 'film', ch: ['videoshop', 'mc_action', 'mc_horror', 'mc_scifi_movies', 'mc_comedy_movies', 'mc_thriller', 'mc_drama_movies'] },
    { id: '_g_scifi', name: 'Sci-fi and fantasy', k: 'tv film', ch: ['mc_scifi', 'mc_scifi_movies'] },
    { id: '_g_scary', name: 'Thrillers and horror', k: 'tv film', ch: ['mc_horror', 'mc_thriller', 'mc_crime'] },
    { id: '_g_kidsfilms', name: 'Kids’ films', k: 'kids film', ch: ['kidsmovies'] },
    { id: '_g_comedy', name: 'Comedy', k: 'tv', ch: ['sitcoms', 'comedy', 'ussitcoms', 'mc_sitcom_gold', 'mc_sitcom90', 'mc_tgif', 'mc_sketch'] },
    { id: '_g_games', name: 'Game shows', k: 'tv', ch: ['gameshows', 'mc_quiz', 'mc_challenge', 'games'] },
    { id: '_g_ent', name: 'Entertainment', k: 'tv', ch: ['entertainment', 'saturday', 'itvam', 'noel', 'mc_light_ent', 'mc_daytime'] },
    { id: '_g_soaps', name: 'Soaps', k: 'tv', ch: ['soaps', 'mc_uk_soaps', 'mc_us_soaps', 'mc_aussie'] },
    { id: '_g_music', name: 'Music TV', k: 'tv', ch: ['music', 'mtv', 'mc_pop', 'mc_rock'] },
    { id: '_g_food', name: 'Food and factual', k: 'tv', ch: ['cooking', 'mc_kitchen', 'mc_factual'] },
    { id: '_g_xmas', name: 'Christmas', k: 'tv', ch: ['christmas', 'mc_xmas_comedy', 'mc_xmas_soaps'] },
    { id: '_g_xmasfilms', name: 'Christmas films', k: 'film', ch: ['xmasmovies'] },
    { id: '_g_decades', name: 'By the decade', k: 'tv', ch: ['tv70s', 'tv80s', 'tv90s', 'bbc', 'itv'] }
  ];
  var OD_RAIL = [
    ['<svg viewBox="0 0 24 24" width="62%" fill="currentColor"><path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/></svg>', 'Home'],
    ['<svg viewBox="0 0 24 24" width="62%" fill="currentColor"><path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z"/></svg>', 'Browse'],
    ['<svg viewBox="0 0 24 24" width="62%" fill="currentColor"><path d="M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.7 5.9 21.1l1.4-6.8L2.2 9.6l6.9-.8z"/></svg>', 'Favourites'],
    ['<svg viewBox="0 0 24 24" width="62%" fill="currentColor"><path d="M3 4h18v12H3zm2 2v8h14V6zM8 18h8v2H8z"/></svg>', 'Guide'],
    ['<svg viewBox="0 0 24 24" width="62%"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15 15l6 6" stroke="currentColor" stroke-width="2.6"/></svg>', 'Search'],
    ['<svg viewBox="0 0 24 24" width="62%"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" stroke="currentColor" stroke-width="2.4"/></svg>', 'Options']
  ];
  var odZn = 'chips', odCi = 0, odChip = 0, odRailI = 0, odRailBack = 'rows';
  var odHero = [], odHeroI = 0, odHeroTimer = null;
  var odRet = null, odJumpRow = null, odCh = {}, odBi = 0;
  var onPseudo = { id: '_on', name: 'On now' }, mlPseudo = { id: '_ml', name: 'My list' }, mlList = null, mlSig = '';
  function odVis(c) { return c && c.id === '_on' ? 5 : OD_VIS; }
  function mlGet() { if (!mlList) mlList = store.get('mylist1') || []; return mlList; }
  function mlHas(g) { var k = LIBROUTE.norm(g.name); return mlGet().some(function (e) { return e.k === k; }); }
  function mlToggle(g) {
    var l = mlGet().slice(), k = LIBROUTE.norm(g.name), at = -1;
    l.forEach(function (e, n) { if (e.k === k) at = n; });
    if (at >= 0) l.splice(at, 1); else l.unshift({ k: k, n: g.name, ch: g.chan ? g.chan.id : '' });
    mlList = l.slice(0, 40); store.set('mylist1', mlList); mlSig = ''; odRowsMemo = null;
    toast(at >= 0 ? 'Removed ' + g.name + ' from Favourites' : 'Added ' + g.name + ' to Favourites', 2200);
  }
  /** My list: the shows added from a show page, from the channels that are loaded. */
  function odMyRow() {
    var l = mlGet(), out = [], sig = '';
    l.forEach(function (e) {
      var r = odData[e.ch], g = null;
      if (r && r.shows) for (var i = 0; i < r.shows.length; i++) if (LIBROUTE.norm(r.shows[i].name) === e.k) { g = r.shows[i]; break; }
      if (g) { out.push(g); sig += e.k + ','; }
    });
    if (!out.length) return null;
    if (sig !== mlSig || !odData._ml) { mlSig = sig; odData._ml = { shows: out }; }
    return mlPseudo;
  }
  var seenSet = null;
  function odSeenSet() { if (!seenSet) seenSet = store.get('seen1') || {}; return seenSet; }
  function odSeen(name) { var k = LIBROUTE.norm(name || ''), s = odSeenSet(); if (!k || s[k]) return; s[k] = 1; store.set('seen1', s); }
  /** The name an On now card shows: a film channel's programmes are grouped under the channel's name, so a film shows by its own title. */
  function odOnName(p) { var f = p && p.filmKey && filmFor(p); return f && f.title || (p && p.filmKey && p.title) || gmName(p) || (p && p.title) || ''; }
  /** What is on right now on every guide channel (from the same schedule the guide shows, so the watershed already applies). */
  var onSig = '';
  function odOnRow() {
    var now = Date.now(), sig = String(Math.floor(now / 60000)), list = [];
    guideList().forEach(function (c) {
      if (c.status !== 'ready' || !c.sched || c.id === 'adbreak') return;
      var bl; try { bl = E.blocks(c.sched, now, now + 4 * 3600000); } catch (e) { return; }
      var b = bl[0]; if (!b || !b.prog || b.prog.ad) return;
      var nx = bl[1], nm = odOnName(b.prog);
      sig += '|' + c.id + b.prog.id;
      list.push({ name: nm, chan: c, prog: b.prog, eps: [], flat: [], sea: [],
                  onnow: { start: b.startMs, end: b.endMs, sig: b.startMs, next: nx && nx.prog && !nx.prog.ad ? { t: gmName(nx.prog) || nx.prog.title || '', at: nx.startMs } : null } });
    });
    if (!list.length) return null;
    var fi = function (e) { return isFav(e.chan) ? 0 : 1; };
    list = list.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return fi(a.e) - fi(b.e) || a.i - b.i; }).map(function (x) { return x.e; });
    sig += '|f' + favs.length + (favs.length ? list.map(function (e) { return fi(e); }).join('') : '');
    if (sig !== onSig || !odData._on) { onSig = sig; odData._on = { shows: list }; }
    return onPseudo;
  }
  /** A genre row: the shows of its channels that are loaded so far, taking one from each channel in turn. */
  function odGenreSync(row) {
    var lists = [], loaded = 0, total = 0;
    row.ch.forEach(function (id) { var c = odCh[id]; if (!c) return; total++; var r = odData[id]; if (r && r.shows) { loaded++; lists.push(r.shows); } });
    var sig = loaded + '/' + total, cur = odData[row.id];
    if (cur && cur.sig === sig) return cur;
    if (loaded < total) return (odData[row.id] = { shows: null, sig: sig });       // a row is drawn once, when every channel in it is in: blocks stand in until then, so nothing moves along it as channels land
    var seen = {}, out = [], i = 0, more = true;
    while (more && out.length < (row.mix ? 600 : 150)) {
      more = false;
      lists.forEach(function (l) {
        if (i >= l.length) return;
        more = true;
        var g = l[i], k = LIBROUTE.norm(g.name) + (g.film ? '|f' : '');
        if (!seen[k]) { seen[k] = 1; out.push(g); }
      });
      i++;
    }
    if (row.mix && out.length) {            // a mixed row: shuffled, the same way all day, so it is not just the A-Z start of each channel
      var sd = Math.floor(Date.now() / 86400000) + row.id.length * 7919;
      var rnd = function () { sd = (sd * 1664525 + 1013904223) >>> 0; return sd / 4294967296; };
      for (var si = out.length - 1; si > 0; si--) { var sj = Math.floor(rnd() * (si + 1)), t = out[si]; out[si] = out[sj]; out[sj] = t; }
      out = out.slice(0, row.mix);
    }
    return (odData[row.id] = { shows: loaded ? out : null, sig: sig });
  }
  /** Load the channels of a genre row, one at a time with a breath between, and redraw as each arrives. */
  function odEnsureRow(row) {
    if (!row || !row.ch || row._busy) return;
    var todo = row.ch.map(function (id) { return odCh[id]; }).filter(function (c) { return c && !odData[c.id]; });
    if (!todo.length) return;
    row._busy = true;
    (function next() {
      var c = todo.shift();
      if (!c || !odOpen) { row._busy = false; return; }
      var fast = odiHas(c.id);                   // its rows are saved: nothing to wait for before the next one
      odLoadChannel(c).then(function () { return null; }, function () { return null; }).then(function () {
        odRowsMemo = null; odHeroPick();
        if (odOpen && odView === 'home') odRender();
        setTimeout(next, fast ? 0 : 150);
      });
    })();
  }
  function odHeroPick() {
    if (odHero.length >= 5) return;
    var pool = [], have = {};
    odHero.forEach(function (g) { have[g.name] = 1; });
    odChannels().forEach(function (c) {
      var r = odData[c.id]; if (!r || !r.shows || OD_FILMS[c.id]) return;
      r.shows.forEach(function (g) { if (!g.film && !have[g.name]) { var k = odKnown(g); if (k && k.back) pool.push(g); } });
    });
    while (odHero.length < 5 && pool.length) odHero.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  var odRowsMemo = null;
  /** The genre rows, then a row for each channel that none of them covers, so every channel's shows are on the home page. */
  var odAllMemo = null, odAllKey = '', odChanRows = {};
  function odAllRows() {
    var chs = odChannels(), key = chs.map(function (c) { return c.id; }).join(',');
    if (odAllMemo && key === odAllKey) return odAllMemo;
    var covered = {};
    OD_GENRES.forEach(function (r) { r.ch.forEach(function (id) { covered[id] = 1; }); });
    var out = OD_GENRES.slice();
    chs.forEach(function (c) {
      if (covered[c.id] || OD_SKIP[c.id]) return;
      var row = odChanRows[c.id] || (odChanRows[c.id] = { id: '_c_' + c.id, name: c.name, k: OD_FILMS[c.id] ? 'film' : 'tv', ch: [c.id] });
      out.push(row);
    });
    odAllKey = key; return (odAllMemo = out);
  }
  function odRowList() {
    if (odRowsMemo) return odRowsMemo;
    setTimeout(function () { odRowsMemo = null; }, 0);
    odCh = {}; odChannels().forEach(function (c) { odCh[c.id] = c; });
    var kind = ['', 'tv', 'film', 'kids'][odChip];
    var out = [];
    if (odJumpRow) out.push(odJumpRow);
    if (odData._sr && odData._sr.shows.length) out.push(srPseudo);
    var on = !kind || kind === 'tv' ? odOnRow() : null; if (on) out.push(on);
    var cw = odCwRow(); if (cw) out.push(cw);
    odAllRows().forEach(function (row) {
      if (kind && (' ' + row.k + ' ').indexOf(' ' + kind + ' ') < 0) return;
      if (!row.ch.some(function (id) { return odCh[id]; })) return;
      var r = odGenreSync(row);
      if (r.shows && !r.shows.length && r.sig.split('/')[0] === r.sig.split('/')[1]) return;       // every channel loaded and nothing in it
      out.push(row);
    });
    return (odRowsMemo = out);
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
    if (g.shorts) return null;         // a short's card is the generated title card, never a series' art
    if (g.onnow && g.prog && g.prog.filmKey) return knownArt(g.prog);      // a film on a film channel: the film's own picture, not the channel's name
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
    odBgTimer = setTimeout(function () {
      function put() {
        if (want !== odBgFor) return;                // the highlight moved on while the picture was decoding
        var b = $('odbg'); b.style.backgroundImage = img;
        if (b.animate) try { b.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' }); } catch (e) { /* no animation */ }
      }
      // a big backdrop decoded while it is being painted holds the page up for a moment: decode it off the main thread first
      if (k && k.back && window.Image) {
        var im = new Image(); im.src = k.back;
        if (im.decode) { im.decode().then(put, put); return; }
      }
      put();
    }, 140);
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
    var f = g && g.film && g.flat && g.flat[0] ? filmFor(g.flat[0].p) : null;
    var url = f && f.logo ? https(f.logo) : (g && !g.film && g.art && g.art.l ? https(g.art.l) : (g && !g.film && g.il ? https(g.il) : ''));
    if (!url) { if (img.dataset.src) { img.dataset.src = ''; img.className = 'hidden'; img.removeAttribute('src'); } h1.style.display = ''; return; }
    if (img.dataset.src === url) return;
    img.dataset.src = url; img.className = 'hidden'; h1.style.display = '';
    img.onload = function () { if (img.dataset.src === url) { img.className = ''; h1.style.display = 'none'; } };
    img.onerror = function () { img.className = 'hidden'; h1.style.display = ''; };
    img.src = url;
  }
  function odInfoLine(g, noNet, noCert) {
    if (g.film) { var f = filmFor(g.eps[0].p) || {}; return [f.released ? String(f.released).slice(0, 4) : '', f.genres || '', f.mins ? (f.mins >= 60 ? Math.floor(f.mins / 60) + 'h ' + (f.mins % 60) + 'm' : f.mins + ' min') : '', noCert ? '' : g.eps[0].p.cert || ''].filter(Boolean).join('  \u00b7  '); }
    var x = g.art;
    return x ? [noNet ? '' : x.n || '', x.y ? x.y + (x.e && x.e !== x.y ? '–' + x.e : '') : '', x.g || ''].filter(Boolean).join('  ·  ') : '';
  }
  var odBusy = false;     // opening straight onto the show that is playing: nothing to show until it is found
  var odT1 = 0, odT0 = 0, odT0Warm = false;      // when On Demand was pressed, and whether its rows were already saved (for the debug line)
  function odRender() {
    jm('draw On Demand');
    $('odload').className = odOpen && odBusy ? '' : 'hidden';      // never for the home page: it draws at once and the rows fill in
    $('od').classList.toggle('railfocus', odZn === 'rail' && (odView === 'home' || odView === 'fav' || odView === 'grid'));
    odRenderBar();
    $('odbar').style.display = odView === 'home' || (!window.PHONE && (odView === 'grid' || odView === 'fav')) ? '' : 'none'; $('odside').style.display = odView === 'home' || odView === 'fav' || odView === 'grid' ? '' : 'none';
    if (odView === 'show') odRenderShow(); else if (odView === 'grid') odRenderGrid(); else if (odView === 'fav') odRenderFav(); else odRenderHome();
    var nm = odView === 'home' && odNone;
    $('odnomatch').className = nm ? '' : 'hidden'; $('odrows').style.visibility = $('odhero').style.visibility = nm ? 'hidden' : '';
    if (nm) {
      $('odnomatch').firstChild.textContent = 'Nothing matches \u201c' + odNone + '\u201d';
      $('odnomatch').children[1].className = 'odb' + (odNoneI === 0 ? ' sel' : ''); $('odnomatch').children[2].className = 'odb' + (odNoneI === 1 ? ' sel' : '');
    }
    var hint = odView === 'show' ? [['\u25b2 \u25bc', 'Move'], ['\u25c0 \u25b6', 'Choose'], ['OK', 'Select / Play'], ['Hold OK', 'More'], ['Back', 'Back']]
      : odView === 'grid' && odGz === 'rail' ? [['\u25b2 \u25bc', 'Choose'], ['OK', 'Open'], ['Back', 'Close']]
      : odView === 'grid' ? [['\u25b2 \u25bc \u25c0 \u25b6', 'Move'], ['OK', 'Open'], ['Back', 'Home']]
      : odView === 'fav' && odFz === 'rail' ? [['\u25b2 \u25bc', 'Choose'], ['OK', 'Open'], ['Back', 'Close']]
      : odView === 'fav' ? (odFavList().length ? [['OK', 'Watch live'], ['Hold OK', 'Menu'], ['\u25b2 \u25bc \u25c0 \u25b6', 'Move'], ['Back', 'Home']] : [['\u25c0 \u25b6', 'Choose'], ['OK', 'Select'], ['Back', 'Home']])
      : nm ? [['\u25b2 \u25bc', 'Choose'], ['OK', 'Select'], ['Back', 'Browse']]
      : odZn === 'rail' ? [['\u25b2 \u25bc', 'Choose'], ['OK', 'Open'], ['Back', 'Close']]
      : odZn === 'chips' ? [['\u25c0 \u25b6', 'Choose'], ['OK', 'Select'], ['\u25bc', 'Down'], ['Back', 'Exit']]
      : odZn === 'hero' ? [['\u25c0 \u25b6', 'Next show'], ['OK', 'Play'], ['Hold OK', 'More info'], ['\u25bc', 'Rows'], ['Back', 'Exit']]
      : [['\u25c0 \u25b6', 'Browse'], ['\u25b2 \u25bc', 'Rows'], ['OK', 'Open'], ['Hold OK', 'More'], ['Back', 'Top']];
    var ft = $('odfoot'); ft.textContent = '';
    hint.forEach(function (x) { var sp = odEl('span'); sp.appendChild(odEl('b', '', x[0])); sp.appendChild(document.createTextNode(' ' + x[1])); ft.appendChild(sp); });
  }
  var odCardRid = '';        // the row whose cards are being made: a poster in two rows on screen at once needs a tile in each, or the second row takes it from the first
  var rowIsCw = false, odDecOn = false;   // odDecOn: the decade badge shows only where decades are mixed (Browse, search)
  /** One poster element per show, kept and reused: moving along a row re-attaches the ones already built (and decoded)
   *  instead of making new ones, which is what made browsing stutter on the TV. */
  function odCard(g, sel) {
    var key = (rowIsCw ? '_elc' : '_el') + odCardRid, dec = odDecOn && !window.PHONE, d = g[key], gen = odKGen + ':' + cwGen + (dec ? 'd' : '');
    if (!d) { d = g[key] = odEl('div', 'odc'); d._g = ''; }
    if (d._g !== gen) {
      d._g = gen; d.textContent = '';
      var k = odKnown(g);
      var pu = k && (k.poster || k.back);
      if (pu) {
        d.style.backgroundImage = 'url("' + pu + '")';
        var pim = new Image();                  // a poster that will not load leaves a blank tile: show the name instead
        pim.onerror = function () { if (d._g === gen) { d.style.backgroundImage = odTone(g.name); if (!d.querySelector('b')) d.appendChild(odEl('b', '', g.name)); } };
        pim.src = pu;
      } else { d.style.backgroundImage = odTone(g.name); d.appendChild(odEl('b', '', g.name)); }
      var bc = odCertOf(g), by = 0;
      try { by = g.stub ? (g.yr || 0) : odYear(g); } catch (e) { by = g.yr || 0; }
      if (bc) d.appendChild(odEl('span', 'odtag cert', bc));
      if (dec && by > 1900) d.appendChild(odEl('span', 'odtag yr', (Math.floor(by / 10) * 10 % 100 < 10 ? '0' : '') + (Math.floor(by / 10) * 10 % 100) + 's'));
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
  /** What sits after a row's name: where you are in it on the highlighted row, how many it holds on the others. */
  function odCount(x) { return x.ri === odRi ? (x.pos + 1) + ' of ' + x.n : x.n + (x.n === 1 ? ' show' : ' shows'); }
  var odDom = [];       // what the home rows on screen were built from: a key press that stays inside them only moves the highlight
  var odGuideEl = null;
  function odRenderBar() {
    var ch = $('odchips');
    if (!odGuideEl) odGuideEl = $('odguide');
    if (odGuideEl.parentNode === ch) $('odtools').insertBefore(odGuideEl, $('odopts'));       // back in its place before the tabs are drawn again
    ch.textContent = '';
    var bo = odBarOn(), cur = odBarCur(), ph = !!window.PHONE;
    OD_CHIPS.forEach(function (t, i) { ch.appendChild(odEl('div', 'odchip' + (i === cur ? ' on' : '') + (bo && odCi === i ? ' sel' : '') + (ph && i > 3 ? ' odx' : ''), t)); });
    if (!ph) ch.insertBefore(odGuideEl, ch.children[1] || null);                             // on the TV Guide sits next to Home
    [$('odsrch'), odGuideEl, $('odopts')].forEach(function (el, j) { el.className = 'odchip' + (bo && odCi === 6 + j ? ' sel' : '') + (ph && j ? ' odx' : ''); });
    var sd = $('odside'); sd.textContent = '';
    OD_RAIL.forEach(function (t, i) { var d = odEl('div', 'odsd' + (odZn === 'rail' && odRailI === i ? ' sel' : '')); d.innerHTML = t[0]; d.setAttribute('data-l', t[1]); sd.appendChild(d); });
  }
  /** One "On now" card: the programme, which channel it is on, how far through, and what follows. */
  function odOnCard(e, sel) {
    var d = e._el; if (!d) { d = e._el = odEl('div', 'odc odon'); d._g = ''; }
    var gen = odKGen + ':' + e.onnow.sig + ':' + (isFav(e.chan) ? 'f' : '');
    if (d._g !== gen) {
      d._g = gen; d.textContent = '';
      var k = e.prog && e.prog.filmKey ? knownArt(e.prog) : odKnown(e), u = k && (k.back || k.poster), o = e.onnow;
      d.style.backgroundImage = u ? 'url("' + u + '")' : odTone(e.name);
      d.appendChild(odEl('div', 'odlive', 'LIVE'));
      d.appendChild(odEl('div', 'odch', (isFav(e.chan) ? '\u2605 ' : '') + e.chan.name));
      d.appendChild(odEl('b', '', e.name));
      if (o.next) d.appendChild(odEl('small', '', 'Next ' + fmtTime(o.next.at) + '  ' + (o.next.t === e.name ? 'more ' + e.name : o.next.t)));
      var w = Math.max(0, Math.min(100, Math.round(100 * (Date.now() - o.start) / Math.max(1, o.end - o.start))));
      var pg = odEl('div', 'odpg'), bar = odEl('i'); bar.style.width = w + '%'; pg.appendChild(bar); d.appendChild(pg);
    }
    d.className = 'odc odon' + (sel ? ' sel' : '');
    return d;
  }
  function odRenderHome() {
    var tH0 = performance.now(), tH1 = 0, tH2 = 0, tH3 = 0;
    var s = odSel(), rows = s.rows, box = $('odrows'), inRows = odZn === 'rows';
    odTop = odRi;                                  // the highlighted row is always the first on screen; the next one peeks below it
    var want = [];
    for (var ri = odTop; ri < Math.min(rows.length, odTop + 2); ri++) {
      var c = rows[ri], sh = odShowsOf(c), n = sh ? sh.length : 0, vis = odVis(c);
      var pos = n ? Math.min(odPos[c.id] || 0, n - 1) : 0, start = n ? Math.max(0, Math.min(pos - 2, n - vis)) : 0;
      want.push({ ri: ri, c: c, sh: sh, pos: pos, start: start, n: n, vis: vis });
    }
    var same = odDom.length === want.length && box.children.length === want.length;
    for (var w = 0; same && w < want.length; w++) same = odDom[w].c === want[w].c && odDom[w].sh === want[w].sh && odDom[w].n === want[w].n && odDom[w].gen === odKGen && Math.abs(odDom[w].start - want[w].start) < want[w].vis;
    if (same) {                                   // cheap path: move the highlight; moving along a row changes only the card that left and the one that came in
      want.forEach(function (x, wi) {
        var cont = box.children[wi].lastChild, cards = cont.children, old = odDom[wi].sel, now = x.ri === odRi && inRows && x.n ? x.pos - x.start : -1;
        var sp = box.children[wi].firstChild.lastChild; if (x.sh && sp && sp.tagName === 'SPAN') sp.textContent = odCount(x);
        var dd = x.start - odDom[wi].start;
        if (dd && x.sh) {
          rowIsCw = x.c === cwPseudo; odDecOn = x.c === srPseudo; odCardRid = x.c.id;
          var mk = function (i) { return x.c.id === '_on' ? odOnCard(x.sh[i], false) : odCard(x.sh[i], false); }, i2;
          for (var q0 = 0; q0 < cards.length; q0++) cards[q0].classList.remove('sel');
          if (dd > 0) { for (i2 = 0; i2 < dd; i2++) cont.removeChild(cont.firstChild); for (i2 = odDom[wi].start + x.vis; i2 < x.start + x.vis && i2 < x.n; i2++) cont.appendChild(mk(i2)); }
          else { for (i2 = 0; i2 < -dd; i2++) cont.removeChild(cont.lastChild); for (i2 = odDom[wi].start - 1; i2 >= x.start; i2--) cont.insertBefore(mk(i2), cont.firstChild); }
          rowIsCw = false; odDecOn = false; odCardRid = '';
          odDom[wi].start = x.start; odDom[wi].sel = -1; old = -1;
          odSlide(cont.children, dd * (x.c.id === '_on' ? 18.4 : 13.1), 'vw');
        }
        if (old !== now) {
          if (cards[old]) cards[old].classList.remove('sel');
          if (cards[now]) cards[now].classList.add('sel');
          odDom[wi].sel = now;
        }
      });
    } else {
      var prevDom = odDom, oldNodes = Array.prototype.slice.call(box.children);
      box.textContent = '';
      odDom = [];
      var frag = document.createDocumentFragment();
      want.forEach(function (x) {
        var reuse = null;                                   // a row that was already on screen keeps its cards: Up and Down build only the row that comes in
        if (x.sh) for (var pr = 0; pr < prevDom.length && !reuse; pr++) { var o0 = prevDom[pr]; if (o0.c === x.c && o0.sh === x.sh && o0.start === x.start && o0.n === x.n && o0.gen === odKGen && oldNodes[pr]) reuse = oldNodes[pr]; }
        if (reuse) {
          var rc = reuse.lastChild.children, rn = x.ri === odRi && inRows && x.n ? x.pos - x.start : -1;
          for (var q1 = 0; q1 < rc.length; q1++) rc[q1].classList.toggle('sel', q1 === rn);
          var rsp = reuse.firstChild.lastChild; if (rsp && rsp.tagName === 'SPAN') rsp.textContent = odCount(x);
          frag.appendChild(reuse);
          odDom.push({ c: x.c, sh: x.sh, start: x.start, n: x.n, gen: odKGen, sel: rn });
          return;
        }
        var row = odEl('div', 'odrow'), h = odEl('h3', '', x.c.name);
        if (x.sh) h.appendChild(odEl('span', '', odCount(x)));
        row.appendChild(h);
        var cards = odEl('div', 'odcards');
        if (!x.sh) { for (var q = 0; q < x.vis; q++) cards.appendChild(odEl('div', 'odc odsk' + (x.c.id === '_on' ? ' odon' : ''))); }     // no list yet: plain blocks where the posters will be
        else {
          rowIsCw = x.c === cwPseudo; odDecOn = x.c === srPseudo; odCardRid = x.c.id;
          for (var i = x.start; i < Math.min(x.n, x.start + x.vis); i++) {
            var sel = x.ri === odRi && inRows && i === x.pos;
            cards.appendChild(x.c.id === '_on' ? odOnCard(x.sh[i], sel) : odCard(x.sh[i], sel));
          }
          rowIsCw = false; odDecOn = false; odCardRid = '';
          if (odT1 && x.n && x.c.ch) { dlog('ONDEMAND: first genre row (' + x.c.name + ') drawn ' + Math.round(performance.now() - odT1) + ' ms after pressing On Demand'); odT1 = 0; }
          if (odT0 && x.n) { dlog('ONDEMAND: first row drawn ' + Math.round(performance.now() - odT0) + ' ms after pressing On Demand (' + (odT0Warm ? 'warm start, rows saved' : 'index being built') + ', ' + x.c.name + ', ' + x.n + ' shows)'); odT0 = 0; }
        }
        row.appendChild(cards); frag.appendChild(row);
        odDom.push({ c: x.c, sh: x.sh, start: x.start, n: x.n, gen: odKGen, sel: x.ri === odRi && inRows && x.n ? x.pos - x.start : -1 });
      });
      box.appendChild(frag);
      // moving along a row slides the posters across by the distance moved instead of jumping
      want.forEach(function (x, wi) {
        var o = prevDom[wi], d = o && o.c === x.c && o.sh === x.sh && o.gen === odKGen ? x.start - o.start : 0;
        if (d) odSlide(box.children[wi].lastChild.children, d * (x.c.id === '_on' ? 18.4 : 13.1), 'vw');
      });
    }
    odZoomArm();
    var top = odZn === 'chips' || odZn === 'hero';
    tH1 = performance.now();
    $('od').classList.toggle('odtop', top);
    var g = top && odHero.length ? odHero[Math.min(odHeroI, odHero.length - 1)] : s.g;
    odSetBg(g);
    tH2 = performance.now();
    if ((g && g.name) !== odLastG) { odLastG = g && g.name; ['odh1', 'odlogo', 'odm', 'odp'].forEach(function (id) { odFade($(id)); }); }
    $('odh1').textContent = g ? g.name : (s.c ? s.c.name : '');
    odLogo($('odlogo'), $('odh1'), g);
    var hb = $('odhb'); hb.textContent = '';
    if (top && g && !g.onnow) { hb.appendChild(odEl('div', 'odb' + (odZn === 'hero' ? ' sel' : ''), '\u25b6  Play')); hb.appendChild(odEl('div', 'odb', '\u24d8  More info   (hold OK)')); }
    if (top && g && !g.onnow) { var cert = odCertOf(g), mm = $('odm'); mm.textContent = ''; if (g.art && g.art.n && !g.film) mm.appendChild(odEl('span', 'odbug', g.art.n)); if (cert) mm.appendChild(odEl('span', 'odcert', cert)); mm.appendChild(document.createTextNode(odHeroMeta(g))); }
    else $('odm').textContent = g ? (g.onnow ? 'Live now on ' + g.chan.name : (odInfoLine(g) || (g.chan ? g.chan.name : (s.c && s.c.name) || ''))) : '';
    $('odp').textContent = g ? (odDesc(g) || (g.film || g.onnow ? '' : (g.stub ? g.nEps : g.eps.length) + ((g.stub ? g.nEps : g.eps.length) === 1 ? ' video' : ' videos'))) : '';
    var dots = $('oddots');
    if (top && odHero.length > 1) {
      if (dots.children.length !== odHero.length) { dots.textContent = ''; odHero.forEach(function () { dots.appendChild(odEl('i')); }); }
      for (var di = 0; di < dots.children.length; di++) dots.children[di].className = di === odHeroI ? 'on' : '';
    } else dots.textContent = '';
    tH3 = performance.now();
    odLookups(g);
    odHeroTick();
    var tH4 = performance.now();
    odSnapMaybe();
    if (tH4 - tH0 > 150) dlog('DRAW slow ' + Math.round(tH4 - tH0) + ' ms: rows ' + Math.round(tH1 - tH0) + ', background ' + Math.round(tH2 - tH1) + ', text and logo ' + Math.round(tH3 - tH2) + ', lookups ' + Math.round(tH4 - tH3));
  }
  // The home screen is kept as it was last drawn, so starting in On Demand can show it at once while the channels load behind it.
  var odSnapAt = 0, odSnapOn = false;
  function odSnapMaybe() {
    if (!odOpen || odView !== 'home' || Date.now() - odSnapAt < 20000) return;
    odSnapAt = Date.now();
    setTimeout(odSnapSave, 1200);
  }
  function odSnapSave() {
    try {
      if (!odOpen || odView !== 'home') return;
      var clean = function (h) { return h.replace(/class="([^"]*)"/g, function (m, c) { return 'class="' + c.replace(/\bsel\b/g, '').replace(/\s+/g, ' ').trim() + '"'; }); };
      var snap = { v: relName(), rows: clean($('odrows').innerHTML), chips: clean($('odchips').innerHTML), h1: $('odh1').textContent, m: $('odm').innerHTML, p: $('odp').textContent, bg: $('odbg').style.backgroundImage || '' };
      if (!snap.rows || snap.rows.length > 200000) return;
      store.set('odsnap1', snap);
    } catch (e) { /* not kept this time */ }
  }
  /** Starting in On Demand: show the last home screen straight away, before any channel is ready. It cannot be used until the real one replaces it. */
  function odSnapShow() {
    try {
      var sn = store.get('odsnap1');
      if (!sn || sn.v !== relName() || !sn.rows) return;
      $('odrows').innerHTML = sn.rows; $('odchips').innerHTML = sn.chips || '';
      $('odh1').textContent = sn.h1 || ''; $('odm').innerHTML = sn.m || ''; $('odp').textContent = sn.p || '';
      if (sn.bg) $('odbg').style.backgroundImage = sn.bg;
      $('odhome').className = ''; $('od').className = '';
      $('splash').className = 'hidden';
      odSnapOn = true;
      dlog('START: showing the saved On Demand screen while the channels load');
    } catch (e) { odSnapOn = false; }
  }
  /** The hero turns by itself every seven seconds while the highlight is up at the chips or the hero; a key restarts the wait. */
  function odHeroTick() {
    clearTimeout(odHeroTimer); odHeroTimer = null;
    if (!odOpen || odView !== 'home' || odm || odHero.length < 2 || (odZn !== 'chips' && odZn !== 'hero')) return;
    odHeroTimer = setTimeout(function () {
      odHeroTimer = null;
      if (odOpen && odView === 'home' && !odm && (odZn === 'chips' || odZn === 'hero')) { odHeroI = (odHeroI + 1) % odHero.length; odRender(); }
    }, 7000);
  }
  function odCertOf(g) { var p = g && g.eps && g.eps[0] && g.eps[0].p; return p && p.cert ? String(p.cert) : (g && g.cert ? String(g.cert) : ''); }
  /** The line under the hero: year, seasons, genre. */
  function odHeroMeta(g) {
    var seasons = g.stub ? g.nSea : g.sea ? g.sea.filter(function (x) { return /^Season/.test(x.name); }).length : 0;
    return [odInfoLine(g, true), seasons ? seasons + (seasons === 1 ? ' season' : ' seasons') : ''].filter(Boolean).join('  \u00b7  ') || (g.chan ? g.chan.name : '');
  }
  function odPlayHero() {
    var g = odHero[Math.min(odHeroI, odHero.length - 1)];
    if (!g) return;
    odJumpTo(g);
    odHydrate(g).then(function () { var b = odBtns(g)[0]; if (b) b.f(); }, function () { toast('Could not play that show', 2500); });
  }
  function odWatchLive(c) {
    if (!c) return;
    odMark();
    odClose(false);
    if (cur && cur.ch === c) showBanner(); else tune(c, true);
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
  // ---- the film page: a row of the other films in its series, or films like it
  var odPool = null, odPoolSig = '', odRelI = 0, odBack = [];
  function odFilmPool() {
    var chs = odChannels(), n = 0;
    chs.forEach(function (c) { var sh = odShowsOf(c); n += sh ? sh.length : 0; });
    var sig = chs.length + ':' + n;
    if (odPool && odPoolSig === sig) return odPool;
    var seen = {}, out = [];
    chs.forEach(function (c) {
      (odShowsOf(c) || []).forEach(function (h) {
        if (!h.film || h.shorts || !h.eps[0]) return;
        var k = LIBROUTE.norm(h.name); if (seen[k]) return;
        seen[k] = 1;
        var f = filmFor(h.eps[0].p); if (!f) return;
        out.push(odPoolItem(h, f, k));
      });
    });
    odPool = out; odPoolSig = sig;
    return out;
  }
  function odPoolItem(h, f, k) {
    return { g: h, f: f, k: k, y: parseInt(String(f.released || '').slice(0, 4), 10) || h.yr || 0,
             gs: String(f.genres || '').toLowerCase().split(/\s*,\s*/).filter(Boolean),
             cs: (f.cast || []).slice(0, 5).map(function (m) { return String(m.n || '').toLowerCase(); }).filter(Boolean) };
  }
  /** What the film page's row holds: { head, items, cur } or null when there is nothing worth a row. */
  function odRelFor(g) {
    if (!g || !g.film || !g.eps[0]) return null;
    var f = filmFor(g.eps[0].p); if (!f) return null;
    var pool = odFilmPool(), key = LIBROUTE.norm(g.name), sk = key + '|' + odPoolSig + '|' + (f.col || '');
    if (g._rel !== undefined && g._rk === sk) return g._rel;
    var me = odPoolItem(g, f, key), res = null, i;
    if (f.col) {
      var ser = pool.filter(function (p) { return p.f.col === f.col && p.k !== key; });
      if (ser.length) {
        ser.push(me); ser.sort(function (a, b) { return String(a.f.released || '9').localeCompare(String(b.f.released || '9')); });
        var at = ser.indexOf(me), st = Math.max(0, Math.min(at - 1, ser.length - 8)), win = ser.slice(st, st + 8);
        var cn = String(f.cn || ''), head = /\s+Collection$/i.test(cn) ? cn.replace(/\s+Collection$/i, ' films') : cn;
        res = { head: head || 'More in this series', items: win, cur: win.indexOf(me) };
      }
    }
    if (!res) {
      var sc = [];
      pool.forEach(function (p) {
        if (p.k === key) return;
        var s0 = 0, sg = 0, j;
        p.cs.forEach(function (n) { if (me.cs.indexOf(n) >= 0) s0 += 3; });
        p.gs.forEach(function (x) { if (me.gs.indexOf(x) >= 0) { s0 += 2; sg++; } });
        if (me.y && p.y && Math.abs(me.y - p.y) <= 5) s0 += 1;
        if (sg >= 1 && s0 >= 3) sc.push({ p: p, s: s0 });
      });
      sc.sort(function (a, b) { return b.s - a.s || String(a.p.f.released || '').localeCompare(String(b.p.f.released || '')); });
      if (sc.length >= 2) res = { head: 'More like this', items: sc.slice(0, 8).map(function (x) { return x.p; }), cur: -1 };
    }
    g._rel = res; g._rk = sk;
    return res;
  }
  var odRelSig = '', odCrSig = '';
  function odRenderFilm(g) {
    var sh = $('odshow'), rel = null, f = null;
    if (g.film && g.eps[0]) { f = filmFor(g.eps[0].p); rel = odRelFor(g); }
    var cast = f && f.cast ? f.cast.filter(function (m) { return m.n; }) : [];
    var mode = !g.film ? '' : rel ? 'fr' : cast.length ? 'fc' : 'fb';
    if (sh.getAttribute('data-fm') !== mode) { if (mode) sh.setAttribute('data-fm', mode); else sh.removeAttribute('data-fm'); }
    var cl = $('odcast');
    cl.textContent = mode === 'fr' && cast.length ? 'Starring ' + cast.slice(0, 4).map(function (m) { return m.n; }).join(', ') : '';
    if (mode === 'fr') {
      var sig = LIBROUTE.norm(g.name) + '|' + odKGen + '|' + odPoolSig + '|' + rel.items.length, box = $('odrelc'), seen = odSeenSet();
      odRelI = Math.max(0, Math.min(odRelI, rel.items.length - 1));
      if (sig !== odRelSig) {
        odRelSig = sig; box.textContent = '';
        rel.items.forEach(function (it, i) {
          var d = odEl('div', 'odrc' + (i === rel.cur ? ' cur' : '')), k = odKnown(it.g), pu = k && k.poster;
          d.style.backgroundImage = pu ? 'url("' + pu + '")' : odTone(it.g.name);
          if (!pu) d.appendChild(odEl('b', '', it.g.name));
          if (it.y) d.appendChild(odEl('span', 'odry', String(it.y)));
          if (i === rel.cur) d.appendChild(odEl('span', 'odrt', 'This film'));
          if (seen[it.k]) d.appendChild(odEl('i', 'odrw'));
          box.appendChild(d);
        });
      }
      for (var i = 0; i < box.children.length; i++) box.children[i].classList.toggle('sel', odZone === 2 && i === odRelI);
      $('odrelh').firstChild.textContent = rel.head;
      $('odrelh').lastChild.textContent = odZone === 2 && rel.items[odRelI] ? rel.items[odRelI].g.name : '';
    } else if (mode === 'fc') {
      var cs = LIBROUTE.norm(g.name) + '|' + cast.length;
      if (cs !== odCrSig) {
        odCrSig = cs; var cb = $('odcrc'); cb.textContent = '';
        cast.slice(0, 8).forEach(function (m) {
          var it = odEl('div', 'odcm'), ph = odEl('div', 'odcp');
          if (m.p) ph.style.backgroundImage = 'url("' + m.p + '")'; else ph.textContent = m.n.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
          it.appendChild(ph); it.appendChild(odEl('b', '', m.n)); if (m.c) it.appendChild(odEl('small', '', m.c));
          cb.appendChild(it);
        });
      }
    }
  }
  /** Go to another film's page without touching where Back leads out of the film pages. */
  function odJumpHere(g) {
    var sh = (g.chan && odShowsOf(g.chan)) || [g], i = Math.max(0, sh.indexOf(g));
    odData._jp = { shows: sh }; odJumpRow = { id: '_jp', name: g.chan ? g.chan.name : '' }; odPos._jp = i;
    odRowsMemo = null; odRc = odJumpRow; odRi = 0;
  }
  function odRelOpen(it) {
    var cg = odSel().g, h = it.g, back = { g: cg, i: odRelI };
    odHydrate(h).then(function () {
      if (!odOpen || odView !== 'show') return;
      odBack.push(back); if (odBack.length > 5) odBack.shift();
      odJumpHere(h); odZone = 0; odSea = 0; odEi = 0; odBi = 0; odRelI = 0;
      if (!h.metaP) odMeta(h).then(function () { if (odOpen && odView === 'show' && odSel().g === h) odRender(); });
      odRender();
    }, function () { toast('Could not open that film', 2500); });
  }
  function odRenderShow() {
    var s = odSel(), g = s.g;
    if (!g) { odShowView(false); odRenderHome(); return; }
    odSetBg(g);
    ['odrail', 'odrmore', 'odeh', 'odeps', 'odemore'].forEach(function (id) { $(id).style.display = g.film ? 'none' : ''; });      // a film is one video: no seasons or episode list
    odLookups(g);                                  // the show's details and clear logo, also when you go straight onto its page
    if (g.name !== odLastS) { odLastS = g.name; ['odpost', 'odst', 'odsm', 'odsp'].forEach(function (id) { odFade($(id)); }); }
    var k = odKnown(g), post = $('odpost');
    var hasArt = k && (k.poster || k.back);
    post.style.backgroundImage = hasArt ? 'url("' + (k.poster || k.back) + '")' : odTone(g.name);
    post.textContent = ''; if (!hasArt) post.appendChild(odEl('b', '', g.name));       // no picture yet: the same coloured tile with the name as on the home page
    $('odst').textContent = g.name;
    odLogo($('odlogo2'), $('odst'), g);
    var seasons = g.sea.filter(function (x) { return /^Season/.test(x.name); }).length;
    var sm = $('odsm'); sm.textContent = ''; if (!g.film && g.art && g.art.n) sm.appendChild(odEl('span', 'odbug', g.art.n));
    if (g.film && odCertOf(g)) sm.appendChild(odEl('span', 'odcc', odCertOf(g)));
    sm.appendChild(document.createTextNode(g.film ? odInfoLine(g, false, true) : [odInfoLine(g, true), seasons ? seasons + (seasons === 1 ? ' season' : ' seasons') : '', g.eps.length + (g.eps.length === 1 ? ' video' : ' videos')].filter(Boolean).join('  ·  ')));
    $('odsp').textContent = odDesc(g);
    var btns = odBtns(g), btn = $('odbtn'); btn.textContent = '';
    odBi = Math.max(0, Math.min(odBi, btns.length - 1));
    btns.forEach(function (b, i) { btn.appendChild(odEl('div', 'odb' + (odZone === 0 && i === odBi ? ' sel' : ''), b.t)); });
    odRenderFilm(g);
    var rail = $('odrail');
    var multi = g.sea.length > 1;
    $('odeps').className = multi ? '' : 'wide';
    var cs = multi ? Math.max(0, Math.min(odSea - 2, g.sea.length - OD_SEA)) : 0, rsig = g.name + '|' + cs + '|' + g.sea.length + '|' + multi;
    if (rsig === odRailSig && rail.children.length === Math.min(g.sea.length, OD_SEA) * (multi ? 1 : 0)) {      // same list: just move the highlight
      for (var ri = 0; ri < rail.children.length; ri++) rail.children[ri].className = 'odsn' + (cs + ri === odSea ? ' on' : '') + (cs + ri === odSea && odZone === 1 ? ' sel' : '');
    } else {
      odRailSig = rsig; rail.textContent = '';
      if (multi) {
        for (var i = cs; i < Math.min(g.sea.length, cs + OD_SEA); i++) {
          var sn = odEl('div', 'odsn' + (i === odSea ? ' on' : '') + (i === odSea && odZone === 1 ? ' sel' : ''), g.sea[i].name);
          rail.appendChild(sn);
        }
      }
    }
    var list = (g.sea[odSea] || { eps: [] }).eps, box = $('odeps');
    odEi = Math.max(0, Math.min(odEi, list.length - 1));
    var top = Math.max(0, Math.min(odEi - 1, list.length - OD_EPN));
    var eh = $('odeh'), sn0 = g.sea[odSea] ? g.sea[odSea].name : '';
    eh.textContent = [sn0, list.length + (list.length === 1 ? ' episode' : ' episodes'), list.length ? (odEi + 1) + ' of ' + list.length : ''].filter(Boolean).join('  ·  ');
    var before = top, after = Math.max(0, list.length - top - OD_EPN);
    $('odemore').textContent = [before ? '◀ ' + before + ' earlier' : '', after ? after + ' more ▶' : ''].filter(Boolean).join('     ');
    var base = g.name + '|' + odSea + '|' + odKGen + '|' + (g.meta ? 1 : 0) + '|' + list.length, esig = base + '|' + top;
    if (esig === odEpSig && box.children.length) {
      for (var ei = 0; ei < box.children.length; ei++) box.children[ei].className = 'ode' + (top + ei === odEi && odZone === 2 ? ' sel' : '');
      return;
    }
    var slideBy = base === odEpBase ? top - odEpTop : 0;
    odEpSig = esig; odEpBase = base; odEpTop = top;
    box.textContent = '';
    for (var j = top; j < Math.min(list.length, top + OD_EPN); j++) {
      var ep = list[j], m = g.meta && g.meta[ep.s + 'x' + ep.e], row = odEl('div', 'ode' + (j === odEi && odZone === 2 ? ' sel' : ''));
      var kn = odKnown(g), still = (m && m.img) || ep.thumb || (kn && (kn.back || kn.poster)) || '';   // no still of its own: the show's own picture beats a flat colour
      if (still) {
        var im = document.createElement('img'); im.alt = '';
        im.onerror = function () { var t = odEl('div', 'odth'); t.style.backgroundImage = odTone(g.name); if (this.parentNode) this.parentNode.replaceChild(t, this); };
        im.src = still; row.appendChild(im);
      } else { var th = odEl('div', 'odth'); th.style.backgroundImage = odTone(g.name); row.appendChild(th); }
      row.appendChild(odEl('i', '', ep.s > 0 ? 'E' + ep.e : '•'));
      var rp = odResumeAt(g, ep), dur = ep.p && ep.p.dur || 0;
      if (rp && dur > 0) { var pg = odEl('div', 'odpg'), bar = odEl('i'); bar.style.width = Math.min(100, Math.round(100 * rp / dur)) + '%'; pg.appendChild(bar); row.appendChild(pg); }
      var tx = odEl('div'); tx.appendChild(odEl('b', '', odEpTitle(ep, m)));
      tx.appendChild(odEl('em', rp ? 'rs' : '', rp ? 'Resume ' + Math.round(rp / 60) + ' min in' : m && m.l ? m.l + ' min' : (ep.year || (m && m.a ? String(m.a).slice(0, 4) : ''))));
      row.appendChild(tx);
      box.appendChild(row);
    }
    if (slideBy) odSlide(box.children, slideBy * 18.4, 'vw');
  }
  var OD_EPN = 5;           // episode cards across the show page
  function odEpKey(g, ep) { return LIBROUTE.norm(g.name) + '|' + (ep.p && (ep.p.url || ep.p.id) || ''); }
  /** The buttons under a show's title: resume, play from the start, Favourites. */
  function odBtns(g) {
    var first = g.flat[0], b = [];
    var rs = g._cw && g.flat.filter(function (e) { return odResumeAt(g, e); })[0];
    if (rs) b.push({ t: '▶  Resume' + (rs.s && rs.e > 0 ? ' S' + odPad(rs.s) + 'E' + odPad(rs.e) : ''), f: function () { odPlay(rs); } });
    var f0 = g.flat.filter(function (e) { return e.s > 0; })[0] || first;
    b.push({ t: '▶  ' + (g.film ? 'Play film' : rs ? 'Start from ' + (f0 && f0.s > 0 ? 'S' + f0.s + ' E' + f0.e : 'the beginning') : 'Play from the start'), f: function () { if (f0 || first) odPlay(f0 || first); } });
    b.push({ t: mlHas(g) ? '★  In Favourites' : '☆  Favourite', f: function () { mlToggle(g); odRender(); } });
    return b;
  }
  var odRailSig = '', odEpSig = '', odEpBase = '', odEpTop = 0;
  function odSetView(v) {
    odView = v;
    $('odhome').className = v === 'home' ? '' : 'hidden';
    $('odshow').className = v === 'show' ? '' : 'hidden';
    $('odgrid').className = v === 'grid' ? '' : 'hidden';
    $('odfav').className = v === 'fav' ? '' : 'hidden';
  }
  /** Going onto a show's page remembers where it came from (hero, Browse); Back there puts it all back. */
  function odShowView(on) {
    if (on) { odSetView('show'); return; }
    odBack = [];
    var r = odRet; odRet = null;
    if (r) { odJumpRow = null; odRowsMemo = null; odRc = r.rc; odRi = r.ri; odZn = r.zn; odSetView(r.view); }
    else odSetView('home');
  }
  function odJumpTo(g) {
    odRet = { rc: odRc, ri: odRi, zn: odZn, view: odView === 'grid' || odView === 'fav' ? odView : 'home' };
    odJumpHere(g);
  }
  function odOpenHero() {
    var g = odHero[Math.min(odHeroI, odHero.length - 1)];
    if (!g) return;
    odJumpTo(g); odOpenShow();
  }
  function odOpenShow() {
    var s0 = odSel(), g = s0.g;
    if (!g) return;
    if (g.stub) {                                  // only the index row so far: this show's episodes are put together now, for it alone
      odHydrate(g).then(function () { if (odOpen && odSel().g === g) odOpenShow(); }, function (e) { dlog('ONDEMAND: could not open ' + g.name + ': ' + e.message); toast('Could not open that show', 2500); });
      return;
    }
    // a film opens its own page like a show (picture, details, Play film, Favourite); holding OK on it opens the menu
    odZone = 0; odSea = 0; odEi = 0; odBi = 0; odRelI = 0; odBack = [];
    odShowView(true);
    if (!g.metaP) odMeta(g).then(function () { if (odOpen && odView === 'show' && odSel().g === g) odRender(); });
    odRender();
  }
  // ---- On Demand seasonal theme: the same snow, drifts and plough as the guide, over the On Demand screens, switched by the same Options > Seasonal effects setting
  var odSeasonOv = null;
  function odSeasonUpdate() {
    if (!window.SEASONS || !$('odsnow')) return;
    var want = seasonOn && odOpen && !odPip && !!SEASONS.current();
    if (want && !odSeasonOv) odSeasonOv = SEASONS.snow($('odsnow'), function () {
      var r = $('odrows'), b = r ? r.getBoundingClientRect().bottom : window.innerHeight - 40;
      return Math.max(20, window.innerHeight - b);
    }, dlog);
    SEASONS.cfg.TIER = snowTier;
    if (want) odSeasonOv.start(); else if (odSeasonOv) odSeasonOv.stop();
  }
  function odOpenUi(noJump) {
    var chs = odChannels();
    if (!chs.length) { toast('On Demand is not ready yet', 2500); return; }
    // opened from the guide with a programme under the cursor: go to that show (or film), as when it is opened from what is playing
    var gjC = null, gjP = null;
    if (guideOpen && !noJump && gChan && gChan.status === 'ready' && gChan.id !== 'adbreak' && gChan.sched) {
      var gjB = E.blockAt(gChan.sched, gFocus);
      if (gjB && gjB.prog && !gjB.prog.ad) { gjC = gChan; gjP = gjB.prog; }
    }
    odFrom = guideOpen ? 'guide' : (cur ? 'watch' : '');
    odGuide = guideOpen ? { chan: gChan, win: gWin, focus: gFocus } : null;     // so leaving On Demand lands back on the same programme
    closeOsd(); closeOpts();
    if (guideOpen) closeGuide();
    odT0 = odT1 = performance.now(); odT0Warm = odChannels().every(function (c) { return odiHas(c.id); });
    odOpen = true; odArtFor = ''; odBgFor = ''; odTop = 0; odNone = '';
    odRet = null; odJumpRow = null; odRowsMemo = null; odChip = 0; odCi = 0; odHeroI = 0; odHero = []; odZn = 'chips'; odRailBack = 'rows'; odGKey = '';
    odSetView('home');
    var rows = odRowList();
    odRi = 0; odRc = rows[0] || null;
    $('od').className = '';
    odSeasonUpdate();
    v.muted = true;
    var jump = !noJump && odFrom === 'watch' && cur && cur.prog && !cur.ad;       // Back from playing (noJump) lands on the home page at once; finding and opening the show first made it hang
    odBusy = !!jump;
    odHeroPick();
    odEnter();
    // only the first genre row is built up front (for the hero); the others as the highlight comes near them
    odEnsureRow(rows.filter(function (r) { return r.ch; })[0]);
    if (jump) odJump(cur.ch, cur.prog);
    else if (gjC) { odBusy = true; odJump(gjC, gjP); }
    odCwFirst();
    odRowsAhead();
  }
  /** On Demand opened before every channel was ready: as each lands, redraw (a moment after the last one, and not while a button is pressed). */
  var odLandTimer = null;
  function odChannelLanded(all) {
    if (!odOpen || !started) return;
    clearTimeout(odLandTimer);
    function tryDraw() {
      if (!odOpen) return;
      if (Date.now() - lastKeyAt < 1200) { odLandTimer = setTimeout(tryDraw, 800); return; }
      odRowsMemo = null;
      if (odView === 'home') odRender();
      if (all) { odCwFirst(); odRowsAhead(); }
    }
    odLandTimer = setTimeout(tryDraw, all ? 300 : 700);
  }
  /** Fill in the other genre rows one by one while On Demand sits open, a row at a time and only when no button was pressed
   *  for a moment, so scrolling down finds each row ready instead of waiting for it. */
  var odAheadTok = 0;
  function odRowsAhead() {
    var tok = ++odAheadTok, list = odRowList().filter(function (r) { return r.ch && !r.fixed; }), i = 0;
    (function next() {
      if (tok !== odAheadTok || !odOpen || i >= list.length) return;
      if (Date.now() - lastKeyAt < 1500 || odBusy) { setTimeout(next, 600); return; }
      var row = list[i++];
      odEnsureRow(row);
      (function waitRow() {
        if (tok !== odAheadTok || !odOpen) return;
        if (row._busy) { setTimeout(waitRow, 250); return; }
        setTimeout(next, 300);
      })();
    })();
  }
  /** Continue watching needs the lists of the channels its shows are on: load those before the genre rows, so the row is there at once. */
  function odCwFirst() {
    var t0 = performance.now(), seen = {}, todo = [];
    cwGet().forEach(function (e) { var c = odChannels().filter(function (x) { return x.id === e.ch; })[0]; if (c && !seen[c.id]) { seen[c.id] = 1; if (!odData[c.id]) todo.push(c); } });
    if (!todo.length) return;
    (function next() {
      var c = todo.shift();
      if (!c || !odOpen) { if (odOpen) dlog('ONDEMAND: Continue watching ready ' + Math.round(performance.now() - t0) + ' ms after opening'); return; }
      odLoadChannel(c).then(null, function () { /* skipped */ }).then(function () {
        odRowsMemo = null;
        if (odOpen && odView === 'home') odRender();
        setTimeout(next, 0);
      });
    })();
  }
  /** Opened while something is playing: go straight to that show's page, on the season and episode that is on. */
  function rwSame(a, b) { return a.virtual || b.virtual ? a.id === b.id : a.url === b.url; }      // virtual episodes have no url: they are told apart by id
  function odJump(c, prog, after, always) {
    odLoadChannel(c).then(function () {
      odBusy = false;
      if (!odOpen || odView !== 'home') return;
      var sh = odShowsOf(c) || [];
      var name = prog.show || prog.group || (parseTitle(prog.title || '').show) || '', key = LIBROUTE.norm(name), si = -1;
      sh.forEach(function (g, i) { if (si < 0 && (LIBROUTE.norm(g.name) === key || (!g.stub && g.eps.some(function (ep) { return rwSame(ep.p, prog); })))) si = i; });
      if (si < 0) { odRender(); return; }
      var g = sh[si];
      odJumpTo(g);                                   // the channel's shows become the row the show page belongs to
      if (g.film) { odRet = null; odZn = 'rows'; odRender(); if (after) after(); return; }      // a film is one video: land on its poster, don't start it again
      odRet = { rc: null, ri: 0, zn: 'chips', view: 'home' };       // Back from the show page goes to the top of On Demand
      odBusy = true; odRender();
      odHydrate(g).then(function () {
        odBusy = false;
        if (!odOpen || odView !== 'home') return;
        odOpenShow();
        for (var s = 0; s < g.sea.length; s++) {
          var e = -1; g.sea[s].eps.forEach(function (ep, n) { if (e < 0 && rwSame(ep.p, prog)) e = n; });
          if (e >= 0) { odSea = s; odEi = e; odZone = 2; break; }
        }
        odRender();
        if (always && after) after();
      }, function () { odBusy = false; odRender(); });
    });
  }
  /** Start up in is On Demand: it is home, so Back at its top does not go on to the TV guide; like the guide's own home, a second quick Back asks to quit. */
  function odHomeMode() { return expOn && startOdOn; }
  function odBackHome() {
    var n = Date.now();
    if (n - lastBack < DOUBLE_BACK_MS) { lastBack = 0; openQuit(); return; }
    lastBack = n; pressBackToExit();
  }
  function odClose(restore) {
    odPipOff();
    odOpen = false;
    clearTimeout(odMetaTimer);
    $('od').className = 'hidden';
    odSeasonUpdate();
    v.muted = false;
    if (restore) {                                    // Back from On Demand always lands on the TV guide, wherever On Demand was opened from
      openGuide();
      if (odFrom === 'guide' && odGuide && guideList().indexOf(odGuide.chan) >= 0) {
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
      // a channel with no saved index has to be built, which holds the TV for a second or two: not while buttons are being pressed
      if (!odiHas(chs[i].id) && Date.now() - lastKeyAt < 2500) { setTimeout(next, 700); return; }
      var c = chs[i++], built = !odiHas(c.id);
      odLoadChannel(c).then(function () { if (odOpen && odView === 'home') odRender(); setTimeout(next, built ? 600 : 30); });
    })();
  }
  /** Build every channel's On Demand list in the background after start-up, one at a time and only while nothing else
   *  is loading, so opening On Demand later finds them ready instead of building them while you wait. */
  var odWarmed = false;
  function odWarm() {
    if (odWarmed) return;
    odWarmed = true;
    // Build the On Demand index (one small row per show) for every channel that has none saved for this library revision,
    // one channel at a time and only while nothing else is loading. A channel's rows are read from the file afterwards, so
    // opening On Demand never builds anything; the heavy grouping happens only for the show whose page is opened.
    var list = odChannels().filter(function (c) { return !odiHas(c.id); }), i = 0, t0 = Date.now();
    if (!list.length) return;
    dlog('ONDEMAND: building the index for ' + list.length + ' channels');
    (function next() {
      if (i >= list.length) { dlog('ONDEMAND: index built for ' + list.length + ' channels in ' + Math.round((Date.now() - t0) / 100) / 10 + ' s'); return; }
      if (!quiet() || playingOd() || Date.now() - lastKeyAt < 4000) { setTimeout(next, 4000); return; }
      var c = list[i++];
      odiBuild(c).then(function () { setTimeout(next, 800); }, function (e) { dlog('ONDEMAND: index for ' + c.id + ' failed: ' + (e && e.message)); setTimeout(next, 800); });
    })();
  }
  /** Load the focused channel's shows first, then show them. */
  function odEnter() {
    var s = odSel();
    odRender();
    odEnsureRow(s.c); odEnsureRow(s.rows[odRi + 1]);
  }
  function odRailGo(i) {
    if (i === 0) { if (odView !== 'home') odSetView('home'); odChip = 0; odCi = 0; odRowsMemo = null; odRi = 0; odRc = null; odZn = 'chips'; odHeroI = 0; }
    else if (i === 1) { odZn = odRailBack; odGridOpen(); return; }          // the rail gives the focus up when an item is chosen, or the new page looks as if it were still in it
    else if (i === 2) { odZn = odRailBack; odFavOpen(); return; }
    else if (i === 3) { odClose(false); openGuide(); return; }
    else if (i === 4) { odZn = odRailBack; odSearchAsk(); return; }
    else { odClose(false); openOpts(); return; }
    odRender();
  }
  function odSetChip(i) {
    odChip = i; odCi = i; odRowsMemo = null; odRi = 0; odRc = null;
    odEnter();
  }
  /** A key while the bar has focus (home, Browse or Favourites). Returns true when it handled it. */
  function odBarKey(k) {
    var vis = odBarVis(), at = vis.indexOf(odCi), ok = k === 'Enter' || k === ' ';
    if (at < 0) { odCi = odBarCur(); at = vis.indexOf(odCi); if (at < 0) { odCi = 0; at = 0; } }
    if (k === 'ArrowLeft') {
      if (at > 0) odCi = vis[at - 1];
      else if (window.PHONE && odView === 'home') { odRailBack = 'chips'; odZn = 'rail'; }
    } else if (k === 'ArrowRight') { if (at < vis.length - 1) odCi = vis[at + 1]; }
    else if (k === 'ArrowDown') {
      if (odView === 'grid') odGz = 'list';
      else if (odView === 'fav') odFz = 'cards';
      else { odZn = odHero.length ? 'hero' : 'rows'; if (odZn === 'rows') odEnter(); }
    } else if (ok) {
      var i = odCi;
      if (i < 4) { if (odView !== 'home') { odSetView('home'); odGz = 'list'; odFz = 'cards'; odHeroI = 0; } odZn = 'chips'; odSetChip(i); return true; }
      if (i === 4) { if (odView === 'grid') { odGz = 'list'; odRender(); return true; } odZn = 'rows'; odFz = 'cards'; odGridOpen(); odGz = 'bar'; odRender(); return true; }
      if (i === 5) { if (odView === 'fav') { odFz = 'cards'; odRender(); return true; } odZn = 'rows'; odFavOpen(); odFz = 'bar'; odRender(); return true; }
      if (i === 6) { odSearchAsk(); return true; }
      odClose(false); if (i === 7) openGuide(); else openOpts();
      return true;
    }
    odRender(); return true;
  }
  /** A poster left highlighted for 5 seconds grows by 30%; any key, or the highlight moving, puts it back. */
  var OD_ZOOM = false;      // the 5 s highlight zoom is switched off for now
  var odZoomT = null;
  function odZoomOff() {
    clearTimeout(odZoomT);
    var z = document.querySelectorAll('#odrows .odzoom, #odrows .odzrow');
    for (var i = 0; i < z.length; i++) z[i].classList.remove('odzoom', 'odzrow');
  }
  function odZoomArm() {
    if (!OD_ZOOM) return;
    odZoomOff();
    if (!odOpen || odView !== 'home' || odZn !== 'rows' || odm) return;
    odZoomT = setTimeout(function () {
      if (!odOpen || odView !== 'home' || odZn !== 'rows' || odm || odPip) return;
      var c = document.querySelector('#odrows .odc.sel');
      if (!c || !c.parentNode || !c.parentNode.parentNode) return;
      c.classList.add('odzoom'); c.parentNode.parentNode.classList.add('odzrow');
    }, 5000);
  }
  function odKey(k) {
    odZoomOff();
    if (odPip && (k === 'GoBack' || k === 'Escape' || k === 'Backspace')) { odMark(); odClose(false); return true; }     // second Back: the video goes full screen
    if (odm) return k === 'Info' ? true : odmKey(k);
    if (k === 'Menu' || k === 'ContextMenu' || k === 'Info') {      // a held OK arrives as Info (see MainActivity)
      if (odView === 'home' && odZn === 'hero') { odOpenHero(); return true; }
      if (odView === 'home' && odZn === 'rows' && !odNone) { var q = odSel().g; if (q && q.onnow) odmOnNow(q); else if (q) odmOpen(); }
      else if (odView === 'show') { var rl = odZone === 2 ? odRelFor(odSel().g) : null; if (rl && rl.items[odRelI] && odRelI !== rl.cur) odmOpen(rl.items[odRelI].g); else odmOpen(); }
      else if (odView === 'fav') {
        if (odFz === 'cards') { var fc = odFavList()[odFi]; if (fc) odmFavCard(fc); }
        else if (odFz === 'mine') { var fg = odFavShows()[odFm]; if (fg) odFavTitleMenu(fg); }
      }
      else if (odView === 'grid' && odGz === 'list') { var gc = odGridChans()[odGl]; if (gc) odmChan(gc); }
      return true;
    }
    if (k === 'Guide' || k === 'Red') { odClose(false); openGuide(); return true; }
    if (k === 'Yellow') { odSearchAsk(); return true; }
    if (odView === 'show') return odKeyShow(k);
    if (odView === 'grid') return odKeyGrid(k);
    if (odView === 'fav') return odKeyFav(k);
    var back = k === 'GoBack' || k === 'Escape' || k === 'Backspace', ok = k === 'Enter' || k === ' ';
    if (odNone) {
      if (k === 'ArrowUp' || k === 'ArrowDown') odNoneI = 1 - odNoneI;
      else if (ok) { if (odNoneI === 0) { odSearchAsk(); return true; } odNone = ''; }
      else if (back) odNone = '';
      odRender(); return true;
    }
    if (odZn === 'rail') {
      if (k === 'ArrowUp') odRailI = (odRailI + OD_RAIL.length - 1) % OD_RAIL.length;
      else if (k === 'ArrowDown') odRailI = (odRailI + 1) % OD_RAIL.length;
      else if (k === 'ArrowRight' || back) odZn = odRailBack;
      else if (ok) { odRailGo(odRailI); return true; }
      odRender(); return true;
    }
    if (odZn === 'chips') {
      if (back) { if (odHomeMode()) { odBackHome(); return true; } odClose(true); return true; }
      return odBarKey(k);
    }
    if (odZn === 'hero') {
      if (k === 'ArrowLeft') odHeroI = (odHeroI + odHero.length - 1) % odHero.length;
      else if (k === 'ArrowRight') odHeroI = (odHeroI + 1) % odHero.length;
      else if (k === 'ArrowUp') { odZn = 'chips'; odCi = odChip; }
      else if (k === 'ArrowDown') { odZn = 'rows'; odEnter(); return true; }
      else if (ok) { odPlayHero(); return true; }
      else if (back) { if (odHomeMode()) { odBackHome(); return true; } odClose(true); return true; }
      odRender(); return true;
    }
    var s = odSel(), c = s.c, sh = s.sh, pos = c ? (odPos[c.id] || 0) : 0, vis = odVis(c);
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      var ni = odRi + (k === 'ArrowUp' ? -1 : 1);
      if (ni >= 0 && ni < s.rows.length) { odRi = ni; odRc = s.rows[ni]; odEnter(); return true; }
      if (k === 'ArrowUp') { odZn = odHero.length ? 'hero' : 'chips'; odCi = odChip; }
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      if (k === 'ArrowLeft' && pos === 0) { if (window.PHONE) { odRailBack = 'rows'; odZn = 'rail'; } }
      else if (sh && sh.length) odPos[c.id] = Math.max(0, Math.min(sh.length - 1, pos + (k === 'ArrowLeft' ? -1 : 1)));
    } else if (k === 'ChannelUp' || k === 'ChannelDown') {
      if (sh && sh.length) odPos[c.id] = Math.max(0, Math.min(sh.length - 1, pos + (k === 'ChannelUp' ? -vis + 1 : vis - 1)));
    } else if (ok) {
      if (s.g && s.g.onnow) { odWatchLive(s.g.chan); return true; }
      odOpenShow(); return true;
    } else if (back) {
      if (odRi > 0 || pos > 0) { odRi = 0; odRc = null; }       // Back goes up to the top of the page first, then out
      odZn = odHero.length ? 'hero' : 'chips'; odCi = odChip;
    }
    odRender();
    return true;
  }
  /** The show page: buttons on top, the seasons as chips, then one row of episode cards.
   *  Zones: 0 buttons, 1 seasons, 2 episodes. */
  function odKeyShow(k) {
    var g = odSel().g;
    if (!g) { odShowView(false); odRender(); return true; }
    var multi = g.sea.length > 1, list = (g.sea[odSea] || { eps: [] }).eps, nb = odBtns(g).length;
    var rel = g.film ? odRelFor(g) : null;
    if (k === 'ArrowUp') {
      if (odZone === 2) odZone = multi ? 1 : 0;
      else if (odZone === 1) odZone = 0;
    } else if (k === 'ArrowDown') {
      if (g.film) { if (rel && odZone === 0) { odZone = 2; odRelI = rel.cur >= 0 && rel.cur + 1 < rel.items.length ? rel.cur + 1 : 0; } }
      else if (odZone === 0) odZone = multi ? 1 : 2;
      else if (odZone === 1) odZone = 2;
    } else if (k === 'ArrowLeft') {
      if (odZone === 0) { if (odBi > 0) odBi--; else { odShowView(false); } }
      else if (odZone === 1) { if (odSea > 0) { odSea--; odEi = 0; } }
      else if (g.film) { if (odRelI > 0) odRelI--; }
      else if (odEi > 0) odEi--;
    } else if (k === 'ArrowRight') {
      if (odZone === 0) odBi = Math.min(nb - 1, odBi + 1);
      else if (odZone === 1) { if (odSea < g.sea.length - 1) { odSea++; odEi = 0; } }
      else if (g.film) { if (rel) odRelI = Math.min(rel.items.length - 1, odRelI + 1); }
      else odEi = Math.min(list.length - 1, odEi + 1);
    } else if (k === 'ChannelUp' || k === 'ChannelDown') {
      if (odZone === 2) odEi = Math.max(0, Math.min(list.length - 1, odEi + (k === 'ChannelUp' ? -OD_EPN + 1 : OD_EPN - 1)));
    } else if (k === 'Enter' || k === ' ') {
      if (odZone === 0) { var b = odBtns(g)[odBi]; if (b) b.f(); return true; }
      if (g.film && odZone === 2) { if (rel && rel.items[odRelI] && odRelI !== rel.cur) odRelOpen(rel.items[odRelI]); return true; }
      if (odZone === 1) { odZone = 2; }
      else if (list[odEi]) { odPlay(list[odEi]); return true; }
    } else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') {
      if (odBack.length) { var pv = odBack.pop(); odJumpHere(pv.g); odZone = 2; odRelI = pv.i; odBi = 0; }
      else odShowView(false);
    }
    odRender();
    return true;
  }
  // ---- Browse: the channels down the left, the shows as a grid of posters, Sort / Decade / Hide watched across the top
  var odGz = 'list', odGl = 0, odGci = 0, odGs = 0, odGd = 0, odGh = false, odGp = 0, odGlist = null, odGKey = '';
  var OD_SORTS = ['A–Z', 'Newest first', 'Oldest first'], OD_DECS = ['Any decade', '1970s', '1980s', '1990s'], OD_GCOLS = 6, OD_GROWS = 2;
  function odYear(g) {
    if (g._yr !== undefined && g._yg === odKGen) return g._yr;
    var y = 0;
    if (g.film) y = filmYear(g.eps[0].p) || g.yr || 0;
    else {
      y = g.art && parseInt(g.art.y, 10) || 0;
      if (!y && g.yr) y = g.yr;
      if (!y) (g.eps || []).forEach(function (e) { var a = parseInt(String(e.p && e.p.aired || '').slice(0, 4), 10); if (a > 1900 && (!y || a < y)) y = a; });
    }
    g._yg = odKGen; return (g._yr = y);
  }
  function odGShows() {
    var c = odGridChans()[odGl]; if (!c) return null;
    var sh = odShowsOf(c); if (!sh) return null;
    var key = c.id + '|' + sh.length + '|' + odGs + '|' + odGd + '|' + odGh + '|' + odKGen;
    if (odGKey === key && odGlist) return odGlist;
    var seen = odSeenSet();
    var l = sh.filter(function (g) {
      if (odGh && seen[LIBROUTE.norm(g.name)]) return false;
      if (odGd) { var y = odYear(g), lo = 1960 + odGd * 10; if (!(y >= lo && y < lo + 10)) return false; }
      return true;
    });
    if (odGs === 0) l.sort(function (a, b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
    else l.sort(function (a, b) { var ya = odYear(a), yb = odYear(b); if (!ya !== !yb) return ya ? -1 : 1; return odGs === 1 ? yb - ya : ya - yb; });
    odGKey = key; return (odGlist = l);
  }
  var odGFav = false;
  /** Browse's channel list: the favourites first, or only they when the chip is on. */
  function odGridChans() {
    var all = odChannels(), f = all.filter(isFav);
    if (odGFav && f.length) return f;
    return f.length ? f.concat(all.filter(function (c) { return !isFav(c); })) : all;
  }
  function odGridOpen() {
    odRet = null;
    odGz = 'list'; odGp = 0; odGKey = '';
    var cs = odGridChans(), at = cur ? cs.indexOf(cur.ch) : -1; if (at >= 0) odGl = at; odGl = Math.max(0, Math.min(odGl, cs.length - 1));
    odSetView('grid');
    odGridLoad();
    odRender();
    var rest = odGridChans().slice();          // every channel's count shows, so load the others in turn
    (function next() { var c = rest.shift(); if (!c || !odOpen || odView !== 'grid') return; odLoadChannel(c).then(function () { if (odOpen && odView === 'grid') odRender(); setTimeout(next, 30); }, function () { setTimeout(next, 30); }); })();
  }
  function odGridLoad() {
    var c = odGridChans()[odGl]; if (!c) return;
    odLoadChannel(c).then(function () { odGKey = ''; if (odOpen && odView === 'grid') odRender(); });
  }
  function odRenderGrid() {
    odSetBg(null);
    var cs = odGridChans(), gl = $('ogl'); gl.textContent = '';
    var top = Math.max(0, Math.min(odGl - 4, cs.length - 10));
    for (var i = top; i < Math.min(cs.length, top + 10); i++) {
      var r = odData[cs[i].id], it = odEl('div', 'ogli' + (i === odGl ? ' on' : '') + (i === odGl && odGz === 'list' ? ' sel' : ''), (isFav(cs[i]) ? '\u2605 ' : '') + cs[i].name);
      it.appendChild(odEl('small', '', r && r.shows ? String(r.shows.length) : '\u2022'));
      gl.appendChild(it);
    }
    var cc = $('ogc'); cc.textContent = '';
    ['Sort: ' + OD_SORTS[odGs], OD_DECS[odGd], 'Hide watched: ' + (odGh ? 'On' : 'Off'), '\u2605 Favourites' + (odGFav ? ': On' : '')].forEach(function (t, i) { cc.appendChild(odEl('div', 'odchip' + (odGz === 'chips' && odGci === i ? ' sel' : ''), t)); });
    var sh = odGShows(), gg = $('ogg'); gg.textContent = '';
    if (!sh) { for (var q = 0; q < OD_GCOLS * OD_GROWS; q++) gg.appendChild(odEl('div', 'odc odsk')); $('ogt').textContent = 'Loading…'; return; }
    odGp = Math.max(0, Math.min(odGp, sh.length - 1));
    var row0 = Math.max(0, Math.min(Math.floor(odGp / OD_GCOLS) - 1, Math.ceil(sh.length / OD_GCOLS) - OD_GROWS));
    odDecOn = true;
    for (var j = row0 * OD_GCOLS; j < Math.min(sh.length, (row0 + OD_GROWS) * OD_GCOLS); j++) gg.appendChild(odCard(sh[j], odGz === 'grid' && j === odGp));
    odDecOn = false;
    $('ogt').textContent = sh.length ? (odGp + 1) + ' of ' + sh.length : 'Nothing matches these filters';
  }
  function odKeyGrid(k) {
    var back = k === 'GoBack' || k === 'Escape' || k === 'Backspace', ok = k === 'Enter' || k === ' ';
    var cs = odGridChans(), sh = odGShows(), n = sh ? sh.length : 0;
    if (odGz === 'rail') {
      if (k === 'ArrowUp') odRailI = (odRailI + OD_RAIL.length - 1) % OD_RAIL.length;
      else if (k === 'ArrowDown') odRailI = (odRailI + 1) % OD_RAIL.length;
      else if (k === 'ArrowRight' || back) { odGz = 'list'; odZn = 'rows'; }
      else if (ok) { odGz = 'list'; odZn = 'rows'; odRailGo(odRailI); return true; }
      odRender(); return true;
    }
    if (back) { odSetView('home'); odZn = 'rows'; odRender(); return true; }
    if (odGz === 'bar') return odBarKey(k);
    if (odGz === 'list') {
      if (k === 'ArrowLeft') { if (window.PHONE) { odGz = 'rail'; odZn = 'rail'; odRailI = 1; odRender(); } return true; }
      if (k === 'ArrowUp') { if (odGl > 0) { odGl--; odGp = 0; odGridLoad(); } else { odGz = window.PHONE ? 'chips' : 'bar'; odCi = 4; } }
      else if (k === 'ArrowDown') { if (odGl < cs.length - 1) { odGl++; odGp = 0; odGridLoad(); } }
      else if (k === 'ArrowRight' || ok) odGz = 'grid';
    } else if (odGz === 'chips') {
      if (k === 'ArrowLeft') odGci = Math.max(0, odGci - 1);
      else if (k === 'ArrowRight') odGci = Math.min(3, odGci + 1);
      else if (k === 'ArrowUp' && !window.PHONE) { odGz = 'bar'; odCi = 4; }
      else if (k === 'ArrowDown') odGz = 'grid';
      else if (ok) { if (odGci === 0) odGs = (odGs + 1) % OD_SORTS.length; else if (odGci === 1) odGd = (odGd + 1) % OD_DECS.length; else if (odGci === 2) odGh = !odGh; else { if (!odGFav && !favs.length) { toast('No favourite channels yet: hold OK on a channel', 3500); return true; } odGFav = !odGFav; odGl = 0; odGKey = ''; odGridLoad(); } odGp = 0; }
    } else {
      if (k === 'ArrowLeft') { if (odGp % OD_GCOLS === 0) odGz = 'list'; else odGp--; }
      else if (k === 'ArrowRight') odGp = Math.min(n - 1, odGp + 1);
      else if (k === 'ArrowUp') { if (odGp >= OD_GCOLS) odGp -= OD_GCOLS; else odGz = 'chips'; }
      else if (k === 'ArrowDown') odGp = Math.min(n - 1, odGp + OD_GCOLS);
      else if (k === 'ChannelUp') odGp = Math.max(0, odGp - OD_GCOLS * OD_GROWS);
      else if (k === 'ChannelDown') odGp = Math.min(n - 1, odGp + OD_GCOLS * OD_GROWS);
      else if (ok && sh && sh[odGp]) { odJumpTo(sh[odGp]); odOpenShow(); return true; }
    }
    odRender();
    return true;
  }
  // ---- the Favourites screen: the favourite channels with what is on now and next, and the shows of the one in focus
  var odFi = 0, odFz = 'cards', odFp = 0, odFb = 0, odFm = 0;     // odFb: the button on the empty page
  function odFavList() { return odChannels().filter(isFav); }
  function odFavShows() { return odMyRow() ? odData._ml.shows : []; }
  function odFavOpen() {
    odRet = null; odFi = 0; odFz = 'cards'; odFp = 0; odFb = 0;
    odSetView('fav');
    var c = odFavList()[0]; if (c) odLoadChannel(c).then(function () { if (odOpen && odView === 'fav') odRender(); });
    odRender();
  }
  function odFavEntry(c) {
    var now = Date.now(), bl = [];
    try { bl = E.blocks(c.sched, now, now + 4 * 3600000); } catch (e) { bl = []; }
    var b = bl[0], nx = bl[1];
    var e = { name: b && b.prog ? odOnName(b.prog) : c.name, chan: c, prog: b && b.prog, eps: [], flat: [], sea: [] };
    e.onnow = b ? { start: b.startMs, end: b.endMs, sig: b.startMs, next: nx && nx.prog && !nx.prog.ad ? { t: gmName(nx.prog) || nx.prog.title || '', at: nx.startMs } : null } : { start: now, end: now + 1, sig: 0, next: null };
    return e;
  }
  function odRenderFav() {
    odSetBg(null);
    var l = odFavList(), box = $('odfav'); box.textContent = '';
    var hd = odEl('div', 'ofh'); hd.appendChild(odEl('h2', '', '\u2605 Favourites'));
    var fs = odFavShows();
    var cnt = (l.length ? l.length + (l.length === 1 ? ' channel' : ' channels') : '') + (l.length && fs.length ? '  \u00b7  ' : '') + (fs.length ? fs.length + (fs.length === 1 ? ' show' : ' shows') : '');
    if (cnt) hd.appendChild(odEl('span', '', cnt));
    box.appendChild(hd);
    if (!l.length && !fs.length) {
      var em = odEl('div', 'ofe');
      em.appendChild(odEl('div', 'ofstar', '\u2605'));
      em.appendChild(odEl('h3', '', 'No favourites yet'));
      em.appendChild(odEl('p', '', 'Pick the channels and shows you love most and they will live here, with what is on now and what is next.'));
      em.appendChild(odEl('p', 'ofhow', 'Highlight a channel or a show in the Guide or Browse, then hold OK and choose Add to favourites'));
      var bs = odEl('div', 'ofbs');
      ['Open Browse', 'Open the Guide'].forEach(function (t, i) { bs.appendChild(odEl('div', 'odb' + (odFb === i ? ' sel' : ''), t)); });
      em.appendChild(bs); box.appendChild(em); return;
    }
    box.appendChild(odEl('p', 'ofhelp', 'Hold OK on a channel or a show, in the Guide or in Browse, to add or remove it.'));
    odFi = Math.max(0, Math.min(odFi, l.length - 1));
    if (odFz === 'cards' && !l.length) odFz = 'mine';
    if (odFz === 'mine' && !fs.length) odFz = 'cards';
    if (odFz === 'posters') odFz = 'cards';
    if (l.length) {
      if (fs.length) box.appendChild(odEl('h3', 'ofs', 'Channels'));
      var cards = odEl('div', 'ofc'), first = Math.max(0, Math.min(odFi - 2, l.length - 5));
      for (var i = first; i < Math.min(l.length, first + 5); i++) cards.appendChild(odOnCard(odFavEntry(l[i]), odFz === 'cards' && i === odFi));
      box.appendChild(cards);
    }
    odDecOn = false;
    if (fs.length) {
      box.appendChild(odEl('h3', 'ofs', 'Shows'));
      var mr = odEl('div', 'ofp'); odFm = Math.max(0, Math.min(odFm, fs.length - 1));
      var ms = Math.max(0, Math.min(odFm - 2, fs.length - 7));
      for (var m = ms; m < Math.min(fs.length, ms + 7); m++) mr.appendChild(odCard(fs[m], odFz === 'mine' && m === odFm));
      box.appendChild(mr);
    }
  }
  /** Hold OK on a show in Favourites: play it, or take it off / put it on the list. */
  function odFavTitleMenu(g) {
    odHydrate(g).then(function () {
      var b0 = odBtns(g)[0];
      odm = { mode: 'menu', g: g, i: 0, title: g.name, items: [
        { t: 'Open', sub: 'Its page in On Demand', f: function () { odmClose(); odJumpTo(g); odOpenShow(); } },
        { t: mlHas(g) ? 'Remove from favourites' : 'Add to favourites', sub: g.name, f: function () { odmClose(); mlToggle(g); odRender(); } }] };
      if (b0) odm.items.unshift({ t: b0.t.indexOf('Resume') >= 0 ? 'Resume' : 'Play', sub: b0.t.replace(/^[^A-Za-z]+/, ''), f: function () { odmClose(); odJumpTo(g); b0.f(); } });
      odmRender();
    }, function () { toast('Could not open that show', 2500); });
  }
  function odmFavCard(c) {
    odm = { mode: 'menu', g: null, i: 0, title: c.name, items: [
      { t: 'Watch live', sub: 'Tune to ' + c.name, f: function () { odmClose(); odWatchLive(c); } },
      { t: 'Open in On Demand', sub: 'Browse its shows', f: function () { odmClose(); odGFav = false; odGridOpen(); var at = odGridChans().indexOf(c); if (at >= 0) { odGl = at; odGKey = ''; odGridLoad(); } odRender(); } },
      { t: 'Remove from favourites', sub: c.n + '  ' + c.name, f: function () { odmClose(); favToggle(c); odFi = Math.max(0, Math.min(odFi, odFavList().length - 1)); odRender(); } }] };
    odmRender();
  }
  var odFzBack = 'cards';
  function odFavRail(on) {
    if (on) { odFzBack = odFz === 'rail' ? odFzBack : odFz; odFz = 'rail'; odZn = 'rail'; odRailI = 2; }
    else { odFz = odFzBack; odZn = 'rows'; }
  }
  function odKeyFav(k) {
    var back = k === 'GoBack' || k === 'Escape' || k === 'Backspace', ok = k === 'Enter' || k === ' ', l = odFavList(), fs = odFavShows(), empty = !l.length && !fs.length;
    if (odFz === 'rail') {
      if (k === 'ArrowUp') odRailI = (odRailI + OD_RAIL.length - 1) % OD_RAIL.length;
      else if (k === 'ArrowDown') odRailI = (odRailI + 1) % OD_RAIL.length;
      else if (k === 'ArrowRight' || back) odFavRail(false);
      else if (ok) { odZn = 'rows'; odFz = odFzBack; odRailGo(odRailI); return true; }
      odRender(); return true;
    }
    if (back) { odSetView('home'); if (window.PHONE) { odZn = 'rail'; odRailI = 2; } else odZn = 'rows'; odRender(); return true; }
    if (odFz === 'bar') return odBarKey(k);
    if (empty) {
      if (k === 'ArrowLeft') { if (odFb === 0) { if (window.PHONE) odFavRail(true); } else odFb = 0; }
      else if (k === 'ArrowRight') odFb = 1;
      else if (k === 'ArrowUp' && !window.PHONE && odFb === 0) { odFz = 'bar'; odCi = 5; }
      else if (k === 'ArrowUp' || k === 'ArrowDown') odFb = 1 - odFb;
      else if (ok) { if (odFb === 0) odGridOpen(); else { odClose(false); openGuide(); } return true; }
      odRender(); return true;
    }
    if (odFz === 'cards') {
      if (k === 'ArrowLeft') { if (odFi > 0) odFi--; else if (window.PHONE) odFavRail(true); }
      else if (k === 'ArrowRight') odFi = Math.min(l.length - 1, odFi + 1);
      else if (k === 'ArrowUp' && !window.PHONE) { odFz = 'bar'; odCi = 5; }
      else if (k === 'ArrowDown') { if (fs.length) odFz = 'mine'; }
      else if (ok) { odWatchLive(l[odFi]); return true; }
    } else {
      if (k === 'ArrowLeft') { if (odFm > 0) odFm--; else if (window.PHONE) odFavRail(true); }
      else if (k === 'ArrowRight') odFm = Math.min(fs.length - 1, odFm + 1);
      else if (k === 'ArrowUp') { if (l.length) odFz = 'cards'; else if (!window.PHONE) { odFz = 'bar'; odCi = 5; } }
      else if (ok && fs[odFm]) { odJumpTo(fs[odFm]); odOpenShow(); return true; }
    }
    odRender(); return true;
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
  function odFixDone(g, entry, msg, testUrl, rename) {
    var test = testUrl || entry.p, shown = false;
    if (!entry.name) entry.name = g.name;
    if (!test) { odFixApply(g, entry, msg, rename); return; }
    odmWait('Loading the picture\u2026');
    var im = new Image(), timer = setTimeout(function () { fail(); }, 20000);
    function fail() {
      if (shown) return; shown = true; clearTimeout(timer);
      dlog('ARTWORK picture would not load: ' + test);
      odmClose(); toast('That picture would not load, so nothing was changed', 4500);
    }
    im.onload = function () { if (shown) return; shown = true; clearTimeout(timer); odFixApply(g, entry, msg, rename); };
    im.onerror = fail;
    im.src = test;
  }
  /** The name a show's or film's chosen artwork is filed under (a film: its own title, as the loading screen looks it up). */
  function odArtName(g) { return g.film && g.eps && g.eps[0] ? filmArtName(g.eps[0].p) : g.name; }
  /** Throw away a channel's grouped shows and build them again (after a show is renamed), landing on the show called `name`. */
  function odRegroup(g, name) {
    var c = g.chan; if (!c || !odData[c.id]) { odRender(); return; }
    odiDrop(c.id);                                 // the new name changes how this channel's shows group: its rows are built again
    delete odData[c.id]; odRowsMemo = null;
    odLoadChannel(c).then(function () {
      var sh = odShowsOf(c) || [], k = LIBROUTE.norm(name), i = -1;
      sh.forEach(function (x, n) { if (i < 0 && LIBROUTE.norm(x.name) === k) i = n; });
      if (i >= 0) { odPos[c.id] = i; odSea = 0; odEi = 0; }
      if (odOpen) odRender();
    });
  }
  function odFixApply(g, entry, msg, rename) {
    var old = odArtName(g);
    store.set('artfix:' + normShow(old), rename ? { a: entry, rn: 1 } : { a: entry });
    if (rename && entry.name && normShow(entry.name) !== normShow(old)) {
      store.set('artfix:' + normShow(entry.name), { a: entry, from: normShow(old) });      // the new name finds the same pick
      odmClose(); toast(msg, 3500); dlog('SHOW renamed ' + old + ' -> ' + entry.name);
      odArtFor = ''; odBgFor = ''; odKGen++; odRegroup(g, entry.name); return;
    }
    if (!g.film) { try { kv.removeItem('eps1:' + odSlug(g.name)); } catch (e) { /* ignore */ } }
    g.art = entry; g.metaP = null; g.meta = null; odArtFor = ''; odBgFor = ''; odKGen++;
    dlog('ARTWORK picked for ' + g.name + ': ' + (entry.name || '') + (entry.tvdb ? ' (TheTVDB ' + entry.tvdb + ')' : ' (TVmaze ' + (entry.i || '?') + ')') + (entry.p ? ' poster ' + entry.p : '') + (entry.b ? ' background ' + entry.b : ''));
    odmClose(); toast(msg, 3500);
    if (odView === 'show') odMeta(g).then(function () { if (odOpen && odView === 'show' && odSel().g === g) odRender(); });
    odRender();
  }
  function odmOpen(g0) {
    var g = g0 || odSel().g;
    if (!g) return;
    if (g.stub) { odHydrate(g).then(function () { if (odOpen && !odm) odmOpen(g); }, function () { /* no menu for a show that will not open */ }); return; }
    var optsItem = { t: 'Options', sub: 'Settings, help and debug', f: function () { odmClose(); openOpts(); } };
    var searchItem = { t: 'Search', sub: odQuery ? 'Find a show or film by name (now: ' + odQuery + ')' : 'Find a show or film by name', f: function () { odmClose(); odSearchAsk(); } };
    var infoItem = { t: 'Info', sub: 'Details, cast and the file it plays', f: function () { odmClose(); var e0 = (g.flat && g.flat[0]) || (g.eps && g.eps[0]); if (e0) openInfo({ prog: e0.p, ch: g.chan }); } };
    var fixItem = function (sub) { return { t: 'Fix artwork…', sub: sub, f: function () { odm = { mode: 'menu', g: g, i: 0, title: 'Fix artwork', sub: 1, items: fix }; odmRender(); } }; };
    var hideItem = { t: g.film ? 'Hide this film' : 'Hide this show', sub: 'Take it off this TV (Options > TV Guide > Hidden shows)', f: function () { hideShow(g.name, !!g.film); } };
    var fix;
    if (g.film) {                                            // a film keeps the poster that came with it: nothing to scrape or choose
      var need = function (fn) { return function () { if (!tvdbReady()) { odmClose(); toast('Film artwork needs a TheTVDB key (Options > Artwork)', 4500); return; } fn(); }; };
      var fixed = store.get('artfix:' + normShow(odArtName(g)));
      fix = [
        { t: 'Scrape artwork', sub: 'Find this film’s backdrop on TheTVDB', f: need(function () { odmFilmScrape(g); }) },
        { t: 'Choose the right film', sub: 'Pick from the list if the wrong film was matched', f: need(function () { odmFilmList(g); }) },
        { t: 'Choose a poster', sub: 'Pick the picture shown on its card', f: need(function () { odmFilmPics(g, 'poster'); }) },
        { t: 'Choose a background', sub: 'Pick the wide picture behind the film', f: need(function () { odmFilmPics(g, 'background'); }) }];
      if (fixed && fixed.a) fix.push({ t: 'Back to automatic', sub: 'Forget the choices made for this film', f: function () {
        try { kv.removeItem('artfix:' + normShow(odArtName(g))); } catch (e) { /* ignore */ }
        g._k = null; odArtFor = ''; odBgFor = ''; odKGen++; odmClose(); toast('Artwork back to automatic', 2500); odRender(); } });
      odmBuild(g, infoItem, [searchItem, fixItem('Scrape it again, or choose the film, poster or background'), optsItem, hideItem]); return;
    }
    fix = [
      { t: 'Scrape artwork', sub: 'Look the show up again and use the best match', f: function () { odmScrape(g); } },
      { t: 'Choose the right show', sub: 'Pick from the list if the wrong show was matched', f: function () { odmShows(g); } },
      { t: 'Choose a poster', sub: 'Pick the picture shown on its card', f: function () { odmPics(g, 'poster'); } },
      { t: 'Choose a background', sub: 'Pick the wide picture behind the show', f: function () { odmPics(g, 'background'); } },
      { t: 'Back to automatic', sub: 'Forget the choices made for this show', f: function () {
        var fx = store.get('artfix:' + normShow(g.name)), back = fx && fx.from ? fx.from : '';
        try { kv.removeItem('artfix:' + normShow(g.name)); kv.removeItem('eps1:' + odSlug(g.name)); if (back) kv.removeItem('artfix:' + back); } catch (e) { /* ignore */ }
        g.art = undefined; g.metaP = null; g.meta = null; odArtFor = ''; odBgFor = ''; odmClose(); toast('Artwork back to automatic', 2500);
        if (back) odRegroup(g, g.name); else odRender(); } }];
    odmBuild(g, infoItem, [searchItem, fixItem('Scrape it again, or choose the show, poster or background'), optsItem, hideItem]);
  }
  /** The title menu: five items at most. The rare ones sit under More. Focus starts on the first, so a stray OK removes nothing. */
  function odmBuild(g, infoItem, rare) {
    var s = odSel(), b0 = odBtns(g)[0], top = [];
    if (b0) top.push({ t: b0.t.indexOf('Resume') >= 0 ? 'Resume' : 'Play', sub: b0.t.replace(/^[^A-Za-z]+/, ''), f: function () { odmClose(); b0.f(); } });
    if (odView === 'home' && s.c === cwPseudo && g._cw) top.push({ t: 'Remove from Continue watching', sub: g.name, f: function () {
      odmClose(); cwDrop(g.name); cwSig = ''; odRowsMemo = null; toast('Removed from Continue watching', 2500); odRender(); } });
    top.push({ t: mlHas(g) ? 'Remove from favourites' : 'Add to favourites', sub: g.name, f: function () { odmClose(); mlToggle(g); odRender(); } });
    top.push(infoItem);
    var more = { mode: 'menu', g: g, i: 0, sub: 1, title: 'More', items: rare };
    odm = more; adOdm(g); optsLast(more.items);
    top.push({ t: 'More\u2026', sub: 'Search, fix artwork, options, hide', f: function () { odm = more; odmRender(); } });
    odm = { mode: 'menu', g: g, i: 0, items: top, title: g.name };
    odmRender();
  }
  /** Hold OK on a channel in Browse: add or remove it from the favourite channels. */
  /** Hold OK on a programme in On now: watch that channel live, or add or remove the channel from the favourites. */
  function odmOnNow(g) {
    var c = g.chan; if (!c) return;
    var items = [
      { t: 'Watch live', sub: c.n + '  ' + c.name, f: function () { odmClose(); odWatchLive(c); } },
      { t: isFav(c) ? 'Remove channel from favourites' : 'Add channel to favourites', sub: c.n + '  ' + c.name, f: function () { odmClose(); favToggle(c); odRowsMemo = null; odRender(); } },
      { t: 'Options', sub: 'Settings, help and debug', f: function () { odmClose(); openOpts(); } }];
    odm = { mode: 'menu', g: null, i: 0, items: items, title: g.name };
    odmRender();
  }
  function odmChan(c) {
    var it = { t: isFav(c) ? 'Remove from favourites' : 'Add to favourites', sub: c.n + '  ' + c.name, f: function () {
      odmClose(); favToggle(c); odGKey = ''; var at = odGridChans().indexOf(c); if (at >= 0) odGl = at; odGp = 0; odRender(); } };
    odm = { mode: 'menu', g: null, i: 0, items: [it], title: c.name };
    odmRender();
  }
  function odmClose() { odm = null; $('odmenu').className = 'hidden'; }
  function odmWait(text) { if (odm) { odm.mode = 'wait'; odm.items = []; odm.note = text; odmRender(); } }
  function odmSearch(g) {
    return getJSON('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(g.name)).then(function (l) { return Array.isArray(l) ? l : []; }, function () { return null; });
  }
  /** Look the show up again; take the match if it is clearly the one, otherwise let the person choose. */
  function odmFilmEntry(d, keepPoster) {
    return { name: d.name, i: 0, tvdb: d.tvdb, film: 1, p: keepPoster ? '' : (d.poster || ''), b: d.background || '', y: String(d.year || '') };
  }
  function odmFilmBase(g) {            // what is chosen for this film so far, or a fresh search
    var fx = store.get('artfix:' + normShow(odArtName(g)));
    if (fx && fx.a && fx.a.tvdb && fx.a.film) return Promise.resolve(fx.a);
    return tvdbFilm(odArtName(g), filmYear(g.eps[0].p)).then(function (d) { return d ? odmFilmEntry(d, true) : null; });
  }
  function odmFilmFail(e) { dlog('TVDB film lookup failed: ' + e.message); if (odm) { odm.mode = 'wait'; odm.items = []; odm.note = 'Could not reach TheTVDB'; odmRender(); } }
  function odmFilmScrape(g) {
    odmWait('Looking for ' + filmQuery(odArtName(g)) + ' on TheTVDB…');
    tvdbFilm(odArtName(g), filmYear(g.eps[0].p)).then(function (d) {
      if (!odm) return;
      if (!d) { dlog('TVDB film: no match for ' + odArtName(g)); odmFilmList(g); toast('No clear match. Choose the right film', 3500); return; }
      if (!d.background) { dlog('TVDB film: ' + d.name + ' has no backdrop'); odm.mode = 'wait'; odm.items = []; odm.note = 'TheTVDB has ' + d.name + ' but no backdrop for it'; odmRender(); return; }
      dlog('TVDB film found ' + d.name + ' (' + d.tvdb + ') for ' + g.name);
      odFixDone(g, odmFilmEntry(d, true), 'Found ' + d.name + (d.year ? ' (' + d.year + ')' : '') + ' on TheTVDB', d.background);
    }, odmFilmFail);
  }
  function odmFilmList(g) {
    odmWait('Searching TheTVDB…');
    tvdbFilmSearch(odArtName(g), 0).then(function (list) {
      if (!odm) return;
      if (!list.length) { odm.mode = 'wait'; odm.items = []; odm.note = 'TheTVDB has nothing for “' + filmQuery(odArtName(g)) + '”'; odmRender(); return; }
      odm.mode = 'shows'; odm.note = ''; odm.i = 0; odm.title = 'Choose the right film';
      odm.items = list.slice(0, 8).map(function (r) {
        return { t: r.name || '', sub: [r.year, r.country === 'gbr' ? 'UK' : r.country].filter(Boolean).join('  ·  '), img: https(r.thumbnail || r.image_url), f: function () {
          odmWait('Getting pictures…');
          tvdbFilmExtended(r).then(function (d) {
            dlog('TVDB film pick ' + d.name + ' (' + d.tvdb + ') for ' + g.name);
            odFixDone(g, odmFilmEntry(d, false), 'Using ' + d.name + (d.year ? ' (' + d.year + ')' : ''), d.background || d.poster);
          }, odmFilmFail);
        } };
      });
      odmRender();
    }, odmFilmFail);
  }
  function odmFilmPics(g, kind) {
    odmWait('Getting pictures…');
    odmFilmBase(g).then(function (base) {
      if (!odm) return;
      if (!base) { odmFilmList(g); toast('Choose the right film first', 3000); return; }
      return tvdbQueue(function () { return tvdbGet('/movies/' + base.tvdb + '/extended?short=true'); }).then(function (j) {
        if (!odm) return;
        var arts = tvdbFilmArts(j && j.data && j.data.artworks, kind);
        odm.items = arts.slice(0, 12).map(function (a) {
          return { img: https(a.thumbnail || a.image), f: function () {
            var e = {}; Object.keys(base).forEach(function (k) { e[k] = base[k]; });
            var url = https(a.image);
            e[kind === 'poster' ? 'p' : 'b'] = url;
            odFixDone(g, e, kind === 'poster' ? 'Poster changed' : 'Background changed', url);
          } };
        });
        odm.mode = odm.items.length ? (kind === 'poster' ? 'posters' : 'backs') : 'wait'; odm.note = odm.items.length ? '' : 'No ' + kind + 's on TheTVDB for this film';
        odm.i = 0; odm.title = kind === 'poster' ? 'Choose a poster' : 'Choose a background';
        odmRender();
      });
    }).then(null, odmFilmFail);
  }
  function odmScrape(g) {
    if (tvdbReady()) {
      odmWait('Looking for ' + g.name + ' on TheTVDB\u2026');
      tvdbQueue(function () { return tvdbFind(g.name); }).then(function (hit) { return hit ? tvdbExtended(hit) : null; }).then(function (d) {
        if (!odm) return;
        if (d && (d.poster || d.background)) {
          tvdbStat.found++; dlog('TVDB scrape found ' + d.name + ' (' + d.tvdb + ') for ' + g.name + (d.background ? ' with a backdrop' : ' with no backdrop'));
          odFixDone(g, tvdbEntry(d), 'Found ' + d.name + (d.year ? ' (' + d.year + ')' : '') + ' on TheTVDB');
        } else { tvdbStat.none++; dlog('TVDB scrape: no match for ' + g.name + ', trying TVmaze'); odmScrapeMaze(g); }
      }, function (e) { tvdbStat.fail++; dlog('TVDB scrape failed for ' + g.name + ': ' + e.message + ', trying TVmaze'); if (odm) odmScrapeMaze(g); });
      return;
    }
    odmScrapeMaze(g);
  }
  function odmScrapeMaze(g) {
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
  function odmShows(g) {
    if (!tvdbReady()) { odmShowsMaze(g); return; }
    odmWait('Searching TheTVDB\u2026');
    tvdbQueue(function () { return tvdbGet('/search?type=series&limit=8&query=' + encodeURIComponent(g.name)); }).then(function (j) {
      if (!odm) return;
      var list = ((j && j.data) || []).filter(function (r) { return r.tvdb_id; }).slice(0, 8);
      if (!list.length) { dlog('TVDB search: nothing for ' + g.name + ', trying TVmaze'); odmShowsMaze(g); return; }
      odm.mode = 'shows'; odm.note = ''; odm.i = 0; odm.title = 'Choose the right show (TheTVDB)';
      odm.items = list.map(function (r) {
        return { t: r.name || '', sub: [r.year, r.network, r.country === 'gbr' ? 'UK' : r.country].filter(Boolean).join('  \u00b7  '), img: https(r.thumbnail || r.image_url), f: function () {
          odmWait('Getting pictures\u2026');
          tvdbExtended(r).then(function (d) {
            dlog('TVDB pick ' + d.name + ' (' + d.tvdb + ') for ' + g.name);
            odFixDone(g, tvdbEntry(d), 'Using ' + d.name + (d.year ? ' (' + d.year + ')' : ''), null, true);
          }, function (e) { dlog('TVDB pick failed: ' + e.message); if (odm) { odm.note = 'Could not reach TheTVDB'; odmRender(); } });
        } };
      });
      odmRender();
    }, function (e) { dlog('TVDB search failed for ' + g.name + ': ' + e.message + ', trying TVmaze'); if (odm) odmShowsMaze(g); });
  }
  function odmShowsMaze(g) { odmWait('Searching TVmaze…'); odmSearch(g).then(function (list) { if (odm) { if (list === null) { odm.note = 'Could not reach TVmaze'; odmRender(); } else odmShowList(g, list, 'Choose the right show'); } }); }
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
          odFixDone(g, e, 'Using ' + e.name + (e.y ? ' (' + e.y + ')' : ''), null, true);
        });
      } };
    });
    odm.mode = items.length ? 'shows' : 'wait'; odm.note = items.length ? '' : 'TVmaze has nothing for “' + g.name + '”'; odm.items = items; odm.i = 0; odm.title = title || 'Choose the right show';
    odmRender();
  }
  function odmPics(g, kind) {
    odmWait('Getting pictures…');
    artShow(g.name).then(function (base) {
      if (base && base.tvdb && tvdbReady()) {                      // a show chosen from TheTVDB: its pictures come from there
        tvdbQueue(function () { return tvdbGet('/series/' + base.tvdb + '/extended?short=true'); }).then(function (j) {
          if (!odm) return;
          var type = kind === 'poster' ? 2 : 3, arts = ((j && j.data && j.data.artworks) || []).filter(function (a) { return a.type === type && a.image; });
          arts.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
          odm.items = arts.slice(0, 12).map(function (a) {
            return { img: https(a.thumbnail || a.image), f: function () {
              var e = {}; Object.keys(base).forEach(function (k) { e[k] = base[k]; });
              var url = https(a.image);
              e[kind === 'poster' ? 'p' : 'b'] = url;
              odFixDone(g, e, kind === 'poster' ? 'Poster changed' : 'Background changed', url);
            } };
          });
          odm.mode = odm.items.length ? (kind === 'poster' ? 'posters' : 'backs') : 'wait'; odm.note = odm.items.length ? '' : 'No ' + kind + 's on TheTVDB for this show';
          odm.i = 0; odm.title = kind === 'poster' ? 'Choose a poster' : 'Choose a background';
          odmRender();
        }, function (e) { dlog('TVDB pictures failed: ' + e.message); if (odm) { odm.note = 'Could not reach TheTVDB'; odmRender(); } });
        return;
      }
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
      if (m.mode === 'menu' && m.sub) odmOpen(); else if (m.mode === 'menu' || m.mode === 'wait') odmClose(); else odmOpen();
      return true;
    }
    if (m.mode === 'wait') return true;
    var strip = m.mode === 'posters' || m.mode === 'backs';
    var back = strip ? 'ArrowLeft' : 'ArrowUp', fwd = strip ? 'ArrowRight' : 'ArrowDown';
    var mn = m.items.length;
    if (k === back) { if (mn) m.i = (m.i + mn - 1) % mn; }              // past either end it wraps round
    else if (k === fwd) { if (mn) m.i = (m.i + 1) % mn; }
    else if (k === 'Enter' || k === ' ') { var it = m.items[m.i]; if (it) it.f(); return true; }
    odmRender();
    return true;
  }
  var odPlaced = null, odPip = false, odPipSig = '';
  try { new MutationObserver(function () { odPipLayout(); }).observe($('od'), { attributes: true, attributeFilter: ['class'] }); } catch (e) { /* no observer */ }
  /** Back while a video plays: the video carries on in a small window at the top right of On Demand; Back again takes it full screen. */
  function odPipOn() {
    odPip = true;
    document.body.classList.add('odpip');
    odSeasonUpdate();
    odPipLayout();
  }
  function odPipLayout() {
    if (!odPip) return;
    var W = window.innerWidth, H = window.innerHeight, d = window.devicePixelRatio || 1;
    var bh = Math.round($('odbg').getBoundingClientRect().height) || Math.round(H * 0.66);      // the video takes the hero's picture: the same height, 16:9, against the right edge
    var h = bh, w = Math.round(h * 16 / 9);
    if (w > W) { w = W; h = Math.round(w * 9 / 16); }
    var l = W - w, t = 0, sig = l + ',' + t + ',' + w + ',' + h;
    if (sig === odPipSig) return;                         // nothing moved: the native surface is not touched again (every redraw of the page comes through here)
    odPipSig = sig;
    $('od').style.setProperty('--pipb', bh + 'px');
    if (document.body.classList.contains('np')) {         // the app's own player draws behind the page: move it there
      try { NativeHttp.npRect(Math.round(l * d), t, Math.round(w * d), Math.round(h * d)); } catch (e) { /* older app */ }
    } else {
      var e = $('v'); e.style.left = l + 'px'; e.style.top = t + 'px'; e.style.width = w + 'px'; e.style.height = h + 'px';
    }
  }
  function odPipOff() {
    if (!odPip) return;
    odPip = false; odPipSig = '';
    document.body.classList.remove('odpip');
    odSeasonUpdate();
    $('od').style.removeProperty('--pipb');
    var e = $('v'); e.style.left = e.style.top = e.style.width = e.style.height = '';
    if (document.body.classList.contains('np')) { try { NativeHttp.npRect(0, 0, 0, 0); } catch (x) { /* older app */ } }
  }
  /** Leave playback for On Demand. The page is put up at once as it was last drawn, the picture is paused, and only then is the page worked out:
   *  while the player is still decoding, every read from storage waits behind it (the log showed 5 to 14 seconds). */
  function odBackFromPlay(noPip) {
    closeOsd();
    var pip = !noPip && !!(cur && !v.paused && odPlaced && !odOpen);
    $('od').className = '';
    if (!pip) { v.muted = true; try { v.pause(); } catch (e) { /* nothing playing */ } }
    if (odPlaced && !odOpen) {
      if (pip) odPipOn();          // On Demand was only hidden when the picture started: show it exactly as it was, build nothing
      odPlaced = null; odOpen = true; odBusy = false; odFrom = 'watch';
      setTimeout(function () { if (!odOpen) return; idleFor(4000).then(function () { if (odOpen && odView === 'home') { odRowsMemo = null; odRender(); } }); }, 3000);   // pick up Continue watching a little later
      return;
    }
    setTimeout(function () { if (odOpen) return; odOpenUi(true); odRestore(); }, 250);
  }
  /** Remember where On Demand was left when something starts playing, so Back puts it all back. */
  function odMark() {
    var g = odView === 'show' ? odSel().g : null;
    odPlaced = { chip: odChip, view: odView, rcId: odRc && odRc.id, g: g, ret: odRet, zone: odZone, sea: odSea, ei: odEi, bi: odBi, rel: odRelI, pos: odRc && odPos[odRc.id] };
  }
  function odRestore() {
    var r = odPlaced; odPlaced = null;
    if (!r || !odOpen) return;
    odChip = r.chip; odCi = r.chip; odRowsMemo = null;
    if (r.view === 'show' && r.g && !r.g.stub) {
      odJumpHere(r.g); odRet = r.ret; odZone = r.zone; odSea = r.sea; odEi = r.ei; odBi = r.bi; odRelI = r.rel; odBack = [];
      odShowView(true); odRender(); return;
    }
    if (r.view !== 'home' || !r.rcId || r.rcId === '_jp') return;
    var rows = odRowList(), at = -1;
    rows.forEach(function (x, i) { if (at < 0 && x.id === r.rcId) at = i; });
    if (at < 0) return;
    odRi = at; odRc = rows[at]; odZn = 'rows';
    odEnter();
  }
  function odPlay(ep) {
    var s = odSel(), g = s.g;
    if (!s.c || !g || !ep || !ep.p) return;
    odMark();
    var i = g.flat.indexOf(ep), c = g.chan || s.c;     // the Continue watching row is not a channel: the show knows its own
    var at = odResumeAt(g, ep);
    odClose(false);
    odStart(c, g.flat, i, at, g.name);
  }
  function odStart(c, list, i, offset, name) {
    var info = { list: list, i: i, name: name || '' };
    playSlot(c, 0, offset || 0, true, true, list[i].p);
    if (cur) cur.od = info;
    if (name) { cwBlock = ''; cwPut(name, c.id, list[i].p.url, offset || 0, 0); odSeen(name); }
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
  // Experimental: start up in On Demand instead of the TV guide. Off (EPG) is the default. Takes effect from the next start.
  var startOdOn = store.get('startup1') === 'od';
  function changeStartup() {
    startOdOn = !startOdOn;
    store.set('startup1', startOdOn ? 'od' : 'epg');
    dlog('START-UP: set to ' + (startOdOn ? 'On Demand' : 'EPG') + ', saved as ' + JSON.stringify(store.get('startup1')));
    renderOpts();
    toast(startOdOn ? 'Starts in On Demand next time' : 'Starts in the TV guide next time', 2600);
  }
  var FIRST_WAIT = 60000;     // the loading screen stays until every channel has answered, so the guide opens complete and never stalls while channels fill in; this is only the safety limit for a connection that never answers (the guide then opens on what is ready and tunes to the last channel once it is, see lateTune)
  var OD_START_MIN = 2;       // starting in On Demand: channels that must be ready before it opens
  var OPEN_ROWS = 10;         // channels at the top of the guide that must be ready before it opens (the last-watched one is waited for above)
  var ALL_WAIT = 60000;       // ... the same limit for all the others

  var lateWant = null, landedAt = 0;
  /** The channel that was on last was not ready when the guide opened: tune to it as soon as it is, unless a key has been pressed since. */
  function lateTune() {
    var c = lateWant;
    if (!c || c.status === 'loading') { if (c && Date.now() - landedAt > 60000) lateWant = null; return; }
    lateWant = null;
    if (c.status !== 'ready' || lastKeyAt > landedAt || !cur || cur.ch === c || optsOpen || odOpen || infoOpen) return;
    dlog('START: tuned to ' + c.name + ' once it was ready');
    tune(c, false, true);
    if (guideOpen) openGuide();
  }
  // The app is no longer closed when Home is pressed on a TV (MainActivity.onStop), so coming back must be quick: playback is paused while
  // away, and on return a live channel is tuned again (the programme on now has moved on) and anything else carries on where it stopped.
  var bgAt = 0, bgPlaying = false;
  window.__bg = function (away) {
    try {
      if (away) {
        bgAt = Date.now(); bgPlaying = !!(cur && !v.paused);
        try { v.pause(); } catch (e) { /* none */ }
        dlog('APP: sent to the background');
        return;
      }
      var gone = Date.now() - bgAt;
      dlog('APP: back after ' + Math.round(gone / 1000) + ' s');
      if (!started || !cur) return;
      if (cur.od) { if (bgPlaying) v.play(); }
      else if (gone > 20000 && cur.ch && cur.ch.sched) tune(cur.ch, false, true);      // live: what is on now, not where it paused
      else if (bgPlaying) v.play();
      seasonUpdate();
    } catch (e) { dlog('APP: resume failed: ' + e.message); }
  };

  function begin() {
    if (started) { lateTune(); return; }
    var list = ready();
    if (!list.length) return;
    // The channel we would rather open on: the one that was on last, or else the first in the guide. On This Day
    // needs no requests at all, so it is ready before anything else; without this wait the app would always open on
    // it instead. Hold the loading screen a few seconds for the one we want, then start with whatever is ready.
    var want = store.get('last');
    var prefer = channels.filter(function (c) { return c.id === want; })[0] ||
                 channels.slice().sort(function (a, b) { return a.n - b.n; })[0];
    // Starting in On Demand needs no guide: open as soon as a handful of channels are ready (the rest join the rows as they land),
    // without waiting for the channel that was on last or the top of the guide.
    var odStart = expOn && startOdOn;
    if (odStart && list.length < OD_START_MIN && Date.now() - bootedAt < ALL_WAIT && !quiet()) return;
    if (odStart && performance.now() < OD_SPLASH_MIN) { renderStatus(); return; }       // keep the loading screen up long enough to be seen
    if (!odStart && prefer && prefer.status === 'loading' && Date.now() - bootedAt < FIRST_WAIT) return;
    // Open once the channel that was on last and the first screenful of the guide are ready; the other channels finish behind it
    // (the guide redraws as each one lands). Waiting for all of them made every start take as long as the slowest channel.
    var top = channels.slice().sort(function (a, b) { return a.n - b.n; }).slice(0, OPEN_ROWS);
    if (!odStart && Date.now() - bootedAt < ALL_WAIT && top.some(function (c) { return c.status === 'loading'; })) return;
    started = true;
    dlog('START: guide opening ' + Math.round(performance.now() / 100) / 10 + ' s after launch, ' + list.length + ' of ' + channels.length + ' channels ready');
    var pick = (prefer && prefer.status === 'ready' ? prefer : null) || list[0];
    if (!odStart && prefer && pick !== prefer && prefer.status === 'loading') lateWant = prefer;
    var land = function () {
      landedAt = Date.now();
      $('splash').className = 'hidden';
      clearInterval(spNoiseTimer); spNoiseTimer = null; clearInterval(bootTimer); clearInterval(spSurfTimer);   // nothing needs waking up 9 times a second now
      dlog('START: start-up setting ' + (startOdOn ? 'On Demand' : 'EPG') + ', Experimental ' + (expOn ? 'on' : 'off') + ', ' + odChannels().length + ' On Demand channels ready');
      if (expOn && startOdOn && odChannels().length) {
        odOpenUi(true);          // Experimental start-up in On Demand: its home screen, not a programme from the top
      } else {
        if (odSnapOn) { odSnapOn = false; $('od').className = 'hidden'; }
        tune(pick, false, true);   // start on the last channel (its picture shows in the guide's window) ...
        openGuide();               // ... but land in the TV guide
      }
      greetRelease();            // and say once if this is a version they have not run before
    };
    // Use addons as a main source: look the first programme up while the loading screen is still up
    var slot = amActive() && pick && pick.sched && E.at(pick.sched, Date.now());
    var rq = slot && amReq(pick.sched.order[slot.index]);
    if (!rq) { land(); return; }
    var sm = $('spmsg'); if (sm) sm.textContent = 'Scraping your debrid\u2026';
    amScrape(rq.g, rq.ep, 6000).then(function (list) { amPre = { k: adKeyOf(rq.g, rq.ep), list: list }; land(); }, function () { land(); });
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

  // ---- The built schedule of each channel (what plays when) is kept, so a start reads it back instead of laying it out again.
  // It is a list of places in the channel's programme list, so it is only used when that list is exactly as it was: the key
  // carries a fingerprint of the list, the span, the Broadcast schedule setting and SCHED_LOGIC (so an update does not throw saved schedules away).
  var SCHED_LOGIC = '8';   // change this only when how a schedule is laid out changes; an app update that leaves it alone keeps every saved schedule
  function schedKey(c, progs, seed, spanH) {
    if (!KV_NATIVE) return '';
    var sig = progs.map(function (p) { return (p.url || p.id) + ':' + p.dur; }).join('|');
    return 'sched1:' + c.id + ':' + E.hash([SCHED_LOGIC, seed, spanH, realOn ? 1 : 0, progs.length, sig].join('~'));
  }
  function schedRead(key, progs) {
    if (!key) return null;
    try {
      var t = kv.getItem(key); if (!t) return null;
      var r = JSON.parse(t), order = [];
      if (r.v !== 1 || !r.o || r.o.length !== r.s.length || r.d.length !== r.o.length) return null;
      for (var i = 0; i < r.o.length; i++) {
        var p = progs[r.o[i]]; if (!p) return null;
        order.push(r.d[i] && r.d[i] !== p.dur ? Object.assign({}, p, { dur: r.d[i] }) : p);
      }
      var g = E.buildGroups(order, r.s), s = { order: order, starts: r.s, total: r.t, groups: g.groups, gstarts: g.gstarts };
      if (r.c) s.cycle = r.c; if (r.b !== undefined) s.base = r.b; if (r.u) s.unit = r.u; if (r.n) s.n = r.n;
      return s;
    } catch (e) { return null; }
  }
  function schedKeep(c, key, s, progs) {
    if (!key || !s || !s.order || !s.starts) return;
    try {
      var idx = {}; progs.forEach(function (p, i) { var k = p.url || p.id; if (!(k in idx)) idx[k] = i; });
      var o = [], d = [];
      for (var i = 0; i < s.order.length; i++) {
        var p = s.order[i], j = idx[p.url || p.id], q = progs[j];
        if (j === undefined || q.id !== p.id || q.title !== p.title) return;       // not a plain copy of a listed programme: not kept
        o.push(j); d.push(q.dur === p.dur ? 0 : p.dur);
      }
      var rec = { v: 1, o: o, d: d, s: s.starts, t: s.total };
      if (s.cycle) rec.c = s.cycle; if (s.base !== undefined) rec.b = s.base; if (s.unit) rec.u = s.unit; if (s.n) rec.n = s.n;
      kv.setItem(key, JSON.stringify(rec));
      Object.keys(kvNative()).forEach(function (kn) { if (kn !== key && kn.indexOf('sched1:' + c.id + ':') === 0) kv.removeItem(kn); });
    } catch (e) { /* too big to keep: laid out again next start */ }
  }

  var schedStat = { hit: 0, miss: 0 };
  // Busy frames while the app starts (Chrome's long-animation-frame timing): how long the page was too busy to draw, how much of that was
  // scripts and how much was drawing, and which script positions in this file took the most, so the slow part of a start can be named.
  var loaf = { n: 0, dur: 0, scr: 0, rend: 0, top: {} };
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) {
        loaf.n++; loaf.dur += e.duration;
        if (e.renderStart) loaf.rend += Math.max(0, e.startTime + e.duration - e.renderStart);
        (e.scripts || []).forEach(function (sc) {
          loaf.scr += sc.duration;
          var k = (sc.invoker || '?') + ' ' + (sc.sourceFunctionName || '') + '@' + String(sc.sourceURL || '').split('/').pop() + ':' + (sc.sourceCharPosition || 0);
          loaf.top[k] = (loaf.top[k] || 0) + sc.duration;
        });
      });
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch (e) { loaf = null; }
  function getStatLog(tag) {
    var rows = Object.keys(getStat).map(function (k) { var g = getStat[k]; return { k: k, t: g.read + g.parse, g: g }; }).sort(function (x, y) { return y.t - x.t; }).slice(0, 7);
    dlog('START: saved data read ' + tag + ': ' + rows.map(function (r) { return r.k + ' x' + r.g.n + ' ' + Math.round(r.g.kb) + ' KB, read ' + Math.round(r.g.read) + ' ms, parse ' + Math.round(r.g.parse) + ' ms'; }).join(' | '));
  }
  function loafLog(tag) {
    if (!loaf) { dlog('START: busy-frame timing is not available in this WebView'); return; }
    var top = Object.keys(loaf.top).sort(function (a, b) { return loaf.top[b] - loaf.top[a]; }).slice(0, 6).map(function (k) { return k + ' ' + Math.round(loaf.top[k]) + 'ms'; });
    dlog('START: busy frames ' + tag + ': ' + loaf.n + ' frames, ' + Math.round(loaf.dur) + ' ms busy, scripts ' + Math.round(loaf.scr) + ' ms, drawing ' + Math.round(loaf.rend) + ' ms; biggest: ' + top.join(' | '));
  }
  function startLoading() {
    spSeen = {}; spRecent = [];                                     // each load starts with every picture unseen
    forgetOldChannels();
    channels.forEach(function (c) { c.status = 'loading'; c.sched = null; });
    var finished = 0, sliceAt = Date.now(), tm = { prep: 0, sched: 0, real: 0, names: 0 }, tmAt = performance.now();      // where a start spends its time, in ms added up over the channels
    // the native side now serves a few requests at a time, so ask in the order they are wanted: the channel that was
    // on last, then down the guide. The first rows fill in first instead of whichever channel happened to answer.
    var last = store.get('last');
    var order = channels.slice().sort(function (a, b) {
      return (a.id === last ? -1 : b.id === last ? 1 : 0) || a.n - b.n;
    });
    order.forEach(function (c) {
      loadPrograms(c).then(function (progs) {
        var tl = performance.now() - tmAt; tm.listN = (tm.listN || 0) + 1; tm.listFirst = Math.min(tm.listFirst === undefined ? tl : tm.listFirst, tl); tm.listLast = Math.max(tm.listLast || 0, tl);
        return Promise.all([loadEpdb(), loadUk()]).then(function () { var td = performance.now() - tmAt; tm.dataFirst = Math.min(tm.dataFirst === undefined ? td : tm.dataFirst, td); tm.dataLast = Math.max(tm.dataLast || 0, td); return progs; });   // Magic EPG and Content: their data is in before the first guide is built
      }).then(function (progs) {
        // Building a channel's running order is the slow part of a start (seconds each on the box with Magic EPG), and
        // every channel's list was ready at once, so all of them ran back to back in one go: the screen could not move,
        // the TUNING count stayed at 0 and a button press waited. One turn of the event loop between channels fixes that.
        if (Date.now() - sliceAt < 40) return progs;       // quick ones run together; only a long stretch of work gives way
        return new Promise(function (r) { setTimeout(function () { sliceAt = Date.now(); r(progs); }, 0); });
      }).then(function (progs) {
        if (progs && progs.length) {
          var t1 = performance.now();
          progs = dropSlow(dedupeProgs(virtualFilms(c, virtualFill(c, ukFilter(codeByNumber(progs))))));
          progs.forEach(function (p) { if (durMem[p.id]) p.dur = durMem[p.id]; });   // real running time, once seen
          progs = withBreaks(c, progs);
          try {                                                  // what the timetable is given, for the EPG debug
            var pi = { n: progs.length, virt: 0, cls: { bite: 0, half: 0, hour: 0, long: 0, film: 0 }, shows: {} };
            progs.forEach(function (p) {
              var d = p.dur || 0; pi.cls[d <= 1080 ? 'bite' : d <= 2400 ? 'half' : d <= 4200 ? 'hour' : d <= 6000 ? 'long' : 'film']++;
              if (p.virtual) pi.virt++;
              var sk = String(p.show || p.group || p.title || '').toLowerCase(), g = pi.shows[sk] = pi.shows[sk] || { n: p.show || p.group || p.title, a: 0, v: 0 };
              g.a++; if (p.virtual) g.v++;
            });
            c.poolInfo = pi;
          } catch (e) { c.poolInfo = null; }
          var t2 = performance.now(); tm.prep += t2 - t1;
          var seed = c.id + (epgGen ? ':' + epgGen : '');
          // a channel with a daypart plan is laid out against the clock; the rest are one shuffled loop
          var spanH = SPANS[spanIdx].h;
          var sk = schedKey(c, progs, seed, spanH);
          c.sched = schedRead(sk, progs);
          if (c.sched) schedStat.hit++;
          else {
            schedStat.miss++;
            c.sched = (window.DAYPARTS && DAYPARTS.has(c.id, realOn) && DAYPARTS.schedule(c.id, progs, seed, spanH / 24, { real: realOn })) ||
                      E.buildSchedule(E.selectSpan(progs, spanH * 3600, seed), seed);
            schedKeep(c, sk, c.sched, progs);
          }
          var t3 = performance.now(); tm.sched += t3 - t2;
          // Real world plays a series in order; a Christmas channel's specials are one-offs, so they keep their shuffle
          if (!(window.ADS && ADS.isXmasChannel(c.id))) realWorld(c.sched, progs, seed);
          var t4 = performance.now(); tm.real += t4 - t3;
          c.status = 'ready';
          if (!isAdChan(c)) enrichLater(c, progs);
          tm.names += performance.now() - t4;
        } else {
          c.status = 'empty';
        }
      }, function () { c.status = 'empty'; }).then(function () {
        finished++;
        if (finished === channels.length) setTimeout(function () { loafLog('so far'); }, 0);
        if (finished === channels.length) setTimeout(function () { getStatLog('up to the guide opening'); }, 0);
        if (finished === channels.length) setTimeout(function () { dlog('START: episode names checked: ' + nameStat.n + ' shows, ' + Math.round(nameStat.read) + ' ms reading, ' + Math.round(nameStat.loop) + ' ms comparing (so far)'); }, 60000);
        if (finished === channels.length) dlog('START: wall clock (ms after the loading began at ' + Math.round(tmAt) + '): channel lists in from ' + Math.round(tm.listFirst) + ' to ' + Math.round(tm.listLast) + ', Magic EPG and Content data in from ' + Math.round(tm.dataFirst) + ' to ' + Math.round(tm.dataLast));
        if (finished === channels.length) dlog('START: time spent (ms, added up over the channels): prepare lists ' + Math.round(tm.prep) + ', schedules ' + Math.round(tm.sched) + ', real-world order ' + Math.round(tm.real) + ', names ' + Math.round(tm.names) + ', of ' + Math.round(performance.now() - tmAt) + ' in all'); if (finished === channels.length) dlog('START: schedules ' + schedStat.hit + ' read from storage, ' + schedStat.miss + ' laid out'); if (finished === channels.length) dlog('START: all ' + channels.length + ' channels done after ' + Math.round(performance.now() / 100) / 10 + ' s: ' + listStats.saved + ' lists read from storage, ' + listStats.none + ' built (no saved list), ' + listStats.old + ' built (saved list too old), ' + Math.round(listStats.ms / 100) / 10 + ' s spent building' + (listStats.names.length ? ' (' + listStats.names.join(', ') + ')' : ''));
        renderStatus();
        odChannelLanded(finished === channels.length);
        if (finished === channels.length) setTimeout(seedLinks, 4000);
        if (finished === channels.length) { if (expOn && startOdOn) veWaiting = true; else setTimeout(veFill, 30000); }       // On Demand is home: the guide's episode look-ups wait until the guide is opened
        if (finished === channels.length) setTimeout(artScanStart, 60000);
        if (finished === channels.length) setTimeout(odWarm, 4000);
        if (finished === channels.length) setTimeout(ytWarm, 20000);
        if (finished === channels.length && libCatchUp) setTimeout(function () { var f = libCatchUp; libCatchUp = null; f(); }, 45000);   // a new library: sorted once the guide is up, ready for the next start
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
