// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.44",
  "version": "0.46.44",
  "code": 4644,
  "date": "2026-11-14",
  "notes": [
    "**Scan a QR code to add an addon from your phone**: on the Add from your phone screen the TV now shows a QR code. Point your phone's camera at it and it opens the add page, with the code already filled in, so all you do is paste the addon link and press Send to TV. The address and code are still shown in words as a back-up. The code is made by the app itself (nothing downloaded) and changes with the TV's address."
  ],
  "history": [
    {
      "name": "Alpha 0.46.43",
      "date": "2026-11-14",
      "notes": [
        "**Add an addon from your phone** (experimental): Options > Experimental > Addons > Add from your phone. The TV shows an address and a 4-digit code. Open the address in a browser on a phone or computer on the same Wi-Fi, type the code, paste the addon link and press Send to TV. The TV then checks the addon and shows what it is before it is installed. The page only runs while that screen is open, and five wrong codes lock it. (Needs this new app version: it is the first time the app has been able to receive anything from a phone.)",
        "**Add-an-addon screen now fits**: the keyboard's Add button had the whole instruction written on it and overflowed; it now just says Add. The keyboard has a row for the characters a web address needs (. : / ? = & % @ + ~), and long addon names and addresses are trimmed to fit the header."
      ]
    },
    {
      "name": "Alpha 0.46.42",
      "date": "2026-11-14",
      "notes": [
        "**Addon auto-play: quicker and steadier** (experimental): it no longer waits for the slowest addon. As soon as a 1080p source arrives (or one from the release group that played the last episode), it plays. Otherwise it waits for all addons, up to 8 seconds, and plays the best. The source that worked for an episode is remembered for an hour, so coming back goes straight to it, and if it has stopped working the addons are asked again. When an episode ends, auto-play looks for the next episode, preferring the same release group (same quality and language) as the one before."
      ]
    },
    {
      "name": "Alpha 0.46.41",
      "date": "2026-11-14",
      "notes": [
        "**Experimental: Auto-play best source**: Options > Experimental > Auto-play best source (off by default). With it on, Find sources plays the best working source straight away (1080p, then 720p, skipping torrents and other things that cannot play here). If that source fails, the next best is tried, and so on; when none work it tells you and goes back to On Demand. Picking a source by hand also falls back to the ones below it."
      ]
    },
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
    }
  ]
};
