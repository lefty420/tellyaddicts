// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.45.23",
  "version": "0.45.23",
  "code": 4523,
  "date": "2026-11-12",
  "notes": [
    "**Less background work.** The loading-screen static kept redrawing nine times a second for as long as the app was open, and the start-up check kept waking four times a second; both now stop once the first channel is playing."
  ],
  "history": [
    {
      "name": "Alpha 0.45.22",
      "date": "2026-11-12",
      "notes": [
        "**70's, 80's and 90's TV channels are back.** They are built from the library, but the app only used the library for a channel whose published revision matched, and the scraper's index lists none for 80's and 90's (and a stale one for 70's), so all three came up empty and hid themselves. They now always take what the library routes to them."
      ]
    },
    {
      "name": "Alpha 0.45.21",
      "date": "2026-11-12",
      "notes": [
        "**Options from the guide.** The long-press menu on a programme in the TV guide now ends with Options, which closes the guide and opens the Options menu."
      ]
    },
    {
      "name": "Alpha 0.45.20",
      "date": "2026-11-12",
      "notes": [
        "**TV Archive is the On This Day channel again.** Daytime is now the BBC Archive On This Day clips, with the news at one, six and ten. The BBC News 24 recordings (which made up three quarters of the channel, with titles like \"145D5B6D-Business-Briefing\") are cut to one of each programme under a clean name, and anything dated is still kept only if it aired on today's date."
      ]
    },
    {
      "name": "Alpha 0.45.19",
      "date": "2026-11-12",
      "notes": [
        "**EPG debug can be opened from a browser, like the debug log.** The page now shows an address to open from a phone or computer on the same Wi-Fi, with the report for every channel at once: problems first, then each channel's next 24 hours."
      ]
    },
    {
      "name": "Alpha 0.45.18",
      "date": "2026-11-12",
      "notes": [
        "**Options redesigned as two panes.** A category list down the left (Watch, Picture, TV Guide, Artwork, Playback, Help & tools) and the chosen category's settings on the right. Up and Down choose a category, Right or OK goes in, Back returns to the list. A highlighted setting shows all its choices as buttons (Guide length: 24 hours, 48 hours, 1 week, 1 month) so you can see them without cycling, and Left and Right change it. EPG debug now sits under Help & tools."
      ]
    },
    {
      "name": "Alpha 0.45.17",
      "date": "2026-11-12",
      "notes": [
        "**No more three of the same show in a row.** The running order now mixes shows so the same one does not come round again straight away, and on the timetable channels (Saturday Night TV and the others) a programme that has already been on today is passed over for another. This fixes Noel's House Party playing three times in a row.",
        "**EPG debug (Options > EPG debug).** Shows how each channel's guide was built and what it will show for the next 24 hours, and flags problems such as the same show three times in a row, repeats within the day, or one show taking over. Left and right change channel."
      ]
    },
    {
      "name": "Alpha 0.45.16",
      "date": "2026-11-12",
      "notes": [
        "**The guide length now starts at 24 hours**, so a fresh install starts up quickly. Choose a longer one in Options > Guide length."
      ]
    },
    {
      "name": "Alpha 0.45.15",
      "date": "2026-11-12",
      "notes": [
        "**Guide length option (Options > Guide length): 24 hours, 48 hours, 1 week or 1 month.** It sets how much airtime each channel's guide covers before it repeats. For the everyday channels the app picks a varied mix of programmes (one from each show in turn, so no show takes over) from what the channel's rules already allow. Soaps, Saturday Night TV, The Video Shop, TV Archive and Drama, which follow a clock timetable, now lay out each day (or week) afresh instead of repeating the same 24 hours, for as many days as you choose. The default is 24 hours. On Demand is not affected and still lists everything."
      ]
    }
  ]
};
