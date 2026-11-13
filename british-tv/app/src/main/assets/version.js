// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.69",
  "version": "0.45.69",
  "code": 4569,
  "date": "2026-11-13",
  "notes": [
    "**Quieter tuning hiss.** The static heard while a channel tunes in is now well under half as loud.",
    "**Start-up TV shows backgrounds, not posters.** Its pictures are now the shows' wide backgrounds; a poster is only used for a show that has no background, or until the first backgrounds have loaded."
  ],
  "history": [
    {
      "name": "Alpha 0.45.68",
      "date": "2026-11-13",
      "notes": [
        "**The start-up TV keeps tuning until the guide is ready.** It used to freeze on static while the app was busy building the guides, because the picture changes and the knobs were driven by the same thread that was doing the building. Now everything that moves (the static, twelve pictures taking turns, the turning knobs, the channel number and the occasional flash of colour bars) is a pure animation that carries on whatever the app is doing. Each time a picture comes round again it is a different show or film."
      ]
    },
    {
      "name": "Alpha 0.45.67",
      "date": "2026-11-13",
      "notes": [
        "**YouTube Poop remixes are gone from Disney.** Three uploads called \"Donald Duck Comedy vs ...\" (fan-made \"ytp\" remixes with crude filenames) had been filed under Donald Duck on the Disney channel and its guide, and in On Demand. Anything with \"ytp\", \"YouTube Poop\" or \"Donald Duck Comedy vs\" in its name is now blocked everywhere, and those three items are hidden by name."
      ]
    },
    {
      "name": "Alpha 0.45.66",
      "date": "2026-11-13",
      "notes": [
        "**No more block sticking out of the guide.** A programme that starts just before the right edge of the guide (a few minutes of a two-hour film, say) was drawn wider than its real length because of its padding, so it poked out past the grid as a yellow or blue stub. Slivers like this now have no padding and stay inside the grid."
      ]
    },
    {
      "name": "Alpha 0.45.65",
      "date": "2026-11-13",
      "notes": [
        "**\"Auto EPG (experimental)\" is gone from Options > TV Guide.** The switch was already unused since Auto EPG became the only guide, but its empty row was still left on the page; it has been removed."
      ]
    },
    {
      "name": "Alpha 0.45.64",
      "date": "2026-11-13",
      "notes": [
        "**A Santa hat on the guide clock.** A little 16-bit Santa hat sits centred on the clock in the TV guide while Seasonal effects is on and Christmas is on (1 November to 6 January), on every guide theme. It goes with the snow: Seasonal effects set to Off removes both."
      ]
    },
    {
      "name": "Alpha 0.45.63",
      "date": "2026-11-13",
      "notes": [
        "**The snow falls again.** In the last two versions it drifted upwards from the bottom; it now falls from the top of the screen as intended."
      ]
    },
    {
      "name": "Alpha 0.45.62",
      "date": "2026-11-13",
      "notes": [
        "**Snow falls at more varied speeds.** Each of the three depth layers is now two sheets of flakes falling at slightly different speeds (and swaying at different paces), so the snow no longer looks like it moves as one block. The number of flakes is unchanged."
      ]
    },
    {
      "name": "Alpha 0.45.61",
      "date": "2026-11-13",
      "notes": [
        "**Smoother snow.** The snow used to be redrawn 15 times a second and flakes could only move in whole steps, which looked jerky. Each layer of flakes is now painted once and slid down by the graphics chip at the screen's own refresh rate, with a gentle sway on top, so it moves smoothly and costs the TV almost no work. Still pixel-art, and it still holds still while you scroll the guide."
      ]
    }
  ]
};
