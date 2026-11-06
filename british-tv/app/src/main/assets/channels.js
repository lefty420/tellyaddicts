/*
 * Channel lineup. Edit this file to add, remove or retune channels.
 *
 * Each channel is filled from archive.org. A source is either:
 *   { item: "identifier" }                 one specific archive.org item
 *   { item: "identifier", include: "regex" }  only files whose path matches (e.g. "Fawlty|Blackadder")
 *   exclude: "regex"                       on any source: skip items/files whose name matches
 *   { search: "query", rows: 25 }          an archive.org advanced search (Lucene syntax)
 *
 * Channels that find no playable video are hidden automatically.
 * Only "mp4" files are used (archive.org usually makes one next to each original upload).
 * Results are cached on the device for 24 hours.
 */
// Shared by CITV and Children's Christmas (which keeps only the Christmas / Xmas files from the same sources)
var CITV_SOURCES = [
{ item: 'Itvcitv', include: 'CITV' },
  { item: 'KnightmareSeries1' }, { item: 'KnightmareSeries2' }, { item: 'KnightmareSeries3' },
  { item: 'KnightmareSeries4' }, { item: 'KnightmareSeries5' }, { item: 'KnightmareSeries6' },
  { item: 'KnightmareSeries7' }, { item: 'KnightmareSeries8' },
  { item: 'the-trap-door-1x-10-the-thingy-upscaled' },
  { item: 'art-attack-uk-vhs-and-dvd-collection' },
  { item: 'dogtanian-and-the-three-muskehounds' },
  { item: 'dungeons-dragons-1983-s-02-e-01-the-girl-who-dreamed-tomorrow-1080p-hd-upscale', exclude: 'Requiem' },
  { item: 'real-ghostbusters-1' }, { item: 'real-ghostbusters-2-1' }, { item: 'real-ghostbusters-3' },
  { item: 'real-ghostbusters-4' }, { item: 'real-ghostbusters-5' },
  { item: 'inspector-gadget-go-go-gadget-series' },
  { item: '60s70s80skidstv',
    include: '^(Fireman Sam|Jimbo and the Jet Set|Postman Pat 1981-1996|Roobarb and Custard|The Family-Ness)/' },
  { item: 'garfield-and-friends-complete-series' },
  { item: 'mask-01-the-deathstone-sg-1' },
  { item: 'spider-man-and-his-amazing-friends_202403' },
  { item: '20240727_20240727_0523' },
  { item: 'maid-marian-and-her-merry-men-1989-94' },
  { item: 'simon-and-the-witch-1987-88' },
  { item: 'bananaman-the-complete-collection-1983-86-series-1-3' },
  { item: 'bucky-ohare-and-the-toad-wars-the-complete-series-1991' },
  { item: 'the_adventures_of_pete_and_pete' },
  { item: 'rainbow-1972-92-childrens-itv-series' },
  { item: 'Ducktales-Complete-Series' },
  { item: 'transformers-season-1' },
  { item: 'gummi-bears-s-01-e-09-a-gummi-by-any-other-name' },
  { item: 'super-mario-world-the-complete-tv-series-collection' },
  { item: 'Sonic-the-Hedgehog-SatAM-The-Complete-Series-Restored' },
  { item: 'sonic-the-hedgehog-sat-am-complete-series-UK-DVD-rip' },
  { item: 's-01-e-06-the-works...-in-wax' },
  { item: 'hanna-barbera-gravdale-high-animated-1990-series' },
  { item: 'gummi-bears-s-06-e-19-wings-over-dunwyn' },
  { item: 'captain-n-the-game-master-s-02-e-14-when-mother-brain-rules-version-2' },
  { item: 'gummi-bears-s-04-e-15-top-gum' },
  { item: 'visionaries-knights-of-the-magical-light-s-01-e-13-dawn-of-the-sun-imps' },
  { item: 'denver-the-last-dinosaur' },
  { item: 'count-duckula-1x-07-dr-von-goosewings-invisible-ray-upscaled_202608' },
  { item: 'rr-the-road-runner-adventures-of-1620x-1080' },
  { item: 'zz-daffy-duck-porky-pig-meet-the-groovie-goolies-wm' },
  { item: 'tots-tv-uk-vhs-and-dvd-collection' },
  { search: 'title:("the tick") AND "1994" AND mediatype:movies', rows: 10 }
];
var XMAS_RE = 'christmas|xmas|santa|nativity';
function xmasOnly(src) {
  var o = {}; for (var k in src) o[k] = src[k];
  o.include = src.include ? '^(?=.*?(?:' + src.include + '))(?=.*?(?:' + XMAS_RE + '))' : XMAS_RE;
  return o;
}

