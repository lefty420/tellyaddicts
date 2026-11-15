// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.85",
  "version": "0.46.85",
  "code": 4685,
  "date": "2026-11-15",
  "notes": [
    "**Oswald the Lucky Rabbit** (about 365 cartoons in the library) is now on the Disney channel too."
  ],
  "history": [
    {
      "name": "Alpha 0.46.84",
      "date": "2026-11-15",
      "notes": [
        "**More Disney shorts**: the library's \"Walt Disney Cartoon\", \"Silly Symphony\", \"Disney Classic\" and \"Disney Cartoon\" uploads were on no channel. They are now on the Disney channel (about 580 more shorts). This comes from the show list, so it reaches the TV at the next start even before this version is installed.",
        "**Game Shows takes dated episodes**: a quiz show with no episode number now plays on Game Shows when it is dated 1999 or earlier, by its air date or a date in the file name (\"Blockbusters - 1:21:82\", \"Fifteen to One - TX 15 January 1988\"). That adds about 450 programmes: Blockbusters, Supermarket Sweep, Fifteen to One, Bullseye, University Challenge and others. Undated files still stay off, which keeps namesakes and fan videos out."
      ]
    },
    {
      "name": "Alpha 0.46.83",
      "date": "2026-11-15",
      "notes": [
        "**Audio & subtitles**: a new button on the bar (next to Options) lets you pick the sound track and turn subtitles on or off, like other media players. It shows up when the file has more than one sound track or any subtitles. Each choice shows the language and details such as \"Dolby Digital, 5.1\", \"Commentary\", \"Forced\" or \"SDH\". Both text subtitles and picture subtitles (DVD/Blu-ray style) are drawn over the picture, and move above the bar while it is open.",
        "**Your choice carries on**: the sound language and subtitle setting you pick are kept, so the next programme starts the same way when it has a matching track. Turn subtitles off in the same menu to stop them.",
        "Only the app's own player can see the tracks inside a file. Addon files and anything with Dolby/DTS sound already play there; plain archive files play in the web view, which has one sound and no subtitles, so the button stays hidden for those. Options > Videos that won't play > Always sends everything to the app's own player."
      ]
    },
    {
      "name": "Alpha 0.46.82",
      "date": "2026-11-15",
      "notes": [
        "**Debug log keeps your debrid key out**: addon and debrid addresses are now written down as just the site's name (for example `torrentio.strem.fun/…`), and any long key-shaped run of letters and digits is blanked. Before, a Torrentio-style link (`…/realdebrid=KEY/…`) went into the log whole. Logs already saved on the TV are cleaned the first time this version starts.",
        "**Live view and the shared log need the code on screen**: the Live view code is now 10 random characters instead of 4 digits, so it can no longer be guessed. The shared debug log (and the EPG and gaps pages) now has a code in its address too; before, anyone on the same Wi-Fi could read it. Open the address exactly as the TV shows it, including the part after the question mark."
      ]
    },
    {
      "name": "Alpha 0.46.81",
      "date": "2026-11-15",
      "notes": [
        "**Tiny guide cells**: a programme cell only a few letters wide no longer shows a useless \"Sc...\" or \"O...\". It shows the first word if that fits, otherwise a dot; the full title is in the big header when you focus it.",
        "**Update message moved**: \"Updated to Alpha ...\" now appears at the bottom of the screen instead of over the TV Guide header and clock."
      ]
    },
    {
      "name": "Alpha 0.46.80",
      "date": "2026-11-15",
      "notes": [
        "**Shorter hold-OK menu on a programme**: Fix artwork, Hide this show/film and Report a problem now sit behind one \"More...\" entry (Back returns to the main menu). Options stays last. When a menu has more entries than fit, its heading says which one you are on (\"item 10 of 11\").",
        "**Bigger supporting text**: the small lines under menu entries, the dates inside guide cells, On Demand's menu and the Options hints at the bottom are a little larger, so they read from across the room."
      ]
    },
    {
      "name": "Alpha 0.46.79",
      "date": "2026-11-15",
      "notes": [
        "**The debug log now times the scraper's library**: how long it took to download, to read and to sort into channels. Nothing changes on screen; it is there to show what the library really costs on this TV."
      ]
    },
    {
      "name": "Alpha 0.46.78",
      "date": "2026-11-15",
      "notes": [
        "**The debug log hides more of an addon's address**: an addon whose settings are a 36-character ID (the AIOStreams style) now shows as ... in the log and live view, like the long ones already did. Lines saved by earlier versions are cleaned when the log loads."
      ]
    },
    {
      "name": "Alpha 0.46.77",
      "date": "2026-11-15",
      "notes": [
        "**The \"Scraping your debrid...\" message goes away** when you change channel while it is still looking.",
        "**One ranking for addon links**: Find sources and Use addons as a main source now pick the best link the same way (English audio first, the release group that worked last time, then 1080p over 720p). The unused debrid switch behind the old code is gone.",
        "**Teletext page text moved out of app.js** into its own file (ttpages.js), about 200 lines. Nothing changes on screen."
      ]
    }
  ]
};
