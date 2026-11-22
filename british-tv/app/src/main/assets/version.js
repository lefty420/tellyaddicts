// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.29",
  "version": "0.53.29",
  "code": 5329,
  "date": "2026-11-22",
  "notes": [
    "With Debug connection on, three more pages can be opened from a browser on your Wi-Fi, each built fresh when asked: `/epg` (the EPG debug for every channel), `/gaps` (the missing-episodes report; add `?fresh=1` to check again) and `/log` (the whole debug log). No code, no need to open them on the TV first."
  ],
  "history": [
    {
      "name": "Alpha 0.53.28",
      "date": "2026-11-22",
      "notes": [
        "**Options > Debug > Debug connection** (was Live view) is the one On/Off switch for reading the app from a browser on your Wi-Fi. It stays on across launches, and the address no longer carries a code, so the same plain address works every time. The code can be brought back later.",
        "The debug text it serves now holds the last 400 log lines instead of 80, so a whole start-up can be read without sending it."
      ]
    },
    {
      "name": "Alpha 0.53.27",
      "date": "2026-11-22",
      "notes": [
        "**The guide opens much sooner on a cold start.** It used to wait until all 66 channels had loaded, so a start took as long as the slowest channel. It now opens as soon as the channel you were last watching and the first ten channels in the guide are ready; the others finish behind it and appear as they land.",
        "The hidden loading list is no longer redrawn once the guide is up, which saves work while the last channels finish."
      ]
    },
    {
      "name": "Alpha 0.53.26",
      "date": "2026-11-22",
      "notes": [
        "**Pressing Home no longer closes the app.** On a TV, Home used to close Telly Addicts on purpose, so every return was a cold start that laid out all 66 channels again. It now pauses and stays alive; coming back is instant. A live channel is tuned to what is on now if you were away more than 20 seconds, and anything else carries on where it stopped. (If the system needs the memory it can still close it, and then it starts as before.)",
        "The debug log notes when the app goes to the background and returns, and where a start spends its time (preparing lists, schedules, real-world order, names), so the slow part of a cold start can be found."
      ]
    },
    {
      "name": "Alpha 0.53.25",
      "date": "2026-11-21",
      "notes": [
        "**Options: OK confirms a choice.** On a row with choices, Left and Right pick one (applied straight away, as before) and OK now confirms it: the choices fold away and the row shows its value again, so there is no need to press Back to come out of it. OK again opens the choices; moving to another row also folds them. Rows that open a screen or run something are unchanged."
      ]
    },
    {
      "name": "Alpha 0.53.24",
      "date": "2026-11-21",
      "notes": [
        "**Options no longer jumps about**: the highlighted row opens up to show its choices, so the rows around it changed height with every press and the list scrolled in uneven jumps. The highlighted row is now held at one place a little way down the panel and the list slides past it a row at a time, stopping naturally at the top and bottom. The opened row is still kept whole inside the panel."
      ]
    },
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
    }
  ]
};
