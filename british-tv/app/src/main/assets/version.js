// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.47.2",
  "version": "0.47.2",
  "code": 4702,
  "date": "2026-11-15",
  "notes": [
    "Magic EPG now means the addons for everything: with it on, every episode and film in the guides is looked up with your addons first (the library link is only the fallback), and the diamond mark and \"From your addons\" line are gone.",
    "Magic On Demand: with Magic EPG on, On Demand lists every episode the scrapers know for each show (from data/epdb.json), not only the ones with a file, and plays them through your addons. An episode no addon has is skipped when you play it.",
    "Turning Magic EPG on or off restarts the guides, as before. Needs Experimental on and an addon."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.98",
      "date": "2026-11-15",
      "notes": [
        "Options > Artwork: \"Episode lists from\" now sits above the two keys, and its help text fits on one line."
      ]
    },
    {
      "name": "Alpha 0.46.97",
      "date": "2026-11-15",
      "notes": [
        "Options > Artwork: new \"Episode lists from\" (TVmaze by default, or TheTVDB, or TMDB) and a \"TMDB key\" row beside the TheTVDB key, with an on-screen keyboard and a check when saved. A source with no key, or with no result, falls back to TVmaze.",
        "Groundwork for the Debrid EPG experiment (nothing uses the choice yet)."
      ]
    },
    {
      "name": "Alpha 0.46.96",
      "date": "2026-11-15",
      "notes": [
        "Guide header: the show name is big, with the episode (\"S02E46 · Episode name\") on the line under it; the series year is dropped.",
        "Guide cells and header clean up file-style names: dots/underscores become spaces, codec and release tags (HEVC, x265, 1080p, WEB-DL...) and leading track numbers go.",
        "Very narrow guide cells (under about 170 px) show the first word or a dot, with no arrows or \"…\".",
        "On Demand \"OK Open\" hint is bigger; the guide's episode line is bigger."
      ]
    },
    {
      "name": "Alpha 0.46.95",
      "date": "2026-11-15",
      "notes": [
        "**A paused picture now dims too**: the five-minute dim only counted the guide, On Demand, the bar and the other panels, so a paused frame could sit on an OLED screen for hours. A paused programme now fades to the dim after five minutes with no key pressed, like any other still screen.",
        "**VHS OLED has no fixed edge tint**: the VHS look adds a faint red strip down the left edge and a blue one down the right. In VHS OLED they stayed in the same place for ever, so those pixels wore differently from the rest. The tint is now left out in VHS OLED (the normal VHS look keeps it).",
        "**The key that wakes a dimmed screen only wakes it**: before, pressing OK to bring the guide back also pressed OK on the highlighted programme and tuned to it. The first key is now used up waking the screen."
      ]
    },
    {
      "name": "Alpha 0.46.94",
      "date": "2026-11-15",
      "notes": [
        "**Subtitle diagnostics**: after you choose a subtitle track, the debug log now records the first few subtitle lines the player delivers (\"SUBTITLE cue: 1 text, 0 picture, 38 characters\"), with no words from the film. If a subtitle track is selected but nothing shows, the log now says whether the player sent nothing (an empty or forced-only track) or the screen failed to draw it."
      ]
    }
  ]
};
