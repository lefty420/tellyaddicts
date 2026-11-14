// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.19",
  "version": "0.46.19",
  "code": 4619,
  "date": "2026-11-14",
  "notes": [
    "**Telly Addicts Mobile: the guide now scrolls like a phone** (the TV app is unchanged). It follows your finger smoothly, up and down through the channels and sideways through the time line, and glides to rest when you let go. Scrolling no longer moves the highlight, so a tap picks what you touch.",
    "**Fixed overlapping**: the small TV window no longer sits over the time line and the first channel.",
    "**The bar over the picture can be touched**: tap its buttons (TV Guide, Play, Next, Restart, Info, On Demand, Options), tap or drag along the progress line to jump around, and tap anywhere else to close it. The buttons and text are bigger.",
    "In lists and menus, dragging now moves the way the list is dragged (finger up shows the next items).",
    "The remote button in the bottom right stays on every screen."
  ],
  "history": [
    {
      "name": "Alpha 0.46.18",
      "date": "2026-11-14",
      "notes": [
        "**Telly Addicts Mobile, better touch** (the TV app is unchanged):"
      ]
    },
    {
      "name": "Alpha 0.46.17",
      "date": "2026-11-14",
      "notes": [
        "**Telly Addicts Mobile gets touch controls** (the TV app is unchanged):"
      ]
    },
    {
      "name": "Alpha 0.46.16",
      "date": "2026-11-14",
      "notes": [
        "**The Telly Addict Builder keeps working**: splitting the build into TV and Mobile moved the TV app's APK, which the Builder looks for. The TV build now also leaves its APK where the Builder expects it. The Builder installs the TV app only; the Mobile APK comes from the GitHub build for now."
      ]
    },
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
    }
  ]
};
