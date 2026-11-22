// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.32",
  "version": "0.53.32",
  "code": 5332,
  "date": "2026-11-22",
  "notes": [
    "**Episode names are no longer looked up again at every start.** After each channel loaded, the app re-checked every show's saved episode list (a storage read and a parse for about 635 shows) to swap in real episode names, even when they were already right, because the \"checked\" mark was not saved with the channel. It is saved now, so the second and later starts skip the work. The first start after this update does it once.",
    "The debug log adds how many shows were checked and how long it took."
  ],
  "history": [
    {
      "name": "Alpha 0.53.31",
      "date": "2026-11-22",
      "notes": [
        "The debug log adds a \"busy frames\" line at the end of a start: how long the page was too busy to draw, how much of that was scripts and how much was drawing, and which parts of the code took longest. It is there to find where a cold start spends its time."
      ]
    },
    {
      "name": "Alpha 0.53.30",
      "date": "2026-11-22",
      "notes": [
        "**On Demand > On now: film channels now show the film.** Christmas Movies, Kids Films, The Video Shop and the other movie channels used to show a plain coloured card named after the channel. They now show the film that is on, with its own picture and title.",
        "**Updating the app no longer throws away every saved schedule.** The saved schedules were keyed on the app version, so the first start after each update laid all 65 channels out again (35 s on the Shield). They now stay valid until how a schedule is laid out actually changes.",
        "The debug log adds a wall-clock line for a start (when the channel lists and the Magic EPG data came in), to find where the rest of a cold start goes."
      ]
    },
    {
      "name": "Alpha 0.53.29",
      "date": "2026-11-22",
      "notes": [
        "With Debug connection on, three more pages can be opened from a browser on your Wi-Fi, each built fresh when asked: `/epg` (the EPG debug for every channel), `/gaps` (the missing-episodes report; add `?fresh=1` to check again) and `/log` (the whole debug log). No code, no need to open them on the TV first."
      ]
    },
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
    }
  ]
};
