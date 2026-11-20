// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.50.7",
  "version": "0.50.7",
  "code": 5007,
  "date": "2026-11-20",
  "notes": [
    "Magic EPG films: a guide channel now takes at most 800 programmes in all from the film database, like the missing episodes do, so a big film database cannot slow the guide down at start. On Demand still shows every film."
  ],
  "history": [
    {
      "name": "Alpha 0.50.6",
      "date": "2026-11-20",
      "notes": [
        "No more freezes in the minutes after start: On Demand used to get every channel ready in the background, and with Magic EPG each one froze the screen for a second or more while it sorted its shows, again and again for several minutes. Now only the channel you were watching and the channels in Continue watching are got ready. The rest load when you open them in On Demand, and search still covers every channel.",
        "The TV guide's day labels show the short month again (\"Fri 20 Nov\"). A second list of month names had been overwriting them with the long names."
      ]
    },
    {
      "name": "Alpha 0.50.5",
      "date": "2026-11-20",
      "notes": [
        "Faster guide with Magic EPG on: each channel now gets at most 800 missing episodes (the earliest of each show, taken in turn) instead of every gap in every show. 80's and 90's TV were carrying over 20,000 programmes each, and all 66 channels were laid out again at every start, which froze the guide for half a minute after it opened. On Demand still lists every episode."
      ]
    },
    {
      "name": "Alpha 0.50.4",
      "date": "2026-11-20",
      "notes": [
        "Info screen: the episode strip now shows each episode's real still (from the scraper's episode guide, else TVmaze) instead of a green box. Before, it only used an archive.org thumbnail, so most shows (Buffy, for one) showed empty boxes. The stills arrive a moment after the strip, and episodes that are not in the library yet get theirs too."
      ]
    },
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
    }
  ]
};
