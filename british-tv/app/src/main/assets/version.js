// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.27",
  "version": "0.54.27",
  "code": 5427,
  "date": "2026-11-25",
  "notes": [
    "**Christmas Cartoons & Kids has 93 shows instead of 36.** Every children's show whose files or guide say Christmas is now on the channel: Rupert Bear, Playdays, Richard Scarry, Walt Disney Cartoon, Oswald, The Flintstones, Care Bears, Pingu, Pinky and the Brain, Tiny Toons, Rugrats and many more, about 207 Christmas episodes in all (it was about 125). The same Magic channels update also re-checked the other Magic channels against the current library: Frasier joins TGIF, and Hit List UK, Room 101, Willy Fog, Roswell Conspiracies and two Christmas Pop search words are gone because the library no longer has them. Data only (channel list), no code change."
  ],
  "history": [
    {
      "name": "Alpha 0.54.26",
      "date": "2026-11-25",
      "notes": [
        "**The snow stays on while the small video plays.** It used to switch itself off whenever a video played in the small window. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.25",
      "date": "2026-11-25",
      "notes": [
        "**Logging for the freeze when you press Back from a video.** Going back to On Demand froze the screen for 9 to 16 seconds after a stream (9.5 s, 12 s and 16 s in today's and yesterday's logs). The log now has \"BACK from play:\" lines saying which step the time goes in (paused picture, page on, snow, first picture, or the long way round when On Demand was not marked). No change in behaviour. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.24",
      "date": "2026-11-25",
      "notes": [
        "**The channels are in a real-TV order.** Numbers 1 to 9 are the main channels (Classic BBC, ITV, ITV Morning, Saturday Night TV, Game Shows, Entertainment, Drama, Soaps, Classic Sitcoms), then quiz and light entertainment, comedy, drama, decades, kids, movies, music and games, food and Christmas, with Adverts last. The Magic EPG channels are mixed in beside their closest relatives instead of sitting in a block at 41 to 75, and the numbers have no gaps whether Magic EPG is on or off. Saved favourites and picks are by channel, not number, so they are not affected. `tools/magic_channels.py` carries the same numbers, so regenerating the Magic channels does not undo it."
      ]
    },
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
    }
  ]
};
