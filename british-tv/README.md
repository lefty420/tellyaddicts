# Telly Addicts: inside the app

The app is called Telly Addicts on the TV; its package is `app.britishtv`, so updates install over the previous
one. This page is how it works inside. For what it does, the channels, the controls and how to get the APK, see the
[main README](../README.md). Releases are in `../CHANGELOG.md`.

## How a channel is built

- A channel is an entry in `app/src/main/assets/channels.js`. Its programmes come from the scraper's published
  data, and, for the older hand-picked channels, from archive.org items and searches listed in the entry.
- Programmes go into a fixed shuffled loop per channel, timed by the clock, so a channel is "on" at a set point
  whenever you tune in. The loop is worked out from the stored list, not written out in advance, so the guide can
  be scrolled as far ahead as you like and still be right after a reboot.
- File names are tidied into programme names and episode codes (`Top of the Pops (1976 08 26) Song.mp4`,
  `Show S04E12`). The small `.ia.mp4` copy is preferred to a larger plain one. Each programme's real running time
  is learned the first time it plays, so the guide gets more accurate with use.
- Channels that find nothing playable hide themselves. `off: true` switches one off by hand.

Source options in `channels.js`: `item`, `search` or `data` (a published list), `files` (a fixed `[url, title]`
list), `include`, `exclude`, `skipFile`, `minDur` / `maxDur` (seconds), `maxSize` (bytes), `requireEp`, `perItem`.

## Where programmes come from

The scraper publishes to `../british-tv/data/` (see the main README for the files). The app:

1. fetches `index.json` for each channel's revision and the library's;
2. routes `library.json` to channels itself with `assets/libroute.js`, using `tools/shows.json` (its lists), the
   scraper's `routes.json` (which wins for shows it names) and `removed-shows.json`. A channel marked `"extra"` in
   `shows.json` keeps its shows on their own channels too. A broadcaster's channel (BBC, ITV) also gets its shows,
   soaps go to Soaps as well, and episodes flagged as Christmas go to a Christmas channel;
3. falls back to the channel's own `data/<id>.json` when the library routes nothing to it (Food & Cooking), then to
   the bundled copy `autodata.js`.

A channel's revision is a hash of its own routed rows, so only channels that changed are rebuilt. Editing
`tools/shows.json` re-routes at the next start, with no scrape and no build.

**Genre guard** (`auto.js`). A programme is dropped from a channel when the show it names belongs only to other
genres (Miss Marple cannot appear on CITV). Programmes naming no known show are kept. One-word show names only count
when what follows is harmless (`Bread series 3`, not `Rainbow Six`). `auto.js` is partly generated from
`tools/shows.json` by `tools/make_shows.py`; the theme and allowed-genre tables in it are edited by hand.

**Rules applied on the way in.** Era 1970 to 1999 (Disney exempt); a film needs a certificate and obeys the
watershed; adult material is blocked; no one show may take more than a quarter of a channel; programmes with sound
but no picture are skipped.

## Saved on the TV

- **Files.** Channel lists (`plan7*`), episode guides (`eps1:`), artwork answers (`art2:`, `info3:`, `tvm4:`,
  `artdb1:`) and film details (`film1:`) are saved as files by the native side (`KvStore.java`, in the app's private
  folder), because the page's own storage holds only about 5 million characters in all. In a plain browser, with no
  native side, they go in the page's storage as before, capped at 800 programmes per channel.
- **Page storage.** Settings, the chosen aspect ratio and effect, and artwork you picked by hand (`artfix:`).
- **Links database** (IndexedDB, `links.js`) for Play Next; a link is forgotten only when it has been shown not to play.
- **How long.** Options > Keep listings for sets how long a channel's running order lasts; it is also how often it
  changes. A newly published list is picked up straight away whatever that is set to.

## Speed

- A pool of eight connections, asked for in the order they are wanted (last channel watched, then down the guide).
- Only the fields the app reads are kept from archive.org's metadata.
- The guide redraws rather than rebuilds: moving the highlight only changes the highlight.
- On Demand moves only the highlight when a key stays inside the posters on screen, remembers pictures it has found,
  and loads the large background only once the highlight rests.
- VHS and VHS 2 filter the video itself. If more than a fifth of the frames in a 4 second window are dropped, only
  the blur is removed until the next programme.

## On Demand

`app.js` holds it (`od*` functions). Each channel's shows are grouped by show name from the same data as the
channel (`odLoadChannel`, `odGroup`), seasons split by `odSeasons`. Details come from `data/eps/<slug>.json` if the
scraper has one, otherwise from TVmaze, and are cached per show. Stills from guides are rewritten to TVmaze's medium
size. Artwork is the scraper's `art.json`, TVmaze, or a hand-picked override.

## Episode names and Info

TVmaze (free, no key) supplies episode titles, posters and fanart. A show is matched by the scraper's name for it,
or by the names in `tools/shows.json`. Misses are remembered for 5 days. Info shows the episode's own summary if
there is one, otherwise the show's.

## Adverts

Period breaks between programmes, matched to the channel by `ads.js`: toys and sweets for kids channels, console
adverts for Video Games, album adverts for music, household and food in the daytime, ITV and Channel 4 breaks on the
rest. UK adverts are searched first and played about four times in five; anything American is dropped; never BBC
(Classic BBC and Adverts & Continuity have no breaks). `assets/adverts.js` has hand-picked adverts as
`[url, title, channels]`. The era setting applies to all of them.

## The native side

`MainActivity.java` hosts a WebView with a bridge, `window.NativeHttp`: HTTP for the page (the page cannot fetch
cross-origin from a local file) limited to archive.org, api.tvmaze.com, raw.githubusercontent.com and
image.tmdb.org; the file store (`KvStore`); the buffer (`MediaCache`); the debug-log server (`LogServer`); and key
handling (OK is Enter on release, Info after holding 550 ms). archive.org links are always
`https://archive.org/download/<id>/<file>`. Only this device may serve cleartext, for the buffer; everything on the
internet stays HTTPS.

## Tests

There is no test suite in the repository. Changes are checked in a headless browser with the app's HTML, mocked
network and mocked native bridge, which cannot stand in for a real TV; real-TV behaviour is only known from people
using it and from the debug log.
