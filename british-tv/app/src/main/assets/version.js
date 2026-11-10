// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.20.1",
  "version": "0.20.1",
  "code": 2001,
  "date": "2026-11-10",
  "notes": [
    "The debug log no longer records a missing `art.json` or `routes.json` as a failed request. They are optional until the scraper publishes them, and the entries were burying real problems"
  ],
  "history": [
    {
      "name": "Alpha 0.20",
      "date": "2026-11-10",
      "notes": [
        "**The debug log can now say why a programme is wrong, not only why one failed.** Pressing Info on anything that is playing writes a record of it: the show it was listed as, the archive.org item and file it came from, how long the listing says it should be and how long the file really is, and the picture size. The app also asks archive.org what that upload actually is (its title, who uploaded it, language, collections, the start of its description) and records the answer, which is what shows a programme to be a different show with the same name",
        "A file much shorter than its listing is logged as a mismatch the moment it loads, with the same details, without anyone having to press anything",
        "The Debug log screen says how to use this and lists the latest programmes you checked"
      ]
    },
    {
      "name": "Alpha 0.19",
      "date": "2026-11-10",
      "notes": [
        "**The debug log opens from a phone or computer.** The log page could only answer one connection at a time, and a browser opens spare ones that say nothing, so the real request waited and then failed with \"unexpectedly closed the connection\". Each connection is now answered separately. The Debug log screen also spells out that the address must be typed with `http://` at the front, because a browser left to guess tries a secure connection, which this page does not speak"
      ]
    },
    {
      "name": "Alpha 0.18",
      "date": "2026-11-10",
      "notes": [
        "**Options has a new look.** It is a full-height sheet down the right of the screen, with the settings grouped under Picture, On screen, Playback & listings and About, and a line at the bottom saying what the highlighted setting does. Rows that open a screen show a small arrow instead of \"Press OK\"",
        "\"Picture\" is now \"Aspect ratio\" and \"Extra metadata\" is now \"Artwork\", which is what they change"
      ]
    },
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
    }
  ]
};
