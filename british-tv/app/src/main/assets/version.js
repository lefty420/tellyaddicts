// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.18",
  "version": "0.18",
  "code": 1800,
  "date": "2026-11-10",
  "notes": [
    "**Options has a new look.** It is a full-height sheet down the right of the screen, with the settings grouped under Picture, On screen, Playback & listings and About, and a line at the bottom saying what the highlighted setting does. Rows that open a screen show a small arrow instead of \"Press OK\"",
    "\"Picture\" is now \"Aspect ratio\" and \"Extra metadata\" is now \"Artwork\", which is what they change"
  ],
  "history": [
    {
      "name": "Alpha 0.17",
      "date": "2026-11-10",
      "notes": [
        "The debug log has its own screen and its own row at the bottom of Options, and About & credits is just the credits again. The log screen shows the address to open from a phone or computer and the latest eight failures, newest first"
      ]
    },
    {
      "name": "Alpha 0.16",
      "date": "2026-11-10",
      "notes": [
        "**Long programmes no longer fail when Buffer is on.** Joining a programme part-way through, which the clock does all the time, asks for a point well into the file. The buffer only downloads a set distance ahead, so it sat waiting for a point it would never reach, the picture never started, and after 25 seconds the app gave up and moved on. Feature-length episodes were hit hardest. The buffer now restarts its download wherever the player asks. Files whose index sits at the end had the same problem and are fixed with it",
        "Programmes wrongly marked \"slow to start\" because of that are given a clean slate",
        "**A debug log.** The app keeps a record of what it played, how long each took to start, and what went wrong when something failed, including what archive.org answered for that file. Options > About & debug log shows the latest failures and an address to open on a phone or computer on the same Wi-Fi, where the whole log can be copied and sent"
      ]
    },
    {
      "name": "Alpha 0.15",
      "date": "2026-11-10",
      "notes": [
        "**Soaps follow the clock.** Neighbours at lunchtime and again at 5.35, Crossroads in the early evening, Home and Away after it, EastEnders at half past seven on the dot, and the other serials after them. Crossroads also fills the daytime so the smaller soaps are not left repeating. A soap with only a few episodes is topped up from the others rather than playing the same ones over"
      ]
    },
    {
      "name": "Alpha 0.14",
      "date": "2026-11-10",
      "notes": [
        "**New channel 25, Soaps**: EastEnders, Coronation Street, Emmerdale, Crossroads, Neighbours, Home and Away, Brookside, Hollyoaks, Eldorado, Howards' Way, Albion Market, Prisoner Cell Block H and the rest. Crossroads alone is 1,269 episodes, which is why the soaps moved off the BBC and ITV channels, where they were crowding out everything else those broadcasters made. Neighbours and Home and Away also stay in the daytime listing"
      ]
    },
    {
      "name": "Alpha 0.13",
      "date": "2026-11-10",
      "notes": [
        "**Artwork can come ready-made from the scraper.** The scraper looks each show up once and publishes the posters, backdrops and summaries in `data/art.json` (described in `tools/art-contract.md`); the TV reads that first, so a listed show has its picture the first time you reach it, with no searching and nothing to be refused. A show that isn't listed is still looked up on TVmaze as before, so this only adds. Until the scraper publishes the file, nothing changes"
      ]
    },
    {
      "name": "Alpha 0.12",
      "date": "2026-11-10",
      "notes": [
        "**Artwork that failed to load is looked for again soon, not remembered as \"none\" for a month.** When the guide moved quickly TVmaze turned some requests away, and the app took the refusal as \"this show has no picture\" and kept that answer for 30 days, so those shows stayed bare. A refused request is now retried within the hour, and a show TVmaze genuinely does not know is re-checked after five days. Blank answers saved by earlier versions are cleared, so the shows that missed out get another go"
      ]
    },
    {
      "name": "Alpha 0.11",
      "date": "2026-11-10",
      "notes": [
        "**The Bill is limited to three episodes a day** on Drama. It makes up about half of what the channel has, so it was crowding everything else out. Now there is one at half past six, then the eight o'clock slot, and the rest of the day belongs to the other dramas. The three change every day, so the week shows twenty-one different episodes, and Drama's schedule now repeats weekly instead of daily"
      ]
    },
    {
      "name": "Alpha 0.10",
      "date": "2026-11-10",
      "notes": [
        "**Drama (channel 7) now follows the clock.** The Bill was three-quarters of the channel and played back to back all day. Now the gentler dramas fill the day (Lovejoy, Heartbeat, Ballykissangel, Upstairs Downstairs, Poirot, Hetty Wainthropp and the like), The Bill starts at 8pm on the dot as it did on ITV, and the heavier crime comes after the 9pm watershed: The Professionals, Minder, Bergerac, Spooks, Morse, Prime Suspect and I, Claudius. A thin library falls back to the ordinary loop rather than leaving the channel empty"
      ]
    }
  ]
};
