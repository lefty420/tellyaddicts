// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.59",
  "version": "0.53.59",
  "code": 5359,
  "date": "2026-11-23",
  "notes": [
    "**The log now names what caused each long freeze.** On Demand still froze for up to 4 s at times. Every stall over 250 ms is now logged as `STALL … ms on <screen>, jobs just before: …` with the jobs that had just started (reading a saved list, grouping a channel, drawing On Demand, episode-name checks, artwork look-ups, opening a show), so the next fix can aim at the real cause. Nothing else changes."
  ],
  "history": [
    {
      "name": "Alpha 0.53.58",
      "date": "2026-11-23",
      "notes": [
        "**On Demand's Continue watching fills first.** Continue watching waited for its channel's list to be built behind the genre rows, so it appeared late. On Demand now loads the channels your Continue watching shows are on first, redraws as each is ready, and logs `ONDEMAND: Continue watching ready … ms after opening` so the time can be checked."
      ]
    },
    {
      "name": "Alpha 0.53.57",
      "date": "2026-11-23",
      "notes": [
        "**YouTube copies show on every channel that lists the show.** An episode's YouTube copy was only attached to the one channel named in the YouTube list (Telly Addicts only on Game Shows), so Telly Addicts opened from Classic BBC had no copy to play. Any channel listing the show now gets its YouTube copies too. On Demand's saved lists are rebuilt once to pick this up, so the first On Demand after the update is slower.",
        "**Picking an episode in On Demand that has no source no longer plays a different show.** It used to move on to the next programme on the channel (Telly Addicts S06E04 played Dear John). It now says \"No source found\" and returns to On Demand."
      ]
    },
    {
      "name": "Alpha 0.53.56",
      "date": "2026-11-23",
      "notes": [
        "**Settings are saved even when the page's storage is full.** The page's storage on this TV is full, so saving a setting failed before its file copy was written and the setting went back at the next start (Start up in was the one noticed). Settings are now written to the file first, and a full page storage no longer stops them."
      ]
    },
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
    }
  ]
};
