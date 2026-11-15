// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.58",
  "version": "0.46.58",
  "code": 4658,
  "date": "2026-11-15",
  "notes": [
    "**Find sources and Auto play with debrid are now two separate things**, on the On Demand hold-OK menu, the guide's hold-OK menu and the on-screen bar:"
  ],
  "history": [
    {
      "name": "Alpha 0.46.57",
      "date": "2026-11-15",
      "notes": [
        "**On Demand menu**: the hold-OK item **Find sources** is now called **Auto play with debrid**, like the bar and the guide. It does what it did before: asks your addons and plays the best link."
      ]
    },
    {
      "name": "Alpha 0.46.56",
      "date": "2026-11-15",
      "notes": [
        "**Auto play with debrid from the bar and the guide**: while watching, the on-screen bar (OK) has a new **Auto play** button after On Demand; on the guide, hold OK on a programme and choose **Auto play with debrid**. Either one asks your addons for that episode (or film) and plays the best link by itself, closing the guide or bar. From the bar on something an addon is already playing it looks again and skips a saved link. It needs Experimental on and an addon installed; programmes without an episode number (like \"Top of the Pops\") say so."
      ]
    },
    {
      "name": "Alpha 0.46.55",
      "date": "2026-11-15",
      "notes": [
        "**Auto play with debrid**: the Find sources auto-play setting (Options > Experimental) is now called **Auto play with debrid** and is **on by default**. Find sources asks every addon you have installed (your debrid addon included), and plays the best link it scrapes by itself with nothing to choose: 1080p first, then 720p, and the next link if one fails. The separate \"Debrid links\" setting from 0.46.54 is gone: the addon does the debrid, the app just plays what it returns (links the debrid service has not cached yet are still skipped). Saved sources stay."
      ]
    },
    {
      "name": "Alpha 0.46.54",
      "date": "2026-11-15",
      "notes": [
        "**Find sources: debrid option and saved sources** (Options > Experimental):"
      ]
    },
    {
      "name": "Alpha 0.46.53",
      "date": "2026-11-15",
      "notes": [
        "**Fix: Find sources for films said \"Could not find this film\"**: the film lookup now (1) searches a film as its plain title (a title like \"Family Plot (1976)\" is searched as \"Family Plot\", and the year picks between films of the same name), (2) understands the newer way addons say they can search (`extraSupported`), and (3) if no addon can find the film, asks Stremio's public film catalogue (Cinemeta) for its IMDb number. What it tried and found is written to the debug log lines starting `ADDON film search` / `CINEMETA`."
      ]
    },
    {
      "name": "Alpha 0.46.52",
      "date": "2026-11-15",
      "notes": [
        "**Teletext: film of the day**: page **320** shows one film from your guide, chosen by the date (so it stays the same all day): year, certificate, running time, genres, the plot, the cast and which channels show it. The details are the TMDb ones the app already holds, so it needs no internet. Page **321** lists the other films with their years."
      ]
    },
    {
      "name": "Alpha 0.46.51",
      "date": "2026-11-15",
      "notes": [
        "**Teletext: weather and news**: page **300** is the weather now in six UK cities (London, Birmingham, Manchester, Cardiff, Glasgow, Belfast), **301** is a three-day forecast (from Open-Meteo). Page **310** is the news for today's date, taken from Wikipedia's \"On this day\" list, in a year from the timeline (1970 to 1999) that changes each day. Both need the TV online and say so if they cannot load. The app is now allowed to reach those two addresses only."
      ]
    },
    {
      "name": "Alpha 0.46.50",
      "date": "2026-11-15",
      "notes": [
        "**Teletext is now fully on the TV**: the \"other services\" pages (900, 990, 991) and anything to do with a phone are gone. Instead there is page **150** (a list of channels) and a schedule page for every channel, **200 plus its channel number** (for example 209 is channel 9), with times for what is coming up. Pages are built from your own guide, so everything works with no setup and no network."
      ]
    }
  ]
};
