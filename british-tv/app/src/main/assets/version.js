// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.41",
  "version": "0.46.41",
  "code": 4641,
  "date": "2026-11-14",
  "notes": [
    "**Experimental: Auto-play best source**: Options > Experimental > Auto-play best source (off by default). With it on, Find sources plays the best working source straight away (1080p, then 720p, skipping torrents and other things that cannot play here). If that source fails, the next best is tried, and so on; when none work it tells you and goes back to On Demand. Picking a source by hand also falls back to the ones below it."
  ],
  "history": [
    {
      "name": "Alpha 0.46.40",
      "date": "2026-11-14",
      "notes": [
        "**Experimental: Stremio addons (first version)**: Options > Experimental. Turn it on, then Addons > Add an addon and type the link of a Stremio addon (it ends in manifest.json; stremio:// links work too). The app ships with no addons and recommends none. Addons can be turned on or off, moved up or down, tested and removed. On Demand's hold-OK menu gets **Find sources**: your addons are asked, with only the title's IMDb number, for streams, listed best first (1080p, then 720p). OK plays a direct web link or YouTube video. Torrents, usenet, archives and website links are shown greyed and never start. Only https addresses (http on your own network), adult-flagged addons are refused, and \"Only before 2000\" keeps it to what this app is about. Films need an addon with a film search to find their number. Not yet: addon catalogs in On Demand, auto-play, subtitles, special-header streams."
      ]
    },
    {
      "name": "Alpha 0.46.39",
      "date": "2026-11-14",
      "notes": [
        "**The guide comes back where you left it**: press Back to go to the picture, then open the guide again, and it opens on the same channel, rows and time you had selected instead of jumping back to what is playing and scrolling the list. If you started something else, or it was more than ten minutes ago, it opens on what is playing as before."
      ]
    },
    {
      "name": "Alpha 0.46.38",
      "date": "2026-11-14",
      "notes": [
        "**PLAYING marker made small**: the red tag on the programme you are watching took up most of a narrow guide cell and hid its title. It is now just a small red ▶ badge; the red outline and the channel marker stay."
      ]
    },
    {
      "name": "Alpha 0.46.37",
      "date": "2026-11-14",
      "notes": [
        "**Start-up TV moves again, and shows the real tuning**: the last change drove the needle, knobs and picture from the page itself, which is frozen while the guides are being built, so on the TV nothing moved. The needle, knobs, static and pictures are back on their own animations (they keep going while the app is busy), and the real progress is added on top: a green bar fills along the scale and the label counts the channels that have finished (TUNING 7 / 16), with a flash of colour bars as each locks on."
      ]
    },
    {
      "name": "Alpha 0.46.36",
      "date": "2026-11-14",
      "notes": [
        "**What's playing is marked in the guide**: the programme you are watching now carries a red PLAYING tag (like NOW in the channel schedule), and its channel has a red marker, so it stands out from everything else that is on right now."
      ]
    },
    {
      "name": "Alpha 0.46.35",
      "date": "2026-11-14",
      "notes": [
        "**American Thomas blocked**: the \"Model Series (US Restored)\" upload (and the other US Thomas uploads: George Carlin, Ringo Starr US, US VHS, US CGI) were playing as the real Thomas and Friends. All ten are now hidden; the UK ones stay."
      ]
    },
    {
      "name": "Alpha 0.46.34",
      "date": "2026-11-14",
      "notes": [
        "**Start-up TV follows the real tuning**: the needle on the little TV's scale now moves along as channels really finish loading, the knobs click round one step for each, the pictures are labelled with the numbers of channels that have actually loaded, and the colour bars flash as each one locks on (and stay when every channel is in). Before, it all just looped on a timer."
      ]
    },
    {
      "name": "Alpha 0.46.33",
      "date": "2026-11-14",
      "notes": [
        "**No blue bar over the loading screen**: the channel/programme bar that flashes up when something starts no longer sits on top of the \"please stand by\" loading screen; the loading screen covers it."
      ]
    }
  ]
};
