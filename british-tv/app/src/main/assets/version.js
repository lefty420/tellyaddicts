// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.62",
  "version": "0.53.62",
  "code": 5362,
  "date": "2026-11-23",
  "notes": [
    "**Starting in On Demand no longer waits for the TV guide's channels.** With Start up in set to On Demand, the loading screen held until the channel that was on last and the top ten guide rows were ready (about 15 s). It now opens On Demand as soon as eight channels are ready, and the rest join the rows as they finish: On now, the genre rows and Continue watching redraw a moment after each lands (never while a button is pressed). Starting in the EPG is unchanged."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.53.59",
      "date": "2026-11-23",
      "notes": [
        "**The log now names what caused each long freeze.** On Demand still froze for up to 4 s at times. Every stall over 250 ms is now logged as `STALL … ms on <screen>, jobs just before: …` with the jobs that had just started (reading a saved list, grouping a channel, drawing On Demand, episode-name checks, artwork look-ups, opening a show), so the next fix can aim at the real cause. Nothing else changes."
      ]
    },
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
    }
  ]
};
