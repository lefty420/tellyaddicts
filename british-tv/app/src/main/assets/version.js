// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.63",
  "version": "0.46.63",
  "code": 4663,
  "date": "2026-11-15",
  "notes": [
    "**Polish links caught**: a stand-alone `PL` in a result's text (as in `Show.S01E01.PL.1080p`), or LEKTOR, NAPISY, PLDUB, is now read as Polish audio, so with Audio language on English only those links are greyed out and tagged `[PO]`. A link that also says ENG or Multi is kept."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.56",
      "date": "2026-11-15",
      "notes": [
        "**Auto play with debrid from the bar and the guide**: while watching, the on-screen bar (OK) has a new **Auto play** button after On Demand; on the guide, hold OK on a programme and choose **Auto play with debrid**. Either one asks your addons for that episode (or film) and plays the best link by itself, closing the guide or bar. From the bar on something an addon is already playing it looks again and skips a saved link. It needs Experimental on and an addon installed; programmes without an episode number (like \"Top of the Pops\") say so."
      ]
    },
    {
      "name": "Alpha 0.46.55",
      "date": "2026-11-15",
      "notes": [
        "**Auto play with debrid**: the Find sources auto-play setting (Options > Experimental) is now called **Auto play with debrid** and is **on by default**. Find sources asks every addon you have installed (your debrid addon included), and plays the best link it scrapes by itself with nothing to choose: 1080p first, then 720p, and the next link if one fails. The separate \"Debrid links\" setting from 0.46.54 is gone: the addon does the debrid, the app just plays what it returns (links the debrid service has not cached yet are still skipped). Saved sources stay."
      ]
    }
  ]
};
