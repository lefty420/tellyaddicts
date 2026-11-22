// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.35",
  "version": "0.53.35",
  "code": 5335,
  "date": "2026-11-22",
  "notes": [
    "The debug log adds a line at the end of a start: how many saved things of each kind were read, how big they were, and how long reading and parsing them took, to show which saved data holds up a cold start."
  ],
  "history": [
    {
      "name": "Alpha 0.53.34",
      "date": "2026-11-22",
      "notes": [
        "**The guide opens sooner: episode names are checked after it is up, not while the channels load.** On the Shield that check read about 2,000 shows' saved episode lists (over 10 s of a 26 s start) before the guide could open. It now waits until the guide is showing, then goes through the channels one at a time in the background, pausing whenever a button is pressed. Names appear a little later on a start; nothing else changes."
      ]
    },
    {
      "name": "Alpha 0.53.33",
      "date": "2026-11-22",
      "notes": [
        "**The loading TV no longer loses its picture partway through.** It showed each picture once from a small set loaded at the start, and by about channel 17 they had all been shown, so the screen and its backdrop went blank. It now loads more pictures up front, keeps topping up, and reuses one rather than show nothing."
      ]
    },
    {
      "name": "Alpha 0.53.32",
      "date": "2026-11-22",
      "notes": [
        "**Episode names are no longer looked up again at every start.** After each channel loaded, the app re-checked every show's saved episode list (a storage read and a parse for about 635 shows) to swap in real episode names, even when they were already right, because the \"checked\" mark was not saved with the channel. It is saved now, so the second and later starts skip the work. The first start after this update does it once.",
        "The debug log adds how many shows were checked and how long it took."
      ]
    },
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
    }
  ]
};
