// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.45",
  "version": "0.54.45",
  "code": 5445,
  "date": "2026-11-27",
  "notes": [
    "**Santa and the snow keep moving while you move around the guide.** Every button press stopped the snow, the drifts and Santa's plough for a fifth of a second, so moving through the guide made Santa stutter across the screen (stopped about one tenth of the time on the SHIELD). Measured with and without the pause, buttons answer just as fast without it (14 to 15 ms typical), so it is gone.",
    "**The debug log's \"Santa's plough sets off\" time is right again.** Those pauses pushed the plough later and later than the time the log gave (26 seconds out after a while). JavaScript only."
  ],
  "history": [
    {
      "name": "Alpha 0.54.44",
      "date": "2026-11-27",
      "notes": [
        "**Start-up holds the screen less.** The 35 channel lists read before the guide opens are now read in the background too (they took up to 2.8 seconds on the SHIELD, in one stretch).",
        "**Other shows' episodes no longer turn up under the wrong show.** An archive.org favourites list called \"Wheel of Fortune Game Show Network\" held A Charlie Brown Christmas, Barney and Jay Jay the Jet Plane, so they were on Game Shows as Wheel of Fortune. A file from a favourites list now has to name its show, and a file named for a different show in the library (Fireman Sam filed under Pingu) goes with that show. Checked over the whole library: it removes 10 files and nothing else. Each TV sorts the library again once.",
        "**A Charlie Brown Christmas, The Good Life, Mr Bean, The Snowman and 59 other YouTube shows are off Game Shows.** A YouTube show the scraper gave no channel was put on Game Shows; it now goes only on the channels that list it (every one of them is listed somewhere).",
        "**The YouTube list is kept on the TV again.** It grew to 6 MB, which no longer fitted where it was saved, so every start downloaded it again (the saved copy dated from 23 November). It is now kept as a file, read in the background, and fetched again every 6 hours as intended.",
        "**Looking for artwork that was never saved costs nothing.** Posters, backdrops and episode details are looked up for many shows at once (the hero, the rows); a show with nothing saved was still asked for its file each time, which added up to almost half a second. The app now knows which files exist. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.43",
      "date": "2026-11-27",
      "notes": [
        "**Big saved files no longer freeze the screen while they are read.** The saved library (13 MB), the Magic EPG episode and film lists, each channel's schedule and On Demand's saved rows are now handed to the page in the background by the TV app. Reading them used to hold the screen: up to 1.5 seconds for the library and most of a second for each On Demand channel, again and again while the rows filled in.",
        "**Back from a video always puts On Demand back as it was, at once.** When On Demand had not been marked on the way out (for example after Options), Back built the whole page again, which took about 8 seconds. The page is only hidden while a video plays, so it is now simply shown again.",
        "**Start-up waits less:** the episode lists and channel schedules it reads before the guide opens are read in the background too.",
        "**Channels built after a library update no longer freeze the start-up.** Each channel is now worked out a row at a time, not in one go (that took up to 5 seconds per channel).",
        "Needs the new APK (the TV app now serves the saved files to the page)."
      ]
    },
    {
      "name": "Alpha 0.54.42",
      "date": "2026-11-27",
      "notes": [
        "**A show with no poster is looked up as soon as you stop on it.** In On Demand (the rows, a show's page and Browse), resting on a show that has no poster, or only the scraper's stand-in picture, asks the artwork services there and then: the one chosen under Options > Artwork first, then the others that can be asked (TheTVDB and TMDB need their keys). The poster appears as soon as one is found.",
        "**What each look found is written to the debug log** as a POSTER line (found on which service, or which services had nothing). Shows that no service has a poster for are listed together at the end of the debug log, ready to send to the scraper.",
        "**Options > Scan my artwork now looks up shows that only have a stand-in poster.** It used to skip any show with a picture and a backdrop, stand-in or not. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.41",
      "date": "2026-11-27",
      "notes": [
        "**Fewer freezes in On Demand and Options.** Building On Demand's rows checked every show for a saved artwork fix by reading a file, one show at a time, even though almost no show has one. That held the screen for up to a second per channel, over and over while the rows were built. The app now knows which fixes exist and skips the rest.",
        "**The TV's own storage is no longer full.** Episode lists saved by earlier versions were left in the page's storage after they moved to files. They are never read from there, but they filled it (5 MB), so the debug log stopped being saved and settings were kept only in their files. They are cleared once at start. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.40",
      "date": "2026-11-27",
      "notes": [
        "**YouTube episodes have pictures.** Episode cards for a YouTube copy (Beadle's About and the other YouTube-only shows) used to be blank; they now show the video's own thumbnail, as does an archive.org episode whose upload is shared with other episodes when it has a YouTube copy.",
        "**A missing episode tries its YouTube copy sooner.** When no addon has an episode, the app now plays the YouTube copy it already knows about before starting a fresh archive.org search (which could take 25 seconds). An archive.org link found before still comes first.",
        "**The missing episodes report counts what you actually have.** Since On Demand moved to its saved index, the report saw no episodes at all and listed every one as missing. It now counts the archive.org files and the YouTube copies, but not the guide's stand-in episodes. `tools/missing_report.py` counts the YouTube copies too.",
        "**No show is left without a poster.** When TMDb, TVmaze and TheTVDB have no poster, the scraper now sends the show's archive.org picture or a frame from one of its YouTube videos (marked as a stand-in), and the TV's own artwork scans keep looking for a real poster for those shows. This arrives with the next artwork send from the scraper."
      ]
    },
    {
      "name": "Alpha 0.54.39",
      "date": "2026-11-27",
      "notes": [
        "**Back twice to quit is easier to do.** The two presses can now be up to 1.5 seconds apart (it was 0.8), and the gap is measured from when you pressed Back, not from when the busy screen got round to it, so a slow redraw after the first press no longer makes the second one miss. On the On Demand start screen, Back from a row now counts as the first press, so it takes two presses there, not three. Needs the new APK (the TV app now stamps each key press with its time)."
      ]
    },
    {
      "name": "Alpha 0.54.38",
      "date": "2026-11-27",
      "notes": [
        "**Season codes with a year in them (Top of the Pops S1976E01) are split properly in the guide**, so the show name is no longer shown with the code stuck on it. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.37",
      "date": "2026-11-27",
      "notes": [
        "**62 shows that were on no channel now have one:** Christmas specials on Christmas Movies, classic sitcoms (The Good Life, Till Death Us Do Part, Only When I Laugh...) on Sitcoms, Rentaghost and T-Bag on Children's World, Reeves and Mortimer on Comedy and Saturday Night, and the rest on Light Entertainment, Cartoons or Drama. The lists are fetched from the web, so they reach the TV without a new APK; the version also adds ITV/BBC for six of them."
      ]
    }
  ]
};
