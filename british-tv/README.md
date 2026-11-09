# Telly Addicts (Android TV / Google TV / NVIDIA Shield)

The app is called Telly Addicts on the TV. Its package name is `app.britishtv`, so updates install
over the previous version. Current version 1.3.

Classic British telly as channels with a TV guide, built from public archive.org uploads. Nothing is
hosted by the app; it reads archive.org directly on the TV. A spiritual UK cousin of Spelunkr.tv,
written from scratch; none of its code is used here.

## How it works

- Each channel (see `app/src/main/assets/channels.js`) is a list of archive.org items and/or
  searches.
- On start the app reads each item's file list, keeps the playable **mp4** files, and parses air
  dates out of file names such as `Top of the Pops (1976 08 26) Song.mp4`.
- Programmes go into a fixed shuffled loop per channel, timed by the clock, so a channel is "on" at
  a set point whenever you tune in, like real TV. The loop is worked out from the stored list rather
  than written out in advance, so the guide can be scrolled as far ahead as you like and still be
  right after a reboot.
- The app opens in the TV guide, on the channel you were last watching.
- Channels that find nothing playable are hidden.
- Each programme's real running time is learned the first time it plays, so the guide gets more
  accurate with use.

When an item lists the same programme twice, the small `.ia.mp4` copy is used in preference to a
larger plain `.mp4`. Items that only contain `.avi`/`.mkv` originals will not play unless
archive.org has made an `.mp4` copy next to them.

## Current channels

| # | Channel | Mostly from |
| --- | --- | --- |
| 1 | Music | Top of the Pops and The Chart Show (60/40); no 1970s Top of the Pops |
| 2 | MTV | music video uploads |
| 3 | Classic BBC | search |
| 4 | ITV Morning | This Morning, GMTV, Daybreak, Lorraine, TV-am (10 minutes or more) |
| 5 | Classic Sitcoms | `classic-british-tv-pack` |
| 6 | Game Shows | The Crystal Maze, The Generation Game, Catchphrase, Supermarket Sweep, Wheel of Fortune UK |
| 7 | Drama | The Bill and other British drama and police series |
| 8 | Christmas TV | the UK Christmas specials collections |
| 9 | 70s TV | the `classic_tv_1970s` collection |
| 10 | Adverts & Continuity | search |
| 11 | ITV | evenings, SMTV, CD:UK (no CITV or morning shows) |
| 12 | Noel's House Party | `noel-s-house-party` |
| 13 | CITV | Knightmare, The Trap Door, Art Attack, Dogtanian, Bananaman, Rainbow, DuckTales and many more |
| 14 | Video Games | Gamesmaster, Bad Influence |
| 15 | Comedy | Bottom, One Foot in the Grave, Father Ted, Red Dwarf, Keeping Up Appearances, 'Allo 'Allo! |
| 16 | Children's World | the BBC children's VHS and DVD collection |
| 17 | Kids Movies | children's films (currently Beauty and the Beast: The Enchanted Christmas) |
| 18 | Children's Christmas | the Christmas files from the children's sources |
| 19 | Christmas Music | Christmas number ones and festive pop (Slade, Wham!, Band Aid, the MTV Christmas 100) |
| 20 | I'm Off School | what was on when you were off school: Neighbours, Home and Away, Sons and Daughters, Trisha, Kilroy, Jerry Springer, Jenny Jones, Ricki Lake, Montel Williams, This Morning, GMTV, Good Morning Britain, Richard & Judy, Pebble Mill at One, The Time The Place, Going for Gold, Open Air, Lorraine, TV-am |
| 21 | Disney | Disney cartoon shorts |
| 22 | On This Day | BBC Archive clips: 165 of them, listed with their links in `onthisday.js` |

Kids Movies is still thin on hand-picked sources; **Auto EPG** is what fills a channel out from
archive.org itself.

