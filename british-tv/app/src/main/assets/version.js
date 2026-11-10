// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.
// This is what Options > What's new shows on the TV.
window.RELEASE = {
  "name": "Alpha 0.10",
  "version": "0.10",
  "code": 1000,
  "date": "2026-11-10",
  "notes": [
    "**Drama (channel 7) now follows the clock.** The Bill was three-quarters of the channel and played back to back all day. Now the gentler dramas fill the day (Lovejoy, Heartbeat, Ballykissangel, Upstairs Downstairs, Poirot, Hetty Wainthropp and the like), The Bill starts at 8pm on the dot as it did on ITV, and the heavier crime comes after the 9pm watershed: The Professionals, Minder, Bergerac, Spooks, Morse, Prime Suspect and I, Claudius. A thin library falls back to the ordinary loop rather than leaving the channel empty"
  ],
  "history": [
    {
      "name": "Alpha 0.9",
      "date": "2026-11-10",
      "notes": [
        "**The film channels work.** Kids Films and The Video Shop were coming up empty: the certificate the scraper attaches to each film was lost on its way from the library to the channel, so the safety check refused every film. Certificates, plots, posters, genres and running times now arrive intact — Kids Films has 52 films and The Video Shop 132, each placed by its certificate",
        "**R-rated films wait for the watershed** with the 18s instead of going out at eight in the evening. Only 15, PG-13 and TV-14 do",
        "**The adult-word filter no longer throws out a genuine programme.** \"Porn Yesterday\", a 1974 Steptoe and Son episode, was being blocked by a word meant for films. The strictest words still apply to films, and the plainly adult ones apply everywhere"
      ]
    },
    {
      "name": "Alpha 0.8",
      "date": "2026-11-09",
      "notes": [
        "**Shows now reach the BBC and ITV channels by who broadcast them**, as well as by genre, using the network the scraper records. Children's programmes are left where they belong: a cartoon that happened to be on BBC1 stays on CITV rather than joining the evening's drama",
        "**Christmas episodes find the Christmas channels on their own** — the adult one, or Kids' Christmas when the show is a children's one",
        "BBC and ITV soaps are in the genre lists for good: EastEnders, Eldorado, Howards' Way, Angels, The Brothers, Triangle and Pobol y Cwm on BBC; Coronation Street, Emmerdale, Crossroads, Albion Market, Families, Take the High Road, Prisoner Cell Block H and The Sullivans on ITV",
        "The 1970-1999 rule is applied as channels are worked out, not only afterwards, so an out-of-era episode never reaches a channel in the first place"
      ]
    },
    {
      "name": "Alpha 0.7",
      "date": "2026-11-09",
      "notes": [
        "**Nothing made after 1999 is scheduled any more.** The scrape had matched some shows to their modern remake or revival, so 2,091 episodes were out of era: Sailor Moon came back as the 2012 Sailor Moon Crystal, Thomas as the 2007 series, and The Bill brought 867 episodes made after the cut-off. Each episode is now judged by its own air date, so the early years of a long-running show stay and the later ones go",
        "**CITV is British children's ITV again.** 26 cartoons that only ever reached Britain on cable and satellite, or after 1999, have moved to Children's World: Dragon Ball Z, Sailor Moon, Pokemon, Digimon, Extreme Dinosaurs, Monster Force, Mega Man, Men in Black and the rest. They still play, just not on the channel claiming to be CITV",
        "Guyver is off the children's channels altogether. It is a violent 18-rated horror anime and was never children's television anywhere"
      ]
    },
    {
      "name": "Alpha 0.6.2",
      "date": "2026-11-09",
      "notes": [
        "The TMDB credit and logo live in Options > About & credits, and a film's Info screen just says where its details came from, the way the TVmaze screens do"
      ]
    },
    {
      "name": "Alpha 0.6.1",
      "date": "2026-11-09",
      "notes": [
        "The TMDB logo now sits beside their credit on a film's Info screen and in About & credits, which is what their terms ask for"
      ]
    },
    {
      "name": "Alpha 0.6",
      "date": "2026-11-09",
      "notes": [
        "**You can see the buffer working.** The on-screen bar now shows how far ahead the programme is loaded, behind the played part, and turns amber with \"on this device\" when the picture is genuinely coming off the box rather than straight from archive.org. Info spells it out in words",
        "The Movies channel is gone, its films having been split into Kids Films and The Video Shop. Saturday Night TV is channel 23 and The Video Shop is 24"
      ]
    },
    {
      "name": "Alpha 0.5",
      "date": "2026-11-09",
      "notes": [
        "**A film now plays only if it carries a certificate.** The scraped film list turned out to include pornography sitting next to the children's films, and nothing in the data told them apart, so a film with no certificate is not scheduled at all. Until certificates arrive the film channels find nothing and hide themselves",
        "Adult material is kept off every channel, whichever list it arrives on",
        "**New channel 25, The Video Shop**: the rental shelf, scheduled by certificate — family films through the day, 15s from eight, and the 18s only after nine, as they were on television. Checked minute by minute across a full day",
        "Kids Films and The Video Shop added to the genre lists, with no episode numbers demanded of either",
        "A film's certificate shows on its Info screen"
      ]
    },
    {
      "name": "Alpha 0.4",
      "date": "2026-11-09",
      "notes": [
        "Films on the Movies channel now have a proper Info screen: the poster, the plot, the year, the genres and the running time, all from the details the scraper gathers, so it appears at once with nothing to look up",
        "Film posters show on the on-screen bar and behind the guide",
        "New **About & credits** in Options, listing where everything comes from: archive.org, TVmaze, TMDB and the scraper",
        "Film details are stored once each rather than repeated on every listing, so posters and plots cost almost nothing to keep"
      ]
    }
  ]
};
