// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.25",
  "version": "0.25",
  "code": 2500,
  "date": "2026-11-10",
  "notes": [
    "**The scraper's library lists may now include `.mkv` files**, for shows archive.org only has in that form. They are used only when there is no mp4 of the same episode (an mp4 always wins), and only from the library lists, never from live archive.org searches. The on-device buffer now tells the player it is Matroska. Whether a given MKV plays depends on the codecs inside it and on this TV's built-in player, which has not been tried yet: if one fails, the debug log records it as any other failure and the channel moves on. `.avi` is not supported"
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.23.1",
      "date": "2026-11-10",
      "notes": [
        "**The blue button opens On Demand**, in the guide (where its legend now says so; Blue used to repeat OK's \"Watch\") and while watching. Options > On Demand still works"
      ]
    },
    {
      "name": "Alpha 0.23",
      "date": "2026-11-10",
      "notes": [
        "**On Demand (TV).** Options > On Demand (or the remote's Menu key, if it has one) opens a browser: channels on the left, that channel's shows A to Z in the middle, and its series and episodes in order on the right. OK on an episode plays it from the start, like a recording, with the usual bar to pause and skip; when it ends the next episode of that show starts, and at the end of the show you are back in the browser. Back steps back a column. Films, songs and dated clips are not listed as shows",
        "Under the episode list: the highlighted episode's still, title, year, running time and summary, or the show's own summary, network, years and genres when there is no episode detail. Episode details come from the scraper's new `data/eps/<show>.json` files (see `tools/meta-contract.md`); until they are published the list shows the library's own titles"
      ]
    },
    {
      "name": "Alpha 0.22.1",
      "date": "2026-11-10",
      "notes": [
        "**Changing channel now shows the \"Please stand by\" TV instead of the full-screen static.** It comes up at once, stays for at least a moment so it is seen, and plays a short hiss. If the programme's artwork is not known yet it looks it up and swaps it onto the TV screen as soon as it arrives; a programme with no artwork anywhere stays on static. The guide's small preview no longer shows static while tuning"
      ]
    }
  ]
};
