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
        exclude: '^\\s*(19|20)\\d\\d\\s*$' }
    ]
  },
  {
    n: 2,
    id: 'bbc',
    name: 'Classic BBC',
    sources: [
      { search: '(BBC1 OR BBC2 OR "BBC Television" OR "BBC One") AND mediatype:movies AND year:[1960 TO 1999]', rows: 40,
        exclude: 'subs|anime|SoShi' }
    ]
  },
  {
    n: 3,
    id: 'itvam',
    name: 'ITV Morning',
    sources: [
      // morning shows only, and nothing shorter than 10 minutes (minDur is in seconds)
      { item: 'Itvcitv', include: 'This Morning|GMTV|Daybreak|Lorraine|TV-?am', minDur: 600 }
    ]
  },
  {
    n: 4,
    id: 'sitcoms',
    name: 'Classic Sitcoms',
    sources: [
      { item: 'classic-british-tv-pack' }
    ]
  },
  {
    n: 5,
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
    n: 6,
    id: 'thebill',
    name: 'The Bill',
    sources: [
      { item: 'the-bill-complete-series-1-to-26' }
    ]
  },
  {
    n: 7,
    id: 'christmas',
    name: 'Christmas TV',
    sources: [
      { item: 'uk-tv-show-christmas-specials' },
      { item: 'uk-tv-shows-christmas-specials' }
    ]
  },
  {
    n: 8,
    id: 'tv70s',
    name: '70s TV',
    sources: [
      { search: 'collection:classic_tv_1970s AND mediatype:movies', rows: 40 }
    ]
  },
  {
    n: 9,
    id: 'adverts',
    name: 'Adverts & Continuity',
    sources: [
      { search: '(ITV OR BBC1 OR "Channel 4") AND (adverts OR commercials OR continuity OR idents) AND mediatype:movies', rows: 40 }
    ]
  },
  {
    n: 10,
    id: 'itv',
    name: 'ITV',
    sources: [
      { item: 'Itvcitv', exclude: 'This Morning|GMTV|Daybreak|Lorraine|TV-?am|CITV' }
    ]
  },
  {
    n: 11,
    id: 'noel',
    name: "Noel's House Party",
    sources: [
      { item: 'noel-s-house-party' }
    ]
  },
  {
    n: 12,
    id: 'citv',
    name: 'CITV',
    perItem: 30,   // cap per item so Art Attack / Ghostbusters can't crowd out the rest
    maxItems: 80,  // lots of items on this channel
    sources: [
      { item: 'Itvcitv', include: 'CITV' },
      { item: 'KnightmareSeries1' }, { item: 'KnightmareSeries2' }, { item: 'KnightmareSeries3' },
      { item: 'KnightmareSeries4' }, { item: 'KnightmareSeries5' }, { item: 'KnightmareSeries6' },
      { item: 'KnightmareSeries7' }, { item: 'KnightmareSeries8' },
      { item: 'the-trap-door-the-complete-collection-1984-86-seasons-1-2' },
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
      { item: 'denver-the-last-dinosaur' }
    ]
  },
  {
    n: 13,
    id: 'games',
    name: 'Video Games',
    sources: [
      // episodes only: file names like "Gamesmaster (S1 - E01) John Fashanu.mp4" (skips the promos and adverts)
      { item: 'GamesmasterS4E18GamesmasterGoreSpecialRetailVersion', include: '\\(S\\d+\\s*-\\s*E\\d+\\)' },
      { search: 'subject:"bad influence" AND mediatype:movies', rows: 40 }
    ]
  },
  {
    n: 14,
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
      { item: 'allo-allo-complete-series' }
    ]
  }
];
