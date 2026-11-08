/* Local link database (IndexedDB) + episode-number parsing for "Play Next".
 * Rows: { k: 'showkey:season:episode', show, s, e, url, title, id, item, dur, src: 'plan' | 'search', t }
 * IndexedDB is the SQLite-backed store built into the WebView, so nothing needs a native bridge; if it is unavailable the
 * same API works from memory for the session. */
(function (root) {
  'use strict';

  function norm(s) { return String(s || '').toLowerCase().replace(/&/g, 'and').replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ''); }
  function key(show, s, e) { return norm(show) + ':' + (+s) + ':' + (+e); }

  /** "Knightmare S01E03" -> {show:'Knightmare', s:1, e:3}; "Noel's House Party - Season 6 Episode 8" too; else null. */
  function parseEp(title) {
    var t = String(title || '').trim(), m = /^(.*?)\s+S(\d{1,2})[ED](\d{1,3})\b/i.exec(t), show, s, e;
    if (m) { show = m[1]; s = +m[2]; e = +m[3]; }
    else if ((m = /^(.*?)\s*(?:[-\u2013]\s*)?(?:Season|Series)\s+(\d{1,2})\s*(?:[-\u2013,:]\s*)?Episode\s+(\d{1,3})\b/i.exec(t))) { show = m[1]; s = +m[2]; e = +m[3]; }
    else return null;
    show = show.split(/\s+[-\u2013]\s+/).pop().replace(/\s*\(?\b(?:19|20)\d\d\b\)?\s*$/, '').replace(/[\s\-\u2013:]+$/, '').trim();
    return show ? { show: show, s: s, e: e } : null;
  }

  /** The episodes to try after S{s}E{e}: the next one, then episode 1 of the next season. */
  function nextRefs(ref) {
    return [{ show: ref.show, s: ref.s, e: ref.e + 1 }, { show: ref.show, s: ref.s + 1, e: 1 }];
  }

  var mem = {};
  var LS = 'links1';   // if IndexedDB is unavailable, rows found by searching are kept here so they still survive a restart
  try { var saved = JSON.parse(root.localStorage.getItem(LS) || '{}'); for (var sk in saved) mem[sk] = saved[sk]; } catch (err) { /* none */ }
  function persistMem() {
    try {
      var out = {}, n = 0;
      Object.keys(mem).forEach(function (k) { if (mem[k].src === 'search' && n < 800) { out[k] = mem[k]; n++; } });
      root.localStorage.setItem(LS, JSON.stringify(out));
    } catch (err) { /* storage full or blocked: memory only */ }
  }
  var dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      try {
        var r = root.indexedDB.open('tellyaddicts-links', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('links', { keyPath: 'k' }); };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { res(null); };
        r.onblocked = function () { res(null); };
      } catch (err) { res(null); }
    });
    return dbp;
  }

  function get(k) {
    return open().then(function (db) {
      if (!db) return mem[k] || null;
      return new Promise(function (res) {
        try {
          var q = db.transaction('links', 'readonly').objectStore('links').get(k);
          q.onsuccess = function () { res(q.result || mem[k] || null); };
          q.onerror = function () { res(mem[k] || null); };
        } catch (err) { res(mem[k] || null); }
      });
    });
  }

  /** Save rows. Existing rows are replaced, except that a 'search' row is never downgraded by a 'plan' row. */
  function putAll(rows) {
    rows.forEach(function (r) { if (!mem[r.k] || r.src === 'search' || mem[r.k].src !== 'search') mem[r.k] = r; });
    return open().then(function (db) {
      if (!db) persistMem();
      if (!db || !rows.length) return rows.length;
      return new Promise(function (res) {
        try {
          var tx = db.transaction('links', 'readwrite'), st = tx.objectStore('links');
          rows.forEach(function (r) {
            if (r.src === 'search') { st.put(r); return; }
            var q = st.get(r.k);
            q.onsuccess = function () { if (!q.result || q.result.src !== 'search') st.put(r); };
          });
          tx.oncomplete = function () { res(rows.length); };
          tx.onerror = tx.onabort = function () { res(0); };
        } catch (err) { res(0); }
      });
    });
  }

  /** Forget one episode: only for a link that has been shown not to play, so the next try searches for it again. */
  function drop(k) {
    delete mem[k];
    persistMem();
    return open().then(function (db) {
      if (!db) return false;
      return new Promise(function (res) {
        try {
          var tx = db.transaction('links', 'readwrite');
          tx.objectStore('links').delete(k);
          tx.oncomplete = function () { res(true); };
          tx.onerror = tx.onabort = function () { res(false); };
        } catch (err) { res(false); }
      });
    });
  }

  /** Turn programmes ({id,item,url,title,dur}) into rows; programmes whose title has no episode number are skipped. */
  function rowsFrom(progs, src) {
    var out = [], seen = {};
    (progs || []).forEach(function (p) {
      var ref = parseEp(p.title);
      if (!ref || !p.url) return;
      var k = key(ref.show, ref.s, ref.e);
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ k: k, show: ref.show, s: ref.s, e: ref.e, url: p.url, title: p.title, id: p.id, item: p.item, dur: p.dur, src: src, t: Date.now() });
    });
    return out;
  }

  var Links = { norm: norm, key: key, parseEp: parseEp, nextRefs: nextRefs, get: get, putAll: putAll, drop: drop, rowsFrom: rowsFrom, _mem: mem };
  if (typeof module !== 'undefined' && module.exports) module.exports = Links; else root.LINKS = Links;
})(typeof window !== 'undefined' ? window : this);
