// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.10",
  "version": "0.46.10",
  "code": 4610,
  "date": "2026-11-14",
  "notes": [
    "**Options no longer hangs when opened from On Demand.** Opening Options from the On Demand hold-OK menu showed the Options screen, but the remote was still moving On Demand underneath it, so Options looked frozen until it closed itself. The remote now works Options, and Back returns to On Demand."
  ],
  "history": [
    {
      "name": "Alpha 0.46.9",
      "date": "2026-11-14",
      "notes": [
        "**Search in On Demand.** Press Yellow on the On Demand screen (or hold OK and choose Search), type part of a name on the on-screen keyboard and press Search. Every channel is searched, and the shows and films that match appear as a \"Search\" row at the top. Search again with the box empty (Clear, then Search) to remove the row.",
        "The on-screen keyboard has a Space key."
      ]
    },
    {
      "name": "Alpha 0.46.8",
      "date": "2026-11-14",
      "notes": [
        "**Three wrong YouTube videos are out of Blind Date.** They were modern short dramas (\"A Billionaire CEO hides her identity for a blind date…\") that matched on the show's name. Videos like that are now left out."
      ]
    },
    {
      "name": "Alpha 0.46.7",
      "date": "2026-11-14",
      "notes": [
        "**YouTube episodes no longer play behind a frozen picture.** Starting a YouTube episode (or anything else in the app's own player) straight after a normal programme left that programme's last frame stuck on screen, with the new one playing behind it. The old picture is now let go and hidden whenever the app's own player is showing."
      ]
    },
    {
      "name": "Alpha 0.46.6",
      "date": "2026-11-14",
      "notes": [
        "**Films get backdrops and an artwork menu** (needs a TheTVDB key). Hold OK on a film in On Demand: Scrape artwork finds its backdrop on TheTVDB, Choose the right film lists the matches when it picked the wrong one, and Choose a poster / Choose a background list its pictures. Back to automatic forgets the choices. A film keeps the poster it came with unless you pick another.",
        "**Scan my artwork now covers films too**: with a key it looks up a backdrop for every film that has none, after the shows.",
        "The backdrop is used wherever a show's is: the loading screen, On Demand and the guide."
      ]
    },
    {
      "name": "Alpha 0.46.5",
      "date": "2026-11-14",
      "notes": [
        "**The library is no longer downloaded on every start.** The app fetched the whole 10 MB library a few seconds after every launch, even when nothing had changed. It now keeps the copy on the TV with its revision and only downloads when the scraper publishes a new one. Saving it is also lighter (the text is stored as it came instead of being wrapped a second time).",
        "**VHS looks stop dropping frames at the start of every programme.** When two programmes in a row needed the blur taken off, the rest of the session starts without it instead of finding out again each time. Choosing a look in Options gives it a fresh try."
      ]
    },
    {
      "name": "Alpha 0.46.4",
      "date": "2026-11-14",
      "notes": [
        "**Wrong matches from your reports are blocked.** The Comic Strip Presents (was playing a Get Smart episode), The Word (a Bible study talk on Music), Wheel of Fortune S02E06 (the American version) and Mr and Mrs (Mr and Mrs North, a 1950s American detective show) no longer play those files. Also out: three unrelated clips that Soaps had picked up for \"Angels\" (one of them repeated all day)."
      ]
    },
    {
      "name": "Alpha 0.46.3",
      "date": "2026-11-14",
      "notes": [
        "**Real time EPG no longer plays the same programme over and over.** Small channels (Christmas Movies, Kids Movies, Christmas Music, Children's Christmas, Games, Cooking and others) could show one film or episode back to back for hours, because a time slot with only one suitable programme just repeated it. Now nothing is shown twice running while there is anything else on the channel: when a slot has only the one that has just finished, it is filled with the channel's other programmes instead, and the filler never repeats the one that has just ended. In a test rebuild of every channel, the ones with back-to-back repeats dropped from 14 to 1."
      ]
    },
    {
      "name": "Alpha 0.46.2",
      "date": "2026-11-14",
      "notes": [
        "**Scan my artwork** (Options > Artwork). OK looks up every show in the library that is missing a poster, a backdrop or its episode pictures: TheTVDB first when a key is entered, then TVmaze. It runs one show at a time with a progress bar (\"37 of 168 · show name\"), and OK again cancels it. Shows that already have everything are skipped, so a second scan is quick. It finishes with a summary of what it found, and writes each step to Options > Debug log. Shows whose episode guide the scraper publishes are left to the scraper. Films are not covered yet."
      ]
    }
  ]
};
