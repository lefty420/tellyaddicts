// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.56",
  "version": "0.45.56",
  "code": 4556,
  "date": "2026-11-13",
  "notes": [
    "**A new start-up screen.** The old TV set that showed each channel loading is gone. Now shows and films tune in one after another behind the logo, full screen, each arriving with a flick of static and a slow zoom, with \"Tuning in to the archives...\" and a gentle moving bar until the guide is ready. It no longer reports each channel as it loads. Pictures come from the artwork already saved on the TV (shows' backdrops, plus posters of films seen before), so the very first start after installing may show only the logo for a moment."
  ],
  "history": [
    {
      "name": "Alpha 0.45.55",
      "date": "2026-11-13",
      "notes": [
        "**The exit menu no longer pops up by accident.** Back used to count towards quitting even when it was only closing something: pressing Back to close the guide, the on-screen bar, Options or a panel and then once more quickly opened the exit menu. Now only Backs pressed on the plain picture count, so you must press Back twice in a row while just watching (or in the guide with nothing playing)."
      ]
    },
    {
      "name": "Alpha 0.45.54",
      "date": "2026-11-13",
      "notes": [
        "**Clear logos now show on a show's page as well.** The scraper's clear logos (published in art.json from today) replace the plain title on On Demand. They were only picked up on the home rows after the highlight rested on a show, so going straight onto a show page, or opening On Demand on what is playing, never loaded them. The show page now looks them up itself."
      ]
    },
    {
      "name": "Alpha 0.45.53",
      "date": "2026-11-13",
      "notes": [
        "**Japanese-language Sailor Moon is gone.** The 1992 1080p upload and the Japanese live-action series are hidden everywhere; the English-dubbed uploads (DIC and Cloverway) stay."
      ]
    },
    {
      "name": "Alpha 0.45.52",
      "date": "2026-11-13",
      "notes": [
        "**Auto EPG is now the only guide.** Every channel is built from the scraper's library, so the Auto EPG switch has gone from Options > Guide. A channel the library has nothing for still falls back to its hand-picked list, so none goes empty. The first start after updating builds the guides afresh."
      ]
    },
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
    }
  ]
};
