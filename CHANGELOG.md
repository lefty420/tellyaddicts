# Changelog

Every release of Telly Addicts, newest first. This file is the only place the version is written
down: `tools/make_version.py` reads it and sets the version in the app and on the APK, so what the
TV shows under **Options > What's new** is always exactly this list.

Releases are named `Alpha 0.1`, `Alpha 0.2` and so on. A release that only fixes something in a
hurry gets a third number, `Alpha 0.1.1`.

## Alpha 0.51.4 — 2026-11-21
- Show page: the season chips no longer carry an unexplained number ("Season 2  6"); the heading above the episodes already says how many there are. "2 more" now sits on the heading line at the right instead of at the bottom, where it ran into the key legend.

## Alpha 0.51.3 — 2026-11-21
- TV Guide: with Interface size on Large the bottom channel row was cut off by the screen edge. The guide now shows as many rows as fit at the chosen size (6 on Large, 7 otherwise).

## Alpha 0.51.2 — 2026-11-20
- On Demand, from the design review: the hero now has Play and More info buttons (OK plays it, hold OK opens the show page), a year / seasons / genre line with the certificate in a small badge when it has one, and amber dots showing which of the five slides is on. The highlight ring on cards is now amber, 3 px with a gap. The rail has a Guide icon that jumps to the TV guide.

## Alpha 0.51.1 — 2026-11-20
- On Demand: the hero is now a large banner. At the top of the page (chips or hero) the show's backdrop fills the top two thirds of the screen, with its logo or a big title over it and one row below. Moving down into the rows shrinks it back to the compact layout.

## Alpha 0.51.0 — 2026-11-20
- On Demand reworked, in the style of Stremio / Nuvio. Top of the page: filter chips (All, TV, Films, Kids) and Search, with a rotating hero under them (five random shows with a backdrop, a new one every 7 seconds; Left and Right step it by hand; it pauses once you go down into the rows). A slim rail down the left (Home, Browse, Search, Options) opens when you press Left from the first card.
- New rows: **On now** (what is on each guide channel at this moment, with a LIVE tag, a progress bar and what is next; OK tunes to it), Continue watching, **My list**, then rows by genre (Drama, Kids' TV and cartoons, Films, Kids' films, Comedy, Game shows, Entertainment, Soaps, Music TV, Food and factual, Christmas, By the decade). Genre rows are built from the channel lists and loaded only as you get near them, so nothing is built up front. Each row remembers its position.
- Show page: buttons (Resume, Start from S1 E1, + My list), the seasons as chips, and one row of episode cards with their stills and a progress bar for the one you were part way through.
- Browse (the second icon on the rail): the channels down the left with their show counts, a 6-wide poster grid, and Sort (A-Z, newest, oldest), Decade and Hide watched across the top.
- Back goes: close the rail, then up to the top of the page, then out of On Demand. Opening On Demand while something is playing still lands on that show's page, and Back from it goes to the top.
- On Demand no longer loads every channel in the background when it opens; the search still does.

## Alpha 0.50.10 — 2026-11-20
- New in Options > Experimental: **Interface size** (Small, Normal, Large). Makes the whole app, guide, On Demand and Options included, about 8% smaller (room round the edges if your TV cuts them off) or 8% bigger (easier to read from the sofa). It changes at once, and Normal is exactly how it looked before. Needs Experimental on; turning Experimental off puts it back to Normal. Large shows slightly fewer guide rows.

## Alpha 0.50.9 — 2026-11-20
- New in Options > Experimental: **Loading screen**. Pick how the start-up TV looks: Classic (as before, the default), Set in the room (a bigger wooden set with rabbit ears over blurred artwork, a big TUNING on the glass), Whole screen (the picture is the TV, with the dials and tuning scale in a strip along the bottom), or Surprise me (one of the two new looks each start). It needs Experimental on and shows from the next start. Everything is drawn in screen-relative sizes, so it looks the same on 1080p and 4K.

## Alpha 0.50.8 — 2026-11-20
- Faster start: each channel's finished schedule (what plays when) is now kept on the device and read back at the next start, instead of being laid out again for all 60-odd channels. It is used only when the channel's list, the guide span, the Broadcast schedule setting and the app version are all the same; otherwise that channel is laid out again and kept. Live TV mode's daily episodes are still worked out at each start, so they move on as before. "Build every channel afresh" clears the kept schedules. The debug log shows how many were read and how many were laid out.

## Alpha 0.50.7 — 2026-11-20
- Magic EPG films: a guide channel now takes at most 800 programmes in all from the film database, like the missing episodes do, so a big film database cannot slow the guide down at start. On Demand still shows every film.

## Alpha 0.50.6 — 2026-11-20
- No more freezes in the minutes after start: On Demand used to get every channel ready in the background, and with Magic EPG each one froze the screen for a second or more while it sorted its shows, again and again for several minutes. Now only the channel you were watching and the channels in Continue watching are got ready. The rest load when you open them in On Demand, and search still covers every channel.
- The TV guide's day labels show the short month again ("Fri 20 Nov"). A second list of month names had been overwriting them with the long names.

## Alpha 0.50.5 — 2026-11-20
- Faster guide with Magic EPG on: each channel now gets at most 800 missing episodes (the earliest of each show, taken in turn) instead of every gap in every show. 80's and 90's TV were carrying over 20,000 programmes each, and all 66 channels were laid out again at every start, which froze the guide for half a minute after it opened. On Demand still lists every episode.

## Alpha 0.50.4 — 2026-11-20
- Info screen: the episode strip now shows each episode's real still (from the scraper's episode guide, else TVmaze) instead of a green box. Before, it only used an archive.org thumbnail, so most shows (Buffy, for one) showed empty boxes. The stills arrive a moment after the strip, and episodes that are not in the library yet get theirs too.

## Alpha 0.50.3 — 2026-11-20
- Two Options names no longer clash. In Guide, "Realistic TV schedule" is now **Broadcast schedule** (it sets when things air). In Experimental, "Real world" is now **Live TV mode** (a new episode each day, and a channel plays only what is on now). The Live TV mode help now says all of that.

## Alpha 0.50.2 — 2026-11-20
- The Christmas Movies channel now follows the watershed like the Video Shop: U, PG and 12 films through the day, 15s from eight, and 18s (Die Hard, Lethal Weapon and the like) only after nine at night. Before this it had no rules, so any film could air at any time.
- Magic EPG films with no certificate are no longer given PG on the Christmas channel (they are skipped, as on the Video Shop). The Kids Movies default of U stays.

## Alpha 0.50.1 — 2026-11-20
- Magic EPG films: a film with no certificate in the film database is now kept on the Kids Movies channel (as U) and the Christmas movie channels (as PG). The Video Shop and the Magic genre channels still skip it, because it could be an adult film.

## Alpha 0.50.0 — 2026-11-20
- Magic EPG now covers films. With Magic EPG on, every film in the new film database (`data/filmdb.json`, published by the scraper) appears in the film channels and the Magic movie channels even when no file was scraped for it. It plays through your addons, exactly like the missing TV episodes. Nothing changes until the scraper publishes the database.

## Alpha 0.49.16 — 2026-11-20
- On Demand home redesigned: a slimmer title area so two full rows fit, ten posters across each, and a count on the row ("3 of 140"). The channel badge and the fake "OK Open" button are gone.
- On Demand: a Search button in the header. Press Up from the top row to reach it and OK to search (Yellow still works, but most remotes have no Yellow). A search with no match now shows a page with "Search again" and "Back to browsing" instead of a short message.
- On Demand: key hints along the bottom, with what each key does.
- Show page: the season list and episode list say how many more there are ("▼ 20 more"), the episode list says "Season 1 · 43 episodes · 3 of 43", only the highlighted episode shows its picture and description (so six episodes fit), and an episode you can resume says so. With no artwork the poster is the same coloured tile as on the home page.
- Hold OK menu: Info, Search, Fix artwork…, Options and Hide on top level. Scrape artwork, Choose the right show, Choose a poster, Choose a background and Back to automatic are inside Fix artwork….

## Alpha 0.49.15 — 2026-11-20
- Options: the explanation of each setting now has its own strip under the panel, so it can no longer be pushed out of sight by a long list (it was cut off in TV Guide, Artwork and Experimental). The section heading stays at the top while the rows scroll under it.
- Options > Experimental: the rows that need Experimental (Addons, Use addons as a main source, Magic EPG, Join in progress) are greyed out while it is off, with a note on the Experimental row, instead of each saying "Turn Experimental on first".
- Guide: a cell now shows the show's name, with the episode code (S03E04) on the second line, so names are no longer cut short by the code. Cells too narrow for a whole word show a dot instead of half a word or "The". Cells holding several programmes say "3 programmes" instead of "+2 more". A tag such as "| [WRR]" is no longer part of the title.
- Playback bar: the show's name on top, then the episode code and title; "Next" the same.
- On Demand: five episodes show at once (was three), so a season of six no longer hides half the screen. The button says "Play from the start" instead of "Play S01E00".
- The update message now sits bottom right, so it no longer covers the Options hints or the playback bar.
- The hold-OK menu's heading reads "4 Classic BBC · 1 of 9" instead of running together in capitals.

## Alpha 0.49.14 — 2026-11-20
- Artwork is back on the "Please stand by" screen. A show or film with a backdrop shows the backdrop; one with only a poster shows it as a dim, blurred background (never as a framed poster) while the app looks for a backdrop, and swaps it in when one is found. Films need your TheTVDB key for that lookup.
- New in Options > Experimental: **Open debug address**. On, the debug log and Live view addresses have no code on the end, so the same plain address works every time. Anyone on your home network can then open them, so it is off unless you turn it on. This needs the app rebuilt and installed.

## Alpha 0.49.13 — 2026-11-20
- The "Please stand by" TV now comes and goes through static like a real set: a burst of snow when it comes up that clears to the picture, and the picture breaking into snow and fading out when the programme starts.

## Alpha 0.49.12 — 2026-11-20
- The screen shown while something starts to play now only ever shows a backdrop (fan art). A show or film with only a poster, such as Ace Ventura: When Nature Calls, now gets the tuned-to-static screen instead of a poster.
- Fixed the TMDB key check ("Could not reach TMDB to check the key"). The app's list of allowed web addresses did not include TMDB's lookups, so the check, and TMDB as the episode-list source, could never get an answer. This needs the app rebuilt and installed, not just a restart. TheTVDB was not affected.

## Alpha 0.49.11 — 2026-11-20
- Fixed Options moving the wrong way. In Experimental, pressing Down from Magic Channels went to Content and then back up to Real world, because the two were listed in a different order from the screen. In TV Guide, opening the section started on the second row (On Demand) instead of the top one. Down now always goes to the row below.

## Alpha 0.49.10 — 2026-11-20
- Quicker guide fill after start-up. Every channel waited for the "Content: British" list before its guide could be built. That list isn't published yet, so the request came back empty, but it queued behind the other downloads and took anywhere from 5 to 40 seconds. "Nothing published yet" is now remembered for six hours, and a new list is still picked up as soon as one is published.
- Laying out each channel's week (Real time EPG) does less repeat work: the season and episode of a programme are read once, not at every comparison. The schedules come out exactly the same.

## Alpha 0.49.9 — 2026-11-20
- Fixed the slow start. The metadata scrapers were not the cause: the app was sorting the whole 60,000-episode library on the TV itself, and doing it again every time On Demand loaded. Now each channel's sorted list is saved the first time and read back at the next start, and the sort works in small pieces so the tuning counter keeps moving instead of freezing.
- The channels now build with a short pause between each, so the "TUNING 0 / 66" count really counts up.
- The debug log has new START lines saying how many channel lists were found already saved and how many had to be built, so a slow start can be traced exactly.

## Alpha 0.49.8 — 2026-11-20
- Fixed 0.49.6 and 0.49.7, which broke start-up: a piece of the app that saves and reads everything kept on the TV was deleted by mistake, so the tuning screen showed no pictures or static and the guide never opened.
- Taken back out: the 60-day clear-out of saved artwork and episode guides added in 0.49.6. It went by when a file was last saved, not last used, so it could delete artwork the TV still shows. Anything it already removed is fetched again as needed, so the first start may be a little slower.

## Alpha 0.49.7 — 2026-11-20
- Fewer stutters just after the guide comes up. The background jobs that start a few seconds later (saving episode links for Play Next, and pre-loading On Demand) now wait until no button has been pressed for 4 seconds, and the link saving works in smaller pieces with longer gaps. Not yet tried on the Shield.

## Alpha 0.49.6 — 2026-11-20
- Magic EPG: when its episode list comes in several files and one of them does not arrive, what did arrive is used for this start but no longer saved as if it were the whole list (the missing shows stayed without filled-in episodes until the scraper sent a new one). Those files also get the library's longer download time (2 minutes, was 40 seconds).
- Buffering: if archive.org ignores a request to start part-way through a file and sends the whole thing, the TV no longer saves it at the wrong place (the picture after a jump could be garbage). It stops buffering that file instead.
- Faster start: the list of what is saved on the TV is read once per start, not again for every channel built (up to about 100 times with Magic Channels on).
- Saving no longer waits for each file to reach the disk.
- Tidy: removed the built-in copy of the channel lists (autodata.js, 450 KB, last updated by a tool no longer used), that tool (tools/import_scrape.py) and four one-time clean-ups that had long since done their job. With no published lists reachable, a channel now uses its live searches.
- New check: `node tools/test_libroute.js` tests how the library is sorted onto channels.
- Not yet tried on the Shield; the Java changes are compile-checked only.

## Alpha 0.49.5 — 2026-11-20
- The start-up loading screen no longer sits at "TUNING 0 / 66" for a minute. With Magic EPG on, every channel's running order took seconds to build and all 66 were built in one unbroken stretch, so the screen could not move and the count only jumped at the very end. Long stretches of building now give way to the screen every 40 ms or so, so the count climbs and buttons answer.
- The loading screen waits at most 10 seconds for every channel (it was 30). A box that is slower than that opens the guide with the first rows built, in guide order, and the rest fill in a moment later.

## Alpha 0.49.4 — 2026-11-20
- Guide: stepping onto the On Demand button no longer leaves the programme gold as well. One highlight at a time; moving back drops you where you were.
- Playback bar: a two-digit channel number (31, 32 ...) no longer sits on the gold edge when there is no picture beside it.
- On Demand: a show whose poster will not load now shows its name on the card instead of a blank tile.

## Alpha 0.49.3 — 2026-11-20
- Faster rebuild of the guides (first start, Refresh listings, turning Magic Channels on). Every channel build re-saved every film's details to the TV's storage even when nothing had changed, thousands of synced file writes with Magic Channels on. A film is now saved only when it differs from the copy already there, and checked once per start. Not yet timed on the Shield.

## Alpha 0.49.2 — 2026-11-20
- Faster start after the scraper sends a new library. The TV used to download and sort the whole library (12 MB) before the guide could open, every time a new one had been published (several times a day). It now opens on the lists it already has, then sorts the new library in the background once the guide is up, ready for the next start. New episodes from the scraper appear one start later. The very first start, Refresh listings and turning Magic Channels on still build everything first.

