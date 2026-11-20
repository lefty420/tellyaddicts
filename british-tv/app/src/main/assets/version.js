// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.48.4",
  "version": "0.48.4",
  "code": 4804,
  "date": "2026-11-20",
  "notes": [
    "Fixed: the episodes row on Info never showed a thumbnail picture at all (only the dashed box). It now shows the episode's own picture where the library has one for it.",
    "Films can now show a clear (transparent title) image on their On Demand page and poster, the same way TV shows do, once the scraper sends one. Nothing changes until it does."
  ],
  "history": [
    {
      "name": "Alpha 0.48.3",
      "date": "2026-11-16",
      "notes": [
        "Info is now a screen you can use, not just read. Up/Down move between its rows, Left/Right along a row, OK presses what is highlighted (gold) and Back goes back a step. OK no longer closes it.",
        "Buttons: Watch now (Keep watching if you opened Info while watching), Next episode for a series, and Hide this film / show.",
        "Cast: OK on a name lists everything else with them that this TV can play, with their part in each, and OK on one opens its Info. A small gold number on a photo says how many others there are. Films are all included; a series joins once its Info has shown its cast. Films now really get their cast from the library (it was being dropped on the way to the film channels).",
        "A gold line under the summary says when it is on next in the guides (\"Next on Kids Movies: 19:49\", or \"On now on ...\").",
        "A series shows its episodes in a row, starting at this one: the series numbers across the top, how many of that series are in your library, and the episodes the episode guide (data/epdb.json) knows but the library has not got shown dashed as \"Not in library\". OK plays an episode and carries on through the show.",
        "More like this: for a film, other films that share a genre, the same decade first; for a series, more shows on its channel. OK opens its Info, Back comes back.",
        "A film's title no longer shows its year twice."
      ]
    },
    {
      "name": "Alpha 0.48.2",
      "date": "2026-11-16",
      "notes": [
        "The bar you get with OK while watching has fewer, clearer buttons: Stop, Restart, Play/Pause, Next, then Guide, Sources, Audio & subs and Options. Guide opens a short list (TV Guide, Channel schedule, On Demand); Sources (only with Experimental on and an addon) holds Auto play from addons and Find sources. Up/Down pick in the list, OK runs it, Left/Right or Back close it.",
        "New Stop button: stops the programme and opens the TV Guide. Back from the guide joins the channel again where it is now.",
        "Skip adverts is no longer a separate button: during an ad break Next reads \"Skip adverts\"."
      ]
    },
    {
      "name": "Alpha 0.49.0",
      "date": "2026-11-20",
      "notes": [
        "Options > Experimental: new \"Magic Channels\" (off by default). Adds 35 themed channels built from the whole library, after the usual ones:",
        "The lineup is in tools/magic_channels.py (it writes tools/shows.json and channels.js), so a channel's shows can be changed without a new APK by editing shows.json."
      ]
    },
    {
      "name": "Alpha 0.48.1",
      "date": "2026-11-16",
      "notes": [
        "On Demand > hold OK > \"Choose the right show\" now really changes the show. The show is renamed to the one you pick, its episodes are filled in from that show (Magic EPG, the scrapers' episode guide, TVmaze) and the pictures change with it. The choice is remembered. \"Back to automatic\" puts the original name and episodes back. Scrape artwork, Choose a poster and Choose a background do not rename anything."
      ]
    },
    {
      "name": "Alpha 0.48.0",
      "date": "2026-11-16",
      "notes": [
        "Real world: a channel now plays only what is on at that time. You can still move around the guide as usual, but pressing OK on a programme that is not on now opens it in On Demand with a \"Play it now?\" Yes / No box. Yes plays that episode, No takes you back to the guide where you were. The box starts on No."
      ]
    },
    {
      "name": "Alpha 0.47.9",
      "date": "2026-11-15",
      "notes": [
        "Real world now lives day by day. Each show's run carries on where the last day stopped: today S01E01 and S01E02, tomorrow S01E03 and S01E04, and so on round the whole show. The change happens at midnight by the TV's own clock (UK time on a UK TV) and the guide updates by itself if it is open. Weekly channels move on once a week."
      ]
    },
    {
      "name": "Alpha 0.47.8",
      "date": "2026-11-15",
      "notes": [
        "Options > Experimental: new \"Real world\" (off by default). A show's episodes come in order down the guide (S01E01, S01E02 ...) instead of a shuffle, starting at the beginning of a season. Guide times do not change: each show keeps the slots it already had, and only which episode goes in each is decided. Programmes with no episode number (specials, one-offs, music, films) are left where they are. Turning it on or off restarts the guides. It works best with Magic EPG, which fills the gaps in a show's episode run."
      ]
    },
    {
      "name": "Alpha 0.47.7",
      "date": "2026-11-15",
      "notes": [
        "Magic EPG: the addons are now asked with the IMDb number the scraper found for each show (data/epdb.json has 704 of them), instead of searching TVmaze by name first. Shows the file has no number for still use the old lookup."
      ]
    },
    {
      "name": "Alpha 0.47.6",
      "date": "2026-11-15",
      "notes": [
        "Magic EPG: when none of your addons has an episode, the app now looks for it on archive.org (the same lookup Play Next uses, for that exact episode) and plays it if the link works, before skipping to the next programme. An episode with no addon source and no archive.org link is still skipped and remembered.",
        "Debug log lines for Magic EPG now start \"MAGIC EPG:\"."
      ]
    }
  ]
};
