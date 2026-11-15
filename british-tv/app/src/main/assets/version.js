// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.46.52",
  "version": "0.46.52",
  "code": 4652,
  "date": "2026-11-15",
  "notes": [
    "**Teletext: film of the day**: page **320** shows one film from your guide, chosen by the date (so it stays the same all day): year, certificate, running time, genres, the plot, the cast and which channels show it. The details are the TMDb ones the app already holds, so it needs no internet. Page **321** lists the other films with their years."
  ],
  "history": [
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
    },
    {
      "name": "Alpha 0.46.49",
      "date": "2026-11-15",
      "notes": [
        "**Teletext: other services**: page **900** lists teletext services you add yourself. A service is an https address of `.tti` page files, either one file holding many pages or an address with `{page}` in it (for example `https://example.com/p{page}.tti`). Add one by typing the address (page 990) or from your phone (page 991, same Wi-Fi). Its pages open in the same viewer, links and number pad work the same, the footer says whose pages they are, and Back returns to your list. Remove one with its `x91n` link. Only the address is kept; nothing from any service is bundled. Please only add services you have permission to use.",
        "Fix: the on-screen keyboard and messages now sit above the Teletext screen; Fastext links in `.tti` files are read as page numbers."
      ]
    },
    {
      "name": "Alpha 0.46.48",
      "date": "2026-11-15",
      "notes": [
        "**New: Teletext**: a Ceefax-style viewer inside the app. Hold OK on a programme in the guide and choose **Teletext**. Pages are built from your own guide: 100 index, 110 On now, 120 Tonight at 20:00, 130 Coming up next, 140 On this day (BBC Archive clips), 190 About. No coloured buttons needed: the arrows move between page numbers and the coloured links on the bottom row, OK opens one, hold OK brings up a number pad to type any page, Back goes to the page before and then out to the guide. Long pages turn over by themselves. Nothing outside the app is used."
      ]
    },
    {
      "name": "Alpha 0.46.47",
      "date": "2026-11-14",
      "notes": [
        "**Fix: an addon file played behind the On Demand screen**: choosing a source started the video but left On Demand covering it, so it looked as if nothing played. On Demand now closes first. Addon files also always use the app's own player, since they are often mkv files with Dolby audio that the web view cannot play."
      ]
    },
    {
      "name": "Alpha 0.46.46",
      "date": "2026-11-14",
      "notes": [
        "**Clear message when an addon cannot be added**: instead of a brief pop-up that was easy to miss, a screen now says why (could not reach it, or the address answered with an error) and stays until you press Back. The reason is also written to the debug log."
      ]
    },
    {
      "name": "Alpha 0.46.45",
      "date": "2026-11-14",
      "notes": [
        "**Fix: adding a Stremio addon failed with \"no answer\"**: the app only let its page reach a short list of sites (archive.org, TVmaze and so on), so an addon's own address was blocked before it was ever asked. The app now makes addon requests itself: https only, never to a private or local address, at most 3 MB back. This needs the new app version. Plain http addon links are no longer accepted. The phone add page now uses its own port (8767) so it cannot clash with Live view (8766)."
      ]
    },
    {
      "name": "Alpha 0.46.44",
      "date": "2026-11-14",
      "notes": [
        "**Scan a QR code to add an addon from your phone**: on the Add from your phone screen the TV now shows a QR code. Point your phone's camera at it and it opens the add page, with the code already filled in, so all you do is paste the addon link and press Send to TV. The address and code are still shown in words as a back-up. The code is made by the app itself (nothing downloaded) and changes with the TV's address."
      ]
    }
  ]
};