**On This Day** is built differently from the rest. Its clips are listed with their links in
`app/src/main/assets/onthisday.js` as `[url, title]`, which a source picks up with `files:` instead of `item:` or
`search:`. Nothing is looked up, so the channel is ready without a single request. The titles have had the
"BBC Archive -" prefix and the hashes taken off, and the five ways the show was tagged (`#OnThisDay`, `#OTD`,
`#Onthisday` and so on) all read as "On This Day". Alternative copies of the same clip are left out. The clips are
short, so the guide groups a run of them into one block, and each one's real length is learned the first time it
plays; until then the source's `dur` (150 seconds) is assumed. Being BBC, the channel has no advert breaks, and
Auto EPG leaves it alone rather than replacing the clips with searches.

The full source list for each is in `channels.js`. **CITV** leaves out DVD / disc files and anything
over 35 minutes, because those are usually whole discs rather than episodes.

## Remote controls

| Key | Watching | In the guide |
| --- | --- | --- |
| Up / Down | Change channel | Move between channels |
| Left / Right | Seek 30 s | Move between programmes (Left stops at what is on now) |
| Channel +/- | Change channel | Page up / down through channels |
| OK | Open the on-screen bar | Watch the selected channel |
| Hold OK (½ second) | Programme info | |
| Guide / Red | Open guide | Red jumps back to Now |
| Rewind / Fast-forward | Seek 30 s | Earlier / Later (2 hours) |
| Green / Yellow / Blue | | Later / Earlier / Watch |
| Next (media key) | Play the next episode | |
| Info | Show what is on | Sources that are not playing, and the archive.org file behind the highlighted programme |
| Play/Pause | Pause or resume | |
| Number keys | Jump to a channel number | |
| Back | **Open the guide** | Back to what is playing (twice to exit with nothing playing) |

The guide is styled after the classic UK satellite-TV programme guides: blue background, a mini TV
window top-left, a half-hour time grid with the selected programme highlighted, and a
red/green/yellow/blue button bar. Remotes without colour buttons (such as the Shield remote) can use
Rewind/Fast-forward and OK instead. Runs of short clips (such as Top of the Pops songs) are shown as
one block of about half an hour. Changing channel shows TV static for a moment (1.5–2 seconds).

In the guide, pressing OK on any programme plays it from the start, whatever the time; the channel
carries on from there. The programme airing now joins in progress.

## The on-screen bar (OSD)

Press OK while watching. Left to right: **TV Guide**, rewind 30 s, play/pause, forward 30 s,
**Play Next**, **Restart**, **Info**, **Options**. Left/Right chooses, OK uses. When Extra metadata
is on, the show's poster sits above the bar with a faint fanart backdrop.

## Options

OSD › **Options** (Up/Down to choose, Left/Right or OK to change):

| Option | Values |
| --- | --- |
| Picture | Auto, 4:3, 16:9, Zoom, Stretch |
| Enhancements | Off, VHS, Vivid, Sharp, Scanlines, Aperture grille, Curved glass, Portable set, Shadow mask |
| Extra metadata | On / Off |
| Adverts | Off, All (70s–90s), 1970s, 1980s, 1990s |
| Buffer | Off, 50 MB, 100 MB, 250 MB |
| Auto EPG (experimental) | On / Off |
| Keep listings for | 24 hours, 48 hours, 1 week, 4 weeks |
| Refresh listings | Press OK twice |

