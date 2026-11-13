// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.81",
  "version": "0.45.81",
  "code": 4581,
  "date": "2026-11-13",
  "notes": [
    "**The guide only changes theme when you change it.** Until a theme is chosen in Options, the guide is now Classic Blue (before, it was \"Match the channel\", which dressed the guide as the 70's, 80's or 90's whenever one of those channels was involved). \"Match the channel\" is still there in Options for anyone who wants it. If it was picked on purpose it stays picked."
  ],
  "history": [
    {
      "name": "Alpha 0.45.80",
      "date": "2026-11-13",
      "notes": [
        "**Hid two music uploads that had been matched to the BBC drama \"Angels\".** \"Angels in Heat\" is a band: the items are live concert recordings (\"Live from The Freight\") whose names happened to contain \"Angels\". They are hidden until the scraper drops them."
      ]
    },
    {
      "name": "Alpha 0.45.79",
      "date": "2026-11-13",
      "notes": [
        "**One Poirot, not two, on each channel.** The library names it both \"Poirot\" and \"Agatha Christies Poirot\", and On Demand listed each as a separate show with the same episodes (and one of them was missing an episode the other had). They are now one show, \"Agatha Christie's Poirot\", on every channel."
      ]
    },
    {
      "name": "Alpha 0.45.78",
      "date": "2026-11-13",
      "notes": [
        "**The guide no longer flashes through its themes.** With the theme on \"Match the channel\", scrolling down the guide changed the whole screen's look each time the cursor passed the 70's, 80's or 90's channel. It now follows the channel you are watching, and stays put while you browse."
      ]
    },
    {
      "name": "Alpha 0.45.77",
      "date": "2026-11-13",
      "notes": [
        "**Live view now reports performance.** While it is switched on, the page's text includes how long the screen takes to answer each button press (median, 90th percentile and worst, for the guide, On Demand and Options separately) and how many stalls over 50 ms there have been in the last five minutes. It only measures while Live view is on."
      ]
    },
    {
      "name": "Alpha 0.45.76",
      "date": "2026-11-13",
      "notes": [
        "**Faster start-up.** Working out which channel a programme belongs on (the genre check, and routing the library to channels) searched every programme's name against thousands of known show names, one by one. It now looks each run of words up in a table. The results are identical (checked against all 877,000 genre checks and the whole routed library) but the genre check is about 6 times quicker and the routing about twice as quick. In a test the guide appeared after 3.1 seconds instead of 5.4. A slow TV will gain more in seconds, and this is also the work behind Refresh EPG."
      ]
    },
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
    }
  ]
};
