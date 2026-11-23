// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.68",
  "version": "0.53.68",
  "code": 5368,
  "date": "2026-11-23",
  "notes": [
    "**More on the On Demand home screen.** Four new rows: **A bit of everything** (60 shows and films picked from across the library, shuffled once a day), **Throwback telly** (70s, 80s and 90s TV, cartoons and sitcoms mixed), **Sci-fi and fantasy** and **Thrillers and horror** (each mixing TV and films). Drama stays first so the first genre row still appears quickly. The TV, Films and Kids chips show the rows that fit them."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.63",
      "date": "2026-11-23",
      "notes": [
        "**Starting in On Demand opens after two channels, not eight.** In 0.53.62 the loading screen was gone after 7.6 s (it was about 16 s), but eight channels were still waited for. On Demand now opens as soon as two are ready, and the rest of the channels join the rows as they finish."
      ]
    },
    {
      "name": "Alpha 0.53.62",
      "date": "2026-11-23",
      "notes": [
        "**Starting in On Demand no longer waits for the TV guide's channels.** With Start up in set to On Demand, the loading screen held until the channel that was on last and the top ten guide rows were ready (about 15 s). It now opens On Demand as soon as eight channels are ready, and the rest join the rows as they finish: On now, the genre rows and Continue watching redraw a moment after each lands (never while a button is pressed). Starting in the EPG is unchanged."
      ]
    },
    {
      "name": "Alpha 0.53.61",
      "date": "2026-11-23",
      "notes": [
        "**On Demand fills the rows below while you look at the top.** The genre rows were only loaded as you scrolled onto them. With On Demand open the app now loads them in the background, one row at a time, and only when no button has been pressed for a moment, so scrolling down finds each row ready.",
        "**Episode-name checks slow right down while On Demand is open.** They were running between button presses and caused the 400 ms freezes seen at the start; they now take a long breath between shows while On Demand is on screen."
      ]
    },
    {
      "name": "Alpha 0.53.60",
      "date": "2026-11-23",
      "notes": [
        "**The log times the parts of an On Demand draw that take over 150 ms.** The long freezes in On Demand were all tagged \"draw On Demand\". Any draw over 150 ms now logs `DRAW slow … ms: rows …, background …, text and logo …, lookups …`, so the slow part can be found and fixed. Nothing else changes."
      ]
    }
  ]
};