**Enhancements** covers everything done to the picture itself. The first three change the video: VHS warms and
softens it with faint horizontal lines and a slight colour fringe (no tracking wobble, no bands along the bottom),
Vivid adds contrast and colour, Sharp sharpens. If the TV struggles to keep up with Sharp (lots of dropped frames),
the app drops back to Vivid by itself. The rest are screen looks laid over the picture rather than filters on it,
so they cost the box next to nothing: **Scanlines** (fine dark lines), **Aperture grille** (red/green/blue stripes,
a Trinitron up close), **Curved glass** (the tube's curve clips the picture, with a vignette and a reflection),
**Portable set** (warm, coarse lines and a heavy edge) and **Shadow mask** (dot pitch rather than stripes).

**Buffer** keeps the programme ahead of the picture. With it on, the app downloads what you are watching into its
own cache and plays it from this device rather than straight off archive.org, so a slow spell empties the buffer
instead of stopping the picture. The file is deleted as soon as you stop or something else starts, so nothing is
kept after watching. Roughly: 50 MB is about three minutes of a programme, 100 MB about six and a half, 250 MB
about sixteen. It is **Off by default** and experimental: it has not been tried on a real box yet, and if the
buffer cannot be set up for any reason the programme simply plays from archive.org as before. Advert breaks are
short, so they always play direct. Only this device is allowed to serve cleartext; everything on the internet
stays HTTPS (`res/xml/network_security_config.xml`).

**Refresh listings** throws away every stored lineup and gathers them all again, in a new running order, so each
channel comes back with different programmes in different places while staying on its own theme. It asks twice,
because it reloads the app. Use it when a channel has gone stale before its **Keep listings for** time is up.

**Extra metadata** turns on both the poster on the bar and the show fanart behind the guide header
(TVmaze, TV shows only).

**Picture quality** also depends on the box: on an NVIDIA Shield turn on *Settings › Display & Sound
› Advanced › AI upscaling* (High) and output 4K. The Google TV Streamer also upscales to 4K.

## Keeping listings (speed)

Each channel's list of programmes, and the links in it, is stored on the TV in a compact form, so
the app starts without asking archive.org again. **Options › Keep listings for** sets how long: 24
hours, 48 hours, 1 week (the default) or 4 weeks. Because the guide is worked out from the stored
list, this is also how often the running order changes, and it covers the normal channels and Auto
EPG alike.

Picking a longer time keeps the lists already stored; picking a shorter one lets them run out, so
each is built again the next time the app starts and that channel is wanted. Nothing stops
mid-view. A short setting means fresher programmes and a slower first start of the day; a long one
means the fastest start, at the risk of an upload disappearing from archive.org while it is still
listed. Real episode names found online are stored too.

**What keeps it quick on the box**

* **A few connections, not hundreds.** Requests used to get a fresh thread each, so a start-up could
  leave 50+ threads fighting over the network. They now share a pool of eight, asked for in the
  order they are wanted: the channel that was on last, then down the guide, so the top rows fill in
  first.
* **Only the fields the app reads.** An item's metadata lists every file with its checksums and
  timestamps, which for a box set runs to megabytes of fields that are never looked at. It is cut
  down to the title and each file's name, size, length and format while the reply is being read, so
  the big text never reaches the page. On a 1,200-file item that is about 70% less to hand over and
  parse, with exactly the same programmes coming out.
* **The guide redraws, rather than rebuilds.** Moving the highlight only changes the highlight, the
  "on now" marks and the details line; the grid is rebuilt just when the rows or the two-hour window
  actually change.
* **Links are kept for good.** The database behind Play Next is never cleared out on a timer,
  however short the listings setting is: a link is forgotten only when it has been shown not to play
  (its own trial fails, or it loads but never starts), and that programme is then kept out of
  rebuilt listings too.
* **Scraped lists are kept.** Building a channel from `autodata.js` means running thousands of file
  names through the naming rules, a second or two per channel on the TV, so the finished list is
  stored like any other.

## Episode names and programme info

File names on archive.org are often messy, so once a channel has loaded the app looks up real
episode names on TVmaze (free, no key) for anything shown as `Show S04E12`. Three things help it find the show:
the scraped lists carry the real show name, which is used in preference to anything read out of the file name; a
title that is still messy is matched against the show names in `tools/shows.json`, which also settles the spelling
TVmaze expects (`Dad's Army` and `Thundercats` become `Dads Army` and `ThunderCats`); and a show TVmaze does not
have is remembered as a miss for 5 days, so opening Info on it does not ask again every time. Adding a show to the
scraper's categories therefore improves the artwork and Info as well as the routing. It only swaps the name
when the show matches and that season/episode number exists (and, if the file has an air date, when
the years agree). Results are cached for 30 days.

**Info** (the OSD button, the Info key, or holding OK during playback) looks the programme up on
TVmaze and shows the poster, fanart, year, network, rating and a summary: the episode's own summary
if TVmaze has one, otherwise the show's. In the guide, Info instead shows the sources that are not
playing and the exact archive.org file behind the highlighted programme.

## Play Next

OSD › **Play Next**, or the remote's Next key. The title is parsed (`Knightmare S01E03` or
`Season 7 Episode 15`) and the episode number goes up by one, or to episode 1 of the next season if
that season has no more. The link is found in this order:

