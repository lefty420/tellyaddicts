// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.86",
  "version": "0.53.86",
  "code": 5386,
  "date": "2026-11-24",
  "notes": [
    "**Back while playing no longer rebuilds On Demand.** The log showed the page taking 6 to 25 seconds to draw after Back. On Demand is now only hidden while something plays, so Back just shows it again exactly as you left it (same row, same show) and refreshes Continue watching a few seconds later when you are idle.",
    "**The old blue bar stays away in On Demand.** It no longer pops up when an On Demand video loads; the On Demand bar is the only one."
  ],
  "history": [
    {
      "name": "Alpha 0.53.85",
      "date": "2026-11-24",
      "notes": [
        "**Back while playing: the freeze should be gone.** The log showed no background job in front of it, so the time was spent reading On Demand's saved lists while the player was still decoding. Back now puts up On Demand as it was last drawn at once, pauses the picture, and works out the page a quarter of a second later."
      ]
    },
    {
      "name": "Alpha 0.53.84",
      "date": "2026-11-24",
      "notes": [
        "**Back while playing returns to where you were, and no longer freezes.** The log showed an 11 to 14 second freeze at the moment of Back, with the background episode-name check running behind the picture. Background jobs (episode names, artwork look-up, index building) now wait while a show is playing, and Back pauses the picture before drawing On Demand.",
        "**Back or Stop returns to the place you started from:** the same tab, row and card, or the show page with the same season and episode if you started from there."
      ]
    },
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
    }
  ]
};
