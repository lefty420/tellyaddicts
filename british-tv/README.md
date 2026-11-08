# Telly Addicts (Android TV / Google TV / NVIDIA Shield)

The app is called Telly Addicts on the TV. Its package name is still `app.britishtv`, so updates install over the previous version.

A separate app: classic British telly as channels with a TV guide, built from public
archive.org uploads. Nothing is hosted by the app; it reads archive.org directly on the TV.

## How it works

- Each channel (see `app/src/main/assets/channels.js`) is a list of archive.org items and/or searches.
- On start the app reads each item's file list, keeps the playable **mp4** files, and parses air
  dates out of file names such as `Top of the Pops (1976 08 26) Song.mp4`.
- Programmes are put in a fixed shuffled loop per channel, timed by the clock, so a channel is
  "on" at a set point whenever you tune in, like real TV.
- Channels that find nothing playable are hidden. Lists are cached on the device for 24 hours.

## Current channels

1. Music (Top of the Pops via `tot-p-1985-big-hits` plus a title search, and The Chart Show episodes found by title search; bare-year items are skipped)
2. Classic BBC (search, **unverified**)
3. ITV Morning (This Morning, GMTV, Daybreak, Lorraine and TV-am from the `Itvcitv` item, programmes of 10 minutes or more only)
4. Classic Sitcoms (`classic-british-tv-pack`)
5. Game Shows (The Crystal Maze, The Generation Game, Catchphrase, Supermarket Sweep, Wheel of Fortune UK)
6. The Bill (`the-bill-complete-series-1-to-26`)
7. Christmas TV (`uk-tv-show-christmas-specials` and `uk-tv-shows-christmas-specials`)
8. 70s TV (search of the `classic_tv_1970s` collection)
9. Adverts & Continuity (search, **unverified**)
10. ITV (the rest of the `Itvcitv` item: evenings, SMTV, CD:UK; no CITV or morning shows)
11. Noel's House Party (`noel-s-house-party`)
12. CITV (CITV shows from `Itvcitv`, Knightmare, The Trap Door, Art Attack, Dogtanian, The Real Ghostbusters, Maid Marian, Bananaman, Rainbow, DuckTales, Transformers, Gummi Bears, Sonic, Super Mario and many more; see `channels.js`)
13. Video Games (Gamesmaster episodes plus a search for Bad Influence, **unverified**)
14. Comedy (Bottom, One Foot in the Grave, Keeping Up Appearances, Red Dwarf, The Vicar of Dibley, Sooty, Bread, 'Allo 'Allo!)
15. Children's World (the BBC children's VHS and DVD collection)
16. Kids Movies (children's films; starts with Beauty and the Beast: The Enchanted Christmas)
17. Children's Christmas (only the Christmas / Xmas files from the CITV sources and the BBC children's collection)

CITV is also the test channel for advert breaks: after each show finishes, two random toy adverts from the `uk-adverts` collection play before the next show (`adBreak` in `channels.js`).

When an item lists the same programme twice, the small `.ia.mp4` copy is used in preference to a larger plain `.mp4`.

Items that only contain `.avi`/`.mkv` originals will not play unless archive.org has made an
`.mp4` copy next to them.

## Remote controls

| Key | Watching | In the guide |
| --- | --- | --- |
| Up / Down | Change channel | Move between channels |
| Left / Right | Seek 30 s | Move between programmes (Left stops at what is on now) |
| Channel +/- | Change channel | Page up / down through channels |
| OK | OSD bar at the bottom: programme info, progress, rewind 30s, play/pause, forward 30s, picture size (Auto, 4:3, 16:9, Zoom, Stretch) and TV Guide and Enhance (Left/Right to choose, OK to use) | Watch the selected channel |
| Guide / Red | Open guide | Red jumps back to Now |
| Rewind / Fast-forward | Seek 30 s | Earlier / Later (2 hours) |
| Green / Yellow / Blue | | Later / Earlier / Watch |
| Info (or hold OK for half a second) | Show what is on | Shows sources that are not playing and the exact archive.org file of the highlighted programme |
| Play/Pause | Pause or resume | |
| Number keys | Jump to a channel number | |
| Back | Press twice to exit | Close guide |

The guide is styled after the classic UK satellite-TV programme guides: blue background, a mini
TV window top-left, a half-hour time grid with the selected programme highlighted, and a
red/green/yellow/blue button bar. Remotes without colour buttons (such as the Shield remote) can
use Rewind/Fast-forward and OK instead. Runs of short clips (such as Top of the Pops songs) are
shown as one block of about half an hour.

