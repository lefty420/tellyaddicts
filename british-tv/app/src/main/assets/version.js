// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.82",
  "version": "0.53.82",
  "code": 5382,
  "date": "2026-11-24",
  "notes": [
    "**On Demand rows no longer shuffle as channels land.** A genre row used to be built from whichever of its channels had loaded and rebuilt each time another arrived, so posters slid and swapped while it loaded. A row now shows blocks until every channel in it is in, and is then drawn once in its final order.",
    "**More on the home page.** Every channel that no genre row covers gets a row of its own, after the genre rows, so all channels have shows on the home page."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.75",
      "date": "2026-11-23",
      "notes": [
        "**On Demand has a top bar instead of the left rail on the TV.** Home, Shows, Films, Kids, Channels and Favourites on the left; Search, Guide and Options on the right. Up from the hero, the first row, the channel list or the favourites cards reaches it; Down goes back into the page. Left and Right stop at the ends. OK on a tab opens it; the current tab sits on the colour bars. Left at the first card no longer opens anything.",
        "The hero has two sizes: large with the bar or hero in focus, smaller (one-line title, no buttons) when you are in the rows. The phone keeps its rail."
      ]
    },
    {
      "name": "Alpha 0.53.74",
      "date": "2026-11-23",
      "notes": [
        "**The saved On Demand screen keeps the new look's channel bug.** The screen shown at start-up kept only the hero's text, so the white network bug (and the certificate badge) were missing until the real screen took over. It now keeps them."
      ]
    }
  ]
};
