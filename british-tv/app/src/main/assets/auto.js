/* Experimental "Auto EPG": builds a channel's programme list from archive.org keyword searches (1970-1999 only)
 * instead of the hand-picked sources in channels.js. Pure logic; app.js runs the searches, caches the result for the
 * day, removes duplicates and tops thin channels up from their normal sources. */
(function (root) {
  'use strict';

  // t = main keywords, alt = related shows / networks / synonyms for a second, different search.
  // len = [min, max] seconds for one programme. from = earliest year (music starts in 1980: no 1970s Top of the Pops).
  // show names from the scraper script's categories (tools/ keeps the same lists); used as extra search keywords
var SHOWS = {  // generated from tools/shows.json (the scraper script's categories) - keys are channel ids
  sitcoms: ['Fawlty Towers', 'Only Fools and Horses', 'Yes Minister', 'Yes Prime Minister', 'Blackadder', 'Porridge', 'Open All Hours', 'Steptoe and Son', 'Dads Army', 'Are You Being Served', 'Rising Damp', 'Whatever Happened to the Likely Lads', 'Some Mothers Do Ave Em', 'The Fall and Rise of Reginald Perrin', 'To the Manor Born', 'Birds of a Feather', 'One Foot in the Grave', 'Keeping Up Appearances', 'Terry and June', 'Ever Decreasing Circles', 'The Brittas Empire', 'Red Dwarf', 'Absolutely Fabulous', 'Vicar of Dibley', 'Drop the Dead Donkey', 'Bread', 'Butterflies', 'The Upper Hand', 'Chef', 'As Time Goes By', 'Waiting for God', 'Dear John'],
  gameshows: ['Gladiators', 'The Generation Game', 'Bullseye', 'Catchphrase', 'Blind Date', 'Blankety Blank', 'The Two Ronnies', 'The Benny Hill Show', 'Play Your Cards Right', 'Noels House Party', 'Family Fortunes', 'The Price is Right', 'Blockbusters', 'Countdown', '3-2-1', 'Strike It Lucky', 'The Crystal Maze', 'Surprise Surprise', 'Big Break', 'The Krypton Factor', 'Morecambe and Wise', 'Whose Line Is It Anyway', 'Vic Reeves Big Night Out', 'Shooting Stars', 'Through the Keyhole', 'Challenge Anneka', 'Pop Quiz', 'The Jack Docherty Show', 'The Paul Merton Show'],
  childrens: ['Grange Hill', 'Blue Peter', 'Byker Grove', 'Live and Kicking', 'Going Live', 'The Demon Headmaster', 'Knightmare', 'Press Gang', 'Maid Marian and her Merry Men', 'Chucklevision', 'Fun House', 'Art Attack', 'Childrens Ward', 'Worzel Gummidge', 'Catweazle', 'The Tomorrow People', 'Finders Keepers', 'How 2', 'Smart', 'The Really Wild Show', 'Newsround', 'The Adventure Game', 'Dark Towers', 'Look and Read', 'Words and Pictures', 'Badger Girl', 'Geordie Racer', 'Through The Dragons Eye', 'Earthwarp', 'Spywatch', 'Bernard\'s Watch', 'My Parents Are Aliens', 'The Queens Nose', 'Aquila', 'Bodger and Badger'],
  thebill: ['Inspector Morse', 'The Bill', 'Minder', 'A Touch of Frost', 'Bergerac', 'Auf Wiedersehen Pet', 'The Professionals', 'Taggart', 'Heartbeat', 'Juliet Bravo', 'Cracker', 'Prime Suspect', 'Casualty', 'Londons Burning', 'The Sweeney', 'Shoestring', 'Pie in the Sky', 'Lovejoy', 'Midsomer Murders', 'Silent Witness', 'Jonathan Creek', 'Dalziel and Pascoe', 'Wycliffe', 'Hetty Wainthropp Investigates', 'Spooks', 'Rebus', 'Hamish Macbeth', 'Dangerfield', 'City Central', 'The Cops', 'Ballykissangel', 'Peak Practice', 'Where the Heart Is', 'Upstairs Downstairs', 'I Claudius', 'The Agatha Christie Hour', 'Miss Marple', 'Agatha Christies Poirot'],
  music: ['The Chart Show', 'The Tube', 'The Word', 'Later with Jools Holland', 'CD UK', 'The Old Grey Whistle Test', 'Smash Hits Poll Winners', 'Rapido', 'Snub TV', 'Top of the Pops', 'The White Room', 'The O-Zone', 'The Hitman and Her', 'MTVs Most Wanted', 'Pop Quiz', 'Never Mind the Buzzcocks', 'Supersonic', 'Revolver', 'The Roxy', 'TFI Friday', 'Live Aid', 'Montreux Pop Festival', 'The 11 O\'Clock Show'],
  comedy: ['The Fast Show', 'Harry Enfield', 'French and Saunders', 'Bottom', 'Men Behaving Badly', 'Father Ted', 'The Vicar of Dibley', 'Absolutely Fabulous', 'Drop the Dead Donkey', 'Shooting Stars', 'The Day Today', 'Brass Eye', 'Spaced', 'Big Train', 'Smack the Pony', 'Goodness Gracious Me', 'The League of Gentlemen', 'A Bit of Fry and Laurie', 'Alas Smith and Jones', 'The Mary Whitehouse Experience', 'I\'m Alan Partridge', 'Black Books', 'Peep Show', 'The Royle Family', 'Dinnerladies', 'Game On', 'Goodnight Sweetheart', 'Not the Nine O Clock News', 'Spitting Image', 'Rab C Nesbitt', 'The High Life', 'Nightingales', 'The New Statesman', 'The Comic Strip Presents', 'Victoria Wood As Seen on TV'],
  tv70s: ['The Sweeney', 'Some Mothers Do Ave Em', 'Are You Being Served', 'The New Avengers', 'Blakes 7', 'Space 1999', 'Survivors', 'Citizen Smith', 'Man About the House', 'George and Mildred', 'Doctor Who', 'I Claudius', 'Upstairs Downstairs', 'Poldark', 'Dixon of Dock Green', 'The Tomorrow People', 'Return of the Saint', 'Secret Army', 'On the Buses', 'The Goodies', 'The Onedin Line', 'When the Boat Comes In', 'Crown Court', 'Follyfoot', 'Robin of Sherwood', 'Dick Turpin', 'The Persuaders', 'Department S', 'The Protectors', 'Jason King'],
  citv: ['Danger Mouse', 'Count Duckula', 'SuperTed', 'Bananaman', 'The Animals of Farthing Wood', 'The Raggy Dolls', 'The Dreamstone', 'Dogtanian', 'The Mysterious Cities of Gold', 'Penny Crayon', 'The Trap Door', 'Postman Pat', 'Fireman Sam', 'Thomas and Friends', 'The Wind in the Willows', 'The Shoe People', 'The Poddington Peas', 'Family-Ness', 'Jimbo and the Jet-Set', 'Willo the Wisp', 'Biker Mice from Mars', 'Teenage Mutant Hero Turtles', 'Rainbow', 'The Sooty Show', 'Pingu', 'Button Moon', 'The Raccoons', 'Chocky', 'The Box of Delights', 'Bod', 'Bagpuss', 'Paddington', 'The Wombles', 'Captain Pugwash', 'The Magic Roundabout', 'Chorlton and the Wheelies', 'Jamie and the Magic Torch', 'Morph', 'Bertha', 'TUGS']
};
var KIDS_LEN = [240, 2400], SHOW_LEN = [600, 7200], MUSIC_LEN = [90, 3600], FILM_LEN = [3000, 9000];
  var THEMES = {
    music: { t: ['top of the pops', 'the chart show', 'pop music', 'music video'], alt: ['smash hits', 'the tube', 'the word', 'chart show', 'pop quiz', 'live and kicking'], len: MUSIC_LEN, from: 1980 },
    mtv: { t: ['mtv', 'music video', 'music videos', 'video hits'], alt: ['the box', 'vh1', 'channel v', 'MTV Europe', 'yo mtv raps', 'headbangers ball'], len: MUSIC_LEN, from: 1980 },
    bbc: { t: ['bbc comedy', 'bbc drama', 'bbc light entertainment', 'bbc classic'], alt: ['blackadder', 'fawlty towers', 'only fools and horses', 'dads army', 'porridge', 'the good life', 'yes minister', 'doctor who'], len: SHOW_LEN },
    itvam: { t: ['tv-am', 'gmtv', 'itv morning', 'breakfast television', 'this morning'], alt: ['good morning britain', 'wide awake club', 'richard and judy', 'daybreak', 'the time the place', 'schofield'], len: [600, 10800] },
    sitcoms: { t: ['sitcom', 'british sitcom', 'situation comedy'], alt: ['are you being served', 'keeping up appearances', 'one foot in the grave', 'bread', 'allo allo', 'red dwarf', 'father ted', 'the vicar of dibley', 'birds of a feather'], len: [900, 3600] },
    gameshows: { t: ['game show', 'quiz show', 'gameshow', 'catchphrase', 'blockbusters'], alt: ['bullseye', 'the crystal maze', 'family fortunes', 'blind date', 'play your cards right', 'countdown', 'fifteen to one', 'supermarket sweep', 'the generation game'], len: [900, 5400] },
    thebill: { t: ['the bill', 'police drama', 'z cars', 'the sweeney'], alt: ['juliet bravo', 'dixon of dock green', 'heartbeat', 'taggart', 'prime suspect', 'inspector morse', 'cracker', 'between the lines'], len: [900, 7200] },
    drama: { t: ['drama series', 'detective drama', 'crime drama', 'itv drama'], alt: ['poirot', 'miss marple', 'inspector morse', 'bergerac', 'minder', 'the professionals', 'casualty', 'taggart', 'lovejoy', 'rumpole of the bailey'], len: [1500, 7200] },
    christmas: { t: ['christmas special', 'christmas tv', 'christmas edition'], alt: ['christmas day', 'christmas night', 'boxing day', 'new year special'], len: [900, 7200] },
    tv70s: { t: ['1970s television', 'classic tv 1970s', 'tv 1970s'], alt: ['on the buses', 'the sweeney', 'rising damp', 'the two ronnies', 'morecambe and wise', 'the goodies', 'steptoe and son'], len: [900, 5400], to: 1979 },
    itv: { t: ['itv', 'thames television', 'lwt', 'granada television', 'central television', 'yorkshire television', 'light entertainment'], alt: ['the bill', 'minder', 'poirot', 'bergerac', 'emmerdale', 'coronation street', 'family fortunes', 'blind date', 'game for a laugh', 'the krypton factor'], len: [900, 7200] },
    noel: { t: ["noel's house party", 'noels house party', 'noel edmonds', 'saturday night TV'], alt: ['noels house party', 'gotcha', 'deal or no deal', 'telly addicts', 'multi coloured swap shop', 'the late late breakfast show'], len: [900, 5400] },
    citv: { t: ['citv', 'childrens itv', 'childrens television', 'cartoon', 'childrens tv'], alt: ['knightmare', 'art attack', 'rainbow', 'tots tv', 'count duckula', 'danger mouse', 'bananaman', 'fun house', 'wizadora', 'roland rat'], len: KIDS_LEN },
    games: { t: ['gamesmaster', 'video games', 'bad influence', 'computer game show'], alt: ['games world', 'cge', 'sega saturn', 'nintendo', 'computer chronicles', 'GamesMaster', 'game on'], len: [300, 3600] },
    comedy: { t: ['comedy', 'sitcom', 'sketch show', 'stand up'], alt: ['the young ones', 'blackadder', 'bottom', 'harry enfield', 'french and saunders', 'the fast show', 'absolutely fabulous', 'spitting image', 'not the nine oclock news'], len: [900, 5400] },
    childrens: { t: ['childrens tv', 'kids tv', 'childrens programmes', 'cartoon series'], alt: ['swap shop', 'grange hill', 'jackanory', 'blue peter', 'newsround', 'byker grove', 'live and kicking', 'saturday superstore'], len: KIDS_LEN },
    kidsmovies: { t: ['childrens film', 'kids movie', 'animated film', 'family film'], alt: ['disney film', 'don bluth', 'animated feature', 'family movie', 'cartoon feature'], len: FILM_LEN },
    kidsxmas: { t: ['childrens christmas', 'christmas cartoon', 'christmas special cartoon'], alt: ['christmas cartoon', 'santa', 'rudolph', 'snowman', 'father christmas'], len: [240, 5400] },
    xmasmusic: { t: ['christmas top of the pops', 'christmas music video', 'christmas pop'], alt: ['christmas number one', 'band aid', 'wizzard', 'slade', 'last christmas', 'merry xmas everybody'], len: MUSIC_LEN, from: 1980 },
    offschool: { t: ["i'm off school", 'sick day tv', 'daytime childrens tv', 'schools programmes'], alt: ['daytime tv', 'schools tv', 'rainbow', 'playschool', 'words and pictures', 'you and me'], len: [240, 3600] },
    disney: { t: ['disney', 'walt disney', 'mickey mouse', 'disney cartoon'], alt: ['donald duck', 'goofy', 'ducktales', 'chip n dale', 'darkwing duck', 'gummi bears', 'talespin'], len: [240, 5400] }
  };

  // file-level filters: not an episode (trailers, DVD menus and whole-disc rips), or a year outside the era in the name
  var NOT_EPISODE = '\\b(trailer|sample|promo|intro|outro|extras?|bonus|menu|behind the scenes|interview|making of|dvd|disc|disk|complete (season|series)|box-?set|all episodes)\\b';
  var NOT_PROGRAMMES = '(trailer OR sample OR advert OR adverts OR commercial OR commercials OR promo OR interview OR "behind the scenes")';
  var OUT_OF_ERA = '(?<![0-9])(?:20[0-4][0-9]|19[0-6][0-9])(?![0-9])';

  /** Year-in-the-name filter for this channel's own era (music from 1980, 70s TV to 1979, otherwise 1970-1999). */
  function outOfEra(th) {
    var from = Math.floor((th.from || 1970) / 10) % 10, to = Math.floor((th.to || 1999) / 10) % 10;
    var parts = ['20[0-4][0-9]'];
    parts.push('19[0-' + (from - 1) + '][0-9]');
    if (to < 9) parts.push('19[' + (to + 1) + '-9][0-9]');
    return '(?<![0-9])(?:' + parts.join('|') + ')(?![0-9])';
  }

  function terms(list) { return list.map(function (k) { return '"' + k.replace(/"/g, '') + '"'; }).join(' OR '); }
  function altFor(channelId, th) { return SHOWS[channelId] || th.alt; }
  function has(channelId) { return !!THEMES[channelId]; }

  function q(kw, th, dated) {
    var s = 'mediatype:movies AND (title:(' + terms(kw) + ') OR subject:(' + terms(kw) + ')) AND NOT title:' + NOT_PROGRAMMES;
    if (dated) s += ' AND date:[' + (th.from || 1970) + '-01-01 TO ' + (th.to || 1999) + '-12-31]';
    return s;
  }

  /** The searches that replace a channel's fixed sources (null = no theme, keep the fixed sources). Three different
   *  searches so one popular upload can't dominate: main keywords, related shows, and undated uploads. */
  function sourcesFor(channelId) {
    var th = THEMES[channelId];
    if (!th) return null;
    var common = { minDur: th.len[0], maxDur: th.len[1], skipFile: NOT_EPISODE + '|' + outOfEra(th), skipTitle: outOfEra(th), group: 'auto', maxSize: 1500000000, requireEp: true };
    function src(search, rows, perItem) { var o = { search: search, rows: rows, perItem: perItem }; for (var k in common) o[k] = common[k]; return o; }
    return [
      src(q(th.t, th, true), 30, 6),
      src(q(altFor(channelId, th), th, true), 30, 6),
      src(q(th.t.concat(altFor(channelId, th)), th, false), 15, 3)
    ];
  }

  /* ---- genre guard: a show only belongs on channels of its own genre (no Miss Marple on CITV) ---- */
  function norm(t) {
    return ' ' + String(t || '').toLowerCase().replace(/&/g, ' and ').replace(/['\u2019`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '') + ' ';
  }
  var SHOW_CATS = {};                                    // normalised show name -> {category: true}
  Object.keys(SHOWS).forEach(function (cat) {
    SHOWS[cat].forEach(function (name) { var k = norm(name); (SHOW_CATS[k] = SHOW_CATS[k] || {})[cat] = true; });
  });
  var SHOW_KEYS = Object.keys(SHOW_CATS);
  var ALL = Object.keys(SHOWS);
  function except(list) { return ALL.filter(function (c) { return list.indexOf(c) < 0; }); }
  var KIDS = ['citv', 'childrens'];
  var ALLOWED = {
    sitcoms: ['sitcoms'], comedy: ['comedy', 'sitcoms'], gameshows: ['gameshows'], noel: ['gameshows'],
    thebill: ['thebill'], tv70s: ['tv70s'], music: ['music'], mtv: ['music'], xmasmusic: ['music'],
    citv: KIDS, childrens: KIDS, kidsxmas: KIDS, offschool: KIDS, disney: KIDS,
    bbc: except(KIDS.concat('music')), itv: except(KIDS.concat('music')), itvam: except(KIDS)
  };
  /** True unless the text names a known show and every show it names belongs to other genres than this channel's. */
  function genreOk(channelId, text) {
    var allow = ALLOWED[channelId];
    if (!allow) return true;
    var t = norm(text), hit = false;
    for (var i = 0; i < SHOW_KEYS.length; i++) {
      if (t.indexOf(' ' + SHOW_KEYS[i].trim() + ' ') < 0) continue;
      hit = true;
      var cats = SHOW_CATS[SHOW_KEYS[i]];
      for (var j = 0; j < allow.length; j++) if (cats[allow[j]]) return true;
    }
    return !hit;
  }

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  var Auto = { THEMES: THEMES, has: has, sourcesFor: sourcesFor, genreOk: genreOk, SHOWS: SHOWS, today: today, OUT_OF_ERA: OUT_OF_ERA, NOT_EPISODE: NOT_EPISODE };
  if (typeof module !== 'undefined' && module.exports) module.exports = Auto; else root.AUTO = Auto;
})(typeof window !== 'undefined' ? window : this);
