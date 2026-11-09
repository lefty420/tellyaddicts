/* Experimental "Auto EPG": builds a channel's programme list from archive.org keyword searches (1970-1999 only)
 * instead of the hand-picked sources in channels.js. Pure logic; app.js runs the searches, caches the result for the
 * day, removes duplicates and tops thin channels up from their normal sources. */
(function (root) {
  'use strict';

  // t = main keywords, alt = related shows / networks / synonyms for a second, different search.
  // len = [min, max] seconds for one programme. from = earliest year (music starts in 1980: no 1970s Top of the Pops).
  // show names from the scraper script's categories (tools/ keeps the same lists); used as extra search keywords
var SHOWS = {  // written by tools/make_shows.py from tools/shows.json (the contract with the scraper).
               // Song and film categories are left out: everything in them is filed under one name,
               // so it says nothing about genre. Run the script after editing shows.json.
  sitcoms: ['Fawlty Towers', 'Only Fools and Horses', 'Yes Minister', 'Yes Prime Minister', 'Blackadder', 'Porridge', 'Open All Hours', 'Steptoe and Son', 'Dads Army', 'Are You Being Served', 'Rising Damp', 'Whatever Happened to the Likely Lads', 'Some Mothers Do Ave Em', 'The Fall and Rise of Reginald Perrin', 'To the Manor Born', 'Birds of a Feather', 'One Foot in the Grave', 'Keeping Up Appearances', 'Terry and June', 'Ever Decreasing Circles', 'The Brittas Empire', 'Red Dwarf', 'Absolutely Fabulous', 'Vicar of Dibley', 'Drop the Dead Donkey', 'Bread', 'Butterflies', 'The Upper Hand', 'Chef', 'As Time Goes By', 'Waiting for God', 'Dear John'],
  gameshows: ['Gladiators', 'The Generation Game', 'Bullseye', 'Catchphrase', 'Blind Date', 'Blankety Blank', 'The Two Ronnies', 'The Benny Hill Show', 'Play Your Cards Right', 'Noels House Party', 'Family Fortunes', 'The Price is Right', 'Blockbusters', 'Countdown', '3-2-1', 'Strike It Lucky', 'The Crystal Maze', 'Surprise Surprise', 'Big Break', 'The Krypton Factor', 'Morecambe and Wise', 'Whose Line Is It Anyway', 'Vic Reeves Big Night Out', 'Shooting Stars', 'Through the Keyhole', 'Challenge Anneka', 'Pop Quiz', 'The Jack Docherty Show', 'The Paul Merton Show', 'Strike It Rich', 'Wheel of Fortune', 'Don\'t Forget Your Toothbrush', 'Who Wants to Be a Millionaire', 'You Bet', 'Bob\'s Full House', 'Every Second Counts', 'Name That Tune', 'Take Your Pick', 'Sale of the Century', 'Winner Takes All', 'Gambit', 'Mr and Mrs', 'Love at First Sight', 'Man O Man', 'Raise the Roof', 'Lucky Numbers', 'Wipeout', 'Full Swing', 'Pot Black', 'Superstars', 'The Indoor League', 'It\'s a Knockout', 'Treasure Hunt', 'Fort Boyard', 'Scrapheap Challenge', 'Don\'t Try This at Home', 'Ice Warriors', 'National Lottery Who Dares Wins', 'A Question of Sport', 'Mastermind', 'University Challenge', 'Fifteen to One', 'Connections', 'Turnabout', 'The Weakest Link', 'Brainteaser', 'Grand Slam', 'Telly Addicts', 'The Movie Game', 'Film Buff of the Year', 'Screen Test', 'Top of the Form', 'Jeopardy', 'The Pyramid Game', 'Supermarket Sweep', 'Win Lose or Draw', 'Lucky Ladders', 'The Zodiac Game', 'Keynotes', 'Crosswits', 'Chain Letters', 'All Clued Up', 'Second Guess', 'Whittle', 'Small Talk', 'Runway', 'Scrabble', 'Cluedo', 'Masterchef', 'Pass the Buck', 'Going For A Song', 'Jukebox Jury', 'Sounds Familiar', 'The Alphabet Game', 'GamesMaster', 'Cyberzone', 'Call My Bluff', 'Have I Got News for You', 'They Think It\'s All Over', 'Celebrity Squares', 'Give Us a Clue', 'Jokers Wild', 'Face the Music', 'It\'s Only TV But I Like It', 'Punchlines', 'If I Ruled the World', 'Cheggers Plays Pop', 'Crackerjack', 'Runaround', 'Get Your Own Back', 'We Are the Champions', 'Beat the Teacher', 'First Class', 'Interceptor', 'Incredible Games', 'Jungle Run'],
  childrens: ['Grange Hill', 'Blue Peter', 'Byker Grove', 'Live and Kicking', 'Going Live', 'The Demon Headmaster', 'Knightmare', 'Press Gang', 'Maid Marian and her Merry Men', 'Chucklevision', 'Fun House', 'Art Attack', 'Childrens Ward', 'Worzel Gummidge', 'Catweazle', 'The Tomorrow People', 'Finders Keepers', 'How 2', 'Smart', 'The Really Wild Show', 'Newsround', 'The Adventure Game', 'Dark Towers', 'Look and Read', 'Words and Pictures', 'Badger Girl', 'Geordie Racer', 'Through The Dragons Eye', 'Earthwarp', 'Spywatch', 'Bernard\'s Watch', 'My Parents Are Aliens', 'The Queens Nose', 'Aquila', 'Bodger and Badger'],
  thebill: ['Inspector Morse', 'The Bill', 'Minder', 'A Touch of Frost', 'Bergerac', 'Auf Wiedersehen Pet', 'The Professionals', 'Taggart', 'Heartbeat', 'Juliet Bravo', 'Cracker', 'Prime Suspect', 'Casualty', 'Londons Burning', 'The Sweeney', 'Shoestring', 'Pie in the Sky', 'Lovejoy', 'Midsomer Murders', 'Silent Witness', 'Jonathan Creek', 'Dalziel and Pascoe', 'Wycliffe', 'Hetty Wainthropp Investigates', 'Spooks', 'Rebus', 'Hamish Macbeth', 'Dangerfield', 'City Central', 'The Cops', 'Ballykissangel', 'Peak Practice', 'Where the Heart Is', 'Upstairs Downstairs', 'I Claudius', 'The Agatha Christie Hour', 'Miss Marple', 'Agatha Christies Poirot'],
  music: ['The Chart Show', 'The Tube', 'The Word', 'Later with Jools Holland', 'CD UK', 'The Old Grey Whistle Test', 'Smash Hits Poll Winners', 'Rapido', 'Snub TV', 'Top of the Pops', 'The White Room', 'The O-Zone', 'The Hitman and Her', 'MTVs Most Wanted', 'Pop Quiz', 'Never Mind the Buzzcocks', 'Supersonic', 'Revolver', 'The Roxy', 'TFI Friday', 'Live Aid', 'Montreux Pop Festival', 'The 11 O\'Clock Show'],
  comedy: ['The Fast Show', 'Harry Enfield', 'French and Saunders', 'Bottom', 'Men Behaving Badly', 'Father Ted', 'The Vicar of Dibley', 'Absolutely Fabulous', 'Drop the Dead Donkey', 'Shooting Stars', 'The Day Today', 'Brass Eye', 'Spaced', 'Big Train', 'Smack the Pony', 'Goodness Gracious Me', 'The League of Gentlemen', 'A Bit of Fry and Laurie', 'Alas Smith and Jones', 'The Mary Whitehouse Experience', 'I\'m Alan Partridge', 'Black Books', 'Peep Show', 'The Royle Family', 'Dinnerladies', 'Game On', 'Goodnight Sweetheart', 'Not the Nine O Clock News', 'Spitting Image', 'Rab C Nesbitt', 'The High Life', 'Nightingales', 'The New Statesman', 'The Comic Strip Presents', 'Victoria Wood As Seen on TV'],
  tv70s: ['The Sweeney', 'Some Mothers Do Ave Em', 'Are You Being Served', 'The New Avengers', 'Blakes 7', 'Space 1999', 'Survivors', 'Citizen Smith', 'Man About the House', 'George and Mildred', 'Doctor Who', 'I Claudius', 'Upstairs Downstairs', 'Poldark', 'Dixon of Dock Green', 'The Tomorrow People', 'Return of the Saint', 'Secret Army', 'On the Buses', 'The Goodies', 'The Onedin Line', 'When the Boat Comes In', 'Crown Court', 'Follyfoot', 'Robin of Sherwood', 'Dick Turpin', 'The Persuaders', 'Department S', 'The Protectors', 'Jason King'],
  citv: ['Danger Mouse', 'Count Duckula', 'SuperTed', 'Bananaman', 'The Animals of Farthing Wood', 'The Raggy Dolls', 'The Dreamstone', 'Dogtanian', 'The Mysterious Cities of Gold', 'Penny Crayon', 'The Trap Door', 'Postman Pat', 'Fireman Sam', 'Thomas and Friends', 'The Wind in the Willows', 'The Shoe People', 'The Poddington Peas', 'Family-Ness', 'Jimbo and the Jet-Set', 'Willo the Wisp', 'Biker Mice from Mars', 'Teenage Mutant Hero Turtles', 'Rainbow', 'The Sooty Show', 'Pingu', 'Button Moon', 'The Raccoons', 'Chocky', 'The Box of Delights', 'Bod', 'Bagpuss', 'Paddington', 'The Wombles', 'Captain Pugwash', 'The Magic Roundabout', 'Chorlton and the Wheelies', 'Jamie and the Magic Torch', 'Morph', 'Bertha', 'TUGS', 'Transformers', 'M.A.S.K.', 'Bravestarr', 'He-Man', 'She-Ra', 'ThunderCats', 'SilverHawks', 'Centurions', 'Jayce and the Wheeled Warriors', 'Visionaries', 'G.I. Joe', 'Action Force', 'Inhumanoids', 'Dino-Riders', 'Ring Raiders', 'C.O.P.S.', 'Spiral Zone', 'Sky Commanders', 'Sectaurs', 'Pole Position', 'Mighty Orbots', 'Robotech', 'Voltron', 'Starcom', 'The Real Ghostbusters', 'Extreme Ghostbusters', 'Captain Power and the Soldiers of the Future', 'Exosquad', 'Mighty Max', 'Gargoyles', 'Street Sharks', 'Extreme Dinosaurs', 'Bureau of Alien Detectors', 'WildC.A.T.s', 'Wing Commander Academy', 'The Bots Master', 'Skeleton Warriors', 'Monster Force', 'Bucky O\'Hare', 'Captain Simian', 'Cadillacs and Dinosaurs', 'X-Men', 'Batman The Animated Series', 'Spider-Man The Animated Series', 'The Incredible Hulk', 'Iron Man', 'Fantastic Four', 'Superman The Animated Series', 'The New Adventures of Batman', 'Defenders of the Earth', 'The Tick', 'The Mask', 'Ace Ventura', 'Dumb and Dumber', 'Police Academy', 'Toxic Crusaders', 'Swat Kats', 'The Pirates of Dark Water', 'Conan the Adventurer', 'Double Dragon', 'Mortal Kombat Defenders of the Realm', 'Street Fighter', 'Ultraforce', 'The Savage Dragon', 'Moo Mesa', 'ReBoot', 'Beast Wars', 'Sonic the Hedgehog', 'Adventures of Sonic the Hedgehog', 'Sonic Underground', 'Super Mario Bros', 'Super Mario World', 'Captain N', 'Mega Man', 'Earthworm Jim', 'Where on Earth Is Carmen Sandiego', 'Jonny Quest', 'The Real Adventures of Jonny Quest', 'Action Man', 'Max Steel', 'Pocket Dragon', 'Monster Rancher', 'Pokemon', 'Digimon', 'Dragon Ball Z', 'Sailor Moon', 'Samurai Pizza Cats', 'Guyver', 'Captain Planet', 'The Get Along Gang', 'Care Bears', 'Teddy Ruxpin', 'The New Adventures of He-Man', 'G.I. Joe Extreme', 'Phantom 2040', 'Flash Gordon', 'Prince Valiant', 'The Legend of Zelda', 'Teknoman', 'RoboCop Alpha Commando', 'Jumanji', 'Godzilla The Series', 'Men in Black The Series', 'The Mummy The Animated Series', 'Roughnecks', 'Roswell Conspiracies', 'Big Guy and Rusty', 'Cybersix', 'Shadow Raiders', 'War Planets', 'Dungeons & Dragons', 'Dungeons and Dragons', 'The Flintstone Kids', 'Ed Grimley', 'Beetlejuice', 'Bill & Ted', 'Back to the Future', 'Peter Pan and the Pirates', 'James Bond Jr', 'The Addams Family', 'Casper', 'Tales from the Cryptkeeper', 'Jakers', 'The New Adventures of Flash Gordon', 'Blackstar', 'The Lone Ranger'],
  offschool: ['Sons and Daughters', 'Neighbours', 'Home and Away', 'Kilroy', 'Trisha', 'Jerry Springer', 'The Jerry Springer Show', 'Jenny Jones', 'The Jenny Jones Show', 'This Morning', 'GMTV', 'Richard and Judy', 'The Time The Place', 'Pebble Mill at One', 'Going for Gold', 'Ricki Lake', 'Montel Williams', 'Open Air', 'Good Morning Britain', 'Lorraine', 'TV-am'],
  games: ['GamesMaster', 'Bad Influence', 'Cybernet', 'Games World'],
  mtv: ['Yo! MTV Raps', 'Headbangers Ball', '120 Minutes', 'Beavis and Butt-Head', 'MTV Unplugged', 'MTV Most Wanted', 'MTV Europe', 'The Real World', 'Alternative Nation', 'MTV News', 'Celebrity Deathmatch', 'Daria', 'Singled Out', 'MTV Dance', 'MTV Select', 'The Grind'],
  disney: ['Mickey Mouse', 'Donald Duck', 'Goofy', 'Pluto', 'Chip \'n\' Dale', 'Chip n Dale', 'Silly Symphonies', 'Minnie Mouse', 'Daisy Duck', 'Huey Dewey and Louie', 'Humphrey the Bear', 'Figaro', 'Scrooge McDuck', 'The Three Caballeros', 'Ludwig Von Drake'],
  saturday: ['Noels House Party', 'The Generation Game', 'Blind Date', 'Gladiators', 'Beadles About', 'Stars in Their Eyes', 'The Paul Daniels Magic Show', 'The Two Ronnies', 'Casualty', 'You Bet', 'Game for a Laugh', 'Surprise Surprise', 'The Price is Right', 'Big Break', 'Catchphrase', 'Jim\'ll Fix It', 'The Russ Abbot Show', 'Cannon and Ball', 'Jasper Carrott', 'Tales of the Unexpected', 'Match of the Day', 'Parkinson', 'Aspel and Company', 'Bob Monkhouse', 'Hale and Pace', '3-2-1', 'Strike It Lucky', 'Bullseye', 'The Krypton Factor', 'Blankety Blank', 'Punchlines', 'Play Your Cards Right'],
  tvarchive: ['News at Ten', 'The One O\'Clock News', 'The Six O\'Clock News', 'The Nine O\'Clock News', 'The Ten O\'Clock News', 'BBC News', 'ITN News', 'ITV News', 'Channel 4 News', 'Newsnight', 'Newsround', 'John Craven\'s Newsround', 'Breakfast News', 'Look North', 'Look East', 'Look West', 'Points West', 'South Today', 'Midlands Today', 'North West Tonight', 'Reporting Scotland', 'Wales Today', 'Scotland Today', 'Thames News', 'Granada Reports', 'Calendar', 'Central News', 'Anglia News', 'Tyne Tees News', 'Border News', 'London Tonight', 'BBC Archive']
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
    // Films as they went out on telly or were taped off it. Every film is filed under the one show name "Movies",
    // so the genre guard is deliberately left off this channel (ALLOWED has no entry): a film's own title says
    // nothing about the category it belongs to, and matching one would only throw good films away.
    movies: { t: ['feature film', 'tv movie', 'film premiere'], alt: ['the big film', 'friday night film', 'sunday matinee', 'film of the week', 'late night film'], len: FILM_LEN },
    saturday: { t: ['saturday night tv', 'light entertainment', 'saturday evening'], alt: ['noels house party', 'gladiators', 'blind date', 'the generation game', 'beadles about', 'stars in their eyes', 'you bet'], len: [900, 5400] },
    // news and programmes from today's date, whatever the year; app.js keeps only what went out on this day
    tvarchive: { t: ['news at ten', 'bbc news', 'itn news', 'newsnight', 'newsround'], alt: ['the nine o clock news', 'channel 4 news', 'breakfast news', 'bbc archive', 'thames news', 'granada reports'], len: [60, 5400] },
    kidsxmas: { t: ['childrens christmas', 'christmas cartoon', 'christmas special cartoon'], alt: ['christmas cartoon', 'santa', 'rudolph', 'snowman', 'father christmas'], len: [240, 5400] },
    xmasmusic: { t: ['christmas top of the pops', 'christmas music video', 'christmas pop'], alt: ['christmas number one', 'band aid', 'wizzard', 'slade', 'last christmas', 'merry xmas everybody'], len: MUSIC_LEN, from: 1980 },
    offschool: { t: ['daytime tv', 'neighbours', 'home and away', 'this morning'], alt: ['trisha', 'kilroy', 'jerry springer', 'sons and daughters', 'gmtv', 'richard and judy'], len: [600, 4200] },
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
  // A channel's show list can run to well over a hundred names; every one of them in a search would make a URL far
  // too long for archive.org. Take an even spread across the list instead: the same names every time, so the stored
  // lineup is not rebuilt for a new search, but drawn from the length of the list rather than just the top of it.
  var SEARCH_TERMS = 16;
  function spread(list, n) {
    if (list.length <= n) return list;
    var out = [], step = list.length / n;
    for (var i = 0; i < n; i++) out.push(list[Math.floor(i * step)]);
    return out;
  }
  function altFor(channelId, th) { return SHOWS[channelId] ? spread(SHOWS[channelId], SEARCH_TERMS) : th.alt; }
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
    thebill: ['thebill'], tv70s: ['tv70s'], music: ['music'], mtv: ['music', 'mtv'], xmasmusic: ['music'],
    citv: KIDS, childrens: KIDS, kidsxmas: KIDS, disney: KIDS.concat('disney'),
    offschool: ['offschool'],          // daytime soaps and talk shows, not kids TV
    // Saturday night drew on several genres, which is the point of the evening
    saturday: ['saturday', 'gameshows', 'comedy'],
    // tvarchive is chosen by date, not by genre: the news and whatever else went out on this day. No entry here,
    // so nothing is turned away for belonging to the wrong category.
    bbc: except(KIDS.concat('music')), itv: except(KIDS.concat('music')), itvam: except(KIDS)
  };
  // Words that may follow a one-word show name without making it a different programme ("Bread series 3",
  // "Pingu complete", "Lovejoy S01E01"). Anything else - "Rainbow Six", "Smart Guy" - is another title, and
  // matching it would file it under the wrong show.
  var NEXT_OK = {
    series: 1, season: 1, seasons: 1, episode: 1, episodes: 1, ep: 1, eps: 1, part: 1, parts: 1, pt: 1,
    special: 1, specials: 1, christmas: 1, xmas: 1, complete: 1, collection: 1, compilation: 1, uncut: 1,
    remastered: 1, upscaled: 1, dvd: 1, vhs: 1, rip: 1, pilot: 1, volume: 1, vol: 1, disc: 1, disk: 1,
    box: 1, set: 1, uk: 1, itv: 1, bbc: 1, citv: 1, cbbc: 1, mp4: 1, ia: 1, hq: 1, hd: 1, sd: 1, the: 1
  };
  /** For a one-word name, is what follows it harmless? (The text is already normalised to lowercase words.) */
  function okAfter(text, key) {
    if (key.indexOf(' ') >= 0) return true;                 // several words: specific enough on its own
    var at = text.indexOf(' ' + key + ' ');
    if (at < 0) return false;
    var rest = text.slice(at + key.length + 2);
    if (!rest) return true;                                 // the name ends the title
    var w = rest.split(' ')[0];
    return !w || !!NEXT_OK[w] || /^s\d{1,2}(e\d{1,3})?$/.test(w) || /^\d{1,2}x\d{1,3}$/.test(w) || /^\d{1,4}$/.test(w);
  }

  /** True unless the text names a known show and every show it names belongs to other genres than this channel's. */
  function genreOk(channelId, text) {
    var allow = ALLOWED[channelId];
    if (!allow) return true;
    var t = norm(text), hit = false;
    for (var i = 0; i < SHOW_KEYS.length; i++) {
      var key = SHOW_KEYS[i].trim();
      if (t.indexOf(' ' + key + ' ') < 0 || !okAfter(t, key)) continue;
      hit = true;
      var cats = SHOW_CATS[SHOW_KEYS[i]];
      for (var j = 0; j < allow.length; j++) if (cats[allow[j]]) return true;
    }
    return !hit;
  }

  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  var Auto = { THEMES: THEMES, has: has, sourcesFor: sourcesFor, genreOk: genreOk, okAfter: okAfter, norm: norm, SHOWS: SHOWS, today: today, OUT_OF_ERA: OUT_OF_ERA, NOT_EPISODE: NOT_EPISODE };
  if (typeof module !== 'undefined' && module.exports) module.exports = Auto; else root.AUTO = Auto;
})(typeof window !== 'undefined' ? window : this);
