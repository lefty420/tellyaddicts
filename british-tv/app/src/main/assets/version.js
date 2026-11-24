// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.14",
  "version": "0.54.14",
  "code": 5414,
  "date": "2026-11-24",
  "notes": [
    "**The YouTube error in the debug log now says what the live server lists gave** (how many servers, or why they could not be fetched). In 0.54.13 the failed play listed only the built-in servers, so the live lists added nothing and I could not tell why. No change to how YouTube plays. Needs a new build (Java)."
  ],
  "history": [
    {
      "name": "Alpha 0.54.13",
      "date": "2026-11-24",
      "notes": [
        "**YouTube asks the current list of servers.** Playing a YouTube video failed because every server in the app's fixed list was down or refusing. The app now fetches the Piped and Invidious projects' live lists (at most every six hours) and tries the healthiest ones first, keeping the built-in list as a fall-back. If those lists cannot be fetched, nothing changes. Needs a new build of the app (Java change)."
      ]
    },
    {
      "name": "Alpha 0.54.12",
      "date": "2026-11-24",
      "notes": [
        "**On Demand no longer freezes when the YouTube list changes.** A channel's On Demand list was rebuilt whenever the scraper added or removed a single YouTube video, which took up to two minutes and stalled the screen for up to 16 s. It is now rebuilt only when the channel gains or loses a YouTube show. A show's page still reads the newest videos when you open it. The change rebuilds the lists once more on the first start after updating."
      ]
    },
    {
      "name": "Alpha 0.54.11",
      "date": "2026-11-24",
      "notes": [
        "**No key-hint line along the bottom of On Demand** (\"Next show, OK Play, Hold OK More info…\"). It is gone, so the foot of the screen is clear for the snow drifts too."
      ]
    },
    {
      "name": "Alpha 0.54.10",
      "date": "2026-11-24",
      "notes": [
        "**Snow builds up at the foot of On Demand again, and Santa's plough has something to clear.** The dark strip behind the hint line (added in 0.54.6) was covering the drifts and the plough. While the snow is on, the strip is gone and the posters just fade out above the hint line."
      ]
    },
    {
      "name": "Alpha 0.54.9",
      "date": "2026-11-24",
      "notes": [
        "**The snow on On Demand shows again.** In 0.54.7 and 0.54.8 its picture layer was put inside the TV guide, which is hidden while On Demand is on screen, so nothing appeared. It is back inside On Demand.",
        "**Options > Seasonal effects now reads On or Off** (it said Auto or Off). On shows the snow, drifts and Santa's plough on both the TV guide and On Demand, from 1 November to 6 January."
      ]
    },
    {
      "name": "Alpha 0.54.8",
      "date": "2026-11-24",
      "notes": [
        "**One seasonal setting for the TV guide and On Demand.** When Options > Seasonal effects is on (Auto), the snow, drifts and Santa's plough show on both. The separate Experimental option \"On Demand seasonal themes\" is gone, so On Demand no longer needs Experimental switched on."
      ]
    },
    {
      "name": "Alpha 0.54.7",
      "date": "2026-11-24",
      "notes": [
        "**The On Demand snow is back.** Options > Experimental > On Demand seasonal themes works again, as in 0.54.5. The other 0.54.6 changes stay: the hint line on its own band, the title picture sized like the title, and the bigger \"Next ...\" line on the On now cards."
      ]
    },
    {
      "name": "Alpha 0.54.7",
      "date": "2026-11-24",
      "notes": [
        "**More YouTube titles are numbered.** Titles like \"Season One - Episode Two\" and \"2x05\" now give a season and episode, as well as \"S2 Ep5\"."
      ]
    }
  ]
};
