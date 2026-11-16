// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.48.2",
  "version": "0.48.2",
  "code": 4802,
  "date": "2026-11-16",
  "notes": [
    "The bar you get with OK while watching has fewer, clearer buttons: Stop, Restart, Play/Pause, Next, then Guide, Sources, Audio & subs and Options. Guide opens a short list (TV Guide, Channel schedule, On Demand); Sources (only with Experimental on and an addon) holds Auto play from addons and Find sources. Up/Down pick in the list, OK runs it, Left/Right or Back close it.",
    "New Stop button: stops the programme and opens the TV Guide. Back from the guide joins the channel again where it is now.",
    "Skip adverts is no longer a separate button: during an ad break Next reads \"Skip adverts\"."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.47.5",
      "date": "2026-11-15",
      "notes": [
        "Content: British now writes to the debug log which shows it hid and how many programmes, so a wrongly hidden show is easy to spot."
      ]
    },
    {
      "name": "Alpha 0.47.4",
      "date": "2026-11-15",
      "notes": [
        "Options > Experimental: new \"Content\" (Everything by default, or British). British hides the shows the scraper has flagged as never shown on UK TV (mostly US drama) from the guides, On Demand and Magic EPG; UK-made shows, US shows that aired here, and any show it is unsure about stay. It reads data/uk.json (flags with u:0 are the ones hidden), which the scraper has still to publish: until then nothing is hidden. Turning it on or off restarts the guides."
      ]
    }
  ]
};
