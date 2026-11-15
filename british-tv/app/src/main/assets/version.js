// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.65",
  "version": "0.46.65",
  "code": 4665,
  "date": "2026-11-15",
  "notes": [
    "**Logo on the phone page**: the page that opens on your phone to send an addon link to the TV now shows the Telly Addicts logo at the top."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.60",
      "date": "2026-11-15",
      "notes": [
        "**Guide menu**: **Watch now** is removed from the hold-OK menu (plain OK on a programme still joins it where it is now)."
      ]
    },
    {
      "name": "Alpha 0.46.59",
      "date": "2026-11-15",
      "notes": [
        "**Options at the bottom of every hold-OK menu**: the guide's and On Demand's long-press menus now end with **Options**. It is moved to the end, not added again, so it appears once (before it sat in the middle of the list)."
      ]
    },
    {
      "name": "Alpha 0.46.58",
      "date": "2026-11-15",
      "notes": [
        "**Find sources and Auto play with debrid are now two separate things**, on the On Demand hold-OK menu, the guide's hold-OK menu and the on-screen bar:"
      ]
    },
    {
      "name": "Alpha 0.46.57",
      "date": "2026-11-15",
      "notes": [
        "**On Demand menu**: the hold-OK item **Find sources** is now called **Auto play with debrid**, like the bar and the guide. It does what it did before: asks your addons and plays the best link."
      ]
    }
  ]
};
