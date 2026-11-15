// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.98",
  "version": "0.46.98",
  "code": 4698,
  "date": "2026-11-15",
  "notes": [
    "Options > Artwork: \"Episode lists from\" now sits above the two keys, and its help text fits on one line."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.93",
      "date": "2026-11-15",
      "notes": [
        "**English sound first**: when a file has several sound tracks, the app's own player now picks the English one unless you have chosen another language in Audio & subtitles. Before, it took whichever the file listed first, so a Lethal Weapon with Turkish and English tracks played in Turkish. If a file has no English track it plays as before. A language you choose is still kept for the next programme."
      ]
    },
    {
      "name": "Alpha 0.46.92",
      "date": "2026-11-15",
      "notes": [
        "**Screen dims when left on a still screen**: with the TV Guide, On Demand, the bar, Info, Options, Teletext or a menu open and no key pressed for five minutes, the screen fades to a dim. Any key (or a touch on the phone) brings it back at once. A screen that stays put wears an OLED panel far more than moving video, so this matters most for OLED TVs. Nothing changes while a programme plays with nothing open.",
        "**VHS OLED lines are softer** (lighter, a smaller step between line and gap), so they put less uneven wear on a panel. The VHS look itself is unchanged."
      ]
    },
    {
      "name": "Alpha 0.46.91",
      "date": "2026-11-15",
      "notes": [
        "**VHS OLED made fairer**: which of the two line positions shows now comes from the clock (a new one every ten minutes), not from when the app started. Before, every start began in the same position, so short viewings could leave one set of pixel rows dimmed far more than the other. The lines are also now a whole, even number of device pixels apart, so the swap lands exactly on pixel rows."
      ]
    },
    {
      "name": "Alpha 0.46.90",
      "date": "2026-11-15",
      "notes": [
        "**VHS OLED**: a new picture look, first in the list after Off (Options > Picture). It is the VHS look, but the scanlines swap places with the gaps between them every ten minutes (and when a new video starts, after two minutes), so no row of pixels on an OLED TV is always the dimmed one. The other looks are unchanged."
      ]
    }
  ]
};
