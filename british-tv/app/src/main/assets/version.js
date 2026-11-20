// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.49.12",
  "version": "0.49.12",
  "code": 4912,
  "date": "2026-11-20",
  "notes": [
    "The screen shown while something starts to play now only ever shows a backdrop (fan art). A show or film with only a poster, such as Ace Ventura: When Nature Calls, now gets the tuned-to-static screen instead of a poster.",
    "Fixed the TMDB key check (\"Could not reach TMDB to check the key\"). The app's list of allowed web addresses did not include TMDB's lookups, so the check, and TMDB as the episode-list source, could never get an answer. This needs the app rebuilt and installed, not just a restart. TheTVDB was not affected."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.49.7",
      "date": "2026-11-20",
      "notes": [
        "Fewer stutters just after the guide comes up. The background jobs that start a few seconds later (saving episode links for Play Next, and pre-loading On Demand) now wait until no button has been pressed for 4 seconds, and the link saving works in smaller pieces with longer gaps. Not yet tried on the Shield."
      ]
    },
    {
      "name": "Alpha 0.49.6",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG: when its episode list comes in several files and one of them does not arrive, what did arrive is used for this start but no longer saved as if it were the whole list (the missing shows stayed without filled-in episodes until the scraper sent a new one). Those files also get the library's longer download time (2 minutes, was 40 seconds).",
        "Buffering: if archive.org ignores a request to start part-way through a file and sends the whole thing, the TV no longer saves it at the wrong place (the picture after a jump could be garbage). It stops buffering that file instead.",
        "Faster start: the list of what is saved on the TV is read once per start, not again for every channel built (up to about 100 times with Magic Channels on).",
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
    }
  ]
};
