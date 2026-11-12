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

  /** Release-group noise in file names: "minder s04e04 tvrip divx" -> "minder s04e04". */
  var SURE_TAGS = 'blu-?ray|tvrip|dvdrip|divx|xvid|hdtv|pdtv|webrip|web-?dl|bdrip|brrip|x26[45]|h\\.?26[45]|hevc|ac3|480p|576p|720p|1080p|2160p';
  var SLUG_TAGS = 'dvd|web|aac|mp3|dd\\d?|proper|repack|retail|vhsrip|vhs|pal|ntsc|stereo|mono|rip';
  // picture-quality notes in names: "(1080p Upscale)", "[AI Upscaled]", "(HD Remaster)", "1080p HD upscale", "Restored 4K"
  var Q = '(?:\\d{3,4}p|[48]k|uhd|fhd|hd|sd|ai|upscal(?:e|ed|ing)|up-?scaled?|remaster(?:ed)?|restor(?:ed|ation)|enhanced|bluray|blu-?ray|web-?dl|webrip|dvdrip|x26[45]|h\\.?26[45]|hevc|aac|ac3|vhs|dvd|pal|ntsc|\\d+fps|colou?rised|deinterlaced)';
  var Q_GROUP = new RegExp('\\s*[(\\[]\\s*(?:' + Q + '\\b[\\s,._+&-]*)+[)\\]]', 'ig');
  var Q_WORDS = new RegExp('(?:^|[\\s_.-])(?:\\d{3,4}p|[48]k|uhd|(?:hd|ai)?[\\s-]*up-?scal(?:e|ed|ing)|(?:hd\\s+)?remaster(?:ed)?|(?:hd\\s+)?restored)(?=$|[\\s_.-])', 'ig');
  function stripQuality(t) {
    return String(t).replace(Q_GROUP, ' ').replace(Q_WORDS, ' ').replace(/(^|\s)hd(?=\s*$)/ig, ' ')
      .replace(/\s*[(\[]\s*[)\]]/g, ' ').replace(/\s+/g, ' ').replace(/[\s\-\u2013]+$/, '').trim();
  }

  /** "Show S3E04 ( )" -> "Show S3E04": brackets left empty once a tag inside them was removed. */
  function dropEmptyBrackets(t) {
    return String(t).replace(/\s*[(\[]\s*[-\u2013,._:\/]*\s*[)\]]/g, '').replace(/\s+/g, ' ').replace(/[\s\-\u2013]+$/, '').trim();
  }

  function stripRelease(t, slug) {
    var re = new RegExp('(?:^|[\\s\\[(])(?:' + SURE_TAGS + (slug ? '|' + SLUG_TAGS : '') + ')(?:-\\w+)?(?=$|[\\s\\])])', 'ig');
    return t.replace(re, ' ').replace(/\s+/g, ' ').trim();
  }

  /** "s04e04" / "S4 E4" -> "S04E04" */
  function tidyCodes(t) {
    t = t.replace(/\b(?:Epodise|Epsiode|Episdoe|Espisode|Epidose|Epiosde)\b/ig, 'Episode')   // upload typos
         .replace(/\s+(?=\S*\d)(?=\S*[a-f])[0-9a-f]{10,}$/i, '')                              // trailing hash "576e7ba17ef74"
         .replace(/\bS(\d{1,2})[,\s]+Ep(?:isode)?\.?\s*(\d{1,3})\b/ig, 'S$1E$2')        // "S1, Ep 09"
         .replace(/\b(?:Season|Series)\s*(\d{1,2})[,\s\-\u2013:]+Ep(?:isode)?\.?\s*(\d{1,3})\b/ig, 'S$1E$2')   // "Series 3 Ep 4", "Season 5 - Episode 01"
         .replace(/(^|\s)(\d{1,2})x(\d{2,3})\b/g, '$1S$2E$3')
         .replace(/\b(?:Season|Series)\s*\d{1,2}\s+(?=S\d{1,2}E\d{1,3}\b)/ig, '');   // "Show Season 3 S3E05" -> "Show S3E05"                               // "1x01"
    return t.replace(/\bs\s?(\d{1,2})\s?e\s?(\d{1,3})\b/ig, function (_, a, b) { return 'S' + a + 'E' + b; })
      .replace(/(\bS\d+E\d+)\s+Episode\s+\d+\b\s*/ig, '$1 ').replace(/\s+$/, '')                                 // "S01E05 Episode 5"
      .replace(/(\bS\d+E\d+)\s*[-\u2013:]\s*(?=\S)/g, '$1 ')
      .replace(/\s[-\u2013]\s(?=S\d+E\d+\b)/g, ' ');
  }

  function titleCase(t) {
    return t.replace(/(^|[\s\-(])([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); })
      ;
  }

  var KEEP_CAPS = /^(BBC|ITV|TV|UK|USA|US|CBBC|CITV|CBeebies|TVS|HTV|STV|ATV|ITN|DVD|VHS|HD|AI|TOTP|MTV|VCR|LWT|GMTV|TVAM|TV-AM|ITV4|ITV2|ITV3|BBC1|BBC2|BBC3|BBC4|II|III|IV|VI|VII|VIII|IX|XI|XII)$/;
  var SMALL = /^(of|the|and|in|at|on|to|a|an|for|with|by|or|vs)$/i;
  /** "NOEL'S HOUSE PARTY (BBC ONE - SERIES 3)" -> "Noel's House Party (BBC One - Series 3)". Only touches titles that are mostly shouting. */
  function calmCaps(t) {
    var letters = t.replace(/[^A-Za-z]/g, '');
    if (letters.length < 8) return t;
    var up = letters.replace(/[^A-Z]/g, '').length;
    if (up / letters.length < 0.8 || (t.match(/\b[A-Z]{3,}\b/g) || []).length < 2) return t;
    return t.replace(/[A-Za-z][A-Za-z'\u2019]*/g, function (w, off) {
      if (KEEP_CAPS.test(w) || /^S\d+E\d+$/i.test(w)) return w;
      var lw = w.toLowerCase();
      if (off > 0 && SMALL.test(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    });
  }

  /** Turns "Top of the Pops (1976 08 26) Song.mp4" into {title, sub:'26 Aug 1976'}. */
  function describe(name, fallback) {
    var base = String(name).replace(/^.*\//, '').replace(/\.(ia\.)?(mp4|m4v|mkv)$/i, '');
    base = base.replace(/[.\s_]*(\[[^\]\s]+\])+$/, '');       // trailing encoder tags: ".[SR-Enc][bombus]"
    base = base.replace(/^\d{1,3}(?:[.)]\s*|\s+-\s+)(?=[A-Za-z])/, '');   // "01.Are You Being Served" -> words
    base = base.replace(/^(?:BBC\s?DVD|ITV\s?DVD|2\s?Entertain)\s?\d+\s+/i, '');       // "BBCDVD1860 One Foot..."
    base = base.replace(/^(?=[0-9A-F]*\d)[0-9A-F]{8}\s+(?=[A-Za-z])/, '');             // "0001AC85 Cannon..."
    base = stripQuality(base);
    base = base.replace(/^View\s*Record[\s_\-]+/i, '');                                // uploader tag on game show files
    base = base.replace(/[\s_\-]*cut[\s_\-]*merged[\s_\-]*\d*/ig, '').replace(/[\s_\-]\d{10,13}$/, '');   // "-cut-merged-1775992021051"
    base = base.replace(/[\s_\-]*\bBoB\s*\(\d+\)/g, '').replace(/\s*\(\d{1,3}\)\s*$/, '');          // uploader tag "BoB(63)", trailing "(63)"
    base = base.replace(/^\d{1,3}-(?=[A-Za-z])/, '');                                    // "36-Rumpole of the Bailey"
    base = base.replace(/(\S)\s*\.{2,}\s*(?=\S)/g, '$1 - ');                              // "Dads Army...The Lovely Bunch"
    var tz = base.match(/(\d{4})[ \-_.](\d{2})[ \-_.](\d{2})T\d{4,6}Z?/);               // "2019 01 27T043000Z"
    var tzSub = '';
    if (tz && validMonth(+tz[2]) && +tz[3] >= 1 && +tz[3] <= 31) {
      tzSub = (+tz[3]) + ' ' + MONTHS[+tz[2] - 1] + ' ' + tz[1];
      base = base.replace(tz[0], ' ').replace(/\s+/g, ' ').trim();
    }
    var slug = base.indexOf(' ') < 0;                            // "minder.s04e04.tvrip.divx", "the-bill-s11e71"
    if (!slug) base = base.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();     // "Bread_S01E05_Episode 5"
    if (slug) {
      base = base.replace(/[._]+/g, ' ');                        // "Knightmare_-_1x01" -> words
      if (base.indexOf(' ') < 0 && (base.match(/-/g) || []).length >= 2) base = base.replace(/-+/g, ' ');
      if (base.indexOf(' ') < 0) {                               // "Bottom-S02E03", "bottom-s02e03-culture"
        base = base.replace(/([A-Za-z])[-]+(?=S\d{1,2}[ED]\d{1,3}\b)/i, '$1 ').replace(/\b(S\d{1,2}[ED]\d{1,3})-+(?=[A-Za-z])/i, '$1 ');
      }
    }
    base = stripRelease(base, slug);
    base = base.replace(/\bS(\d{2})D(\d{2})(\d{2})\b/ig, function (_, a, b, c) { return 'Series ' + (+a) + ' Disc ' + (+b) + ' Part ' + (+c); });   // DVD rip "S04D0111" is not an episode number
    base = base.replace(/\s*\(\s*\d{4}\s*[-\u2013]\s*\d{2,4}\s*\)/g, '');   // series year range "(1976 - 84)"
    base = base.replace(/\((S\d+)\s*[-\u2013]\s*(E\d+)\)/i, '$1$2'); // "(S4 - E18)" -> "S4E18"
    var sub = '';
    var title = base;
    // "NOEL'S HOUSE PARTY (BBC ONE - Season 3: Episode 2 / 12.09.92)" -> episode title + air date
    base = base.replace(/[\uFF1A\uFE55]/g, ':').replace(/[\u2018\u2019\u02BC]/g, "'").replace(/[\u29F8\u2215\uFF0F]/g, '/').replace(/\s+/g, ' ');
    var ep = base.match(/^(.*?)\s*\((?:[^()]*?-\s*)?Season\s+(\d+)[:,\s]+Episode\s+(\d+\w*)\s*(?:[\u29F8\/]\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4}))?[^()]*\)?/i);
    if (ep && ep[1]) {
      var show = ep[1].trim();
      if (show === show.toUpperCase() || (show.replace(/[^A-Za-z]/g, '').length > 3 && show.replace(/[^a-z]/g, '').length <= 1)) {
        show = show.toLowerCase().replace(/(^|\s)([a-z])/g, function (_, a, b) { return a + b.toUpperCase(); });
      }
      var year = ep[6] ? (ep[6].length === 2 ? (+ep[6] >= 50 ? 1900 : 2000) + (+ep[6]) : +ep[6]) : 0;
      var dated = ep[4] && validMonth(+ep[5]) && +ep[4] >= 1 && +ep[4] <= 31;
      return {
        title: show + ' - Season ' + ep[2] + ' Episode ' + ep[3],
        sub: dated ? (+ep[4]) + ' ' + MONTHS[+ep[5] - 1] + ' ' + year : ''
      };
    }
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
    } else if ((m = base.match(/(?:^|[^\d])(\d{1,2})-(\d{1,2})-(\d{4})(?!\d)/)) && validMonth(+m[2]) && +m[1] >= 1 && +m[1] <= 31) {
      // UK style day-month-year, e.g. "ITV - 03-11-2001"
      sub = (+m[1]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[3];
      title = base.replace(m[0].replace(/^[^\d]/, ''), ' ');
    }
    if (!sub) {                                                  // "May 29, 1981" / "26th February 1976"
      var mon = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
      var d1 = title.match(new RegExp('[\\s,\\-]*\\b' + mon + '\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b', 'i'));
      var d2 = title.match(new RegExp('[\\s,\\-]*\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+' + mon + '\\.?,?\\s+(\\d{4})\\b', 'i'));
      var mi = function (w) { return MONTHS.map(function (x) { return x.toLowerCase(); }).indexOf(w.slice(0, 3).toLowerCase()); };
      if (d1 && +d1[2] >= 1 && +d1[2] <= 31) {
        sub = (+d1[2]) + ' ' + MONTHS[mi(d1[1])] + ' ' + d1[3];
        title = title.replace(d1[0], ' ');
      } else if (d2 && +d2[1] >= 1 && +d2[1] <= 31) {
        sub = (+d2[1]) + ' ' + MONTHS[mi(d2[2])] + ' ' + d2[3];
        title = title.replace(d2[0], ' ');
      }
    }
    if (!sub && (m = title.match(/\s(\d{4})[ .\-_](\d{1,2})[ .\-_](\d{1,2})\s*$/)) && validMonth(+m[2]) && +m[3] >= 1 && +m[3] <= 31) {
      sub = (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1];   // "The Chart Show S 03e 34 1988 08 26"
      title = title.slice(0, m.index);
    }
    title = title.replace(/\s+/g, ' ').replace(/^[\s\-–:]+|[\s\-–:]+$/g, '').replace(/\s-\s-\s/g, ' - ');
    title = tidyCodes(title);
    if (!sub && tzSub) sub = tzSub;
    var cut = title.indexOf(' - ');
    var lead = cut > 3 ? title.slice(0, cut) : '';
    if (lead && lead.indexOf(' ') > 0 && lead === lead.toUpperCase() && lead.split(' ').every(function (w) { return w.length >= 4; })) {   // not acronyms like BBC
      title = titleCase(title.slice(0, cut).toLowerCase()) + title.slice(cut);   // "DADS ARMY - The Lovely Bunch"
    }
    if (slug && title.replace(/\bS\d+E\d+\b/g, '') === title.replace(/\bS\d+E\d+\b/g, '').toLowerCase()) title = titleCase(title);
    title = calmCaps(dropEmptyBrackets(title)).replace(/([A-Za-z]{3,})\.$/, '$1');   // "Sudden Death." -> "Sudden Death" (acronyms like O.T.S. keep theirs)
    return { title: title || fallback || base, sub: sub };
  }

  // Same result as Python's urllib.parse.quote(name, safe=",()'-"): archive.org 404s if a comma etc. is percent-encoded.
  function encodeSegment(seg) {
    return encodeURIComponent(seg)
      .replace(/!/g, '%21').replace(/\*/g, '%2A')   // encodeURIComponent leaves these; quote() encodes them
      .replace(/%2C/gi, ',');                       // ... and it encodes the comma; the whitelist keeps it
  }
  function encodePath(name) {
    return name.split('/').map(encodeSegment).join('/');
  }
  var DL_BASE = 'https://archive.org/download/';
  /** Always the clean load-balanced URL, never a regional data node (dn721603.ca.archive.org etc). */
  function archiveUrl(id, name) {
    return DL_BASE + encodeSegment(id) + '/' + encodePath(name);
  }
  /** Rebuild any archive.org download URL (including ones saved with a node host or ?query) on the clean base. */
  function canonicalUrl(u) {
    var m = /^https?:\/\/[^\/]*archive\.org\/(?:download|\d+\/items)\/([^\/?#]+)\/([^?#]+)/i.exec(String(u || ''));
    if (!m) return null;
    var id, path;
    try { id = decodeURIComponent(m[1]); path = decodeURIComponent(m[2]); } catch (e) { id = m[1]; path = m[2]; }
    return archiveUrl(id, path);
  }

  /** "Born And Bred S01-S04 webdl xvid" -> "Born And Bred"; "Mr.Bean.Complete.Collection.H264" -> "Mr Bean". */
  function cleanShow(folder) {
    var s = stripQuality(folder);
    if (s.indexOf(' ') < 0) s = s.replace(/[._-]+/g, ' '); // slug-style names: "the-bill_s01" -> words
    s = s.replace(/\(?\b\d{4}\s*[-\u2013]\s*\d{2,4}\b\)?/g, ' ');                              // "1981-1996"
    s = s.replace(/\b(complete\s+)?(series|seasons?)\s*\d+(\s*(to|-|&|and)\s*\d+)?\b/ig, ' ');   // "Series 1 to 26"
    s = s.replace(/\b(S\d+(-S?\d+)?|webdl|web-dl|xvid|x264|h\.?264|ac3|dd|aac|dvdrip|tvrip|divx|hdtv|complete|collection|will1869)\b/ig, ' ');
    return s.replace(/\s+/g, ' ').replace(/^[\s\-–:]+|[\s\-–:]+$/g, '').trim() || String(folder);
  }

  /** "Inspector Gadget: The Complete Seasons 1 & 2 (1983-86)" -> "Inspector Gadget". */
  function cleanItemTitle(t) {
    var s = stripQuality(String(t).replace(/\s+/g, ' ').trim());
    var c = s.replace(/\s*[-:\u2013]?\s*(the\s+)?complete\b.*$/i, '').replace(/\s*\(\d{4}\s*[-\u2013]\s*\d{2,4}\)\s*$/, '').trim();
    return c || s;
  }

  function md0(meta) { return (meta && meta.metadata) || {}; }

  /** File names like "Series 7" or "Disc 14" say nothing about the show. */
  function isGenericTitle(t) {
    return /^(series|season|disc|dvd|vol(ume)?|part|episode|ep|e\d+|s\d+|\d+)\b/i.test(String(t).trim()) ||
      /^(\d+x\d+|s\d+\s*e\d+|e\d+)/i.test(String(t).trim());
  }

  /**
   * Picks the playable mp4 files out of an archive.org /metadata/<id> response.
   * opts.include: optional regex source; only file paths matching it are used.
   */
  function pickPrograms(id, meta, opts) {
    if (!meta || meta.is_dark) return [];
    var anyVideo = !!(opts && opts.video);    // the scraper's library lists: a video file is a video file, whatever its extension. Live archive.org searches stay mp4
    var include = opts && opts.include ? new RegExp(opts.include, 'i') : null;
    var exclude = opts && opts.exclude ? new RegExp(opts.exclude, 'i') : null;
    var maxSize = opts && opts.maxSize ? +opts.maxSize : 0;
    var needEp = opts && opts.requireEp ? /(s\d+e\d+|\bep\s*\d+|\bepisode\s*\d+|\bpart\s*\d+|\bseason\s*\d+|\b\d{1,2}x\d{1,2}\b)/i : null;
    var skipFile = opts && opts.skipFile ? new RegExp(opts.skipFile, 'i') : null;   // tested on the file's own name only (not its folders)
    if (exclude && exclude.test(String(md0(meta).title || ''))) return [];
    var md = meta.metadata || {};
    if (String(md['access-restricted-item']).toLowerCase() === 'true') return [];
    var files = meta.files || [];
    var seen = {};   // dedupe key -> index in out
    var out = [];

    function make(name, f) {
      var d = describe(name, md.title);
      var parts = name.split('/');
      if (parts.length > 1) {
        // Files inside show folders: put the show name in front of the episode name.
        // A folder called "Series 3" says nothing about the show, so use the item's own title then.
        // Folders like "24", "Series 3" or "TV SHOW'S XMAS (A-J)" are just shelves, not the show.
        var shelf = /^(series|season|s)\s*\d+/i.test(parts[0]) || /^\d+$/.test(parts[0]);
        var bucket = /\(\s*[a-z0-9]\s*[-\u2013]\s*[a-z0-9]\s*\)/i.test(parts[0]);
        var show = shelf && md.title ? cleanShow(cleanItemTitle(md.title)) : cleanShow(parts[0]);
        if (bucket) { /* no prefix: the file name carries the show */ }
        else {
          var showBare = show.replace(/\s*\(?\b(?:19|20)\d\d\b\)?\s*$/, '').trim();   // "DuckTales 1987" -> "DuckTales"
          if (d.title.toLowerCase().indexOf(show.toLowerCase()) !== 0 && !(showBare && d.title.toLowerCase().indexOf(showBare.toLowerCase()) === 0)) {
            d.title = show + (/^s\d+[ed]\d+/i.test(d.title) ? ' ' : ' - ') + d.title;
          }
        }
      }
      // "DuckTales S1E22 Down & Out - DuckTales 1987": drop the show name repeated at the end
      var lead = /^(?:.*? - )?(.*?)\s+S\d+E\d+/i.exec(d.title);
      if (lead && lead[1]) {
        var lb = lead[1].replace(/\s*\(?\b(?:19|20)\d\d\b\)?\s*$/, '').trim();
        if (lb) d.title = d.title.replace(new RegExp('\\s+[-\u2013]\\s+' + lb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:\\s+\\(?(?:19|20)\\d\\d\\)?)?\\s*$', 'i'), '');
      }
      d.title = dropEmptyBrackets(d.title.replace(/^(.+?)\s-\s(S\d+E\d+)/, '$1 $2'));
      if (md.title && isGenericTitle(d.title)) {
        // "Series 7" -> "<item title> - Series 7"
        var itemName = cleanItemTitle(md.title);
        if (d.title.toLowerCase().indexOf(itemName.toLowerCase()) < 0) d.title = itemName + ' - ' + d.title;
        d.title = d.title.replace(/^(.+?)\s-\s(S\d+E\d+)/, '$1 $2');
      }
      var len = parseLength(f.length);
      return {
        id: id + '/' + name,
        item: id,
        url: archiveUrl(id, name),
        title: d.title,
        sub: d.sub,
        dur: len || DEFAULT_DURATION,
        _ia: /\.ia\.mp4$/i.test(name),
        _len: len
      };
    }

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      var name = f.name || '';
      if (!(anyVideo ? /\.(mp4|m4v|mkv)$/i : /\.mp4$/i).test(name)) continue;
      if (/sample|trailer/i.test(name)) continue;
      if (include && !include.test(name)) continue;
      if (exclude && exclude.test(name)) continue;
      if (skipFile && skipFile.test(name.split('/').pop())) continue;
      if (f.format && /thumbnail/i.test(f.format)) continue;
      var size = +f.size || 0;
      if (size && size < 200000) continue;
      if (maxSize && size > maxSize) continue;                                         // a whole season stitched into one file
      if (needEp && !needEp.test(name + ' ' + (md.title || ''))) continue;             // no episode / season number anywhere: not an EPG-ready episode
      var key = name.toLowerCase().replace(/\.ia\.mp4$|\.(mp4|m4v|mkv)$/, '');
      if (seen[key] !== undefined) {
        // Same programme listed twice. archive.org's ".ia.mp4" is the small, TV-friendly H.264 copy.
        var prev = out[seen[key]];
        var cand = make(name, f);
        if (cand._ia && !prev._ia) {
          if (!cand._len && prev._len) { cand._len = prev._len; cand.dur = prev._len; }
          out[seen[key]] = cand;
        } else if (!prev._len && cand._len) {
          prev._len = cand._len; prev.dur = cand._len;
        }
        continue;
      }
      seen[key] = out.length;
      out.push(make(name, f));
    }
    var minDur = opts && opts.minDur ? +opts.minDur : 0;
    if (minDur) out = out.filter(function (o) { return !o._len || o._len >= minDur; }); // unknown length: keep
    var maxDur = opts && opts.maxDur ? +opts.maxDur : 0;
    if (maxDur) out = out.filter(function (o) { return !o._len || o._len <= maxDur; });
    out.forEach(function (o) { delete o._ia; delete o._len; });
    if (out.length === 1 && md.title && /[a-z]/i.test(md.title) && !include && !exclude && name_isRoot(out[0])) {
      // an item that is a single programme: use the item's own title
      var only = describe(out[0].id.split('/').slice(1).join('/'));
      var named = describe(cleanItemTitle(md.title));
      out[0].title = named.title;
      if (!out[0].sub) out[0].sub = named.sub || only.sub;
    }
    return out;
  }

  /** Why an item gave nothing: lists the file types it does have, e.g. "no mp4 (mkv, avi)". */
  function whyEmpty(meta, opts) {
    if (!meta || meta.is_dark) return 'unavailable';
    if (String((meta.metadata || {})['access-restricted-item']).toLowerCase() === 'true') return 'restricted';
    var ext = {};
    (meta.files || []).forEach(function (f) {
      var m = /\.([a-z0-9]{2,4})$/i.exec(f.name || '');
      if (m && /^(mp4|m4v|mkv|avi|ogv|mpg|mpeg|webm|mov|divx|wmv|flv)$/i.test(m[1])) ext[m[1].toLowerCase()] = 1;
    });
    var k = Object.keys(ext);
    if (k.indexOf('mp4') >= 0) return 'mp4 files filtered out';
    return k.length ? 'no mp4 (' + k.join(', ') + ')' : 'no video files';
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

  var DAY_SEC = 86400, WEEK_SEC = 7 * DAY_SEC;

  /** "18:30" or "Sat 19:00" as seconds into the cycle. Day names are Sun..Sat, as JavaScript counts them. */
  var DAYS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  function clockSec(when) {
    var m = /^(?:([a-z]{3})\s+)?(\d{1,2}):(\d{2})$/i.exec(String(when || '').trim());
    if (!m) return null;
    var day = m[1] ? DAYS[m[1].toLowerCase()] : 0;
    if (m[1] && day === undefined) return null;
    return day * DAY_SEC + (+m[2]) * 3600 + (+m[3]) * 60;
  }

  /** Where the clock is in a daily or weekly cycle, in the viewer's own time, so 6pm is 6pm wherever they are. */
  function cyclePos(sched, tMs) {
    var d = new Date(tMs);
    var s = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    if (sched.cycle === 'multi') {                          // several days (or weeks) before the pattern comes round again
      var di = Math.floor((tMs / 60000 - d.getTimezoneOffset()) / 1440);      // whole local days since 1 Jan 1970
      if (sched.unit === WEEK_SEC) return (Math.floor((di + 4) / 7) % sched.n) * WEEK_SEC + d.getDay() * DAY_SEC + s;
      return (((di % sched.n) + sched.n) % sched.n) * DAY_SEC + s;
    }
    return sched.cycle === 'week' ? d.getDay() * DAY_SEC + s : s;
  }

  /** Several clock schedules (one per day, or per week) chained into one that only repeats after all of them.
   *  Each has to be exactly one cycle long, or the clock would drift; if one is not, just the first is used. */
  function joinCycles(list) {
    list = (list || []).filter(Boolean);
    if (!list.length) return null;
    var unit = list[0].cycle === 'week' ? WEEK_SEC : DAY_SEC;
    if (list.length === 1 || list.some(function (x) { return x.total !== unit || x.base !== list[0].base; })) return list[0];
    var order = [], starts = [], off = 0;
    list.forEach(function (x) {
      for (var i = 0; i < x.order.length; i++) { order.push(x.order[i]); starts.push(x.starts[i] + off); }
      off += x.total;
    });
    var g = buildGroups(order, starts);
    return { order: order, starts: starts, total: off, cycle: 'multi', unit: unit, n: list.length, base: list[0].base, groups: g.groups, gstarts: g.gstarts };
  }

  /** Enough programmes to fill about `seconds` of airtime, chosen so the line-up stays varied: one from each show in
   *  turn, so no show takes over and a short span still has plenty of different programmes. Everything given is
   *  already inside the channel's rules (era, genre, certificate); this only decides how much of it is used. */
  function selectSpan(progs, seconds, seed) {
    var total = 0;
    progs.forEach(function (p) { total += p.dur || 0; });
    if (!(seconds > 0) || total <= seconds * 1.05) return progs;
    var by = {}, keys = [];
    progs.forEach(function (p) {
      var k = String(p.show || p.group || String(p.title || '').replace(/\s+S\d+E\d+.*$/i, '')).toLowerCase();
      if (!by[k]) { by[k] = []; keys.push(k); }
      by[k].push(p);
    });
    var sd = hash(String(seed));
    keys = shuffle(keys, sd ^ 0x2b2b);
    keys.forEach(function (k) { by[k] = shuffle(by[k], sd ^ hash(k)); });
    var out = [], got = 0, round = 0, more = true;
    while (got < seconds && more) {
      more = false;
      for (var i = 0; i < keys.length && got < seconds; i++) {
        var p = by[keys[i]][round];
        if (!p) continue;
        more = true; out.push(p); got += p.dur || 0;
      }
      round++;
    }
    return out.length >= 4 ? out : progs;
  }

  /** How far into a schedule a moment is: the time of day for a clock schedule, otherwise a point in the loop. */
  function posIn(sched, tMs) {
    if (!sched.cycle) return (tMs / 1000) % sched.total;
    return (cyclePos(sched, tMs) - sched.base + sched.total * 2) % sched.total;
  }

  /**
   * Lay a channel out against the clock rather than as one endless loop: the same programme is on at the same
   * time every day (or every week), the way a real channel works.
   *
   * blocks are [{ at: "13:00" or "Sat 19:00", exact: true, items: [programmes] }] in time order. A block runs
   * until the next one begins, looping its own items if it has fewer than it needs, so a thin block repeats its
   * own programmes instead of borrowing from another genre.
   *
   * An exact block starts on the dot: the gap before it is filled with `filler` (short clips, idents), and the
   * last of those is cut short so the programme after it starts exactly on time. That is what the continuity
   * announcer is for. Without filler the previous programme is trimmed instead, so there is never dead air.
   */
  function buildClockSchedule(blocks, filler, seed, cycle) {
    var span = cycle === 'week' ? WEEK_SEC : DAY_SEC;
    var seeded = hash(String(seed));
    var fill = shuffle((filler || []).filter(function (p) { return p && p.dur > 0; }), seeded ^ 0x5f5f);
    var marks = [];
    (blocks || []).forEach(function (b) {
      var at = typeof b.at === 'number' ? b.at : clockSec(b.at);
      var items = (b.items || []).filter(function (p) { return p && p.dur > 0; });
      if (at === null || at === undefined || !items.length) return;
      marks.push({ at: ((at % span) + span) % span, exact: !!b.exact, items: shuffle(items, seeded ^ at) });
    });
    if (!marks.length) return null;
    marks.sort(function (a, b) { return a.at - b.at; });

    var order = [], starts = [], at = marks[0].at, fillAt = 0;
    function put(prog, dur) { order.push(prog.dur === dur ? prog : clone(prog, dur)); starts.push(at); at += dur; }

    /** Reach a time exactly: short filler, the last of it cut to fit. With no filler left, hold the previous
     *  programme on screen for the remainder, which is still better than dead air. */
    function padTo(target) {
      for (var guard = 0; at < target && fill.length && guard < fill.length * 4; guard++) {
        var f = fill[fillAt++ % fill.length];
        put(f, Math.min(f.dur, target - at));
      }
      if (at < target && order.length) {
        var last = order.length - 1;
        order[last] = clone(order[last], target - starts[last]);
      }
      if (at < target) { at = target; }
    }

    for (var i = 0; i < marks.length; i++) {
      var block = marks[i], next = marks[i + 1];
      var ends = next ? next.at : marks[0].at + span;         // the cycle has to close on its own start time
      var mustEnd = next ? next.exact : true;
      if (at < block.at) padTo(block.at);                     // run up to an exact start
      else if (at > block.at && block.exact && order.length) {
        var over = order.length - 1, keep = block.at - starts[over];
        if (keep >= 60) { order[over] = clone(order[over], keep); at = block.at; }   // the news waits for nobody
      }
      for (var k = 0; at < ends && k <= block.items.length * 40; k++) {
        var p = block.items[k % block.items.length];
        if (p.dur <= ends - at) { put(p, p.dur); continue; }
        // it will not finish in time: let it overrun into a block that is not fussy, otherwise fill to the mark
        if (!mustEnd) { put(p, p.dur); break; }
        padTo(ends);
        break;
      }
      if (at < ends) padTo(ends);
    }
    var total = at - starts[0];
    if (total <= 0) return null;
    var shift = starts[0];                                    // starts are measured from the first block's time
    for (var j = 0; j < starts.length; j++) starts[j] = starts[j] - shift;
    var g = buildGroups(order, starts);
    return { order: order, starts: starts, total: total, cycle: cycle === 'week' ? 'week' : 'day',
             base: ((shift % span) + span) % span, groups: g.groups, gstarts: g.gstarts };
  }

  /** The same programme at a different length: a clip cut short to reach the news on time. */
  function clone(prog, dur) {
    var out = {};
    for (var k in prog) if (prog.hasOwnProperty(k)) out[k] = prog[k];
    out.dur = Math.max(1, Math.round(dur));
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
    var g = buildGroups(order, starts);
    return { order: order, starts: starts, total: total, groups: g.groups, gstarts: g.gstarts };
  }

  /**
   * Guide blocks. A run of short programmes (music clips) is merged into one block of roughly
   * half an hour so the grid stays readable; long programmes stand alone. The partition is fixed
   * per schedule, so blocks do not change depending on where you look.
   */
  var SHORT = 1200;   // programmes under 20 min are "short"
  var TARGET = 1500;  // merge short ones until a block is about 25 min

  function buildGroups(order, starts) {
    var groups = [];
    var gstarts = [];
    var n = order.length;
    var i = 0;
    while (i < n) {
      var g = { first: i, count: 1, start: starts[i], dur: order[i].dur };
      if (order[i].dur < SHORT) {
        while (i + g.count < n && g.dur < TARGET && order[i + g.count].dur < SHORT) {
          g.dur += order[i + g.count].dur;
          g.count++;
        }
      }
      groups.push(g);
      gstarts.push(g.start);
      i += g.count;
    }
    return { groups: groups, gstarts: gstarts };
  }

  function mkBlock(s, gi, startMs) {
    var g = s.groups[gi];
    return { gi: gi, prog: s.order[g.first], count: g.count, startMs: startMs, endMs: startMs + g.dur * 1000 };
  }

  /** The guide block on at time tMs. */
  function blockAt(s, tMs) {
    var G = s.groups;
    if (!G.length || !s.total) return null;
    var pos = posIn(s, tMs);
    var lo = 0, hi = G.length - 1;
    while (lo < hi) {
      var mid = (lo + hi + 1) >> 1;
      if (s.gstarts[mid] <= pos) lo = mid; else hi = mid - 1;
    }
    return mkBlock(s, lo, tMs - (pos - G[lo].start) * 1000);
  }

  /** The block after (dir > 0) or before (dir < 0) block b, found by position in the list, not by time. */
  function stepBlock(s, b, dir) {
    var n = s.groups.length;
    if (dir > 0) return mkBlock(s, (b.gi + 1) % n, b.endMs);
    var gi = (b.gi - 1 + n) % n;
    return mkBlock(s, gi, b.startMs - s.groups[gi].dur * 1000);
  }

  /** All guide blocks overlapping [fromMs, toMs). */
  function blocks(s, fromMs, toMs) {
    var b = blockAt(s, fromMs);
    if (!b) return [];
    var out = [b];
    var gi = b.gi;
    var start = b.endMs;
    while (start < toMs && out.length < 500) {
      gi = (gi + 1) % s.groups.length;
      var nb = mkBlock(s, gi, start);
      out.push(nb);
      start = nb.endMs;
    }
    return out;
  }

  /** What is on at time tMs (milliseconds since epoch). */
  function at(sched, tMs) {
    var n = sched.order.length;
    if (!n || !sched.total) return null;
    var pos = posIn(sched, tMs);
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
    pickPrograms: pickPrograms, whyEmpty: whyEmpty, buildSchedule: buildSchedule, at: at, upcoming: upcoming,
    buildClockSchedule: buildClockSchedule, joinCycles: joinCycles, selectSpan: selectSpan, clockSec: clockSec,
    cleanShow: cleanShow, cleanItemTitle: cleanItemTitle, sample: sample, blockAt: blockAt, stepBlock: stepBlock, blocks: blocks,
    DEFAULT_DURATION: DEFAULT_DURATION, encodePath: encodePath, archiveUrl: archiveUrl, canonicalUrl: canonicalUrl
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
  else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : this);
