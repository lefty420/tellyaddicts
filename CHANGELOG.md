# Changelog

Every release of Telly Addicts, newest first. This file is the only place the version is written
down: `tools/make_version.py` reads it and sets the version in the app and on the APK, so what the
TV shows under **Options > What's new** is always exactly this list.

Releases are named `Alpha 0.1`, `Alpha 0.2` and so on. A release that only fixes something in a
hurry gets a third number, `Alpha 0.1.1`.

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
