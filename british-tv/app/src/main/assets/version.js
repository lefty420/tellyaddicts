// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.26.1",
  "version": "0.26.1",
  "code": 2601,
  "date": "2026-11-11",
  "notes": [
    "**VHS 2 lines are now even.** The lines were drawn at fractions of a pixel, so some came out thick and some gaps wide. They are now drawn in whole screen pixels, so every line and every gap is the same size."
  ],
  "history": [
    {
      "name": "Alpha 0.26",
      "date": "2026-11-11",
      "notes": [
        "**New enhancement: VHS 2.** Under Options > Enhancements, after VHS: a flat, saturated picture with fine dark lines right across it, like a tape on a cheap set."
      ]
    },
    {
      "name": "Alpha 0.25.6",
      "date": "2026-11-11",
      "notes": [
        "**The Bill channel is now Drama.** The channel id `thebill` becomes `drama` in the app and in `tools/shows.json` (named just \"Drama\"), matching the scraper's new `drama.json`. The Bill stays on both Drama and ITV. Until the scraper publishes the new file, the app uses its built-in Drama list."
      ]
    },
    {
      "name": "Alpha 0.25.5",
      "date": "2026-11-11",
      "notes": [
        "**`routes.json` is now the source of truth for where shows go.** A show it lists appears only on the channel(s) it names and is dropped from any other channel's list, so moving a show by hand in the scraper moves it on the TV too. Shows it doesn't list keep their channels from `tools/shows.json`.",
        "**The Disney channel has no era limit and needs no air dates or TVmaze id.** Undated and pre-1970 cartoon shorts (Donald Duck, Mickey Mouse, Goofy, Pluto, Silly Symphonies, Disney Cartoons) play on Disney; every other channel still keeps 1970 to 1999."
      ]
    },
    {
      "name": "Alpha 0.25.4",
      "date": "2026-11-10",
      "notes": [
        "**Shows the scraper has removed for good stay off the TV.** When the scraper publishes `data/removed-shows.json` (and `removed` in `index.json`), those shows are left out of every channel and out of On Demand, whatever the lists say. C.O.P.S. is the first; it is also gone from `tools/shows.json`"
      ]
    },
    {
      "name": "Alpha 0.25.3",
      "date": "2026-11-10",
      "notes": [
        "**Soaps are on the Soaps channel and on their broadcaster's channel.** EastEnders is on BBC and on Soaps, Emmerdale and Crossroads on ITV and on Soaps, and so on; every soap the library has goes to Soaps. (They had been kept off BBC and ITV.) The 25% cap per show still stops one long soap from filling BBC or ITV",
        "**A brief server error from archive.org is no longer the end of a programme.** The debug log showed Bananaman, News 24 and others all failing in the same few minutes with archive.org answering 500 or 502 and then playing normally a moment later. The on-device buffer now asks again, twice, before giving up",
        "**A programme that had started playing is no longer given up on** if it paused to buffer: the 25 second check applies only to one that never got going (The Witches was skipped after playing for 20 seconds, and marked slow for two weeks)",
        "Missing On Demand episode guides are no longer listed as failures in the debug log, and scrolling quickly down the shows asks for a guide only when the highlight rests"
      ]
    },
    {
      "name": "Alpha 0.25.2",
      "date": "2026-11-10",
      "notes": [
        "**A video file is a video file.** The library lists may carry mp4, m4v or mkv and the app no longer treats the formats differently: the special \"prefer an mp4 over an mkv\" rule is gone (the scraper already sends the best copy of each episode, and the usual duplicate check still prefers archive.org's small `.ia.mp4` copy), and the on-device buffer hands the player the type archive.org reports for the file instead of working it out from the name"
      ]
    },
    {
      "name": "Alpha 0.25.1",
      "date": "2026-11-10",
      "notes": [
        "**The Debug log now says what this TV’s own player can play**: MP4, MKV (with H.264, AC3 audio or HEVC inside), WebM and AVI, each as yes, maybe or no. It is also written at the top of the log you send. This is the player’s own answer on this device, so it settles whether MKV is worth sending before any MKV is tried"
      ]
    },
    {
      "name": "Alpha 0.25",
      "date": "2026-11-10",
      "notes": [
        "**The scraper's library lists may now include `.mkv` files**, for shows archive.org only has in that form. They are used only when there is no mp4 of the same episode (an mp4 always wins), and only from the library lists, never from live archive.org searches. The on-device buffer now tells the player it is Matroska. Whether a given MKV plays depends on the codecs inside it and on this TV's built-in player, which has not been tried yet: if one fails, the debug log records it as any other failure and the channel moves on. `.avi` is not supported"
      ]
    }
  ]
};
