/* Advert manager (pure logic, no DOM): which adverts suit a channel, how to search archive.org for them, and which
 * results to keep for the era the viewer picked. app.js does the loading, caching and playing. */
(function (root) {
  'use strict';

  var ERAS = [
    { id: 'off', label: 'Off' },
    { id: 'all', label: 'All (70s-90s)' },
    { id: '70', label: '1970s' },
    { id: '80', label: '1980s' },
    { id: '90', label: '1990s' }
  ];
  var RANGE = { '70': [1970, 1979], '80': [1980, 1989], '90': [1990, 1999] };
  // "All" leans on the 80s and 90s: how many search results to ask for per decade
  var ALL_ROWS = { '70': 6, '80': 18, '90': 18 };

  // genre of advert for each kind of channel. count = adverts per break, maxDur = longest single clip (seconds)
  var CATS = {
    kids: { count: 2, maxDur: 150, kw: ['toy', 'toys', 'board game', 'action figure', 'sweets', 'chocolate', 'cereal', 'crisps', 'lego', 'barbie', 'transformers'] },
    games: { count: 2, maxDur: 150, kw: ['sega', 'nintendo', 'snes', 'mega drive', 'megadrive', 'playstation', 'game boy', 'gameboy', 'amiga', 'atari', 'video game'] },
    music: { count: 2, maxDur: 150, kw: ['now that\'s what i call music', 'now thats what i call music', 'compilation album', 'cassette', 'cd', 'album', 'hits'] },
    daytime: { count: 2, maxDur: 150, kw: ['cleaning', 'washing powder', 'detergent', 'food', 'supermarket', 'tesco', 'sainsbury', 'magazine', 'household', 'biscuits'] },
    // standard commercial breaks: ITV, Channel 4, Channel 5, Sky and cable (never the BBC, which has no adverts)
    prime: { count: 1, maxDur: 420, kw: ['itv', 'channel 4', 'channel 5', 'sky', 'cable', 'commercial break', 'ad break', 'adverts', 'commercials'] }
  };

  // channel id -> advert genre. No entry = no adverts (Classic BBC: the BBC has none; Adverts & Continuity is adverts already).
  var CHANNEL_CAT = {
    citv: 'kids', childrens: 'kids', disney: 'kids', kidsmovies: 'kids', kidsxmas: 'kids',
    games: 'games',
    music: 'music', mtv: 'music', xmasmusic: 'music',
    itvam: 'daytime', offschool: 'daytime',
    comedy: 'prime', sitcoms: 'prime', drama: 'prime', gameshows: 'prime', tv70s: 'prime', noel: 'prime', cooking: 'prime', entertainment: 'prime', ussitcoms: 'prime',
    itv: 'prime', christmas: 'prime'
  };

  function categoryFor(channelId) { return CHANNEL_CAT[channelId] || null; }
  function eraIndex(id) { for (var i = 0; i < ERAS.length; i++) if (ERAS[i].id === id) return i; return 1; }

  function orTerms(list) { return list.map(function (k) { return '"' + k.replace(/"/g, '') + '"'; }).join(' OR '); }

  var UK_WORDS = ['uk', 'british', 'britain', 'itv', 'channel 4', 'channel 5', 'sky', 'thames', 'granada', 'lwt', 'tvs', 'anglia', 'central', 'yorkshire', 'scottish', 'stv', 'utv'];
  var NOT_UK = '(bbc OR usa OR american OR america OR nbc OR cbs OR "saturday morning")';
  var US_RE = /\b(usa|u\.s\.a?|american|america|nbc|cbs|saturday morning|super bowl|1-800)\b/i;

  /** Lucene query for one genre. tier 'uk' = inside archive.org's UK adverts collection; 'g' = anywhere, but the title or
   *  subject must say it is British. dated=false drops the date clause (items nobody dated). */
  function buildQuery(cat, era, tier, dated) {
    var kw = orTerms(CATS[cat].kw);
    var q = 'mediatype:movies AND (title:(' + kw + ') OR subject:(' + kw + ')) AND NOT title:' + NOT_UK;
    if (tier === 'uk') {
      q = 'collection:uk-adverts AND ' + q;
    } else {
      var uk = orTerms(UK_WORDS);
      q = '(subject:(advert OR adverts OR advertisement OR commercial OR commercials) OR title:(advert OR adverts OR advertisement OR commercial OR commercials OR ads)) AND (title:(' + uk + ') OR subject:(' + uk + ')) AND ' + q;
    }
    if (dated) q += RANGE[era] ? ' AND date:[' + RANGE[era][0] + '-01-01 TO ' + RANGE[era][1] + '-12-31]' : ' AND date:[1970-01-01 TO 1999-12-31]';
    return q;
  }

  /** The searches that make up one pool: [{search, rows, maxDur, perItem, group, skipTitle}].
   *  group = tier + '-' + d (dated search) or u (undated). The UK collection comes first and gets the most rows. */
  function sourcesFor(cat, eraId) {
    if (!CATS[cat] || eraId === 'off') return [];
    var c = CATS[cat], out = [];
    function add(tier, era, dated, rows) {
      out.push({ search: buildQuery(cat, era, tier, dated), rows: rows, maxDur: c.maxDur, perItem: 1, group: tier + '-' + (dated ? 'd' : 'u'), skipTitle: '\\bBBC\\b|' + US_RE.source });
    }
    if (eraId === 'all') {
      ['70', '80', '90'].forEach(function (d) { add('uk', d, true, ALL_ROWS[d]); });
      add('uk', 'all', false, 12);
      add('g', 'all', true, 12);
    } else {
      add('uk', eraId, true, 30);
      add('uk', eraId, false, 12);
      add('g', eraId, true, 12);
    }
    return out;
  }

  /** Decade named in a title ("1984", "80s", "'90s", "1970s") -> '70' | '80' | '90' | 'other' | null */
  function eraOf(title) {
    var t = String(title || ''), re = /(?:^|[^0-9])((?:19|20)\d\d)(?![0-9])/g, m, any = false;
    // Take the first year that is actually in the era, not simply the first number that looks like one: plenty of
    // titles carry a number that is part of a name ("Wipeout 2097, Playstation (Psygnosis, 1996)").
    while ((m = re.exec(t))) {
      any = true;
      var n = +m[1];
      if (n >= 1970 && n <= 1999) return String(Math.floor((n - 1900) / 10) * 10);
    }
    if (any) return 'other';
    var d = /(?:^|[^0-9])(?:19)?'?([789]0)'?s\b/i.exec(t);
    return d ? d[1] : null;
  }

  /** Keep an advert result for the chosen era? Never the BBC; known-year titles must fit; undated ones only in "All". */
  // Hardware and services that did not exist in the era: a title with no year in it can still be plainly modern.
  var MODERN_RE = /\b(nintendo switch|switch|wii ?u|wii|3ds|dsi|nintendo ds|gamecube|game ?cube|xbox|ps[345]|playstation [345]|crunchyroll|e3 20\d\d|netflix|youtube)\b/i;

  function accept(prog, eraId) {
    var t = (prog.title || '') + ' ' + (prog.item || '');
    if (/\bBBC\b/i.test(t) || US_RE.test(t) || MODERN_RE.test(t)) return false;
    var e = eraOf(prog.title) || eraOf(prog.item);
    if (e === 'other') return false;
    if (eraId === 'all') return e === null || e === '70' || e === '80' || e === '90';
    return e === eraId || (e === null && /-d$/.test(prog.group || ''));
  }

  function filterPool(progs, eraId) { return (progs || []).filter(function (p) { return accept(p, eraId); }); }

  /** Hand-picked adverts (adverts.js) for one channel, checked the same way as the ones found by searching. */
  function fixedFor(channelId, eraId) {
    var all = (typeof root !== 'undefined' && root.ADVERTS) || [];
    var out = [];
    all.forEach(function (a) {
      var url = a[0], title = a[1], chans = ' ' + (a[2] || '') + ' ';
      if (!url || chans.indexOf(' ' + channelId + ' ') < 0) return;
      var dated = eraOf(title) !== null;
      var path = url.replace(/^https?:\/\/[^\/]*\/download\//, '');
      try { path = decodeURIComponent(path); } catch (e) { /* leave it encoded */ }
      var p = { id: url, item: path, url: url, title: title, sub: '', dur: 40,
                group: dated ? 'uk-d' : 'uk-u' };
      if (accept(p, eraId)) out.push(p);
    });
    return out;
  }

  /** Pick the next advert: UK-collection ones about 4 times in 5, random, never the one that just played. */
  function pickNext(pool, lastUrl) {
    if (!pool || !pool.length) return null;
    var uk = pool.filter(function (p) { return /^uk-/.test(p.group || ''); });
    var from = uk.length && Math.random() < 0.8 ? uk : pool;
    var i = Math.floor(Math.random() * from.length);
    if (from.length > 1 && from[i].url === lastUrl) i = (i + 1) % from.length;
    return from[i];
  }

  var Ads = { ERAS: ERAS, CATS: CATS, categoryFor: categoryFor, fixedFor: fixedFor, eraIndex: eraIndex, buildQuery: buildQuery,
    sourcesFor: sourcesFor, eraOf: eraOf, accept: accept, filterPool: filterPool, pickNext: pickNext };
  if (typeof module !== 'undefined' && module.exports) module.exports = Ads; else root.ADS = Ads;
})(typeof window !== 'undefined' ? window : this);