// Christmas Music: the MTV Christmas Top 100 item plus hand-picked videos (title shown on screen is the one given here)
var XMAS_VIDEOS = [
  { item: 'MTVXmas-Top100', perItem: 100 },
  { item: 'whamlastchristmas1984', include: '^Wham! - Last Christmas \\(1984\\)\\.mp4$', title: 'Wham Last Christmas' },
  { item: 'slade-merry-xmas-everybody-top-of-the-pops-christmas-1974', include: '^Slade - Merry Xmas Everybody \\(Top Of The Pops Christmas 1974\\)\\.mp4$', title: 'Slade Merry Xmas Everybody' },
  { item: '9convert.com-band-aid-do-they-know-its-christmas-2024-ultimate-mix-40th-anniversary-video-v-720-p', include: '^9convert\\.com - Band Aid  Do They Know Its Christmas 2024 Ultimate Mix  40th Anniversary Video_v720P\\.ia\\.mp4$', title: 'Band Aid Do They Know Its Christmas' },
  { item: 'MariahCareyAllIWantForChristmasIsYouespaol', include: '^Mariah Carey   All i want for christmas is you\\(espaol\\)\\.mp4$', title: 'Mariah Carey All I Want For Christmas Is You' },
  { item: 'step-into-christmas-ep-album-by-elton-john-apple-music', include: '^Step Into Christmas - EP - Album by Elton John - Apple Music\\.ia\\.mp4$', title: 'Elton John Step Into Christmas' },
  { item: 'chris-rea-driving-home-for-christmas_202511', include: '^Chris Rea - Driving Home For Christmas\\.mp4$', title: 'Chris Rea Driving Home For Christmas' },
  { item: 'jona-lewie-stop-the-cavalry-intro-1980-starlight', include: '^Jona Lewie - Stop The Cavalry \\(1981\\) \\(Starlight\\)\\.ia\\.mp4$', title: 'Jona Lewie Stop The Cavalry' },
  { item: 'youtube-M41NYcvGKf8', include: '^M41NYcvGKf8\\.mp4$', title: 'Mud Lonely This Christmas' },
  { item: 'christmas-totp-1988-cliff-richard-mistletoe-and-wine', include: '^CHRISTMAS TOTP  - 1988  - Cliff Richard  -  Mistletoe and Wine\\.mp4$', title: 'Cliff Richard Mistletoe and Wine' },
  { item: 'john-lennon-happy-xmas-war-is-over-karaoke-version', include: '^John Lennon - Happy Xmas \\(War Is Over\\) \\(Karaoke Version\\)\\.ia\\.mp4$', title: 'John Lennon Happy Xmas' },
  { item: 'east17stayanotherdaytranceremix', include: '^EAST 17 - STAY ANOTHER DAY \\(TRANCE REMIX\\)\\.mp4$', title: 'East 17 Stay Another Day' },
  { item: 'kelly-clarkson-underneath-the-tree-official-video-1080p', include: '^Kelly Clarkson  Underneath the Tree Official Video_1080p\\.ia\\.mp4$', title: 'Kelly Clarkson Underneath the Tree' },
  { item: 'Y2mate.comVariousWaitressesChristmasWrappingWq6Wpa1qgPs360p', include: '^y2mate\\.com - various_waitresses_christmas_wrapping_Wq6Wpa1qgPs_360p\\.mp4$', title: 'Waitresses Christmas Wrapping' },
  { item: 'DEANMARTINLETITSNOWBLACKWAXCYLINDER', include: '^DEAN MARTIN _ LET IT SNOW _ BLACK WAX CYLINDER\\.mp4$', title: 'Dean Martin Let It Snow' },
  { item: 'THEHOUSEMARTINSCARAVANOFLOVE_201801', include: '^THE HOUSE MARTINS - CARAVAN OF LOVE\\.mp4$', title: 'Housemartins Caravan of Love' },
  { item: 'pet-shop-boys-always-on-my-mind', include: '^Pet Shop Boys-Always On My Mind\\.mp4$', title: 'Pet Shop Boys Always on My Mind' },
  { item: 'bing-crosby-david-bowie-peace-on-earth-little-drummer-boy-orchestra-stereo-uhd-5-k', include: '^Bing Crosby & David Bowie - Peace on EarthLittle Drummer Boy \\(Orchestra Stereo\\) UHD 5K\\.ia\\.mp4$', title: 'Bing Crosby David Bowie Peace on Earth' },
  { item: 'justin-bieber-mistletoe-official-music-video-720-p-hd', include: '^Justin Bieber - Mistletoe \\(Official Music Video\\)_720P HD\\.mp4$', title: 'Justin Bieber Mistletoe' },
  { item: 'jose_feliciano_feliz_navidad', include: '^MVI_6731\\.mp4$', title: 'Jose Feliciano Feliz Navidad' },
  { item: 'youtube-gCbFpprZYKE', include: '^gCbFpprZYKE\\.mp4$', title: 'Boyz II Men Let It Snow' },
  { item: 'youtube-b9XNyeeJZ2k', include: '^b9XNyeeJZ2k\\.ia\\.mp4$', title: 'Chris Brown This Christmas' },
  { item: 'youtube-kZ-coIXJf4s', include: '^kZ-coIXJf4s\\.ia\\.mp4$', title: 'Whitney Houston Do You Hear What I Hear' },
  { item: 'sarah-brightman-andrea-bocelli-time-to-say-goodbye', include: '^Sarah Brightman & Andrea Bocelli - Time To Say Goodbye\\.mp4$', title: 'Andrea Bocelli Time To Say Goodbye' },
  { item: 'youtube-LtqU3qb_7so', include: '^LtqU3qb_7so\\.mp4$', title: 'Steeleye Span Gaudete' },
  { item: 'YouthcommPantoMediaGroup', include: '^XmasVideoiPod\\.mp4$', title: 'Merry Christmas Everyone' },
  { item: 'youtube-HOv9bB9j6_U', include: '^Kigurumi_Fairytale_of_New_York-HOv9bB9j6_U\\.mp4$', title: 'Fairytale of New York' },
  { item: 'elizabeth-unarchived-karaoke-026', include: '^hjSq4OmJwpk\\.mp4$', title: 'I Wish It Could Be Christmas Everyday' },
  { item: 'paul-mc-cartney-wonderful-christmastime-l-train-remix', include: '^Paul McCartney - Wonderful Christmastime \\(L-Train remix\\)\\.ia\\.mp4$', title: 'Wonderful Christmastime' },
  { item: 'turner_video_2303', include: '^2303\\.ia\\.mp4$', title: 'Only You' },
  { item: '2014-12-13-hshs-choir-in-dulci-jubilo', include: '^2014-12-13 - HSHS Choir - In Dulci Jubilo\\.ia\\.mp4$', title: 'In Dulci Jubilo' }
];

