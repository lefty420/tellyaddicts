// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.49.7",
  "version": "0.49.7",
  "code": 4907,
  "date": "2026-11-20",
  "notes": [
    "Fewer stutters just after the guide comes up. The background jobs that start a few seconds later (saving episode links for Play Next, and pre-loading On Demand) now wait until no button has been pressed for 4 seconds, and the link saving works in smaller pieces with longer gaps. Not yet tried on the Shield."
  ],
  "history": [
    {
      "name": "Alpha 0.49.6",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG: when its episode list comes in several files and one of them does not arrive, what did arrive is used for this start but no longer saved as if it were the whole list (the missing shows stayed without filled-in episodes until the scraper sent a new one). Those files also get the library's longer download time (2 minutes, was 40 seconds).",
        "Buffering: if archive.org ignores a request to start part-way through a file and sends the whole thing, the TV no longer saves it at the wrong place (the picture after a jump could be garbage). It stops buffering that file instead.",
        "Faster start: the list of what is saved on the TV is read once per start, not again for every channel built (up to about 100 times with Magic Channels on).",
        "Looked-up answers the TV keeps (episode guides, artwork, cast, info pages) are now cleared when they have not been saved for 60 days. Nothing cleared them before, so the store only grew. Channel lists and film details are kept.",
        "Saving no longer waits for each file to reach the disk.",
        "Tidy: removed the built-in copy of the channel lists (autodata.js, 450 KB, last updated by a tool no longer used), that tool (tools/import_scrape.py) and four one-time clean-ups that had long since done their job. With no published lists reachable, a channel now uses its live searches.",
        "New check: `node tools/test_libroute.js` tests how the library is sorted onto channels.",
        "Not yet tried on the Shield; the Java changes are compile-checked only."
      ]
    },
    {
      "name": "Alpha 0.49.5",
      "date": "2026-11-20",
      "notes": [
        "The start-up loading screen no longer sits at \"TUNING 0 / 66\" for a minute. With Magic EPG on, every channel's running order took seconds to build and all 66 were built in one unbroken stretch, so the screen could not move and the count only jumped at the very end. Long stretches of building now give way to the screen every 40 ms or so, so the count climbs and buttons answer.",
        "The loading screen waits at most 10 seconds for every channel (it was 30). A box that is slower than that opens the guide with the first rows built, in guide order, and the rest fill in a moment later."
      ]
    },
    {
      "name": "Alpha 0.49.4",
      "date": "2026-11-20",
      "notes": [
        "Guide: stepping onto the On Demand button no longer leaves the programme gold as well. One highlight at a time; moving back drops you where you were.",
        "Playback bar: a two-digit channel number (31, 32 ...) no longer sits on the gold edge when there is no picture beside it.",
        "On Demand: a show whose poster will not load now shows its name on the card instead of a blank tile."
      ]
    },
    {
      "name": "Alpha 0.49.3",
      "date": "2026-11-20",
      "notes": [
        "Faster rebuild of the guides (first start, Refresh listings, turning Magic Channels on). Every channel build re-saved every film's details to the TV's storage even when nothing had changed, thousands of synced file writes with Magic Channels on. A film is now saved only when it differs from the copy already there, and checked once per start. Not yet timed on the Shield."
      ]
    },
    {
      "name": "Alpha 0.49.2",
      "date": "2026-11-20",
      "notes": [
        "Faster start after the scraper sends a new library. The TV used to download and sort the whole library (12 MB) before the guide could open, every time a new one had been published (several times a day). It now opens on the lists it already has, then sorts the new library in the background once the guide is up, ready for the next start. New episodes from the scraper appear one start later. The very first start, Refresh listings and turning Magic Channels on still build everything first."
      ]
    },
    {
      "name": "Alpha 0.49.1",
      "date": "2026-11-20",
      "notes": [
        "Fixed: the Christmas channels (Christmas TV, Children's Christmas and the four Christmas Magic Channels) were showing ordinary episodes. With Magic EPG on, one Christmas special pulled the rest of its show onto the channel, and Real world then played them in order. Christmas channels now get neither: no filled-in episodes, and their specials keep their shuffle.",
        "A Christmas episode now has to say Christmas (Christmas, Xmas, Santa, Boxing Day, Noel, panto ...) or be a British show that aired on 24, 25 or 26 December. Episodes marked only because they aired in Christmas week are left off: US cartoons and sitcoms that happened to air then (DuckTales, M.A.S.K., Benson, The Jeffersons) and anything on New Year's Eve or New Year's Day. About 1 in 6 fewer episodes on those channels."
      ]
    },
    {
      "name": "Alpha 0.49.0",
      "date": "2026-11-20",
      "notes": [
        "Options > Experimental: new \"Magic Channels\" (off by default). Adds 35 themed channels built from the whole library, after the usual ones:",
        "The lineup is in tools/magic_channels.py (it writes tools/shows.json and channels.js), so a channel's shows can be changed without a new APK by editing shows.json."
      ]
    },
    {
      "name": "Alpha 0.48.4",
      "date": "2026-11-20",
      "notes": [
        "Fixed: the episodes row on Info never showed a thumbnail picture at all (only the dashed box). It now shows the episode's own picture where the library has one for it.",
        "Films can now show a clear (transparent title) image on their On Demand page and poster, the same way TV shows do, once the scraper sends one. Nothing changes until it does."
      ]
    }
  ]
};
