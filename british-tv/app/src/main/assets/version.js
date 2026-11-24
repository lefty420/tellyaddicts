// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.54.21",
  "version": "0.54.21",
  "code": 5421,
  "date": "2026-11-24",
  "notes": [
    "**More pictures on the loading screen.** Early on only a couple of backdrops had finished loading, and the screen flicked between those. Until ten backdrops are in, the posters now join the pool, so there is more to tune through. The debug log gets a \"SPLASH:\" line at 3 s and 8 s after launch saying how many pictures had loaded, so if it is still only two we can see whether the pictures or the loading is the problem. JavaScript only."
  ],
  "history": [
    {
      "name": "Alpha 0.54.20",
      "date": "2026-11-24",
      "notes": [
        "**Back now walks up instead of flipping between the small video and full screen.** Video, Back: the episodes with the video still playing small. Back: On Demand home. Back at the top: the quit prompt. To take the small video full screen, go up to it (the picture at the top) and press OK. JavaScript only (no new Java needed beyond 0.54.19)."
      ]
    },
    {
      "name": "Alpha 0.54.19",
      "date": "2026-11-24",
      "notes": [
        "**The YouTube log line is shorter and says what NewPipe did first.** In 0.54.18 the line was cut off before NewPipe's result. Now: NewPipe's answer, then the servers that worked, then how many others failed. Logging only; needs a new build (Java)."
      ]
    },
    {
      "name": "Alpha 0.54.18",
      "date": "2026-11-24",
      "notes": [
        "**The debug log now says how each YouTube route did.** The \"YOUTUBE stream\" line lists NewPipe and every server that had answered (picture quality and milliseconds, or why it failed), and says when NewPipe had not answered yet. It also logs a \"CONTINUE:\" line when a show is saved in Continue watching but cannot be shown (which channel, and what it was missing). Logging only; needs a new build (Java)."
      ]
    },
    {
      "name": "Alpha 0.54.17",
      "date": "2026-11-24",
      "notes": [
        "**NewPipe now sends YouTube's consent cookie.** The first test of 0.54.15 reached YouTube but failed with \"Could not get ytInitialData\", which is what the consent page looks like to the extractor in the UK. Needs a new build (Java). Also includes the 0.54.16 change below."
      ]
    },
    {
      "name": "Alpha 0.54.16",
      "date": "2026-11-24",
      "notes": [
        "**An episode with no source now stays on its show page.** Pressing an episode that no addon, archive.org or YouTube copy could play showed \"No source found\" and then dropped you back to the top of On Demand. It now returns to the same show with the same episode highlighted. (S06E04 of Telly Addicts has no copy anywhere yet; that is a library gap for the scraper.)"
      ]
    },
    {
      "name": "Alpha 0.54.15",
      "date": "2026-11-24",
      "notes": [
        "**YouTube is now asked directly, from the device, with the NewPipe extractor.** It is tried first; the public Piped and Invidious servers stay as the fall-back. This is a Java and build change: the first build needs to download the library (JitPack) and turns on core library desugaring. If the build fails on the new dependency, or YouTube stops working after a YouTube change, raise the version in app/build.gradle.kts to the newest NewPipeExtractor release. The debug log says \"NewPipe\" in the YouTube line when it was used."
      ]
    },
    {
      "name": "Alpha 0.54.14",
      "date": "2026-11-24",
      "notes": [
        "**The YouTube error in the debug log now says what the live server lists gave** (how many servers, or why they could not be fetched). In 0.54.13 the failed play listed only the built-in servers, so the live lists added nothing and I could not tell why. No change to how YouTube plays. Needs a new build (Java)."
      ]
    },
    {
      "name": "Alpha 0.54.13",
      "date": "2026-11-24",
      "notes": [
        "**YouTube asks the current list of servers.** Playing a YouTube video failed because every server in the app's fixed list was down or refusing. The app now fetches the Piped and Invidious projects' live lists (at most every six hours) and tries the healthiest ones first, keeping the built-in list as a fall-back. If those lists cannot be fetched, nothing changes. Needs a new build of the app (Java change)."
      ]
    }
  ]
};
