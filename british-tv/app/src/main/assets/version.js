// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.47",
  "version": "0.53.47",
  "code": 5347,
  "date": "2026-11-22",
  "notes": [
    "**The snow speed check now waits for the guide.** The check that measures the snow's frame rate (and lightens it if it is under 60 or 30 fps) ran once, 15 seconds after the snow started, and gave up silently if the guide was not on screen at that moment. The live log from 0.53.46 shows exactly that: no \"SNOW: tier\" line at all, because the guide was opened after the 15 seconds had passed. It now tries again every five seconds (for up to ten minutes) until the guide is up, and starts again if the guide is closed part-way through the eight seconds.",
    "Nothing else changes in this build."
  ],
  "history": [
    {
      "name": "Alpha 0.53.46",
      "date": "2026-11-22",
      "notes": [
        "**One short file no longer fills every gap on a channel.** 0.53.45 fixed US Drama's slot lists, but The X-Files still took 90 of the week's 228 programmes. The cause: the timetable pads gaps (the overnight run and any slot that ends early) with the channel's short programmes, and US Drama had exactly one, a five-minute X-Files file, so that one file was the padding everywhere. Padding now needs at least eight short programmes from at least three shows; otherwise each show's shortest programme is used, so the gaps are shared across the channel.",
        "Saved schedules are rebuilt once."
      ]
    },
    {
      "name": "Alpha 0.53.45",
      "date": "2026-11-22",
      "notes": [
        "**US Drama (and every Real time EPG channel) uses its whole library, not the same few shows.** The half-hour slots on a channel cover about 100 hours a week, but only a handful of programmes are short enough to be \"half\", so on US Drama those ten or so files (mostly The X-Files and Buffy) looped all week: X-Files filled 47% of the airtime. Each kind of slot now checks it has enough programmes to cover its time, and if it does not, adds the nearest-length programmes of the other shows in turn (the hour-long Murder She Wrote, Waltons, Hill Street, MacGyver, Kojak and the rest). No show can hold more than about one and a half times an even share of a slot's list. On a test channel with 22 shows plus a 200-episode X-Files and a Buffy, Buffy drops from 43 programmes a week to 12.",
        "Saved schedules are rebuilt once to pick this up."
      ]
    },
    {
      "name": "Alpha 0.53.44",
      "date": "2026-11-22",
      "notes": [
        "**The snow looks after its own speed.** Once the guide has been up for 15 seconds the app counts frames for eight seconds. If it is under 87% of what the screen can show (60, or 30 on a screen that only does 30), it moves to a lighter tier and measures again, up to tier 3, and remembers the tier for next time. Tier 1 removes the mask round the words (a mask makes the TV draw all the snow into a spare full-screen picture every frame; the words get a dark halo instead so a flake behind a letter does not hurt reading). Tier 2 uses two depths of flakes, not four. Tier 3 has fewer flakes and no side-to-side sway. The log shows each measurement and each step (\"SNOW: tier 0: 41 fps ...\").",
        "**Smaller snow layers for every tier.** The drifts, their build-up layers and Santa's lane were each a full-screen layer that is empty except for the bottom strip. They are now only as tall as the strip, which is five or six full-screen layers fewer for the TV to blend every frame.",
        "**EPG debug shows what the timetable is given.** Each channel now lists how many programmes were fed in, how many were filled in from the episode lists, how many fall in each length (bite, half, hour, long, film) and the biggest shows. That is what is needed to see why one show takes over a channel such as US Drama."
      ]
    },
    {
      "name": "Alpha 0.53.43",
      "date": "2026-11-22",
      "notes": [
        "**The balance fix no longer adds one show's whole run.** In 0.53.42 the programmes added to a one-show slot came from whichever show was first in the list (The Colbys ran five in a row on Dallas, Dynasty & Co). They are now taken from the other shows in turn.",
        "**EPG debug reports airtime, not just programme counts.** \"Fills 49% of the schedule\" counted programmes, and Santa Barbara's many short files made it look bigger than it is. The \"fills\" warning and the most-common list now go by hours (for example \"Santa Barbara: 118 (49 h)\")."
      ]
    },
    {
      "name": "Alpha 0.53.42",
      "date": "2026-11-22",
      "notes": [
        "**One show no longer takes over a channel's timetable.** With Real time EPG on, slots are filled by programme length, so a show whose episodes are all one length can own a whole kind of slot: Santa Barbara's files run about 40 minutes, so every half-hour slot on Dallas, Dynasty & Co was Santa Barbara (71% of the week). When one show is more than a third of the programmes that fit a kind of slot, the nearest-length programmes of the channel's other shows are added until it is about a quarter. On a test channel built like that one, Santa Barbara drops from 63% to 30% of the week. Channels with an even mix are unchanged."
      ]
    },
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
    }
  ]
};
