// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.24",
  "version": "0.53.24",
  "code": 5324,
  "date": "2026-11-21",
  "notes": [
    "**Options no longer jumps about**: the highlighted row opens up to show its choices, so the rows around it changed height with every press and the list scrolled in uneven jumps. The highlighted row is now held at one place a little way down the panel and the list slides past it a row at a time, stopping naturally at the top and bottom. The opened row is still kept whole inside the panel."
  ],
  "history": [
    {
      "name": "Alpha 0.53.23",
      "date": "2026-11-21",
      "notes": [
        "The snow cycle (drifts build, then Santa's plough clears them) is 45 seconds for now, so it can be watched. It goes back to 15 minutes later."
      ]
    },
    {
      "name": "Alpha 0.53.22",
      "date": "2026-11-21",
      "notes": [
        "**Snow build-up and Santa's plough are part of the ordinary Christmas snow.** The Test choice is gone: Seasonal effects is just Auto or Off, and Auto does everything (snow, drifts building over 15 minutes, the plough crossing at the end of each cycle).",
        "The debug log says when the plough is due after the snow starts, and when it sets off, so a crossing can be checked afterwards."
      ]
    },
    {
      "name": "Alpha 0.53.21",
      "date": "2026-11-21",
      "notes": [
        "**Snow log is cleaner**: the debug log says which mode the snow started in (Auto or Test), whether Experimental is on, the screen size, and then a speed check taken 20 s later, when start-up work is over, with the number of animations really running. A check interrupted by the guide closing is dropped."
      ]
    },
    {
      "name": "Alpha 0.53.20",
      "date": "2026-11-21",
      "notes": [
        "**Settings survive a relaunch or an update**: saved settings (Experimental, Seasonal effects Test, favourites, looks and so on) are now also written to a file the moment they change. The page's own storage is written to disk some seconds later, so closing or updating the app soon after changing one could lose it. Settings from earlier versions are copied across a few seconds after start.",
        "**Snow performance check**: 12 seconds after the snow starts the debug log gets a line `SNOW: N fps ... slowest frame ... ms`, so Santa's plough can be judged from the log."
      ]
    },
    {
      "name": "Alpha 0.53.19",
      "date": "2026-11-21",
      "notes": [
        "**Fits the screen**: the logo, set and \"Loading channels\" lines no longer run off the top and bottom. The set is sized by height as well as width.",
        "**Backdrop follows the TV**: the blurred backdrop is now made of the same pictures as the TV, on the same timing, so it shows what the screen shows (and goes dark when the screen is on static). Before, it followed one picture in twelve.",
        "**No more hanging on the colour bars**: the flash of bars when a channel locks on now ends by itself after a third of a second, even while the app is busy building guides."
      ]
    },
    {
      "name": "Alpha 0.53.18",
      "date": "2026-11-21",
      "notes": [
        "**Santa's plough is never skipped**: when the free strip under the last guide row is short, the plough is drawn with smaller pixels to fit it, instead of not appearing at all."
      ]
    },
    {
      "name": "Alpha 0.53.17",
      "date": "2026-11-21",
      "notes": [
        "**Seasonal effects > Test** (Experimental on) now also runs the snow on a 30 second cycle, so the build-up and Santa's plough can be watched without waiting 15 minutes. Auto keeps the 15 minute cycle.",
        "Fixes a syntax slip pushed a moment earlier that stopped the seasonal script loading."
      ]
    },
    {
      "name": "Alpha 0.53.16",
      "date": "2026-11-21",
      "notes": [
        "**Seasonal effects** has a third choice, **Test**, shown only with Experimental on: it forces the Christmas snow on out of season, so the build-up and the plough can be checked any time.",
        "The debug log records the free strip under the last guide row (`SNOW: free strip ...`), and says when it is too small for the plough."
      ]
    }
  ]
};
