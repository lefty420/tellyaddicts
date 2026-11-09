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

  var DAYPARTS = { tvarchive: TVARCHIVE, saturday: SATURDAY };

  /** Build a clock schedule for this channel, or null to use the ordinary shuffled loop. */
  function schedule(channelId, progs, seed) {
    var plan = DAYPARTS[channelId];
    if (!plan || !progs || progs.length < 4 || !root.Engine) return null;
    var blocks = [];
    plan.blocks.forEach(function (b) {
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
