// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.34",
  "version": "0.45.34",
  "code": 4534,
  "date": "2026-11-12",
  "notes": [
    "**Guide themes tidied.** Channel names fit in the guide (they were cut off), programme names no longer run into the line below, the arrow on a programme that carries on past the edge no longer sits on top of its title, and the 90s and Teletext colour-button row no longer touches the bottom channel. The same spacing fix applies to Classic Blue."
  ],
  "history": [
    {
      "name": "Alpha 0.45.33",
      "date": "2026-11-12",
      "notes": [
        "**The Adverts channel is rebuilt and moved to the end.** It no longer searches archive.org for random compilations. It is now a run of commercial breaks, each filled from the checked advert catalogue (UK adverts only, nothing after 1999) and following the Adverts option in the OSD: All, 70s, 80s or 90s. With the option on Off the channel still plays, from every era. Drink and gambling adverts only come on after 9pm. It is now channel 30, so the channels that were after it (ITV and up) are each one number lower."
      ]
    },
    {
      "name": "Alpha 0.45.32",
      "date": "2026-11-12",
      "notes": [
        "**Guide themes.** Options > TV Guide > Guide theme: Classic Blue, Teletext, Radio Times (print), 1970s, 1980s and 1990s, with a live preview of each as you flick through. \"Match the channel\" (the default) gives the 70s, 80s and 90s channels a guide from their own decade and keeps Classic Blue everywhere else. The fancy fonts load from the internet; offline a theme falls back to a plain system font."
      ]
    },
    {
      "name": "Alpha 0.45.31",
      "date": "2026-11-12",
      "notes": [
        "**Mr. Bean is the sitcom again.** The 134 episodes of the 2002 cartoon (Mr. Bean: The Animated Series) that the library filed under Mr. Bean are left out; the live-action episodes and specials stay."
      ]
    },
    {
      "name": "Alpha 0.45.30",
      "date": "2026-11-12",
      "notes": [
        "**Episodes filed under the wrong show are dropped.** When the file clearly belongs to a different show and only the episode's title matches (Mobile Suit Gundam Wing's \"Eternal Flame of the Shooting Stars\" listed as Shooting Stars; Community's \"Advanced Dungeons & Dragons\"; Sooty & Co's \"Surprise Surprise\" and \"Blind Date\"), it no longer appears on any channel or On Demand. Checked against the whole library: 18 episodes, all wrong."
      ]
    },
    {
      "name": "Alpha 0.45.29",
      "date": "2026-11-12",
      "notes": [
        "**Video game playthroughs are kept off the channels.** The Kids Movies channel was showing a Lego Star Wars PS3 playthrough as the 1977 film, and the Disney channel had a run of NES/SNES/Mega Drive \"Longplay\" videos. Anything titled as a longplay, playthrough, walkthrough, gameplay or with a console tag like [PS3] now stays off every channel except Video Games (and On Demand)."
      ]
    },
    {
      "name": "Alpha 0.45.28",
      "date": "2026-11-12",
      "notes": [
        "Fixes the build again: the backup player's libraries need the app compiled against Android 35 (it still runs on the same TVs as before). Nothing else changed."
      ]
    },
    {
      "name": "Alpha 0.45.27",
      "date": "2026-11-12",
      "notes": [
        "Fixes the build of 0.45.26: the backup player's libraries need AndroidX switched on in the project settings. Nothing else changed."
      ]
    },
    {
      "name": "Alpha 0.45.26",
      "date": "2026-11-12",
      "notes": [
        "**Backup video player.** Files the web view's player can't handle (AC3/E-AC3/DTS/TrueHD sound, some MKVs) are now handed to the app's own player (Media3 ExoPlayer with FFmpeg audio decoders), which picks up from the same spot. New **Options > Playback > Video player**: **Auto** (default: the normal player first, the backup only for a file with no sound or that won't load, and that file is remembered), **Standard only**, or **Always backup**. The VHS and Smart ratio looks don't apply to the backup player, and while the guide is open its mini-TV shows black. Needs this version of the app (a first build that adds libraries, so it's a bigger download). The FFmpeg decoders are GPL-3.0; see the README."
      ]
    }
  ]
};
