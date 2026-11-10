// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.22.1",
  "version": "0.22.1",
  "code": 2201,
  "date": "2026-11-10",
  "notes": [
    "**Changing channel now shows the \"Please stand by\" TV instead of the full-screen static.** It comes up at once, stays for at least a moment so it is seen, and plays a short hiss. If the programme's artwork is not known yet it looks it up and swaps it onto the TV screen as soon as it arrives; a programme with no artwork anywhere stays on static. The guide's small preview no longer shows static while tuning"
  ],
  "history": [
    {
      "name": "Alpha 0.22",
      "date": "2026-11-10",
      "notes": [
        "**The \"Please stand by\" screen now shows what is about to play.** Its artwork (a film's poster, or a show's poster or backdrop) appears on the screen of a little retro TV set, with scanlines, a gentle flicker of static and a blinking standby light. If the show has no artwork to hand, the set stays and its screen shows static instead. Artwork is only used when it is already known, so the screen never waits on the network, and the lookup runs in the background so that show has art next time"
      ]
    },
    {
      "name": "Alpha 0.21",
      "date": "2026-11-10",
      "notes": [
        "**Press Back twice quickly to quit, from the guide or while watching.** A box asks \"Quit Telly Addicts?\" with Yes and No as buttons: Left and Right then OK on the remote, or a click. No is already chosen, so an accidental OK does nothing. A single Back does what it always did (the guide while watching, back to the picture from the guide), and Back on the box answers No"
      ]
    },
    {
      "name": "Alpha 0.20.1",
      "date": "2026-11-10",
      "notes": [
        "The debug log no longer records a missing `art.json` or `routes.json` as a failed request. They are optional until the scraper publishes them, and the entries were burying real problems"
      ]
    },
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
    }
  ]
};
