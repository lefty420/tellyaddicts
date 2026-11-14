// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.91",
  "version": "0.45.91",
  "code": 4591,
  "date": "2026-11-14",
  "notes": [
    "**Fixed: anything playing in the app's own player was skipped after about five seconds.** The check for \"sound but no picture\" counted frames, which the app's own player cannot report, so it always decided there was no picture and moved on to the next programme. It now takes a known picture size as a picture. This hit YouTube videos, and any file that had been handed to the backup player."
  ],
  "history": [
    {
      "name": "Alpha 0.45.90",
      "date": "2026-11-14",
      "notes": [
        "**Real time EPG (Options > TV Guide).** When on, every channel is laid out like a real week of television: short programmes in the morning and at lunchtime, half hours through the early evening, hour-long programmes and longer in prime time, films and long programmes on weekend afternoons and evenings, and Saturday and Sunday different from the weekdays. Children's channels get a school-day pattern (early morning, after school, a longer programme at teatime). Programmes start on a round five minutes, and a series plays in order, episode after episode, from one day to the next. Channels that already have a plan of their own (News, Saturday Night, Soaps, Drama, Video Shop) keep it. Turning it on or off rebuilds the guides. It shapes the week by how long each programme runs; showing each programme at its real slot needs a slot list from the scraper."
      ]
    },
    {
      "name": "Alpha 0.45.89",
      "date": "2026-11-14",
      "notes": [
        "**Start-up pictures no longer repeat.** When the pictures flicking by on the tuning screen had all been shown once (more likely on a slow start, when new ones arrive slowly) it started over and could pick the one it had just shown, or one of the last few. It now skips the last six shown, and never picks the very last one again."
      ]
    },
    {
      "name": "Alpha 0.45.88",
      "date": "2026-11-13",
      "notes": [
        "**YouTube through public Piped and Invidious servers.** The app no longer asks YouTube's own player directly. It asks several community-run Piped and Invidious servers at once and plays the first good stream (no adverts, no sign-in); the last server that worked is asked first next time. If none answer, the debug log lists why. These servers come and go, so expect some days when it is patchy. YouTube videos are on again (Options > Play > YouTube videos turns them off).",
        "The debug log now says which server and quality each YouTube video came from."
      ]
    },
    {
      "name": "Alpha 0.45.87",
      "date": "2026-11-13",
      "notes": [
        "**YouTube is off by default for now.** On a first try, YouTube refused every lookup with a \"sign in to confirm you're not a bot\" check, so none of its videos played. They stay out of On Demand until that is sorted; Options > Play > YouTube videos turns them back on.",
        "**One failed YouTube video no longer skips down the list.** A refusal that hits every video is reported once, and only a video YouTube calls gone or private is left out."
      ]
    },
    {
      "name": "Alpha 0.45.86",
      "date": "2026-11-13",
      "notes": [
        "**YouTube as a second source (trial).** Episodes the scraper found on YouTube (Telly Addicts, Big Break, Gladiators, Blind Date and more) now show in On Demand, from `data/yt.json`. They play through the app's own player with no adverts and no sign-in; the stream is looked up when you press play. Episodes with no season or number sit under \"More from YouTube\". Needs the TV app, not a browser.",
        "**Best copy first.** Where an episode exists more than once, the app now ranks the copies: archive.org first, then YouTube; a copy of the right running time beats one that is far off, and a copy that keeps adverts or is an .mkv ranks lower. The rest stay behind it: if the first will not play, the next is tried by itself, and \"Try another version\" now offers the YouTube copies too.",
        "**Options > Play > YouTube videos** turns the source off. A video that fails to play is left out for a day.",
        "If a YouTube video will not play, the debug log says why (YouTube changes this from time to time)."
      ]
    },
    {
      "name": "Alpha 0.45.85",
      "date": "2026-11-13",
      "notes": [
        "**No more empty Dragon Ball Z.** It had no videos but was still listed under Children's, so it showed as an empty show. Removed."
      ]
    },
    {
      "name": "Alpha 0.45.84",
      "date": "2026-11-13",
      "notes": [
        "**Hide a show you don't want.** Both hold-OK menus now have \"Hide this show\" (or film). It goes from On Demand straight away and from the guide after Refresh listings. Options > TV Guide > Hidden shows brings them all back (OK twice).",
        "**Report a problem** in the guide menu writes the programme, show and file to the debug log, so a wrong video can be traced.",
        "**Menu tidy.** \"Scrape this show\" is now \"Fix artwork & details\", the Options shortcut is gone from the guide menu, and the On Demand menu gains Info."
      ]
    },
    {
      "name": "Alpha 0.45.83",
      "date": "2026-11-13",
      "notes": [
        "**The hold-OK menus match Options.** The menu on a programme in the guide and the one on a show in On Demand now use the same navy panel, yellow highlight and two-line rows as Options, with a short line under each choice saying what it does."
      ]
    }
  ]
};
