// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.37",
  "version": "0.46.37",
  "code": 4637,
  "date": "2026-11-14",
  "notes": [
    "**Start-up TV moves again, and shows the real tuning**: the last change drove the needle, knobs and picture from the page itself, which is frozen while the guides are being built, so on the TV nothing moved. The needle, knobs, static and pictures are back on their own animations (they keep going while the app is busy), and the real progress is added on top: a green bar fills along the scale and the label counts the channels that have finished (TUNING 7 / 16), with a flash of colour bars as each locks on."
  ],
  "history": [
    {
      "name": "Alpha 0.46.36",
      "date": "2026-11-14",
      "notes": [
        "**What's playing is marked in the guide**: the programme you are watching now carries a red PLAYING tag (like NOW in the channel schedule), and its channel has a red marker, so it stands out from everything else that is on right now."
      ]
    },
    {
      "name": "Alpha 0.46.35",
      "date": "2026-11-14",
      "notes": [
        "**American Thomas blocked**: the \"Model Series (US Restored)\" upload (and the other US Thomas uploads: George Carlin, Ringo Starr US, US VHS, US CGI) were playing as the real Thomas and Friends. All ten are now hidden; the UK ones stay."
      ]
    },
    {
      "name": "Alpha 0.46.34",
      "date": "2026-11-14",
      "notes": [
        "**Start-up TV follows the real tuning**: the needle on the little TV's scale now moves along as channels really finish loading, the knobs click round one step for each, the pictures are labelled with the numbers of channels that have actually loaded, and the colour bars flash as each one locks on (and stay when every channel is in). Before, it all just looped on a timer."
      ]
    },
    {
      "name": "Alpha 0.46.33",
      "date": "2026-11-14",
      "notes": [
        "**No blue bar over the loading screen**: the channel/programme bar that flashes up when something starts no longer sits on top of the \"please stand by\" loading screen; the loading screen covers it."
      ]
    },
    {
      "name": "Alpha 0.46.32",
      "date": "2026-11-14",
      "notes": [
        "**Realistic TV schedule is on by default**: new installs, and anyone who had never touched the setting, now get the real-week layout. If you had switched it off yourself it stays off. The guides rebuild once after the update."
      ]
    },
    {
      "name": "Alpha 0.46.31",
      "date": "2026-11-14",
      "notes": [
        "**Clearer Options**: confusing settings now say what they do. *Video player* is now **Videos that won't play** (Automatic / Never / Always, and \"rescued 5 videos so far\" instead of \"(5 files)\"), *Buffer* is **Download ahead**, *Enhancements* is **Picture style**, *Real time EPG* is **Realistic TV schedule**, *Keep listings for* is **Shuffle guide every** and *EPG debug* is **Guide check (debug)**. The help line under each is rewritten in plain English."
      ]
    },
    {
      "name": "Alpha 0.46.30",
      "date": "2026-11-14",
      "notes": [
        "**Channel schedule fixes**: OK on any programme in the schedule now plays it (a later one starts from the beginning, like the guide does); before, only what was on right now did anything. \"Channel schedule\" also moves up to sit straight under On Demand in the guide's hold-OK menu."
      ]
    },
    {
      "name": "Alpha 0.46.29",
      "date": "2026-11-14",
      "notes": [
        "**Smoother On Demand**: the big backdrop behind a show is now decoded in the background before it is shown, so moving along the rows no longer stalls while a large picture loads."
      ]
    }
  ]
};
