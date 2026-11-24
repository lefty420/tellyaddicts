// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.99",
  "version": "0.53.99",
  "code": 5399,
  "date": "2026-11-24",
  "notes": [
    "**Guide now sits next to Home on the top menu.** The bar reads Home, Guide, Shows, Films, Kids, Channels, Favourites, with Search and Options on the right. Left and Right follow that order. The phone layout is unchanged."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.94",
      "date": "2026-11-24",
      "notes": [
        "**The log now says what is saved of your show picks.** Each start writes a SAVED PICKS line (how many \"Choose the right show\" and artwork choices are in storage, and which). It is there to find out why a pick, such as Mighty Morphin Power Rangers renamed to Power Rangers, would not survive a restart."
      ]
    },
    {
      "name": "Alpha 0.53.93",
      "date": "2026-11-24",
      "notes": [
        "**A debrid \"Something went wrong\" clip now moves on to the next link.** When a link has gone bad, the service plays a short video saying so instead of giving an error, so the app thought it had worked. An addon source under 45 seconds long is now treated as failed and the next link in the addon's list is tried, then the library."
      ]
    },
    {
      "name": "Alpha 0.53.92",
      "date": "2026-11-24",
      "notes": [
        "**Menus wrap round.** Up from the first line goes to the last and Down from the last goes to the first in the hold-OK menus, the picture's pop-up lists (audio, subtitles and so on) and the channel list on the OSD. In that channel list, Left or Right now takes you back to the bar."
      ]
    },
    {
      "name": "Alpha 0.53.91",
      "date": "2026-11-24",
      "notes": [
        "**Back while playing no longer restarts the app.** The app had restarted after Back with the picture in the hero. The player's window was being told its size again on every redraw of the page, many times a second; it is now moved only when the size actually changes."
      ]
    }
  ]
};
