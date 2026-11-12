// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.31",
  "version": "0.45.31",
  "code": 4531,
  "date": "2026-11-12",
  "notes": [
    "**Mr. Bean is the sitcom again.** The 134 episodes of the 2002 cartoon (Mr. Bean: The Animated Series) that the library filed under Mr. Bean are left out; the live-action episodes and specials stay."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.45.25",
      "date": "2026-11-12",
      "notes": [
        "**Adverts now come from the scraper's checked catalogue** (1,680 adverts, 1975-1999, each with a verified year, brand, category and length) instead of searching archive.org while the app runs. Kids channels get toys, sweets and food; daytime gets household, food and shops; games and music channels get their own; prime time takes everything. Drink, tobacco and gambling adverts only run on prime-time channels after 9pm. The old searching is kept only as a fallback if the catalogue cannot be loaded."
      ]
    },
    {
      "name": "Alpha 0.45.24",
      "date": "2026-11-12",
      "notes": [
        "**Advert breaks reworked.** Breaks are now listed inside the programme's time in the guide (three minutes after a prime-time programme, a minute and a half on kids channels), so the guide stays right to the minute. A break is a time budget filled with adverts, not a fixed count. There are no breaks on the film channels (Video Shop, Kids Movies, Disney), after films, or after anything shorter than 15 minutes.",
        "**Adverts follow the programme.** A break aims for the year of what just played (the episode's air date, or the middle of a decade channel's decade), then the same decade. Adverts are not repeated within a couple of dozen breaks. Drink, tobacco and gambling adverts stay out of kids and daytime breaks and before 9pm.",
        "**Nothing after 1999, and no guessing.** Adverts with no year are no longer played unless the archive's own date puts them in 1970-1999 or they are hand-picked. Turning adverts on or off rebuilds the guide.",
        "Spec for a checked advert catalogue from the scraper: `tools/adverts-contract.md`."
      ]
    },
    {
      "name": "Alpha 0.45.23",
      "date": "2026-11-12",
      "notes": [
        "**Less background work.** The loading-screen static kept redrawing nine times a second for as long as the app was open, and the start-up check kept waking four times a second; both now stop once the first channel is playing."
      ]
    }
  ]
};
