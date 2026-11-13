// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.72",
  "version": "0.45.72",
  "code": 4572,
  "date": "2026-11-13",
  "notes": [
    "**Live view (debug).** Options > Tools > Live view (debug), off until switched on and off again each time the app starts. When on it shows an address with a four-digit code; open it in a browser on the same Wi-Fi to see what the TV is showing (updating a few times a second, including video), press the remote's buttons from the page or the keyboard's arrows, and read the app's current screen, programme and recent debug log. It only sends a picture, text and button presses; nothing on the page can run code in the app. This one changes the Android app itself, so it needs a full build."
  ],
  "history": [
    {
      "name": "Alpha 0.45.71",
      "date": "2026-11-13",
      "notes": [
        "**Start-up TV never repeats a picture.** Each background is shown once per start-up, picked at random from the whole art list. More are fetched in the background as they get used up, so the TV only starts over if it has genuinely shown every one."
      ]
    },
    {
      "name": "Alpha 0.45.70",
      "date": "2026-11-13",
      "notes": [
        "**Soaps can have a year as the season.** Episode codes such as `S1988E56` are now read everywhere (the guide, On Demand, next episode, link matching); before, only one or two digits were accepted for the season, so they would not have been recognised. In On Demand such a season is shown as just \"1988\"."
      ]
    },
    {
      "name": "Alpha 0.45.69",
      "date": "2026-11-13",
      "notes": [
        "**Quieter tuning hiss.** The static heard while a channel tunes in is now well under half as loud.",
        "**Start-up TV shows backgrounds, not posters.** Its pictures are now the shows' wide backgrounds; a poster is only used for a show that has no background, or until the first backgrounds have loaded."
      ]
    },
    {
      "name": "Alpha 0.45.68",
      "date": "2026-11-13",
      "notes": [
        "**The start-up TV keeps tuning until the guide is ready.** It used to freeze on static while the app was busy building the guides, because the picture changes and the knobs were driven by the same thread that was doing the building. Now everything that moves (the static, twelve pictures taking turns, the turning knobs, the channel number and the occasional flash of colour bars) is a pure animation that carries on whatever the app is doing. Each time a picture comes round again it is a different show or film."
      ]
    },
    {
      "name": "Alpha 0.45.67",
      "date": "2026-11-13",
      "notes": [
        "**YouTube Poop remixes are gone from Disney.** Three uploads called \"Donald Duck Comedy vs ...\" (fan-made \"ytp\" remixes with crude filenames) had been filed under Donald Duck on the Disney channel and its guide, and in On Demand. Anything with \"ytp\", \"YouTube Poop\" or \"Donald Duck Comedy vs\" in its name is now blocked everywhere, and those three items are hidden by name."
      ]
    },
    {
      "name": "Alpha 0.45.66",
      "date": "2026-11-13",
      "notes": [
        "**No more block sticking out of the guide.** A programme that starts just before the right edge of the guide (a few minutes of a two-hour film, say) was drawn wider than its real length because of its padding, so it poked out past the grid as a yellow or blue stub. Slivers like this now have no padding and stay inside the grid."
      ]
    },
    {
      "name": "Alpha 0.45.65",
      "date": "2026-11-13",
      "notes": [
        "**\"Auto EPG (experimental)\" is gone from Options > TV Guide.** The switch was already unused since Auto EPG became the only guide, but its empty row was still left on the page; it has been removed."
      ]
    },
    {
      "name": "Alpha 0.45.64",
      "date": "2026-11-13",
      "notes": [
        "**A Santa hat on the guide clock.** A little 16-bit Santa hat sits centred on the clock in the TV guide while Seasonal effects is on and Christmas is on (1 November to 6 January), on every guide theme. It goes with the snow: Seasonal effects set to Off removes both."
      ]
    }
  ]
};
