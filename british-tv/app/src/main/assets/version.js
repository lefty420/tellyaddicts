// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.34",
  "version": "0.46.34",
  "code": 4634,
  "date": "2026-11-14",
  "notes": [
    "**Start-up TV follows the real tuning**: the needle on the little TV's scale now moves along as channels really finish loading, the knobs click round one step for each, the pictures are labelled with the numbers of channels that have actually loaded, and the colour bars flash as each one locks on (and stay when every channel is in). Before, it all just looped on a timer."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.28",
      "date": "2026-11-14",
      "notes": [
        "**More American game shows blocked**: the MVG Productions Archive uploads (Joker's Wild, Sale of the Century, Big Jon's Price Is Right and Wheel of Fortune) are all US versions and were showing as the UK shows. All of them are now hidden."
      ]
    },
    {
      "name": "Alpha 0.46.27",
      "date": "2026-11-14",
      "notes": [
        "**Back from On Demand goes to the TV guide**: it used to drop you on the picture when On Demand had been opened from the remote or the OSD. Now Back always takes you to the guide."
      ]
    },
    {
      "name": "Alpha 0.46.26",
      "date": "2026-11-14",
      "notes": [
        "**YouTube picture in the guide's little TV**: videos played by the app's own player (all the YouTube ones, and some files) disappeared from the preview window when the guide opened, because that player draws behind the page. The picture now moves into the little TV and goes back to full screen when the guide closes. Needs the new app, not just a refresh."
      ]
    }
  ]
};
