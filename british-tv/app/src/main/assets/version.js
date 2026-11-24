// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.77",
  "version": "0.53.77",
  "code": 5377,
  "date": "2026-11-24",
  "notes": [
    "**On Demand moves lighter.** Moving along a row now swaps only the card that left and the card that came in instead of rebuilding the row, and moving Up or Down keeps the row that stays on screen and builds only the new one. The press costs a few cards, not sixteen.",
    "**Episode names wait for a quiet moment.** The background name check starts a show only after 2.5 seconds with no button pressed, and saves its result only after 1.5 seconds of quiet, so it no longer lands between two presses.",
    "The ad-break channel is left out of On Demand, so its (empty) list is no longer built."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.73",
      "date": "2026-11-23",
      "notes": [
        "**On Demand has a new look (\"Continuity\").** Colour and type only; nothing moves and no key does anything different. Titles are in a condensed, heavy face (Archivo, now bundled in `fonts/`, so it works offline). The network shows as a white channel bug in front of the years on the home hero and the show page. The hero pager is five test-card colour bars, and the tab you are on (All, TV, Films, Kids, the seasons, the Browse sort chips) sits on the seven colour bars; the one with focus is amber. Play is amber, the other buttons are outlined glass. On now cards show their progress in live red. Browse keeps the amber ring on the channel you are on, with its count beside it. The hold-OK menu, the guide, Options and the OSD are unchanged. Design: the \"On Demand redesign (Continuity)\" canvas in the UI design project.",
        "**The home hero's text is two lines, not three,** so the bars never touch the \"On now\" heading."
      ]
    },
    {
      "name": "Alpha 0.53.72",
      "date": "2026-11-23",
      "notes": [
        "**Order of play is now fixed: addon, then archive, then YouTube.** With Magic EPG on, the addon is asked first, then the archive copy, then YouTube. With it off, the archive copy then YouTube. An archive copy that was the wrong length or an .mkv could previously score below a long, well-titled YouTube copy; now any archive copy is always tried before YouTube, which stays as the fall-back if the archive file will not play."
      ]
    },
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
    }
  ]
};
