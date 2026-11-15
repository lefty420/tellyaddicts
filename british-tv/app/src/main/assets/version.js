// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.95",
  "version": "0.46.95",
  "code": 4695,
  "date": "2026-11-15",
  "notes": [
    "**A paused picture now dims too**: the five-minute dim only counted the guide, On Demand, the bar and the other panels, so a paused frame could sit on an OLED screen for hours. A paused programme now fades to the dim after five minutes with no key pressed, like any other still screen.",
    "**VHS OLED has no fixed edge tint**: the VHS look adds a faint red strip down the left edge and a blue one down the right. In VHS OLED they stayed in the same place for ever, so those pixels wore differently from the rest. The tint is now left out in VHS OLED (the normal VHS look keeps it).",
    "**The key that wakes a dimmed screen only wakes it**: before, pressing OK to bring the guide back also pressed OK on the highlighted programme and tuned to it. The first key is now used up waking the screen."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.89",
      "date": "2026-11-15",
      "notes": [
        "**Films played from an addon keep their own details**: a film started from your addons lost its link to the library's film record (the TMDb plot, cast and poster), so Info and the artwork looked it up as a TV show by name. \"Lethal Weapon\" could pick up the 2016 series, \"Jumanji\" the cartoon. It now keeps the library's film record, also when replayed from Saved sources.",
        "**Film backdrops never come from a TV show**: a film's picture is its own poster, or one you chose by hand. A TV show with the same name (Jumanji, Police Academy, Back to the Future, Dumb and Dumber) is no longer used for its backdrop."
      ]
    },
    {
      "name": "Alpha 0.46.88",
      "date": "2026-11-15",
      "notes": [
        "**Saved film sources cleared once**: the app remembers the source that last worked for each title and plays it again without searching, so the wrong *Blackadder's Christmas Carol* link would have kept playing for Mickey's Christmas Carol for three days even after 0.46.87. Sources saved for films (in the replay memory and in Options > Saved sources) are forgotten one time, and looked up again with the stricter search. Saved sources for series are untouched."
      ]
    },
    {
      "name": "Alpha 0.46.87",
      "date": "2026-11-15",
      "notes": [
        "**Wrong film from an addon**: Mickey's Christmas Carol played *Blackadder's Christmas Carol* with a green ADDON badge. When the film search found no result with the right name, the app took the first result, whatever it was, and remembered it. It now only accepts the same name (or a close name with the same year) and otherwise says it could not find the film, so the library copy plays instead. Films matched wrongly before are forgotten, so they are looked up again."
      ]
    }
  ]
};