// Disney shorts: one fixed file per item
var DISNEY = [
  { item: "disney-goofy-victory-vehicles-1943-1354x-1080", include: "^Disney - \\(Goofy\\) Victory Vehicles \\(1943\\)_1354x1080(\\.ia)?\\.mp4$", title: "(Goofy) Victory Vehicles (1943)" },
  { item: "disney-toot-whistle-plunk-boom-1954-ws", include: "^Disney - Toot, Whistle, Plunk \\& Boom \\(1954\\) \\(WS\\)(\\.ia)?\\.mp4$", title: "Toot, Whistle, Plunk & Boom (1954) (WS)" },
  { item: "educational-disney-understanding-stresses-and-strains-1968", include: "^\\(Educational\\) Disney - Understanding Stresses And Strains \\(1968\\)(\\.ia)?\\.mp4$", title: "Understanding Stresses And Strains (1968)" },
  { item: "disney-mother-goose-goes-holly-wood-1938", include: "^- Disney - Mother Goose Goes HollyWood \\(1938\\)(\\.ia)?\\.mp4$", title: "Mother Goose Goes HollyWood (1938)" },
  { item: "disney-scrooge-mc-duck-money-wm-1080p", include: "^Disney - Scrooge McDuck \\& Money \\(WM\\) 1080p(\\.ia)?\\.mp4$", title: "Scrooge McDuck & Money (WM)" },
  { item: "disney-donald-how-to-have-an-accident-at-work", include: "^- Disney \\(Donald\\) - How To Have An Accident At Work(\\.ia)?\\.mp4$", title: "(Donald) How To Have An Accident At Work" },
  { item: "disney-donalds-diary-1954-1080p", include: "^Disney - Donald`s Diary \\(1954\\) 1080p(\\.ia)?\\.mp4$", title: "Donald`s Diary (1954)" },
  { item: "disney-goofy-gymnastics-1350x-1080", include: "^Disney - Goofy Gymnastics_1350x1080(\\.ia)?\\.mp4$", title: "(Goofy) Gymnastics" },
  { item: "disney-goofy-two-gun-goofy-1080", include: "^Disney - \\(Goofy\\) Two-Gun Goofy 1080(\\.ia)?\\.mp4$", title: "(Goofy) Two-Gun Goofy" },
  { item: "disney-rugged-bear-1953", include: "^Disney - Rugged Bear \\(1953\\)(\\.ia)?\\.mp4$", title: "Rugged Bear (1953)" },
  { item: "disney-free-way-phobia", include: "^Disney - FreeWayPhobia(\\.ia)?\\.mp4$", title: "(Goofy) FreeWayPhobia" },
  { item: "educational-disney-its-tough-to-be-a-bird-1969", include: "^\\(Educational\\) Disney - It's Tough To Be A Bird! \\(1969\\)(\\.ia)?\\.mp4$", title: "It's Tough To Be A Bird! (1969)" },
  { item: "disney-goofy-how-to-sleep-1953-1080", include: "^Disney - \\(Goofy\\) How to Sleep \\(1953\\) 1080(\\.ia)?\\.mp4$", title: "(Goofy) How To Sleep (1953)" },
  { item: "disney-mickey-the-nifty-nineties-1080-1", include: "^Disney - \\(Mickey\\) The Nifty Nineties 1080 1(\\.ia)?\\.mp4$", title: "(Mickey) The Nifty Nineties" },
  { item: "z-disney-animated-shorts-1953x-09-football-now-and-then-1440x-1080", include: "^z Disney Animated Shorts - 1953x09 - Football \\(Now and Then\\)_1440x1080(\\.ia)?\\.mp4$", title: "Football (Now & Then)" },
  { item: "z-disney-the-brave-engineer-1594x-1080", include: "^z Disney - The Brave Engineer_1594x1080(\\.ia)?\\.mp4$", title: "The Brave Engineer" },
  { item: "disney-melody-1953", include: "^\\(Disney\\) - Melody \\(1953\\)(\\.ia)?\\.mp4$", title: "Melody (1953)" },
  { item: "disney-the-robber-kitten-1080", include: "^Disney - The Robber Kitten 1080(\\.ia)?\\.mp4$", title: "The Robber Kitten" },
  { item: "disney-don-donald-1937-1080p", include: "^Disney - Don Donald \\(1937\\) 1080p(\\.ia)?\\.mp4$", title: "Don Donald (1937)" },
  { item: "disney-the-saga-of-wind-wagon-smith-1080-1", include: "^Disney - The Saga Of WindWagon Smith 1080 1(\\.ia)?\\.mp4$", title: "The Saga Of Wind Wagon Smith" },
  { item: "disney-donald-no-hunting-1955-cinema-scope", include: "^Disney - \\(Donald\\) No Hunting \\(1955\\) \\(CinemaScope\\)(\\.ia)?\\.mp4$", title: "(Donald) No Hunting (1955) (Cinema Scope)" },
  { item: "disney-jack-old-mac-1080", include: "^Disney - Jack \\& Old Mac 1080(\\.ia)?\\.mp4$", title: "Jack & Old Mac" },
  { item: "disney-goofy-fathers-are-people-1080", include: "^Disney - \\(Goofy\\) Fathers Are People 1080(\\.ia)?\\.mp4$", title: "(Goofy) Fathers Are People" },
  { item: "disney-the-country-cousin-1080", include: "^Disney - The Country Cousin 1080(\\.ia)?\\.mp4$", title: "The Country Cousin" },
  { item: "disney-elmer-elephant-1080-1", include: "^Disney - Elmer Elephant 1080 1(\\.ia)?\\.mp4$", title: "Elmer Elephant" },
  { item: "walt-disney-ye-olden-days-colorized", include: "^Walt Disney - Ye Olden Days \\(Colorized\\)(\\.ia)?\\.mp4$", title: "Walt Disney: Ye Olden Days (Colorized)" },
  { item: "z-disney-social-lion-1600x-1080", include: "^z Disney - Social Lion_1600x1080(\\.ia)?\\.mp4$", title: "Social Lion" },
  { item: "z-disney-donald-the-wheel-1080p", include: "^Z Disney - Donald \\& The Wheel 1080p(\\.ia)?\\.mp4$", title: "Donald & The Wheel" },
  { item: "disney-a-symposium-on-popular-songs-1962-1080p", include: "^Disney - A Symposium on Popular Songs \\(1962\\) 1080p(\\.ia)?\\.mp4$", title: "A Symposium On Popular Songs (1962)" },
  { item: "disney-the-grass-hopper-the-ants-1080", include: "^Disney - The GrassHopper \\& The Ants 1080(\\.ia)?\\.mp4$", title: "The Grass Hopper & The Ants" },
  { item: "disney-who-killed-cock-robin-1080", include: "^Disney - Who Killed Cock Robin 1080(\\.ia)?\\.mp4$", title: "Who Killed Cock Robin" },
  { item: "disney-goofy-how-to-be-a-detective-1080", include: "^Disney - \\(Goofy\\) How To Be A Detective 1080(\\.ia)?\\.mp4$", title: "(Goofy) How To Be A Detective" },
  { item: "disney-pigs-is-pigs-1954-1080", include: "^- Disney - Pigs Is Pigs \\(1954\\)1080(\\.ia)?\\.mp4$", title: "Pigs Is Pigs (1954)" },
  { item: "disney-the-story-of-any-burg-u.-s.-a.-1080", include: "^Disney - The Story Of AnyBurg U\\.S\\.A\\. 1080(\\.ia)?\\.mp4$", title: "The Story Of AnyBurg U.S.A." },
  { item: "disney-a-cowboy-needs-a-horse-1080", include: "^Disney - A Cowboy Needs A Horse 1080(\\.ia)?\\.mp4$", title: "A CowBoy Needs A Horse" },
  { item: "disney-donald-the-litter-bug-1961-1080", include: "^Disney - \\(Donald\\) The LitterBug \\(1961\\) 1080(\\.ia)?\\.mp4$", title: "(Donald) The LitterBug (1961)" },
  { item: "disney-broken-toys-1080p", include: "^Disney - Broken Toys 1080p(\\.ia)?\\.mp4$", title: "Broken Toys" },
  { item: "disney-mickeys-moderrn-house-house-of-vilains", include: "^Disney - Mickey`s Moderrn House \\(House Of Vilains\\)(\\.ia)?\\.mp4$", title: "Mickey`s Modern House (House Of Vilains)" },
  { item: "disney-goofy-for-whom-the-bulls-toil-1080", include: "^Disney - \\(Goofy\\) For Whom the Bulls Toil 1080(\\.ia)?\\.mp4$", title: "(Goofy) For Whom The Bulls Toil" },
  { item: "disney-educational-the-mosquito-winged-scourge-1943-1080p", include: "^- Disney \\(Educational\\) The Mosquito Winged Scourge \\(1943\\) 1080p(\\.ia)?\\.mp4$", title: "(Educational) The Mosquito Winged Scourge (1943)" }
];

