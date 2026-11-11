// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.29",
  "version": "0.29",
  "code": 2900,
  "date": "2026-11-11",
  "notes": [
    "**Fix the artwork from On Demand.** Hold OK on a show (or press Menu) for a menu: Scrape artwork (looks the show up on TVmaze again and takes a clear match), Choose the right show (a list of TVmaze matches with year, network and genre), Choose a poster, Choose a background (pick from what TVmaze has), and Back to automatic. What you pick is kept on this TV and used everywhere, and the choice is written to the debug log. A short press on OK still opens or plays as before.",
    "**Episode pictures.** An episode with no still of its own now shows archive.org's picture for its file when that file holds just that episode."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.26.2",
      "date": "2026-11-11",
      "notes": [
        "**Black screen with sound is caught.** If a programme plays sound but shows no picture (an audio-only file, or video this TV cannot decode), the app now notes it in the debug log with the file's name, marks it slow so it is skipped for a while, and moves on to the next programme."
      ]
    },
    {
      "name": "Alpha 0.26.1",
      "date": "2026-11-11",
      "notes": [
        "**VHS 2 lines are now even.** The lines were drawn at fractions of a pixel, so some came out thick and some gaps wide. They are now drawn in whole screen pixels, so every line and every gap is the same size."
      ]
    },
    {
      "name": "Alpha 0.26",
      "date": "2026-11-11",
      "notes": [
        "**New enhancement: VHS 2.** Under Options > Enhancements, after VHS: a flat, saturated picture with fine dark lines right across it, like a tape on a cheap set."
      ]
    },
    {
      "name": "Alpha 0.25.6",
      "date": "2026-11-11",
      "notes": [
        "**The Bill channel is now Drama.** The channel id `thebill` becomes `drama` in the app and in `tools/shows.json` (named just \"Drama\"), matching the scraper's new `drama.json`. The Bill stays on both Drama and ITV. Until the scraper publishes the new file, the app uses its built-in Drama list."
      ]
    },
    {
      "name": "Alpha 0.25.5",
      "date": "2026-11-11",
      "notes": [
        "**`routes.json` is now the source of truth for where shows go.** A show it lists appears only on the channel(s) it names and is dropped from any other channel's list, so moving a show by hand in the scraper moves it on the TV too. Shows it doesn't list keep their channels from `tools/shows.json`.",
        "**The Disney channel has no era limit and needs no air dates or TVmaze id.** Undated and pre-1970 cartoon shorts (Donald Duck, Mickey Mouse, Goofy, Pluto, Silly Symphonies, Disney Cartoons) play on Disney; every other channel still keeps 1970 to 1999."
      ]
    },
    {
      "name": "Alpha 0.25.4",
      "date": "2026-11-10",
      "notes": [
        "**Shows the scraper has removed for good stay off the TV.** When the scraper publishes `data/removed-shows.json` (and `removed` in `index.json`), those shows are left out of every channel and out of On Demand, whatever the lists say. C.O.P.S. is the first; it is also gone from `tools/shows.json`"
      ]
    }
  ]
};
