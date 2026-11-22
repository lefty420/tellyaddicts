// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.42",
  "version": "0.53.42",
  "code": 5342,
  "date": "2026-11-22",
  "notes": [
    "**One show no longer takes over a channel's timetable.** With Real time EPG on, slots are filled by programme length, so a show whose episodes are all one length can own a whole kind of slot: Santa Barbara's files run about 40 minutes, so every half-hour slot on Dallas, Dynasty & Co was Santa Barbara (71% of the week). When one show is more than a third of the programmes that fit a kind of slot, the nearest-length programmes of the channel's other shows are added until it is about a quarter. On a test channel built like that one, Santa Barbara drops from 63% to 30% of the week. Channels with an even mix are unchanged."
  ],
  "history": [
    {
      "name": "Alpha 0.53.41",
      "date": "2026-11-22",
      "notes": [
        "**The Neighbours numbering now applies to saved lists too.** 0.53.40 only worked when a channel's list was built fresh, but at a normal start the list is read back from storage with the old names (\"Neighbours 1215\"), so nothing changed on the guide. The lookup now also runs on a list read from storage, before the schedule is laid out."
      ]
    },
    {
      "name": "Alpha 0.53.40",
      "date": "2026-11-22",
      "notes": [
        "**Neighbours files named by episode number now get their season and episode.** About 1,500 Neighbours files (\"Neighbours Episode 2965\", \"Neighbours 1000\") had no season or episode in the name, so they were filed as Specials and Magic EPG could fill the same episode in again. A small table made from the episode guide (`absnum.js`, written by `tools/make_absnum.py`) turns the number into the season and episode, with nothing to download and no new scrape. 1,799 of the 1,871 Neighbours files are covered; the rest are named by date, which the scraper already handles."
      ]
    },
    {
      "name": "Alpha 0.53.39",
      "date": "2026-11-22",
      "notes": [
        "**No programme is in a guide channel twice.** The same episode or film could arrive from two places (a file and a filled-in gap, or two sources) and then came round twice in the loop. A guide channel now keeps one copy of each, and a file we have always beats a filled-in one. On Demand is not touched and still lists every episode.",
        "**EPG debug is accurate.** A programme only counts as a repeat when it is on more than twice in the day, judged by the programme itself (not its link, which empty filled-in episodes all shared), and different films no longer count as \"in a row\". Each channel also shows its pool in hours and whether it is long enough for each programme to come round at most twice a day.",
        "Only Magic EPG adds programmes that have no file of ours (the missing episodes and films); every other setting plays library files only. Checked in the code, no change needed."
      ]
    },
    {
      "name": "Alpha 0.53.38",
      "date": "2026-11-22",
      "notes": [
        "**The loading TV, its green channel number, the tuner needle and the room backdrop now change together.** Before, the needle swept on its own timer, the green \"P\" number was a random one, and the picture and backdrop each changed on their own. Now the TV surfs the dial: every couple of seconds the needle moves to the next channel's place on the scale, the green number shows that channel, and after a burst of static the picture and the backdrop change to the same new picture. With no picture loaded yet it shows static with the number, not a blank or bars.",
        "**No more colour bars stuck on the loading TV.** A flash of colour bars fired each time a channel finished loading, and with many channels finishing close together it looked like the TV was stuck on bars. The flash is gone.",
        "**Santa is smaller.** The plough is three quarters of the size it was in 0.53.37, so it sits mostly in the strip under the guide."
      ]
    },
    {
      "name": "Alpha 0.53.37",
      "date": "2026-11-22",
      "notes": [
        "**Lighter snow for the TV.** The Shield was measured dropping frames with the snow on (23 to 34 fps, with about 24 animations and eight full-screen layers). The flakes now use one sheet per depth instead of two, and the sway and the drift build-up are shared, so there are about 13 animations and half the layers to blend each frame.",
        "**Santa is bigger.** The plough was drawn tiny (34 by 26 pixels) because the strip under the guide is short. It is now drawn at full size and drives over the bottom edge of the guide, above the last row, then is taken away when the snow stops.",
        "**More snow, and the build-up shows.** About 50% more flakes, and each cycle starts with lower drifts, so the growth is easier to see."
      ]
    },
    {
      "name": "Alpha 0.53.36",
      "date": "2026-11-22",
      "notes": [
        "**The snow now falls over the episode picture in the guide.** It used to be cut away from the whole top-right block, so it vanished wherever the picture was. It is now cut away only round the words themselves (each line as wide as its own text), so flakes drift over the picture and stay clear of the title, channel and time. The grid is still kept clear, with the drifts in the strip below it.",
        "**Santa's plough clears the snow smoothly.** The cut that removes the drifts behind the plough was an animated clip-path, which the TV redraws every frame and which fell out of step with the plough, so the clearing jumped. It is now moved the same way the plough is, so the blade and the cut stay together.",
        "The debug log adds a line for the plough's crossing: frames per second and the slowest frame while it drives."
      ]
    },
    {
      "name": "Alpha 0.53.35",
      "date": "2026-11-22",
      "notes": [
        "The debug log adds a line at the end of a start: how many saved things of each kind were read, how big they were, and how long reading and parsing them took, to show which saved data holds up a cold start."
      ]
    },
    {
      "name": "Alpha 0.53.34",
      "date": "2026-11-22",
      "notes": [
        "**The guide opens sooner: episode names are checked after it is up, not while the channels load.** On the Shield that check read about 2,000 shows' saved episode lists (over 10 s of a 26 s start) before the guide could open. It now waits until the guide is showing, then goes through the channels one at a time in the background, pausing whenever a button is pressed. Names appear a little later on a start; nothing else changes."
      ]
    }
  ]
};
