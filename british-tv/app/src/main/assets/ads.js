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
    comedy: 'prime', sitcoms: 'prime', drama: 'prime', gameshows: 'prime', tv70s: 'prime', noel: 'prime',
    itv: 'prime', thebill: 'prime', christmas: 'prime'
  };

  function categoryFor(channelId) { return CHANNEL_CAT[channelId] || null; }
  function eraIndex(id) { for (var i = 0; i < ERAS.length; i++) if (ERAS[i].id === id) return i; return 1; }

  function orTerms(list) { return list.map(function (k) { return '"' + k.replace(/"/g, '') + '"'; }).join(' OR '); }

  /** Lucene query for one genre (and optionally one decade). dated=false drops the date clause, for items nobody dated. */
  function buildQuery(cat, era, dated) {
    var kw = orTerms(CATS[cat].kw);
    var isAd = '(collection:uk-adverts OR subject:(advert OR adverts OR advertisement OR commercial OR commercials) OR title:(advert OR adverts OR advertisement OR commercial OR commercials OR ads))';
    var q = 'mediatype:movies AND ' + isAd + ' AND (title:(' + kw + ') OR subject:(' + kw + ')) AND NOT title:(bbc)';
    if (dated && RANGE[era]) q += ' AND date:[' + RANGE[era][0] + '-01-01 TO ' + RANGE[era][1] + '-12-31]';
    else if (dated) q += ' AND date:[1970-01-01 TO 1999-12-31]';
    return q;
  }

  /** The searches that make up one pool: [{search, rows, maxDur, perItem, group, skipTitle}; group d = dated search, u = undated] */
  function sourcesFor(cat, eraId) {
    if (!CATS[cat] || eraId === 'off') return [];
    var c = CATS[cat], out = [];
    var decades = eraId === 'all' ? ['70', '80', '90'] : [eraId];
    decades.forEach(function (d) {
      var rows = eraId === 'all' ? ALL_ROWS[d] : 30;
      out.push({ search: buildQuery(cat, d, true), rows: rows, maxDur: c.maxDur, perItem: 1, group: 'd', skipTitle: '\\bBBC\\b' });
    });
    // items with no date at all: kept only if their title names the decade (see accept)
    out.push({ search: buildQuery(cat, eraId, false), rows: 10, maxDur: c.maxDur, perItem: 1, group: 'u', skipTitle: '\\bBBC\\b' });
    return out;
  }

  /** Decade named in a title ("1984", "80s", "'90s", "1970s") -> '70' | '80' | '90' | 'other' | null */
  function eraOf(title) {
    var t = String(title || '');
    var y = /(?:^|[^0-9])(19\d\d|20\d\d)(?![0-9])/.exec(t);
    if (y) { var n = +y[1]; return n >= 1970 && n <= 1999 ? String(Math.floor((n - 1900) / 10) * 10) : 'other'; }
    var d = /(?:^|[^0-9])(?:19)?'?([789]0)'?s\b/i.exec(t);
    return d ? d[1] : null;
  }

  /** Keep an advert result for the chosen era? Never the BBC; known-year titles must fit; undated ones only in "All". */
  function accept(prog, eraId) {
    var t = (prog.title || '') + ' ' + (prog.item || '');
    if (/\bBBC\b/i.test(t)) return false;
    var e = eraOf(prog.title) || eraOf(prog.item);
    if (e === 'other') return false;
    if (eraId === 'all') return e === null || e === '70' || e === '80' || e === '90';
    return e === eraId || (e === null && prog.group === 'd');
  }

  function filterPool(progs, eraId) { return (progs || []).filter(function (p) { return accept(p, eraId); }); }

  /** Pick the next advert: random, never the one that just played. */
  function pickNext(pool, lastUrl) {
    if (!pool || !pool.length) return null;
    var i = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && pool[i].url === lastUrl) i = (i + 1) % pool.length;
    return pool[i];
  }

  var Ads = { ERAS: ERAS, CATS: CATS, categoryFor: categoryFor, eraIndex: eraIndex, buildQuery: buildQuery,
    sourcesFor: sourcesFor, eraOf: eraOf, accept: accept, filterPool: filterPool, pickNext: pickNext };
  if (typeof module !== 'undefined' && module.exports) module.exports = Ads; else root.ADS = Ads;
})(typeof window !== 'undefined' ? window : this);
