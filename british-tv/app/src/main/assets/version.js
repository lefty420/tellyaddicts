// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.84",
  "version": "0.53.84",
  "code": 5384,
  "date": "2026-11-24",
  "notes": [
    "**Back while playing returns to where you were, and no longer freezes.** The log showed an 11 to 14 second freeze at the moment of Back, with the background episode-name check running behind the picture. Background jobs (episode names, artwork look-up, index building) now wait while a show is playing, and Back pauses the picture before drawing On Demand.",
    "**Back or Stop returns to the place you started from:** the same tab, row and card, or the show page with the same season and episode if you started from there."
  ],
  "history": [
    {
      "name": "Alpha 0.53.83",
      "date": "2026-11-24",
      "notes": [
        "**Back while playing no longer hangs.** With On Demand as home, Back from a show or channel now lands on the On Demand home page at once. It used to look up the playing show and open its page first, which showed a loading screen for several seconds. (The On Demand button on the remote still opens the playing show's page.)"
      ]
    },
    {
      "name": "Alpha 0.53.82",
      "date": "2026-11-24",
      "notes": [
        "**On Demand rows no longer shuffle as channels land.** A genre row used to be built from whichever of its channels had loaded and rebuilt each time another arrived, so posters slid and swapped while it loaded. A row now shows blocks until every channel in it is in, and is then drawn once in its final order.",
        "**More on the home page.** Every channel that no genre row covers gets a row of its own, after the genre rows, so all channels have shows on the home page."
      ]
    },
    {
      "name": "Alpha 0.53.81",
      "date": "2026-11-24",
      "notes": [
        "**Stopping a show with On Demand as home goes to On Demand,** not the TV guide. Back while watching also goes to On Demand, so Back from the guide is never the first of two quick presses that asks to quit.",
        "**The big hero on the On Demand home no longer runs into the first row** (On now). It now sits just above the row and grows upward."
      ]
    },
    {
      "name": "Alpha 0.53.80",
      "date": "2026-11-24",
      "notes": [
        "**No loading screen at launch when On Demand is home.** The channels still load in the background, but the screen with the animated TV and static is not shown, and its pictures are not fetched. If you open the TV guide before every channel is in, that loading screen appears over the guide until they are."
      ]
    },
    {
      "name": "Alpha 0.53.79",
      "date": "2026-11-24",
      "notes": [
        "**Back from the TV guide returns to On Demand home** when On Demand is the start-up setting, instead of dropping to the picture or asking to quit.",
        "**The guide's episode look-ups wait until the guide is opened** when On Demand is home. They used to start 30 seconds after launch whatever was on screen."
      ]
    },
    {
      "name": "Alpha 0.53.78",
      "date": "2026-11-24",
      "notes": [
        "**The artwork look-up no longer freezes On Demand.** Working out which shows still need artwork took a 3.6 second freeze on the Shield. It now waits until On Demand is closed and no button has been pressed for 6 seconds, and does the work a few dozen names at a time."
      ]
    },
    {
      "name": "Alpha 0.53.77",
      "date": "2026-11-24",
      "notes": [
        "**On Demand moves lighter.** Moving along a row now swaps only the card that left and the card that came in instead of rebuilding the row, and moving Up or Down keeps the row that stays on screen and builds only the new one. The press costs a few cards, not sixteen.",
        "**Episode names wait for a quiet moment.** The background name check starts a show only after 2.5 seconds with no button pressed, and saves its result only after 1.5 seconds of quiet, so it no longer lands between two presses.",
        "The ad-break channel is left out of On Demand, so its (empty) list is no longer built."
      ]
    },
    {
      "name": "Alpha 0.53.76",
      "date": "2026-11-23",
      "notes": [
        "**The film page has a row of other films.** A film in a series (when the scraper supplies `col`) shows the series, oldest first, with \"This film\" marked; any other film shows \"More like this\", scored on shared cast, genres and year. OK opens that film's page, and Back returns to the previous film with the same card focused (up to 5 deep); hold OK opens the film menu. The poster is bigger, with a certificate chip, runtime as `1h 39m` and a \"Starring\" line. With no row the cast is listed under the poster, and with no cast the poster and text are centred."
      ]
    }
  ]
};
