// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.43",
  "version": "0.43",
  "code": 4300,
  "date": "2026-11-12",
  "notes": [
    "**New guide menu entries.** Hold OK on a programme and you now get **Stream next episode** (plays the episode after it and carries on through the show), **Try another version** (plays a different stored copy of that episode or film; press again for the next copy) and **Scrape this show** (looks the show up again, pins the match, and re-sorts its stored files into seasons and episodes). Next showing and Stream link are gone."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.39",
      "date": "2026-11-12",
      "notes": [
        "**New start-up screen.** The logo sits on top with a retro TV in the middle that tunes in your channels: static, show pictures flicking up as it hunts, colour bars when a channel locks in, and the name of each channel under the set."
      ]
    },
    {
      "name": "Alpha 0.38.2",
      "date": "2026-11-12",
      "notes": [
        "**Options menu: less work on every key press.** Only the rows that changed are redrawn, and the size of saved artwork is added up only if you stop on that row, not as you scroll past it."
      ]
    },
    {
      "name": "Alpha 0.38.1",
      "date": "2026-11-12",
      "notes": [
        "**The options menu is quick again.** Each key press was adding up the size of everything saved (to show it next to Clear saved artwork), which meant reading hundreds of saved files every time. The total is now worked out once, a moment after the options open, and after a clear."
      ]
    }
  ]
};
