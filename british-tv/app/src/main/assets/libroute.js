/* The scraper's whole library (british-tv/data/library.json), turned into channel lists on the TV.
 *
 * The Telly Addict Scraper sends every show and episode it has, with the best copy of each and, where it found
 * them, TVmaze's episode titles and air dates. This file decides which channel each show belongs on, using the
 * genre lists in tools/shows.json (fetched alongside, so changing a list needs no new APK and no new scrape).
 * The rows it makes are the same shape as the per-channel files in british-tv/data/, so the rest of the app
 * builds programmes from them exactly as before; each row also carries the library's episode details in "m".
 *
 * Routing is the same as tools/import_scrape.py: an exact show name first, then a listed show named inside a
 * longer title, and a show listed under two genres goes to both channels.
 *
 * Pure logic, no DOM, so it can be tested under Node. */
(function (root) {
  'use strict';

  var EXTRA = { 'noels house party': ['noel'] };        // a show that also has its own channel

  function norm(t) {
    t = String(t || '').toLowerCase().replace(/&/g, ' and ').replace(/'/g, '').replace(/’/g, '');
    return t.replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '');
  }

  // Words that may follow a one-word show name without making it a different programme ("Bread series 3",
  // "Lovejoy S01E01"). Anything else - "Rainbow Six", "Smart Guy" - is another title, and routing on it would
  // file an unrelated programme under that show. The same rule the scraper uses for its own matching.
  var NEXT_OK = {
    series: 1, season: 1, seasons: 1, episode: 1, episodes: 1, ep: 1, eps: 1, part: 1, parts: 1, pt: 1,
    special: 1, specials: 1, christmas: 1, xmas: 1, complete: 1, collection: 1, compilation: 1, uncut: 1,
    remastered: 1, upscaled: 1, dvd: 1, vhs: 1, rip: 1, pilot: 1, volume: 1, vol: 1, disc: 1, disk: 1,
    box: 1, set: 1, uk: 1, itv: 1, bbc: 1, citv: 1, cbbc: 1, mp4: 1, ia: 1, hq: 1, hd: 1, sd: 1, the: 1
  };
  /** For a one-word name found inside a longer title, is what follows it harmless? */
  function okAfter(padded, key) {
    if (key.indexOf(' ') >= 0) return true;              // several words: specific enough on its own
    var at = padded.indexOf(' ' + key + ' ');
    if (at < 0) return false;
    var rest = padded.slice(at + key.length + 2).trim();
    if (!rest) return true;
    var w = rest.split(' ')[0];
    return !w || !!NEXT_OK[w] || /^s\d{1,2}(e\d{1,3})?$/.test(w) || /^\d{1,2}x\d{1,3}$/.test(w) || /^\d{1,4}$/.test(w);
  }

  function uniqSorted(list) {
    var seen = {}, out = [];
    list.forEach(function (x) { if (!seen[x]) { seen[x] = true; out.push(x); } });
    return out.sort();
  }

  /** {normalised show name: [channel ids]} from tools/shows.json. */
  function showMap(showsJson) {
    var m = {};
    Object.keys(showsJson || {}).forEach(function (ch) {
      ((showsJson[ch] || {}).shows || []).forEach(function (name) {
        var k = norm(name);
        (m[k] = m[k] || []).push(ch);
      });
    });
    Object.keys(EXTRA).forEach(function (k) { m[k] = (m[k] || []).concat(EXTRA[k]); });
    return m;
  }

  function channelsFor(show, source, smap, keys) {
    var texts = [show, source];
    for (var i = 0; i < texts.length; i++) {
      if (!texts[i]) continue;
      var n = norm(texts[i]);
      if (smap[n]) return uniqSorted(smap[n]);
      var padded = ' ' + n + ' ', hit = [];
      for (var j = 0; j < keys.length; j++) {
        var k = keys[j];
        if (k.length > 4 && padded.indexOf(' ' + k + ' ') >= 0 && okAfter(padded, k)) hit = hit.concat(smap[k]);
      }
      if (hit.length) return uniqSorted(hit);
    }
    return [];
  }

  // Channels that belong to children, which the broadcaster channels leave alone: a cartoon that happened to be
  // on BBC1 belongs on CITV or Children's World, not among the evening's drama.
  var KIDS = { citv: 1, childrens: 1, disney: 1, kidsmovies: 1, kidsxmas: 1 };
  var NET = { bbc: 'bbc', itv: 'itv' };          // c4, c5 and sky have no channel of their own yet

  /** Classic British telly is 1970 to 1999. An episode with no air date is kept; a later one is not. */
  function inEra(ep) {
    var a = ep && ep.a;
    if (!a) return true;
    var y = parseInt(String(a).slice(0, 4), 10);
    return !(y > 1999);
  }

  /** library.json + shows.json -> {channel: rows}. A row is {id, t, f, s?, m}: one archive.org item, its file names
   *  (or [name, show] pairs when the item holds more than one show), and m = {file name: episode details}. */
  function route(lib, showsJson) {
    var smap = showMap(showsJson), keys = Object.keys(smap), per = {}, order = {};
    ((lib && lib.shows) || []).forEach(function (sh) {
      var net = NET[String(sh.net || '').toLowerCase()];
      (sh.e || []).forEach(function (ep) {
        if (!inEra(ep)) return;
        var genre = channelsFor(sh.n, ep.t, smap, keys);
        var forKids = genre.some(function (c) { return KIDS[c]; });
        var also = [];
        // the broadcaster's own channel, as well as wherever the genre lists put it
        if (net && !forKids) also.push(net);
        // and a Christmas episode goes to the Christmas channel of the right sort
        if (ep.xmas) also.push(forKids ? 'kidsxmas' : 'christmas');
        var chs = also.length ? uniqSorted(genre.concat(also)) : genre;
        chs.forEach(function (ch) {
          var items = per[ch] = per[ch] || {};
          order[ch] = order[ch] || [];
          var it = items[ep.id];
          if (!it) { it = items[ep.id] = { id: ep.id, t: ep.t || sh.n, f: [], m: {} }; order[ch].push(ep.id); }
          if (!it.f.some(function (f) { return f[0] === ep.f && f[1] === sh.n; })) it.f.push([ep.f, sh.n]);
          var d = { c: ep.c };
          if (ep.n) d.n = ep.n;
          if (ep.tvm) d.tvm = 1;
          if (ep.a) d.a = ep.a;
          if (ep.l) d.l = ep.l;
          if (sh.song) d.song = 1;
          if (ep.xmas) d.xmas = 1;
          if (sh.film) {
            // a film: its own title, no episode number to expect, and everything TMDb told the scraper about it.
            // The per-channel files carry no details at all, so if these are not passed through here the app
            // never sees a certificate and refuses to schedule the film.
            d.film = 1;
            if (ep.cert) d.cert = ep.cert;
            if (ep.ov) d.ov = ep.ov;
            if (ep.p) d.p = ep.p;
            if (ep.g) d.g = ep.g;
            if (ep.rt) d.rt = ep.rt;
            if (ep.tm) d.tm = ep.tm;
          }
          it.m[ep.f] = d;
        });
      });
    });
    var out = {};
    Object.keys(per).forEach(function (ch) {
      out[ch] = order[ch].map(function (id) {
        var it = per[ch][id], shows = uniqSorted(it.f.map(function (f) { return f[1]; }));
        if (shows.length === 1) { it.s = shows[0]; it.f = it.f.map(function (f) { return f[0]; }); }
        return it;
      });
    });
    return out;
  }

  /** The title to show for a programme when the library knows better than the file name: TVmaze's episode title
   *  ("The Bill S11E71 Kicking"), a song's "Artist - Song (Year)", or a film's "Ghostbusters (1984)".
   *  null = keep the engine's own tidy title. */
  function titleFor(show, d) {
    if (!d) return null;
    if (d.song || d.film) return d.n || null;
    if (!d.tvm || !d.n) return null;
    return (show ? show + ' ' : '') + (d.c && d.c !== 'Special' ? d.c + ' ' : '') + d.n;
  }

  var LibRoute = { norm: norm, showMap: showMap, channelsFor: channelsFor, okAfter: okAfter, route: route, titleFor: titleFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = LibRoute; else root.LIBROUTE = LibRoute;
})(typeof window !== 'undefined' ? window : this);
