// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.39",
  "version": "0.39",
  "code": 3900,
  "date": "2026-11-12",
  "notes": [
    "**New start-up screen.** The logo sits on top with a retro TV in the middle that tunes in your channels: static, show pictures flicking up as it hunts, colour bars when a channel locks in, and the name of each channel under the set."
  ],
  "history": [
    {
      "name": "Alpha 0.38.2",
      "date": "2026-11-12",
      "notes": [
        "**Options menu: less work on every key press.** Only the rows that changed are redrawn, and the size of saved artwork is added up only if you stop on that row, not as you scroll past it."
      ]
    },
    {
      "name": "Alpha 0.38.1",
      "date": "2026-11-12",
      "notes": [
        "**The options menu is quick again.** Each key press was adding up the size of everything saved (to show it next to Clear saved artwork), which meant reading hundreds of saved files every time. The total is now worked out once, a moment after the options open, and after a clear."
      ]
    },
    {
      "name": "Alpha 0.38",
      "date": "2026-11-11",
      "notes": [
        "**Channel lists, episode guides and artwork answers are now saved as files,** not in the page's small storage. The page's storage holds about 5 million characters, which 28 channels filled; files have no such limit and load faster. Your settings and any artwork you picked stay where they were. The first start after updating rebuilds the lists once (the old copies are cleared), so expect it to be a little slower that once."
      ]
    },
    {
      "name": "Alpha 0.37",
      "date": "2026-11-11",
      "notes": [
        "**The app's memory no longer fills up.** With 28 channels the saved channel lists were using nearly all the space a TV app is allowed, so the newest channels could fail to save and be rebuilt from scratch on every start. Each saved list is now capped at 800 programmes (still weeks of viewing), and when a list will not fit the oldest artwork and episode-guide copies are cleared to make room, since those are fetched again when needed.",
        "**US Sitcoms is live.** M*A*S*H, Roseanne, The Golden Girls, Home Improvement, Murphy Brown, Everybody Loves Raymond and about a dozen more, from the scraper's new list."
      ]
    },
    {
      "name": "Alpha 0.36.1",
      "date": "2026-11-11",
      "notes": [
        "**Bigger On Demand posters that fill the width.** Nine posters now span the whole row, about 40% larger than before, and both rows still fit with nothing cut off. The title block is more compact to make room."
      ]
    },
    {
      "name": "Alpha 0.36",
      "date": "2026-11-11",
      "notes": [
        "**The guide goes round.** Pressing Up on the first channel now takes you to the last one, and Down on the last goes back to the first. The On Demand button is still reached with Left from what is on now."
      ]
    },
    {
      "name": "Alpha 0.35.1",
      "date": "2026-11-11",
      "notes": [
        "**Episode pictures load faster.** The scraper's episode guides (now published for 431 shows) point at TVmaze's full-size stills, which a TV is slow to decode. The app asks for the medium size, which is plenty for the thumbnail next to each episode."
      ]
    },
    {
      "name": "Alpha 0.35",
      "date": "2026-11-11",
      "notes": [
        "**VHS and VHS 2 look after themselves on heavy files.** If the TV is dropping more than a fifth of the frames, which is what makes the picture drift out of sync with the sound, only the slight blur is taken off. The scan lines, colour and tint stay. The next programme starts with the full look again, and the debug log notes which file caused it (\"VIDEO EFFECT lightened\"). Files that play fine look exactly as before."
      ]
    }
  ]
};
