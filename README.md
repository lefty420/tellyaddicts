# Telly Addicts

Classic British telly on your Android TV, Google TV or NVIDIA Shield.

Telly Addicts turns public archive.org uploads into TV channels with a classic satellite-style guide. Tune
in and whatever is on is on at the same point for everyone, just like real TV. If you would rather pick for
yourself, there is an On Demand browser with posters, seasons and episodes.

Nothing is hosted by the app. It reads archive.org directly on the TV and plays the video files the TV can
handle (mp4, m4v and mkv). It is a UK cousin of Spelunkr.tv, written from scratch; none of that code is used here.

Current release: **Alpha 0.38**. Every release is listed in `CHANGELOG.md`.

## What you get

- **28 channels.** Music, comedy, game shows, drama, soaps, kids, films, cooking, entertainment, American
  sitcoms, Christmas, news and more. A channel with nothing to play hides itself.
- **A TV guide.** Scroll weeks ahead, jump to now, and the list wraps from the last channel back to the first.
- **On Demand.** Browse by channel, open a show, pick a season and an episode. Hold OK on a show to fix its artwork.
- **Period adverts** between programmes, matched to the channel and the decade.
- **Picture looks.** Scan lines, tube styles and a couple of VHS modes, and the buffer for slow connections.
- **Play Next, programme info and episode names** worked out for you.
- **A UK-only, 1970 to 1999 feel.** Nothing adult, and films only play when their certificate allows.

## Controls

| Key | Watching | In the guide |
| --- | --- | --- |
| Up / Down | Change channel | Move between channels |
| Left / Right | Seek 30 seconds | Move between programmes |
| OK | Open the on-screen bar | Watch the selected programme |
| Hold OK | Programme info | |
| Blue / Menu | On Demand | On Demand |
| Red / Green / Yellow | Guide | Now / Later / Earlier |
| Back | Open the guide | Back to what is playing (twice to exit) |

## How it is put together

- **The app** is in `british-tv/app/`, with helper scripts in `tools/`.
- **The channel data** (library, lists, artwork, episode guides) is published into `british-tv/data/` and fetched
  by the app at start-up, so new content reaches the TV without an update. Those files are generated, so they are
  never edited by hand.
- **`tools/shows.json`** says which shows belong on which channel. The app reads it at run time, so changing it
  needs no new build.

## Getting the app

1. Open the **Actions** tab on GitHub, pick **Build Telly Addicts APK**, and open the latest successful run.
2. Download the **tellyaddicts** artifact and unzip it to get `tellyaddicts.apk`.
3. Install it with the Downloader app, or `adb connect <tv-ip>` then `adb install tellyaddicts.apk`.

Every build is signed with the same key, so a new one installs over the old. A build runs on every push to
`main`. To make a release, add a heading to `CHANGELOG.md` such as `## Alpha 0.39 — 2026-11-12` with a bullet
per change, run `python3 tools/make_version.py`, commit and push.

## Reporting problems

- **Options > Debug log** is served on the home network: open the address it shows on a phone or computer and
  copy the page. It is the first thing to send when something misbehaves.
- **Options > Missing episodes report** compares everything on the TV with the episode guides and lists what is
  missing, in the same way.
- `tools/missing_report.py` builds a similar list without needing the TV.

## More

- `british-tv/README.md` explains how the app works inside.
- `tools/` also holds the notes on the published artwork and episode-guide files (`art-contract.md`, `meta-contract.md`).
