// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.53.1",
  "version": "0.53.1",
  "code": 5301,
  "date": "2026-11-21",
  "notes": [
    "Faster start: the guide no longer waits up to 10 s for every channel. It opens as soon as the channel that was on last is ready (waiting at most 5 s for it) and the rest fill in behind. If that channel is slower than 5 s, the guide opens on what is ready and the app tunes to the last channel by itself the moment it is ready, unless a key has been pressed in the meantime."
  ],
  "history": [
    {
      "name": "Alpha 0.53.0",
      "date": "2026-11-21",
      "notes": [
        "On Demand opens straight away. The \"Getting your shows ready…\" popup is gone from the home page, and nothing blocks the keys while rows fill in.",
        "On Demand now has an index: one small row per show (name, slug, poster, logo, backdrop, certificate, year, episode and season counts), kept per channel under the library revision like the sorted lists, and built in the background after the guide is up. The home rows, the hero and Browse read only from it; opening the home page no longer loads a channel's list, fills in episodes or groups them.",
        "A show's episodes, seasons and copies are put together (Magic EPG fill included) only when its page is opened, for that show alone. Compared with the old whole-channel build on 2,700 shows, the episodes, seasons and certificates are identical.",
        "First run, or a new library revision: the chips, rail and hero draw at once and each row fills in as its channel is indexed (placeholder posters, no popup).",
        "The debug log now says how long it took from pressing On Demand to the first row (ONDEMAND: first row drawn … ms, warm start or index being built).",
        "Still shown: the short wait when On Demand opens straight onto the show that is playing."
      ]
    },
    {
      "name": "Alpha 0.52.11",
      "date": "2026-11-21",
      "notes": [
        "Loading screens: Set in the room and Whole screen now use the classic TV style (its brown cabinet and grey knobs, the green channel number and tuning scale) at the larger size. The aerials, wood cabinet, ribbed knobs and the big white TUNING / READY word are gone.",
        "The Please stand by TV tunes again like the start-up one: green channel number and tuning scale with a sweeping needle on the glass, the knobs turning, and colour bars flashing now and then."
      ]
    },
    {
      "name": "Alpha 0.52.10",
      "date": "2026-11-21",
      "notes": [
        "VHS, VHS OLED and VHS 2: live-action video could drift out of step with the sound because the colour filter made the TV drop frames. The check now reacts sooner (a few dropped frames, every 3 seconds) and, when it fires, takes the whole filter off the video, not only the blur. The scan lines stay."
      ]
    },
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
    }
  ]
};
