// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.49.16",
  "version": "0.49.16",
  "code": 4916,
  "date": "2026-11-20",
  "notes": [
    "On Demand home redesigned: a slimmer title area so two full rows fit, ten posters across each, and a count on the row (\"3 of 140\"). The channel badge and the fake \"OK Open\" button are gone.",
    "On Demand: a Search button in the header. Press Up from the top row to reach it and OK to search (Yellow still works, but most remotes have no Yellow). A search with no match now shows a page with \"Search again\" and \"Back to browsing\" instead of a short message.",
    "On Demand: key hints along the bottom, with what each key does.",
    "Show page: the season list and episode list say how many more there are (\"▼ 20 more\"), the episode list says \"Season 1 · 43 episodes · 3 of 43\", only the highlighted episode shows its picture and description (so six episodes fit), and an episode you can resume says so. With no artwork the poster is the same coloured tile as on the home page.",
    "Hold OK menu: Info, Search, Fix artwork…, Options and Hide on top level. Scrape artwork, Choose the right show, Choose a poster, Choose a background and Back to automatic are inside Fix artwork…."
  ],
  "history": [
    {
      "name": "Alpha 0.49.15",
      "date": "2026-11-20",
      "notes": [
        "Options: the explanation of each setting now has its own strip under the panel, so it can no longer be pushed out of sight by a long list (it was cut off in TV Guide, Artwork and Experimental). The section heading stays at the top while the rows scroll under it.",
        "Options > Experimental: the rows that need Experimental (Addons, Use addons as a main source, Magic EPG, Join in progress) are greyed out while it is off, with a note on the Experimental row, instead of each saying \"Turn Experimental on first\".",
        "Guide: a cell now shows the show's name, with the episode code (S03E04) on the second line, so names are no longer cut short by the code. Cells too narrow for a whole word show a dot instead of half a word or \"The\". Cells holding several programmes say \"3 programmes\" instead of \"+2 more\". A tag such as \"| [WRR]\" is no longer part of the title.",
        "Playback bar: the show's name on top, then the episode code and title; \"Next\" the same.",
        "On Demand: five episodes show at once (was three), so a season of six no longer hides half the screen. The button says \"Play from the start\" instead of \"Play S01E00\".",
        "The update message now sits bottom right, so it no longer covers the Options hints or the playback bar.",
        "The hold-OK menu's heading reads \"4 Classic BBC · 1 of 9\" instead of running together in capitals."
      ]
    },
    {
      "name": "Alpha 0.49.14",
      "date": "2026-11-20",
      "notes": [
        "Artwork is back on the \"Please stand by\" screen. A show or film with a backdrop shows the backdrop; one with only a poster shows it as a dim, blurred background (never as a framed poster) while the app looks for a backdrop, and swaps it in when one is found. Films need your TheTVDB key for that lookup.",
        "New in Options > Experimental: **Open debug address**. On, the debug log and Live view addresses have no code on the end, so the same plain address works every time. Anyone on your home network can then open them, so it is off unless you turn it on. This needs the app rebuilt and installed."
      ]
    },
    {
      "name": "Alpha 0.49.13",
      "date": "2026-11-20",
      "notes": [
        "The \"Please stand by\" TV now comes and goes through static like a real set: a burst of snow when it comes up that clears to the picture, and the picture breaking into snow and fading out when the programme starts."
      ]
    },
    {
      "name": "Alpha 0.49.12",
      "date": "2026-11-20",
      "notes": [
        "The screen shown while something starts to play now only ever shows a backdrop (fan art). A show or film with only a poster, such as Ace Ventura: When Nature Calls, now gets the tuned-to-static screen instead of a poster.",
        "Fixed the TMDB key check (\"Could not reach TMDB to check the key\"). The app's list of allowed web addresses did not include TMDB's lookups, so the check, and TMDB as the episode-list source, could never get an answer. This needs the app rebuilt and installed, not just a restart. TheTVDB was not affected."
      ]
    },
    {
      "name": "Alpha 0.49.11",
      "date": "2026-11-20",
      "notes": [
        "Fixed Options moving the wrong way. In Experimental, pressing Down from Magic Channels went to Content and then back up to Real world, because the two were listed in a different order from the screen. In TV Guide, opening the section started on the second row (On Demand) instead of the top one. Down now always goes to the row below."
      ]
    },
    {
      "name": "Alpha 0.49.10",
      "date": "2026-11-20",
      "notes": [
        "Quicker guide fill after start-up. Every channel waited for the \"Content: British\" list before its guide could be built. That list isn't published yet, so the request came back empty, but it queued behind the other downloads and took anywhere from 5 to 40 seconds. \"Nothing published yet\" is now remembered for six hours, and a new list is still picked up as soon as one is published.",
        "Laying out each channel's week (Real time EPG) does less repeat work: the season and episode of a programme are read once, not at every comparison. The schedules come out exactly the same."
      ]
    },
    {
      "name": "Alpha 0.49.9",
      "date": "2026-11-20",
      "notes": [
        "Fixed the slow start. The metadata scrapers were not the cause: the app was sorting the whole 60,000-episode library on the TV itself, and doing it again every time On Demand loaded. Now each channel's sorted list is saved the first time and read back at the next start, and the sort works in small pieces so the tuning counter keeps moving instead of freezing.",
        "The channels now build with a short pause between each, so the \"TUNING 0 / 66\" count really counts up.",
        "The debug log has new START lines saying how many channel lists were found already saved and how many had to be built, so a slow start can be traced exactly."
      ]
    },
    {
      "name": "Alpha 0.49.8",
      "date": "2026-11-20",
      "notes": [
        "Fixed 0.49.6 and 0.49.7, which broke start-up: a piece of the app that saves and reads everything kept on the TV was deleted by mistake, so the tuning screen showed no pictures or static and the guide never opened.",
        "Taken back out: the 60-day clear-out of saved artwork and episode guides added in 0.49.6. It went by when a file was last saved, not last used, so it could delete artwork the TV still shows. Anything it already removed is fetched again as needed, so the first start may be a little slower."
      ]
    }
  ]
};
