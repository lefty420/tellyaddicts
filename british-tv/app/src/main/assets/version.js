// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.3",
  "version": "0.54.3",
  "code": 5403,
  "date": "2026-11-24",
  "notes": [
    "**Poster rows fill the row exactly.** The seven posters are sized to the row's width (12.1 wide) so none is cut off at the edge, and the sliding step matches."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.99",
      "date": "2026-11-24",
      "notes": [
        "**Guide now sits next to Home on the top menu.** The bar reads Home, Guide, Shows, Films, Kids, Channels, Favourites, with Search and Options on the right. Left and Right follow that order. The phone layout is unchanged."
      ]
    },
    {
      "name": "Alpha 0.53.98",
      "date": "2026-11-24",
      "notes": [
        "**Bigger posters: six to a row on the TV.** The On Demand home rows now show six large posters (they were ten small ones), with a little more space between them. The title area and the first row have moved up a touch to make room. Live now cards, the grid, Favourites and the phone layout are unchanged."
      ]
    },
    {
      "name": "Alpha 0.53.97",
      "date": "2026-11-24",
      "notes": [
        "**Rows with fewer than ten posters (Films 7, Sci-fi 8) fixed.** A film or show that sits in two of the rows on screen at once (a film in both Films and Sci-fi, say) had one poster tile shared between them, so the second row took it from the first and left a gap at the end. Every row now has its own tile for each poster."
      ]
    },
    {
      "name": "Alpha 0.53.96",
      "date": "2026-11-24",
      "notes": [
        "**A poster left highlighted for 5 seconds grows by 30%.** In the On Demand rows, the highlighted poster zooms in after five seconds without a button press and goes back as soon as you press anything. The Live now cards grow a little less because they are already wide."
      ]
    },
    {
      "name": "Alpha 0.53.95",
      "date": "2026-11-24",
      "notes": [
        "**The last poster in a row is no longer cut off.** Ten posters (and five Live now cards) were slightly wider than the space the row has, so the one at the right edge was cropped, on the Kids and Films rows and the rest. The posters are a little narrower so every row fits."
      ]
    }
  ]
};
