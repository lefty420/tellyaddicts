// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.18",
  "version": "0.53.18",
  "code": 5318,
  "date": "2026-11-21",
  "notes": [
    "**Santa's plough is never skipped**: when the free strip under the last guide row is short, the plough is drawn with smaller pixels to fit it, instead of not appearing at all."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.11",
      "date": "2026-11-21",
      "notes": [
        "**Playback bar.** A thin dark bar over a bottom fade instead of the blue slab: channel number, title and episode on the left, what is next on live channels as a quiet line on the right, progress and time below. Four buttons only: Pause (first), Next, Audio & subs (when the file has tracks) and More…, which lists Restart, Stop, TV Guide, On Demand, Sources (Experimental) and Options. The poster sits inside the bar, and the mini guide appears only when you press Up from the progress line.",
        "**Guide.** Episode codes written as \"S15 E03\" or \"S15 Ep 3\" are now split off the title so cells show the show name and the episode in full. Seasonal snow falls behind the text. Toasts show at the bottom while the guide or On Demand is open (the clock is no longer covered).",
        "**On Demand.** The left rail is wider with larger icons, and the focused item shows its name. The key hints sit higher, clear of the screen edge. A card whose next programme is the same show reads \"more <show>\" instead of repeating it."
      ]
    },
    {
      "name": "Alpha 0.53.10",
      "date": "2026-11-21",
      "notes": [
        "**Start-up waits for every channel.** The loading screen now stays up until all channels have loaded into the guide, then the guide opens complete, instead of opening early and stalling while the rest filled in. A 60 second limit remains only for a connection that never answers; the guide then opens on what is ready and tunes to your last channel as soon as it is. This replaces the early open from 0.53.1."
      ]
    }
  ]
};
