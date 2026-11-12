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
    kids: { count: 2, breakSec: 90, maxDur: 150, kw: ['toy', 'toys', 'board game', 'action figure', 'sweets', 'chocolate', 'cereal', 'crisps', 'lego', 'barbie', 'transformers'] },
    games: { count: 2, breakSec: 90, maxDur: 150, kw: ['sega', 'nintendo', 'snes', 'mega drive', 'megadrive', 'playstation', 'game boy', 'gameboy', 'amiga', 'atari', 'video game'] },
    music: { count: 2, breakSec: 60, maxDur: 150, kw: ['now that\'s what i call music', 'now thats what i call music', 'compilation album', 'cassette', 'cd', 'album', 'hits'] },
    daytime: { count: 2, breakSec: 120, maxDur: 150, kw: ['cleaning', 'washing powder', 'detergent', 'food', 'supermarket', 'tesco', 'sainsbury', 'magazine', 'household', 'biscuits'] },
    // standard commercial breaks: ITV, Channel 4, Channel 5, Sky and cable (never the BBC, which has no adverts)
    prime: { count: 1, breakSec: 180, maxDur: 420, kw: ['itv', 'channel 4', 'channel 5', 'sky', 'cable', 'commercial break', 'ad break', 'adverts', 'commercials'] }
  };

  // channel id -> advert genre. No entry = no adverts (Classic BBC: the BBC has none; Adverts & Continuity is adverts already).
  var CHANNEL_CAT = {
    citv: 'kids', childrens: 'kids', kidsxmas: 'kids',   // no breaks on the film channels (kidsmovies, disney, videoshop)
    games: 'games',
    music: 'music', mtv: 'music', xmasmusic: 'music',
    itvam: 'daytime', offschool: 'daytime',
    comedy: 'prime', sitcoms: 'prime', drama: 'prime', gameshows: 'prime', tv70s: 'prime', tv80s: 'prime', tv90s: 'prime', noel: 'prime', cooking: 'prime', entertainment: 'prime', ussitcoms: 'prime',
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
      add('g', 'all', true, 12);
    } else {
      add('uk', eraId, true, 30);
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
    if (prog.year) {                                  // from the checked catalogue: the year is known
      if (prog.year < 1970 || prog.year > 1999) return false;
      return eraId === 'all' || String(Math.floor((prog.year - 1900) / 10) * 10) === eraId;
    }
    var t = (prog.title || '') + ' ' + (prog.item || '');
    if (/\bBBC\b/i.test(t) || US_RE.test(t) || MODERN_RE.test(t)) return false;
    var e = eraOf(prog.title) || eraOf(prog.item);
    if (e === 'other') return false;
    // an advert whose year cannot be shown is never played: its title says the year, the archive's own date says it
    // (the '-d' searches), or a person picked it by hand
    if (eraId === 'all') return e === '70' || e === '80' || e === '90' || (e === null && (prog.trusted || /-d$/.test(prog.group || '')));
    return e === eraId || (e === null && /-d$/.test(prog.group || ''));   // no year in the title: only if the search was by the item's date
  }

  function filterPool(progs, eraId) { return (progs || []).filter(function (p) { return accept(p, eraId); }); }

  // which of the catalogue's categories suit which kind of channel (prime takes everything)
  var CAT_FITS = {
    kids: ['toys', 'sweets', 'food', 'games', 'tv-promo', 'film', 'music', 'charity'],
    games: ['games', 'toys', 'tv-promo', 'film', 'music'],
    music: ['music', 'film', 'tv-promo', 'telecoms', 'drink', 'retail'],
    daytime: ['household', 'food', 'retail', 'health', 'finance', 'telecoms', 'charity', 'sweets', 'cars']
  };
  /** The checked catalogue (adverts.json) -> adverts for one kind of channel and the era chosen. */
  function fromCatalogue(list, cat, eraId) {
    var fits = CAT_FITS[cat], out = [];
    (list || []).forEach(function (a) {
      if (!a || !a.url || !a.year || !(a.dur > 0) || a.dur >= 300 || (a.region && a.region !== 'uk')) return;
      if (fits && !(a.cat || []).some(function (c) { return fits.indexOf(c) >= 0; })) return;
      var p = { id: a.url, item: a.brand || '', url: a.url, title: a.title, sub: '', dur: a.dur, year: a.year,
                restricted: !!a.restricted, brand: a.brand || '', group: 'uk-c' };
      if (accept(p, eraId)) out.push(p);
    });
    return out;
  }

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
                group: dated ? 'uk-d' : 'uk-u', trusted: true };
      if (accept(p, eraId)) out.push(p);
    });
    return out;
  }

  /** The year a title names (1970-1999), or 0. */
  function yearOf(title) {
    var re = /(?:^|[^0-9])(19[7-9]\d)(?![0-9])/.exec(String(title || ''));
    return re ? +re[1] : 0;
  }
  // Drink, tobacco and gambling: kept out of children's and daytime breaks, and out of anything before the 9pm watershed
  var RESTRICTED = /\b(beer|lager|bitter|stout|cider|whisky|whiskey|vodka|gin|rum|wine|guinness|carling|heineken|stella|cigarette|cigarettes|silk cut|benson|embassy|marlboro|rothmans|lottery|bingo|casino|betting|bookmaker|ladbrokes|coral)\b/i;
  function allowedAt(prog, cat, hour) {
    if (prog.restricted) return cat === 'prime' && hour >= 21;
    if (prog.year) return true;                       // the catalogue says what is restricted; titles are not searched
    if (!RESTRICTED.test((prog.title || '') + ' ' + (prog.item || ''))) return true;
    return cat === 'prime' && hour >= 21;
  }

  /** Pick the next advert. opts: { year: the year of what just played (0 = unknown), cat, hour, last: url of the
   *  advert that just ran, recent: urls played lately }. Near that year first (within three), then the same decade,
   *  then ones with no year; UK-collection ones about 4 times in 5; never one played lately. */
  function pickNext(pool, lastUrl, opts) {
    if (!pool || !pool.length) return null;
    opts = opts || {};
    var recent = opts.recent || [];
    var ok = pool.filter(function (p) { return allowedAt(p, opts.cat, opts.hour == null ? 12 : opts.hour); });
    if (!ok.length) return null;
    var fresh = ok.filter(function (p) { return p.url !== lastUrl && recent.indexOf(p.url) < 0; });
    if (fresh.length) ok = fresh;
    var y = opts.year || 0;
    if (y) {
      var near = ok.filter(function (p) { var py = p.year || yearOf(p.title) || yearOf(p.item); return py && Math.abs(py - y) <= 3; });
      var dec = ok.filter(function (p) { var py = p.year || yearOf(p.title) || yearOf(p.item); return py && Math.floor(py / 10) === Math.floor(y / 10); });
      if (near.length && Math.random() < 0.85) ok = near;
      else if (dec.length) ok = dec;
    }
    var uk = ok.filter(function (p) { return /^uk-/.test(p.group || ''); });
    var from = uk.length && Math.random() < 0.8 ? uk : ok;
    var i = Math.floor(Math.random() * from.length);
    if (from.length > 1 && from[i].url === lastUrl) i = (i + 1) % from.length;
    return from[i];
  }

  var Ads = { ERAS: ERAS, CATS: CATS, categoryFor: categoryFor, fixedFor: fixedFor, eraIndex: eraIndex, buildQuery: buildQuery,
    sourcesFor: sourcesFor, fromCatalogue: fromCatalogue, eraOf: eraOf, yearOf: yearOf, allowedAt: allowedAt, accept: accept, filterPool: filterPool, pickNext: pickNext };
  if (typeof module !== 'undefined' && module.exports) module.exports = Ads; else root.ADS = Ads;
})(typeof window !== 'undefined' ? window : this);
