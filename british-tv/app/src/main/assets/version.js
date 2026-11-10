// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.23.3",
  "version": "0.23.3",
  "code": 2303,
  "date": "2026-11-10",
  "notes": [
    "**A much quicker way to the guide's On Demand button: press Left.** When the guide is on what is on now (as it is when it opens), one Left reaches the button, then OK. Right or Down goes back to the channels. Up from the first channel still works, but with many channels that was too far to climb. The guide's bottom line says so"
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.22",
      "date": "2026-11-10",
      "notes": [
        "**The \"Please stand by\" screen now shows what is about to play.** Its artwork (a film's poster, or a show's poster or backdrop) appears on the screen of a little retro TV set, with scanlines, a gentle flicker of static and a blinking standby light. If the show has no artwork to hand, the set stays and its screen shows static instead. Artwork is only used when it is already known, so the screen never waits on the network, and the lookup runs in the background so that show has art next time"
      ]
    },
    {
      "name": "Alpha 0.21",
      "date": "2026-11-10",
      "notes": [
        "**Press Back twice quickly to quit, from the guide or while watching.** A box asks \"Quit Telly Addicts?\" with Yes and No as buttons: Left and Right then OK on the remote, or a click. No is already chosen, so an accidental OK does nothing. A single Back does what it always did (the guide while watching, back to the picture from the guide), and Back on the box answers No"
      ]
    },
    {
      "name": "Alpha 0.20.1",
      "date": "2026-11-10",
      "notes": [
        "The debug log no longer records a missing `art.json` or `routes.json` as a failed request. They are optional until the scraper publishes them, and the entries were burying real problems"
      ]
    },
    {
      "name": "Alpha 0.20",
      "date": "2026-11-10",
      "notes": [
        "**The debug log can now say why a programme is wrong, not only why one failed.** Pressing Info on anything that is playing writes a record of it: the show it was listed as, the archive.org item and file it came from, how long the listing says it should be and how long the file really is, and the picture size. The app also asks archive.org what that upload actually is (its title, who uploaded it, language, collections, the start of its description) and records the answer, which is what shows a programme to be a different show with the same name",
        "A file much shorter than its listing is logged as a mismatch the moment it loads, with the same details, without anyone having to press anything",
        "The Debug log screen says how to use this and lists the latest programmes you checked"
      ]
    }
  ]
};
