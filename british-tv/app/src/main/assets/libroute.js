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
      var padded = ' ' + n + ' ', hit = [], words = n.split(' ');
      if (!keys.mw) { keys.mw = 1; for (var j = 0; j < keys.length; j++) keys.mw = Math.max(keys.mw, keys[j].split(' ').length); }
      // each run of words is looked up in the table of names, instead of searching the text for every name in turn
      for (var a = 0; a < words.length; a++) {
        var gram = '';
        for (var b = 0; b < keys.mw && a + b < words.length; b++) {
          gram = b ? gram + ' ' + words[a + b] : words[a];
          if (gram.length > 4 && smap.hasOwnProperty(gram) && okAfter(padded, gram)) hit = hit.concat(smap[gram]);
        }
      }
      if (hit.length) return uniqSorted(hit);
    }
    return [];
  }

  // Channels that belong to children, which the broadcaster channels leave alone: a cartoon that happened to be
  // on BBC1 belongs on CITV or Children's World, not among the evening's drama.
  var KIDS = { citv: 1, childrens: 1, disney: 1, kidsmovies: 1, kidsxmas: 1, mc_toons80: 1, mc_toons90: 1, mc_toons_classic: 1, mc_cbbc: 1, mc_nursery: 1, mc_teen: 1, mc_xmas_toons: 1 };
  var NET = { bbc: 'bbc', itv: 'itv' };          // c4, c5 and sky have no channel of their own yet

  /** Classic British telly is 1970 to 1999. An episode with no air date is kept; a later one is not. */
  function inEra(ep) {
    var a = ep && ep.a;
    if (!a) return true;
    var y = parseInt(String(a).slice(0, 4), 10);
    return !(y > 1999);
  }

  /** The year an episode or film belongs to: its air date, or a year in a film's title "(1984)"; 0 when neither is known. */
  var CODED = /^S\d{1,4}E\d{1,4}$/i;
  /** Channels that also take videos with no season and episode number (dated or numbered, or just a clip). */
  /** A file that is plainly another show's episode whose title happens to be this show's name: "Mobile Suit Gundam Wing -
   *  S01E26 - The Eternal Flame of the Shooting Stars" is not an episode of Shooting Stars. True when the file name
   *  has a name in front of its season/episode code that shares no word with the show, and the show's name only
   *  turns up after the code. (Checked over the whole library: it catches the wrong ones and nothing else.) */
  // Shows where the library holds a different programme of the same name: the file names give it away
  var OTHER_VERSION = { 'mr bean': /animated/i, 'thundercats': /2011|completo|paixaoflix/i };      // the 1990s sitcom, not the 2002 cartoon
  // Game-play channels from YouTube that share a name with a cartoon or series ("Donkey Kong Country" by Super Beard Bros.)
  var PLAYER_CHANNELS = /super\s*beard\s*bros|game\s*grumps|achievement\s*hunter|yogscast|let'?s\s*play|dunkey/i;
  // Dubbed or foreign-language uploads and modern remakes that share a name with a British-TV-era show
  var FOREIGN = /dublado|legendado|completo|portugu[eê]s|castellano|latino|paixaoflix|\bhin[- ]kor\b|\bhindi\b|\bkorean\b|\btemporada\b|\bstaffel\b|\bsaison\b/i;
  function wrongShow(sh, ep) {
    if (sh.film || sh.song) return false;
    if (FOREIGN.test(String(ep.f || '') + ' ' + String(ep.id || ''))) return true;
    if (PLAYER_CHANNELS.test(String(ep.f || '') + ' ' + String(ep.id || '') + ' ' + String(ep.t || ''))) return true;
    var ov = OTHER_VERSION[String(sh.n || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()];
    if (ov && ov.test(String(ep.f || '') + ' ' + String(ep.id || ''))) return true;
    function norm(t) { return String(t || '').toLowerCase().replace(/[_.\-:'\u2019,!?()\[\]]+/g, ' ').replace(/\s+/g, ' ').trim(); }
    var sn = norm(sh.n).replace(/^the /, '');
    if (sn.length < 5) return false;
    var raw = norm(String(ep.f || '').replace(/\.[a-z0-9]+$/i, ''));
    var m = /\bs\d{1,2}\s?e\d{1,3}\b|\b\d{1,2}x\d{1,3}\b/i.exec(raw);
    if (!m) return false;
    var before = raw.slice(0, m.index).trim(), after = raw.slice(m.index + m[0].length);
    if (before.length < 4 || before.indexOf(sn) >= 0 || after.indexOf(sn) < 0) return false;
    var bw = before.split(' ').filter(function (w) { return w.length > 2; });
    return !sn.split(' ').some(function (w) { return w.length > 2 && bw.indexOf(w) >= 0; });
  }
  var GAMEPLAY = /\b(longplays?|long play|playthrough|play-through|walkthrough|walk-through|gameplay|let'?s play|speedrun|full game)\b|\[(ps[1-5]|psx|psp|xbox( 360| one)?|pc|wii( u)?|switch|n64|snes|nes|gba|gbc|gamecube|3ds|nds|dreamcast|saturn|mega drive|genesis)\]/i;
  // A Christmas episode, for the Christmas channels. The scraper marks one (ep.xmas) when its title says so or when
  // it aired from Christmas Eve to New Year's Day, and an air date alone lets in a lot that is not Christmas at all:
  // US cartoons and sitcoms that ran daily in syndication (DuckTales, Jonny Quest, Benson), The Bill and Bergerac on
  // Boxing Day, anything on New Year's Eve. So a Christmas word in the title or file name is enough; otherwise only a
  // British show (a BBC/ITV/C4 one, sh.net, or one on a UK soap or BBC/ITV list) aired on the 24th, 25th or 26th,
  // which is when the Christmas specials and the soaps' Christmas episodes went out.
  var XMAS_WORDS = /christmas|xmas|x-mas|santa|nativity|noel|yule|festive|snowm[ae]n|carol|scrooge|advent|boxing day|mistletoe|reindeer|sleigh|jingle|tinsel|panto|'?tis the season|merry gentlemen|nutcracker/i;
  var UK_LISTS = { bbc: 1, itv: 1, mc_uk_soaps: 1 };
  function isXmas(sh, ep, genre) {
    if (!ep.xmas) return false;
    if (XMAS_WORDS.test([ep.t, ep.n, ep.f].join(' '))) return true;
    var md = String(ep.a || '').slice(5, 10);
    if (md !== '12-24' && md !== '12-25' && md !== '12-26') return false;
    return !!sh.net || genre.some(function (c) { return UK_LISTS[c]; });
  }
  var LOOSE = { mc_pop: 1, mc_rock: 1, mc_aussie: 1, mc_uk_soaps: 1, mc_us_soaps: 1, mc_daytime: 1, mc_factual: 1, mc_kitchen: 1, mc_xmas_comedy: 1, mc_xmas_soaps: 1, mc_xmas_toons: 1, mc_xmas_pop: 1, soaps: 1, offschool: 1, music: 1, mtv: 1, xmasmusic: 1, christmas: 1, kidsxmas: 1, noel: 1, tvarchive: 1, disney: 1, adverts: 1 };
  // Channels that also take an unnumbered episode when it is dated up to 1999: most quiz shows were only ever dated
  // ("Supermarket Sweep - 4:6:95", "Blockbusters - 1:21:82", "Fifteen to One - TX 15 January 1988"). Taking every
  // unnumbered file instead lets in fan videos and namesakes.
  var DATED = { gameshows: 1, mc_quiz: 1, mc_challenge: 1, mc_light_ent: 1 };
  var MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
  /** The year a date in a file name gives (4:6:95, 14_4_05, 1984-04-27, 15 January 1988), or 0 when it has none. */
  function fileYear(f) {
    f = String(f || '');
    var m = /(?:^|\D)(19\d\d|20\d\d)[-_.](\d\d)[-_.](\d\d)(?:\D|$)/.exec(f);
    if (m) return +m[1];
    m = new RegExp('\\b\\d{1,2}(?:st|nd|rd|th)?\\s+(?:' + MONTHS + ')[a-z]*\\.?,?\\s+(19\\d\\d|20\\d\\d)\\b', 'i').exec(f) ||
      new RegExp('\\b(?:' + MONTHS + ')[a-z]*\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?,?\\s+(19\\d\\d|20\\d\\d)\\b', 'i').exec(f);
    if (m) return +m[1];
    m = /(?:^|[^\d:._\/-])(\d{1,2})[:._\/-](\d{1,2})[:._\/-](\d{2}|\d{4})(?![\d:._\/-]*\d)/.exec(f);
    if (m && +m[1] >= 1 && +m[2] >= 1 && (+m[1] <= 12 || +m[2] <= 12) && +m[1] <= 31 && +m[2] <= 31) {
      var y = +m[3];
      return y >= 100 ? y : y >= 30 ? 1900 + y : 2000 + y;
    }
    return 0;
  }
  function datedInEra(ep) {
    var y = yearOf(ep) || fileYear(ep.f);
    return y >= 1950 && y <= 1999;
  }
  function yearOf(ep) {
    var y = parseInt(String((ep && ep.a) || '').slice(0, 4), 10);
    if (y > 1900) return y;
    var m = /\(((?:19|20)\d\d)\)\s*$/.exec(String((ep && ep.n) || ''));
    return m ? +m[1] : 0;
  }
  /** Which decade (1970, 1980 ...) an episode belongs to, or 0 if that cannot be said. An episode with an air date is
   *  simply of that year. One without goes by when its show began, but only if the show ended in that decade (tv.ye, when known) and everything dated in it agrees:
   *  a show that began in 1985 and has episodes dated 2001 is not trusted to put an undated one in the eighties. */
  function decadeOf(ep, sh, span) {
    var y = yearOf(ep);
    if (y) return Math.floor(y / 10) * 10;
    var py = parseInt(sh.tv && sh.tv.y, 10);
    if (!(py > 1900)) return 0;
    var base = Math.floor(py / 10) * 10, ye = parseInt(sh.tv && sh.tv.ye, 10);
    if (ye > 1900 && Math.floor(ye / 10) * 10 !== base) return 0;        // the show ran on into another decade
    return !span.max || Math.floor(span.max / 10) * 10 === base ? base : 0;
  }

  /** library.json + shows.json (minus the removed shows) -> {channel: rows}. A row is {id, t, f, s?, m}: one archive.org item, its file names
   *  (or [name, show] pairs when the item holds more than one show), and m = {file name: episode details}. */
  function route(lib, showsJson, removed) {
    var smap = showMap(showsJson), keys = Object.keys(smap), per = {}, order = {}, gone = {};
    // a channel flagged "decade": 1970 takes every show in the library that belongs to that decade, whatever genre it is
    var decades = {};
    Object.keys(showsJson || {}).forEach(function (ch) { var d = showsJson[ch] && +showsJson[ch].decade; if (d) decades[ch] = d; });
    var decKeys = Object.keys(decades);
    // shows the scraper has removed for good (data/removed-shows.json): [{name, slug}] or plain names
    (removed || []).forEach(function (r) {
      var name = typeof r === 'string' ? r : (r && r.name) || '', slug = r && r.slug ? String(r.slug).replace(/-/g, ' ') : '';
      if (name) gone[norm(name)] = 1;
      if (slug) gone[norm(slug)] = 1;
    });
    ((lib && lib.shows) || []).forEach(function (sh) {
      if (gone[norm(sh.n)]) return;
      var net = NET[String(sh.net || '').toLowerCase()], span = { max: 0 };
      if (decKeys.length) (sh.e || []).forEach(function (ep) { var y = yearOf(ep); if (y > span.max) span.max = y; });
      (sh.e || []).forEach(function (ep) {
        var genre = channelsFor(sh.n, ep.t, smap, keys);
        // the 1970 to 1999 limit does not apply to the Disney channel: its shorts go back to the 1930s and are mostly undated
        var late = !inEra(ep);
        if (late && genre.indexOf('disney') < 0) return;
        if (late) genre = ['disney'];
        var forKids = genre.some(function (c) { return KIDS[c]; });
        var also = [];
        // the broadcaster's own channel, as well as wherever the genre lists put it. A soap is on the Soaps channel
        // and on its broadcaster's too (EastEnders is on BBC and on Soaps); the 25% cap per show keeps one long
        // soap from filling the broadcaster's channel
        if (net && !forKids) also.push(net);
        // and a Christmas episode goes to the Christmas channel of the right sort
        var xmas = isXmas(sh, ep, genre);
        if (xmas) also.push(forKids ? 'kidsxmas' : 'christmas');
        if (wrongShow(sh, ep)) return;
        var chs = late ? ['disney'] : (also.length ? uniqSorted(genre.concat(also)) : genre);
        if (decKeys.length && !late && !sh.song) {
          var dec = decadeOf(ep, sh, span);
          if (dec) decKeys.forEach(function (ch) { if (decades[ch] === dec && chs.indexOf(ch) < 0) chs = chs.concat(ch); });
        }
        // Magic Channels: a film channel keeps only its genres, a Christmas channel only the Christmas episodes
        chs = chs.filter(function (ch) {
          var o = showsJson && showsJson[ch];
          if (!o || !o.magic) return true;
          if (o.genres && sh.film) { var g = String(ep.g || '').split(/\s*,\s*/); return o.genres.some(function (x) { return g.indexOf(x) >= 0; }); }
          if (o.xmas) return xmas;
          return true;
        });
        chs.forEach(function (ch) {
          // Only episodes tracked as a season and episode (S01E04) go on the ordinary channels. Dated or numbered videos
          // (soap episodes, Top of the Pops, news, shorts) stay on the channels built for them, and on the Christmas ones.
          // a video game's playthrough ("Lego Star Wars [PS3] Longplay" filed as the 1977 film, NES longplays on the
          // Disney channel) is not what the channel is for: only the games channel keeps them
          if (ch !== 'games' && GAMEPLAY.test(String(ep.t || '').replace(/[_]+/g, ' '))) return;
          if (!LOOSE[ch] && !sh.film && !sh.song && !CODED.test(ep.c || '') && !(DATED[ch] && datedInEra(ep))) return;
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
          if (xmas) d.xmas = 1;
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
            if (ep.cast) d.cast = ep.cast;      // Info's cast row, and the actor lists
            if (ep.lg) d.lg = ep.lg;            // a clear (transparent title) image, when the scraper found one
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

  var LibRoute = { yearOf: yearOf, fileYear: fileYear, decadeOf: decadeOf, norm: norm, showMap: showMap, channelsFor: channelsFor, okAfter: okAfter, route: route, titleFor: titleFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = LibRoute; else root.LIBROUTE = LibRoute;
})(typeof window !== 'undefined' ? window : this);
