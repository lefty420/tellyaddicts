// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.72",
  "version": "0.53.72",
  "code": 5372,
  "date": "2026-11-23",
  "notes": [
    "**Order of play is now fixed: addon, then archive, then YouTube.** With Magic EPG on, the addon is asked first, then the archive copy, then YouTube. With it off, the archive copy then YouTube. An archive copy that was the wrong length or an .mkv could previously score below a long, well-titled YouTube copy; now any archive copy is always tried before YouTube, which stays as the fall-back if the archive file will not play."
  ],
  "history": [
    {
      "name": "Alpha 0.53.71",
      "date": "2026-11-23",
      "notes": [
        "**The big YouTube scrape shows up in On Demand.** On Demand's saved lists did not know the YouTube list had changed, so the new shows (1366 shows, 29,246 videos, 5.4 MB, up from 19 shows) would only have appeared when a list happened to be built again. Each channel's saved list now carries a stamp of its YouTube shows, the YouTube list is loaded quietly 20 s after start-up, and a channel whose YouTube shows changed is built again in the background. The log says `YOUTUBE: the list changed`. Expect a few slow minutes of background building the first time."
      ]
    },
    {
      "name": "Alpha 0.53.70",
      "date": "2026-11-23",
      "notes": [
        "**Background work stays out of the way of the remote.** The artwork scan and the episode-name checks now wait 5 to 6 s after any button press before their next step, and run slower while something is playing. They were causing freezes of 1 to 4 s seen on the playing screen and when pressing Back out of On Demand."
      ]
    },
    {
      "name": "Alpha 0.53.69",
      "date": "2026-11-23",
      "notes": [
        "**YouTube prefers the sharper stream when there is one.** The servers were all asked at once and the first answer won, which could be a soft 288p file (Telly Addicts S06E04). An answer of 720p or better is still used at once. A softer one now waits up to 3 s for the other servers, and a sharper answer from any of them is used; if none comes, the soft one plays as before, so nothing that plays today stops playing. The server picked this way is the one asked first next time."
      ]
    },
    {
      "name": "Alpha 0.53.68",
      "date": "2026-11-23",
      "notes": [
        "**More on the On Demand home screen.** Four new rows: **A bit of everything** (60 shows and films picked from across the library, shuffled once a day), **Throwback telly** (70s, 80s and 90s TV, cartoons and sitcoms mixed), **Sci-fi and fantasy** and **Thrillers and horror** (each mixing TV and films). Drama stays first so the first genre row still appears quickly. The TV, Films and Kids chips show the rows that fit them."
      ]
    },
    {
      "name": "Alpha 0.53.67",
      "date": "2026-11-23",
      "notes": [
        "**Hold OK works on On now.** Holding OK on a programme in the On now row did nothing. It now opens a menu: Watch live, Add (or Remove) channel from favourites, and Options. Favourite channels come first in On now."
      ]
    },
    {
      "name": "Alpha 0.53.66",
      "date": "2026-11-23",
      "notes": [
        "**A film in On Demand opens its info page, like a show.** OK on a film used to start it playing at once, which also meant holding OK never got to open the menu. It now opens the film's page (poster, year, summary, rating, Play film and Favourite), with no seasons or episode list. Hold OK on a film, on the page or on a card, for the same menu as a show: Play, Add to favourites, Info, and More (search, fix artwork, options, hide)."
      ]
    },
    {
      "name": "Alpha 0.53.65",
      "date": "2026-11-23",
      "notes": [
        "**With Start up in set to On Demand, On Demand is home.** Back while watching something you started from On Demand now returns to On Demand (on that show's page), not the TV guide. Something you started from the guide still goes back to the guide. Back at the top of On Demand no longer drops into the TV guide: it says \"Press Back twice quickly to quit\", and a second quick Back asks to quit, like the guide does when EPG is home. The guide is still one press away on the Guide button or in On Demand's menu. With Start up in set to EPG nothing changes."
      ]
    },
    {
      "name": "Alpha 0.53.64",
      "date": "2026-11-23",
      "notes": [
        "**Starting in On Demand shows the last On Demand screen at once.** The home screen (rows, hero and background) is saved as you use On Demand, about every 20 s while it is open. With Start up in set to On Demand, the app shows that saved screen straight after it starts, in place of the loading screen, while the channels load behind it. Buttons do nothing until the real On Demand takes over (about 8 s); then the rows redraw with the live On now. The first start after an update has no saved screen and shows the loading screen as before. The log says `START: showing the saved On Demand screen`."
      ]
    }
  ]
};
