// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.20",
  "version": "0.53.20",
  "code": 5320,
  "date": "2026-11-21",
  "notes": [
    "**Settings survive a relaunch or an update**: saved settings (Experimental, Seasonal effects Test, favourites, looks and so on) are now also written to a file the moment they change. The page's own storage is written to disk some seconds later, so closing or updating the app soon after changing one could lose it. Settings from earlier versions are copied across a few seconds after start.",
    "**Snow performance check**: 12 seconds after the snow starts the debug log gets a line `SNOW: N fps ... slowest frame ... ms`, so Santa's plough can be judged from the log."
  ],
  "history": [
    {
      "name": "Alpha 0.53.19",
      "date": "2026-11-21",
      "notes": [
        "**Fits the screen**: the logo, set and \"Loading channels\" lines no longer run off the top and bottom. The set is sized by height as well as width.",
        "**Backdrop follows the TV**: the blurred backdrop is now made of the same pictures as the TV, on the same timing, so it shows what the screen shows (and goes dark when the screen is on static). Before, it followed one picture in twelve.",
        "**No more hanging on the colour bars**: the flash of bars when a channel locks on now ends by itself after a third of a second, even while the app is busy building guides."
      ]
    },
    {
      "name": "Alpha 0.53.18",
      "date": "2026-11-21",
      "notes": [
        "**Santa's plough is never skipped**: when the free strip under the last guide row is short, the plough is drawn with smaller pixels to fit it, instead of not appearing at all."
      ]
    },
    {
      "name": "Alpha 0.53.17",
      "date": "2026-11-21",
      "notes": [
        "**Seasonal effects > Test** (Experimental on) now also runs the snow on a 30 second cycle, so the build-up and Santa's plough can be watched without waiting 15 minutes. Auto keeps the 15 minute cycle.",
        "Fixes a syntax slip pushed a moment earlier that stopped the seasonal script loading."
      ]
    },
    {
      "name": "Alpha 0.53.16",
      "date": "2026-11-21",
      "notes": [
        "**Seasonal effects** has a third choice, **Test**, shown only with Experimental on: it forces the Christmas snow on out of season, so the build-up and the plough can be checked any time.",
        "The debug log records the free strip under the last guide row (`SNOW: free strip ...`), and says when it is too small for the plough."
      ]
    },
    {
      "name": "Alpha 0.53.15",
      "date": "2026-11-21",
      "notes": [
        "**Guide snow builds up**: the drifts under the last row start low and rise slowly over 15 minutes, a pixel at a time, running from app start so opening and closing the guide does not restart it.",
        "**Santa's snow plough**: at the end of each cycle he drives a green plough across the screen in 12 seconds and the snow is cut away exactly at his blade. The cycle then starts again from low. With too little room under the last row the plough is skipped and the snow just clears.",
        "The snow holds still while a hold-OK menu is open, and carries on when it closes."
      ]
    },
    {
      "name": "Alpha 0.53.14",
      "date": "2026-11-21",
      "notes": [
        "**Browse**: cards are 2:3, the \"1 of N\" counter sits at the right end of the hint bar so it no longer collides with it, every channel shows its show count (they load in turn), and Left from the list reaches the rail.",
        "**Guide hold-OK menu** now has five items: Watch from the start, Episodes, Add show to favourites, Add channel to favourites, More... Channel schedule, Show favourites only, Info, Teletext and the rest are under More...",
        "**Options** list fades at the foot so it is clear that it scrolls.",
        "**Version label** now reads the current version (the changelog dates were in a format the version tool skipped, so the app said 0.53.2).",
        "**Disney shorts**: a show flagged `shorts` in the library is a plain list of shorts with no season or episode labels, no series art or TVmaze lookups, and a generated title card. Needs a scraper rebuild, then Sync episode meta and Send to TV app."
      ]
    },
    {
      "name": "Alpha 0.53.13",
      "date": "2026-11-21",
      "notes": [
        "**Playback bar** is shorter: the poster stub is smaller, the time sits at the end of the progress line, padding is tighter. The lettered placeholder poster is gone (the title moves left when there is no real picture). Pause carries an amber tint so it reads as the main button.",
        "**Rail** focus dims the page behind its label. Favourites now has the rail too (Left from the first item), so it is not a dead end.",
        "**Favourites** shows two rows: Channels, then Shows. The \"On <channel>\" row is gone (use Open in On Demand from a channel's menu). The empty-state text wraps in balanced lines.",
        "**Guide:** titles such as \"The Bill (1983) S11 DVD Rip\" or \"The Bill (1983) - S15E067 - …\" now show \"The Bill\" with \"S11\" or \"S15 E067\" under it. The snow no longer falls over the header, the programme title or the grid; it stays in the margins, beside the little TV and along the foot.",
        "**Loading screen** reads \"Loading channels 12 of 31\", and after 20 seconds adds \"The first start takes longest\"."
      ]
    },
    {
      "name": "Alpha 0.53.12",
      "date": "2026-11-21",
      "notes": [
        "**Playback bar: every button is back.** Pause, Next, Restart, Stop, Guide, Sources, Audio & subs and Options all sit on the bar again, in the new thin dark style. Nothing is hidden behind a More… list."
      ]
    }
  ]
};
