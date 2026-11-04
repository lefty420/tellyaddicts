/* Pure scheduling / parsing logic. No DOM access, so it can be tested under Node. */
(function (root) {
  'use strict';

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DEFAULT_DURATION = 600; // seconds, used when archive.org gives no length

  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, seed) {
    var a = arr.slice();
    var r = rng(seed);
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  /** archive.org "length" is seconds as a string ("183.4") or sometimes "1:02:03". */
  function parseLength(v) {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return v > 0 ? v : null;
    v = String(v);
    if (v.indexOf(':') >= 0) {
      var parts = v.split(':').map(Number);
      for (var i = 0; i < parts.length; i++) if (isNaN(parts[i])) return null;
      var s = 0;
      for (var k = 0; k < parts.length; k++) s = s * 60 + parts[k];
      return s > 0 ? s : null;
    }
    var n = parseFloat(v);
    return n > 0 ? n : null;
  }

  function validMonth(m) { return m >= 1 && m <= 12; }

  /** Turns "Top of the Pops (1976 08 26) Song.mp4" into {title, sub:'26 Aug 1976'}. */
  function describe(name, fallback) {
    var base = String(name).replace(/^.*\//, '').replace(/\.(ia\.)?(mp4|m4v)$/i, '');
    var sub = '';
    var title = base;
    var m = base.match(/\((\d{4})[ .\-_](\d{1,2})[ .\-_](\d{1,2})\)/);
    if (m && validMonth(+m[2])) {
      sub = (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1];
      title = base.replace(m[0], ' - ');
    } else if ((m = base.match(/\((\d{4})[ .\-_](\d{1,2})\)/)) && validMonth(+m[2])) {
      sub = MONTHS[+m[2] - 1] + ' ' + m[1];
      title = base.replace(m[0], ' - ');
    } else if ((m = base.match(/\((\d{4})\)/))) {
      sub = m[1];
      title = base.replace(m[0], ' - ');
    }
    title = title.replace(/\s+/g, ' ').replace(/^[\s\-–:]+|[\s\-–:]+$/g, '').replace(/\s-\s-\s/g, ' - ');
    return { title: title || fallback || base, sub: sub };
  }

  function encodePath(name) {
    return name.split('/').map(encodeURIComponent).join('/');
  }

  /** "Born And Bred S01-S04 webdl xvid" -> "Born And Bred"; "Mr.Bean.Complete.Collection.H264" -> "Mr Bean". */
  function cleanShow(folder) {
    var s = String(folder);
    if (s.indexOf(' ') < 0) s = s.replace(/[._-]+/g, ' '); // slug-style names: "the-bill_s01" -> words
    s = s.replace(/\b(S\d+(-S?\d+)?|webdl|web-dl|xvid|x264|h\.?264|ac3|dd|aac|dvdrip|complete|collection|will1869)\b/ig, ' ');
    return s.replace(/\s+/g, ' ').trim() || String(folder);
  }

  /**
   * Picks the playable mp4 files out of an archive.org /metadata/<id> response.
   * opts.include: optional regex source; only file paths matching it are used.
   */
  function pickPrograms(id, meta, opts) {
    if (!meta || meta.is_dark) return [];
    var include = opts && opts.include ? new RegExp(opts.include, 'i') : null;
    var md = meta.metadata || {};
    if (String(md['access-restricted-item']).toLowerCase() === 'true') return [];
    var files = meta.files || [];
    var seen = {};
    var out = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var name = f.name || '';
      if (!/\.mp4$/i.test(name)) continue;
      if (/sample|trailer/i.test(name)) continue;
      if (include && !include.test(name)) continue;
      if (f.format && /thumbnail/i.test(f.format)) continue;
      var size = +f.size || 0;
      if (size && size < 200000) continue;
      var key = name.toLowerCase().replace(/\.ia\.mp4$|\.mp4$/, '');
      if (seen[key]) continue;
      seen[key] = true;
      var d = describe(name, md.title);
      var parts = name.split('/');
      if (parts.length > 1) {
        // Files inside show folders: put the show name in front of the episode name.
        // A folder called "Series 3" says nothing about the show, so use the item's own title then.
        var show = /^(series|season|s)\s*\d+/i.test(parts[0]) && md.title
          ? cleanShow(md.title) : cleanShow(parts[0]);
        if (d.title.toLowerCase().indexOf(show.toLowerCase()) !== 0) {
          d.title = show + ' - ' + d.title;
        }
      }
      out.push({
        id: id + '/' + name,
        item: id,
        url: 'https://archive.org/download/' + encodeURIComponent(id) + '/' + encodePath(name),
        title: d.title,
        sub: d.sub,
        dur: parseLength(f.length) || DEFAULT_DURATION
      });
    }
    if (out.length === 1 && md.title && name_isRoot(out[0])) {
      var only = describe(out[0].id.split('/').slice(1).join('/'));
      out[0].title = String(md.title);
      if (!out[0].sub) out[0].sub = only.sub;
    }
    return out;
  }

  function name_isRoot(prog) {
    return prog.id.split('/').length === 2; // "<item>/<file>" with no folders
  }

  /** Evenly thins a long list down to `max` entries, keeping a spread across all of it. */
  function sample(list, max) {
    if (list.length <= max) return list;
    var out = [];
    for (var i = 0; i < max; i++) out.push(list[Math.floor(i * list.length / max)]);
    return out;
  }

  /** Deterministic shuffled loop. Everyone running the app sees the same programme at the same time. */
  function buildSchedule(programs, seed) {
    var order = shuffle(programs, hash(String(seed)));
    var starts = [];
    var total = 0;
    for (var i = 0; i < order.length; i++) {
      starts.push(total);
      total += order[i].dur;
    }
    return { order: order, starts: starts, total: total };
  }

  /** What is on at time tMs (milliseconds since epoch). */
  function at(sched, tMs) {
    var n = sched.order.length;
    if (!n || !sched.total) return null;
    var pos = (tMs / 1000) % sched.total;
    var lo = 0, hi = n - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (sched.starts[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    var offset = pos - sched.starts[lo];
    var prog = sched.order[lo];
    return {
      index: lo,
      prog: prog,
      offsetSec: offset,
      startMs: tMs - offset * 1000,
      endMs: tMs + (prog.dur - offset) * 1000
    };
  }

  /** The next `count` programmes from time tMs, starting with whatever is on now. */
  function upcoming(sched, tMs, count) {
    var first = at(sched, tMs);
    if (!first) return [];
    var list = [first];
    var n = sched.order.length;
    var idx = first.index;
    var start = first.endMs;
    while (list.length < count) {
      idx = (idx + 1) % n;
      var prog = sched.order[idx];
      list.push({ index: idx, prog: prog, offsetSec: 0, startMs: start, endMs: start + prog.dur * 1000 });
      start += prog.dur * 1000;
    }
    return list;
  }

  var Engine = {
    hash: hash, shuffle: shuffle, parseLength: parseLength, describe: describe,
    pickPrograms: pickPrograms, buildSchedule: buildSchedule, at: at, upcoming: upcoming,
    cleanShow: cleanShow, sample: sample,
    DEFAULT_DURATION: DEFAULT_DURATION
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : this);
