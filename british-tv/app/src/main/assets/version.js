// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.31",
  "version": "0.54.31",
  "code": 5431,
  "date": "2026-11-27",
  "notes": [
    "**Options stays responsive while the artwork scan works out what is missing.** The list of shows is now worked out in short slices, not one block, so opening Options during a scan no longer freezes for seconds.",
    "**Library sort takes smaller bites**, so Options does not stall while the library is being sorted into channels.",
    "**A changed YouTube list rebuilds On Demand after you leave On Demand and Options**, not while you are in them. JavaScript only."
  ],
  "history": [
    {
      "name": "Alpha 0.54.30",
      "date": "2026-11-27",
      "notes": [
        "**Going Back from a video no longer rebuilds On Demand.** Back used to redraw the whole page from scratch, which froze the screen for 11 to 14 seconds. It now puts back the page as it was, and the rebuild only happens if the page is no longer there. Starting an episode from On Demand (including Play Next) now always remembers where you were. JavaScript only.",
        "**Options no longer stalls while it is open.** Background jobs (episode names and the quiet artwork check) now wait until Options is closed. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.29",
      "date": "2026-11-27",
      "notes": [
        "**On Demand stays smoother while artwork loads.** A poster or background that arrives while you are moving around used to redraw the rows straight away, in the middle of a key press. Redraws from new artwork are now batched and wait until you stop pressing keys. JavaScript only."
      ]
    },
    {
      "name": "Alpha 0.54.28",
      "date": "2026-11-25",
      "notes": [
        "**Episode titles on a show's page are no longer cut off.** Every card started with the show name (\"Stars In Their Eyes - 199…\"), so the part that tells the episodes apart was hidden. The show name is now left off the card and a long title can use two lines. JavaScript and layout only."
      ]
    },
    {
      "name": "Alpha 0.54.27",
      "date": "2026-11-25",
      "notes": [
        "**Christmas Cartoons & Kids has 93 shows instead of 36.** Every children's show whose files or guide say Christmas is now on the channel: Rupert Bear, Playdays, Richard Scarry, Walt Disney Cartoon, Oswald, The Flintstones, Care Bears, Pingu, Pinky and the Brain, Tiny Toons, Rugrats and many more, about 207 Christmas episodes in all (it was about 125). The same Magic channels update also re-checked the other Magic channels against the current library: Frasier joins TGIF, and Hit List UK, Room 101, Willy Fog, Roswell Conspiracies and two Christmas Pop search words are gone because the library no longer has them. Data only (channel list), no code change."
      ]
    },
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
    }
  ]
};