## Episode names

File names on archive.org are often messy, so once a channel has loaded the app looks up real episode names on
TVmaze (free, no key) for anything shown as `Show S04E12`. It only swaps the name when the show matches and that
season/episode number exists (and, if the file has an air date, when the years agree). Results are cached for 30 days.
In the guide, Info shows the exact archive.org file behind the highlighted programme.

## Picture quality

The programmes are old and low resolution, so the picture is helped in two ways:

1. **The TV box's own upscaler.** On an NVIDIA Shield turn on *Settings > Display & Sound > Advanced > AI upscaling*
   (set it to High) and output 4K. The Google TV Streamer also upscales to 4K.
2. **Enhance** (OSD bar, the last button). These are screen effects, not a re-render of the video, so they work on any
   video and cannot fail because of the source:
   - **CRT**: scanlines, a faint colour grille, a soft glow and a darker screen edge, like an old tube telly
   - **Vivid**: more contrast and colour
   - **Sharp**: a sharpening filter on the picture

   If the TV struggles to keep up with CRT or Sharp (lots of dropped frames), the app drops back to Vivid by itself.

## Get the APK

1. Push this repo to GitHub (the `.github/workflows/build-british-tv.yml` workflow is included).
2. Open the **Actions** tab, choose **Build Telly Addicts APK**, press **Run workflow**.
3. Download the **tellyaddicts-apk** artifact and unzip it to get `tellyaddicts.apk`.

Install on the TV with the Downloader app or `adb install tellyaddicts.apk`.

## Editing channels

Change `app/src/main/assets/channels.js`. Examples:

```js
{ n: 10, id: 'blackadder', name: 'Blackadder',
  sources: [{ item: 'classic-british-tv-pack', include: '^Blackadder/' }] }
```

`include` is a regular expression matched against file paths inside the item. `minDur: 600` on a source
skips anything shorter than that many seconds.

## Programme info

The OSD (press OK while watching) has an **Info** button on the right, and holding OK during playback opens the same panel. It looks the programme up on TVmaze and shows the poster, fanart, year, network, rating and a summary: the episode's own summary if TVmaze has one, otherwise the show's.

## Speed and the guide

Each channel's list of programmes (and the links to them) is stored on the TV for 7 days and in a compact form, so the app starts without asking archive.org again. The guide's schedule is worked out from that list, so it stays the same all week. Real episode names found online are stored too. In the guide, pressing OK on any programme plays it from the start, whatever the time; the channel carries on from there. The programme airing now joins in progress as before.

## Adverts and Auto EPG (OSD)

- **Artwork**: the OSD shows the show poster (lifted above the bar) with a faint fanart backdrop, from TVmaze, when found.
- **Extra metadata** (Options, On/Off, controls both the OSD poster and the guide fanart): the highlighted programme's show fanart fades in behind the guide header (TVmaze; TV shows only). On/Off in Options.
- **Options** (OSD > Options): Picture, Enhancements, Extra metadata, Adverts and Auto EPG in one panel (Up/Down to choose, Left/Right or OK to change).
- **Adverts**: Off / All (70s-90s, leaning 80s and 90s) / 1970s / 1980s / 1990s. Breaks play between episodes and match the channel: toys and sweets (CITV, Children's World, Disney, kids channels), console adverts (Video Games), album and cassette adverts (Music, MTV), household and food (ITV Morning, I'm Off School) and ITV / Channel 4 / Channel 5 / Sky / cable breaks on the rest. UK first: the UK adverts collection is searched first and played about 4 times in 5; anything titled USA/American or BBC is dropped. Never BBC. Classic BBC and Adverts & Continuity have no breaks. Logic is in `ads.js`; pools are cached for 7 days (`ads2:` keys).
- **Auto EPG** (Options, experimental, default Off): builds each channel from three searches (main keywords, related shows, undated uploads) limited to 1970-1999 (`auto.js`), re-picks daily, skips trailers / DVD menus / whole-disc files, drops duplicate titles, uses sensible length limits per channel (music videos allowed on music channels, no 1970s Top of the Pops) and tops a thin channel up from its normal sources. A channel with no results falls back to its normal sources. Toggling restarts the app on the loading screen.
- **archive.org links** are always built as `https://archive.org/download/<id>/<file>` with the same escaping as Python's `quote(name, safe=",()'-")`; saved links on regional nodes are rewritten to that form (`Engine.archiveUrl` / `canonicalUrl`).

- **CITV** leaves out DVD / disc files and anything over 35 minutes.
