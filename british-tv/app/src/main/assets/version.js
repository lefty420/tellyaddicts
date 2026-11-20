// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.51.1",
  "version": "0.51.1",
  "code": 5101,
  "date": "2026-11-20",
  "notes": [
    "On Demand: the hero is now a large banner. At the top of the page (chips or hero) the show's backdrop fills the top two thirds of the screen, with its logo or a big title over it and one row below. Moving down into the rows shrinks it back to the compact layout."
  ],
  "history": [
    {
      "name": "Alpha 0.51.0",
      "date": "2026-11-20",
      "notes": [
        "On Demand reworked, in the style of Stremio / Nuvio. Top of the page: filter chips (All, TV, Films, Kids) and Search, with a rotating hero under them (five random shows with a backdrop, a new one every 7 seconds; Left and Right step it by hand; it pauses once you go down into the rows). A slim rail down the left (Home, Browse, Search, Options) opens when you press Left from the first card.",
        "New rows: **On now** (what is on each guide channel at this moment, with a LIVE tag, a progress bar and what is next; OK tunes to it), Continue watching, **My list**, then rows by genre (Drama, Kids' TV and cartoons, Films, Kids' films, Comedy, Game shows, Entertainment, Soaps, Music TV, Food and factual, Christmas, By the decade). Genre rows are built from the channel lists and loaded only as you get near them, so nothing is built up front. Each row remembers its position.",
        "Show page: buttons (Resume, Start from S1 E1, + My list), the seasons as chips, and one row of episode cards with their stills and a progress bar for the one you were part way through.",
        "Browse (the second icon on the rail): the channels down the left with their show counts, a 6-wide poster grid, and Sort (A-Z, newest, oldest), Decade and Hide watched across the top.",
        "Back goes: close the rail, then up to the top of the page, then out of On Demand. Opening On Demand while something is playing still lands on that show's page, and Back from it goes to the top.",
        "On Demand no longer loads every channel in the background when it opens; the search still does."
      ]
    },
    {
      "name": "Alpha 0.50.10",
      "date": "2026-11-20",
      "notes": [
        "New in Options > Experimental: **Interface size** (Small, Normal, Large). Makes the whole app, guide, On Demand and Options included, about 8% smaller (room round the edges if your TV cuts them off) or 8% bigger (easier to read from the sofa). It changes at once, and Normal is exactly how it looked before. Needs Experimental on; turning Experimental off puts it back to Normal. Large shows slightly fewer guide rows."
      ]
    },
    {
      "name": "Alpha 0.50.9",
      "date": "2026-11-20",
      "notes": [
        "New in Options > Experimental: **Loading screen**. Pick how the start-up TV looks: Classic (as before, the default), Set in the room (a bigger wooden set with rabbit ears over blurred artwork, a big TUNING on the glass), Whole screen (the picture is the TV, with the dials and tuning scale in a strip along the bottom), or Surprise me (one of the two new looks each start). It needs Experimental on and shows from the next start. Everything is drawn in screen-relative sizes, so it looks the same on 1080p and 4K."
      ]
    },
    {
      "name": "Alpha 0.50.8",
      "date": "2026-11-20",
      "notes": [
        "Faster start: each channel's finished schedule (what plays when) is now kept on the device and read back at the next start, instead of being laid out again for all 60-odd channels. It is used only when the channel's list, the guide span, the Broadcast schedule setting and the app version are all the same; otherwise that channel is laid out again and kept. Live TV mode's daily episodes are still worked out at each start, so they move on as before. \"Build every channel afresh\" clears the kept schedules. The debug log shows how many were read and how many were laid out."
      ]
    },
    {
      "name": "Alpha 0.50.7",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG films: a guide channel now takes at most 800 programmes in all from the film database, like the missing episodes do, so a big film database cannot slow the guide down at start. On Demand still shows every film."
      ]
    },
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
    }
  ]
};
