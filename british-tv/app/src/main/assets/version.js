// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.38",
  "version": "0.38",
  "code": 3800,
  "date": "2026-11-11",
  "notes": [
    "**Channel lists, episode guides and artwork answers are now saved as files,** not in the page's small storage. The page's storage holds about 5 million characters, which 28 channels filled; files have no such limit and load faster. Your settings and any artwork you picked stay where they were. The first start after updating rebuilds the lists once (the old copies are cleared), so expect it to be a little slower that once."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.34.1",
      "date": "2026-11-11",
      "notes": [
        "**Smart aspect ratio taken out of the options for now.** It wasn't working properly. Anyone who had it selected goes back to Auto."
      ]
    },
    {
      "name": "Alpha 0.34",
      "date": "2026-11-11",
      "notes": [
        "**New channel: US Sitcoms (28).** Friends, Frasier, Everybody Loves Raymond, Seinfeld, Cheers, Roseanne, The Fresh Prince and the rest of the American sitcoms up to 1999. It stays out of the guide until the scraper has found some of them on archive.org."
      ]
    },
    {
      "name": "Alpha 0.33",
      "date": "2026-11-11",
      "notes": [
        "**New channel: Entertainment (27).** A mix of the best of everything from any network: light entertainment (Generation Game, Little and Large, Benny Hill), panel and Friday-night shows (Whose Line, TFI Friday, The Word), sketch and satire (Spitting Image, Harry Enfield, Not the Nine O'Clock News), sitcoms (Father Ted, Men Behaving Badly, Ab Fab) and cult drama (Robin of Sherwood, Tales of the Unexpected, Blake's 7). Its shows stay on their own channels too."
      ]
    }
  ]
};
