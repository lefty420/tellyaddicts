// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.52.10",
  "version": "0.52.10",
  "code": 5210,
  "date": "2026-11-21",
  "notes": [
    "VHS, VHS OLED and VHS 2: live-action video could drift out of step with the sound because the colour filter made the TV drop frames. The check now reacts sooner (a few dropped frames, every 3 seconds) and, when it fires, takes the whole filter off the video, not only the blur. The scan lines stay."
  ],
  "history": [
    {
      "name": "Alpha 0.52.9",
      "date": "2026-11-21",
      "notes": [
        "Fixed: the app would not get past the loading screen (stuck on \"Opening the guide\"). Release 0.52.4 removed a helper by mistake. 0.52.4 to 0.52.8 are affected, so update to this one."
      ]
    },
    {
      "name": "Alpha 0.52.8",
      "date": "2026-11-21",
      "notes": [
        "Loading screens, from the design review: (1) in Whole screen the \"Please stand by\" plate now grows with its words, so the last line is no longer on its edge; (2) in Set in the room the start-up TV's aerials no longer poke through the logo; (3) while a programme is being found the last line steps through what is happening (Scraping your debrid / Found a source, starting / Playing the library copy / Found it on archive.org) and after 8 seconds shows how long it has been; (4) the start-up TV says READY and \"Opening the guide…\" once every channel has answered, instead of sitting on \"TUNING 31 / 31\"."
      ]
    },
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
    }
  ]
};
