// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.8",
  "version": "0.54.8",
  "code": 5408,
  "date": "2026-11-24",
  "notes": [
    "**One seasonal setting for the TV guide and On Demand.** When Options > Seasonal effects is on (Auto), the snow, drifts and Santa's plough show on both. The separate Experimental option \"On Demand seasonal themes\" is gone, so On Demand no longer needs Experimental switched on."
  ],
  "history": [
    {
      "name": "Alpha 0.54.7",
      "date": "2026-11-24",
      "notes": [
        "**The On Demand snow is back.** Options > Experimental > On Demand seasonal themes works again, as in 0.54.5. The other 0.54.6 changes stay: the hint line on its own band, the title picture sized like the title, and the bigger \"Next ...\" line on the On now cards."
      ]
    },
    {
      "name": "Alpha 0.54.6",
      "date": "2026-11-24",
      "notes": [
        "**No snow on On Demand.** (Put back in 0.54.7.)",
        "**The hint line at the foot of On Demand sits on its own dark band.** The bottom row of posters fades out into it, so \"Browse, Rows, OK Open, Hold OK More, Back Top\" no longer runs over the picture of a poster.",
        "**A show's title picture is the size of its title.** On the home screen a small logo picture used to show as a tiny speck where the title should be. It is now scaled to the title's height, both on the big hero and when the hero shrinks as you move down to a row.",
        "**The \"Next 18:17 ...\" line on the On now cards is bigger** and clear of the progress bar."
      ]
    },
    {
      "name": "Alpha 0.54.5",
      "date": "2026-11-24",
      "notes": [
        "**A highlighted poster is no longer cut off at the bottom.** Each row now keeps room under its posters for the highlight outline and the slight enlargement."
      ]
    },
    {
      "name": "Alpha 0.54.4",
      "date": "2026-11-24",
      "notes": [
        "**The On Demand loading screen tunes in properly.** The green bar now moves along with the time and fills when everything is ready (before, it jumped because On Demand opens after two channels). The screen stays up for at least five seconds, and a new picture tunes in about every 0.9 s (was 1.7 s), each after a burst of static."
      ]
    },
    {
      "name": "Alpha 0.54.3",
      "date": "2026-11-24",
      "notes": [
        "**Poster rows fill the row exactly.** The seven posters are sized to the row's width (12.1 wide) so none is cut off at the edge, and the sliding step matches."
      ]
    },
    {
      "name": "Alpha 0.54.2",
      "date": "2026-11-24",
      "notes": [
        "**New Experimental option: On Demand seasonal themes.** Options > Experimental > On Demand seasonal themes (Auto or Off) draws the guide's Christmas snow, drifts and Santa's plough over On Demand, from 1 November to 6 January. It is off while a video plays behind the home page."
      ]
    },
    {
      "name": "Alpha 0.54.1",
      "date": "2026-11-24",
      "notes": [
        "**The TV loading screen is the splash when the app starts in On Demand.** It stays up while the channels load, then On Demand opens. The saved On Demand picture is no longer shown first."
      ]
    },
    {
      "name": "Alpha 0.54.0",
      "date": "2026-11-24",
      "notes": [
        "**Seven posters per row, a little smaller, and the 5 second zoom is off.** Poster rows on the TV show 7 across (was 6). The highlighted poster no longer grows after a pause."
      ]
    }
  ]
};
