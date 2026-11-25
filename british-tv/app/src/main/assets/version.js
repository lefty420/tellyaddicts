// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.24",
  "version": "0.54.24",
  "code": 5424,
  "date": "2026-11-25",
  "notes": [
    "**The channels are in a real-TV order.** Numbers 1 to 9 are the main channels (Classic BBC, ITV, ITV Morning, Saturday Night TV, Game Shows, Entertainment, Drama, Soaps, Classic Sitcoms), then quiz and light entertainment, comedy, drama, decades, kids, movies, music and games, food and Christmas, with Adverts last. The Magic EPG channels are mixed in beside their closest relatives instead of sitting in a block at 41 to 75, and the numbers have no gaps whether Magic EPG is on or off. Saved favourites and picks are by channel, not number, so they are not affected. `tools/magic_channels.py` carries the same numbers, so regenerating the Magic channels does not undo it."
  ],
  "history": [
    {
      "name": "Alpha 0.54.23",
      "date": "2026-11-24",
      "notes": [
        "**The snow comes back after you watch something.** Backing out of a video put On Demand back without starting the snow again, so it stayed off until Seasonal effects was switched off and on in Options. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.22",
      "date": "2026-11-24",
      "notes": [
        "**The way back to the small video is now on screen.** While a video plays small, the big button at the top reads \"Back to the video (full screen)\" and OK on it takes the video full screen. The hint line says the same. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.21",
      "date": "2026-11-24",
      "notes": [
        "**More pictures on the loading screen.** Early on only a couple of backdrops had finished loading, and the screen flicked between those. Until ten backdrops are in, the posters now join the pool, so there is more to tune through. The debug log gets a \"SPLASH:\" line at 3 s and 8 s after launch saying how many pictures had loaded, so if it is still only two we can see whether the pictures or the loading is the problem. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.20",
      "date": "2026-11-24",
      "notes": [
        "**Back now walks up instead of flipping between the small video and full screen.** Video, Back: the episodes with the video still playing small. Back: On Demand home. Back at the top: the quit prompt. To take the small video full screen, go up to it (the picture at the top) and press OK. JavaScript only (no new Java needed beyond 0.54.19)."
      ]
    },
    {
      "name": "Alpha 0.54.19",
      "date": "2026-11-24",
      "notes": [
        "**The YouTube log line is shorter and says what NewPipe did first.** In 0.54.18 the line was cut off before NewPipe's result. Now: NewPipe's answer, then the servers that worked, then how many others failed. Logging only; needs a new build (Java)."
      ]
    },
    {
      "name": "Alpha 0.54.18",
      "date": "2026-11-24",
      "notes": [
        "**The debug log now says how each YouTube route did.** The \"YOUTUBE stream\" line lists NewPipe and every server that had answered (picture quality and milliseconds, or why it failed), and says when NewPipe had not answered yet. It also logs a \"CONTINUE:\" line when a show is saved in Continue watching but cannot be shown (which channel, and what it was missing). Logging only; needs a new build (Java)."
      ]
    },
    {
      "name": "Alpha 0.54.17",
      "date": "2026-11-24",
      "notes": [
        "**NewPipe now sends YouTube's consent cookie.** The first test of 0.54.15 reached YouTube but failed with \"Could not get ytInitialData\", which is what the consent page looks like to the extractor in the UK. Needs a new build (Java). Also includes the 0.54.16 change below."
      ]
    },
    {
      "name": "Alpha 0.54.16",
      "date": "2026-11-24",
      "notes": [
        "**An episode with no source now stays on its show page.** Pressing an episode that no addon, archive.org or YouTube copy could play showed \"No source found\" and then dropped you back to the top of On Demand. It now returns to the same show with the same episode highlighted. (S06E04 of Telly Addicts has no copy anywhere yet; that is a library gap for the scraper.)"
      ]
    }
  ]
};
