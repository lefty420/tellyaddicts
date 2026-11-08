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
| Back | **Open the guide** | Press twice to exit |

The guide is styled after the classic UK satellite-TV programme guides: blue background, a mini TV
window top-left, a half-hour time grid with the selected programme highlighted, and a
red/green/yellow/blue button bar. Remotes without colour buttons (such as the Shield remote) can use
Rewind/Fast-forward and OK instead. Runs of short clips (such as Top of the Pops songs) are shown as
one block of about half an hour. Changing channel shows TV static for a moment (1.5–2 seconds).

In the guide, pressing OK on any programme plays it from the start, whatever the time; the channel
carries on from there. The programme airing now joins in progress.

## The on-screen bar (OSD)

Press OK while watching. Left to right: **TV Guide**, rewind 30 s, play/pause, forward 30 s,
**Play Next**, **Restart**, **Options**, **Info**. Left/Right chooses, OK uses. When Extra metadata
is on, the show's poster sits above the bar with a faint fanart backdrop.

## Options

OSD › **Options** (Up/Down to choose, Left/Right or OK to change):

| Option | Values |
| --- | --- |
| Picture | Auto, 4:3, 16:9, Zoom, Stretch |
| Enhancements | Off, VHS, Vivid, Sharp, Scanlines, Aperture grille, Curved glass, Portable set, Shadow mask |
| Television | Off, Walnut, Cream portable, Black, Silver |
| Extra metadata | On / Off |
| Adverts | Off, All (70s–90s), 1970s, 1980s, 1990s |
| Auto EPG (experimental) | On / Off |
| Keep listings for | 24 hours, 48 hours, 1 week, 4 weeks |

**Enhancements** covers everything done to the picture itself. The first three change the video: VHS warms and
softens it with faint horizontal lines and a slight colour fringe (no tracking wobble, no bands along the bottom),
Vivid adds contrast and colour, Sharp sharpens. If the TV struggles to keep up with Sharp (lots of dropped frames),
the app drops back to Vivid by itself. The rest are screen looks laid over the picture rather than filters on it,
so they cost the box next to nothing: **Scanlines** (fine dark lines), **Aperture grille** (red/green/blue stripes,
a Trinitron up close), **Curved glass** (the tube's curve clips the picture, with a vignette and a reflection),
**Portable set** (warm, coarse lines and a heavy edge) and **Shadow mask** (dot pitch rather than stripes).

**Television** puts the picture inside an old set: it is scaled into a 4:3 window, the shape these programmes were
made for, with the cabinet drawn around it in **Walnut**, **Cream portable**, **Black** or **Silver**. The cabinet
is drawn by the app, not a picture file: one gradient runs across all four panels (each shows its own part of it)
so the corners have no seams, it is sharp at any resolution, adds nothing to the download and costs the box
nothing. It combines with the Enhancements, so a walnut set with scanlines is a reasonable thing to ask for. No
cabinet is drawn over the guide. Note that with a cabinet on, the Picture setting only chooses how the video fills
that 4:3 window.

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
episode names on TVmaze (free, no key) for anything shown as `Show S04E12`. It only swaps the name
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

**UK first:** the UK adverts collection is searched first and played about four times in five, and
anything titled USA/American is dropped. Never BBC — Classic BBC and Adverts & Continuity have no
breaks at all. The logic is in `ads.js`; pools are cached for 7 days (`ads2:` keys).

## Auto EPG (experimental)

Options › Auto EPG, default Off. Instead of the hand-picked sources, each channel is built from
archive.org itself, limited to 1970–1999 (`auto.js`): three searches per channel (main keywords,
related shows, undated uploads), skipping trailers, DVD menus and whole-disc files, dropping
duplicate titles, and applying sensible length limits per channel. A thin channel is topped up from
its normal sources, and a channel with no results falls back to them entirely. How often it is built
again follows **Keep listings for**. Toggling it restarts the app on the loading screen.

**Genre guard.** A programme is dropped from a channel when the show it names belongs to another
genre: Miss Marple cannot appear on CITV, and Danger Mouse cannot appear on Classic Sitcoms.
Programmes that name no known show are kept. This applies to both the searches and the scraped
lists.

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
