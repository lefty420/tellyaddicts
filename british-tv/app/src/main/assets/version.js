// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.63",
  "version": "0.45.63",
  "code": 4563,
  "date": "2026-11-13",
  "notes": [
    "**The snow falls again.** In the last two versions it drifted upwards from the bottom; it now falls from the top of the screen as intended."
  ],
  "history": [
    {
      "name": "Alpha 0.45.62",
      "date": "2026-11-13",
      "notes": [
        "**Snow falls at more varied speeds.** Each of the three depth layers is now two sheets of flakes falling at slightly different speeds (and swaying at different paces), so the snow no longer looks like it moves as one block. The number of flakes is unchanged."
      ]
    },
    {
      "name": "Alpha 0.45.61",
      "date": "2026-11-13",
      "notes": [
        "**Smoother snow.** The snow used to be redrawn 15 times a second and flakes could only move in whole steps, which looked jerky. Each layer of flakes is now painted once and slid down by the graphics chip at the screen's own refresh rate, with a gentle sway on top, so it moves smoothly and costs the TV almost no work. Still pixel-art, and it still holds still while you scroll the guide."
      ]
    },
    {
      "name": "Alpha 0.45.60",
      "date": "2026-11-13",
      "notes": [
        "**Seasonal effects: Christmas snow on the guide.** A light pixel-art snowfall and snowdrifts drawn over the TV guide from 1 November to 6 January. It cannot be focused and does not touch the remote. It runs at about 15 frames a second, holds still while the guide is being scrolled, and keeps the drifts off the last row of programmes. Options > TV Guide > Seasonal effects: Auto (follows the date) or Off."
      ]
    },
    {
      "name": "Alpha 0.45.59",
      "date": "2026-11-13",
      "notes": [
        "**New channel: Christmas Movies (18).** Christmas films and specials from 1970 to 1999 (Home Alone, Scrooged, The Snowman, The Muppet Christmas Carol and the rest of a 125-title list in `tools/christmas-movies.json`). It stays hidden until the scraper has found some of them, then appears by itself and also shows in On Demand as a film row. The channels after it moved up one number; the Adverts channel is now 31."
      ]
    },
    {
      "name": "Alpha 0.45.58",
      "date": "2026-11-13",
      "notes": [
        "**The old TV is back on the start-up screen.** It no longer reports each channel loading (no channel names, counts or progress bars). Instead the set just tunes around: static, then a show's picture or a film's poster, the knobs turning and the channel number changing with each one, with a flash of colour bars now and then, until the guide is ready. This replaces the full-screen picture version from 0.45.56."
      ]
    },
    {
      "name": "Alpha 0.45.57",
      "date": "2026-11-13",
      "notes": [
        "**The Addams Family with Russian audio is hidden.** The two big uploads (season 1 and season 2) have Russian as the first sound track and English second, so they played in Russian. They no longer appear; the few single English episodes stay."
      ]
    },
    {
      "name": "Alpha 0.45.56",
      "date": "2026-11-13",
      "notes": [
        "**A new start-up screen.** The old TV set that showed each channel loading is gone. Now shows and films tune in one after another behind the logo, full screen, each arriving with a flick of static and a slow zoom, with \"Tuning in to the archives...\" and a gentle moving bar until the guide is ready. It no longer reports each channel as it loads. Pictures come from the artwork already saved on the TV (shows' backdrops, plus posters of films seen before), so the very first start after installing may show only the logo for a moment."
      ]
    },
    {
      "name": "Alpha 0.45.55",
      "date": "2026-11-13",
      "notes": [
        "**The exit menu no longer pops up by accident.** Back used to count towards quitting even when it was only closing something: pressing Back to close the guide, the on-screen bar, Options or a panel and then once more quickly opened the exit menu. Now only Backs pressed on the plain picture count, so you must press Back twice in a row while just watching (or in the guide with nothing playing)."
      ]
    }
  ]
};
