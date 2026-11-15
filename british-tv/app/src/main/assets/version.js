// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.89",
  "version": "0.46.89",
  "code": 4689,
  "date": "2026-11-15",
  "notes": [
    "**Films played from an addon keep their own details**: a film started from your addons lost its link to the library's film record (the TMDb plot, cast and poster), so Info and the artwork looked it up as a TV show by name. \"Lethal Weapon\" could pick up the 2016 series, \"Jumanji\" the cartoon. It now keeps the library's film record, also when replayed from Saved sources.",
    "**Film backdrops never come from a TV show**: a film's picture is its own poster, or one you chose by hand. A TV show with the same name (Jumanji, Police Academy, Back to the Future, Dumb and Dumber) is no longer used for its backdrop."
  ],
  "history": [
    {
      "name": "Alpha 0.46.88",
      "date": "2026-11-15",
      "notes": [
        "**Saved film sources cleared once**: the app remembers the source that last worked for each title and plays it again without searching, so the wrong *Blackadder's Christmas Carol* link would have kept playing for Mickey's Christmas Carol for three days even after 0.46.87. Sources saved for films (in the replay memory and in Options > Saved sources) are forgotten one time, and looked up again with the stricter search. Saved sources for series are untouched."
      ]
    },
    {
      "name": "Alpha 0.46.87",
      "date": "2026-11-15",
      "notes": [
        "**Wrong film from an addon**: Mickey's Christmas Carol played *Blackadder's Christmas Carol* with a green ADDON badge. When the film search found no result with the right name, the app took the first result, whatever it was, and remembered it. It now only accepts the same name (or a close name with the same year) and otherwise says it could not find the film, so the library copy plays instead. Films matched wrongly before are forgotten, so they are looked up again."
      ]
    },
    {
      "name": "Alpha 0.46.86",
      "date": "2026-11-15",
      "notes": [
        "**Rescrape a film from the TV Guide**: \"Fix artwork & details\" on a film used to say \"Films use the details that came with them\" and do nothing. It now opens that film's artwork menu in On Demand: Scrape artwork, Choose the right film (for when the wrong film was matched), Choose a poster or background. Film artwork needs the TheTVDB key (Options > Artwork), as in On Demand."
      ]
    },
    {
      "name": "Alpha 0.46.85",
      "date": "2026-11-15",
      "notes": [
        "**Oswald the Lucky Rabbit** (about 365 cartoons in the library) is now on the Disney channel too."
      ]
    },
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
    }
  ]
};
