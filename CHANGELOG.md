# Changelog

Every release of Telly Addicts, newest first. This file is the only place the version is written
down: `tools/make_version.py` reads it and sets the version in the app and on the APK, so what the
TV shows under **Options > What's new** is always exactly this list.

Releases are named `Alpha 0.1`, `Alpha 0.2` and so on. A release that only fixes something in a
hurry gets a third number, `Alpha 0.1.1`.

## Alpha 0.6.1 — 2026-11-09

- The TMDB logo now sits beside their credit on a film's Info screen and in About & credits, which is what their terms ask for

## Alpha 0.6 — 2026-11-09

- **You can see the buffer working.** The on-screen bar now shows how far ahead the programme is loaded, behind the played part, and turns amber with "on this device" when the picture is genuinely coming off the box rather than straight from archive.org. Info spells it out in words
- The Movies channel is gone, its films having been split into Kids Films and The Video Shop. Saturday Night TV is channel 23 and The Video Shop is 24

## Alpha 0.5 — 2026-11-09

- **A film now plays only if it carries a certificate.** The scraped film list turned out to include pornography sitting next to the children's films, and nothing in the data told them apart, so a film with no certificate is not scheduled at all. Until certificates arrive the film channels find nothing and hide themselves
- Adult material is kept off every channel, whichever list it arrives on
- **New channel 25, The Video Shop**: the rental shelf, scheduled by certificate — family films through the day, 15s from eight, and the 18s only after nine, as they were on television. Checked minute by minute across a full day
- Kids Films and The Video Shop added to the genre lists, with no episode numbers demanded of either
- A film's certificate shows on its Info screen

## Alpha 0.4 — 2026-11-09

- Films on the Movies channel now have a proper Info screen: the poster, the plot, the year, the genres and the running time, all from the details the scraper gathers, so it appears at once with nothing to look up
- Film posters show on the on-screen bar and behind the guide
- New **About & credits** in Options, listing where everything comes from: archive.org, TVmaze, TMDB and the scraper
- Film details are stored once each rather than repeated on every listing, so posters and plots cost almost nothing to keep

## Alpha 0.3 — 2026-11-09

- **The guide can follow the clock.** A channel can now be laid out against the time of day instead of as one endless loop, so the same programme is on at the same time every day, and a programme can be made to start on the dot. Short items before it are cut to fit, the way continuity fills the run-up to the news, so there is never dead air
- **TV Archive replaces On This Day on channel 22**: television from today's date, whatever the year, with news bulletins at 1pm, 6pm and 10pm, and the BBC Archive clips still playing between them. Programmes dated to another day are left out; if nothing at all is dated today the channel plays everything rather than going dark
- **New channel 24, Saturday Night TV**: lighter shows at teatime, the shows the night was built around from seven to nine, and what followed them after that
- MTV and Disney take the scraper's own listings, with the shorts and the untitled blocks no longer thrown away for having no episode number ("Mickey Mouse — How to Sleep", "Yo! MTV Raps")
- Genre lists for MTV, Disney, Saturday Night and TV Archive, and the guard widened so MTV-only and Disney-only shows are no longer turned away from their own channels
- Stored listings for a channel that no longer exists are cleared out instead of sitting in storage for ever

## Alpha 0.2 — 2026-11-09

- New channel 23, **Movies**: films as they went out on telly or were taped off it, from the scraper's Movies category, with their own titles and real running times. It needs no archive.org lookups and works with Auto EPG on or off
- **Christmas Music was empty and now is not.** Every song was being thrown away for having no episode number; the same fault would have emptied Movies. Channels of songs and films no longer have one demanded of them
- Newly scraped shows reach their channel without waiting for a new app: the scraper's `routes.json` is merged with the genre lists, and the stored answer is rebuilt when either changes
- The Video Game Shows category was missing from the genre guard altogether, and Game Shows knew only 29 of its 116 shows, so it was turning away its own programmes. The guard's lists are now written from the genre lists instead of copied by hand, and Game Shows gets 118 of its own programmes back
- Options rows no longer lose their styling on every repaint

## Alpha 0.1 — 2026-11-09

The first named release. Everything built so far, gathered up:

- 21 channels built from archive.org, each a fixed loop timed by the clock, so a programme is "on" at the same point whenever you tune in
- Sky-style TV guide, scrollable weeks ahead, with a mini TV window and colour buttons; the app opens in the guide
- TV static for a moment on every channel change, and guide rows that fill in as channels load
- Tidy programme names with real episode titles looked up on TVmaze, and a poster, year, network, rating and summary behind Info
- On-screen bar on OK: TV Guide, rewind, play/pause, forward, Play Next, Restart, Info, Options
- Play Next finds the next episode from a local link database first and archive.org second, and carries on with what you were watching if it will not play
- Picture: Auto, 4:3, 16:9, Zoom, Stretch
- Enhancements: Off, VHS, Vivid, Sharp
- Adverts between programmes: Off, All, 1970s, 1980s, 1990s, matched to the channel, UK first, never BBC, including 119 hand-picked video game adverts
- Auto EPG (experimental), which builds every channel from the Telly Addict Scraper's library instead of the hand-picked sources, keeping every show in its own genre
- Keep listings for 24 hours, 48 hours, 1 week or 4 weeks, and a Refresh listings button to build them all afresh in a new running order
- Buffer the programme ahead of the picture on this device at 50, 100 or 250 MB, deleted the moment something else starts
- Links are kept for good and dropped only when they are dead, whatever the listings are set to
- I'm Off School and On This Day channels, and the scraper's library routed to ten channels by genre
- Faster and lighter on the TV: a fixed pool of network threads, archive.org metadata trimmed on the way in, and a cheaper guide repaint
