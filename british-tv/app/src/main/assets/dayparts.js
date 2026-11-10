/* Daypart schedules: channels laid out against the clock instead of as one endless loop, so the same thing is
 * on at the same time every day, the way a real channel works.
 *
 * Each entry is { cycle, blocks, filler }. A block is { at: "18:00", exact: true, want: fn } and runs until the
 * next one starts; `want` says which of the channel's programmes belong in it. `exact` means it starts on the
 * dot, with short filler before it cut to fit, the way continuity fills up to the news.
 *
 * A block with nothing to put in it is dropped, and a channel whose blocks all come up empty falls back to the
 * ordinary shuffled loop, so a thin library never leaves a channel dead.
 */
(function (root) {
  'use strict';

  function norm(s) { return ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '; }
  /**
   * Is this one of these programmes? Matched on the show name the library gives, and only on the title when
   * there is no show name. A clip whose description happens to mention Newsnight is not Newsnight, and matching
   * on its text put one on air as the one o'clock news.
   */
  function mentions(list) {
    var keys = list.map(function (k) { return ' ' + k.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '; });
    return function (p) {
      var show = p.show || p.group || '';
      var t = norm(show || ((p.title || '') + ' ' + (p.sub || '')));
      for (var i = 0; i < keys.length; i++) if (t.indexOf(keys[i]) >= 0) return true;
      return false;
    };
  }
  function not(fn) { return function (p) { return !fn(p); }; }
  function any() { return true; }
  function shorter(sec) { return function (p) { return p.dur && p.dur <= sec; }; }

  // ---------------------------------------------------------------- TV Archive

  // The bulletins, national and regional. Newsround is here too: it was the news, just earlier and for children.
  var NEWS = mentions([
    'news at ten', 'news at 5 45', 'news at 545', 'one o clock news', 'six o clock news', 'nine o clock news',
    'ten o clock news', 'six oclock news', 'nine oclock news', 'bbc news', 'itn', 'itv news', 'channel 4 news',
    'newsnight', 'newsround', 'john craven', 'breakfast news', 'the news', 'news bulletin', 'news summary',
    'look north', 'look east', 'look west', 'thames news', 'granada reports', 'calendar news', 'central news',
    'anglia news', 'tyne tees', 'border news', 'points west', 'south today', 'midlands today', 'north west tonight',
    'reporting scotland', 'wales today', 'scotland today', 'ulster news', 'london tonight', 'thames at 6'
  ]);

  /** The BBC Archive clips: continuity between the programmes, not programmes in their own right. */
  function isClip(p) { return (p.group || p.show) === 'BBC Archive'; }
  /** Today's programmes: everything that is not a bulletin and not a clip. */
  function daytime(p) { return !NEWS(p) && !isClip(p); }

  var TVARCHIVE = {
    cycle: 'day',
    // the clips, and anything else short, fill the run-up to each bulletin
    filler: function (progs) { return progs.filter(function (p) { return isClip(p) || shorter(600)(p); }); },
    blocks: [
      { at: '06:00', want: daytime },
      { at: '13:00', exact: true, want: NEWS },
      { at: '13:30', want: daytime },
      { at: '18:00', exact: true, want: NEWS },
      { at: '18:30', want: daytime },
      { at: '22:00', exact: true, want: NEWS },
      { at: '22:30', want: daytime }
    ]
  };

  // ---------------------------------------------------------------- Saturday Night TV

  // The ones the evening was built around: the shows that got the 7-to-9 slot.
  var BIG = mentions([
    'noels house party', 'noel s house party', 'gladiators', 'blind date', 'the generation game',
    'generation game', 'stars in their eyes', 'beadles about', 'beadle s about', 'you bet',
    'the price is right', 'surprise surprise', 'game for a laugh', 'strike it lucky', 'big break',
    'catchphrase', 'family fortunes', 'bullseye', 'the krypton factor', 'blankety blank'
  ]);
  // after the big shows: what actually followed them on a Saturday night
  var LATE = mentions([
    'casualty', 'the two ronnies', 'tales of the unexpected', 'match of the day', 'parkinson',
    'aspel', 'film', 'the paul daniels magic show', 'paul daniels', 'jasper carrott', 'cannon and ball',
    'les dawson', 'russ abbot', 'the bob monkhouse show', 'hale and pace'
  ]);

  var SATURDAY = {
    cycle: 'day',
    filler: function (progs) { return progs.filter(shorter(900)); },
    blocks: [
      { at: '08:00', want: any },                                   // daytime: whatever the channel has
      { at: '17:30', want: function (p) { return !BIG(p) && !LATE(p); } },   // teatime, before the main event
      { at: '19:00', exact: true, want: BIG },                      // the 7-to-9 shows, starting on the hour
      { at: '21:00', want: LATE },                                  // after the watershed
      { at: '23:30', want: any }
    ]
  };

  // ---------------------------------------------------------------- The Video Shop

  /**
   * The watershed. A film plays by its certificate: family certificates through the day, 15s from eight, and
   * the 18s only after nine, as they were on television.
   *
   * A film with no certificate is treated as an 18, not as a U. The scraped list has had pornography in it, and
   * an unknown certificate is exactly the case that cannot be vouched for, so it waits until after nine rather
   * than being given the benefit of the doubt in the middle of the afternoon.
   */
  function certOf(p) { return String(p.cert || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); }
  var DAYTIME = { U: 1, UC: 1, PG: 1, '12': 1, '12A': 1, G: 1, TVY: 1, TVG: 1, TVPG: 1 };
  // R is the American 15-to-18; it waits for the watershed with them, rather than going out at eight
  var EVENING = { '15': 1, PG13: 1, TV14: 1 };
  function familyFilm(p) { return !!DAYTIME[certOf(p)]; }
  function eveningFilm(p) { return !!EVENING[certOf(p)]; }
  function lateFilm(p) { var c = certOf(p); return !DAYTIME[c] && !EVENING[c]; }   // 18, NC17, X, and the unknown

  var VIDEOSHOP = {
    cycle: 'day',
    filler: function (progs) { return progs.filter(shorter(900)); },
    blocks: [
      // the watershed runs from nine at night to half past five in the morning, so the family films start there
      { at: '05:30', exact: true, want: familyFilm },
      { at: '20:00', want: function (p) { return eveningFilm(p) || familyFilm(p); } },
      { at: '21:00', exact: true, want: lateFilm },             // the watershed, on the hour
      { at: '01:00', want: function (p) { return lateFilm(p) || eveningFilm(p); } }
    ]
  };

  // ---------------------------------------------------------------- Drama

  // The Bill is most of what the channel has, so it gets its own slot rather than swamping the day. It was an
  // eight o'clock programme; the rest of the evening is the heavier crime and the serials.
  var BILL = mentions(['the bill']);
  // Gentle and period drama: the daytime and early-evening end of the schedule
  var GENTLE = mentions([
    'heartbeat', 'ballykissangel', 'hamish macbeth', 'hetty wainthropp', 'pie in the sky', 'lovejoy',
    'peak practice', 'where the heart is', 'juliet bravo', 'upstairs downstairs', 'miss marple',
    'agatha christies poirot', 'agatha christie hour', 'casualty', 'jonathan creek', 'londons burning',
    'auf wiedersehen pet', 'a touch of frost', 'midsomer murders'
  ]);
  // The grown-up end: after the watershed
  var DARK = mentions([
    'inspector morse', 'prime suspect', 'cracker', 'the professionals', 'the sweeney', 'bergerac', 'minder',
    'spooks', 'silent witness', 'rebus', 'taggart', 'dalziel and pascoe', 'wycliffe', 'dangerfield',
    'city central', 'the cops', 'shoestring', 'i claudius'
  ]);

  var DAY = 86400;
  function secs(h, m) { return h * 3600 + m * 60; }
  function ceil5(sec) { return Math.ceil(sec / 300) * 300; }
  function seedOf(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shuffled(list, seed) {
    var a = list.slice(), x = seed || 1;
    for (var i = a.length - 1; i > 0; i--) {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      var j = x % (i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** The Bill has hundreds of episodes and most of the other dramas have a handful, so left alone it takes over.
   *  It is capped at BILL_PER_DAY a day, a different set each day of the week: one at teatime, then the eight
   *  o'clock slot. Everything else in the day is the other dramas. */
  var BILL_PER_DAY = 3;
  var DRAMA = {
    cycle: 'week',
    filler: function (progs) { return progs.filter(shorter(900)); },
    make: function (progs, seed) {
      var bills = progs.filter(function (p) { return BILL(p) && p.dur >= 1200 && p.dur <= 3300; });
      bills = shuffled(bills, seedOf(String(seed) + 'bill'));
      var gentle = progs.filter(function (p) { return GENTLE(p) && !BILL(p); });
      var dark = progs.filter(function (p) { return DARK(p) && !BILL(p); });
      var rest = progs.filter(function (p) { return !BILL(p); });
      if (!gentle.length) gentle = rest;
      if (!dark.length) dark = rest;
      var blocks = [];
      for (var d = 0; d < 7; d++) {
        var o = d * DAY, n = bills.length, pick = [];
        for (var k = 0; k < BILL_PER_DAY && n; k++) pick.push(bills[(d * BILL_PER_DAY + k) % n]);
        blocks.push({ at: o + secs(6, 0), items: gentle });
        var a = pick[0];
        if (a) {
          // one Bill at half past six, then back to the others until eight
          var aEnd = secs(18, 30) + ceil5(a.dur);
          blocks.push({ at: o + secs(17, 30), items: gentle });
          blocks.push({ at: o + secs(18, 30), exact: true, items: [a] });
          blocks.push({ at: o + aEnd, exact: true, items: gentle });
        } else {
          blocks.push({ at: o + secs(17, 30), items: gentle });
        }
        if (pick.length > 1) blocks.push({ at: o + secs(20, 0), exact: true, items: pick.slice(1) });
        else blocks.push({ at: o + secs(20, 0), exact: true, items: gentle });
        blocks.push({ at: o + secs(21, 0), exact: true, items: dark });      // after the watershed
        blocks.push({ at: o + secs(23, 0), items: dark });
      }
      return blocks;
    }
  };

  // ---------------------------------------------------------------- Soaps

  var NEIGHBOURS = mentions(['neighbours']);
  var HOMEAWAY = mentions(['home and away']);
  var CROSSROADS = mentions(['crossroads']);
  var EASTENDERS = mentions(['eastenders']);
  var EMMERDALE = mentions(['emmerdale']);
  var CORRIE = mentions(['coronation street', 'brookside', 'hollyoaks', 'albion market']);
  function named(p) { return NEIGHBOURS(p) || HOMEAWAY(p) || CROSSROADS(p) || EASTENDERS(p) || EMMERDALE(p) || CORRIE(p); }

  /** Each soap at about the time it went out: Neighbours at lunch and teatime, Crossroads and Home and Away early
   *  evening, Emmerdale at seven, EastEnders at half past, and the rest of the evening's serials after them. A
   *  soap the library has only a few episodes of is topped up from the others rather than repeating itself. */
  var SOAPS = {
    cycle: 'day',
    filler: function (progs) { return progs.filter(shorter(900)); },
    make: function (progs) {
      var rest = progs.filter(function (p) { return !named(p); });
      function pool(want, min) {
        var items = progs.filter(want);
        return items.length >= (min || 1) ? (items.length >= 6 || !rest.length ? items : items.concat(rest)) : [];
      }
      // the daytime and late-night serials: the smaller soaps, with Crossroads (by far the biggest) to stop them repeating
      var all = rest.concat(progs.filter(CROSSROADS));
      if (!all.length) all = progs;
      var plan = [
        [secs(6, 0), false, all],                               // daytime: the soaps that had no fixed slot
        [secs(13, 45), true, pool(NEIGHBOURS)],                 // lunchtime Neighbours
        [secs(14, 15), false, all],
        [secs(17, 0), false, pool(CROSSROADS)],                 // the early-evening ITV serial
        [secs(17, 35), true, pool(NEIGHBOURS)],                 // teatime Neighbours
        [secs(18, 5), false, pool(HOMEAWAY)],
        [secs(19, 0), true, pool(EMMERDALE)],
        [secs(19, 30), true, pool(EASTENDERS)],
        [secs(20, 0), true, pool(CORRIE)],
        [secs(20, 30), false, all]                              // the rest of the night, until six
      ];
      return plan.filter(function (b) { return b[2].length; }).map(function (b) { return { at: b[0], exact: b[1], items: b[2] }; });
    }
  };

  var DAYPARTS = { tvarchive: TVARCHIVE, saturday: SATURDAY, videoshop: VIDEOSHOP, thebill: DRAMA, soaps: SOAPS };

  /** Build a clock schedule for this channel, or null to use the ordinary shuffled loop. */
  function schedule(channelId, progs, seed) {
    var plan = DAYPARTS[channelId];
    if (!plan || !progs || progs.length < 4 || !root.Engine) return null;
    var blocks = [];
    if (plan.make) blocks = plan.make(progs, seed);          // a plan that needs more than "which programmes fit"
    else plan.blocks.forEach(function (b) {
      var items = progs.filter(b.want);
      if (items.length) blocks.push({ at: b.at, exact: b.exact, items: items });
    });
    if (blocks.length < 2) return null;                   // nothing to shape: an ordinary loop is more honest
    var filler = plan.filler ? plan.filler(progs) : [];
    return root.Engine.buildClockSchedule(blocks, filler.length ? filler : progs, seed, plan.cycle);
  }

  var Dayparts = { has: function (id) { return !!DAYPARTS[id]; }, schedule: schedule, isNews: NEWS };
  if (typeof module !== 'undefined' && module.exports) module.exports = Dayparts; else root.DAYPARTS = Dayparts;
})(typeof window !== 'undefined' ? window : this);
