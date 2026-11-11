// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.35.1",
  "version": "0.35.1",
  "code": 3501,
  "date": "2026-11-11",
  "notes": [
    "**Episode pictures load faster.** The scraper's episode guides (now published for 431 shows) point at TVmaze's full-size stills, which a TV is slow to decode. The app asks for the medium size, which is plenty for the thumbnail next to each episode."
  ],
  "history": [
    {
      "name": "Alpha 0.35",
      "date": "2026-11-11",
      "notes": [
        "**VHS and VHS 2 look after themselves on heavy files.** If the TV is dropping more than a fifth of the frames, which is what makes the picture drift out of sync with the sound, only the slight blur is taken off. The scan lines, colour and tint stay. The next programme starts with the full look again, and the debug log notes which file caused it (\"VIDEO EFFECT lightened\"). Files that play fine look exactly as before."
      ]
    },
    {
      "name": "Alpha 0.34.1",
      "date": "2026-11-11",
      "notes": [
        "**Smart aspect ratio taken out of the options for now.** It wasn't working properly. Anyone who had it selected goes back to Auto."
      ]
    },
    {
      "name": "Alpha 0.34",
      "date": "2026-11-11",
      "notes": [
        "**New channel: US Sitcoms (28).** Friends, Frasier, Everybody Loves Raymond, Seinfeld, Cheers, Roseanne, The Fresh Prince and the rest of the American sitcoms up to 1999. It stays out of the guide until the scraper has found some of them on archive.org."
      ]
    },
    {
      "name": "Alpha 0.33",
      "date": "2026-11-11",
      "notes": [
        "**New channel: Entertainment (27).** A mix of the best of everything from any network: light entertainment (Generation Game, Little and Large, Benny Hill), panel and Friday-night shows (Whose Line, TFI Friday, The Word), sketch and satire (Spitting Image, Harry Enfield, Not the Nine O'Clock News), sitcoms (Father Ted, Men Behaving Badly, Ab Fab) and cult drama (Robin of Sherwood, Tales of the Unexpected, Blake's 7). Its shows stay on their own channels too."
      ]
    },
    {
      "name": "Alpha 0.32.1",
      "date": "2026-11-11",
      "notes": [
        "**Episodes with no picture of their own show the show's artwork** instead of a flat coloured box. A real still still wins when there is one (from the scraper's episode guide or TVmaze); one upload holding many episodes, like Ready Steady Cook, used to have none."
      ]
    },
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
    }
  ]
};
