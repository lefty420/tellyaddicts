// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.43",
  "version": "0.54.43",
  "code": 5443,
  "date": "2026-11-27",
  "notes": [
    "**Big saved files no longer freeze the screen while they are read.** The saved library (13 MB), the Magic EPG episode and film lists, each channel's schedule and On Demand's saved rows are now handed to the page in the background by the TV app. Reading them used to hold the screen: up to 1.5 seconds for the library and most of a second for each On Demand channel, again and again while the rows filled in.",
    "**Back from a video always puts On Demand back as it was, at once.** When On Demand had not been marked on the way out (for example after Options), Back built the whole page again, which took about 8 seconds. The page is only hidden while a video plays, so it is now simply shown again.",
    "**Start-up waits less:** the episode lists and channel schedules it reads before the guide opens are read in the background too.",
    "Needs the new APK (the TV app now serves the saved files to the page)."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.54.36",
      "date": "2026-11-27",
      "notes": [
        "**Shows that exist only on YouTube now appear on every channel that lists them**, not just the one channel the scraper filed them under. Beadle's About was only on Saturday Night; it is now also on Entertainment, ITV and 80's TV. This was why many shows seemed to be missing from channels.",
        "**ITV, BBC, 80's TV and 90's TV now include YouTube-only British shows** (about 170 of them, from a built-in list of who made each show and when it began), as the library shows already did.",
        "The saved On Demand lists are rebuilt once in the background to pick this up. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.35",
      "date": "2026-11-27",
      "notes": [
        "**Back from a video remembers where On Demand was left**, whichever way you left it, so Back restores the page instead of rebuilding it (the slow way took 8 to 10 seconds).",
        "**TMDB results are logged and shown.** The artwork scan now logs \"TMDB found / no match / failed\" for each show and film, and the TMDB key row in Options shows the running count.",
        "**The scan's first line is clearer:** shows and films are counted separately, with how long the list took to work out.",
        "A bogus \"262625 ms\" timing line in the log is no longer written. JavaScript only."
      ]
    }
  ]
};
