// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.13",
  "version": "0.46.13",
  "code": 4613,
  "date": "2026-11-14",
  "notes": [
    "**Classic Blue looks livelier**: gradient channel tiles with rounded corners, the programme showing now glows brighter with a gold edge on every channel, and later programmes are darker so it is easy to see what is on right now.",
    "**Options > Guide theme fixed**: the preview of the theme now shows all three rows instead of being cut off, and the Options panel no longer spills its rows over the button hints at the bottom; it scrolls to follow the highlighted row."
  ],
  "history": [
    {
      "name": "Alpha 0.46.12",
      "date": "2026-11-14",
      "notes": [
        "**No second loading screen**: a programme that starts part-way through (like G.I. Joe) could show the loading screen, drop it, then show it again when the player jumped to the right spot. Each programme now gets its loading screen once."
      ]
    },
    {
      "name": "Alpha 0.46.11",
      "date": "2026-11-14",
      "notes": [
        "**Options now leaves a trail in the debug log**: where it was opened from, how many button presses it handled, and whether it closed by itself. This is to pin down any further report of Options hanging.",
        "**Three more wrong matches blocked** from your reports and the log: Care Bears was playing the 2007 series, CITV had a 2018 CGI Thomas & Friends, and The Lion King (1994) was a recording of the stage musical."
      ]
    },
    {
      "name": "Alpha 0.46.10",
      "date": "2026-11-14",
      "notes": [
        "**Options no longer hangs when opened from On Demand.** Opening Options from the On Demand hold-OK menu showed the Options screen, but the remote was still moving On Demand underneath it, so Options looked frozen until it closed itself. The remote now works Options, and Back returns to On Demand."
      ]
    },
    {
      "name": "Alpha 0.46.9",
      "date": "2026-11-14",
      "notes": [
        "**Search in On Demand.** Press Yellow on the On Demand screen (or hold OK and choose Search), type part of a name on the on-screen keyboard and press Search. Every channel is searched, and the shows and films that match appear as a \"Search\" row at the top. Search again with the box empty (Clear, then Search) to remove the row.",
        "The on-screen keyboard has a Space key."
      ]
    },
    {
      "name": "Alpha 0.46.8",
      "date": "2026-11-14",
      "notes": [
        "**Three wrong YouTube videos are out of Blind Date.** They were modern short dramas (\"A Billionaire CEO hides her identity for a blind date…\") that matched on the show's name. Videos like that are now left out."
      ]
    },
    {
      "name": "Alpha 0.46.7",
      "date": "2026-11-14",
      "notes": [
        "**YouTube episodes no longer play behind a frozen picture.** Starting a YouTube episode (or anything else in the app's own player) straight after a normal programme left that programme's last frame stuck on screen, with the new one playing behind it. The old picture is now let go and hidden whenever the app's own player is showing."
      ]
    },
    {
      "name": "Alpha 0.46.6",
      "date": "2026-11-14",
      "notes": [
        "**Films get backdrops and an artwork menu** (needs a TheTVDB key). Hold OK on a film in On Demand: Scrape artwork finds its backdrop on TheTVDB, Choose the right film lists the matches when it picked the wrong one, and Choose a poster / Choose a background list its pictures. Back to automatic forgets the choices. A film keeps the poster it came with unless you pick another.",
        "**Scan my artwork now covers films too**: with a key it looks up a backdrop for every film that has none, after the shows.",
        "The backdrop is used wherever a show's is: the loading screen, On Demand and the guide."
      ]
    },
    {
      "name": "Alpha 0.46.5",
      "date": "2026-11-14",
      "notes": [
        "**The library is no longer downloaded on every start.** The app fetched the whole 10 MB library a few seconds after every launch, even when nothing had changed. It now keeps the copy on the TV with its revision and only downloads when the scraper publishes a new one. Saving it is also lighter (the text is stored as it came instead of being wrapped a second time).",
        "**VHS looks stop dropping frames at the start of every programme.** When two programmes in a row needed the blur taken off, the rest of the session starts without it instead of finding out again each time. Choosing a look in Options gives it a fresh try."
      ]
    }
  ]
};
