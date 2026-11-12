// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.14",
  "version": "0.45.14",
  "code": 4514,
  "date": "2026-11-12",
  "notes": [
    "**Ordinary channels only take episodes tracked by season and episode.** The library's dated or numbered videos (Top of the Pops, soap episodes, news, cartoon shorts and the like) no longer fill the drama, comedy, kids, decade and other everyday channels. They stay on the channels built for them (Soaps, Music, MTV, TV Archive, Disney, I'm Off School) and on the Christmas channels. Films and songs are unaffected."
  ],
  "history": [
    {
      "name": "Alpha 0.45.13",
      "date": "2026-11-12",
      "notes": [
        "**Files that play with no sound are noticed.** Some .mkv files carry audio this TV cannot decode, so the picture plays in silence. The app now checks a few seconds in; on the TV it skips to the next programme and leaves that file out next time, and in On Demand it tells you to use Try another version. The debug log records \"NO SOUND\" with the file."
      ]
    },
    {
      "name": "Alpha 0.45.12",
      "date": "2026-11-12",
      "notes": [
        "**The missing episodes report is now a proper import file.** It starts with `format: \"telly-addicts-missing\"` and a version number, and each show carries TVmaze's id when it is known, so the scraper can load it and go and find what is missing."
      ]
    },
    {
      "name": "Alpha 0.45.11",
      "date": "2026-11-12",
      "notes": [
        "**Every film in The Video Shop and Kids Movies no longer shows the same wrong picture.** When the library could not load, the background artwork search looked up the channel names (\"The Video Shop\", \"Kids Movies\") as if they were TV shows, found an unrelated programme, and gave its picture to every film. Channel names are no longer looked up, and films without their own poster show a plain card with the title."
      ]
    },
    {
      "name": "Alpha 0.45.10",
      "date": "2026-11-12",
      "notes": [
        "**The show library downloads again, which fixes missing film posters, wrong lengths and shows listed as raw file names.** The library file had grown just past the size the app would accept (by under a kilobyte), so every TV rejected it and fell back to old, thin data: no posters or details on films, every video listed as 45 minutes, and shows like Poirot under \"Other videos\". The limit is now far higher.",
        "**On Demand opens while a film is playing.** It used to jump to the film and start it again straight away, so it looked as if On Demand would not open. It now opens on that film's poster."
      ]
    },
    {
      "name": "Alpha 0.45.9",
      "date": "2026-11-12",
      "notes": [
        "**More pictures flick through the start-up TV while it tunes.** The pictures no longer wait for the whole show library to download: the app uses the artwork it already has saved (or asks for the artwork list on its own), so about two dozen show pictures are ready within a second or two."
      ]
    },
    {
      "name": "Alpha 0.45.8",
      "date": "2026-11-12",
      "notes": [
        "**\"Please stand by\" text keeps clear of the TV picture.** The text column now starts further right and a long \"Coming up\" title wraps onto a second line instead of running under the TV."
      ]
    },
    {
      "name": "Alpha 0.45.7",
      "date": "2026-11-12",
      "notes": [
        "**\"Please stand by\" no longer runs under the programme banner.** The Telly Addicts logo and the text beneath it sit higher, so \"This channel is loading\" is no longer cut off."
      ]
    },
    {
      "name": "Alpha 0.45.6",
      "date": "2026-11-12",
      "notes": [
        "**The show library now downloads reliably on slow connections.** The big library file (episode names, seasons, codes) was timing out on some TVs, so shows like Agatha Christie's Poirot appeared as raw file names under \"Other videos\". The app now waits longer, tries three times, and keeps a copy on the TV to fall back on."
      ]
    }
  ]
};
