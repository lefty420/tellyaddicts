// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.52",
  "version": "0.45.52",
  "code": 4552,
  "date": "2026-11-13",
  "notes": [
    "**Auto EPG is now the only guide.** Every channel is built from the scraper's library, so the Auto EPG switch has gone from Options > Guide. A channel the library has nothing for still falls back to its hand-picked list, so none goes empty. The first start after updating builds the guides afresh."
  ],
  "history": [
    {
      "name": "Alpha 0.45.51",
      "date": "2026-11-13",
      "notes": [
        "**Adverts are just On or Off.** The Options setting no longer asks for 1970s, 1980s or 1990s: each break now picks adverts from the year of the programme you are watching (or the middle of the decade on a 70s, 80s or 90s channel), falling back to the same decade, then any. Anyone who had Off keeps Off; everyone else is now On."
      ]
    },
    {
      "name": "Alpha 0.45.50",
      "date": "2026-11-13",
      "notes": [
        "**Skip adverts.** While an advert break is playing, open the on-screen bar and a new **Skip adverts** button appears next to Pause. Press OK on it (or the Next key on the remote) and the break ends and the next programme starts straight away. It only appears during a break, and not on the Adverts channel, which is all adverts."
      ]
    },
    {
      "name": "Alpha 0.45.49",
      "date": "2026-11-13",
      "notes": [
        "**The foreign-language \"The Goonies\" is gone.** That archive.org copy of The Goonies (1985) turned out not to be the English film, so it no longer shows on the Kids Movies channel, the guide or On Demand. A single hidden-items list in the app now makes it easy to drop any other wrong copy the same way."
      ]
    },
    {
      "name": "Alpha 0.45.48",
      "date": "2026-11-13",
      "notes": [
        "**On Demand moves smoothly.** The highlighted poster now grows and its white outline fades in instead of snapping. Moving left or right slides the posters across by one place, and moving down the episode list slides the episodes up. The big title, details and background fade into the next show rather than cutting, and the episode and season highlights fade between rows. The slides get quicker while you hold a button so they keep up. Nothing else changed in how it works."
      ]
    },
    {
      "name": "Alpha 0.45.47",
      "date": "2026-11-13",
      "notes": [
        "**Smoother browsing on the On Demand home screen.** Moving along a row or between channels no longer rebuilds the posters from scratch each time: every poster is built once and reused, so the TV doesn't have to decode the pictures again on every press. The list of rows is also worked out once per key press instead of several times."
      ]
    },
    {
      "name": "Alpha 0.45.46",
      "date": "2026-11-13",
      "notes": [
        "**On Demand loads only as long as it has to.** Opening it now builds just the channel you are on (or the show that is playing) and nothing else, so the loading screen goes away as soon as that one is ready. The other channels are built in the background afterwards, nearest first, instead of competing with it. If the lists were already built in the background after start-up, there is no loading screen at all."
      ]
    },
    {
      "name": "Alpha 0.45.45",
      "date": "2026-11-13",
      "notes": [
        "**No more half-empty On Demand while it loads.** If the lists are not ready when you open On Demand, you now get a plain loading screen (spinner, \"Getting your shows ready...\") that goes away the moment the first row is ready, instead of a page of \"Loading...\" text. Opening straight onto the show that is playing waits behind it too, so you never see the home screen flash first. A row further down that is still loading shows blank poster blocks, not text. The background build of the lists now starts four seconds after start-up instead of twenty, so it is usually ready before you open it."
      ]
    },
    {
      "name": "Alpha 0.45.44",
      "date": "2026-11-13",
      "notes": [
        "**On Demand: the highlighted row is always the top one.** Moving down to the second row used to leave its posters half off the bottom of the screen, so the highlight was cut off. Now the row you move onto slides up to the top and the next one peeks below it."
      ]
    }
  ]
};
