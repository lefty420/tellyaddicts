// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.39",
  "version": "0.46.39",
  "code": 4639,
  "date": "2026-11-14",
  "notes": [
    "**The guide comes back where you left it**: press Back to go to the picture, then open the guide again, and it opens on the same channel, rows and time you had selected instead of jumping back to what is playing and scrolling the list. If you started something else, or it was more than ten minutes ago, it opens on what is playing as before."
  ],
  "history": [
    {
      "name": "Alpha 0.46.38",
      "date": "2026-11-14",
      "notes": [
        "**PLAYING marker made small**: the red tag on the programme you are watching took up most of a narrow guide cell and hid its title. It is now just a small red ▶ badge; the red outline and the channel marker stay."
      ]
    },
    {
      "name": "Alpha 0.46.37",
      "date": "2026-11-14",
      "notes": [
        "**Start-up TV moves again, and shows the real tuning**: the last change drove the needle, knobs and picture from the page itself, which is frozen while the guides are being built, so on the TV nothing moved. The needle, knobs, static and pictures are back on their own animations (they keep going while the app is busy), and the real progress is added on top: a green bar fills along the scale and the label counts the channels that have finished (TUNING 7 / 16), with a flash of colour bars as each locks on."
      ]
    },
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
    }
  ]
};
