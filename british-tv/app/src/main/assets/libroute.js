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
        if (k.length > 4 && padded.indexOf(' ' + k + ' ') >= 0) hit = hit.concat(smap[k]);
      }
      if (hit.length) return uniqSorted(hit);
    }
    return [];
  }

  /** library.json + shows.json -> {channel: rows}. A row is {id, t, f, s?, m}: one archive.org item, its file names
   *  (or [name, show] pairs when the item holds more than one show), and m = {file name: episode details}. */
  function route(lib, showsJson) {
    var smap = showMap(showsJson), keys = Object.keys(smap), per = {}, order = {};
    ((lib && lib.shows) || []).forEach(function (sh) {
      (sh.e || []).forEach(function (ep) {
        var chs = channelsFor(sh.n, ep.t, smap, keys);
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
   *  ("The Bill S11E71 Kicking"), or a song's "Artist - Song (Year)". null = keep the engine's own tidy title. */
  function titleFor(show, d) {
    if (!d) return null;
    if (d.song) return d.n || null;
    if (!d.tvm || !d.n) return null;
    return (show ? show + ' ' : '') + (d.c && d.c !== 'Special' ? d.c + ' ' : '') + d.n;
  }

  var LibRoute = { norm: norm, showMap: showMap, channelsFor: channelsFor, route: route, titleFor: titleFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = LibRoute; else root.LIBROUTE = LibRoute;
})(typeof window !== 'undefined' ? window : this);
