// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.84",
  "version": "0.45.84",
  "code": 4584,
  "date": "2026-11-13",
  "notes": [
    "**Hide a show you don't want.** Both hold-OK menus now have \"Hide this show\" (or film). It goes from On Demand straight away and from the guide after Refresh listings. Options > TV Guide > Hidden shows brings them all back (OK twice).",
    "**Report a problem** in the guide menu writes the programme, show and file to the debug log, so a wrong video can be traced.",
    "**Menu tidy.** \"Scrape this show\" is now \"Fix artwork & details\", the Options shortcut is gone from the guide menu, and the On Demand menu gains Info."
  ],
  "history": [
    {
      "name": "Alpha 0.45.83",
      "date": "2026-11-13",
      "notes": [
        "**The hold-OK menus match Options.** The menu on a programme in the guide and the one on a show in On Demand now use the same navy panel, yellow highlight and two-line rows as Options, with a short line under each choice saying what it does."
      ]
    },
    {
      "name": "Alpha 0.45.82",
      "date": "2026-11-13",
      "notes": [
        "**Options tidied up.** The screen behind Options no longer shows through. \"Help & tools\" is split into **Help** (What's new, About) and **Debug** (Live view, Debug log, EPG debug, Missing episodes). The one-item \"Watch\" category is gone: On Demand is now the first line under TV Guide, and Options opens there. The Live view address is shown large and green so it can be read from across the room. \"Match the channel\" has been taken out of the guide themes, so the theme only ever changes when you change it."
      ]
    },
    {
      "name": "Alpha 0.45.81",
      "date": "2026-11-13",
      "notes": [
        "**The guide only changes theme when you change it.** Until a theme is chosen in Options, the guide is now Classic Blue (before, it was \"Match the channel\", which dressed the guide as the 70's, 80's or 90's whenever one of those channels was involved). \"Match the channel\" is still there in Options for anyone who wants it. If it was picked on purpose it stays picked."
      ]
    },
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
    }
  ]
};
