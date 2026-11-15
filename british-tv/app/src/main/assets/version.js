// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.69",
  "version": "0.46.69",
  "code": 4669,
  "date": "2026-11-15",
  "notes": [
    "**Channels renumbered into groups** (the channels themselves are unchanged; only their numbers move):"
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.65",
      "date": "2026-11-15",
      "notes": [
        "**Logo on the phone page**: the page that opens on your phone to send an addon link to the TV now shows the Telly Addicts logo at the top."
      ]
    },
    {
      "name": "Alpha 0.46.64",
      "date": "2026-11-15",
      "notes": [
        "**Hold-OK menu on the channel schedule**: hold OK on a programme in a channel schedule to get **Auto play with debrid**, **Find sources** and **Options** (the first two appear when Experimental is on and an addon is installed; hold OK used to just close the schedule, Back still does)."
      ]
    },
    {
      "name": "Alpha 0.46.63",
      "date": "2026-11-15",
      "notes": [
        "**Polish links caught**: a stand-alone `PL` in a result's text (as in `Show.S01E01.PL.1080p`), or LEKTOR, NAPISY, PLDUB, is now read as Polish audio, so with Audio language on English only those links are greyed out and tagged `[PO]`. A link that also says ENG or Multi is kept."
      ]
    },
    {
      "name": "Alpha 0.46.62",
      "date": "2026-11-15",
      "notes": [
        "**Russian links caught**: addon results in Russian are now recognised by their Cyrillic letters and by the usual Russian release names and sites (LostFilm, HDRezka, NewStudio, Kerob, Rutor and so on, or RUS), so with Audio language on English only they are greyed out and never auto-played. Links that clearly say English now also rank ahead of links that say nothing about language."
      ]
    },
    {
      "name": "Alpha 0.46.61",
      "date": "2026-11-15",
      "notes": [
        "**Audio language for addon links** (Options > Experimental > **Audio language**, default **English only**): the app now reads the language flags and words addons put in their results (the French or German flag, FRENCH, VOSTFR, ITA, LATINO and so on). A link that names another language and no English is greyed out (\"French audio\") so Auto play with debrid never picks it, and in the Find sources list it is tagged like `[FR]`. Links that say nothing about language, and Multi or Dual Audio ones, are kept. Words that are part of the title itself (The Italian Job) are ignored. Set it to **Any** to take everything."
      ]
    }
  ]
};
