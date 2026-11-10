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

  // Artwork answers remembered by older versions include blank ones from failed requests, kept for a month.
  // They are thrown away once so those shows get looked up again.
  try {
    var gone = [];
    for (var ki = 0; ki < localStorage.length; ki++) {
      var kk = localStorage.key(ki);
      if (kk && (kk.indexOf('art1:') === 0 || kk.indexOf('info2:') === 0)) gone.push(kk);
    }
    gone.forEach(function (k2) { localStorage.removeItem(k2); });
  } catch (e) { /* storage blocked */ }
  // Programmes marked "slow to start" by versions whose buffer could not join a long programme part-way through:
  // the fault was the buffer's, not theirs, so they get a clean slate once.
  try { if (!localStorage.getItem('slowfix1')) { localStorage.removeItem('slow1'); localStorage.setItem('slowfix1', '1'); } } catch (e) { /* storage blocked */ }

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
  function logText() {
    var head = ['Telly Addicts debug log', 'Version: ' + ((window.RELEASE && RELEASE.name) || 'unnumbered'),
      'Device: ' + (window.NativeHttp && NativeHttp.device ? NativeHttp.device() : 'not the TV app'),
      'Browser: ' + navigator.userAgent, 'Written: ' + new Date().toString(), ''];
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
      if (!/\/data\/(art|routes)\.json$/.test(p.url || '') && ++httpFails <= 40) dlog('REQUEST FAILED ' + (status || 'no answer') + '  ' + p.url);
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

  // The scraper also sends its whole library (data/library.json): every show and episode with the best copy, and
  // TVmaze's titles and air dates. When it's there the TV decides the channels itself (libroute.js), with the genre
  // lists in tools/shows.json, so a list change needs neither a new APK nor a new scrape. Each channel's revision is
  // a hash of its own routed rows, so still only the channels that changed are rebuilt. Anything missing falls back
  // to the per-channel files, then the copy in the app.
  var SHOWS_URL = 'https://raw.githubusercontent.com/lefty420/tellyaddicts/main/tools/shows.json';
  var libP = null, libRevs = null;

  /** Shows the scraper has listed that tools/shows.json has not caught up with yet (data/routes.json). Merged in
   *  so a newly scraped show reaches its channel straight away; shows.json wins wherever both name a show. */
  function mergeRoutes(shows, routes) {
    var chans = routes && routes.channels;
    if (!shows || !chans) return shows;
    var known = {};
    Object.keys(shows).forEach(function (ch) {
      ((shows[ch] || {}).shows || []).forEach(function (n) { known[LIBROUTE.norm(n)] = 1; });
    });
    var out = {}, added = 0;
    Object.keys(shows).forEach(function (ch) { out[ch] = shows[ch]; });
    Object.keys(chans).forEach(function (ch) {
      var extra = ((chans[ch] || {}).shows || []).filter(function (n) { return !known[LIBROUTE.norm(n)]; });
      if (!extra.length) return;
      var had = out[ch] || { name: (chans[ch] || {}).name || ch, shows: [] };
      var merged = {};
      Object.keys(had).forEach(function (k) { merged[k] = had[k]; });
      merged.shows = (had.shows || []).concat(extra);
      out[ch] = merged;
      added += extra.length;
    });
    return added ? out : shows;
  }

  /** {channel: rows} from the whole library; null if it or shows.json can't be had. */
  function loadLibraryRoutes(libRev, showsText) {
    if (libP) return libP;
    var showsP = showsText ? Promise.resolve(JSON.parse(showsText)) : getJSON(SHOWS_URL);
    // routes.json is optional: when it is not published the lists in shows.json are used on their own
    var routesP = getJSON(DATA_BASE + 'routes.json').then(null, function () { return null; });
    libP = Promise.all([getJSON(DATA_BASE + 'library.json'), showsP, routesP]).then(function (r) {
      var lib = r[0], shows = r[1];
      if (!lib || !lib.shows || !shows || !window.LIBROUTE || (libRev && lib.rev && lib.rev !== libRev)) return null;
      return LIBROUTE.route(lib, mergeRoutes(shows, r[2]));
    }).catch(function () { return null; });
    return libP;
  }

  /** {channel: revision} for the published lists; {} when there are none or the fetch fails. */
  function loadDataIndex() {
    if (indexP) return indexP;
    indexP = getJSON(DATA_BASE + 'index.json').then(function (j) {
      artRev = (j && j.art) || '';
      var chans = (j && j.channels) || {};
      if (!j || !j.library || !window.LIBROUTE) return chans;
      // Which channels changed only shows once the library is routed, so remember the answer per library and
      // shows.json revision: an unchanged library costs one small download, not the whole file.
      return http(SHOWS_URL).then(function (showsText) {
        // the routes revision is part of the key: a new routes.json moves shows between channels just as
        // an edit to shows.json does, so the answer stored for the old one must not be reused
        var key = 'librevs:' + j.library + ':' + (j.routes || '-') + ':' + E.hash(showsText);
        var known = store.get(key);
        if (known && known.revs) { libRevs = known.revs; return known.revs; }
        return loadLibraryRoutes(j.library, showsText).then(function (routed) {
          if (!routed) return chans;
          var revs = {};
          Object.keys(routed).forEach(function (ch) { revs[ch] = 'L' + E.hash(JSON.stringify(routed[ch])).toString(36); });
          try {                                 // forget answers for older libraries
            for (var k = localStorage.length - 1; k >= 0; k--) {
              var kn = localStorage.key(k);
              if (kn && kn !== key && kn.indexOf('librevs:') === 0) localStorage.removeItem(kn);
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
    if (libRevs && rev && rev === libRevs[id]) {
      return loadLibraryRoutes().then(function (routed) {
        if (routed && routed[id] && routed[id].length) return routed[id];
        return loadChannelFile(id, true);
      });
    }
    return loadChannelFile(id, rev);
  }

  function loadChannelFile(id, rev) {
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
  var NO_EPISODES = { xmasmusic: 1, kidsmovies: 1, videoshop: 1, mtv: 1, disney: 1, tvarchive: 1, soaps: 1, saturday: 0 };
  /** A row of songs or films: nothing in it will carry SxxExx, so insisting on one empties the channel. */
  function wantsEpisodes(channelId, it) {
    if (NO_EPISODES[channelId]) return false;
    var m = it.m;
    if (m) for (var k in m) if (m.hasOwnProperty(k) && (m[k].song || m[k].film)) return false;
    return true;
  }
  function progsFromData(items, channelId) {
    var out = [];
    items.forEach(function (it) {
      var shows = {}, files = (it.f || []).map(function (f) {
        var name = typeof f === 'string' ? f : f[0];
        shows[name] = typeof f === 'string' ? (it.s || '') : f[1];
        return { name: name, size: '90000000' };                  // size/length are not in the scrape; real length is learned on first play
      });
      // the same naming rules as live results (episode codes, tidy titles, .ia.mp4 duplicates)
      E.pickPrograms(it.id, { metadata: { title: it.t }, files: files },
                     { requireEp: wantsEpisodes(channelId, it), skipFile: AUTO && AUTO.NOT_EPISODE }).forEach(function (p) {
        var nm = p.id.slice(it.id.length + 1), show = shows[nm] || '';
        p.group = show;
        p.show = show;        // used for the artwork and Info lookups, which beat guessing from the file name
        p.dur = AUTO_DUR[show] || 2700;
        // From the whole library: TVmaze's episode title, the air date and the real running time
        var d = it.m && it.m[nm];
        if (d) {
          var t = window.LIBROUTE && LIBROUTE.titleFor(show, d);
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
    '\\bemanuelle\\b', '\\bemmanuelle\\b'
  ].join('|'), 'i');
  // Single words that mean one thing in a film's title and quite another in a programme's: "Porn Yesterday" is a
  // Steptoe and Son episode from 1974, and this list was throwing it away.
  var BLOCKED_FILM = /\bporn\b|\bporno\b|\berotica?\b|\badults?\b|\bplayboy\b|\bpenthouse\b/i;
  /** Keep adult material off every channel, whichever list it came in on. */
  function blocked(p) {
    if (!p) return false;
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
                 mins: +d.rt || 0, released: d.a || '', tmdb: d.tm || '', cert: d.cert || '' };
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
    var era = keep.filter(inEra);
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
    var now = new Date(), today = pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());
    var dated = 0, keep = progs.filter(function (p) {
      var md = (p.aired && /^\d{4}-(\d{2}-\d{2})$/.exec(p.aired) || [])[1] ||
               monthDay(p.sub) || monthDay(p.title) || monthDay(p.id);
      if (!md) return true;                                   // no date on it: the clips and odds and ends
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

  /** Turn a published (or bundled) channel list into this channel's programmes, and store the result. */
  function buildFromData(ch, noAuto, rev, dkey) {
    return loadChannelData(ch.id, rev).then(function (rows) {
      if (!rows || !rows.length) { ch.autoUsed = true; ch.report = ['nothing in the library for this channel']; ch.plan = []; return []; }
      var progs = dedupeTitles(capShows(progsFromData(rows, ch.id).filter(function (p) { return genreFits(ch, p) && !blocked(p); }), 0.25));
      // hand-listed clips belong to the channel whichever way its programmes were gathered (TV Archive's BBC
      // Archive clips), and they need no lookups, so bring them in here too
      Array.prototype.push.apply(progs, namedFiles(ch));
      progs = datedToday(ch, certified(ch, progs));
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
              if (rows && rows.length) Array.prototype.push.apply(direct, progsFromData(rows, s.data));
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
    var m = /^(.*?)\s+S(\d{1,2})[ED](\d{1,3})\b/.exec(t);
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
          for (var k = localStorage.length - 1; k >= 0; k--) {
            var kn = localStorage.key(k);
            if (kn && kn !== key && kn.indexOf('artdb1:') === 0) localStorage.removeItem(kn);
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
      genres: a.g || '', rating: +a.r || 0, summary: a.s || '', poster: https(a.p), background: https(a.b)
    };
  }

  /**
   * The artwork already on hand for a programme, found without any request, so it can be on screen the instant a
   * channel is chosen: a film's poster, the scraper's art.json, or what was looked up the last time this show was on.
   * null when there is none yet (the show is looked up in the background, so next time there is).
   */
  function knownArt(prog) {
    if (!gartOn || !prog || prog.ad) return null;
    var film = filmFor(prog);
    if (film) return film.poster ? { poster: film.poster, back: '' } : null;
    var p = parseTitle(prog.title || '');
    if (prog.show) p.show = prog.show;
    if (!p.show) return null;
    if (!artP) loadArt();
    var out = { poster: '', back: '' };
    var a = artIdx && (function () {
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
    if (c && c.d && c.d.ep && Date.now() - c.t < TVM_DAY) return Promise.resolve(Object.assign({}, d, { ep: c.d.ep }));
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
    if (c && Date.now() - c.t < (c.d ? TVM_DAY : TVM_MISS)) return Promise.resolve(c.d);
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
      var age = d && d.picsFailed ? TVM_DAY - 3600 * 1000 : 0;
      if (d) delete d.picsFailed;
      store.set(key, { t: Date.now() - age, d: d || null });
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
      var age = d.failed ? TVM_DAY - 3600 * 1000 : d.miss ? TVM_DAY - TVM_MISS : 0;
      store.set(key, { t: Date.now() - age, d: { background: d.background } });
      return d;
    });
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

  function openInfo() {
    if (!cur) return;
    reportProgramme('Info opened');
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
    var film = filmFor(cur.prog);
    if (film) { showFilmInfo(film); return; }                 // a film: TMDb already told us everything
    var p = parseTitle(title);
    if (cur.prog && cur.prog.show) p.show = cur.prog.show;
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

  /** A film's Info screen, straight from the details the scraper gathered: no lookup, so it is up at once. */
  function showFilmInfo(f) {
    $('ishow').textContent = f.title || (cur.prog.title || '');
    var bits = [];
    if (f.released) bits.push(String(f.released).slice(0, 4));
    if (f.cert) bits.push(f.cert);
    if (f.genres) bits.push(f.genres);
    if (f.mins) bits.push(f.mins + ' min');
    bits.push(cur.ch.name);
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
      noiseGain.gain.value = 0.08;
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
    var meOne = cur;
    setTimeout(function () {
      if (cur === meOne && v.readyState < 1 && !meOne.ad) {       // never even got the file header: move on
        dlog('GAVE UP after 30s: nothing arrived at all (' + playState() + ')');
        diagnose(prog.url); markSlow(prog.id); nextInChannel();
      }
    }, 30000);
    setTimeout(function () {
      // header arrived but it still can't play 25 s in (slow index/seek on a mid-programme join): move on, and remember it
      if (cur === meOne && !meOne.ad && v.readyState < 3) {
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
  /** The adverts this channel can play: the hand-picked ones for it, plus whatever the search found. */
  function adPool(ch) {
    var key = adKey(ch);
    if (!key) return [];
    var fixed = (window.ADS && ADS.fixedFor) ? ADS.fixedFor(ch.id, adEra) : [];
    return fixed.concat(adPools[key] || []);
  }

  function playAd(ch, index, left) {
    var key = adKey(ch), pool = adPool(ch);
    if (!pool.length) return nextInChannel();
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
    if (cur && cur.od) return odStep(1);
    if (cur && cur.ad && cur.adLeft > 0) return playAd(cur.ch, cur.index, cur.adLeft);
    var key = cur && !cur.ad && adKey(cur.ch);
    if (key && adPool(cur.ch).length) {              // hand-picked adverts count too, not only what the search found
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
  var OB = ['guide', 'rew', 'pp', 'ff', 'next', 'restart', 'info', 'options'];   // buttons on the bar, left to right
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
  var relRow = 'rel';
  function openRel(which) {
    closeOpts();
    relRow = which === 'about' || which === 'log' ? which : 'rel';
    if (relRow === 'about') buildAbout(); else if (relRow === 'log') buildLog(); else buildRel();
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
  var OPTS = ['od', 'ar', 'fx', 'gart', 'ads', 'buf', 'auto', 'keep', 'refresh', 'rel', 'about', 'log'];
  var optsOpen = false, optsSel = 0, optsTimer = null;
  function optValue(id) {
    if (id === 'ar') return AR[arIdx].label;
    if (id === 'fx') return FXLABEL[fxMode];
    if (id === 'gart') return gartOn ? 'On' : 'Off';
    if (id === 'ads') return ADS.ERAS[ADS.eraIndex(adEra)].label + (adEra !== 'off' && cur && !ADS.categoryFor(cur.ch.id) ? '  (none on this channel)' : '');
    if (id === 'buf') return BUF[bufIdx].label + (BUF[bufIdx].mb && !bufferAvailable() ? '  (needs a newer app)' : '');
    if (id === 'keep') return KEEP[keepIdx].label;
    if (id === 'refresh') return refreshArmed ? 'Press OK again to confirm' : '';
    if (id === 'rel') return relName();
    if (id === 'about' || id === 'log' || id === 'od') return '';
    return autoEpg ? 'On' : 'Off';
  }

  /** Picking longer keeps the lists already stored; picking shorter lets them run out. Links are never thrown away. */
  function changeKeep(d) {
    keepIdx = (keepIdx + (d < 0 ? KEEP.length - 1 : 1)) % KEEP.length;
    store.set('keep1', KEEP[keepIdx].id);
    renderOpts();
    toast('Listings kept for ' + KEEP[keepIdx].label + ', then built again', 2600);
  }

  var ACTION = { od: 1, refresh: 1, rel: 1, log: 1, about: 1 };   // rows that do something on OK, so they show no left/right arrows
  // one line under the list saying what the highlighted row is for
  var OPT_HELP = {
    od: 'Browse every channel\u2019s shows, series and episodes, and play any of them from the start.',
    ar: 'Auto, 4:3, 16:9, Zoom or Stretch. Auto shows each programme in the ratio it was made in.',
    fx: 'A period look for the picture: VHS softness, vivid colour or extra sharpness.',
    gart: 'Posters and backdrops in the guide and on the bar. Off keeps things plain.',
    ads: 'Adverts between programmes, from the decade you choose. UK first, and never on the BBC.',
    buf: 'Loads the programme ahead of the picture on this device, to ride out slow spells.',
    auto: 'Builds every channel from the scraper\u2019s whole library instead of the hand-picked lists.',
    keep: 'How long a channel\u2019s line-up stays as it is before it is built afresh.',
    refresh: 'Throws away every line-up and builds them all again in a new running order.',
    rel: 'What changed in this version and the ones before it.',
    about: 'Where the programmes, artwork and details come from.',
    log: 'What failed to play and why, ready to send when something goes wrong.'
  };
  function renderOpts() {
    OPTS.forEach(function (id, i) {
      $('ov-' + id).textContent = optValue(id);
      $('or-' + id).className = 'orow' + (ACTION[id] ? ' act' : '') + (i === optsSel ? ' sel' : '');
    });
    $('ohelp').textContent = OPT_HELP[OPTS[optsSel]] || '';
    $('over').textContent = relName();
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
      for (var k = localStorage.length - 1; k >= 0; k--) {
        var kn = localStorage.key(k);
        if (kn && /^plan7[ad]?:/.test(kn)) localStorage.removeItem(kn);
      }
    } catch (e) { /* ignore */ }
    toast('Building every channel afresh\u2026', 4000);
    renderOpts();
    setTimeout(function () { location.reload(); }, 1200);   // the start-up loading screen does the rebuild
  }

  function optsChange(d) {
    var id = OPTS[optsSel];
    if (id === 'od') odOpenUi();
    else if (id === 'ar') changeAr(d);
    else if (id === 'fx') changeFx(d);
    else if (id === 'gart') { gartOn = !gartOn; store.set('gart', gartOn ? 'on' : 'off'); gartFor = '\u0000'; artFor = ''; osdArt(); renderOpts(); }
    else if (id === 'ads') changeAds(d);
    else if (id === 'buf') changeBuf(d);
    else if (id === 'keep') changeKeep(d);
    else if (id === 'refresh') refreshEpg();
    else if (id === 'rel') openRel('rel');
    else if (id === 'log') openRel('log');
    else if (id === 'about') openRel('about');
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
    var dur = v.duration, pos = v.currentTime;
    $('obar').style.width = (isFinite(dur) && dur > 0 ? Math.min(100, pos / dur * 100) : 0) + '%';
    var ahead = loadedTo();
    var buf = $('obuf');
    buf.style.width = (isFinite(dur) && dur > 0 && ahead > 0 ? Math.min(100, ahead / dur * 100) : 0) + '%';
    buf.className = playingLocally() ? 'local' : '';
    var secs = ahead > pos ? Math.round(ahead - pos) : 0;
    $('otime').textContent = fmtPos(pos) + (isFinite(dur) && dur > 0 ? ' / ' + fmtPos(dur) : '') +
      (secs > 1 ? '   ·   ' + fmtPos(secs) + ' ahead' + (playingLocally() ? ' on this device' : '') : '');
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

    if (quitOpen) { quitKey(k); e.preventDefault(); return; }
    if (!odOpen && (k === 'GoBack' || k === 'Escape' || k === 'Backspace')) {
      var nowT = Date.now();
      if (!e.repeat && nowT - lastBack < DOUBLE_BACK_MS) { lastBack = 0; openQuit(); e.preventDefault(); return; }
      if (!e.repeat) lastBack = nowT;
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
    if (k === 'Menu' || k === 'ContextMenu') { odOpenUi(); e.preventDefault(); return; }

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
      else if (k === 'Enter' || k === ' ') watchFromGuide();
      else if (k === 'Blue') odOpenUi();
      // in the guide: Back goes back to what is playing; with nothing playing, Back twice leaves the app
      else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { if (cur) closeGuide(); else pressBackToExit(); }
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
    else if (k === 'Blue') { odOpenUi(); }
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


  // ------------------------------------------------------------------ On Demand
  // Browse by channel, then show, then series and episode, and play any of it from the start. Not clock-synced:
  // it plays like a recording, with the usual bar to pause and skip, and carries on to the next episode.
  var odOpen = false, odFrom = '', odCol = 0, odCi = 0, odSi = 0, odEi = 0, odData = {}, odArtFor = '';
  var OD_ROWS = 8;
  var OD_SKIP = { xmasmusic: 1, kidsmovies: 1, videoshop: 1, tvarchive: 1 };   // songs, films and dated clips are not shows
  function odChannels() {
    return guideList().filter(function (c) { return c.status === 'ready' && !OD_SKIP[c.id]; });
  }
  function odPad(n) { return n < 10 ? '0' + n : String(n); }
  function odEpLabel(p, ref) {
    var m = /^(.*?)\s+S\d{1,2}[ED]\d{1,3}\b\s*(.*)$/i.exec(p.title || '');
    if (ref && m) return 'E' + odPad(ref.e) + (m[2] ? '   ' + m[2] : '');
    return p.title || '';
  }
  /** A channel's programmes grouped into shows, each with its series and episodes in order. */
  function odGroup(progs) {
    var by = {}, shows = [];
    progs.forEach(function (p) {
      var name = p.show || p.group || (parseTitle(p.title || '').show) || 'Other';
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
               (a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
      });
      var rows = [], last = null;
      g.eps.forEach(function (ep) {
        var head = ep.s ? 'Series ' + ep.s : (g.eps.some(function (x) { return x.s; }) ? 'Other episodes' : '');
        if (head !== last) { if (head) rows.push({ head: head }); last = head; }
        rows.push(ep);
      });
      g.rows = rows;
      g.first = rows.map(function (r) { return !!r.p; }).indexOf(true);
    });
    return shows;
  }
  function odLoadChannel(ch) {
    var rec = odData[ch.id];
    if (rec) return rec.p;
    rec = odData[ch.id] = { shows: null };
    rec.p = loadDataIndex().then(function (idx) { return loadChannelData(ch.id, idx[ch.id] || ''); }).then(function (rows) {
      var progs = rows && rows.length ? progsFromData(rows, ch.id).filter(function (p) { return !p.filmKey && genreFits(ch, p) && !blocked(p); }) : [];
      rec.shows = odGroup(certified({ report: [] }, progs));
      return rec;
    }, function () { rec.shows = []; return rec; });
    return rec.p;
  }
  /** A show's episode details (titles, summaries, stills) from the scraper's data/eps/<slug>.json, kept for a week. */
  var OD_WEEK = 7 * 24 * 3600 * 1000;
  function odSlug(name) { return LIBROUTE.norm(name).replace(/ /g, '-'); }
  function odMeta(g) {
    if (g.metaP) return g.metaP;
    var slug = odSlug(g.name), key = 'eps1:' + slug, c = store.get(key);
    var done = function (m) {
      g.meta = null;
      if (m && m.eps) { g.meta = {}; m.eps.forEach(function (e) { g.meta[e.s + 'x' + e.e] = e; }); g.seasons = m.seasons || {}; }
    };
    if (c && Date.now() - c.t < OD_WEEK) { done(c.m); return (g.metaP = Promise.resolve()); }
    g.metaP = getJSON(DATA_BASE + 'eps/' + encodeURIComponent(slug) + '.json').then(function (m) {
      store.set(key, { t: Date.now(), m: m && m.eps ? m : null });
      done(m);
    }, function () { store.set(key, { t: Date.now(), m: null }); done(null); });      // not published for this show: fine
    return g.metaP;
  }
  function odShows() { var c = odChannels()[odCi], r = c && odData[c.id]; return r && r.shows; }
  function odShow() { var l = odShows(); return l && l[odSi]; }

  function odRow(box, i, text, sub, cls) {
    var d = document.createElement('div');
    d.className = 'odr' + (cls ? ' ' + cls : '');
    var a = document.createElement('b'); a.textContent = text; d.appendChild(a);
    if (sub) { var b = document.createElement('span'); b.textContent = sub; d.appendChild(b); }
    box.appendChild(d);
  }
  function odPaint(boxId, rows, sel, active, note) {
    var box = $(boxId); box.textContent = '';
    if (!rows) { odRow(box, 0, 'Loading…', '', 'note'); return; }
    if (!rows.length) { odRow(box, 0, note || 'Nothing here yet', '', 'note'); return; }
    var top = Math.max(0, Math.min(sel - 4, rows.length - OD_ROWS));
    for (var i = top; i < Math.min(rows.length, top + OD_ROWS); i++) {
      var r = rows[i];
      odRow(box, i, r.text, r.sub, (r.head ? 'head' : '') + (i === sel ? (active ? ' sel' : ' dim') : ''));
    }
  }
  function odRender() {
    var chs = odChannels(), shows = odShows(), g = odShow();
    odPaint('odc', chs.map(function (c) { return { text: c.n + '   ' + c.name }; }), odCi, odCol === 0);
    odPaint('ods', shows && shows.map(function (x) { return { text: x.name, sub: String(x.eps.length) }; }), odSi, odCol === 1,
            'No shows on this channel yet');
    odPaint('ode', g ? g.rows.map(function (r) {
      if (r.head) return { text: r.head, head: 1 };
      var m = g.meta && g.meta[r.s + 'x' + r.e], label = r.label;
      if (m && m.t && /^E\d+$/.test(label)) label += '   ' + m.t;                 // the library has no title: use the scraper's
      return { text: label, sub: r.year || (m && m.a ? String(m.a).slice(0, 4) : '') };
    }) : (shows ? [] : null), odEi, odCol === 2);
    odDetail(g);
    $('odhead').textContent = g ? g.name : (chs[odCi] ? chs[odCi].name : '');
    var art = $('odart'), k = g ? knownArt({ title: g.name, show: g.name }) : null;
    if (k && (k.poster || k.back)) { art.src = k.poster || k.back; art.className = ''; } else art.className = 'hidden';
    if (g && gartOn && !k && odArtFor !== g.name) {                     // not known yet: look it up, then repaint
      odArtFor = g.name;
      var p = parseTitle(g.name + ' S01E01'); p.show = g.name;
      tvmInfo(p).then(function () { if (odOpen && odShow() === g) odRender(); }, function () { /* no artwork */ });
    }
  }
  /** Under the episode list: the highlighted episode's still and summary, or else the show's own. */
  function odDetail(g) {
    var row = g && g.rows[odEi], m = row && row.p && g.meta && g.meta[row.s + 'x' + row.e];
    var img = $('oddimg'), t = '', body = '';
    if (g && !g.metaP) odMeta(g).then(function () { if (odOpen && odShow() === g) odRender(); });
    if (g && g.art === undefined) { g.art = null; artShow(g.name).then(function (a) { g.art = a || null; if (odOpen && odShow() === g) odRender(); }); }
    var pic = (m && m.img) || '';
    if (m) {
      t = [row.s ? 'Series ' + row.s + ', episode ' + row.e : '', m.t || '', m.a ? String(m.a).slice(0, 4) : '', m.l ? m.l + ' min' : ''].filter(Boolean).join('  \u00b7  ');
      body = m.d || '';
    } else if (g && g.art) {
      t = [g.art.n || '', g.art.y ? g.art.y + (g.art.e && g.art.e !== g.art.y ? '\u2013' + g.art.e : '') : '', g.art.g || ''].filter(Boolean).join('  \u00b7  ');
      body = g.art.s || '';
    }
    $('oddt').textContent = t; $('oddb').textContent = body;
    if (pic) { img.src = pic; img.className = ''; } else img.className = 'hidden';
    $('oddet').className = t || body || pic ? '' : 'hidden';
  }
  function odOpenUi() {
    var chs = odChannels();
    if (!chs.length) { toast('On Demand is not ready yet', 2500); return; }
    odFrom = guideOpen ? 'guide' : (cur ? 'watch' : '');
    closeOsd(); closeOpts();
    if (guideOpen) closeGuide();
    odOpen = true; odCol = 0; odSi = 0; odEi = 0; odArtFor = '';
    odCi = Math.max(0, cur ? chs.indexOf(cur.ch) : 0);
    $('od').className = '';
    v.muted = true;
    odEnter();
  }
  function odClose(restore) {
    odOpen = false;
    $('od').className = 'hidden';
    v.muted = false;
    if (restore && odFrom === 'guide') openGuide();
  }
  /** Load the focused channel's shows, then show them. */
  function odEnter() {
    var c = odChannels()[odCi];
    odRender();
    if (!c) return;
    odLoadChannel(c).then(function () { if (odOpen && odChannels()[odCi] === c) { odSi = Math.min(odSi, Math.max(0, (odShows() || []).length - 1)); odRender(); } });
  }
  function odKey(k) {
    var chs = odChannels();
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      var d = k === 'ArrowUp' ? -1 : 1;
      if (odCol === 0) { odCi = (odCi + d + chs.length) % chs.length; odSi = 0; odEi = 0; odEnter(); return true; }
      if (odCol === 1) { var sh = odShows(); if (sh && sh.length) { odSi = (odSi + d + sh.length) % sh.length; var g = sh[odSi]; odEi = g.first < 0 ? 0 : g.first; } }
      else { var g2 = odShow(); if (g2) { var i = odEi; do { i += d; } while (i >= 0 && i < g2.rows.length && g2.rows[i].head); if (i >= 0 && i < g2.rows.length) odEi = i; } }
    } else if (k === 'ChannelUp' || k === 'ChannelDown') {
      var pg = k === 'ChannelUp' ? -OD_ROWS + 1 : OD_ROWS - 1;
      if (odCol === 1) { var l = odShows(); if (l && l.length) { odSi = Math.max(0, Math.min(l.length - 1, odSi + pg)); var g3 = l[odSi]; odEi = g3.first < 0 ? 0 : g3.first; } }
      else if (odCol === 2) { var g4 = odShow(); if (g4) { var j = Math.max(0, Math.min(g4.rows.length - 1, odEi + pg)); while (j < g4.rows.length - 1 && g4.rows[j].head) j++; odEi = j; } }
    } else if (k === 'ArrowRight' || k === 'Enter' || k === ' ') {
      if (odCol === 0) { if ((odShows() || []).length) { odCol = 1; var g5 = odShow(); odEi = g5 && g5.first >= 0 ? g5.first : 0; } }
      else if (odCol === 1) { var g6 = odShow(); if (g6) { odCol = 2; if (odEi < 0 || !g6.rows[odEi] || g6.rows[odEi].head) odEi = Math.max(0, g6.first); } }
      else if (k === 'Enter' || k === ' ') { odPlay(); return true; }
    } else if (k === 'ArrowLeft') { if (odCol > 0) odCol--; }
    else if (k === 'GoBack' || k === 'Escape' || k === 'Backspace') { if (odCol > 0) odCol--; else odClose(true); }
    else if (k === 'Guide' || k === 'Red') { odClose(false); openGuide(); return true; }
    odRender();
    return true;
  }
  function odPlay() {
    var c = odChannels()[odCi], g = odShow(), r = g && g.rows[odEi];
    if (!c || !r || !r.p) return;
    var list = g.rows.filter(function (x) { return x.p; });
    odClose(false);
    odStart(c, list, list.indexOf(r));
  }
  function odStart(c, list, i) {
    var info = { list: list, i: i };
    playSlot(c, 0, 0, true, true, list[i].p);
    if (cur) cur.od = info;
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
    if (n < 0 || n >= o.list.length) { v.pause(); toast('That was the last episode', 3000); odOpenUi(); return; }
    odStart(cur.ch, o.list, n);
  }

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
    greetRelease();            // and say once if this is a version they have not run before
  }

  /** Throw away stored lineups for channels that no longer exist, so a retired channel (On This Day, which
   *  became TV Archive) does not sit in storage for ever taking up room. */
  function forgetOldChannels() {
    var live = {};
    channels.forEach(function (c) { live[c.id] = 1; });
    try {
      for (var k = localStorage.length - 1; k >= 0; k--) {
        var kn = localStorage.key(k), m = /^plan7[ad]?:([^:]+):/.exec(kn || '');
        if (m && !live[m[1]]) localStorage.removeItem(kn);
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
          var seed = c.id + (epgGen ? ':' + epgGen : '');
          // a channel with a daypart plan is laid out against the clock; the rest are one shuffled loop
          c.sched = (window.DAYPARTS && DAYPARTS.has(c.id) && DAYPARTS.schedule(c.id, progs, seed)) ||
                    E.buildSchedule(progs, seed);
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
