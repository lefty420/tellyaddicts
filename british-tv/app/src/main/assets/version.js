// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.56",
  "version": "0.53.56",
  "code": 5356,
  "date": "2026-11-23",
  "notes": [
    "**Settings are saved even when the page's storage is full.** The page's storage on this TV is full, so saving a setting failed before its file copy was written and the setting went back at the next start (Start up in was the one noticed). Settings are now written to the file first, and a full page storage no longer stops them."
  ],
  "history": [
    {
      "name": "Alpha 0.53.55",
      "date": "2026-11-23",
      "notes": [
        "**Settings changed just before closing the app are kept.** Settings were written to the app's file at once but to the page's storage a few seconds later, and the app read the page's copy first. A setting changed and then closed quickly (such as Experimental's Start up in) came back to its old value on the next start. The app now reads the file's copy first, which is always the newer one."
      ]
    },
    {
      "name": "Alpha 0.53.54",
      "date": "2026-11-23",
      "notes": [
        "**Start-up log shows which screen it opened.** With Start up in set to On Demand, the app still opened in the TV guide on one start. The debug log now says at start whether the setting was On Demand or EPG, whether Experimental is on, and how many On Demand channels were ready, and logs each time the setting is changed with what was saved, so the cause shows up in the log."
      ]
    },
    {
      "name": "Alpha 0.53.53",
      "date": "2026-11-23",
      "notes": [
        "**Experimental: start up in On Demand.** Options > Experimental has a new row, **Start up in**: EPG (the TV guide, as before) or On Demand. With On Demand chosen the app opens on On Demand's home screen instead of the guide. Back from On Demand goes to the guide as usual. It needs Experimental on, and takes effect from the next start."
      ]
    },
    {
      "name": "Alpha 0.53.52",
      "date": "2026-11-23",
      "notes": [
        "**YouTube streams try up to five servers before giving up.** A YouTube video was given to one public server, and when that server's stream never started the player gave up after about 25 seconds, so the library's YouTube items kept failing. Each server whose stream has not started within 12 seconds (or refuses it outright) is now skipped and the next one is tried, up to five servers in all; the number of tries is set by one constant in the player, so it can be raised if five is not enough. Each try is written to the debug log as `YOUTUBE stream:` or as a note naming the server that did not start, so it shows which servers are failing. The on-screen give-up timers for YouTube items are longer so all five tries can finish."
      ]
    },
    {
      "name": "Alpha 0.53.51",
      "date": "2026-11-23",
      "notes": [
        "**On Demand's side menu lets go of the focus.** Choosing Browse or Favourites from the icon strip left the strip highlighted as if it still had the focus while the new page was on screen. It now hands the focus to the page when an item is chosen (Back from Favourites still returns to the strip)."
      ]
    },
    {
      "name": "Alpha 0.53.50",
      "date": "2026-11-23",
      "notes": [
        "**On Demand opened from a movie (or show) in the guide now goes to it.** From the guide, the On Demand button (and Menu) opened On Demand at the top, wherever the cursor was. It now goes straight to the programme under the cursor, the same as when On Demand is opened from what is playing: a film lands on its poster and details, a series on its show page. Adverts do not count, and the hold-OK menu's own Episodes and artwork entries are unchanged.",
        "**On Demand is less laggy while it loads.** The live view showed On Demand's buttons taking up to 2.8 seconds to answer: after a new library, every channel's list has to be rebuilt, and On Demand did that for all of them one after another (up to 2.9 seconds each) while you were pressing buttons. Channels that need building are now only built while no button has been pressed for two and a half seconds, with a pause after each. The channels you move to are still built when you get there."
      ]
    },
    {
      "name": "Alpha 0.53.49",
      "date": "2026-11-22",
      "notes": [
        "**The Disney cartoons share one poster and backdrop.** Donald Duck, Goofy, Pluto, Mickey Mouse, Minnie Mouse, Daisy Duck, Humphrey the Bear, Scrooge McDuck, Silly Symphonies, Disney Classic, Disney Short and Walt Disney Cartoon had no series of their own on TheTVDB (\"no match for Donald Duck\" and so on in the log), so they had no picture. They are all part of TheTVDB's \"Disney Animated Shorts\" series, so for pictures only they now borrow its poster and backdrop. Their names stay as they are, and episode names, numbers and summaries are not taken from it (its numbering is not theirs). The next picture scan asks for these again."
      ]
    },
    {
      "name": "Alpha 0.53.48",
      "date": "2026-11-22",
      "notes": [
        "**The snow no longer stutters for the first minute or two after a start.** The guide's log showed stalls of up to three seconds while the app checked episode names in the background (1,986 shows, about 15 seconds of reading). The check paused only 4 ms between shows, so it kept the TV busy about two thirds of the time. It now pauses four times as long as the last show took to read (at least 40 ms), so the picture and the snow keep drawing; the whole check takes a little longer but is done in the background.",
        "**The snow speed check is not fooled by start-up work.** It measured during those stalls (25 fps, a 3-second frame) and locked the snow to its lightest tier, and remembered that. A measurement with a stall of a second or more, or while episode names are still being checked, is now thrown away and repeated 30 seconds later, with a log line saying so. Because an earlier spoilt measurement may have been saved, the saved tier is reset once so every TV starts at full snow again."
      ]
    }
  ]
};
