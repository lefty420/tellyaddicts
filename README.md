# Telly Addicts

Classic British telly on your Android TV, Google TV or NVIDIA Shield. Telly Addicts turns public
archive.org uploads into live-style channels with a classic satellite-style TV guide: flip through
Top of the Pops and music, old BBC and ITV, sitcoms, game shows, CITV, drama and more, and whatever
you tune to is "on" at the same point for everyone, like real TV.

A spiritual UK cousin of Spelunkr.tv: the same idea of turning an open archive into channels you
can channel-surf, written from scratch around British television. None of its code is used here.

Nothing is hosted by the app. It reads archive.org directly on the TV and plays only mp4 files.

## Who changes what

This app and the [Telly Addict Scraper](https://github.com/lefty420/Telly-addict-scraper) are worked on in two
separate chats, so the line between them is:

* **This repository is the TV app's.** Its code is changed here: `british-tv/app/**`, `tools/**` and the READMEs.
* **The scraper owns itself**, and in this repository writes only `british-tv/data/**` — the channel lists and
  `library.json` its *Send to Telly Addicts* button generates. Those files are generated, never hand-edited here.
* **`tools/shows.json` is the contract between them.** The TV app reads it to decide which channel a show belongs
  on (fetched at run time, so a change needs no new build), and the scraper reads it to route what it sends. It
  lives here; the scraper's category lists should follow it.

Either side can read the other's repository at any time, and should, before changing anything that crosses the
line. Both had built the same feature twice before this was written down.

## Features

**Channels and guide**

- 21 channels built from archive.org items and searches, all set up in one file (`channels.js`)
- Sky-style TV guide: blue grid, half-hour time bar, mini TV window, colour buttons. The app opens
  in the guide
- Every channel is a fixed loop timed by the clock, so a programme is "on" at the same point
  whenever you tune in, and the guide can be scrolled weeks ahead
- TV static for a moment on every channel change, and guide rows that fill in as channels load
- Tidy programme names ("The Bill S11E71 Kicking"), with real episode titles looked up on TVmaze
- Channels that find nothing playable hide themselves

**Watching**

- On-screen bar (press OK): TV Guide, rewind, play/pause, forward, **Play Next**, Restart, Options,
  Info
- **Play Next** finds the next episode of what you are watching, from a local link database first
  and archive.org second. If it will not play, what you were watching simply carries on
- **Info** (or hold OK) shows the poster, fanart, year, network, rating and a summary
- Back while watching opens the guide; in the guide, Back twice exits

**Options panel**

- **Picture**: Auto, 4:3, 16:9, Zoom, Stretch
- **Enhancements**: Off, VHS, Vivid, Sharp
- **Extra metadata**: show poster on the bar and fanart behind the guide
- **Adverts**: Off, All (70s–90s), 1970s, 1980s, 1990s. Period breaks between programmes, matched to
  the channel, UK adverts first, never BBC
- **Auto EPG** (experimental): builds the channels from archive.org searches and scraped lists
  instead of the hand-picked sources, keeping every show in its own genre
- **Keep listings for**: 24 hours, 48 hours, 1 week or 4 weeks, which is also how often the running
  order changes

## Channels

Music, MTV, Classic BBC, ITV Morning, Classic Sitcoms, Game Shows, Drama, Christmas TV, 70s TV,
Adverts & Continuity, ITV, Noel's House Party, CITV, Video Games, Comedy, Children's World,
Kids Movies, Children's Christmas, Christmas Music, I'm Off School (daytime soaps and talk shows),
Disney and On This Day (BBC Archive clips).

The archive.org sources behind each one are in `british-tv/app/src/main/assets/channels.js`.

## Get the APK (no Android Studio needed)

1. Open the repo's **Actions** tab and pick **Build Telly Addicts APK** (it runs on every push to
   `main`, or press **Run workflow**).
2. Open the finished run and download the **tellyaddicts-&lt;version&gt;** artifact, for example
   `tellyaddicts-0.1`.
3. Unzip it to get `tellyaddicts.apk`, plus `CHANGELOG.md` and `VERSION.txt` saying what is in it.

Every build is signed with the same key, so a new APK installs over the previous one. If an install
fails, uninstall the old app first (needed once for builds made before the fixed key).

## Releases

Releases are named `Alpha 0.1`, `Alpha 0.2` and so on; a quick fix on top of one gets a third
number, `Alpha 0.1.1`.

`CHANGELOG.md` is the only place a release is written down. `python3 tools/make_version.py` reads it
and sets the version in the app and on the APK, and the build runs it too, so the version on the
TV, the version of the APK and the changelog can never disagree. To make a release: add a
`## Alpha 0.2 — YYYY-MM-DD` heading at the top of the changelog with a `- ` line per change, run the
script, and commit.

On the TV, **Options > What's new** shows the release name, its date and that list, with earlier
releases below it. The first time a new version runs it says so once, in a corner message.

## Install on the TV

- **Downloader app:** host `tellyaddicts.apk` somewhere with a direct link and open it in
  Downloader, allowing "Install unknown apps" when asked.
- **adb:** enable Developer options and network debugging, then `adb connect <tv-ip>` and
  `adb install tellyaddicts.apk`.

## Project layout

- `british-tv/` is the Telly Addicts app (package `app.britishtv`). See `british-tv/README.md` for
  the remote controls, the channels and every feature in detail.
- `tools/` holds the helper scripts that run on a computer, not on the TV.
- `.github/workflows/build-british-tv.yml` builds `tellyaddicts.apk`.

## Tools

- `python3 tools/check_sources.py` tests every source in `channels.js` and writes
  `sources-report.txt` listing the ones that fail and why.
- `python3 tools/import_scrape.py --library library.db` (or `archive_*.txt`) turns the Telly Addict
  Scraper's master library into ready-made channel lists for Auto EPG, routing every show to the
  channel of its own genre. `tools/shows.json` holds those genre lists. The lists are written to
  `british-tv/data/` and the app fetches them from GitHub at start-up, so a new scrape reaches the
  TV without building a new APK — scrape, commit, push.

Both need a computer that can reach archive.org.
