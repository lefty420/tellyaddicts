// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.30",
  "version": "0.46.30",
  "code": 4630,
  "date": "2026-11-14",
  "notes": [
    "**Channel schedule fixes**: OK on any programme in the schedule now plays it (a later one starts from the beginning, like the guide does); before, only what was on right now did anything. \"Channel schedule\" also moves up to sit straight under On Demand in the guide's hold-OK menu."
  ],
  "history": [
    {
      "name": "Alpha 0.46.29",
      "date": "2026-11-14",
      "notes": [
        "**Smoother On Demand**: the big backdrop behind a show is now decoded in the background before it is shown, so moving along the rows no longer stalls while a large picture loads."
      ]
    },
    {
      "name": "Alpha 0.46.28",
      "date": "2026-11-14",
      "notes": [
        "**More American game shows blocked**: the MVG Productions Archive uploads (Joker's Wild, Sale of the Century, Big Jon's Price Is Right and Wheel of Fortune) are all US versions and were showing as the UK shows. All of them are now hidden."
      ]
    },
    {
      "name": "Alpha 0.46.27",
      "date": "2026-11-14",
      "notes": [
        "**Back from On Demand goes to the TV guide**: it used to drop you on the picture when On Demand had been opened from the remote or the OSD. Now Back always takes you to the guide."
      ]
    },
    {
      "name": "Alpha 0.46.26",
      "date": "2026-11-14",
      "notes": [
        "**YouTube picture in the guide's little TV**: videos played by the app's own player (all the YouTube ones, and some files) disappeared from the preview window when the guide opened, because that player draws behind the page. The picture now moves into the little TV and goes back to full screen when the guide closes. Needs the new app, not just a refresh."
      ]
    },
    {
      "name": "Alpha 0.46.25",
      "date": "2026-11-14",
      "notes": [
        "**Channel schedule**: a full list of everything on a channel with its start time and length, like a real EPG. Open it from the guide's hold-OK menu (Channel schedule), from the new Schedule button on the OSD, or from Options > TV Guide. Left/Right change the day (yesterday to a week ahead), Channel +/- change channel, OK watches what is on or plays an earlier programme from its start. It uses the colours of whichever guide theme you have, and on the phone the rows are tappable."
      ]
    },
    {
      "name": "Alpha 0.46.24",
      "date": "2026-11-14",
      "notes": [
        "**American Price Is Right blocked**: the US game show (hundreds of Barker-era episodes) was filling the TV. All of it is now hidden everywhere; Bruce's Price Is Right (the UK one) stays."
      ]
    },
    {
      "name": "Alpha 0.46.23",
      "date": "2026-11-14",
      "notes": [
        "**Fake Thomas episode blocked**: a fan-made \"A Very Evil Christmas\" upload was playing as a real Thomas and Friends episode on Children's Christmas. That upload is now blocked everywhere."
      ]
    },
    {
      "name": "Alpha 0.46.22",
      "date": "2026-11-14",
      "notes": [
        "**Not Seinfeld**: \"Comedians in Cars Getting Coffee\" was turning up on US Sitcoms as Seinfeld episodes. That upload is now blocked everywhere."
      ]
    }
  ]
};
