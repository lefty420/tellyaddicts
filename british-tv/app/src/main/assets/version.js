// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.37",
  "version": "0.54.37",
  "code": 5437,
  "date": "2026-11-27",
  "notes": [
    "**62 shows that were on no channel now have one:** Christmas specials on Christmas Movies, classic sitcoms (The Good Life, Till Death Us Do Part, Only When I Laugh...) on Sitcoms, Rentaghost and T-Bag on Children's World, Reeves and Mortimer on Comedy and Saturday Night, and the rest on Light Entertainment, Cartoons or Drama. The lists are fetched from the web, so they reach the TV without a new APK; the version also adds ITV/BBC for six of them."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.54.34",
      "date": "2026-11-27",
      "notes": [
        "**Fixes a crash in Options > Artwork.** The new \"Artwork from\" row had no place on the screen, so opening Options crashed the app. JavaScript and layout only."
      ]
    },
    {
      "name": "Alpha 0.54.33",
      "date": "2026-11-27",
      "notes": [
        "**Choose the artwork service in Options.** Options > Artwork now has an **Artwork from** row: TheTVDB, TMDB or TVmaze. The artwork scan asks that service first, and falls back to the next one when it has no match. A service without its key is marked as needing one and is skipped.",
        "**TMDB artwork.** The scan can now fetch posters and backdrops for shows and films from TMDB, using the key you enter under TMDB key. Attribution: this product uses the TMDB API but is not endorsed or certified by TMDB.",
        "The episode guide source row is unchanged. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.32",
      "date": "2026-11-27",
      "notes": [
        "**On Demand's index builds run in slices and wait for Options.** Building a channel's index (tv70s, tv80s, citv and the rest) used to hold the screen for up to 13 seconds, and Options stalled while it ran. It now works in short slices and waits until Options is closed.",
        "**Closing Options with On Demand open remembers where On Demand was left**, so Back from a video restores the page. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.31",
      "date": "2026-11-27",
      "notes": [
        "**Options stays responsive while the artwork scan works out what is missing.** The list of shows is now worked out in short slices, not one block, so opening Options during a scan no longer freezes for seconds.",
        "**Library sort takes smaller bites**, so Options does not stall while the library is being sorted into channels.",
        "**A changed YouTube list rebuilds On Demand after you leave On Demand and Options**, not while you are in them. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.30",
      "date": "2026-11-27",
      "notes": [
        "**Going Back from a video no longer rebuilds On Demand.** Back used to redraw the whole page from scratch, which froze the screen for 11 to 14 seconds. It now puts back the page as it was, and the rebuild only happens if the page is no longer there. Starting an episode from On Demand (including Play Next) now always remembers where you were. JavaScript only.",
        "**Options no longer stalls while it is open.** Background jobs (episode names and the quiet artwork check) now wait until Options is closed. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.29",
      "date": "2026-11-27",
      "notes": [
        "**On Demand stays smoother while artwork loads.** A poster or background that arrives while you are moving around used to redraw the rows straight away, in the middle of a key press. Redraws from new artwork are now batched and wait until you stop pressing keys. JavaScript only."
      ]
    }
  ]
};
