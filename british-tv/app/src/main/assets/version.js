// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.77",
  "version": "0.46.77",
  "code": 4677,
  "date": "2026-11-15",
  "notes": [
    "**The \"Scraping your debrid...\" message goes away** when you change channel while it is still looking.",
    "**One ranking for addon links**: Find sources and Use addons as a main source now pick the best link the same way (English audio first, the release group that worked last time, then 1080p over 720p). The unused debrid switch behind the old code is gone.",
    "**Teletext page text moved out of app.js** into its own file (ttpages.js), about 200 lines. Nothing changes on screen."
  ],
  "history": [
    {
      "name": "Alpha 0.46.76",
      "date": "2026-11-15",
      "notes": [
        "**Saved sources opens again** (Options > Experimental): two things in the app shared a name, so the screen could not start.",
        "**Use addons as a main source keeps your place in On Demand**: Next goes to the right episode, also when the library link has to take over.",
        "**Use addons as a main source waits at most 6 seconds on the loading screen** before falling back to the library."
      ]
    },
    {
      "name": "Alpha 0.46.75",
      "date": "2026-11-15",
      "notes": [
        "**Source badge on the OSD**, beside the channel name: a blue ARCHIVE.ORG badge when the programme plays from the archive, and a green ⚡ ADDON badge (with the quality, such as 1080p, when the addon says) when it plays from an addon link."
      ]
    },
    {
      "name": "Alpha 0.46.74",
      "date": "2026-11-15",
      "notes": [
        "Use addons as a main source no longer puts the NO SIGNAL screen up while it looks: at start-up it uses the normal loading screen, and after that a small \"Scraping your debrid...\" message appears over the picture."
      ]
    },
    {
      "name": "Alpha 0.46.73",
      "date": "2026-11-15",
      "notes": [
        "**New experimental option: Use addons as a main source** (Options > Experimental; needs Experimental on and an addon on). With it on, every programme with an episode number, and every film, is first looked up with your addons and plays from the best link they find. While it looks, the loading screen (at start-up) or a \"Scraping your debrid...\" message (when you change channel or move on) is shown. If the addons find nothing in about 15 seconds, or the link will not play, the library link plays instead. It plays from the start of the programme rather than joining part way through, and when it ends the channel carries on to its next programme. Off by default."
      ]
    },
    {
      "name": "Alpha 0.46.72",
      "date": "2026-11-15",
      "notes": [
        "**OSD buttons wrap round**: pressing Left on the first button (TV Guide) goes to the last (Options), and Right on Options goes back to TV Guide."
      ]
    },
    {
      "name": "Alpha 0.46.71",
      "date": "2026-11-15",
      "notes": [
        "Auto play with debrid and Find sources show in the long-press menus only when Experimental and an addon are on, as in 0.46.70 (a change to always show them was withdrawn)."
      ]
    },
    {
      "name": "Alpha 0.46.70",
      "date": "2026-11-15",
      "notes": [
        "**300 more shows on the channel lists** (from the scraper): CITV +76, US sitcoms +44, Drama +34, 70s TV +29, Off School +18, Game shows +16, TV archive +15, Sitcoms +14, Comedy +14, Children's +13, Music +12, Soaps +10, Cooking +5. They appear on each channel as the scraper finds episodes for them."
      ]
    },
    {
      "name": "Alpha 0.46.69",
      "date": "2026-11-15",
      "notes": [
        "**Channels renumbered into groups** (the channels themselves are unchanged; only their numbers move):"
      ]
    }
  ]
};
