/* Experimental "Auto EPG": builds a channel's programme list from archive.org keyword searches (1970-1999 only)
 * instead of the hand-picked sources in channels.js. Pure logic; app.js runs the searches and caches the result daily. */
(function (root) {
  'use strict';

  // keywords per channel. Channels whose name says little (ITV, Drama...) get the kind of programmes they would have shown.
  var THEMES = {
    music: ['top of the pops', 'the chart show', 'pop music', 'music video'],
    mtv: ['mtv', 'music video', 'music videos', 'video hits'],
    bbc: ['bbc comedy', 'bbc drama', 'bbc light entertainment', 'bbc classic'],
    itvam: ['tv-am', 'gmtv', 'itv morning', 'breakfast television', 'this morning', 'good morning britain'],
    sitcoms: ['sitcom', 'british sitcom', 'situation comedy'],
    gameshows: ['game show', 'quiz show', 'gameshow', 'catchphrase', 'blockbusters', 'bullseye', 'the crystal maze'],
    thebill: ['the bill', 'police drama', 'z cars', 'the sweeney'],
    drama: ['drama series', 'detective drama', 'crime drama', 'itv drama'],
    christmas: ['christmas special', 'christmas tv', 'christmas edition'],
    tv70s: ['1970s television', 'classic tv 1970s', 'tv 1970s'],
    itv: ['itv', 'thames television', 'lwt', 'granada television', 'central television', 'yorkshire television', 'light entertainment'],
    noel: ["noel's house party", 'noels house party', 'noel edmonds', 'saturday night TV'],
    citv: ['citv', 'childrens itv', 'childrens television', 'cartoon', 'childrens tv'],
    games: ['gamesmaster', 'video games', 'bad influence', 'computer game show'],
    comedy: ['comedy', 'sitcom', 'sketch show', 'stand up'],
    childrens: ['childrens tv', 'kids tv', 'childrens programmes', 'cartoon series'],
    kidsmovies: ['childrens film', 'kids movie', 'animated film', 'family film'],
    kidsxmas: ['childrens christmas', 'christmas cartoon', 'christmas special cartoon'],
    xmasmusic: ['christmas top of the pops', 'christmas music video', 'christmas pop'],
    offschool: ["i'm off school", 'sick day tv', 'daytime childrens tv', 'schools programmes'],
    disney: ['disney', 'walt disney', 'mickey mouse', 'disney cartoon']
  };

  var KIDS = { citv: 1, childrens: 1, kidsmovies: 1, kidsxmas: 1, disney: 1, offschool: 1 };
  var NOT_PROGRAMMES = '(trailer OR sample OR advert OR adverts OR commercial OR commercials OR promo OR interview OR "behind the scenes")';
  // titles that name a year outside 1970-1999 are dropped (lookbehind keeps "1987" from matching inside a longer number)
  var OUT_OF_ERA = '(?<![0-9])(?:20[0-4][0-9]|19[0-6][0-9])(?![0-9])';

  function terms(list) { return list.map(function (k) { return '"' + k.replace(/"/g, '') + '"'; }).join(' OR '); }

  function has(channelId) { return !!THEMES[channelId]; }

  /** The searches that replace a channel's fixed sources (null = no theme, keep the fixed sources). */
  function sourcesFor(channelId) {
    var th = THEMES[channelId];
    if (!th) return null;
    var kw = terms(th);
    var base = 'mediatype:movies AND (title:(' + kw + ') OR subject:(' + kw + ')) AND date:[1970-01-01 TO 1999-12-31] AND NOT title:' + NOT_PROGRAMMES;
    var kids = !!KIDS[channelId];
    return [
      // the best-liked matches first, a handful of episodes from each so one item cannot take over
      { search: base, rows: 45, perItem: 6, minDur: kids ? 240 : 600, maxDur: kids ? 5400 : 7200, skipTitle: OUT_OF_ERA, group: 'auto' }
    ];
  }

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  var Auto = { THEMES: THEMES, has: has, sourcesFor: sourcesFor, today: today, OUT_OF_ERA: OUT_OF_ERA };
  if (typeof module !== 'undefined' && module.exports) module.exports = Auto; else root.AUTO = Auto;
})(typeof window !== 'undefined' ? window : this);
