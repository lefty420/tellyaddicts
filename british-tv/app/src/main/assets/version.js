// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.23",
  "version": "0.46.23",
  "code": 4623,
  "date": "2026-11-14",
  "notes": [
    "**Fake Thomas episode blocked**: a fan-made \"A Very Evil Christmas\" upload was playing as a real Thomas and Friends episode on Children's Christmas. That upload is now blocked everywhere."
  ],
  "history": [
    {
      "name": "Alpha 0.46.22",
      "date": "2026-11-14",
      "notes": [
        "**Not Seinfeld**: \"Comedians in Cars Getting Coffee\" was turning up on US Sitcoms as Seinfeld episodes. That upload is now blocked everywhere."
      ]
    },
    {
      "name": "Alpha 0.46.21",
      "date": "2026-11-14",
      "notes": [
        "**Telly Addicts Mobile: On Demand on the remote.** A purple On Demand button at the top of the on-screen remote opens On Demand from the guide or while watching."
      ]
    },
    {
      "name": "Alpha 0.46.20",
      "date": "2026-11-14",
      "notes": [
        "**Telly Addicts Mobile: move the remote button.** Drag the round button anywhere on the screen. The on-screen remote opens beside it, and the app remembers where you put it. A tap still opens and closes the remote.",
        "**A selected programme you can read**: a programme that runs in from the left edge of the guide now starts its words at the edge you can see, and tapping a programme that is mostly off the side scrolls it back into view."
      ]
    },
    {
      "name": "Alpha 0.46.19",
      "date": "2026-11-14",
      "notes": [
        "**Telly Addicts Mobile: the guide now scrolls like a phone** (the TV app is unchanged). It follows your finger smoothly, up and down through the channels and sideways through the time line, and glides to rest when you let go. Scrolling no longer moves the highlight, so a tap picks what you touch.",
        "**Fixed overlapping**: the small TV window no longer sits over the time line and the first channel.",
        "**The bar over the picture can be touched**: tap its buttons (TV Guide, Play, Next, Restart, Info, On Demand, Options), tap or drag along the progress line to jump around, and tap anywhere else to close it. The buttons and text are bigger.",
        "In lists and menus, dragging now moves the way the list is dragged (finger up shows the next items).",
        "The remote button in the bottom right stays on every screen."
      ]
    },
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
    }
  ]
};
