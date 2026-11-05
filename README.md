# Telly Addicts

Classic British telly on your Android TV, Google TV or NVIDIA Shield. Telly Addicts turns public
archive.org uploads into live-style channels with a classic satellite-style TV guide: flip through
Top of the Pops and music, old BBC and ITV, sitcoms, game shows, CITV, The Bill and more, and
whatever you tune to is "on" at the same point for everyone, like real TV.

Nothing is hosted by the app. It reads archive.org directly on the TV and plays only mp4 files.

## Features

- Channels built from archive.org items and searches, set up in one file (`channels.js`)
- Blue-grid TV guide with a mini TV window, half-hour time grid and red/green/yellow/blue buttons
- TV static between channel changes, and guide entries that fill in as channels load
- Tidy programme names, for example "The Bill S11E71 Kicking" or "Minder S04E04"
- Remote-friendly: channel up/down, number keys, Guide and Info buttons

## Channels

Music (Top of the Pops, The Chart Show), Classic BBC, ITV Morning, Classic Sitcoms, Game Shows,
The Bill, Christmas TV, 70s TV, Adverts & Continuity, ITV, Noel's House Party, CITV and Video Games.
The full list and the archive.org sources behind each one are in
`british-tv/app/src/main/assets/channels.js`. Channels that find nothing playable hide themselves.

## Get the APK (no Android Studio needed)

1. Open the repo's **Actions** tab and pick **Build Telly Addicts APK** (it runs on every push to
   `main`, or press **Run workflow**).
2. Open the finished run and download the **tellyaddicts-apk** artifact.
3. Unzip it to get `tellyaddicts.apk`.

Every build is signed with the same key, so a new APK installs over the previous one. If an install
fails, uninstall the old app first (needed once for builds made before the fixed key).

## Install on the TV

- **Downloader app:** host `tellyaddicts.apk` somewhere with a direct link and open it in
  Downloader, allowing "Install unknown apps" when asked.
- **adb:** enable Developer options and network debugging, then `adb connect <tv-ip>` and
  `adb install tellyaddicts.apk`.

## Project layout

- `british-tv/` is the Telly Addicts app (package `app.britishtv`). See `british-tv/README.md` for
  the remote controls and how to edit channels.
- The `app/` folder at the top level and its workflow (`Build APK`) are an older, unrelated
  WebView wrapper for spelunkr.tv. Telly Addicts does not use any of it.