## Alpha 0.49.1 — 2026-11-20
- Fixed: the Christmas channels (Christmas TV, Children's Christmas and the four Christmas Magic Channels) were showing ordinary episodes. With Magic EPG on, one Christmas special pulled the rest of its show onto the channel, and Real world then played them in order. Christmas channels now get neither: no filled-in episodes, and their specials keep their shuffle.
- A Christmas episode now has to say Christmas (Christmas, Xmas, Santa, Boxing Day, Noel, panto ...) or be a British show that aired on 24, 25 or 26 December. Episodes marked only because they aired in Christmas week are left off: US cartoons and sitcoms that happened to air then (DuckTales, M.A.S.K., Benson, The Jeffersons) and anything on New Year's Eve or New Year's Day. About 1 in 6 fewer episodes on those channels.

## Alpha 0.49.0 — 2026-11-20
- Options > Experimental: new "Magic Channels" (off by default). Adds 35 themed channels built from the whole library, after the usual ones:
  Movies by genre (Action, Horror Night, Sci-Fi & Fantasy, Comedy, Crime & Thrillers, Drama & Romance, all keeping the watershed); TV: Sci-Fi & Fantasy, Cops & Detectives, Action Heroes, Period & Prestige Drama; Quiz Time, Challenge: Big Games; Sitcom Gold, Nineties Sitcoms & Cult Comedy, TGIF Family Sitcoms, Sketch Shows & Stand-up, Light Entertainment, Daytime & Talk, Factual & Features; kids: Saturday Morning Toons, 90s Toon Zone, Cartoon Classics, Children's TV Favourites, Toytown & Nursery, Teen TV; music: Pop & Chart, Rock & Alternative; soaps: Aussie Soaps, Street Life (UK), Dallas, Dynasty & Co; Kitchen Table; and four Christmas channels (Comedy, Soaps & Drama, Cartoons & Kids, Pop) that carry only the Christmas episodes. A show can be on a magic channel and its usual one. Turning it on or off restarts the guides.
- The lineup is in tools/magic_channels.py (it writes tools/shows.json and channels.js), so a channel's shows can be changed without a new APK by editing shows.json.

## Alpha 0.48.4 — 2026-11-20
- Fixed: the episodes row on Info never showed a thumbnail picture at all (only the dashed box). It now shows the episode's own picture where the library has one for it.
- Films can now show a clear (transparent title) image on their On Demand page and poster, the same way TV shows do, once the scraper sends one. Nothing changes until it does.

## Alpha 0.48.3 — 2026-11-16
- Info is now a screen you can use, not just read. Up/Down move between its rows, Left/Right along a row, OK presses what is highlighted (gold) and Back goes back a step. OK no longer closes it.
- Buttons: Watch now (Keep watching if you opened Info while watching), Next episode for a series, and Hide this film / show.
- Cast: OK on a name lists everything else with them that this TV can play, with their part in each, and OK on one opens its Info. A small gold number on a photo says how many others there are. Films are all included; a series joins once its Info has shown its cast. Films now really get their cast from the library (it was being dropped on the way to the film channels).
- A gold line under the summary says when it is on next in the guides ("Next on Kids Movies: 19:49", or "On now on ...").
- A series shows its episodes in a row, starting at this one: the series numbers across the top, how many of that series are in your library, and the episodes the episode guide (data/epdb.json) knows but the library has not got shown dashed as "Not in library". OK plays an episode and carries on through the show.
- More like this: for a film, other films that share a genre, the same decade first; for a series, more shows on its channel. OK opens its Info, Back comes back.
- A film's title no longer shows its year twice.

## Alpha 0.48.2 — 2026-11-16
- The bar you get with OK while watching has fewer, clearer buttons: Stop, Restart, Play/Pause, Next, then Guide, Sources, Audio & subs and Options. Guide opens a short list (TV Guide, Channel schedule, On Demand); Sources (only with Experimental on and an addon) holds Auto play from addons and Find sources. Up/Down pick in the list, OK runs it, Left/Right or Back close it.
- New Stop button: stops the programme and opens the TV Guide. Back from the guide joins the channel again where it is now.
- Skip adverts is no longer a separate button: during an ad break Next reads "Skip adverts".

## Alpha 0.48.1 — 2026-11-16
- On Demand > hold OK > "Choose the right show" now really changes the show. The show is renamed to the one you pick, its episodes are filled in from that show (Magic EPG, the scrapers' episode guide, TVmaze) and the pictures change with it. The choice is remembered. "Back to automatic" puts the original name and episodes back. Scrape artwork, Choose a poster and Choose a background do not rename anything.

## Alpha 0.48.0 — 2026-11-16
- Real world: a channel now plays only what is on at that time. You can still move around the guide as usual, but pressing OK on a programme that is not on now opens it in On Demand with a "Play it now?" Yes / No box. Yes plays that episode, No takes you back to the guide where you were. The box starts on No.

## Alpha 0.47.9 — 2026-11-15
- Real world now lives day by day. Each show's run carries on where the last day stopped: today S01E01 and S01E02, tomorrow S01E03 and S01E04, and so on round the whole show. The change happens at midnight by the TV's own clock (UK time on a UK TV) and the guide updates by itself if it is open. Weekly channels move on once a week.

## Alpha 0.47.8 — 2026-11-15
- Options > Experimental: new "Real world" (off by default). A show's episodes come in order down the guide (S01E01, S01E02 ...) instead of a shuffle, starting at the beginning of a season. Guide times do not change: each show keeps the slots it already had, and only which episode goes in each is decided. Programmes with no episode number (specials, one-offs, music, films) are left where they are. Turning it on or off restarts the guides. It works best with Magic EPG, which fills the gaps in a show's episode run.

## Alpha 0.47.7 — 2026-11-15
- Magic EPG: the addons are now asked with the IMDb number the scraper found for each show (data/epdb.json has 704 of them), instead of searching TVmaze by name first. Shows the file has no number for still use the old lookup.

## Alpha 0.47.6 — 2026-11-15
- Magic EPG: when none of your addons has an episode, the app now looks for it on archive.org (the same lookup Play Next uses, for that exact episode) and plays it if the link works, before skipping to the next programme. An episode with no addon source and no archive.org link is still skipped and remembered.
- Debug log lines for Magic EPG now start "MAGIC EPG:".

## Alpha 0.47.5 — 2026-11-15
- Content: British now writes to the debug log which shows it hid and how many programmes, so a wrongly hidden show is easy to spot.

## Alpha 0.47.4 — 2026-11-15
- Options > Experimental: new "Content" (Everything by default, or British). British hides the shows the scraper has flagged as never shown on UK TV (mostly US drama) from the guides, On Demand and Magic EPG; UK-made shows, US shows that aired here, and any show it is unsure about stay. It reads data/uk.json (flags with u:0 are the ones hidden), which the scraper has still to publish: until then nothing is hidden. Turning it on or off restarts the guides.

## Alpha 0.47.3 — 2026-11-15
- Magic EPG reads the scraper's own episode file (data/epdb.json, v2): several files when it is split (epdb-1.json ...), a new copy only when the revision in index.json changes, and each episode's running time when it has one. Until the scraper publishes it, the packed copy from tools/build_epdb.py is used (the tool no longer overwrites a v2 file).
- The episode database and the TV's own episode lists are kept in files, not the page's small storage.

## Alpha 0.47.2 — 2026-11-15
- Magic EPG now means the addons for everything: with it on, every episode and film in the guides is looked up with your addons first (the library link is only the fallback), and the diamond mark and "From your addons" line are gone.
- Magic On Demand: with Magic EPG on, On Demand lists every episode the scrapers know for each show (from data/epdb.json), not only the ones with a file, and plays them through your addons. An episode no addon has is skipped when you play it.
- Turning Magic EPG on or off restarts the guides, as before. Needs Experimental on and an addon.

## Alpha 0.47.1 — 2026-11-15
- Options > Experimental: new "Join in progress" (off by default). For programmes played from your addons (Magic EPG episodes, and everything when Use addons as a main source is on), the picture starts where the guide says the programme has got to, instead of from the beginning. The debug log says "joining ... at Ns" when it does.

## Alpha 0.47.0 — 2026-11-15
- Magic EPG (Options > Experimental, off by default): fills the channel guides with every episode of each show, not only the ones the library has a file for. Missing episodes are marked with a diamond, and play through your addons when the clock reaches them. If no addon has one, it says so and moves on to the next programme (and remembers, so it is left out next time).
- It reads one new file, `data/epdb.json`, packed from the scraper's per-show episode files by `python3 tools/build_epdb.py` (no internet needed). Shows with no entry fall back to the TV's own lookups from Options > Artwork > Episode lists from, done slowly in the background and used the next time the app starts.
- Needs Experimental on and an addon. Turning it on or off restarts the guides.

## Alpha 0.46.99 — 2026-11-15
- API keys from your phone: OK on "TheTVDB key" or "TMDB key" now shows a QR code. The phone page has a "Get your key" button that opens the sign-up page (thetvdb.com or themoviedb.org), then you paste the key and press Send. "Type it with the remote instead" is the second row.
- Needs the new APK (the phone page is part of the app).

## Alpha 0.46.98 — 2026-11-15
- Options > Artwork: "Episode lists from" now sits above the two keys, and its help text fits on one line.

## Alpha 0.46.97 — 2026-11-15
- Options > Artwork: new "Episode lists from" (TVmaze by default, or TheTVDB, or TMDB) and a "TMDB key" row beside the TheTVDB key, with an on-screen keyboard and a check when saved. A source with no key, or with no result, falls back to TVmaze.
- Groundwork for the Debrid EPG experiment (nothing uses the choice yet).

## Alpha 0.46.96 — 2026-11-15
- Guide header: the show name is big, with the episode ("S02E46 · Episode name") on the line under it; the series year is dropped.
- Guide cells and header clean up file-style names: dots/underscores become spaces, codec and release tags (HEVC, x265, 1080p, WEB-DL...) and leading track numbers go.
- Very narrow guide cells (under about 170 px) show the first word or a dot, with no arrows or "…".
- On Demand "OK Open" hint is bigger; the guide's episode line is bigger.

## Alpha 0.46.95 — 2026-11-15

- **A paused picture now dims too**: the five-minute dim only counted the guide, On Demand, the bar and the other panels, so a paused frame could sit on an OLED screen for hours. A paused programme now fades to the dim after five minutes with no key pressed, like any other still screen.
- **VHS OLED has no fixed edge tint**: the VHS look adds a faint red strip down the left edge and a blue one down the right. In VHS OLED they stayed in the same place for ever, so those pixels wore differently from the rest. The tint is now left out in VHS OLED (the normal VHS look keeps it).
- **The key that wakes a dimmed screen only wakes it**: before, pressing OK to bring the guide back also pressed OK on the highlighted programme and tuned to it. The first key is now used up waking the screen.

## Alpha 0.46.94 — 2026-11-15

- **Subtitle diagnostics**: after you choose a subtitle track, the debug log now records the first few subtitle lines the player delivers ("SUBTITLE cue: 1 text, 0 picture, 38 characters"), with no words from the film. If a subtitle track is selected but nothing shows, the log now says whether the player sent nothing (an empty or forced-only track) or the screen failed to draw it.

## Alpha 0.46.93 — 2026-11-15

- **English sound first**: when a file has several sound tracks, the app's own player now picks the English one unless you have chosen another language in Audio & subtitles. Before, it took whichever the file listed first, so a Lethal Weapon with Turkish and English tracks played in Turkish. If a file has no English track it plays as before. A language you choose is still kept for the next programme.

## Alpha 0.46.92 — 2026-11-15

- **Screen dims when left on a still screen**: with the TV Guide, On Demand, the bar, Info, Options, Teletext or a menu open and no key pressed for five minutes, the screen fades to a dim. Any key (or a touch on the phone) brings it back at once. A screen that stays put wears an OLED panel far more than moving video, so this matters most for OLED TVs. Nothing changes while a programme plays with nothing open.
- **VHS OLED lines are softer** (lighter, a smaller step between line and gap), so they put less uneven wear on a panel. The VHS look itself is unchanged.

## Alpha 0.46.91 — 2026-11-15

- **VHS OLED made fairer**: which of the two line positions shows now comes from the clock (a new one every ten minutes), not from when the app started. Before, every start began in the same position, so short viewings could leave one set of pixel rows dimmed far more than the other. The lines are also now a whole, even number of device pixels apart, so the swap lands exactly on pixel rows.

## Alpha 0.46.90 — 2026-11-15

- **VHS OLED**: a new picture look, first in the list after Off (Options > Picture). It is the VHS look, but the scanlines swap places with the gaps between them every ten minutes (and when a new video starts, after two minutes), so no row of pixels on an OLED TV is always the dimmed one. The other looks are unchanged.

## Alpha 0.46.89 — 2026-11-15

- **Films played from an addon keep their own details**: a film started from your addons lost its link to the library's film record (the TMDb plot, cast and poster), so Info and the artwork looked it up as a TV show by name. "Lethal Weapon" could pick up the 2016 series, "Jumanji" the cartoon. It now keeps the library's film record, also when replayed from Saved sources.
- **Film backdrops never come from a TV show**: a film's picture is its own poster, or one you chose by hand. A TV show with the same name (Jumanji, Police Academy, Back to the Future, Dumb and Dumber) is no longer used for its backdrop.

## Alpha 0.46.88 — 2026-11-15

- **Saved film sources cleared once**: the app remembers the source that last worked for each title and plays it again without searching, so the wrong *Blackadder's Christmas Carol* link would have kept playing for Mickey's Christmas Carol for three days even after 0.46.87. Sources saved for films (in the replay memory and in Options > Saved sources) are forgotten one time, and looked up again with the stricter search. Saved sources for series are untouched.

## Alpha 0.46.87 — 2026-11-15

- **Wrong film from an addon**: Mickey's Christmas Carol played *Blackadder's Christmas Carol* with a green ADDON badge. When the film search found no result with the right name, the app took the first result, whatever it was, and remembered it. It now only accepts the same name (or a close name with the same year) and otherwise says it could not find the film, so the library copy plays instead. Films matched wrongly before are forgotten, so they are looked up again.

## Alpha 0.46.86 — 2026-11-15

- **Rescrape a film from the TV Guide**: "Fix artwork & details" on a film used to say "Films use the details that came with them" and do nothing. It now opens that film's artwork menu in On Demand: Scrape artwork, Choose the right film (for when the wrong film was matched), Choose a poster or background. Film artwork needs the TheTVDB key (Options > Artwork), as in On Demand.

## Alpha 0.46.85 — 2026-11-15

- **Oswald the Lucky Rabbit** (about 365 cartoons in the library) is now on the Disney channel too.

## Alpha 0.46.84 — 2026-11-15

- **More Disney shorts**: the library's "Walt Disney Cartoon", "Silly Symphony", "Disney Classic" and "Disney Cartoon" uploads were on no channel. They are now on the Disney channel (about 580 more shorts). This comes from the show list, so it reaches the TV at the next start even before this version is installed.
- **Game Shows takes dated episodes**: a quiz show with no episode number now plays on Game Shows when it is dated 1999 or earlier, by its air date or a date in the file name ("Blockbusters - 1:21:82", "Fifteen to One - TX 15 January 1988"). That adds about 450 programmes: Blockbusters, Supermarket Sweep, Fifteen to One, Bullseye, University Challenge and others. Undated files still stay off, which keeps namesakes and fan videos out.

## Alpha 0.46.83 — 2026-11-15

- **Audio & subtitles**: a new button on the bar (next to Options) lets you pick the sound track and turn subtitles on or off, like other media players. It shows up when the file has more than one sound track or any subtitles. Each choice shows the language and details such as "Dolby Digital, 5.1", "Commentary", "Forced" or "SDH". Both text subtitles and picture subtitles (DVD/Blu-ray style) are drawn over the picture, and move above the bar while it is open.
- **Your choice carries on**: the sound language and subtitle setting you pick are kept, so the next programme starts the same way when it has a matching track. Turn subtitles off in the same menu to stop them.
- Only the app's own player can see the tracks inside a file. Addon files and anything with Dolby/DTS sound already play there; plain archive files play in the web view, which has one sound and no subtitles, so the button stays hidden for those. Options > Videos that won't play > Always sends everything to the app's own player.

## Alpha 0.46.82 — 2026-11-15

- **Debug log keeps your debrid key out**: addon and debrid addresses are now written down as just the site's name (for example `torrentio.strem.fun/…`), and any long key-shaped run of letters and digits is blanked. Before, a Torrentio-style link (`…/realdebrid=KEY/…`) went into the log whole. Logs already saved on the TV are cleaned the first time this version starts.
- **Live view and the shared log need the code on screen**: the Live view code is now 10 random characters instead of 4 digits, so it can no longer be guessed. The shared debug log (and the EPG and gaps pages) now has a code in its address too; before, anyone on the same Wi-Fi could read it. Open the address exactly as the TV shows it, including the part after the question mark.

## Alpha 0.46.81 — 2026-11-15

- **Tiny guide cells**: a programme cell only a few letters wide no longer shows a useless "Sc..." or "O...". It shows the first word if that fits, otherwise a dot; the full title is in the big header when you focus it.
- **Update message moved**: "Updated to Alpha ..." now appears at the bottom of the screen instead of over the TV Guide header and clock.

## Alpha 0.46.80 — 2026-11-15

- **Shorter hold-OK menu on a programme**: Fix artwork, Hide this show/film and Report a problem now sit behind one "More..." entry (Back returns to the main menu). Options stays last. When a menu has more entries than fit, its heading says which one you are on ("item 10 of 11").
- **Bigger supporting text**: the small lines under menu entries, the dates inside guide cells, On Demand's menu and the Options hints at the bottom are a little larger, so they read from across the room.

## Alpha 0.46.79 — 2026-11-15

- **The debug log now times the scraper's library**: how long it took to download, to read and to sort into channels. Nothing changes on screen; it is there to show what the library really costs on this TV.

## Alpha 0.46.78 — 2026-11-15

- **The debug log hides more of an addon's address**: an addon whose settings are a 36-character ID (the AIOStreams style) now shows as ... in the log and live view, like the long ones already did. Lines saved by earlier versions are cleaned when the log loads.

## Alpha 0.46.77 — 2026-11-15

- **The "Scraping your debrid..." message goes away** when you change channel while it is still looking.
- **One ranking for addon links**: Find sources and Use addons as a main source now pick the best link the same way (English audio first, the release group that worked last time, then 1080p over 720p). The unused debrid switch behind the old code is gone.
- **Teletext page text moved out of app.js** into its own file (ttpages.js), about 200 lines. Nothing changes on screen.

## Alpha 0.46.76 — 2026-11-15

- **Saved sources opens again** (Options > Experimental): two things in the app shared a name, so the screen could not start.
- **Use addons as a main source keeps your place in On Demand**: Next goes to the right episode, also when the library link has to take over.
- **Use addons as a main source waits at most 6 seconds on the loading screen** before falling back to the library.

## Alpha 0.46.75 — 2026-11-15

- **Source badge on the OSD**, beside the channel name: a blue ARCHIVE.ORG badge when the programme plays from the archive, and a green ⚡ ADDON badge (with the quality, such as 1080p, when the addon says) when it plays from an addon link.

## Alpha 0.46.74 — 2026-11-15

- Use addons as a main source no longer puts the NO SIGNAL screen up while it looks: at start-up it uses the normal loading screen, and after that a small "Scraping your debrid..." message appears over the picture.

## Alpha 0.46.73 — 2026-11-15

- **New experimental option: Use addons as a main source** (Options > Experimental; needs Experimental on and an addon on). With it on, every programme with an episode number, and every film, is first looked up with your addons and plays from the best link they find. While it looks, the loading screen (at start-up) or a "Scraping your debrid..." message (when you change channel or move on) is shown. If the addons find nothing in about 15 seconds, or the link will not play, the library link plays instead. It plays from the start of the programme rather than joining part way through, and when it ends the channel carries on to its next programme. Off by default.

## Alpha 0.46.72 — 2026-11-15

- **OSD buttons wrap round**: pressing Left on the first button (TV Guide) goes to the last (Options), and Right on Options goes back to TV Guide.

## Alpha 0.46.71 — 2026-11-15

- Auto play with debrid and Find sources show in the long-press menus only when Experimental and an addon are on, as in 0.46.70 (a change to always show them was withdrawn).

## Alpha 0.46.70 — 2026-11-15

- **300 more shows on the channel lists** (from the scraper): CITV +76, US sitcoms +44, Drama +34, 70s TV +29, Off School +18, Game shows +16, TV archive +15, Sitcoms +14, Comedy +14, Children's +13, Music +12, Soaps +10, Cooking +5. They appear on each channel as the scraper finds episodes for them.

## Alpha 0.46.69 — 2026-11-15

- **Channels renumbered into groups** (the channels themselves are unchanged; only their numbers move):
  - **1–3 Music**: Music, MTV, Video Games
  - **4–9 Classic TV**: Classic BBC, ITV, ITV Morning, 70's TV, 80's TV, 90's TV
  - **10–14 Comedy and entertainment**: Classic Sitcoms, US Sitcoms, Comedy, Entertainment, Game Shows
  - **15–19 Drama and soaps**: Drama, US Drama, Soaps, Noel's House Party, Saturday Night TV
  - **20–22 Films**: The Video Shop, Kids Movies, Christmas Movies
  - **23–27 Kids**: CITV, Children's World, I'm Off School, Disney, Children's Christmas
  - **28–32 The rest**: Food & Cooking, TV Archive, Christmas TV, Christmas Music, Adverts
  Remembered things (the last channel, Saved sources, On Demand choices) follow the channel, not its number, so they carry over. Teletext schedule pages move with the numbers (page 200 plus the channel number).

## Alpha 0.46.68 — 2026-11-15

- **Fix: the bottom of the guide was cut off**: the guide's rows are a little shorter, so the last row clears the bottom edge of the screen.
- **Fix: Options stuck out of the on-screen bar**: the **Info** button is removed from the bar (hold OK on the guide or On Demand still has Info) and the buttons sit a little closer together, so all of them fit inside the bar.
- **Fix: films played the wrong version**: Find sources and Auto play for a film now use the film's year (as well as its name) to pick it, so "Robin Hood" finds the right Robin Hood.
- **Auto play prefers English-only links**: links that say English only come first, then links that say nothing about language, and last links that are English plus other languages (a dual-audio link with Hindi first could still play the Hindi track).
- **Privacy**: the debug log no longer writes down the long settings part of an addon's address (it holds your debrid key), and older lines already in the log are cleaned when the app starts. If you shared the live-view page or log before this version, your debrid key was in it: it is worth making a new key on your debrid account.

## Alpha 0.46.67 — 2026-11-15

- **New channel: US Drama (32)**: American drama from 1970 to 1999 as shown in the UK (Columbo, Magnum PI, The A-Team, Miami Vice, Hill Street Blues, The X-Files, Quantum Leap, Buffy and more, 38 shows), modelled on US Sitcoms. Like US Sitcoms it stays hidden until the scraper has put its list (`usdrama`) in the data. It has its own show list for the genre check and the Auto EPG searches, runs episodes of about 30 to 70 minutes, and gets prime-time adverts like the other drama channels.

## Alpha 0.46.66 — 2026-11-15

- **Teletext: play a programme**: on the pages that list programmes (110 On now, 120 Tonight, 130 Coming up next, and each channel's schedule page 2xx), the arrows now also step down the programme rows, and OK on one asks **Play it? Yes / No**. Yes closes Teletext and plays it (joined where it is now if it is on, otherwise from its start); No goes back to the page. Tapping a row on a phone does the same.

## Alpha 0.46.65 — 2026-11-15

- **Logo on the phone page**: the page that opens on your phone to send an addon link to the TV now shows the Telly Addicts logo at the top.

## Alpha 0.46.64 — 2026-11-15

- **Hold-OK menu on the channel schedule**: hold OK on a programme in a channel schedule to get **Auto play with debrid**, **Find sources** and **Options** (the first two appear when Experimental is on and an addon is installed; hold OK used to just close the schedule, Back still does).

## Alpha 0.46.63 — 2026-11-15

- **Polish links caught**: a stand-alone `PL` in a result's text (as in `Show.S01E01.PL.1080p`), or LEKTOR, NAPISY, PLDUB, is now read as Polish audio, so with Audio language on English only those links are greyed out and tagged `[PO]`. A link that also says ENG or Multi is kept.

## Alpha 0.46.62 — 2026-11-15

- **Russian links caught**: addon results in Russian are now recognised by their Cyrillic letters and by the usual Russian release names and sites (LostFilm, HDRezka, NewStudio, Kerob, Rutor and so on, or RUS), so with Audio language on English only they are greyed out and never auto-played. Links that clearly say English now also rank ahead of links that say nothing about language.

## Alpha 0.46.61 — 2026-11-15

- **Audio language for addon links** (Options > Experimental > **Audio language**, default **English only**): the app now reads the language flags and words addons put in their results (the French or German flag, FRENCH, VOSTFR, ITA, LATINO and so on). A link that names another language and no English is greyed out ("French audio") so Auto play with debrid never picks it, and in the Find sources list it is tagged like `[FR]`. Links that say nothing about language, and Multi or Dual Audio ones, are kept. Words that are part of the title itself (The Italian Job) are ignored. Set it to **Any** to take everything.

## Alpha 0.46.60 — 2026-11-15

- **Guide menu**: **Watch now** is removed from the hold-OK menu (plain OK on a programme still joins it where it is now).

## Alpha 0.46.59 — 2026-11-15

- **Options at the bottom of every hold-OK menu**: the guide's and On Demand's long-press menus now end with **Options**. It is moved to the end, not added again, so it appears once (before it sat in the middle of the list).

## Alpha 0.46.58 — 2026-11-15

- **Find sources and Auto play with debrid are now two separate things**, on the On Demand hold-OK menu, the guide's hold-OK menu and the on-screen bar:
  - **Find sources** only asks your addons and shows what they found, so you choose.
  - **Auto play with debrid** asks them and plays the best link by itself (reusing a link that worked in the last three days, trying the next if one fails, and carrying on to the next episode of a show).
  The "Auto play" setting in Options > Experimental is gone, since each button now does its own thing.

## Alpha 0.46.57 — 2026-11-15

- **On Demand menu**: the hold-OK item **Find sources** is now called **Auto play with debrid**, like the bar and the guide. It does what it did before: asks your addons and plays the best link.

## Alpha 0.46.56 — 2026-11-15

- **Auto play with debrid from the bar and the guide**: while watching, the on-screen bar (OK) has a new **Auto play** button after On Demand; on the guide, hold OK on a programme and choose **Auto play with debrid**. Either one asks your addons for that episode (or film) and plays the best link by itself, closing the guide or bar. From the bar on something an addon is already playing it looks again and skips a saved link. It needs Experimental on and an addon installed; programmes without an episode number (like "Top of the Pops") say so.

## Alpha 0.46.55 — 2026-11-15

- **Auto play with debrid**: the Find sources auto-play setting (Options > Experimental) is now called **Auto play with debrid** and is **on by default**. Find sources asks every addon you have installed (your debrid addon included), and plays the best link it scrapes by itself with nothing to choose: 1080p first, then 720p, and the next link if one fails. The separate "Debrid links" setting from 0.46.54 is gone: the addon does the debrid, the app just plays what it returns (links the debrid service has not cached yet are still skipped). Saved sources stay.

## Alpha 0.46.54 — 2026-11-15

- **Find sources: debrid option and saved sources** (Options > Experimental):
  - **Debrid links**: for addons you have set up with your own debrid account (Real-Debrid, AllDebrid, Premiumize, TorBox and similar, as Torrentio-style addons tag them, for example `[RD+]`). **Debrid first** (the new default) tries those links before any others and auto-plays one as soon as a 720p or better one arrives. **Debrid only** greys out everything else. **Off** treats them like any other link. Links the debrid service has not cached yet (`[RD download]`) are never played, because they would only show a waiting video.
  - **Saved sources**: every source that works is recorded (up to 100 titles, newest first). Options > Experimental > Saved sources lists them with the quality, addon and how long ago; OK plays one again straight away. A saved source is also reused automatically for three days (it was one hour) when you use Find sources on the same title; if the link has died the app looks again by itself. Debrid links in the list are marked.

## Alpha 0.46.53 — 2026-11-15

- **Fix: Find sources for films said "Could not find this film"**: the film lookup now (1) searches a film as its plain title (a title like "Family Plot (1976)" is searched as "Family Plot", and the year picks between films of the same name), (2) understands the newer way addons say they can search (`extraSupported`), and (3) if no addon can find the film, asks Stremio's public film catalogue (Cinemeta) for its IMDb number. What it tried and found is written to the debug log lines starting `ADDON film search` / `CINEMETA`.

## Alpha 0.46.52 — 2026-11-15

- **Teletext: film of the day**: page **320** shows one film from your guide, chosen by the date (so it stays the same all day): year, certificate, running time, genres, the plot, the cast and which channels show it. The details are the TMDb ones the app already holds, so it needs no internet. Page **321** lists the other films with their years.

## Alpha 0.46.51 — 2026-11-15

- **Teletext: weather and news**: page **300** is the weather now in six UK cities (London, Birmingham, Manchester, Cardiff, Glasgow, Belfast), **301** is a three-day forecast (from Open-Meteo). Page **310** is the news for today's date, taken from Wikipedia's "On this day" list, in a year from the timeline (1970 to 1999) that changes each day. Both need the TV online and say so if they cannot load. The app is now allowed to reach those two addresses only.

## Alpha 0.46.50 — 2026-11-15

- **Teletext is now fully on the TV**: the "other services" pages (900, 990, 991) and anything to do with a phone are gone. Instead there is page **150** (a list of channels) and a schedule page for every channel, **200 plus its channel number** (for example 209 is channel 9), with times for what is coming up. Pages are built from your own guide, so everything works with no setup and no network.

## Alpha 0.46.49 — 2026-11-15

- **Teletext: other services**: page **900** lists teletext services you add yourself. A service is an https address of `.tti` page files, either one file holding many pages or an address with `{page}` in it (for example `https://example.com/p{page}.tti`). Add one by typing the address (page 990) or from your phone (page 991, same Wi-Fi). Its pages open in the same viewer, links and number pad work the same, the footer says whose pages they are, and Back returns to your list. Remove one with its `x91n` link. Only the address is kept; nothing from any service is bundled. Please only add services you have permission to use.
- Fix: the on-screen keyboard and messages now sit above the Teletext screen; Fastext links in `.tti` files are read as page numbers.

## Alpha 0.46.48 — 2026-11-15

- **New: Teletext**: a Ceefax-style viewer inside the app. Hold OK on a programme in the guide and choose **Teletext**. Pages are built from your own guide: 100 index, 110 On now, 120 Tonight at 20:00, 130 Coming up next, 140 On this day (BBC Archive clips), 190 About. No coloured buttons needed: the arrows move between page numbers and the coloured links on the bottom row, OK opens one, hold OK brings up a number pad to type any page, Back goes to the page before and then out to the guide. Long pages turn over by themselves. Nothing outside the app is used.

## Alpha 0.46.47 — 2026-11-14

- **Fix: an addon file played behind the On Demand screen**: choosing a source started the video but left On Demand covering it, so it looked as if nothing played. On Demand now closes first. Addon files also always use the app's own player, since they are often mkv files with Dolby audio that the web view cannot play.

## Alpha 0.46.46 — 2026-11-14

- **Clear message when an addon cannot be added**: instead of a brief pop-up that was easy to miss, a screen now says why (could not reach it, or the address answered with an error) and stays until you press Back. The reason is also written to the debug log.

## Alpha 0.46.45 — 2026-11-14

- **Fix: adding a Stremio addon failed with "no answer"**: the app only let its page reach a short list of sites (archive.org, TVmaze and so on), so an addon's own address was blocked before it was ever asked. The app now makes addon requests itself: https only, never to a private or local address, at most 3 MB back. This needs the new app version. Plain http addon links are no longer accepted. The phone add page now uses its own port (8767) so it cannot clash with Live view (8766).

## Alpha 0.46.44 — 2026-11-14

- **Scan a QR code to add an addon from your phone**: on the Add from your phone screen the TV now shows a QR code. Point your phone's camera at it and it opens the add page, with the code already filled in, so all you do is paste the addon link and press Send to TV. The address and code are still shown in words as a back-up. The code is made by the app itself (nothing downloaded) and changes with the TV's address.

## Alpha 0.46.43 — 2026-11-14

- **Add an addon from your phone** (experimental): Options > Experimental > Addons > Add from your phone. The TV shows an address and a 4-digit code. Open the address in a browser on a phone or computer on the same Wi-Fi, type the code, paste the addon link and press Send to TV. The TV then checks the addon and shows what it is before it is installed. The page only runs while that screen is open, and five wrong codes lock it. (Needs this new app version: it is the first time the app has been able to receive anything from a phone.)
- **Add-an-addon screen now fits**: the keyboard's Add button had the whole instruction written on it and overflowed; it now just says Add. The keyboard has a row for the characters a web address needs (. : / ? = & % @ + ~), and long addon names and addresses are trimmed to fit the header.

## Alpha 0.46.42 — 2026-11-14

- **Addon auto-play: quicker and steadier** (experimental): it no longer waits for the slowest addon. As soon as a 1080p source arrives (or one from the release group that played the last episode), it plays. Otherwise it waits for all addons, up to 8 seconds, and plays the best. The source that worked for an episode is remembered for an hour, so coming back goes straight to it, and if it has stopped working the addons are asked again. When an episode ends, auto-play looks for the next episode, preferring the same release group (same quality and language) as the one before.

## Alpha 0.46.41 — 2026-11-14

- **Experimental: Auto-play best source**: Options > Experimental > Auto-play best source (off by default). With it on, Find sources plays the best working source straight away (1080p, then 720p, skipping torrents and other things that cannot play here). If that source fails, the next best is tried, and so on; when none work it tells you and goes back to On Demand. Picking a source by hand also falls back to the ones below it.

## Alpha 0.46.40 — 2026-11-14

- **Experimental: Stremio addons (first version)**: Options > Experimental. Turn it on, then Addons > Add an addon and type the link of a Stremio addon (it ends in manifest.json; stremio:// links work too). The app ships with no addons and recommends none. Addons can be turned on or off, moved up or down, tested and removed. On Demand's hold-OK menu gets **Find sources**: your addons are asked, with only the title's IMDb number, for streams, listed best first (1080p, then 720p). OK plays a direct web link or YouTube video. Torrents, usenet, archives and website links are shown greyed and never start. Only https addresses (http on your own network), adult-flagged addons are refused, and "Only before 2000" keeps it to what this app is about. Films need an addon with a film search to find their number. Not yet: addon catalogs in On Demand, auto-play, subtitles, special-header streams.

## Alpha 0.46.39 — 2026-11-14

- **The guide comes back where you left it**: press Back to go to the picture, then open the guide again, and it opens on the same channel, rows and time you had selected instead of jumping back to what is playing and scrolling the list. If you started something else, or it was more than ten minutes ago, it opens on what is playing as before.

## Alpha 0.46.38 — 2026-11-14

- **PLAYING marker made small**: the red tag on the programme you are watching took up most of a narrow guide cell and hid its title. It is now just a small red ▶ badge; the red outline and the channel marker stay.

## Alpha 0.46.37 — 2026-11-14

- **Start-up TV moves again, and shows the real tuning**: the last change drove the needle, knobs and picture from the page itself, which is frozen while the guides are being built, so on the TV nothing moved. The needle, knobs, static and pictures are back on their own animations (they keep going while the app is busy), and the real progress is added on top: a green bar fills along the scale and the label counts the channels that have finished (TUNING 7 / 16), with a flash of colour bars as each locks on.

## Alpha 0.46.36 — 2026-11-14

- **What's playing is marked in the guide**: the programme you are watching now carries a red PLAYING tag (like NOW in the channel schedule), and its channel has a red marker, so it stands out from everything else that is on right now.

## Alpha 0.46.35 — 2026-11-14

- **American Thomas blocked**: the "Model Series (US Restored)" upload (and the other US Thomas uploads: George Carlin, Ringo Starr US, US VHS, US CGI) were playing as the real Thomas and Friends. All ten are now hidden; the UK ones stay.

## Alpha 0.46.34 — 2026-11-14

- **Start-up TV follows the real tuning**: the needle on the little TV's scale now moves along as channels really finish loading, the knobs click round one step for each, the pictures are labelled with the numbers of channels that have actually loaded, and the colour bars flash as each one locks on (and stay when every channel is in). Before, it all just looped on a timer.

## Alpha 0.46.33 — 2026-11-14

- **No blue bar over the loading screen**: the channel/programme bar that flashes up when something starts no longer sits on top of the "please stand by" loading screen; the loading screen covers it.

## Alpha 0.46.32 — 2026-11-14

- **Realistic TV schedule is on by default**: new installs, and anyone who had never touched the setting, now get the real-week layout. If you had switched it off yourself it stays off. The guides rebuild once after the update.

## Alpha 0.46.31 — 2026-11-14

- **Clearer Options**: confusing settings now say what they do. *Video player* is now **Videos that won't play** (Automatic / Never / Always, and "rescued 5 videos so far" instead of "(5 files)"), *Buffer* is **Download ahead**, *Enhancements* is **Picture style**, *Real time EPG* is **Realistic TV schedule**, *Keep listings for* is **Shuffle guide every** and *EPG debug* is **Guide check (debug)**. The help line under each is rewritten in plain English.

## Alpha 0.46.30 — 2026-11-14

- **Channel schedule fixes**: OK on any programme in the schedule now plays it (a later one starts from the beginning, like the guide does); before, only what was on right now did anything. "Channel schedule" also moves up to sit straight under On Demand in the guide's hold-OK menu.

## Alpha 0.46.29 — 2026-11-14

- **Smoother On Demand**: the big backdrop behind a show is now decoded in the background before it is shown, so moving along the rows no longer stalls while a large picture loads.

## Alpha 0.46.28 — 2026-11-14

- **More American game shows blocked**: the MVG Productions Archive uploads (Joker's Wild, Sale of the Century, Big Jon's Price Is Right and Wheel of Fortune) are all US versions and were showing as the UK shows. All of them are now hidden.

## Alpha 0.46.27 — 2026-11-14

- **Back from On Demand goes to the TV guide**: it used to drop you on the picture when On Demand had been opened from the remote or the OSD. Now Back always takes you to the guide.

## Alpha 0.46.26 — 2026-11-14

- **YouTube picture in the guide's little TV**: videos played by the app's own player (all the YouTube ones, and some files) disappeared from the preview window when the guide opened, because that player draws behind the page. The picture now moves into the little TV and goes back to full screen when the guide closes. Needs the new app, not just a refresh.

## Alpha 0.46.25 — 2026-11-14

- **Channel schedule**: a full list of everything on a channel with its start time and length, like a real EPG. Open it from the guide's hold-OK menu (Channel schedule), from the new Schedule button on the OSD, or from Options > TV Guide. Left/Right change the day (yesterday to a week ahead), Channel +/- change channel, OK watches what is on or plays an earlier programme from its start. It uses the colours of whichever guide theme you have, and on the phone the rows are tappable.

## Alpha 0.46.24 — 2026-11-14

- **American Price Is Right blocked**: the US game show (hundreds of Barker-era episodes) was filling the TV. All of it is now hidden everywhere; Bruce's Price Is Right (the UK one) stays.

## Alpha 0.46.23 — 2026-11-14

- **Fake Thomas episode blocked**: a fan-made "A Very Evil Christmas" upload was playing as a real Thomas and Friends episode on Children's Christmas. That upload is now blocked everywhere.

## Alpha 0.46.22 — 2026-11-14

- **Not Seinfeld**: "Comedians in Cars Getting Coffee" was turning up on US Sitcoms as Seinfeld episodes. That upload is now blocked everywhere.

## Alpha 0.46.21 — 2026-11-14

- **Telly Addicts Mobile: On Demand on the remote.** A purple On Demand button at the top of the on-screen remote opens On Demand from the guide or while watching.

## Alpha 0.46.20 — 2026-11-14

- **Telly Addicts Mobile: move the remote button.** Drag the round button anywhere on the screen. The on-screen remote opens beside it, and the app remembers where you put it. A tap still opens and closes the remote.
- **A selected programme you can read**: a programme that runs in from the left edge of the guide now starts its words at the edge you can see, and tapping a programme that is mostly off the side scrolls it back into view.

## Alpha 0.46.19 — 2026-11-14

- **Telly Addicts Mobile: the guide now scrolls like a phone** (the TV app is unchanged). It follows your finger smoothly, up and down through the channels and sideways through the time line, and glides to rest when you let go. Scrolling no longer moves the highlight, so a tap picks what you touch.
- **Fixed overlapping**: the small TV window no longer sits over the time line and the first channel.
- **The bar over the picture can be touched**: tap its buttons (TV Guide, Play, Next, Restart, Info, On Demand, Options), tap or drag along the progress line to jump around, and tap anywhere else to close it. The buttons and text are bigger.
- In lists and menus, dragging now moves the way the list is dragged (finger up shows the next items).
- The remote button in the bottom right stays on every screen.

## Alpha 0.46.18 — 2026-11-14

- **Telly Addicts Mobile, better touch** (the TV app is unchanged):
  - Dragging up and down now scrolls the guide, a row at a time as you drag. Dragging sideways moves along the time line. The same drag scrolls lists and menus.
  - Press and hold on a programme selects it and opens its menu (Watch now, Watch from the start, On Demand, Options and so on).
  - The menus, On Demand menus and Options are much bigger for a phone. You can tap a menu row, an Options category, row or choice to use it, and tap outside a menu to close it.
  - Long menus scroll to keep the highlighted row in view.

## Alpha 0.46.17 — 2026-11-14

- **Telly Addicts Mobile gets touch controls** (the TV app is unchanged):
  - A round remote button, bottom right, opens an on-screen remote: arrows, OK, Back, Guide, Info (the hold-OK menu), Play, channel up/down, rewind/forward and the four colour buttons (the yellow one is Search). It works on every screen.
  - Swipe to move, tap for OK, press and hold for the hold-OK menu.
  - In the TV guide, tap a channel or programme to select it, and tap it again to watch it.
  - A much bigger guide on the phone: four channels at a time with large text.
  - The phone app stays in landscape for now.

## Alpha 0.46.16 — 2026-11-14

- **The Telly Addict Builder keeps working**: splitting the build into TV and Mobile moved the TV app's APK, which the Builder looks for. The TV build now also leaves its APK where the Builder expects it. The Builder installs the TV app only; the Mobile APK comes from the GitHub build for now.

## Alpha 0.46.15 — 2026-11-14

- **Two apps from one build**: each build now gives you `tellyaddicts-tv.apk` (the TV app, unchanged) and `tellyaddicts-mobile.apk` (called "Telly Addicts Mobile", for phones). They install side by side, keep separate data and have separate settings, so nothing done on the phone version can affect the TV. For now the mobile one is the same app; the touch controls and phone layout come next.

## Alpha 0.46.14 — 2026-11-14

- **Blocked shows really disappear now**: two wrong versions you reported (Mr and Mrs North, the American Wheel of Fortune) were already on the block list but kept playing, because the TV was still using lineups it had saved earlier. The saved lineups are now rebuilt whenever the block list changes, so a block takes effect straight away.
- Blocked the American Shining Time Station episodes that were showing as Thomas and Friends.

## Alpha 0.46.13 — 2026-11-14

- **Classic Blue looks livelier**: gradient channel tiles with rounded corners, the programme showing now glows brighter with a gold edge on every channel, and later programmes are darker so it is easy to see what is on right now.
- **Options > Guide theme fixed**: the preview of the theme now shows all three rows instead of being cut off, and the Options panel no longer spills its rows over the button hints at the bottom; it scrolls to follow the highlighted row.

## Alpha 0.46.12 — 2026-11-14

- **No second loading screen**: a programme that starts part-way through (like G.I. Joe) could show the loading screen, drop it, then show it again when the player jumped to the right spot. Each programme now gets its loading screen once.

## Alpha 0.46.11 — 2026-11-14

- **Options now leaves a trail in the debug log**: where it was opened from, how many button presses it handled, and whether it closed by itself. This is to pin down any further report of Options hanging.
- **Three more wrong matches blocked** from your reports and the log: Care Bears was playing the 2007 series, CITV had a 2018 CGI Thomas & Friends, and The Lion King (1994) was a recording of the stage musical.

## Alpha 0.46.10 — 2026-11-14

- **Options no longer hangs when opened from On Demand.** Opening Options from the On Demand hold-OK menu showed the Options screen, but the remote was still moving On Demand underneath it, so Options looked frozen until it closed itself. The remote now works Options, and Back returns to On Demand.

## Alpha 0.46.9 — 2026-11-14

- **Search in On Demand.** Press Yellow on the On Demand screen (or hold OK and choose Search), type part of a name on the on-screen keyboard and press Search. Every channel is searched, and the shows and films that match appear as a "Search" row at the top. Search again with the box empty (Clear, then Search) to remove the row.
- The on-screen keyboard has a Space key.

## Alpha 0.46.8 — 2026-11-14

- **Three wrong YouTube videos are out of Blind Date.** They were modern short dramas ("A Billionaire CEO hides her identity for a blind date…") that matched on the show's name. Videos like that are now left out.

## Alpha 0.46.7 — 2026-11-14

- **YouTube episodes no longer play behind a frozen picture.** Starting a YouTube episode (or anything else in the app's own player) straight after a normal programme left that programme's last frame stuck on screen, with the new one playing behind it. The old picture is now let go and hidden whenever the app's own player is showing.

## Alpha 0.46.6 — 2026-11-14

- **Films get backdrops and an artwork menu** (needs a TheTVDB key). Hold OK on a film in On Demand: Scrape artwork finds its backdrop on TheTVDB, Choose the right film lists the matches when it picked the wrong one, and Choose a poster / Choose a background list its pictures. Back to automatic forgets the choices. A film keeps the poster it came with unless you pick another.
- **Scan my artwork now covers films too**: with a key it looks up a backdrop for every film that has none, after the shows.
- The backdrop is used wherever a show's is: the loading screen, On Demand and the guide.

## Alpha 0.46.5 — 2026-11-14

- **The library is no longer downloaded on every start.** The app fetched the whole 10 MB library a few seconds after every launch, even when nothing had changed. It now keeps the copy on the TV with its revision and only downloads when the scraper publishes a new one. Saving it is also lighter (the text is stored as it came instead of being wrapped a second time).
- **VHS looks stop dropping frames at the start of every programme.** When two programmes in a row needed the blur taken off, the rest of the session starts without it instead of finding out again each time. Choosing a look in Options gives it a fresh try.

## Alpha 0.46.4 — 2026-11-14

- **Wrong matches from your reports are blocked.** The Comic Strip Presents (was playing a Get Smart episode), The Word (a Bible study talk on Music), Wheel of Fortune S02E06 (the American version) and Mr and Mrs (Mr and Mrs North, a 1950s American detective show) no longer play those files. Also out: three unrelated clips that Soaps had picked up for "Angels" (one of them repeated all day).

## Alpha 0.46.3 — 2026-11-14

- **Real time EPG no longer plays the same programme over and over.** Small channels (Christmas Movies, Kids Movies, Christmas Music, Children's Christmas, Games, Cooking and others) could show one film or episode back to back for hours, because a time slot with only one suitable programme just repeated it. Now nothing is shown twice running while there is anything else on the channel: when a slot has only the one that has just finished, it is filled with the channel's other programmes instead, and the filler never repeats the one that has just ended. In a test rebuild of every channel, the ones with back-to-back repeats dropped from 14 to 1.

## Alpha 0.46.2 — 2026-11-14

- **Scan my artwork** (Options > Artwork). OK looks up every show in the library that is missing a poster, a backdrop or its episode pictures: TheTVDB first when a key is entered, then TVmaze. It runs one show at a time with a progress bar ("37 of 168 · show name"), and OK again cancels it. Shows that already have everything are skipped, so a second scan is quick. It finishes with a summary of what it found, and writes each step to Options > Debug log. Shows whose episode guide the scraper publishes are left to the scraper. Films are not covered yet.

## Alpha 0.46.1 — 2026-11-14

- **Scrape artwork and the other On Demand menu choices now use TheTVDB too** (when a key is entered). Scrape artwork searches TheTVDB first and falls back to TVmaze when it has no match. Choose the right show lists TheTVDB's matches. Choose a poster and Choose a background list TheTVDB's pictures for a show picked from it. Each attempt is written to Options > Debug log (for example "TVDB scrape found … " or "TVDB scrape: no match for …"), so a scrape that finds nothing now says why.

## Alpha 0.46.0 — 2026-11-14

- **You can now see whether TheTVDB is working.** The TheTVDB key row in Options > Artwork shows a running count, such as "On · 12 found, 3 no match", and each lookup is written to Options > Debug log. Pressing Save (even with the same key) now checks the key and then looks up a test show, and says "TheTVDB is working" when it all comes back.

## Alpha 0.45.99 — 2026-11-14

- **TheTVDB for artwork and details.** There is a new **TheTVDB key** row in Options > Artwork. OK opens an on-screen keyboard (arrows to move, OK to type, Shift for capitals; the number keys on the remote type digits). Save checks the key with TheTVDB and says whether it was accepted.
- With a key, posters, backdrops, summaries, episode details and the cast on the Info screen come from TheTVDB first, and TVmaze fills in whatever TheTVDB has no match for. The scraper's own artwork list still comes before both. With no key, or a key TheTVDB will not accept, nothing changes. Clear the key to go back to TVmaze alone.
- Needs the new app build (it adds a network call for TheTVDB), so install this version rather than just reloading the page.

## Alpha 0.45.98 — 2026-11-14

- **Options is in the On Demand hold-OK menu.** Hold OK on a show and you can open Options without leaving On Demand. Films now get a small menu of their own: Info, Options and Hide this film.

## Alpha 0.45.97 — 2026-11-14

- **The start-up tuning screen no longer repeats a picture early on.** While only a few pictures had loaded, the same ones came round again and again. Until there are plenty, a gap now stays empty until a new picture arrives. Each load also starts afresh, so a picture is never shown twice in one load.

## Alpha 0.45.96 — 2026-11-14

- **Films now use their backdrop on the loading screen.** A film such as Dogma showed only its poster before it started, even when a backdrop was on file for it. The loading screen now looks the film up by title, so the backdrop is used when there is one, and the poster only when there isn't.

## Alpha 0.45.95 — 2026-11-14

- **The loading screen shows a poster only when a show has no backdrop.** Before a programme starts, the picture behind the channel name is the show's backdrop on its own. The poster used to sit on top of it as well.

## Alpha 0.45.94 — 2026-11-14

- **Options is back in the guide's hold-OK menu**, above Hide this show. The menu now has ten choices, so it shows eight at a time and scrolls with the highlight (arrows in the corner show there are more above or below).

## Alpha 0.45.93 — 2026-11-14

- **Back twice now brings up the quit question.** From the picture, the first Back opens the guide and a second one straight after (within about a second) asks whether to quit. Before, the guide the first Back opened swallowed the second one, so it only worked when nothing was playing.

## Alpha 0.45.92 — 2026-11-14

- **No more small gaps in the guide with Real time EPG on.** Programmes now simply follow one another in the ordered week; the short clips used to pad out start times are gone, so the guide has no tiny boxes between programmes. Start times drift a few minutes off the round marks instead.
- **Three wrong matches hidden:** a Budgie the Little Helicopter episode listed as Surprise Surprise, a Richard Scarry episode listed as Treasure Hunt, and a 1935 film listed as Mr and Mrs.

## Alpha 0.45.91 — 2026-11-14

- **Fixed: anything playing in the app's own player was skipped after about five seconds.** The check for "sound but no picture" counted frames, which the app's own player cannot report, so it always decided there was no picture and moved on to the next programme. It now takes a known picture size as a picture. This hit YouTube videos, and any file that had been handed to the backup player.

## Alpha 0.45.90 — 2026-11-14

- **Real time EPG (Options > TV Guide).** When on, every channel is laid out like a real week of television: short programmes in the morning and at lunchtime, half hours through the early evening, hour-long programmes and longer in prime time, films and long programmes on weekend afternoons and evenings, and Saturday and Sunday different from the weekdays. Children's channels get a school-day pattern (early morning, after school, a longer programme at teatime). Programmes start on a round five minutes, and a series plays in order, episode after episode, from one day to the next. Channels that already have a plan of their own (News, Saturday Night, Soaps, Drama, Video Shop) keep it. Turning it on or off rebuilds the guides. It shapes the week by how long each programme runs; showing each programme at its real slot needs a slot list from the scraper.

## Alpha 0.45.89 — 2026-11-14

- **Start-up pictures no longer repeat.** When the pictures flicking by on the tuning screen had all been shown once (more likely on a slow start, when new ones arrive slowly) it started over and could pick the one it had just shown, or one of the last few. It now skips the last six shown, and never picks the very last one again.

## Alpha 0.45.88 — 2026-11-13

- **YouTube through public Piped and Invidious servers.** The app no longer asks YouTube's own player directly. It asks several community-run Piped and Invidious servers at once and plays the first good stream (no adverts, no sign-in); the last server that worked is asked first next time. If none answer, the debug log lists why. These servers come and go, so expect some days when it is patchy. YouTube videos are on again (Options > Play > YouTube videos turns them off).
- The debug log now says which server and quality each YouTube video came from.

## Alpha 0.45.87 — 2026-11-13

- **YouTube is off by default for now.** On a first try, YouTube refused every lookup with a "sign in to confirm you're not a bot" check, so none of its videos played. They stay out of On Demand until that is sorted; Options > Play > YouTube videos turns them back on.
- **One failed YouTube video no longer skips down the list.** A refusal that hits every video is reported once, and only a video YouTube calls gone or private is left out.

## Alpha 0.45.86 — 2026-11-13

- **YouTube as a second source (trial).** Episodes the scraper found on YouTube (Telly Addicts, Big Break, Gladiators, Blind Date and more) now show in On Demand, from `data/yt.json`. They play through the app's own player with no adverts and no sign-in; the stream is looked up when you press play. Episodes with no season or number sit under "More from YouTube". Needs the TV app, not a browser.
- **Best copy first.** Where an episode exists more than once, the app now ranks the copies: archive.org first, then YouTube; a copy of the right running time beats one that is far off, and a copy that keeps adverts or is an .mkv ranks lower. The rest stay behind it: if the first will not play, the next is tried by itself, and "Try another version" now offers the YouTube copies too.
- **Options > Play > YouTube videos** turns the source off. A video that fails to play is left out for a day.
- If a YouTube video will not play, the debug log says why (YouTube changes this from time to time).

## Alpha 0.45.85 — 2026-11-13

- **No more empty Dragon Ball Z.** It had no videos but was still listed under Children's, so it showed as an empty show. Removed.

## Alpha 0.45.84 — 2026-11-13

- **Hide a show you don't want.** Both hold-OK menus now have "Hide this show" (or film). It goes from On Demand straight away and from the guide after Refresh listings. Options > TV Guide > Hidden shows brings them all back (OK twice).
- **Report a problem** in the guide menu writes the programme, show and file to the debug log, so a wrong video can be traced.
- **Menu tidy.** "Scrape this show" is now "Fix artwork & details", the Options shortcut is gone from the guide menu, and the On Demand menu gains Info.

## Alpha 0.45.83 — 2026-11-13

- **The hold-OK menus match Options.** The menu on a programme in the guide and the one on a show in On Demand now use the same navy panel, yellow highlight and two-line rows as Options, with a short line under each choice saying what it does.

## Alpha 0.45.82 — 2026-11-13

- **Options tidied up.** The screen behind Options no longer shows through. "Help & tools" is split into **Help** (What's new, About) and **Debug** (Live view, Debug log, EPG debug, Missing episodes). The one-item "Watch" category is gone: On Demand is now the first line under TV Guide, and Options opens there. The Live view address is shown large and green so it can be read from across the room. "Match the channel" has been taken out of the guide themes, so the theme only ever changes when you change it.

## Alpha 0.45.81 — 2026-11-13

- **The guide only changes theme when you change it.** Until a theme is chosen in Options, the guide is now Classic Blue (before, it was "Match the channel", which dressed the guide as the 70's, 80's or 90's whenever one of those channels was involved). "Match the channel" is still there in Options for anyone who wants it. If it was picked on purpose it stays picked.

## Alpha 0.45.80 — 2026-11-13

- **Hid two music uploads that had been matched to the BBC drama "Angels".** "Angels in Heat" is a band: the items are live concert recordings ("Live from The Freight") whose names happened to contain "Angels". They are hidden until the scraper drops them.

## Alpha 0.45.79 — 2026-11-13

- **One Poirot, not two, on each channel.** The library names it both "Poirot" and "Agatha Christies Poirot", and On Demand listed each as a separate show with the same episodes (and one of them was missing an episode the other had). They are now one show, "Agatha Christie's Poirot", on every channel.

## Alpha 0.45.78 — 2026-11-13

- **The guide no longer flashes through its themes.** With the theme on "Match the channel", scrolling down the guide changed the whole screen's look each time the cursor passed the 70's, 80's or 90's channel. It now follows the channel you are watching, and stays put while you browse.

## Alpha 0.45.77 — 2026-11-13

- **Live view now reports performance.** While it is switched on, the page's text includes how long the screen takes to answer each button press (median, 90th percentile and worst, for the guide, On Demand and Options separately) and how many stalls over 50 ms there have been in the last five minutes. It only measures while Live view is on.

## Alpha 0.45.76 — 2026-11-13

- **Faster start-up.** Working out which channel a programme belongs on (the genre check, and routing the library to channels) searched every programme's name against thousands of known show names, one by one. It now looks each run of words up in a table. The results are identical (checked against all 877,000 genre checks and the whole routed library) but the genre check is about 6 times quicker and the routing about twice as quick. In a test the guide appeared after 3.1 seconds instead of 5.4. A slow TV will gain more in seconds, and this is also the work behind Refresh EPG.

## Alpha 0.45.75 — 2026-11-13

- **Hid two home-video uploads on The Video Shop** ("1992 Video Shop, Ted's Books, Adams Caining, Magic Mt" and "1993 The Video Shop 128 W Mission St"). They are not films, they only have "Video Shop" in their names.

## Alpha 0.45.74 — 2026-11-13

- **Hid a fake "Sonic Underground" upload.** The item "Tamers12345 Sonic Underground All Episodes (In Order)" is a fan-made collection with invented episode titles ("…A Tragic Death On Christmas"), not the cartoon. It is hidden on every channel until the scraper drops it.

## Alpha 0.45.73 — 2026-11-13

- **Smoother navigation while the app is still setting up.** Pressing buttons in the guide was already instant, but for the first minute after start-up the app was quietly building each channel's On Demand list in the background, and the big channels (BBC, ITV, Music, CITV) each froze the screen for a moment. That work is now done in tiny slices, and it waits while you are pressing buttons. In a test the number of freezes over 50 ms in the first 40 seconds went from 13 to 1.

## Alpha 0.45.72 — 2026-11-13

- **Live view (debug).** Options > Tools > Live view (debug), off until switched on and off again each time the app starts. When on it shows an address with a four-digit code; open it in a browser on the same Wi-Fi to see what the TV is showing (updating a few times a second, including video), press the remote's buttons from the page or the keyboard's arrows, and read the app's current screen, programme and recent debug log. It only sends a picture, text and button presses; nothing on the page can run code in the app. This one changes the Android app itself, so it needs a full build.

## Alpha 0.45.71 — 2026-11-13

- **Start-up TV never repeats a picture.** Each background is shown once per start-up, picked at random from the whole art list. More are fetched in the background as they get used up, so the TV only starts over if it has genuinely shown every one.

## Alpha 0.45.70 — 2026-11-13

- **Soaps can have a year as the season.** Episode codes such as `S1988E56` are now read everywhere (the guide, On Demand, next episode, link matching); before, only one or two digits were accepted for the season, so they would not have been recognised. In On Demand such a season is shown as just "1988".

## Alpha 0.45.69 — 2026-11-13

- **Quieter tuning hiss.** The static heard while a channel tunes in is now well under half as loud.
- **Start-up TV shows backgrounds, not posters.** Its pictures are now the shows' wide backgrounds; a poster is only used for a show that has no background, or until the first backgrounds have loaded.

## Alpha 0.45.68 — 2026-11-13

- **The start-up TV keeps tuning until the guide is ready.** It used to freeze on static while the app was busy building the guides, because the picture changes and the knobs were driven by the same thread that was doing the building. Now everything that moves (the static, twelve pictures taking turns, the turning knobs, the channel number and the occasional flash of colour bars) is a pure animation that carries on whatever the app is doing. Each time a picture comes round again it is a different show or film.

## Alpha 0.45.67 — 2026-11-13

- **YouTube Poop remixes are gone from Disney.** Three uploads called "Donald Duck Comedy vs ..." (fan-made "ytp" remixes with crude filenames) had been filed under Donald Duck on the Disney channel and its guide, and in On Demand. Anything with "ytp", "YouTube Poop" or "Donald Duck Comedy vs" in its name is now blocked everywhere, and those three items are hidden by name.

## Alpha 0.45.66 — 2026-11-13

- **No more block sticking out of the guide.** A programme that starts just before the right edge of the guide (a few minutes of a two-hour film, say) was drawn wider than its real length because of its padding, so it poked out past the grid as a yellow or blue stub. Slivers like this now have no padding and stay inside the grid.

## Alpha 0.45.65 — 2026-11-13

- **"Auto EPG (experimental)" is gone from Options > TV Guide.** The switch was already unused since Auto EPG became the only guide, but its empty row was still left on the page; it has been removed.

## Alpha 0.45.64 — 2026-11-13

- **A Santa hat on the guide clock.** A little 16-bit Santa hat sits centred on the clock in the TV guide while Seasonal effects is on and Christmas is on (1 November to 6 January), on every guide theme. It goes with the snow: Seasonal effects set to Off removes both.

## Alpha 0.45.63 — 2026-11-13

- **The snow falls again.** In the last two versions it drifted upwards from the bottom; it now falls from the top of the screen as intended.

## Alpha 0.45.62 — 2026-11-13

- **Snow falls at more varied speeds.** Each of the three depth layers is now two sheets of flakes falling at slightly different speeds (and swaying at different paces), so the snow no longer looks like it moves as one block. The number of flakes is unchanged.

## Alpha 0.45.61 — 2026-11-13

- **Smoother snow.** The snow used to be redrawn 15 times a second and flakes could only move in whole steps, which looked jerky. Each layer of flakes is now painted once and slid down by the graphics chip at the screen's own refresh rate, with a gentle sway on top, so it moves smoothly and costs the TV almost no work. Still pixel-art, and it still holds still while you scroll the guide.

## Alpha 0.45.60 — 2026-11-13

- **Seasonal effects: Christmas snow on the guide.** A light pixel-art snowfall and snowdrifts drawn over the TV guide from 1 November to 6 January. It cannot be focused and does not touch the remote. It runs at about 15 frames a second, holds still while the guide is being scrolled, and keeps the drifts off the last row of programmes. Options > TV Guide > Seasonal effects: Auto (follows the date) or Off.

## Alpha 0.45.59 — 2026-11-13

- **New channel: Christmas Movies (18).** Christmas films and specials from 1970 to 1999 (Home Alone, Scrooged, The Snowman, The Muppet Christmas Carol and the rest of a 125-title list in `tools/christmas-movies.json`). It stays hidden until the scraper has found some of them, then appears by itself and also shows in On Demand as a film row. The channels after it moved up one number; the Adverts channel is now 31.

## Alpha 0.45.58 — 2026-11-13

- **The old TV is back on the start-up screen.** It no longer reports each channel loading (no channel names, counts or progress bars). Instead the set just tunes around: static, then a show's picture or a film's poster, the knobs turning and the channel number changing with each one, with a flash of colour bars now and then, until the guide is ready. This replaces the full-screen picture version from 0.45.56.

## Alpha 0.45.57 — 2026-11-13

- **The Addams Family with Russian audio is hidden.** The two big uploads (season 1 and season 2) have Russian as the first sound track and English second, so they played in Russian. They no longer appear; the few single English episodes stay.

## Alpha 0.45.56 — 2026-11-13

- **A new start-up screen.** The old TV set that showed each channel loading is gone. Now shows and films tune in one after another behind the logo, full screen, each arriving with a flick of static and a slow zoom, with "Tuning in to the archives..." and a gentle moving bar until the guide is ready. It no longer reports each channel as it loads. Pictures come from the artwork already saved on the TV (shows' backdrops, plus posters of films seen before), so the very first start after installing may show only the logo for a moment.

## Alpha 0.45.55 — 2026-11-13

- **The exit menu no longer pops up by accident.** Back used to count towards quitting even when it was only closing something: pressing Back to close the guide, the on-screen bar, Options or a panel and then once more quickly opened the exit menu. Now only Backs pressed on the plain picture count, so you must press Back twice in a row while just watching (or in the guide with nothing playing).

## Alpha 0.45.54 — 2026-11-13

- **Clear logos now show on a show's page as well.** The scraper's clear logos (published in art.json from today) replace the plain title on On Demand. They were only picked up on the home rows after the highlight rested on a show, so going straight onto a show page, or opening On Demand on what is playing, never loaded them. The show page now looks them up itself.

## Alpha 0.45.53 — 2026-11-13

- **Japanese-language Sailor Moon is gone.** The 1992 1080p upload and the Japanese live-action series are hidden everywhere; the English-dubbed uploads (DIC and Cloverway) stay.

## Alpha 0.45.52 — 2026-11-13

- **Auto EPG is now the only guide.** Every channel is built from the scraper's library, so the Auto EPG switch has gone from Options > Guide. A channel the library has nothing for still falls back to its hand-picked list, so none goes empty. The first start after updating builds the guides afresh.

## Alpha 0.45.51 — 2026-11-13

- **Adverts are just On or Off.** The Options setting no longer asks for 1970s, 1980s or 1990s: each break now picks adverts from the year of the programme you are watching (or the middle of the decade on a 70s, 80s or 90s channel), falling back to the same decade, then any. Anyone who had Off keeps Off; everyone else is now On.

## Alpha 0.45.50 — 2026-11-13

- **Skip adverts.** While an advert break is playing, open the on-screen bar and a new **Skip adverts** button appears next to Pause. Press OK on it (or the Next key on the remote) and the break ends and the next programme starts straight away. It only appears during a break, and not on the Adverts channel, which is all adverts.

## Alpha 0.45.49 — 2026-11-13

- **The foreign-language "The Goonies" is gone.** That archive.org copy of The Goonies (1985) turned out not to be the English film, so it no longer shows on the Kids Movies channel, the guide or On Demand. A single hidden-items list in the app now makes it easy to drop any other wrong copy the same way.

## Alpha 0.45.48 — 2026-11-13

- **On Demand moves smoothly.** The highlighted poster now grows and its white outline fades in instead of snapping. Moving left or right slides the posters across by one place, and moving down the episode list slides the episodes up. The big title, details and background fade into the next show rather than cutting, and the episode and season highlights fade between rows. The slides get quicker while you hold a button so they keep up. Nothing else changed in how it works.

## Alpha 0.45.47 — 2026-11-13

- **Smoother browsing on the On Demand home screen.** Moving along a row or between channels no longer rebuilds the posters from scratch each time: every poster is built once and reused, so the TV doesn't have to decode the pictures again on every press. The list of rows is also worked out once per key press instead of several times.

## Alpha 0.45.46 — 2026-11-13

- **On Demand loads only as long as it has to.** Opening it now builds just the channel you are on (or the show that is playing) and nothing else, so the loading screen goes away as soon as that one is ready. The other channels are built in the background afterwards, nearest first, instead of competing with it. If the lists were already built in the background after start-up, there is no loading screen at all.

## Alpha 0.45.45 — 2026-11-13

- **No more half-empty On Demand while it loads.** If the lists are not ready when you open On Demand, you now get a plain loading screen (spinner, "Getting your shows ready...") that goes away the moment the first row is ready, instead of a page of "Loading..." text. Opening straight onto the show that is playing waits behind it too, so you never see the home screen flash first. A row further down that is still loading shows blank poster blocks, not text. The background build of the lists now starts four seconds after start-up instead of twenty, so it is usually ready before you open it.

## Alpha 0.45.44 — 2026-11-13

- **On Demand: the highlighted row is always the top one.** Moving down to the second row used to leave its posters half off the bottom of the screen, so the highlight was cut off. Now the row you move onto slides up to the top and the next one peeks below it.

## Alpha 0.45.43 — 2026-11-13

- **Clear logos in On Demand.** When the scraper's `art.json` gives a show a logo (`"l"`: the address of a transparent title picture), On Demand shows it instead of the plain title, on the home banner and on the show page. Until the picture has loaded, and for shows without one, the text title stays. Nothing changes until the scraper publishes logos.

## Alpha 0.45.42 — 2026-11-13

- **On Demand posters fill the row.** They are a little wider (and taller), so the seventh poster ends at the right edge instead of leaving a gap. The highlighted one still grows without touching its neighbours.

## Alpha 0.45.41 — 2026-11-13

- **On Demand redesign.**
  - **Opens faster.** Every channel's On Demand list is now built quietly in the background a little after start-up (one at a time, only when nothing else is loading), so opening On Demand finds them ready instead of building them while you wait.
  - **Continue watching.** A new first row with the shows you were part-way through, with a progress bar on each poster. The show page's button says **Resume** and starts where you stopped (not if you left in the first 30 seconds or the last minute). A show drops out when you reach its last episode.
  - **Bigger posters.** Seven across instead of nine, with the channel shown as a tag above the title.
  - **Show page.** The seasons are a list down the left (up and down change season), the episodes sit beside it with their big pictures. Left goes onto the seasons, right comes back to the episodes. This replaces left/right changing season from 0.45.37.

## Alpha 0.45.40 — 2026-11-13

- **ThunderCats** episodes from the 2011 remake (a Portuguese-dubbed upload) are left out, and so is anything whose file or item name says it is dubbed or foreign-language (Portuguese, Spanish, Hindi, Korean, German "Staffel", French "saison"). That also removes the Korean drama "Taxi Driver" that was turning up on Christmas TV.

## Alpha 0.45.39 — 2026-11-13

- **Christmas adverts.** The scraper's catalogue now flags 121 Christmas adverts (about 72 minutes: 5 from the 70s, 32 from the 80s, 84 from the 90s). The four Christmas channels (Christmas TV, Noel, Kids Christmas, Christmas Music) play those in their breaks, topped up with their usual kind when an era has few. Every other channel, and the Adverts channel, leaves them out until December, when they join every break.

## Alpha 0.45.38 — 2026-11-12

- **Donkey Kong Country** episodes that were really the "Super Beard Bros." game-play videos are left out (the cartoon stays). Other YouTube game-play series (Game Grumps, Achievement Hunter, Yogscast, "Let's Play") are turned away from every channel the same way.

## Alpha 0.45.37 — 2026-11-12

- **On Demand: left and right change season** while you are in the episode list (they already did on the season strip). The episode pictures are 50% bigger, so three episodes show at a time instead of four.

## Alpha 0.45.36 — 2026-11-12

- **No colour-button bar at the bottom of the guide, on every theme.** The grid now shows seven channels instead of six. The coloured remote buttons still work (red Now, green Later, yellow Earlier, blue Watch).

## Alpha 0.45.35 — 2026-11-12

- **Long programme names in the Teletext, 1980s and Radio Times guides.** The big title above the grid was too large for those fonts, so a long name wrapped and its second line was cut off. Smaller title size in those three themes, so two lines fit.

## Alpha 0.45.34 — 2026-11-12

- **Guide themes tidied.** Channel names fit in the guide (they were cut off), programme names no longer run into the line below, the arrow on a programme that carries on past the edge no longer sits on top of its title, and the 90s and Teletext colour-button row no longer touches the bottom channel. The same spacing fix applies to Classic Blue.

## Alpha 0.45.33 — 2026-11-12

- **The Adverts channel is rebuilt and moved to the end.** It no longer searches archive.org for random compilations. It is now a run of commercial breaks, each filled from the checked advert catalogue (UK adverts only, nothing after 1999) and following the Adverts option in the OSD: All, 70s, 80s or 90s. With the option on Off the channel still plays, from every era. Drink and gambling adverts only come on after 9pm. It is now channel 30, so the channels that were after it (ITV and up) are each one number lower.

## Alpha 0.45.32 — 2026-11-12

- **Guide themes.** Options > TV Guide > Guide theme: Classic Blue, Teletext, Radio Times (print), 1970s, 1980s and 1990s, with a live preview of each as you flick through. "Match the channel" (the default) gives the 70s, 80s and 90s channels a guide from their own decade and keeps Classic Blue everywhere else. The fancy fonts load from the internet; offline a theme falls back to a plain system font.

## Alpha 0.45.31 — 2026-11-12

- **Mr. Bean is the sitcom again.** The 134 episodes of the 2002 cartoon (Mr. Bean: The Animated Series) that the library filed under Mr. Bean are left out; the live-action episodes and specials stay.

## Alpha 0.45.30 — 2026-11-12

- **Episodes filed under the wrong show are dropped.** When the file clearly belongs to a different show and only the episode's title matches (Mobile Suit Gundam Wing's "Eternal Flame of the Shooting Stars" listed as Shooting Stars; Community's "Advanced Dungeons & Dragons"; Sooty & Co's "Surprise Surprise" and "Blind Date"), it no longer appears on any channel or On Demand. Checked against the whole library: 18 episodes, all wrong.

## Alpha 0.45.29 — 2026-11-12

- **Video game playthroughs are kept off the channels.** The Kids Movies channel was showing a Lego Star Wars PS3 playthrough as the 1977 film, and the Disney channel had a run of NES/SNES/Mega Drive "Longplay" videos. Anything titled as a longplay, playthrough, walkthrough, gameplay or with a console tag like [PS3] now stays off every channel except Video Games (and On Demand).

## Alpha 0.45.28 — 2026-11-12

- Fixes the build again: the backup player's libraries need the app compiled against Android 35 (it still runs on the same TVs as before). Nothing else changed.

## Alpha 0.45.27 — 2026-11-12

- Fixes the build of 0.45.26: the backup player's libraries need AndroidX switched on in the project settings. Nothing else changed.

## Alpha 0.45.26 — 2026-11-12

- **Backup video player.** Files the web view's player can't handle (AC3/E-AC3/DTS/TrueHD sound, some MKVs) are now handed to the app's own player (Media3 ExoPlayer with FFmpeg audio decoders), which picks up from the same spot. New **Options > Playback > Video player**: **Auto** (default: the normal player first, the backup only for a file with no sound or that won't load, and that file is remembered), **Standard only**, or **Always backup**. The VHS and Smart ratio looks don't apply to the backup player, and while the guide is open its mini-TV shows black. Needs this version of the app (a first build that adds libraries, so it's a bigger download). The FFmpeg decoders are GPL-3.0; see the README.

## Alpha 0.45.25 — 2026-11-12

- **Adverts now come from the scraper's checked catalogue** (1,680 adverts, 1975-1999, each with a verified year, brand, category and length) instead of searching archive.org while the app runs. Kids channels get toys, sweets and food; daytime gets household, food and shops; games and music channels get their own; prime time takes everything. Drink, tobacco and gambling adverts only run on prime-time channels after 9pm. The old searching is kept only as a fallback if the catalogue cannot be loaded.

## Alpha 0.45.24 — 2026-11-12

- **Advert breaks reworked.** Breaks are now listed inside the programme's time in the guide (three minutes after a prime-time programme, a minute and a half on kids channels), so the guide stays right to the minute. A break is a time budget filled with adverts, not a fixed count. There are no breaks on the film channels (Video Shop, Kids Movies, Disney), after films, or after anything shorter than 15 minutes.
- **Adverts follow the programme.** A break aims for the year of what just played (the episode's air date, or the middle of a decade channel's decade), then the same decade. Adverts are not repeated within a couple of dozen breaks. Drink, tobacco and gambling adverts stay out of kids and daytime breaks and before 9pm.
- **Nothing after 1999, and no guessing.** Adverts with no year are no longer played unless the archive's own date puts them in 1970-1999 or they are hand-picked. Turning adverts on or off rebuilds the guide.
- Spec for a checked advert catalogue from the scraper: `tools/adverts-contract.md`.

## Alpha 0.45.23 — 2026-11-12

- **Less background work.** The loading-screen static kept redrawing nine times a second for as long as the app was open, and the start-up check kept waking four times a second; both now stop once the first channel is playing.

## Alpha 0.45.22 — 2026-11-12

- **70's, 80's and 90's TV channels are back.** They are built from the library, but the app only used the library for a channel whose published revision matched, and the scraper's index lists none for 80's and 90's (and a stale one for 70's), so all three came up empty and hid themselves. They now always take what the library routes to them.

## Alpha 0.45.21 — 2026-11-12

- **Options from the guide.** The long-press menu on a programme in the TV guide now ends with Options, which closes the guide and opens the Options menu.

## Alpha 0.45.20 — 2026-11-12

- **TV Archive is the On This Day channel again.** Daytime is now the BBC Archive On This Day clips, with the news at one, six and ten. The BBC News 24 recordings (which made up three quarters of the channel, with titles like "145D5B6D-Business-Briefing") are cut to one of each programme under a clean name, and anything dated is still kept only if it aired on today's date.

## Alpha 0.45.19 — 2026-11-12

- **EPG debug can be opened from a browser, like the debug log.** The page now shows an address to open from a phone or computer on the same Wi-Fi, with the report for every channel at once: problems first, then each channel's next 24 hours.

## Alpha 0.45.18 — 2026-11-12

- **Options redesigned as two panes.** A category list down the left (Watch, Picture, TV Guide, Artwork, Playback, Help & tools) and the chosen category's settings on the right. Up and Down choose a category, Right or OK goes in, Back returns to the list. A highlighted setting shows all its choices as buttons (Guide length: 24 hours, 48 hours, 1 week, 1 month) so you can see them without cycling, and Left and Right change it. EPG debug now sits under Help & tools.

## Alpha 0.45.17 — 2026-11-12

- **No more three of the same show in a row.** The running order now mixes shows so the same one does not come round again straight away, and on the timetable channels (Saturday Night TV and the others) a programme that has already been on today is passed over for another. This fixes Noel's House Party playing three times in a row.
- **EPG debug (Options > EPG debug).** Shows how each channel's guide was built and what it will show for the next 24 hours, and flags problems such as the same show three times in a row, repeats within the day, or one show taking over. Left and right change channel.

## Alpha 0.45.16 — 2026-11-12

- **The guide length now starts at 24 hours**, so a fresh install starts up quickly. Choose a longer one in Options > Guide length.

## Alpha 0.45.15 — 2026-11-12

- **Guide length option (Options > Guide length): 24 hours, 48 hours, 1 week or 1 month.** It sets how much airtime each channel's guide covers before it repeats. For the everyday channels the app picks a varied mix of programmes (one from each show in turn, so no show takes over) from what the channel's rules already allow. Soaps, Saturday Night TV, The Video Shop, TV Archive and Drama, which follow a clock timetable, now lay out each day (or week) afresh instead of repeating the same 24 hours, for as many days as you choose. The default is 24 hours. On Demand is not affected and still lists everything.

## Alpha 0.45.14 — 2026-11-12

- **Ordinary channels only take episodes tracked by season and episode.** The library's dated or numbered videos (Top of the Pops, soap episodes, news, cartoon shorts and the like) no longer fill the drama, comedy, kids, decade and other everyday channels. They stay on the channels built for them (Soaps, Music, MTV, TV Archive, Disney, I'm Off School) and on the Christmas channels. Films and songs are unaffected.

## Alpha 0.45.13 — 2026-11-12

- **Files that play with no sound are noticed.** Some .mkv files carry audio this TV cannot decode, so the picture plays in silence. The app now checks a few seconds in; on the TV it skips to the next programme and leaves that file out next time, and in On Demand it tells you to use Try another version. The debug log records "NO SOUND" with the file.

## Alpha 0.45.12 — 2026-11-12

- **The missing episodes report is now a proper import file.** It starts with `format: "telly-addicts-missing"` and a version number, and each show carries TVmaze's id when it is known, so the scraper can load it and go and find what is missing.

## Alpha 0.45.11 — 2026-11-12

- **Every film in The Video Shop and Kids Movies no longer shows the same wrong picture.** When the library could not load, the background artwork search looked up the channel names ("The Video Shop", "Kids Movies") as if they were TV shows, found an unrelated programme, and gave its picture to every film. Channel names are no longer looked up, and films without their own poster show a plain card with the title.

## Alpha 0.45.10 — 2026-11-12

- **The show library downloads again, which fixes missing film posters, wrong lengths and shows listed as raw file names.** The library file had grown just past the size the app would accept (by under a kilobyte), so every TV rejected it and fell back to old, thin data: no posters or details on films, every video listed as 45 minutes, and shows like Poirot under "Other videos". The limit is now far higher.
- **On Demand opens while a film is playing.** It used to jump to the film and start it again straight away, so it looked as if On Demand would not open. It now opens on that film's poster.

## Alpha 0.45.9 — 2026-11-12

- **More pictures flick through the start-up TV while it tunes.** The pictures no longer wait for the whole show library to download: the app uses the artwork it already has saved (or asks for the artwork list on its own), so about two dozen show pictures are ready within a second or two.

## Alpha 0.45.8 — 2026-11-12

- **"Please stand by" text keeps clear of the TV picture.** The text column now starts further right and a long "Coming up" title wraps onto a second line instead of running under the TV.

## Alpha 0.45.7 — 2026-11-12

- **"Please stand by" no longer runs under the programme banner.** The Telly Addicts logo and the text beneath it sit higher, so "This channel is loading" is no longer cut off.

## Alpha 0.45.6 — 2026-11-12

- **The show library now downloads reliably on slow connections.** The big library file (episode names, seasons, codes) was timing out on some TVs, so shows like Agatha Christie's Poirot appeared as raw file names under "Other videos". The app now waits longer, tries three times, and keeps a copy on the TV to fall back on.

## Alpha 0.45.5 — 2026-11-12

- **Episodes with dotted file names are sorted into their seasons.** Files named like `Show.S01E01.1080p.BluRay.mkv` were landing under "Other videos" because the app could not read the episode code out of the dots. It now uses the library's own episode code when the file name cannot be read.

## Alpha 0.45.4 — 2026-11-12

- **Films in On Demand are listed one by one.** Kids Movies and The Video Shop showed a single card holding every film. Each film is now its own card in the row, like a TV show, and OK on one plays it straight away.

## Alpha 0.45.3 — 2026-11-12

- **On Demand from the guide menu goes straight to the show.** It could land on a different show because the highlighted channel was followed by row number, and the rows shift as each channel's list loads. It is now followed by channel.
- **Leaving On Demand puts you back where you were in the guide.** The channel, the time and the programme you held OK on are still selected.

## Alpha 0.45.2 — 2026-11-12

- **On Demand ignores certificates.** Kids Movies and The Video Shop were showing almost nothing because On Demand hid films by certificate and time of day. It now lists every film that is stored, on both channels. The guide's schedule still follows the certificate rules.

## Alpha 0.45.1 — 2026-11-12

- **Decade channels use a show's end year.** An episode with no air date is only placed in a decade if its show also ended in that decade, when the library says when it ended.

## Alpha 0.45 — 2026-11-12

- **Missing artwork is found in the background.** A minute after the channels have loaded, the app quietly looks up any show that has no picture or backdrop and keeps what it finds with the rest of the artwork. It goes one show at a time, slowly, pauses while On Demand is open, stops after a run of failures, and once finished does not run again until the channels are rebuilt (Options > Refresh EPG) or the library changes.

## Alpha 0.44 — 2026-11-12

- **Decade channels: 70's TV, 80's TV (29) and 90's TV (30).** Each plays only programmes and films from its own decade, taken from the whole library whatever the genre, instead of a hand-picked list. An episode with an air date counts as that year; one without goes by when its show began, and is left out if the show has dated episodes in a later decade. 70s TV is now called 70's TV.

## Alpha 0.43 — 2026-11-12

- **New guide menu entries.** Hold OK on a programme and you now get **Stream next episode** (plays the episode after it and carries on through the show), **Try another version** (plays a different stored copy of that episode or film; press again for the next copy) and **Scrape this show** (looks the show up again, pins the match, and re-sorts its stored files into seasons and episodes). Next showing and Stream link are gone.

## Alpha 0.42 — 2026-11-12

- **Cast on the Info screen.** A row of round photos with each actor's name and character, from TVmaze for programmes and from the film details for films (films show a cast once the film data carries one). The debugging lines that used to sit at the bottom of the Info screen are gone.

## Alpha 0.41 — 2026-11-12

- **A scrubber instead of the 30-second buttons.** The rewind and fast-forward buttons are gone from the OK bar. Press Left or Right while watching (or the remote's rewind / fast-forward keys) and the progress bar becomes a scrubber: a tap moves 10 seconds, holding winds faster the longer you hold, and the picture jumps when you let go. Down reaches the buttons, Up comes back to the bar.

## Alpha 0.40 — 2026-11-12

- **Hold OK on a programme in the guide for a menu.** It offers On Demand (opens that show's page), Watch now, Watch from the start, Info (details for that programme without leaving the guide), Next showing (jumps the guide to the next time the same show is on that channel) and the stream link.

## Alpha 0.39.2 — 2026-11-12

- **The blue button no longer opens On Demand.** It is back to Watch in the guide and does nothing while watching. On Demand is still reached with the On Demand button, Menu, or Left from what is on now.

## Alpha 0.39.1 — 2026-11-12

- **Start-up waits for the whole guide.** The TV stays on the tuning screen until every channel has loaded (up to 30 seconds on a slow connection), so the guide opens complete instead of appearing and then pausing while channels fill in.

## Alpha 0.39 — 2026-11-12

- **New start-up screen.** The logo sits on top with a retro TV in the middle that tunes in your channels: static, show pictures flicking up as it hunts, colour bars when a channel locks in, and the name of each channel under the set.

## Alpha 0.38.2 — 2026-11-12

- **Options menu: less work on every key press.** Only the rows that changed are redrawn, and the size of saved artwork is added up only if you stop on that row, not as you scroll past it.

## Alpha 0.38.1 — 2026-11-12

- **The options menu is quick again.** Each key press was adding up the size of everything saved (to show it next to Clear saved artwork), which meant reading hundreds of saved files every time. The total is now worked out once, a moment after the options open, and after a clear.

## Alpha 0.38 — 2026-11-11

- **Channel lists, episode guides and artwork answers are now saved as files,** not in the page's small storage. The page's storage holds about 5 million characters, which 28 channels filled; files have no such limit and load faster. Your settings and any artwork you picked stay where they were. The first start after updating rebuilds the lists once (the old copies are cleared), so expect it to be a little slower that once.

## Alpha 0.37 — 2026-11-11

- **The app's memory no longer fills up.** With 28 channels the saved channel lists were using nearly all the space a TV app is allowed, so the newest channels could fail to save and be rebuilt from scratch on every start. Each saved list is now capped at 800 programmes (still weeks of viewing), and when a list will not fit the oldest artwork and episode-guide copies are cleared to make room, since those are fetched again when needed.
- **US Sitcoms is live.** M*A*S*H, Roseanne, The Golden Girls, Home Improvement, Murphy Brown, Everybody Loves Raymond and about a dozen more, from the scraper's new list.

## Alpha 0.36.1 — 2026-11-11

- **Bigger On Demand posters that fill the width.** Nine posters now span the whole row, about 40% larger than before, and both rows still fit with nothing cut off. The title block is more compact to make room.

## Alpha 0.36 — 2026-11-11

- **The guide goes round.** Pressing Up on the first channel now takes you to the last one, and Down on the last goes back to the first. The On Demand button is still reached with Left from what is on now.

## Alpha 0.35.1 — 2026-11-11

- **Episode pictures load faster.** The scraper's episode guides (now published for 431 shows) point at TVmaze's full-size stills, which a TV is slow to decode. The app asks for the medium size, which is plenty for the thumbnail next to each episode.

## Alpha 0.35 — 2026-11-11

- **VHS and VHS 2 look after themselves on heavy files.** If the TV is dropping more than a fifth of the frames, which is what makes the picture drift out of sync with the sound, only the slight blur is taken off. The scan lines, colour and tint stay. The next programme starts with the full look again, and the debug log notes which file caused it ("VIDEO EFFECT lightened"). Files that play fine look exactly as before.

## Alpha 0.34.1 — 2026-11-11

- **Smart aspect ratio taken out of the options for now.** It wasn't working properly. Anyone who had it selected goes back to Auto.

## Alpha 0.34 — 2026-11-11

- **New channel: US Sitcoms (28).** Friends, Frasier, Everybody Loves Raymond, Seinfeld, Cheers, Roseanne, The Fresh Prince and the rest of the American sitcoms up to 1999. It stays out of the guide until the scraper has found some of them on archive.org.

## Alpha 0.33 — 2026-11-11

- **New channel: Entertainment (27).** A mix of the best of everything from any network: light entertainment (Generation Game, Little and Large, Benny Hill), panel and Friday-night shows (Whose Line, TFI Friday, The Word), sketch and satire (Spitting Image, Harry Enfield, Not the Nine O'Clock News), sitcoms (Father Ted, Men Behaving Badly, Ab Fab) and cult drama (Robin of Sherwood, Tales of the Unexpected, Blake's 7). Its shows stay on their own channels too.

## Alpha 0.32.1 — 2026-11-11

- **Episodes with no picture of their own show the show's artwork** instead of a flat coloured box. A real still still wins when there is one (from the scraper's episode guide or TVmaze); one upload holding many episodes, like Ready Steady Cook, used to have none.

## Alpha 0.32 — 2026-11-11

- **On Demand fits the screen.** The posters are smaller and the title block is tighter, so both rows show in full with nothing cut off at the bottom and the OK Open button no longer sits on a row title.
- **On Demand is quicker.** Moving left and right along a row now only moves the highlight instead of rebuilding every poster, a picture that has been found is remembered, and the big background waits until you stop moving before it loads.
- **Missing episodes report** (Options > Missing episodes report). Checks every show on the TV against its episode guide (the scraper's, else TVmaze's), counting only episodes aired by 1999. It lists the seasons with nothing on the TV and the episodes missing inside seasons that are there, and puts the whole report on the home network as text to copy and send to the scraper. The guides it reads are kept, so the second check is quick.

## Alpha 0.31.1 — 2026-11-11

- **Food & Cooking now has programmes.** The channel came up empty: the TV only looked at the library routing and never at the channel's own list, and most cookery files have no episode numbers in their names. Both fixed, so Two Fat Ladies, Floyd, Delia, Ready Steady Cook and the rest play.

## Alpha 0.31 — 2026-11-11

- **New channel: Food & Cooking (26).** Delia, Keith Floyd, Rick Stein, Ready Steady Cook, Two Fat Ladies, Masterchef, Ken Hom, Madhur Jaffrey and the other classic cookery shows, built from the scraper's new cooking library. Adverts are UK prime-time style, and it shows in On Demand like every other channel.

## Alpha 0.30 — 2026-11-11

- **On Demand opens on the show you are watching.** Press the On Demand button on the bar (or Blue or Menu) while something is playing and it opens that show's page, on the season and the episode that is on, ready to pick another. From the guide it still opens on the channel rows.
- **Films are in On Demand.** Kids Movies and The Video Shop are back as rows, each film a title of its own with its poster, year, genres, running time and certificate, and Play. Films keep the watershed: family films all day, 15s from 8 pm, and the rest (including films with no certificate) from 9 pm until half past five in the morning.

## Alpha 0.29.4 — 2026-11-11

- **Picking a poster now shows up.** The poster you chose was TVmaze's untouched original, which can be many megabytes, so the TV was slow to show it or could not and the card looked unchanged. Posters now use TVmaze's normal poster size. A pick is only applied once its picture has actually loaded; if it will not load, a message says so and nothing changes.

## Alpha 0.29.3 — 2026-11-11

- **Noel's House Party channel is switched off for now.** It is gone from the guide and On Demand. Its shows are still on other channels (such as Saturday Night TV). `off: true` on a channel in `channels.js` switches it off; removing that line brings it back.

## Alpha 0.29.2 — 2026-11-11

- **OK works normally again in On Demand.** A short press of OK opens a show or plays an episode, as before. The artwork menu now opens only when you hold OK (the same hold that shows Info elsewhere), or press Menu. In 0.29 and 0.29.1 a plain press could open the menu instead.

## Alpha 0.29.1 — 2026-11-11

- **Soaps all day.** EastEnders, Neighbours and the other big soaps are now in the Soaps channel's daytime and late-night mix as well as their evening slots, so they turn up whenever you tune in. They will fill most of the hours between the fixed slots, because they have far more episodes than the small soaps. The note on this is in `tools/schedule-notes.md` for when the schedule engine is reworked.

## Alpha 0.29 — 2026-11-11

- **Fix the artwork from On Demand.** Hold OK on a show (or press Menu) for a menu: Scrape artwork (looks the show up on TVmaze again and takes a clear match), Choose the right show (a list of TVmaze matches with year, network and genre), Choose a poster, Choose a background (pick from what TVmaze has), and Back to automatic. What you pick is kept on this TV and used everywhere, and the choice is written to the debug log. A short press on OK still opens or plays as before.
- **Episode pictures.** An episode with no still of its own now shows archive.org's picture for its file when that file holds just that episode.

## Alpha 0.28 — 2026-11-11

- **A new On Demand.** A banner for the show you are on, then a row of posters for each channel (Left and Right along a row, Up and Down between channels, OK to open). A show opens on its own page with its poster, details, a Play button, season chips and the episode list. Real seasons come first in order; anything that does not fit a season (specials, unnumbered files) is under "Other videos" at the end, and a show with no seasons is one list. Flat colours and an outline for focus keep it light on older boxes.

## Alpha 0.27 — 2026-11-11

- **New aspect ratio: Smart.** Under Options > Aspect ratio, after Auto. A 4:3 programme keeps its true shape, with no stretching or squashing, and the empty bars at the sides are filled with a soft, dimmed, enlarged copy of the picture, so it looks at home on a modern 16:9 TV. Widescreen programmes are left alone. It costs next to nothing to run, because the copy is only 48 by 27 pixels.

## Alpha 0.26.2 — 2026-11-11

- **Black screen with sound is caught.** If a programme plays sound but shows no picture (an audio-only file, or video this TV cannot decode), the app now notes it in the debug log with the file's name, marks it slow so it is skipped for a while, and moves on to the next programme.

## Alpha 0.26.1 — 2026-11-11

- **VHS 2 lines are now even.** The lines were drawn at fractions of a pixel, so some came out thick and some gaps wide. They are now drawn in whole screen pixels, so every line and every gap is the same size.

## Alpha 0.26 — 2026-11-11

- **New enhancement: VHS 2.** Under Options > Enhancements, after VHS: a flat, saturated picture with fine dark lines right across it, like a tape on a cheap set.

## Alpha 0.25.6 — 2026-11-11

- **The Bill channel is now Drama.** The channel id `thebill` becomes `drama` in the app and in `tools/shows.json` (named just "Drama"), matching the scraper's new `drama.json`. The Bill stays on both Drama and ITV. Until the scraper publishes the new file, the app uses its built-in Drama list.

## Alpha 0.25.5 — 2026-11-11

- **`routes.json` is now the source of truth for where shows go.** A show it lists appears only on the channel(s) it names and is dropped from any other channel's list, so moving a show by hand in the scraper moves it on the TV too. Shows it doesn't list keep their channels from `tools/shows.json`.
- **The Disney channel has no era limit and needs no air dates or TVmaze id.** Undated and pre-1970 cartoon shorts (Donald Duck, Mickey Mouse, Goofy, Pluto, Silly Symphonies, Disney Cartoons) play on Disney; every other channel still keeps 1970 to 1999.

## Alpha 0.25.4 — 2026-11-10

- **Shows the scraper has removed for good stay off the TV.** When the scraper publishes `data/removed-shows.json` (and `removed` in `index.json`), those shows are left out of every channel and out of On Demand, whatever the lists say. C.O.P.S. is the first; it is also gone from `tools/shows.json`

## Alpha 0.25.3 — 2026-11-10

- **Soaps are on the Soaps channel and on their broadcaster's channel.** EastEnders is on BBC and on Soaps, Emmerdale and Crossroads on ITV and on Soaps, and so on; every soap the library has goes to Soaps. (They had been kept off BBC and ITV.) The 25% cap per show still stops one long soap from filling BBC or ITV
- **A brief server error from archive.org is no longer the end of a programme.** The debug log showed Bananaman, News 24 and others all failing in the same few minutes with archive.org answering 500 or 502 and then playing normally a moment later. The on-device buffer now asks again, twice, before giving up
- **A programme that had started playing is no longer given up on** if it paused to buffer: the 25 second check applies only to one that never got going (The Witches was skipped after playing for 20 seconds, and marked slow for two weeks)
- Missing On Demand episode guides are no longer listed as failures in the debug log, and scrolling quickly down the shows asks for a guide only when the highlight rests

## Alpha 0.25.2 — 2026-11-10

- **A video file is a video file.** The library lists may carry mp4, m4v or mkv and the app no longer treats the formats differently: the special "prefer an mp4 over an mkv" rule is gone (the scraper already sends the best copy of each episode, and the usual duplicate check still prefers archive.org's small `.ia.mp4` copy), and the on-device buffer hands the player the type archive.org reports for the file instead of working it out from the name

## Alpha 0.25.1 — 2026-11-10

- **The Debug log now says what this TV’s own player can play**: MP4, MKV (with H.264, AC3 audio or HEVC inside), WebM and AVI, each as yes, maybe or no. It is also written at the top of the log you send. This is the player’s own answer on this device, so it settles whether MKV is worth sending before any MKV is tried

## Alpha 0.25 — 2026-11-10

- **The scraper's library lists may now include `.mkv` files**, for shows archive.org only has in that form. They are used only when there is no mp4 of the same episode (an mp4 always wins), and only from the library lists, never from live archive.org searches. The on-device buffer now tells the player it is Matroska. Whether a given MKV plays depends on the codecs inside it and on this TV's built-in player, which has not been tried yet: if one fails, the debug log records it as any other failure and the channel moves on. `.avi` is not supported

## Alpha 0.24.2 — 2026-11-10

- **On Demand uses the scraper's episode guides the moment they are published.** `index.json` now lists which shows have a guide and its revision: a show with one gets it from the scraper (kept until the scraper publishes a newer one, whatever the keep setting), and a show without one still falls back to TVmaze. No request is wasted guessing at a guide that does not exist

## Alpha 0.24.1 — 2026-11-10

- **On Demand now lists every show and every episode in a category.** It was borrowing the channels' rules, which drop any file whose name has no season and episode code (Dogtanian's "1x01" style, most cartoons and a lot of drama) and sample a limited number of programmes, so CITV showed 8 shows instead of 93 and Drama 8 instead of 24. It now takes the whole library list for the channel
- Each channel in On Demand shows how many shows it has, filled in as it loads, and episodes with no number are put in natural order by name (Episode 2 before Episode 10)
- A TVmaze reply that is not an episode list can no longer cause an error

## Alpha 0.24 — 2026-11-10

- **Artwork and episode details are kept as long as you choose.** Options > **Keep artwork & details**: 1 week, 4 weeks or **Permanent** (the default). Before, they were looked up again every month. A failed lookup is still retried within the hour, and a show with nothing published is checked again in a few days, whatever this is set to
- **Options > Clear saved artwork** forgets all the saved artwork and episode details and the downloaded pictures so they are fetched fresh, and shows how much is stored. This needs the new app, since the picture cache is cleared on the device itself
- **On Demand now has episode titles, stills and summaries before the scraper publishes its episode files.** It asks TVmaze once for the whole show (using the id in `art.json`) when you open it, and keeps the answer; the scraper's `data/eps/` files take over as soon as they exist
- The Options panel is a little tighter so the new rows fit

## Alpha 0.23.3 — 2026-11-10

- **A much quicker way to the guide's On Demand button: press Left.** When the guide is on what is on now (as it is when it opens), one Left reaches the button, then OK. Right or Down goes back to the channels. Up from the first channel still works, but with many channels that was too far to climb. The guide's bottom line says so

## Alpha 0.23.2 — 2026-11-10

- **On Demand can be reached with the arrow keys and OK alone.** In the guide there is an **On Demand** button beside the clock: press Up from the first channel to reach it, then OK (Down goes back to the channels). While watching, the OK bar has an **On Demand** button beside Options. The coloured-button and Menu shortcuts still work for remotes that have them

## Alpha 0.23.1 — 2026-11-10

- **The blue button opens On Demand**, in the guide (where its legend now says so; Blue used to repeat OK's "Watch") and while watching. Options > On Demand still works

## Alpha 0.23 — 2026-11-10

- **On Demand (TV).** Options > On Demand (or the remote's Menu key, if it has one) opens a browser: channels on the left, that channel's shows A to Z in the middle, and its series and episodes in order on the right. OK on an episode plays it from the start, like a recording, with the usual bar to pause and skip; when it ends the next episode of that show starts, and at the end of the show you are back in the browser. Back steps back a column. Films, songs and dated clips are not listed as shows
- Under the episode list: the highlighted episode's still, title, year, running time and summary, or the show's own summary, network, years and genres when there is no episode detail. Episode details come from the scraper's new `data/eps/<show>.json` files (see `tools/meta-contract.md`); until they are published the list shows the library's own titles

## Alpha 0.22.1 — 2026-11-10

- **Changing channel now shows the "Please stand by" TV instead of the full-screen static.** It comes up at once, stays for at least a moment so it is seen, and plays a short hiss. If the programme's artwork is not known yet it looks it up and swaps it onto the TV screen as soon as it arrives; a programme with no artwork anywhere stays on static. The guide's small preview no longer shows static while tuning

## Alpha 0.22 — 2026-11-10

- **The "Please stand by" screen now shows what is about to play.** Its artwork (a film's poster, or a show's poster or backdrop) appears on the screen of a little retro TV set, with scanlines, a gentle flicker of static and a blinking standby light. If the show has no artwork to hand, the set stays and its screen shows static instead. Artwork is only used when it is already known, so the screen never waits on the network, and the lookup runs in the background so that show has art next time

## Alpha 0.21 — 2026-11-10

- **Press Back twice quickly to quit, from the guide or while watching.** A box asks "Quit Telly Addicts?" with Yes and No as buttons: Left and Right then OK on the remote, or a click. No is already chosen, so an accidental OK does nothing. A single Back does what it always did (the guide while watching, back to the picture from the guide), and Back on the box answers No

## Alpha 0.20.1 — 2026-11-10

- The debug log no longer records a missing `art.json` or `routes.json` as a failed request. They are optional until the scraper publishes them, and the entries were burying real problems

## Alpha 0.20 — 2026-11-10

- **The debug log can now say why a programme is wrong, not only why one failed.** Pressing Info on anything that is playing writes a record of it: the show it was listed as, the archive.org item and file it came from, how long the listing says it should be and how long the file really is, and the picture size. The app also asks archive.org what that upload actually is (its title, who uploaded it, language, collections, the start of its description) and records the answer, which is what shows a programme to be a different show with the same name
- A file much shorter than its listing is logged as a mismatch the moment it loads, with the same details, without anyone having to press anything
- The Debug log screen says how to use this and lists the latest programmes you checked

## Alpha 0.19 — 2026-11-10

- **The debug log opens from a phone or computer.** The log page could only answer one connection at a time, and a browser opens spare ones that say nothing, so the real request waited and then failed with "unexpectedly closed the connection". Each connection is now answered separately. The Debug log screen also spells out that the address must be typed with `http://` at the front, because a browser left to guess tries a secure connection, which this page does not speak

## Alpha 0.18 — 2026-11-10

- **Options has a new look.** It is a full-height sheet down the right of the screen, with the settings grouped under Picture, On screen, Playback & listings and About, and a line at the bottom saying what the highlighted setting does. Rows that open a screen show a small arrow instead of "Press OK"
- "Picture" is now "Aspect ratio" and "Extra metadata" is now "Artwork", which is what they change

## Alpha 0.17 — 2026-11-10

- The debug log has its own screen and its own row at the bottom of Options, and About & credits is just the credits again. The log screen shows the address to open from a phone or computer and the latest eight failures, newest first

## Alpha 0.16 — 2026-11-10

- **Long programmes no longer fail when Buffer is on.** Joining a programme part-way through, which the clock does all the time, asks for a point well into the file. The buffer only downloads a set distance ahead, so it sat waiting for a point it would never reach, the picture never started, and after 25 seconds the app gave up and moved on. Feature-length episodes were hit hardest. The buffer now restarts its download wherever the player asks. Files whose index sits at the end had the same problem and are fixed with it
- Programmes wrongly marked "slow to start" because of that are given a clean slate
- **A debug log.** The app keeps a record of what it played, how long each took to start, and what went wrong when something failed, including what archive.org answered for that file. Options > About & debug log shows the latest failures and an address to open on a phone or computer on the same Wi-Fi, where the whole log can be copied and sent

## Alpha 0.15 — 2026-11-10

- **Soaps follow the clock.** Neighbours at lunchtime and again at 5.35, Crossroads in the early evening, Home and Away after it, EastEnders at half past seven on the dot, and the other serials after them. Crossroads also fills the daytime so the smaller soaps are not left repeating. A soap with only a few episodes is topped up from the others rather than playing the same ones over

## Alpha 0.14 — 2026-11-10

- **New channel 25, Soaps**: EastEnders, Coronation Street, Emmerdale, Crossroads, Neighbours, Home and Away, Brookside, Hollyoaks, Eldorado, Howards' Way, Albion Market, Prisoner Cell Block H and the rest. Crossroads alone is 1,269 episodes, which is why the soaps moved off the BBC and ITV channels, where they were crowding out everything else those broadcasters made. Neighbours and Home and Away also stay in the daytime listing

## Alpha 0.13 — 2026-11-10

- **Artwork can come ready-made from the scraper.** The scraper looks each show up once and publishes the posters, backdrops and summaries in `data/art.json` (described in `tools/art-contract.md`); the TV reads that first, so a listed show has its picture the first time you reach it, with no searching and nothing to be refused. A show that isn't listed is still looked up on TVmaze as before, so this only adds. Until the scraper publishes the file, nothing changes

## Alpha 0.12 — 2026-11-10

- **Artwork that failed to load is looked for again soon, not remembered as "none" for a month.** When the guide moved quickly TVmaze turned some requests away, and the app took the refusal as "this show has no picture" and kept that answer for 30 days, so those shows stayed bare. A refused request is now retried within the hour, and a show TVmaze genuinely does not know is re-checked after five days. Blank answers saved by earlier versions are cleared, so the shows that missed out get another go

## Alpha 0.11 — 2026-11-10

- **The Bill is limited to three episodes a day** on Drama. It makes up about half of what the channel has, so it was crowding everything else out. Now there is one at half past six, then the eight o'clock slot, and the rest of the day belongs to the other dramas. The three change every day, so the week shows twenty-one different episodes, and Drama's schedule now repeats weekly instead of daily

## Alpha 0.10 — 2026-11-10

- **Drama (channel 7) now follows the clock.** The Bill was three-quarters of the channel and played back to back all day. Now the gentler dramas fill the day (Lovejoy, Heartbeat, Ballykissangel, Upstairs Downstairs, Poirot, Hetty Wainthropp and the like), The Bill starts at 8pm on the dot as it did on ITV, and the heavier crime comes after the 9pm watershed: The Professionals, Minder, Bergerac, Spooks, Morse, Prime Suspect and I, Claudius. A thin library falls back to the ordinary loop rather than leaving the channel empty

## Alpha 0.9 — 2026-11-10

- **The film channels work.** Kids Films and The Video Shop were coming up empty: the certificate the scraper attaches to each film was lost on its way from the library to the channel, so the safety check refused every film. Certificates, plots, posters, genres and running times now arrive intact — Kids Films has 52 films and The Video Shop 132, each placed by its certificate
- **R-rated films wait for the watershed** with the 18s instead of going out at eight in the evening. Only 15, PG-13 and TV-14 do
- **The adult-word filter no longer throws out a genuine programme.** "Porn Yesterday", a 1974 Steptoe and Son episode, was being blocked by a word meant for films. The strictest words still apply to films, and the plainly adult ones apply everywhere

## Alpha 0.8 — 2026-11-09

- **Shows now reach the BBC and ITV channels by who broadcast them**, as well as by genre, using the network the scraper records. Children's programmes are left where they belong: a cartoon that happened to be on BBC1 stays on CITV rather than joining the evening's drama
- **Christmas episodes find the Christmas channels on their own** — the adult one, or Kids' Christmas when the show is a children's one
- BBC and ITV soaps are in the genre lists for good: EastEnders, Eldorado, Howards' Way, Angels, The Brothers, Triangle and Pobol y Cwm on BBC; Coronation Street, Emmerdale, Crossroads, Albion Market, Families, Take the High Road, Prisoner Cell Block H and The Sullivans on ITV
- The 1970-1999 rule is applied as channels are worked out, not only afterwards, so an out-of-era episode never reaches a channel in the first place

## Alpha 0.7 — 2026-11-09

- **Nothing made after 1999 is scheduled any more.** The scrape had matched some shows to their modern remake or revival, so 2,091 episodes were out of era: Sailor Moon came back as the 2012 Sailor Moon Crystal, Thomas as the 2007 series, and The Bill brought 867 episodes made after the cut-off. Each episode is now judged by its own air date, so the early years of a long-running show stay and the later ones go
- **CITV is British children's ITV again.** 26 cartoons that only ever reached Britain on cable and satellite, or after 1999, have moved to Children's World: Dragon Ball Z, Sailor Moon, Pokemon, Digimon, Extreme Dinosaurs, Monster Force, Mega Man, Men in Black and the rest. They still play, just not on the channel claiming to be CITV
- Guyver is off the children's channels altogether. It is a violent 18-rated horror anime and was never children's television anywhere

## Alpha 0.6.2 — 2026-11-09

- The TMDB credit and logo live in Options > About & credits, and a film's Info screen just says where its details came from, the way the TVmaze screens do

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
