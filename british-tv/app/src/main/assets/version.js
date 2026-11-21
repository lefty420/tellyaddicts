// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.52.8",
  "version": "0.52.8",
  "code": 5208,
  "date": "2026-11-21",
  "notes": [
    "Loading screens, from the design review: (1) in Whole screen the \"Please stand by\" plate now grows with its words, so the last line is no longer on its edge; (2) in Set in the room the start-up TV's aerials no longer poke through the logo; (3) while a programme is being found the last line steps through what is happening (Scraping your debrid / Found a source, starting / Playing the library copy / Found it on archive.org) and after 8 seconds shows how long it has been; (4) the start-up TV says READY and \"Opening the guide…\" once every channel has answered, instead of sitting on \"TUNING 31 / 31\"."
  ],
  "history": [
    {
      "name": "Alpha 0.52.7",
      "date": "2026-11-21",
      "notes": [
        "Debug > Live view now remembers it is on: if it was on when the app last ran it starts again by itself at launch (it retries for 40 s while the home network comes up), and stays off once you switch it off. With Open debug address on, the address is the same every time, so no code to type."
      ]
    },
    {
      "name": "Alpha 0.52.6",
      "date": "2026-11-21",
      "notes": [
        "On-screen display: a film, an episode and anything else now read the same way. The title line is the film or the show (no more raw \"S01E01\" codes), the line under it is year, certificate and length for a film or Series, Episode and the episode's name for an episode, and the addon's name is no longer repeated (the badge already says it). A picture tile is always on the left (the poster, or a coloured tile with the first letter until one is found), so the bar never changes shape. \"Next\" shows the show and its series and episode.",
        "Seasonal snow: the flakes now come in a range of sizes in a 16-bit look, from single pixels up to big shaded snowflakes, near ones larger and quicker, far ones smaller and slower."
      ]
    },
    {
      "name": "Alpha 0.52.5",
      "date": "2026-11-21",
      "notes": [
        "On-screen display: the button row always fits. On a film (which adds Sources and Audio & subs) the Options button was clipped at the right edge; the buttons now step down in size until all of them are on screen."
      ]
    },
    {
      "name": "Alpha 0.52.4",
      "date": "2026-11-21",
      "notes": [
        "Loading a programme is now one screen. \"Scraping your debrid…\" and \"No addon had it, trying archive.org…\" are written on the \"Please stand by\" screen itself (in whichever Loading screen look is set), so it no longer shows one TV screen and then swaps to a different one when the video starts to load."
      ]
    },
    {
      "name": "Alpha 0.52.3",
      "date": "2026-11-21",
      "notes": [
        "Loading screen: Surprise me now picks again for every loading screen (start-up, finding a programme, loading a channel, episode or film), not once per start. Switching Experimental off or on changes the look at once."
      ]
    },
    {
      "name": "Alpha 0.52.2",
      "date": "2026-11-21",
      "notes": [
        "Loading a channel, episode or film now uses the Loading screen look you chose (Set in the room or Whole screen) for its \"Please stand by\" screen too, with the programme's picture on the glass or blurred behind the set. Classic keeps the old test-card screen."
      ]
    },
    {
      "name": "Alpha 0.52.1",
      "date": "2026-11-21",
      "notes": [
        "Loading screen: the Classic TV no longer flashes up before the look you chose (Whole screen, Set in the room); the screen stays blank until the app has picked it."
      ]
    },
    {
      "name": "Alpha 0.52.0",
      "date": "2026-11-21",
      "notes": [
        "TV Guide: opening the guide puts the channel that is playing on the top row (it used to be on the bottom row), so you see what comes after it. Near the end of the list it shows the last screenful.",
        "Finding a programme: \"Scraping your debrid…\" and \"No addon had it, trying archive.org…\" are now written on the loading screen with the pictures instead of a message along the bottom.",
        "Options > Experimental > Loading screen now changes at once, and every loading screen (the start-up one and this one) uses the look you pick, Set in the room, Whole screen, Classic or Surprise me."
      ]
    }
  ]
};
