# British TV (Android TV / Google TV / NVIDIA Shield)

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

1. Top of the Pops (`tot-p-1985-big-hits` plus a search for more)
2. Classic BBC (search, **unverified**)
3. ITV Morning (search for TV-am / GMTV / Good Morning Britain / This Morning, **unverified**)
4. Classic Sitcoms (`classic-british-tv-pack`)
5. Game Shows (The Crystal Maze, `the-crystal-maze-complete_202401`)
6. The Bill (`the-bill-complete-series-1-to-26`)
7. Christmas TV (`uk-tv-show-christmas-specials` and `uk-tv-shows-christmas-specials`)
8. 70s TV (search of the `classic_tv_1970s` collection)
9. Adverts & Continuity (search, **unverified**)

Items that only contain `.avi`/`.mkv` originals will not play unless archive.org has made an
`.mp4` copy next to them.

## Remote controls

| Key | Watching | In the guide |
| --- | --- | --- |
| Up / Down | Change channel | Move between channels |
| Left / Right | Seek 30 s | Move between programmes (Left stops at what is on now) |
| Channel +/- | Change channel | Page up / down through channels |
| OK | Open guide | Watch the selected channel |
| Guide / Red | Open guide | Red jumps back to Now |
| Rewind / Fast-forward | Seek 30 s | Earlier / Later (2 hours) |
| Green / Yellow / Blue | | Later / Earlier / Watch |
| Info | Show what is on | |
| Play/Pause | Pause or resume | |
| Number keys | Jump to a channel number | |
| Back | Press twice to exit | Close guide |

The guide is styled after the classic UK satellite-TV programme guides: blue background, a mini
TV window top-left, a half-hour time grid with the selected programme highlighted, and a
red/green/yellow/blue button bar. Remotes without colour buttons (such as the Shield remote) can
use Rewind/Fast-forward and OK instead. Runs of short clips (such as Top of the Pops songs) are
shown as one block of about half an hour.

## Get the APK

1. Push this repo to GitHub (the `.github/workflows/build-british-tv.yml` workflow is included).
2. Open the **Actions** tab, choose **Build British TV APK**, press **Run workflow**.
3. Download the **british-tv-apk** artifact and unzip it to get `app-debug.apk`.

Install on the TV with the Downloader app or `adb install app-debug.apk`.

## Editing channels

Change `app/src/main/assets/channels.js`. Examples:

```js
{ n: 10, id: 'blackadder', name: 'Blackadder',
  sources: [{ item: 'classic-british-tv-pack', include: '^Blackadder/' }] }
```

`include` is a regular expression matched against file paths inside the item.
