// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.90",
  "version": "0.53.90",
  "code": 5390,
  "date": "2026-11-24",
  "notes": [
    "**Continue watching appears all at once.** It used to add a poster or two each time another channel's list finished loading (6, then 8, then 12). It now waits until every channel it needs is ready and is drawn once, complete."
  ],
  "history": [
    {
      "name": "Alpha 0.53.89",
      "date": "2026-11-24",
      "notes": [
        "**The video now plays in the hero.** After Back, the picture fills the hero's backdrop (right side, behind the title and the rows, fading into the page) instead of a small box over the rows. Back again takes it full screen."
      ]
    },
    {
      "name": "Alpha 0.53.88",
      "date": "2026-11-24",
      "notes": [
        "**YouTube copies are part of the show now, not a separate list.** The season and episode are read from the video's title when the scraper left them out (\"S2 Ep1\", \"Series 3 Episode 4\"), so those videos land in their season and sit behind the archive.org copy of the same episode. A YouTube upload with no numbers but a year goes into that year instead of \"More from YouTube\". Because of this, On Demand's saved lists are built again once.",
        "**Playing an episode now tries YouTube last.** The order for an episode with no file of its own is the addon, then archive.org, then the YouTube copy of that same season and episode."
      ]
    },
    {
      "name": "Alpha 0.53.87",
      "date": "2026-11-24",
      "notes": [
        "**The video keeps playing when you press Back.** Back from a playing video now shrinks it into a small window at the top right of On Demand, with the sound still on, so you can carry on browsing. Press Back again and it goes full screen. Stop still stops it."
      ]
    },
    {
      "name": "Alpha 0.53.86",
      "date": "2026-11-24",
      "notes": [
        "**Back while playing no longer rebuilds On Demand.** The log showed the page taking 6 to 25 seconds to draw after Back. On Demand is now only hidden while something plays, so Back just shows it again exactly as you left it (same row, same show) and refreshes Continue watching a few seconds later when you are idle.",
        "**The old blue bar stays away in On Demand.** It no longer pops up when an On Demand video loads; the On Demand bar is the only one."
      ]
    },
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
    }
  ]
};
