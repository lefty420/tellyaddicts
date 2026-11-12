// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.1",
  "version": "0.45.1",
  "code": 4501,
  "date": "2026-11-12",
  "notes": [
    "**Decade channels use a show's end year.** An episode with no air date is only placed in a decade if its show also ended in that decade, when the library says when it ended."
  ],
  "history": [
    {
      "name": "Alpha 0.45",
      "date": "2026-11-12",
      "notes": [
        "**Missing artwork is found in the background.** A minute after the channels have loaded, the app quietly looks up any show that has no picture or backdrop and keeps what it finds with the rest of the artwork. It goes one show at a time, slowly, pauses while On Demand is open, stops after a run of failures, and once finished does not run again until the channels are rebuilt (Options > Refresh EPG) or the library changes."
      ]
    },
    {
      "name": "Alpha 0.44",
      "date": "2026-11-12",
      "notes": [
        "**Decade channels: 70's TV, 80's TV (29) and 90's TV (30).** Each plays only programmes and films from its own decade, taken from the whole library whatever the genre, instead of a hand-picked list. An episode with an air date counts as that year; one without goes by when its show began, and is left out if the show has dated episodes in a later decade. 70s TV is now called 70's TV."
      ]
    },
    {
      "name": "Alpha 0.43",
      "date": "2026-11-12",
      "notes": [
        "**New guide menu entries.** Hold OK on a programme and you now get **Stream next episode** (plays the episode after it and carries on through the show), **Try another version** (plays a different stored copy of that episode or film; press again for the next copy) and **Scrape this show** (looks the show up again, pins the match, and re-sorts its stored files into seasons and episodes). Next showing and Stream link are gone."
      ]
    },
    {
      "name": "Alpha 0.42",
      "date": "2026-11-12",
      "notes": [
        "**Cast on the Info screen.** A row of round photos with each actor's name and character, from TVmaze for programmes and from the film details for films (films show a cast once the film data carries one). The debugging lines that used to sit at the bottom of the Info screen are gone."
      ]
    },
    {
      "name": "Alpha 0.41",
      "date": "2026-11-12",
      "notes": [
        "**A scrubber instead of the 30-second buttons.** The rewind and fast-forward buttons are gone from the OK bar. Press Left or Right while watching (or the remote's rewind / fast-forward keys) and the progress bar becomes a scrubber: a tap moves 10 seconds, holding winds faster the longer you hold, and the picture jumps when you let go. Down reaches the buttons, Up comes back to the bar."
      ]
    },
    {
      "name": "Alpha 0.40",
      "date": "2026-11-12",
      "notes": [
        "**Hold OK on a programme in the guide for a menu.** It offers On Demand (opens that show's page), Watch now, Watch from the start, Info (details for that programme without leaving the guide), Next showing (jumps the guide to the next time the same show is on that channel) and the stream link."
      ]
    },
    {
      "name": "Alpha 0.39.2",
      "date": "2026-11-12",
      "notes": [
        "**The blue button no longer opens On Demand.** It is back to Watch in the guide and does nothing while watching. On Demand is still reached with the On Demand button, Menu, or Left from what is on now."
      ]
    },
    {
      "name": "Alpha 0.39.1",
      "date": "2026-11-12",
      "notes": [
        "**Start-up waits for the whole guide.** The TV stays on the tuning screen until every channel has loaded (up to 30 seconds on a slow connection), so the guide opens complete instead of appearing and then pausing while channels fill in."
      ]
    }
  ]
};
