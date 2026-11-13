// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.44",
  "version": "0.45.44",
  "code": 4544,
  "date": "2026-11-13",
  "notes": [
    "**On Demand: the highlighted row is always the top one.** Moving down to the second row used to leave its posters half off the bottom of the screen, so the highlight was cut off. Now the row you move onto slides up to the top and the next one peeks below it."
  ],
  "history": [
    {
      "name": "Alpha 0.45.43",
      "date": "2026-11-13",
      "notes": [
        "**Clear logos in On Demand.** When the scraper's `art.json` gives a show a logo (`\"l\"`: the address of a transparent title picture), On Demand shows it instead of the plain title, on the home banner and on the show page. Until the picture has loaded, and for shows without one, the text title stays. Nothing changes until the scraper publishes logos."
      ]
    },
    {
      "name": "Alpha 0.45.42",
      "date": "2026-11-13",
      "notes": [
        "**On Demand posters fill the row.** They are a little wider (and taller), so the seventh poster ends at the right edge instead of leaving a gap. The highlighted one still grows without touching its neighbours."
      ]
    },
    {
      "name": "Alpha 0.45.41",
      "date": "2026-11-13",
      "notes": [
        "**On Demand redesign.**"
      ]
    },
    {
      "name": "Alpha 0.45.40",
      "date": "2026-11-13",
      "notes": [
        "**ThunderCats** episodes from the 2011 remake (a Portuguese-dubbed upload) are left out, and so is anything whose file or item name says it is dubbed or foreign-language (Portuguese, Spanish, Hindi, Korean, German \"Staffel\", French \"saison\"). That also removes the Korean drama \"Taxi Driver\" that was turning up on Christmas TV."
      ]
    },
    {
      "name": "Alpha 0.45.39",
      "date": "2026-11-13",
      "notes": [
        "**Christmas adverts.** The scraper's catalogue now flags 121 Christmas adverts (about 72 minutes: 5 from the 70s, 32 from the 80s, 84 from the 90s). The four Christmas channels (Christmas TV, Noel, Kids Christmas, Christmas Music) play those in their breaks, topped up with their usual kind when an era has few. Every other channel, and the Adverts channel, leaves them out until December, when they join every break."
      ]
    },
    {
      "name": "Alpha 0.45.38",
      "date": "2026-11-12",
      "notes": [
        "**Donkey Kong Country** episodes that were really the \"Super Beard Bros.\" game-play videos are left out (the cartoon stays). Other YouTube game-play series (Game Grumps, Achievement Hunter, Yogscast, \"Let's Play\") are turned away from every channel the same way."
      ]
    },
    {
      "name": "Alpha 0.45.37",
      "date": "2026-11-12",
      "notes": [
        "**On Demand: left and right change season** while you are in the episode list (they already did on the season strip). The episode pictures are 50% bigger, so three episodes show at a time instead of four."
      ]
    },
    {
      "name": "Alpha 0.45.36",
      "date": "2026-11-12",
      "notes": [
        "**No colour-button bar at the bottom of the guide, on every theme.** The grid now shows seven channels instead of six. The coloured remote buttons still work (red Now, green Later, yellow Earlier, blue Watch)."
      ]
    }
  ]
};
