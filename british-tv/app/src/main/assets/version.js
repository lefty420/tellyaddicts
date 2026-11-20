// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.50.9",
  "version": "0.50.9",
  "code": 5009,
  "date": "2026-11-20",
  "notes": [
    "New in Options > Experimental: **Loading screen**. Pick how the start-up TV looks: Classic (as before, the default), Set in the room (a bigger wooden set with rabbit ears over blurred artwork, a big TUNING on the glass), Whole screen (the picture is the TV, with the dials and tuning scale in a strip along the bottom), or Surprise me (one of the two new looks each start). It needs Experimental on and shows from the next start. Everything is drawn in screen-relative sizes, so it looks the same on 1080p and 4K."
  ],
  "history": [
    {
      "name": "Alpha 0.50.8",
      "date": "2026-11-20",
      "notes": [
        "Faster start: each channel's finished schedule (what plays when) is now kept on the device and read back at the next start, instead of being laid out again for all 60-odd channels. It is used only when the channel's list, the guide span, the Broadcast schedule setting and the app version are all the same; otherwise that channel is laid out again and kept. Live TV mode's daily episodes are still worked out at each start, so they move on as before. \"Build every channel afresh\" clears the kept schedules. The debug log shows how many were read and how many were laid out."
      ]
    },
    {
      "name": "Alpha 0.50.7",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG films: a guide channel now takes at most 800 programmes in all from the film database, like the missing episodes do, so a big film database cannot slow the guide down at start. On Demand still shows every film."
      ]
    },
    {
      "name": "Alpha 0.50.6",
      "date": "2026-11-20",
      "notes": [
        "No more freezes in the minutes after start: On Demand used to get every channel ready in the background, and with Magic EPG each one froze the screen for a second or more while it sorted its shows, again and again for several minutes. Now only the channel you were watching and the channels in Continue watching are got ready. The rest load when you open them in On Demand, and search still covers every channel.",
        "The TV guide's day labels show the short month again (\"Fri 20 Nov\"). A second list of month names had been overwriting them with the long names."
      ]
    },
    {
      "name": "Alpha 0.50.5",
      "date": "2026-11-20",
      "notes": [
        "Faster guide with Magic EPG on: each channel now gets at most 800 missing episodes (the earliest of each show, taken in turn) instead of every gap in every show. 80's and 90's TV were carrying over 20,000 programmes each, and all 66 channels were laid out again at every start, which froze the guide for half a minute after it opened. On Demand still lists every episode."
      ]
    },
    {
      "name": "Alpha 0.50.4",
      "date": "2026-11-20",
      "notes": [
        "Info screen: the episode strip now shows each episode's real still (from the scraper's episode guide, else TVmaze) instead of a green box. Before, it only used an archive.org thumbnail, so most shows (Buffy, for one) showed empty boxes. The stills arrive a moment after the strip, and episodes that are not in the library yet get theirs too."
      ]
    },
    {
      "name": "Alpha 0.50.3",
      "date": "2026-11-20",
      "notes": [
        "Two Options names no longer clash. In Guide, \"Realistic TV schedule\" is now **Broadcast schedule** (it sets when things air). In Experimental, \"Real world\" is now **Live TV mode** (a new episode each day, and a channel plays only what is on now). The Live TV mode help now says all of that."
      ]
    },
    {
      "name": "Alpha 0.50.2",
      "date": "2026-11-20",
      "notes": [
        "The Christmas Movies channel now follows the watershed like the Video Shop: U, PG and 12 films through the day, 15s from eight, and 18s (Die Hard, Lethal Weapon and the like) only after nine at night. Before this it had no rules, so any film could air at any time.",
        "Magic EPG films with no certificate are no longer given PG on the Christmas channel (they are skipped, as on the Video Shop). The Kids Movies default of U stays."
      ]
    },
    {
      "name": "Alpha 0.50.1",
      "date": "2026-11-20",
      "notes": [
        "Magic EPG films: a film with no certificate in the film database is now kept on the Kids Movies channel (as U) and the Christmas movie channels (as PG). The Video Shop and the Magic genre channels still skip it, because it could be an adult film."
      ]
    }
  ]
};
