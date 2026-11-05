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
    sources: [
      { item: 'tot-p-1985-big-hits' },
      { search: 'title:("top of the pops") AND mediatype:movies', rows: 30 },
      // The Chart Show and other uploads (musicmad247 on archive.org)
      { search: 'title:("the chart show" OR "chart show") AND mediatype:movies', rows: 40 },
      { search: 'musicmad247 AND mediatype:movies', rows: 60 }
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
    sources: [
      { item: 'the-crystal-maze-complete_202401', include: '^The Crystal Maze/' }
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
    sources: [
      { item: 'Itvcitv', include: 'CITV' },
      { item: 'KnightmareSeries1' }, { item: 'KnightmareSeries2' }, { item: 'KnightmareSeries3' },
      { item: 'KnightmareSeries4' }, { item: 'KnightmareSeries5' }, { item: 'KnightmareSeries6' },
      { item: 'KnightmareSeries7' }, { item: 'KnightmareSeries8' },
      { item: 'the-trap-door-1986', exclude: 'Intro' },
      { item: 'art-attack-uk-vhs-and-dvd-collection' },
      { item: 'dogtanian-and-the-three-muskehounds' },
      { item: 'dungeons-dragons-1983-s-02-e-01-the-girl-who-dreamed-tomorrow-1080p-hd-upscale', exclude: 'Requiem' },
      { item: 'the-real-ghostbusters' },
      { item: 'inspector-gadget-go-go-gadget-series' }
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
  }
];
