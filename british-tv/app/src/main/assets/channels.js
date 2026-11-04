/*
 * Channel lineup. Edit this file to add, remove or retune channels.
 *
 * Each channel is filled from archive.org. A source is either:
 *   { item: "identifier" }                 one specific archive.org item
 *   { item: "identifier", include: "regex" }  only files whose path matches (e.g. "Fawlty|Blackadder")
 *   { search: "query", rows: 25 }          an archive.org advanced search (Lucene syntax)
 *
 * Channels that find no playable video are hidden automatically.
 * Only "mp4" files are used (archive.org usually makes one next to each original upload).
 * Results are cached on the device for 24 hours.
 */
window.CHANNELS = [
  {
    n: 1,
    id: 'totp',
    name: 'Top of the Pops',
    sources: [
      { item: 'tot-p-1985-big-hits' },
      { search: 'title:("top of the pops") AND mediatype:movies', rows: 30 }
    ]
  },
  {
    n: 2,
    id: 'bbc',
    name: 'Classic BBC',
    sources: [
      { search: '(BBC1 OR BBC2 OR "BBC Television" OR "BBC One") AND mediatype:movies AND year:[1960 TO 1999]', rows: 40 }
    ]
  },
  {
    n: 3,
    id: 'itvam',
    name: 'ITV Morning',
    sources: [
      { search: '("TV-am" OR "Good Morning Britain" OR GMTV OR "This Morning") AND mediatype:movies', rows: 40 }
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
  }
];
