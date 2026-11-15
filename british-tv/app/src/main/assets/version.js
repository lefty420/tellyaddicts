// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.74",
  "version": "0.46.74",
  "code": 4674,
  "date": "2026-11-15",
  "notes": [
    "Use addons as a main source no longer puts the NO SIGNAL screen up while it looks: at start-up it uses the normal loading screen, and after that a small \"Scraping your debrid...\" message appears over the picture."
  ],
  "history": [
    {
      "name": "Alpha 0.46.73",
      "date": "2026-11-15",
      "notes": [
        "**New experimental option: Use addons as a main source** (Options > Experimental; needs Experimental on and an addon on). With it on, every programme with an episode number, and every film, is first looked up with your addons and plays from the best link they find. While it looks, the loading screen (at start-up) or a \"Scraping your debrid...\" message (when you change channel or move on) is shown. If the addons find nothing in about 15 seconds, or the link will not play, the library link plays instead. It plays from the start of the programme rather than joining part way through, and when it ends the channel carries on to its next programme. Off by default."
      ]
    },
    {
      "name": "Alpha 0.46.72",
      "date": "2026-11-15",
      "notes": [
        "**OSD buttons wrap round**: pressing Left on the first button (TV Guide) goes to the last (Options), and Right on Options goes back to TV Guide."
      ]
    },
    {
      "name": "Alpha 0.46.71",
      "date": "2026-11-15",
      "notes": [
        "Auto play with debrid and Find sources show in the long-press menus only when Experimental and an addon are on, as in 0.46.70 (a change to always show them was withdrawn)."
      ]
    },
    {
      "name": "Alpha 0.46.70",
      "date": "2026-11-15",
      "notes": [
        "**300 more shows on the channel lists** (from the scraper): CITV +76, US sitcoms +44, Drama +34, 70s TV +29, Off School +18, Game shows +16, TV archive +15, Sitcoms +14, Comedy +14, Children's +13, Music +12, Soaps +10, Cooking +5. They appear on each channel as the scraper finds episodes for them."
      ]
    },
    {
      "name": "Alpha 0.46.69",
      "date": "2026-11-15",
      "notes": [
        "**Channels renumbered into groups** (the channels themselves are unchanged; only their numbers move):"
      ]
    },
    {
      "name": "Alpha 0.46.68",
      "date": "2026-11-15",
      "notes": [
        "**Fix: the bottom of the guide was cut off**: the guide's rows are a little shorter, so the last row clears the bottom edge of the screen.",
        "**Fix: Options stuck out of the on-screen bar**: the **Info** button is removed from the bar (hold OK on the guide or On Demand still has Info) and the buttons sit a little closer together, so all of them fit inside the bar.",
        "**Fix: films played the wrong version**: Find sources and Auto play for a film now use the film's year (as well as its name) to pick it, so \"Robin Hood\" finds the right Robin Hood.",
        "**Auto play prefers English-only links**: links that say English only come first, then links that say nothing about language, and last links that are English plus other languages (a dual-audio link with Hindi first could still play the Hindi track).",
        "**Privacy**: the debug log no longer writes down the long settings part of an addon's address (it holds your debrid key), and older lines already in the log are cleaned when the app starts. If you shared the live-view page or log before this version, your debrid key was in it: it is worth making a new key on your debrid account."
      ]
    },
    {
      "name": "Alpha 0.46.67",
      "date": "2026-11-15",
      "notes": [
        "**New channel: US Drama (32)**: American drama from 1970 to 1999 as shown in the UK (Columbo, Magnum PI, The A-Team, Miami Vice, Hill Street Blues, The X-Files, Quantum Leap, Buffy and more, 38 shows), modelled on US Sitcoms. Like US Sitcoms it stays hidden until the scraper has put its list (`usdrama`) in the data. It has its own show list for the genre check and the Auto EPG searches, runs episodes of about 30 to 70 minutes, and gets prime-time adverts like the other drama channels."
      ]
    },
    {
      "name": "Alpha 0.46.66",
      "date": "2026-11-15",
      "notes": [
        "**Teletext: play a programme**: on the pages that list programmes (110 On now, 120 Tonight, 130 Coming up next, and each channel's schedule page 2xx), the arrows now also step down the programme rows, and OK on one asks **Play it? Yes / No**. Yes closes Teletext and plays it (joined where it is now if it is on, otherwise from its start); No goes back to the page. Tapping a row on a phone does the same."
      ]
    }
  ]
};