window.CHANNELS = [
  {
    n: 1,
    id: 'music',
    name: 'Music',
    maxItems: 220,   // many separate episode items: let them all through
    sources: [
      // Top of the Pops (kept small so The Chart Show gets most of the screen time)
      { item: 'tot-p-1985-big-hits', perItem: 6 },
      { search: 'title:("top of the pops") AND mediatype:movies', rows: 15, perItem: 3,
        exclude: '^\\s*(19|20)\\d\\d\\s*$' },
      // The Chart Show episodes only (items with "The Chart Show" in the title; bare year items like "1987" are skipped)
      { search: 'title:("the chart show") AND mediatype:movies', rows: 200, perItem: 60,
        exclude: '^\\s*(19|20)\\d\\d\\s*$' },
      // hand-picked Chart Show episodes
      { item: 'chart-show-1-11-97', perItem: 60 },
      { item: 'chart-show-13-12-97', perItem: 60 },
      { item: 'chart-show-13-2-93', perItem: 60 },
      { item: 'chart-show-17-12-94', perItem: 60 },
      { item: 'chart-show-19-1-92', perItem: 60 },
      { item: 'chart-show-1989-special', perItem: 60 },
      { item: 'chart-show-1990-special', perItem: 60 },
      { item: 'chart-show-25-12-93', perItem: 60 },
      { item: 'chart-show-27-11-87', perItem: 60 },
      { item: 'chart-show-30-9-88', perItem: 60 },
      { item: 'chart-show-4-1-92', perItem: 60 },
      { item: 'chart-show-6-12-97', perItem: 60 }
    ]
  },
  {
    n: 2,
    id: 'mtv',
    name: 'MTV',
    perItem: 40,
    sources: [
      { item: 'mtv-12-15-83-1-hour-better-quality' },
      { item: 'bbkingturdfixed' },
      { search: 'creator:("MTV Music Television") AND mediatype:movies', rows: 40, perItem: 20 }
    ]
  },
  {
    n: 3,
    id: 'bbc',
    name: 'Classic BBC',
    sources: [
      { search: '(BBC1 OR BBC2 OR "BBC Television" OR "BBC One") AND mediatype:movies AND year:[1960 TO 1999]', rows: 40,
        exclude: 'subs|anime|SoShi|The[ ._-]?Tick' }
    ]
  },
  {
    n: 4,
    id: 'itvam',
    name: 'ITV Morning',
    sources: [
      // morning shows only, and nothing shorter than 10 minutes (minDur is in seconds)
      { item: 'Itvcitv', include: 'This Morning|GMTV|Daybreak|Lorraine|TV-?am', minDur: 600 }
    ]
  },
  {
    n: 5,
    id: 'sitcoms',
    name: 'Classic Sitcoms',
    sources: [
      { item: 'classic-british-tv-pack' }
    ]
  },
  {
    n: 6,
    id: 'gameshows',
    name: 'Game Shows',
    perItem: 40,   // keep one show from crowding out the others
    sources: [
      { item: 'the-crystal-maze-complete_202401', include: '^The Crystal Maze/' },
      { item: 'bruce-forsyths-generation-game-s-1-ep-01-sept-7th-1990' },
      { item: 'view-record-catchphrase-roywalker5' },
      { item: 'supermarket-sweep-dalewinton' },
      { item: 'wheeloffortuneuk' }
    ]
  },
  {
    n: 7,
    id: 'thebill',
    name: 'Drama',
    sources: [
      { item: 'the-bill-complete-series-1-to-26' }
    ]
  },
  {
    n: 8,
    id: 'christmas',
    name: 'Christmas TV',
    sources: [
      { item: 'uk-tv-show-christmas-specials' },
      { item: 'uk-tv-shows-christmas-specials' }
    ]
  },
  {
    n: 9,
    id: 'tv70s',
    name: '70s TV',
    sources: [
      { search: 'collection:classic_tv_1970s AND mediatype:movies', rows: 40 }
    ]
  },
  {
    n: 10,
    id: 'adverts',
    name: 'Adverts & Continuity',
    sources: [
      { search: '(ITV OR BBC1 OR "Channel 4") AND (adverts OR commercials OR continuity OR idents) AND mediatype:movies', rows: 40 }
    ]
  },
  {
    n: 11,
    id: 'itv',
    name: 'ITV',
    sources: [
      { item: 'Itvcitv', exclude: 'This Morning|GMTV|Daybreak|Lorraine|TV-?am|CITV' }
    ]
  },
  {
    n: 12,
    id: 'noel',
    name: "Noel's House Party",
    sources: [
      { item: 'noel-s-house-party' }
    ]
  },
  {
    n: 13,
    id: 'citv',
    name: 'CITV',
    perItem: 30,   // cap per item so Art Attack / Ghostbusters can't crowd out the rest
    maxItems: 80,  // lots of items on this channel
    adBreak: { search: 'collection:uk-adverts AND subject:"toys" AND mediatype:movies', rows: 60, count: 2, maxDur: 150 },   // test: 2 toy adverts after each show
    sources: CITV_SOURCES
  },
  {
    n: 14,
    id: 'games',
    name: 'Video Games',
    sources: [
      // episodes only: file names like "Gamesmaster (S1 - E01) John Fashanu.mp4" (skips the promos and adverts)
      { item: 'GamesmasterS4E18GamesmasterGoreSpecialRetailVersion', include: '\\(S\\d+\\s*-\\s*E\\d+\\)' },
      { search: 'subject:"bad influence" AND mediatype:movies', rows: 40 }
    ]
  },
  {
    n: 15,
    id: 'comedy',
    name: 'Comedy',
    perItem: 40,
    sources: [
      { item: 'bottom-the-complete-series' },
      { item: 'one-foot-in-the-grave-complete' },
      { item: 'keeping-up-appearances_202402' },
      { item: 'red-dwarf-s-13-e-01-the-promised-land-pt-1' },
      { item: 'vicar-of-dibley-s-01-e-01-arrival.avi' },
      { item: 'hey-ho-its-sooty-and-co-everybody-say-hello' },
      { item: 'bread-series-uncut' },
      { item: 'allo-allo-complete-series' },
      { item: 'father-ted-2005' }
    ]
  },
  {
    n: 16,
    id: 'childrens',
    name: "Children's World",
    sources: [
      { item: 'bbc-childrens-uk-vhs-and-dvd-collection' }
    ]
  },
  {
    n: 17,
    id: 'kidsmovies',
    name: 'Kids Movies',
    sources: [
      { item: 'beauty-and-the-beast-the-enchanted-christmas-1997-vhs.ia' }
    ]
  },
  {
    n: 18,
    id: 'kidsxmas',
    name: "Children's Christmas",
    perItem: 25,
    maxItems: 80,
    sources: CITV_SOURCES.map(xmasOnly).concat([
      { item: 'bbc-childrens-uk-vhs-and-dvd-collection', include: XMAS_RE }
    ])
  },
  {
    n: 19,
    id: 'xmasmusic',
    name: 'Christmas Music',
    maxItems: 150,
    sources: XMAS_VIDEOS
  },
  {
    n: 20,
    id: 'offschool',
    name: "I'm Off School",
    sources: [
      { item: 'neighbours-episode-27' },
      { item: 'neighbours-episode-275' }
    ]
  },
  {
    n: 21,
    id: 'disney',
    name: 'Disney',
    maxItems: 100,
    sources: DISNEY
  }
];
