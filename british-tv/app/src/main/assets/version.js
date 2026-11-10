// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.25.3",
  "version": "0.25.3",
  "code": 2503,
  "date": "2026-11-10",
  "notes": [
    "**Soaps are on the Soaps channel and on their broadcaster's channel.** EastEnders is on BBC and on Soaps, Emmerdale and Crossroads on ITV and on Soaps, and so on; every soap the library has goes to Soaps. (They had been kept off BBC and ITV.) The 25% cap per show still stops one long soap from filling BBC or ITV",
    "**A brief server error from archive.org is no longer the end of a programme.** The debug log showed Bananaman, News 24 and others all failing in the same few minutes with archive.org answering 500 or 502 and then playing normally a moment later. The on-device buffer now asks again, twice, before giving up",
    "**A programme that had started playing is no longer given up on** if it paused to buffer: the 25 second check applies only to one that never got going (The Witches was skipped after playing for 20 seconds, and marked slow for two weeks)",
    "Missing On Demand episode guides are no longer listed as failures in the debug log, and scrolling quickly down the shows asks for a guide only when the highlight rests"
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.24.2",
      "date": "2026-11-10",
      "notes": [
        "**On Demand uses the scraper's episode guides the moment they are published.** `index.json` now lists which shows have a guide and its revision: a show with one gets it from the scraper (kept until the scraper publishes a newer one, whatever the keep setting), and a show without one still falls back to TVmaze. No request is wasted guessing at a guide that does not exist"
      ]
    },
    {
      "name": "Alpha 0.24.1",
      "date": "2026-11-10",
      "notes": [
        "**On Demand now lists every show and every episode in a category.** It was borrowing the channels' rules, which drop any file whose name has no season and episode code (Dogtanian's \"1x01\" style, most cartoons and a lot of drama) and sample a limited number of programmes, so CITV showed 8 shows instead of 93 and Drama 8 instead of 24. It now takes the whole library list for the channel",
        "Each channel in On Demand shows how many shows it has, filled in as it loads, and episodes with no number are put in natural order by name (Episode 2 before Episode 10)",
        "A TVmaze reply that is not an episode list can no longer cause an error"
      ]
    },
    {
      "name": "Alpha 0.24",
      "date": "2026-11-10",
      "notes": [
        "**Artwork and episode details are kept as long as you choose.** Options > **Keep artwork & details**: 1 week, 4 weeks or **Permanent** (the default). Before, they were looked up again every month. A failed lookup is still retried within the hour, and a show with nothing published is checked again in a few days, whatever this is set to",
        "**Options > Clear saved artwork** forgets all the saved artwork and episode details and the downloaded pictures so they are fetched fresh, and shows how much is stored. This needs the new app, since the picture cache is cleared on the device itself",
        "**On Demand now has episode titles, stills and summaries before the scraper publishes its episode files.** It asks TVmaze once for the whole show (using the id in `art.json`) when you open it, and keeps the answer; the scraper's `data/eps/` files take over as soon as they exist",
        "The Options panel is a little tighter so the new rows fit"
      ]
    },
    {
      "name": "Alpha 0.23.3",
      "date": "2026-11-10",
      "notes": [
        "**A much quicker way to the guide's On Demand button: press Left.** When the guide is on what is on now (as it is when it opens), one Left reaches the button, then OK. Right or Down goes back to the channels. Up from the first channel still works, but with many channels that was too far to climb. The guide's bottom line says so"
      ]
    },
    {
      "name": "Alpha 0.23.2",
      "date": "2026-11-10",
      "notes": [
        "**On Demand can be reached with the arrow keys and OK alone.** In the guide there is an **On Demand** button beside the clock: press Up from the first channel to reach it, then OK (Down goes back to the channels). While watching, the OK bar has an **On Demand** button beside Options. The coloured-button and Menu shortcuts still work for remotes that have them"
      ]
    }
  ]
};
