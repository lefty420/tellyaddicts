// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.50.4",
  "version": "0.50.4",
  "code": 5004,
  "date": "2026-11-20",
  "notes": [
    "Info screen: the episode strip now shows each episode's real still (from the scraper's episode guide, else TVmaze) instead of a green box. Before, it only used an archive.org thumbnail, so most shows (Buffy, for one) showed empty boxes. The stills arrive a moment after the strip, and episodes that are not in the library yet get theirs too."
  ],
  "history": [
    {
      "name": "Alpha 0.50.3",
      "date": "2026-11-20",
      "notes": [
        "Two Options names no longer clash. In Guide, \"Realistic TV schedule\" is now **Broadcast schedule** (it sets when things air). In Experimental, \"Real world\" is now **Live TV mode** (a new episode each day, and a channel plays only what is on now). The Live TV mode help now says all of that."
      ]
    },
    {
      "name": "Alpha 0.50.2",
      "date": "2026-11-20",
      "notes": [
        "The Christmas Movies channel now follows the watershed like the Video Shop: U, PG and 12 films through the day, 15s from eight, and 18s (Die Hard, Lethal Weapon and the like) only after nine at night. Before this it had no rules, so any film could air at any time.",
        "Magic EPG films with no certificate are no longer given PG on the Christmas channel (they are skipped, as on the Video Shop). The Kids Movies default of U stays."
      ]
    },
    {
      "name": "Alpha 0.50.1",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG films: a film with no certificate in the film database is now kept on the Kids Movies channel (as U) and the Christmas movie channels (as PG). The Video Shop and the Magic genre channels still skip it, because it could be an adult film."
      ]
    },
    {
      "name": "Alpha 0.50.0",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG now covers films. With Magic EPG on, every film in the new film database (`data/filmdb.json`, published by the scraper) appears in the film channels and the Magic movie channels even when no file was scraped for it. It plays through your addons, exactly like the missing TV episodes. Nothing changes until the scraper publishes the database."
      ]
    },
    {
      "name": "Alpha 0.49.16",
      "date": "2026-11-20",
      "notes": [
        "On Demand home redesigned: a slimmer title area so two full rows fit, ten posters across each, and a count on the row (\"3 of 140\"). The channel badge and the fake \"OK Open\" button are gone.",
        "On Demand: a Search button in the header. Press Up from the top row to reach it and OK to search (Yellow still works, but most remotes have no Yellow). A search with no match now shows a page with \"Search again\" and \"Back to browsing\" instead of a short message.",
        "On Demand: key hints along the bottom, with what each key does.",
        "Show page: the season list and episode list say how many more there are (\"▼ 20 more\"), the episode list says \"Season 1 · 43 episodes · 3 of 43\", only the highlighted episode shows its picture and description (so six episodes fit), and an episode you can resume says so. With no artwork the poster is the same coloured tile as on the home page.",
        "Hold OK menu: Info, Search, Fix artwork…, Options and Hide on top level. Scrape artwork, Choose the right show, Choose a poster, Choose a background and Back to automatic are inside Fix artwork…."
      ]
    },
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
    }
  ]
};
