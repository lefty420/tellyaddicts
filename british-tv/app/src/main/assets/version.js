// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.16",
  "version": "0.46.16",
  "code": 4616,
  "date": "2026-11-14",
  "notes": [
    "**The Telly Addict Builder keeps working**: splitting the build into TV and Mobile moved the TV app's APK, which the Builder looks for. The TV build now also leaves its APK where the Builder expects it. The Builder installs the TV app only; the Mobile APK comes from the GitHub build for now."
  ],
  "history": [
    {
      "name": "Alpha 0.46.15",
      "date": "2026-11-14",
      "notes": [
        "**Two apps from one build**: each build now gives you `tellyaddicts-tv.apk` (the TV app, unchanged) and `tellyaddicts-mobile.apk` (called \"Telly Addicts Mobile\", for phones). They install side by side, keep separate data and have separate settings, so nothing done on the phone version can affect the TV. For now the mobile one is the same app; the touch controls and phone layout come next."
      ]
    },
    {
      "name": "Alpha 0.46.14",
      "date": "2026-11-14",
      "notes": [
        "**Blocked shows really disappear now**: two wrong versions you reported (Mr and Mrs North, the American Wheel of Fortune) were already on the block list but kept playing, because the TV was still using lineups it had saved earlier. The saved lineups are now rebuilt whenever the block list changes, so a block takes effect straight away.",
        "Blocked the American Shining Time Station episodes that were showing as Thomas and Friends."
      ]
    },
    {
      "name": "Alpha 0.46.13",
      "date": "2026-11-14",
      "notes": [
        "**Classic Blue looks livelier**: gradient channel tiles with rounded corners, the programme showing now glows brighter with a gold edge on every channel, and later programmes are darker so it is easy to see what is on right now.",
        "**Options > Guide theme fixed**: the preview of the theme now shows all three rows instead of being cut off, and the Options panel no longer spills its rows over the button hints at the bottom; it scrolls to follow the highlighted row."
      ]
    },
    {
      "name": "Alpha 0.46.12",
      "date": "2026-11-14",
      "notes": [
        "**No second loading screen**: a programme that starts part-way through (like G.I. Joe) could show the loading screen, drop it, then show it again when the player jumped to the right spot. Each programme now gets its loading screen once."
      ]
    },
    {
      "name": "Alpha 0.46.11",
      "date": "2026-11-14",
      "notes": [
        "**Options now leaves a trail in the debug log**: where it was opened from, how many button presses it handled, and whether it closed by itself. This is to pin down any further report of Options hanging.",
        "**Three more wrong matches blocked** from your reports and the log: Care Bears was playing the 2007 series, CITV had a 2018 CGI Thomas & Friends, and The Lion King (1994) was a recording of the stage musical."
      ]
    },
    {
      "name": "Alpha 0.46.10",
      "date": "2026-11-14",
      "notes": [
        "**Options no longer hangs when opened from On Demand.** Opening Options from the On Demand hold-OK menu showed the Options screen, but the remote was still moving On Demand underneath it, so Options looked frozen until it closed itself. The remote now works Options, and Back returns to On Demand."
      ]
    },
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
    }
  ]
};
