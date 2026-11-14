// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.3",
  "version": "0.46.3",
  "code": 4603,
  "date": "2026-11-14",
  "notes": [
    "**Real time EPG no longer plays the same programme over and over.** Small channels (Christmas Movies, Kids Movies, Christmas Music, Children's Christmas, Games, Cooking and others) could show one film or episode back to back for hours, because a time slot with only one suitable programme just repeated it. Now nothing is shown twice running while there is anything else on the channel: when a slot has only the one that has just finished, it is filled with the channel's other programmes instead, and the filler never repeats the one that has just ended. In a test rebuild of every channel, the ones with back-to-back repeats dropped from 14 to 1."
  ],
  "history": [
    {
      "name": "Alpha 0.46.2",
      "date": "2026-11-14",
      "notes": [
        "**Scan my artwork** (Options > Artwork). OK looks up every show in the library that is missing a poster, a backdrop or its episode pictures: TheTVDB first when a key is entered, then TVmaze. It runs one show at a time with a progress bar (\"37 of 168 · show name\"), and OK again cancels it. Shows that already have everything are skipped, so a second scan is quick. It finishes with a summary of what it found, and writes each step to Options > Debug log. Shows whose episode guide the scraper publishes are left to the scraper. Films are not covered yet."
      ]
    },
    {
      "name": "Alpha 0.46.1",
      "date": "2026-11-14",
      "notes": [
        "**Scrape artwork and the other On Demand menu choices now use TheTVDB too** (when a key is entered). Scrape artwork searches TheTVDB first and falls back to TVmaze when it has no match. Choose the right show lists TheTVDB's matches. Choose a poster and Choose a background list TheTVDB's pictures for a show picked from it. Each attempt is written to Options > Debug log (for example \"TVDB scrape found … \" or \"TVDB scrape: no match for …\"), so a scrape that finds nothing now says why."
      ]
    },
    {
      "name": "Alpha 0.46.0",
      "date": "2026-11-14",
      "notes": [
        "**You can now see whether TheTVDB is working.** The TheTVDB key row in Options > Artwork shows a running count, such as \"On · 12 found, 3 no match\", and each lookup is written to Options > Debug log. Pressing Save (even with the same key) now checks the key and then looks up a test show, and says \"TheTVDB is working\" when it all comes back."
      ]
    },
    {
      "name": "Alpha 0.45.99",
      "date": "2026-11-14",
      "notes": [
        "**TheTVDB for artwork and details.** There is a new **TheTVDB key** row in Options > Artwork. OK opens an on-screen keyboard (arrows to move, OK to type, Shift for capitals; the number keys on the remote type digits). Save checks the key with TheTVDB and says whether it was accepted.",
        "With a key, posters, backdrops, summaries, episode details and the cast on the Info screen come from TheTVDB first, and TVmaze fills in whatever TheTVDB has no match for. The scraper's own artwork list still comes before both. With no key, or a key TheTVDB will not accept, nothing changes. Clear the key to go back to TVmaze alone.",
        "Needs the new app build (it adds a network call for TheTVDB), so install this version rather than just reloading the page."
      ]
    },
    {
      "name": "Alpha 0.45.98",
      "date": "2026-11-14",
      "notes": [
        "**Options is in the On Demand hold-OK menu.** Hold OK on a show and you can open Options without leaving On Demand. Films now get a small menu of their own: Info, Options and Hide this film."
      ]
    },
    {
      "name": "Alpha 0.45.97",
      "date": "2026-11-14",
      "notes": [
        "**The start-up tuning screen no longer repeats a picture early on.** While only a few pictures had loaded, the same ones came round again and again. Until there are plenty, a gap now stays empty until a new picture arrives. Each load also starts afresh, so a picture is never shown twice in one load."
      ]
    },
    {
      "name": "Alpha 0.45.96",
      "date": "2026-11-14",
      "notes": [
        "**Films now use their backdrop on the loading screen.** A film such as Dogma showed only its poster before it started, even when a backdrop was on file for it. The loading screen now looks the film up by title, so the backdrop is used when there is one, and the poster only when there isn't."
      ]
    },
    {
      "name": "Alpha 0.45.95",
      "date": "2026-11-14",
      "notes": [
        "**The loading screen shows a poster only when a show has no backdrop.** Before a programme starts, the picture behind the channel name is the show's backdrop on its own. The poster used to sit on top of it as well."
      ]
    }
  ]
};
