// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.99",
  "version": "0.45.99",
  "code": 4599,
  "date": "2026-11-14",
  "notes": [
    "**TheTVDB for artwork and details.** There is a new **TheTVDB key** row in Options > Artwork. OK opens an on-screen keyboard (arrows to move, OK to type, Shift for capitals; the number keys on the remote type digits). Save checks the key with TheTVDB and says whether it was accepted.",
    "With a key, posters, backdrops, summaries, episode details and the cast on the Info screen come from TheTVDB first, and TVmaze fills in whatever TheTVDB has no match for. The scraper's own artwork list still comes before both. With no key, or a key TheTVDB will not accept, nothing changes. Clear the key to go back to TVmaze alone.",
    "Needs the new app build (it adds a network call for TheTVDB), so install this version rather than just reloading the page."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.45.94",
      "date": "2026-11-14",
      "notes": [
        "**Options is back in the guide's hold-OK menu**, above Hide this show. The menu now has ten choices, so it shows eight at a time and scrolls with the highlight (arrows in the corner show there are more above or below)."
      ]
    },
    {
      "name": "Alpha 0.45.93",
      "date": "2026-11-14",
      "notes": [
        "**Back twice now brings up the quit question.** From the picture, the first Back opens the guide and a second one straight after (within about a second) asks whether to quit. Before, the guide the first Back opened swallowed the second one, so it only worked when nothing was playing."
      ]
    },
    {
      "name": "Alpha 0.45.92",
      "date": "2026-11-14",
      "notes": [
        "**No more small gaps in the guide with Real time EPG on.** Programmes now simply follow one another in the ordered week; the short clips used to pad out start times are gone, so the guide has no tiny boxes between programmes. Start times drift a few minutes off the round marks instead.",
        "**Three wrong matches hidden:** a Budgie the Little Helicopter episode listed as Surprise Surprise, a Richard Scarry episode listed as Treasure Hunt, and a 1935 film listed as Mr and Mrs."
      ]
    },
    {
      "name": "Alpha 0.45.91",
      "date": "2026-11-14",
      "notes": [
        "**Fixed: anything playing in the app's own player was skipped after about five seconds.** The check for \"sound but no picture\" counted frames, which the app's own player cannot report, so it always decided there was no picture and moved on to the next programme. It now takes a known picture size as a picture. This hit YouTube videos, and any file that had been handed to the backup player."
      ]
    }
  ]
};
