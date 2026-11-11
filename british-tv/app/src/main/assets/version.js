// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.31",
  "version": "0.31",
  "code": 3100,
  "date": "2026-11-11",
  "notes": [
    "**New channel: Food & Cooking (26).** Delia, Keith Floyd, Rick Stein, Ready Steady Cook, Two Fat Ladies, Masterchef, Ken Hom, Madhur Jaffrey and the other classic cookery shows, built from the scraper's new cooking library. Adverts are UK prime-time style, and it shows in On Demand like every other channel."
  ],
  "history": [
    {
      "name": "Alpha 0.30",
      "date": "2026-11-11",
      "notes": [
        "**On Demand opens on the show you are watching.** Press the On Demand button on the bar (or Blue or Menu) while something is playing and it opens that show's page, on the season and the episode that is on, ready to pick another. From the guide it still opens on the channel rows.",
        "**Films are in On Demand.** Kids Movies and The Video Shop are back as rows, each film a title of its own with its poster, year, genres, running time and certificate, and Play. Films keep the watershed: family films all day, 15s from 8 pm, and the rest (including films with no certificate) from 9 pm until half past five in the morning."
      ]
    },
    {
      "name": "Alpha 0.29.4",
      "date": "2026-11-11",
      "notes": [
        "**Picking a poster now shows up.** The poster you chose was TVmaze's untouched original, which can be many megabytes, so the TV was slow to show it or could not and the card looked unchanged. Posters now use TVmaze's normal poster size. A pick is only applied once its picture has actually loaded; if it will not load, a message says so and nothing changes."
      ]
    },
    {
      "name": "Alpha 0.29.3",
      "date": "2026-11-11",
      "notes": [
        "**Noel's House Party channel is switched off for now.** It is gone from the guide and On Demand. Its shows are still on other channels (such as Saturday Night TV). `off: true` on a channel in `channels.js` switches it off; removing that line brings it back."
      ]
    },
    {
      "name": "Alpha 0.29.2",
      "date": "2026-11-11",
      "notes": [
        "**OK works normally again in On Demand.** A short press of OK opens a show or plays an episode, as before. The artwork menu now opens only when you hold OK (the same hold that shows Info elsewhere), or press Menu. In 0.29 and 0.29.1 a plain press could open the menu instead."
      ]
    },
    {
      "name": "Alpha 0.29.1",
      "date": "2026-11-11",
      "notes": [
        "**Soaps all day.** EastEnders, Neighbours and the other big soaps are now in the Soaps channel's daytime and late-night mix as well as their evening slots, so they turn up whenever you tune in. They will fill most of the hours between the fixed slots, because they have far more episodes than the small soaps. The note on this is in `tools/schedule-notes.md` for when the schedule engine is reworked."
      ]
    },
    {
      "name": "Alpha 0.29",
      "date": "2026-11-11",
      "notes": [
        "**Fix the artwork from On Demand.** Hold OK on a show (or press Menu) for a menu: Scrape artwork (looks the show up on TVmaze again and takes a clear match), Choose the right show (a list of TVmaze matches with year, network and genre), Choose a poster, Choose a background (pick from what TVmaze has), and Back to automatic. What you pick is kept on this TV and used everywhere, and the choice is written to the debug log. A short press on OK still opens or plays as before.",
        "**Episode pictures.** An episode with no still of its own now shows archive.org's picture for its file when that file holds just that episode."
      ]
    },
    {
      "name": "Alpha 0.28",
      "date": "2026-11-11",
      "notes": [
        "**A new On Demand.** A banner for the show you are on, then a row of posters for each channel (Left and Right along a row, Up and Down between channels, OK to open). A show opens on its own page with its poster, details, a Play button, season chips and the episode list. Real seasons come first in order; anything that does not fit a season (specials, unnumbered files) is under \"Other videos\" at the end, and a show with no seasons is one list. Flat colours and an outline for focus keep it light on older boxes."
      ]
    },
    {
      "name": "Alpha 0.27",
      "date": "2026-11-11",
      "notes": [
        "**New aspect ratio: Smart.** Under Options > Aspect ratio, after Auto. A 4:3 programme keeps its true shape, with no stretching or squashing, and the empty bars at the sides are filled with a soft, dimmed, enlarged copy of the picture, so it looks at home on a modern 16:9 TV. Widescreen programmes are left alone. It costs next to nothing to run, because the copy is only 48 by 27 pixels."
      ]
    }
  ]
};
