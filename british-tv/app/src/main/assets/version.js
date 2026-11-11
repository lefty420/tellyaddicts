// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.32.1",
  "version": "0.32.1",
  "code": 3201,
  "date": "2026-11-11",
  "notes": [
    "**Episodes with no picture of their own show the show's artwork** instead of a flat coloured box. A real still still wins when there is one (from the scraper's episode guide or TVmaze); one upload holding many episodes, like Ready Steady Cook, used to have none."
  ],
  "history": [
    {
      "name": "Alpha 0.32",
      "date": "2026-11-11",
      "notes": [
        "**On Demand fits the screen.** The posters are smaller and the title block is tighter, so both rows show in full with nothing cut off at the bottom and the OK Open button no longer sits on a row title.",
        "**On Demand is quicker.** Moving left and right along a row now only moves the highlight instead of rebuilding every poster, a picture that has been found is remembered, and the big background waits until you stop moving before it loads.",
        "**Missing episodes report** (Options > Missing episodes report). Checks every show on the TV against its episode guide (the scraper's, else TVmaze's), counting only episodes aired by 1999. It lists the seasons with nothing on the TV and the episodes missing inside seasons that are there, and puts the whole report on the home network as text to copy and send to the scraper. The guides it reads are kept, so the second check is quick."
      ]
    },
    {
      "name": "Alpha 0.31.1",
      "date": "2026-11-11",
      "notes": [
        "**Food & Cooking now has programmes.** The channel came up empty: the TV only looked at the library routing and never at the channel's own list, and most cookery files have no episode numbers in their names. Both fixed, so Two Fat Ladies, Floyd, Delia, Ready Steady Cook and the rest play."
      ]
    },
    {
      "name": "Alpha 0.31",
      "date": "2026-11-11",
      "notes": [
        "**New channel: Food & Cooking (26).** Delia, Keith Floyd, Rick Stein, Ready Steady Cook, Two Fat Ladies, Masterchef, Ken Hom, Madhur Jaffrey and the other classic cookery shows, built from the scraper's new cooking library. Adverts are UK prime-time style, and it shows in On Demand like every other channel."
      ]
    },
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
    }
  ]
};
