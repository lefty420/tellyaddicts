// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.11",
  "version": "0.54.11",
  "code": 5411,
  "date": "2026-11-24",
  "notes": [
    "**No key-hint line along the bottom of On Demand** (\"Next show, OK Play, Hold OK More info…\"). It is gone, so the foot of the screen is clear for the snow drifts too."
  ],
  "history": [
    {
      "name": "Alpha 0.54.10",
      "date": "2026-11-24",
      "notes": [
        "**Snow builds up at the foot of On Demand again, and Santa's plough has something to clear.** The dark strip behind the hint line (added in 0.54.6) was covering the drifts and the plough. While the snow is on, the strip is gone and the posters just fade out above the hint line."
      ]
    },
    {
      "name": "Alpha 0.54.9",
      "date": "2026-11-24",
      "notes": [
        "**The snow on On Demand shows again.** In 0.54.7 and 0.54.8 its picture layer was put inside the TV guide, which is hidden while On Demand is on screen, so nothing appeared. It is back inside On Demand.",
        "**Options > Seasonal effects now reads On or Off** (it said Auto or Off). On shows the snow, drifts and Santa's plough on both the TV guide and On Demand, from 1 November to 6 January."
      ]
    },
    {
      "name": "Alpha 0.54.8",
      "date": "2026-11-24",
      "notes": [
        "**One seasonal setting for the TV guide and On Demand.** When Options > Seasonal effects is on (Auto), the snow, drifts and Santa's plough show on both. The separate Experimental option \"On Demand seasonal themes\" is gone, so On Demand no longer needs Experimental switched on."
      ]
    },
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
    }
  ]
};
