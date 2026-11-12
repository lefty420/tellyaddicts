# Telly Addicts

Classic British telly on your Android TV, Google TV or NVIDIA Shield. Telly Addicts turns public
archive.org uploads into live-style channels with a Sky-style TV guide, plus an On Demand browser for picking a
show and an episode yourself. Whatever channel you tune to is "on" at the same point for everyone, like real TV.

A spiritual UK cousin of Spelunkr.tv: the same idea of turning an open archive into channels you can
channel-surf, written from scratch around British television. None of its code is used here.

Nothing is hosted by the app. It reads archive.org directly on the TV and plays only video files that the
TV's player can handle (mp4, m4v and mkv; no AVI).

Current release: **Alpha 0.38**. `CHANGELOG.md` has every release, newest first.

## Who changes what

This app and the [Telly Addict Scraper](https://github.com/lefty420/Telly-addict-scraper) are worked on in two
separate chats, so the line between them is:

* **This repository is the TV app's.** Its code is changed here: `british-tv/app/**`, `tools/**` and the READMEs.
* **The scraper owns the data.** In this repository it writes only `british-tv/data/**`: the library, the
  per-channel lists, artwork, episode guides and routes. Those files are generated, never hand-edited here.
* **`tools/shows.json` is the contract between them.** It lists which shows belong on which channel. The TV
  reads it at run time (so editing it needs no new build) and the scraper reads it to route what it publishes.
  It lives here, and the scraper's category lists should follow it.

Either side can read the other's repository at any time, and should, before changing anything that crosses the line.

## What the app does

**Channels and guide**

- 28 channels (see the table below), all defined in one file, `channels.js`. A channel that finds nothing to play
  hides itself, and `off: true` switches one off by hand.
- Sky-style guide: blue grid, half-hour time bar, mini TV window, colour buttons. The app opens in the guide.
  Up from the first channel goes round to the last, and Down from the last goes back to the first.
- Every channel is a fixed loop timed by the clock, so a programme is "on" at the same point whenever you tune
  in, and the guide can be scrolled weeks ahead. Some channels have time-of-day rules (Saturday Night TV,
  Soaps' evening slots, the Drama channel's daytime mix).
- TV static for a moment on every channel change (and only then).
- Tidy programme names ("The Bill S11E71 Kicking") with real episode titles, from the scraper's episode guides or TVmaze.
- A certificate gate and a watershed: a film with no certificate is never scheduled, and adult-rated films only
  play late. Adult content is kept off every channel.
- Era: programmes are 1970 to 1999 (the Disney channel's old shorts are exempt).

**On Demand**

- A Netflix-style browser: nine posters across each channel row, a hero with the show's fanart, years, network and
  summary. Open it with Blue, Menu, the On Demand button on the bar, or the button in the guide.
- A show page with season chips; anything that does not fit a numbered season goes in "Other videos" after the
  last season. Episode rows show the episode's own still where there is one, and the show's artwork otherwise.
- Opening it while something plays lands on that show's page, on the season and episode that is on.
- Includes the film channels (each film is its own title).
- Hold OK (or Menu or Info) on a show opens an artwork menu: scrape TVmaze again, choose the right show, or pick a
  poster or background by hand, like the Kodi scrapers. Choices are kept on that TV.

**Watching**

- On-screen bar (press OK): TV Guide, rewind, play/pause, forward, Play Next, Restart, Info, On Demand, Options.
- **Play Next** finds the next episode from a local link database first and archive.org second. If it will not
  play, what you were watching carries on.
- **Info** (or hold OK) shows the poster, fanart, year, network, rating and a summary.
- Programmes that give sound but no picture are skipped.
- Back while watching opens the guide; in the guide, Back twice exits.

**Options**

- **On Demand** shortcut, **Aspect ratio** (Auto, 4:3, 16:9, Zoom, Stretch).
- **Enhancements**: Off, VHS, VHS 2, Vivid, Sharp, Scanlines, Aperture grille, Curved glass, Portable set, Shadow
  mask. VHS and VHS 2 take their slight blur off by themselves if the TV starts dropping frames; the scan lines
  and colour stay.
- **Artwork**, **Keep artwork & details** and **Clear saved artwork**: posters and episode details.
- **Adverts**: Off, All (70s to 90s), 1970s, 1980s, 1990s. Period breaks matched to the channel, UK adverts
  first, never BBC.
- **Buffer**: Off, 50, 100 or 250 MB, for slow connections.
- **Auto EPG**: builds channels from the scraper's library, and **Keep listings for** (24 hours to 4 weeks) is
  how long a running order stays before it is built again. **Refresh listings** rebuilds everything now.
- **What's new**, **About**, **Missing episodes report** and **Debug log**.

**Missing episodes report.** Options > Missing episodes report checks every show on the TV against its episode
guide (counting 1999 and earlier only) and lists the seasons and episodes the TV does not have. It serves the
result as text on the home network so you can copy it from a phone or computer and give it to the scraper.

**Debug log.** Options > Debug log serves the log (version, device, what can be played, failures, buffer notes)
on the home network the same way. Frame-drop lightening of VHS effects is noted in it.

## Channels

| # | Channel | # | Channel |
| --- | --- | --- | --- |
| 1 | Music | 15 | Comedy |
| 2 | MTV | 16 | Children's World |
| 3 | Classic BBC | 17 | Kids Movies |
| 4 | ITV Morning | 18 | Children's Christmas |
| 5 | Classic Sitcoms | 19 | Christmas Music |
| 6 | Game Shows | 20 | I'm Off School (daytime soaps and talk) |
| 7 | Drama | 21 | Disney |
| 8 | Christmas TV | 22 | TV Archive (on this day, news) |
| 9 | 70s TV | 23 | Saturday Night TV |
| 10 | Adverts & Continuity | 24 | The Video Shop |
| 11 | ITV | 25 | Soaps |
| 12 | Noel's House Party (switched off) | 26 | Food & Cooking |
| 13 | CITV | 27 | Entertainment |
| 14 | Video Games | 28 | US Sitcoms |

A few channels are built differently. **Entertainment** is a mix (light entertainment, panel and sketch shows,
sitcoms and cult drama): its shows stay on their own channels as well, marked `"extra": true` in `shows.json`.
**US Sitcoms** stays out of the guide until the library has some. **Christmas TV** and **Children's Christmas**
are filled from episodes the scraper flags as Christmas ones. **TV Archive** carries news and the BBC Archive "on this day" clips.

## How the data reaches the TV

The scraper publishes to `british-tv/data/` and the TV fetches it from GitHub at start-up, so new content needs
no new APK: **scrape, commit, push.**

| File | What it is |
| --- | --- |
| `library.json` | every show and episode the scraper holds, with TVmaze details and film certificates |
| `index.json` | a revision for each channel, plus the library, routes, artwork and guides |
| `<channel>.json` | a channel's own list (used when the library routes nothing to it, e.g. cooking) |
| `routes.json` | the scraper's latest word on where its shows go; wins over `shows.json` for shows it lists |
| `art.json` | posters and backgrounds |
| `eps/<slug>.json` | an episode guide per show: titles, dates, runtimes, summaries and stills |
| `removed-shows.json` | shows removed for good |

The TV routes the library to channels itself (`libroute.js`) using `tools/shows.json`, so editing that file
re-routes shows at the next start with no scrape and no build. If something cannot be reached, the TV falls back to
the per-channel files and then to the copy bundled in the app (`autodata.js`).

**Saved on the TV.** Channel lists, episode guides and artwork answers are saved as files by the app (not in the
page's small storage, which 28 channels would fill). Settings and any artwork you pick by hand stay in the page.

## Remote controls

| Key | Watching | In the guide |
| --- | --- | --- |
| Up / Down | Change channel | Move between channels (goes round) |
| Left / Right | Seek 30 s | Move between programmes; Left from "now" reaches the On Demand button |
| Channel +/- | Change channel | Page up / down |
| OK | Open the on-screen bar | Watch the selected programme |
| Hold OK | Programme info | |
| Guide / Red | Open guide | Red jumps back to Now |
| Green / Yellow | | Later / Earlier |
| Blue / Menu | On Demand | On Demand |
| Number keys | Jump to a channel | |
| Back | Open the guide | Back to what is playing (twice to exit) |

In On Demand, OK opens a show or plays an episode, and holding OK opens the artwork menu.

## Get the APK (no Android Studio needed)

1. Open the repo's **Actions** tab and pick **Build Telly Addicts APK**. It runs on every push to `main`, or press
   **Run workflow**. Pushes to other branches do not build.
2. Open the finished run and download the **tellyaddicts-&lt;version&gt;** artifact.
3. Unzip it to get `tellyaddicts.apk`, plus `CHANGELOG.md` and `VERSION.txt`.

Every build is signed with the same key, so a new APK installs over the previous one. If an install fails,
uninstall the old app first.

**Install on the TV:** the Downloader app (host the APK at a direct link and allow "Install unknown apps"), or
`adb connect <tv-ip>` then `adb install tellyaddicts.apk`.

## Releases

Releases are named `Alpha 0.38`; a quick fix on top gets a third number (`Alpha 0.38.1`). `CHANGELOG.md` is the only
place a release is written down. `python3 tools/make_version.py` reads it and sets the version in the app and on
the APK (the build runs it too), so the TV, the APK and the changelog cannot disagree. To release: add a
`## Alpha 0.39 — YYYY-MM-DD` heading at the top with a `- ` line per change, run the script, commit, push to `main`.
On the TV, Options > What's new shows the list.

## Project layout

- `british-tv/` is the app (package `app.britishtv`). See `british-tv/README.md` for how it works inside.
- `british-tv/data/` is the scraper's published data (generated, do not edit).
- `tools/` is helper scripts and the contracts with the scraper (below).
- `.github/workflows/build-british-tv.yml` builds `tellyaddicts.apk`.

## Tools (`tools/`)

- `shows.json` is the genre lists, the contract with the scraper. `make_shows.py` regenerates the show lists in
  `auto.js` from it.
- `make_version.py` sets the version from `CHANGELOG.md`.
- `missing_shows.py` writes `missing-shows.md` (shows on a list with no files), and `missing_report.py` writes
  `missing-for-scraper.json`, the hand-off file of what to find: shows with no files, and the seasons and episodes
  held for the rest.
- `import_scrape.py` builds channel lists from a scraper library offline (the scraper normally publishes these itself).
- `check_sources.py` tests every source in `channels.js` and writes `sources-report.txt`.
- `art-contract.md`, `meta-contract.md` and `schedule-notes.md` describe the artwork and episode-guide files the
  scraper publishes, and scheduling decisions to carry into the next schedule engine.

The Python tools need a computer that can reach archive.org.