1. the local link database (IndexedDB, `links.js`), filled with every channel's links after start-up
   and with anything found by searching;
2. archive.org: the item that is playing first, then a search for the show plus the episode number.

Whatever the search finds is saved to the database, so it is never searched for again. The new file
is tried out while the current programme keeps playing, and only swapped in once it loads. If it
will not play, what you were watching simply carries on and the link is forgotten so the next
attempt searches afresh. If nothing is found at all, the toast says "Next episode not found".

## Adverts

Period advert breaks between programmes, matched to the channel: toys and sweets (CITV, Children's
World, Disney, kids channels), console adverts (Video Games), album and cassette adverts (Music,
MTV), household and food (ITV Morning, I'm Off School), and ITV / Channel 4 / Channel 5 / Sky /
cable breaks on the rest.

**Hand-picked adverts.** `assets/adverts.js` holds adverts chosen by hand as `[url, title, channels]`, and each
one names the channels it may appear on, so a video game advert can play on Video Games, CITV and Children's World
without turning up on Disney or Kids Movies. They are played alongside whatever the search finds and go through
exactly the same checks, so the **Adverts** era setting still applies and nothing outside 1970-1999 appears in a
70s-90s break. Dated ones count as UK-dated and so are preferred; undated ones only appear under *All*.

**UK first:** the UK adverts collection is searched first and played about four times in five, and
anything titled USA/American is dropped. Never BBC — Classic BBC and Adverts & Continuity have no
breaks at all. The logic is in `ads.js`; pools are cached for 7 days (`ads2:` keys).

## Auto EPG (experimental)

Options › Auto EPG, default Off. With it on, a channel is built **only from the scraper's own library** — the
published lists, or the copy inside the app when those cannot be reached. Nothing is searched for on archive.org
and nothing is topped up from the hand-picked sources, so a channel the library has nothing for stays empty and
hides itself. That makes the experimental guide an honest view of what you have actually scraped, and it loads
without a single search. How often it is built again follows **Keep listings for**, and **Refresh listings**
rebuilds it on demand. Toggling it restarts the app on the loading screen.

Two channels sit outside this, because Auto EPG has no theme for them: **On This Day**, which is its own curated
clip list, and **Adverts & Continuity**, which keeps its normal search. The searches and era rules in `auto.js`
are still there and still shape the live keywords, but they are no longer used while Auto EPG is on.

**Genre guard.** A programme is dropped from a channel when the show it names belongs to another
genre: Miss Marple cannot appear on CITV, and Danger Mouse cannot appear on Classic Sitcoms.
Programmes that name no known show are kept. This applies to both the searches and the scraped
lists. A one-word show name only counts when what follows it is harmless (`Bread series 3`, `Pingu complete`,
`Lovejoy S01E01`); it is not matched when it runs into a different title, so *Rainbow Six* is not filed as
*Rainbow* and *Smart Guy* is not filed as *Smart*.

### Scraper lists: published, so a new scrape needs no new APK

The ready-made lists live in `british-tv/data/`: one small `<channel>.json` per channel plus an `index.json`
giving each channel a revision. When Auto EPG is on the app fetches `index.json` at start-up and downloads only
the channels whose revision it has not already built. So the round trip is **scrape on the Mac, commit, push**,
and the TV has it at its next start: no rebuild, no reinstall.

The revision is part of the cache key, so a freshly pushed list is picked up straight away whatever **Keep
listings for** is set to, while unchanged channels stay on their stored lists. If GitHub cannot be reached the
app falls back to the copy built into the APK (`autodata.js`), and failing that to the channel's live searches.
`raw.githubusercontent.com` is the only host added to the native allow-list for this. Pushes can take a few
minutes to show up, because raw.githubusercontent.com caches.

### The scraper's whole library (`data/library.json`)

**Send to TV app** in the scraper also publishes `data/library.json`: every show and episode in its master library, with the best (or pinned) copy of each and, where the scraper synced them, TVmaze's episode titles, air dates and running times. `index.json` names its revision under `"library"`.

When it's there, the TV builds the channels from it itself (`assets/libroute.js`). It fetches `tools/shows.json` alongside and routes each show to the channel of its genre, with the same rules as `import_scrape.py`: an exact name, then a listed show named inside a longer title, and both channels for a show listed twice. On the same library it puts every episode on the same channels as the per-channel files.

- **Episode details:** where TVmaze matched an episode, its title replaces the one tidied from the file name, for example "The Bill S11E71 Kicking". The library's running time replaces the guess.
- **Which channels rebuild:** each channel's revision is a hash of its own routed rows, so only channels whose programmes changed are rebuilt.
- **Downloads:** which channels changed is remembered per library and `shows.json` revision, so a start with nothing new downloads only `index.json` and `shows.json`.
- **Changing a genre list:** editing `tools/shows.json` re-routes the library at the next start. That needs no scrape and no APK.
- **Fallback:** if `library.json` or `shows.json` can't be reached, the per-channel files below are used as before, and failing that the copy built into the app. Older APKs ignore `library.json`.

`import_scrape.py` doesn't write `library.json`. If you rebuild `index.json` with it, the TV goes back to the per-channel files until the scraper sends again.

### Building the lists (`tools/import_scrape.py`)

The lists are built from the **Telly Addict Scraper**, either from its text files or straight from its master
library, which is better: the library has already deduplicated each episode and picked the best copy of it.

```sh
python3 tools/import_scrape.py --library ~/Library/Application\ Support/Telly\ Addict\ Scraper/library.db
python3 tools/import_scrape.py archive_*.txt            # or the text files
python3 tools/import_scrape.py --library library.db master_list.txt   # or both
```

It writes `british-tv/data/` (published, above) and `assets/autodata.js` (the offline copy inside the APK;
`--no-bundle` skips it and keeps the APK small). Give it files from any of the scraper's categories at once. A category of songs rather than shows (the scraper's
Christmas Songs) is filed under one name, so `shows.json` marks it `"songs": true`: it still routes to its channel,
but it is left out of the genre guard, because a song title says nothing about which channel a programme belongs on.

