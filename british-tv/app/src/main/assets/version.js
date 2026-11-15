// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.47.7",
  "version": "0.47.7",
  "code": 4707,
  "date": "2026-11-15",
  "notes": [
    "Magic EPG: the addons are now asked with the IMDb number the scraper found for each show (data/epdb.json has 704 of them), instead of searching TVmaze by name first. Shows the file has no number for still use the old lookup."
  ],
  "history": [
    {
      "name": "Alpha 0.47.6",
      "date": "2026-11-15",
      "notes": [
        "Magic EPG: when none of your addons has an episode, the app now looks for it on archive.org (the same lookup Play Next uses, for that exact episode) and plays it if the link works, before skipping to the next programme. An episode with no addon source and no archive.org link is still skipped and remembered.",
        "Debug log lines for Magic EPG now start \"MAGIC EPG:\"."
      ]
    },
    {
      "name": "Alpha 0.47.5",
      "date": "2026-11-15",
      "notes": [
        "Content: British now writes to the debug log which shows it hid and how many programmes, so a wrongly hidden show is easy to spot."
      ]
    },
    {
      "name": "Alpha 0.47.4",
      "date": "2026-11-15",
      "notes": [
        "Options > Experimental: new \"Content\" (Everything by default, or British). British hides the shows the scraper has flagged as never shown on UK TV (mostly US drama) from the guides, On Demand and Magic EPG; UK-made shows, US shows that aired here, and any show it is unsure about stay. It reads data/uk.json (flags with u:0 are the ones hidden), which the scraper has still to publish: until then nothing is hidden. Turning it on or off restarts the guides."
      ]
    },
    {
      "name": "Alpha 0.47.3",
      "date": "2026-11-15",
      "notes": [
        "Magic EPG reads the scraper's own episode file (data/epdb.json, v2): several files when it is split (epdb-1.json ...), a new copy only when the revision in index.json changes, and each episode's running time when it has one. Until the scraper publishes it, the packed copy from tools/build_epdb.py is used (the tool no longer overwrites a v2 file).",
        "The episode database and the TV's own episode lists are kept in files, not the page's small storage."
      ]
    },
    {
      "name": "Alpha 0.47.2",
      "date": "2026-11-15",
      "notes": [
        "Magic EPG now means the addons for everything: with it on, every episode and film in the guides is looked up with your addons first (the library link is only the fallback), and the diamond mark and \"From your addons\" line are gone.",
        "Magic On Demand: with Magic EPG on, On Demand lists every episode the scrapers know for each show (from data/epdb.json), not only the ones with a file, and plays them through your addons. An episode no addon has is skipped when you play it.",
        "Turning Magic EPG on or off restarts the guides, as before. Needs Experimental on and an addon."
      ]
    },
    {
      "name": "Alpha 0.47.1",
      "date": "2026-11-15",
      "notes": [
        "Options > Experimental: new \"Join in progress\" (off by default). For programmes played from your addons (Magic EPG episodes, and everything when Use addons as a main source is on), the picture starts where the guide says the programme has got to, instead of from the beginning. The debug log says \"joining ... at Ns\" when it does."
      ]
    },
    {
      "name": "Alpha 0.47.0",
      "date": "2026-11-15",
      "notes": [
        "Magic EPG (Options > Experimental, off by default): fills the channel guides with every episode of each show, not only the ones the library has a file for. Missing episodes are marked with a diamond, and play through your addons when the clock reaches them. If no addon has one, it says so and moves on to the next programme (and remembers, so it is left out next time).",
        "It reads one new file, `data/epdb.json`, packed from the scraper's per-show episode files by `python3 tools/build_epdb.py` (no internet needed). Shows with no entry fall back to the TV's own lookups from Options > Artwork > Episode lists from, done slowly in the background and used the next time the app starts.",
        "Needs Experimental on and an addon. Turning it on or off restarts the guides."
      ]
    },
    {
      "name": "Alpha 0.46.99",
      "date": "2026-11-15",
      "notes": [
        "API keys from your phone: OK on \"TheTVDB key\" or \"TMDB key\" now shows a QR code. The phone page has a \"Get your key\" button that opens the sign-up page (thetvdb.com or themoviedb.org), then you paste the key and press Send. \"Type it with the remote instead\" is the second row.",
        "Needs the new APK (the phone page is part of the app)."
      ]
    }
  ]
};
