// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.7",
  "version": "0.45.7",
  "code": 4507,
  "date": "2026-11-12",
  "notes": [
    "**\"Please stand by\" no longer runs under the programme banner.** The Telly Addicts logo and the text beneath it sit higher, so \"This channel is loading\" is no longer cut off."
  ],
  "history": [
    {
      "name": "Alpha 0.45.6",
      "date": "2026-11-12",
      "notes": [
        "**The show library now downloads reliably on slow connections.** The big library file (episode names, seasons, codes) was timing out on some TVs, so shows like Agatha Christie's Poirot appeared as raw file names under \"Other videos\". The app now waits longer, tries three times, and keeps a copy on the TV to fall back on."
      ]
    },
    {
      "name": "Alpha 0.45.5",
      "date": "2026-11-12",
      "notes": [
        "**Episodes with dotted file names are sorted into their seasons.** Files named like `Show.S01E01.1080p.BluRay.mkv` were landing under \"Other videos\" because the app could not read the episode code out of the dots. It now uses the library's own episode code when the file name cannot be read."
      ]
    },
    {
      "name": "Alpha 0.45.4",
      "date": "2026-11-12",
      "notes": [
        "**Films in On Demand are listed one by one.** Kids Movies and The Video Shop showed a single card holding every film. Each film is now its own card in the row, like a TV show, and OK on one plays it straight away."
      ]
    },
    {
      "name": "Alpha 0.45.3",
      "date": "2026-11-12",
      "notes": [
        "**On Demand from the guide menu goes straight to the show.** It could land on a different show because the highlighted channel was followed by row number, and the rows shift as each channel's list loads. It is now followed by channel.",
        "**Leaving On Demand puts you back where you were in the guide.** The channel, the time and the programme you held OK on are still selected."
      ]
    },
    {
      "name": "Alpha 0.45.2",
      "date": "2026-11-12",
      "notes": [
        "**On Demand ignores certificates.** Kids Movies and The Video Shop were showing almost nothing because On Demand hid films by certificate and time of day. It now lists every film that is stored, on both channels. The guide's schedule still follows the certificate rules."
      ]
    },
    {
      "name": "Alpha 0.45.1",
      "date": "2026-11-12",
      "notes": [
        "**Decade channels use a show's end year.** An episode with no air date is only placed in a decade if its show also ended in that decade, when the library says when it ended."
      ]
    },
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
    }
  ]
};
