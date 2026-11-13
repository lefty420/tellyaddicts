// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.47",
  "version": "0.45.47",
  "code": 4547,
  "date": "2026-11-13",
  "notes": [
    "**Smoother browsing on the On Demand home screen.** Moving along a row or between channels no longer rebuilds the posters from scratch each time: every poster is built once and reused, so the TV doesn't have to decode the pictures again on every press. The list of rows is also worked out once per key press instead of several times."
  ],
  "history": [
    {
      "name": "Alpha 0.45.46",
      "date": "2026-11-13",
      "notes": [
        "**On Demand loads only as long as it has to.** Opening it now builds just the channel you are on (or the show that is playing) and nothing else, so the loading screen goes away as soon as that one is ready. The other channels are built in the background afterwards, nearest first, instead of competing with it. If the lists were already built in the background after start-up, there is no loading screen at all."
      ]
    },
    {
      "name": "Alpha 0.45.45",
      "date": "2026-11-13",
      "notes": [
        "**No more half-empty On Demand while it loads.** If the lists are not ready when you open On Demand, you now get a plain loading screen (spinner, \"Getting your shows ready...\") that goes away the moment the first row is ready, instead of a page of \"Loading...\" text. Opening straight onto the show that is playing waits behind it too, so you never see the home screen flash first. A row further down that is still loading shows blank poster blocks, not text. The background build of the lists now starts four seconds after start-up instead of twenty, so it is usually ready before you open it."
      ]
    },
    {
      "name": "Alpha 0.45.44",
      "date": "2026-11-13",
      "notes": [
        "**On Demand: the highlighted row is always the top one.** Moving down to the second row used to leave its posters half off the bottom of the screen, so the highlight was cut off. Now the row you move onto slides up to the top and the next one peeks below it."
      ]
    },
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
    }
  ]
};
