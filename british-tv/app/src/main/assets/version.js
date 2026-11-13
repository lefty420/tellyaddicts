// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.76",
  "version": "0.45.76",
  "code": 4576,
  "date": "2026-11-13",
  "notes": [
    "**Faster start-up.** Working out which channel a programme belongs on (the genre check, and routing the library to channels) searched every programme's name against thousands of known show names, one by one. It now looks each run of words up in a table. The results are identical (checked against all 877,000 genre checks and the whole routed library) but the genre check is about 6 times quicker and the routing about twice as quick. In a test the guide appeared after 3.1 seconds instead of 5.4. A slow TV will gain more in seconds, and this is also the work behind Refresh EPG."
  ],
  "history": [
    {
      "name": "Alpha 0.45.75",
      "date": "2026-11-13",
      "notes": [
        "**Hid two home-video uploads on The Video Shop** (\"1992 Video Shop, Ted's Books, Adams Caining, Magic Mt\" and \"1993 The Video Shop 128 W Mission St\"). They are not films, they only have \"Video Shop\" in their names."
      ]
    },
    {
      "name": "Alpha 0.45.74",
      "date": "2026-11-13",
      "notes": [
        "**Hid a fake \"Sonic Underground\" upload.** The item \"Tamers12345 Sonic Underground All Episodes (In Order)\" is a fan-made collection with invented episode titles (\"…A Tragic Death On Christmas\"), not the cartoon. It is hidden on every channel until the scraper drops it."
      ]
    },
    {
      "name": "Alpha 0.45.73",
      "date": "2026-11-13",
      "notes": [
        "**Smoother navigation while the app is still setting up.** Pressing buttons in the guide was already instant, but for the first minute after start-up the app was quietly building each channel's On Demand list in the background, and the big channels (BBC, ITV, Music, CITV) each froze the screen for a moment. That work is now done in tiny slices, and it waits while you are pressing buttons. In a test the number of freezes over 50 ms in the first 40 seconds went from 13 to 1."
      ]
    },
    {
      "name": "Alpha 0.45.72",
      "date": "2026-11-13",
      "notes": [
        "**Live view (debug).** Options > Tools > Live view (debug), off until switched on and off again each time the app starts. When on it shows an address with a four-digit code; open it in a browser on the same Wi-Fi to see what the TV is showing (updating a few times a second, including video), press the remote's buttons from the page or the keyboard's arrows, and read the app's current screen, programme and recent debug log. It only sends a picture, text and button presses; nothing on the page can run code in the app. This one changes the Android app itself, so it needs a full build."
      ]
    },
    {
      "name": "Alpha 0.45.71",
      "date": "2026-11-13",
      "notes": [
        "**Start-up TV never repeats a picture.** Each background is shown once per start-up, picked at random from the whole art list. More are fetched in the background as they get used up, so the TV only starts over if it has genuinely shown every one."
      ]
    },
    {
      "name": "Alpha 0.45.70",
      "date": "2026-11-13",
      "notes": [
        "**Soaps can have a year as the season.** Episode codes such as `S1988E56` are now read everywhere (the guide, On Demand, next episode, link matching); before, only one or two digits were accepted for the season, so they would not have been recognised. In On Demand such a season is shown as just \"1988\"."
      ]
    },
    {
      "name": "Alpha 0.45.69",
      "date": "2026-11-13",
      "notes": [
        "**Quieter tuning hiss.** The static heard while a channel tunes in is now well under half as loud.",
        "**Start-up TV shows backgrounds, not posters.** Its pictures are now the shows' wide backgrounds; a poster is only used for a show that has no background, or until the first backgrounds have loaded."
      ]
    },
    {
      "name": "Alpha 0.45.68",
      "date": "2026-11-13",
      "notes": [
        "**The start-up TV keeps tuning until the guide is ready.** It used to freeze on static while the app was busy building the guides, because the picture changes and the knobs were driven by the same thread that was doing the building. Now everything that moves (the static, twelve pictures taking turns, the turning knobs, the channel number and the occasional flash of colour bars) is a pure animation that carries on whatever the app is doing. Each time a picture comes round again it is a different show or film."
      ]
    }
  ]
};
