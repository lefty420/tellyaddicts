// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.51.4",
  "version": "0.51.4",
  "code": 5104,
  "date": "2026-11-21",
  "notes": [
    "Show page: the season chips no longer carry an unexplained number (\"Season 2 6\"); the heading above the episodes already says how many there are. \"2 more\" now sits on the heading line at the right instead of at the bottom, where it ran into the key legend."
  ],
  "history": [
    {
      "name": "Alpha 0.51.3",
      "date": "2026-11-21",
      "notes": [
        "TV Guide: with Interface size on Large the bottom channel row was cut off by the screen edge. The guide now shows as many rows as fit at the chosen size (6 on Large, 7 otherwise)."
      ]
    },
    {
      "name": "Alpha 0.51.2",
      "date": "2026-11-20",
      "notes": [
        "On Demand, from the design review: the hero now has Play and More info buttons (OK plays it, hold OK opens the show page), a year / seasons / genre line with the certificate in a small badge when it has one, and amber dots showing which of the five slides is on. The highlight ring on cards is now amber, 3 px with a gap. The rail has a Guide icon that jumps to the TV guide."
      ]
    },
    {
      "name": "Alpha 0.51.1",
      "date": "2026-11-20",
      "notes": [
        "On Demand: the hero is now a large banner. At the top of the page (chips or hero) the show's backdrop fills the top two thirds of the screen, with its logo or a big title over it and one row below. Moving down into the rows shrinks it back to the compact layout."
      ]
    },
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
    }
  ]
};
