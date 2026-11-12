// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.17",
  "version": "0.45.17",
  "code": 4517,
  "date": "2026-11-12",
  "notes": [
    "**No more three of the same show in a row.** The running order now mixes shows so the same one does not come round again straight away, and on the timetable channels (Saturday Night TV and the others) a programme that has already been on today is passed over for another. This fixes Noel's House Party playing three times in a row.",
    "**EPG debug (Options > EPG debug).** Shows how each channel's guide was built and what it will show for the next 24 hours, and flags problems such as the same show three times in a row, repeats within the day, or one show taking over. Left and right change channel."
  ],
  "history": [
    {
      "name": "Alpha 0.45.16",
      "date": "2026-11-12",
      "notes": [
        "**The guide length now starts at 24 hours**, so a fresh install starts up quickly. Choose a longer one in Options > Guide length."
      ]
    },
    {
      "name": "Alpha 0.45.15",
      "date": "2026-11-12",
      "notes": [
        "**Guide length option (Options > Guide length): 24 hours, 48 hours, 1 week or 1 month.** It sets how much airtime each channel's guide covers before it repeats. For the everyday channels the app picks a varied mix of programmes (one from each show in turn, so no show takes over) from what the channel's rules already allow. Soaps, Saturday Night TV, The Video Shop, TV Archive and Drama, which follow a clock timetable, now lay out each day (or week) afresh instead of repeating the same 24 hours, for as many days as you choose. The default is 24 hours. On Demand is not affected and still lists everything."
      ]
    },
    {
      "name": "Alpha 0.45.14",
      "date": "2026-11-12",
      "notes": [
        "**Ordinary channels only take episodes tracked by season and episode.** The library's dated or numbered videos (Top of the Pops, soap episodes, news, cartoon shorts and the like) no longer fill the drama, comedy, kids, decade and other everyday channels. They stay on the channels built for them (Soaps, Music, MTV, TV Archive, Disney, I'm Off School) and on the Christmas channels. Films and songs are unaffected."
      ]
    },
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
    }
  ]
};