A channel's show list can run to well over a hundred names (CITV has 166), far too many to put in one archive.org
search, so the live searches use an even spread of 16 of them. The published lists use the full list. Every show is routed by its `[Show]` tag
to the channel of its own genre, using `tools/shows.json` (sitcoms, gameshows, childrens,
Drama = `thebill`, music, comedy, tv70s, citv). A show listed in two categories (Doctor Who,
Upstairs Downstairs) goes to both channels. Only the channels that get programmes are replaced; the
rest of `autodata.js` is kept. Then commit `autodata.js`.

Episode titles go through the same tidy-up as every other channel, one show is capped at a quarter
of a channel, and each programme's real running time is learned the first time it plays.

## Editing channels

Change `app/src/main/assets/channels.js`. For example:

```js
{ n: 10, id: 'blackadder', name: 'Blackadder',
  sources: [{ item: 'classic-british-tv-pack', include: '^Blackadder/' }] }
```

`include` is a regular expression matched against file paths inside the item. Other options on a
source: `exclude`, `skipFile`, `minDur` / `maxDur` (seconds), `maxSize` (bytes), `requireEp` and
`perItem`.

## Links and the native side

archive.org links are always built as `https://archive.org/download/<id>/<file>` with the same
escaping as Python's `quote(name, safe=",()'-")`; saved links on regional nodes are rewritten to
that form (`Engine.archiveUrl` / `canonicalUrl`).

The page cannot fetch cross-origin from a local file, so requests go through a small native bridge
(`MainActivity.java`), which only allows archive.org and api.tvmaze.com.

## Get the APK

1. Open the **Actions** tab, choose **Build Telly Addicts APK**, press **Run workflow** (it also
   runs on every push to `main`).
2. Download the **tellyaddicts-apk** artifact and unzip it to get `tellyaddicts.apk`.

Install on the TV with the Downloader app or `adb install tellyaddicts.apk`.
