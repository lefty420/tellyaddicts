// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.49.5",
  "version": "0.49.5",
  "code": 4905,
  "date": "2026-11-20",
  "notes": [
    "The start-up loading screen no longer sits at \"TUNING 0 / 66\" for a minute. With Magic EPG on, every channel's running order took seconds to build and all 66 were built in one unbroken stretch, so the screen could not move and the count only jumped at the very end. Long stretches of building now give way to the screen every 40 ms or so, so the count climbs and buttons answer.",
    "The loading screen waits at most 10 seconds for every channel (it was 30). A box that is slower than that opens the guide with the first rows built, in guide order, and the rest fill in a moment later."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.48.3",
      "date": "2026-11-16",
      "notes": [
        "Info is now a screen you can use, not just read. Up/Down move between its rows, Left/Right along a row, OK presses what is highlighted (gold) and Back goes back a step. OK no longer closes it.",
        "Buttons: Watch now (Keep watching if you opened Info while watching), Next episode for a series, and Hide this film / show.",
        "Cast: OK on a name lists everything else with them that this TV can play, with their part in each, and OK on one opens its Info. A small gold number on a photo says how many others there are. Films are all included; a series joins once its Info has shown its cast. Films now really get their cast from the library (it was being dropped on the way to the film channels).",
        "A gold line under the summary says when it is on next in the guides (\"Next on Kids Movies: 19:49\", or \"On now on ...\").",
        "A series shows its episodes in a row, starting at this one: the series numbers across the top, how many of that series are in your library, and the episodes the episode guide (data/epdb.json) knows but the library has not got shown dashed as \"Not in library\". OK plays an episode and carries on through the show.",
        "More like this: for a film, other films that share a genre, the same decade first; for a series, more shows on its channel. OK opens its Info, Back comes back.",
        "A film's title no longer shows its year twice."
      ]
    },
    {
      "name": "Alpha 0.48.2",
      "date": "2026-11-16",
      "notes": [
        "The bar you get with OK while watching has fewer, clearer buttons: Stop, Restart, Play/Pause, Next, then Guide, Sources, Audio & subs and Options. Guide opens a short list (TV Guide, Channel schedule, On Demand); Sources (only with Experimental on and an addon) holds Auto play from addons and Find sources. Up/Down pick in the list, OK runs it, Left/Right or Back close it.",
        "New Stop button: stops the programme and opens the TV Guide. Back from the guide joins the channel again where it is now.",
        "Skip adverts is no longer a separate button: during an ad break Next reads \"Skip adverts\"."
      ]
    }
  ]
};
