# data/eps/<show>.json: episode details, found once by the scraper

On Demand lists every show's series and episodes. The show-level pictures and summary already come from
`art.json` (see `art-contract.md`). What it lacks is the **episode-level** detail: a proper title, a summary,
a still and a running time for each episode. Asking TVmaze from the TV for every episode is slow and fragile, so
the scraper gathers them once and publishes one small file per show. The TV fetches a show's file only when you
open that show in On Demand, and keeps it for a week.

## File

`british-tv/data/eps/<slug>.json`, one per show in `library.json`.

`<slug>` is the show name lower-cased, `&` as `and`, apostrophes removed, every other run of non-letters and
non-digits as a single `-`, and a leading `the-` dropped. "The Generation Game" is `generation-game`,
"Noel's House Party" is `noels-house-party`, "Bread" is `bread`.

```json
{
  "format": "telly-addicts-eps",
  "v": 1,
  "show": "Bergerac",
  "i": 123,
  "seasons": {
    "1": { "p": "https://image.tmdb.org/t/p/w500/season1.jpg", "y": 1981 }
  },
  "eps": [
    { "s": 1, "e": 1, "t": "Chance in a Million", "a": "1981-10-18", "l": 50,
      "d": "Plain-text summary of the episode.", "img": "https://image.tmdb.org/t/p/w300/still.jpg" }
  ]
}
```

* `show` is the name exactly as in `library.json`. `i` is the TVmaze id if known.
* `seasons` is optional: `p` a season poster, `y` the year it started.
* `eps` is every episode the source knows, not only the ones in the library: the TV matches on `s` and `e`
  (season and episode number), so extra ones cost nothing and let it show what exists.
* `t` title, `a` air date (`YYYY-MM-DD`), `l` running time in minutes, `d` summary (plain text, no HTML),
  `img` a still (landscape, about 300 to 500 px wide). Every field except `s` and `e` is optional.
* Image URLs must be `https`; `image.tmdb.org` and `static.tvmaze.com` both work on the TV.
* A show with no episode data simply has no file. The TV copes with a 404 and shows the library's own titles.
* No adult material, as everywhere else.

## Extra artwork (fanart) in art.json

Optional extra fields on a show's entry in `art.json`, for when a source such as fanart.tv is available:

* `bs`: an array of extra backdrop URLs (the TV uses the first one it can load if `b` is missing),
* `lg`: a clear logo (transparent PNG, wide), shown over the backdrop in On Demand,
* `t`: a wide thumbnail.

The TV already uses `p` and `b`; the rest is ignored until it is wanted, so sending them early does no harm.

## What the scraper should do

* TVmaze has everything above for most British shows (`/shows/<id>/episodes` and `/shows/<id>/seasons`); TMDb's
  `/tv/<id>/season/<n>` has stills. Use what you already have keys for; a missing field is fine.
* Fetch each show once, rewrite its file only when something changed, and re-check shows with no match only now
  and then.
* Do the biggest and most-watched shows first (The Bill, Casualty, Coronation Street, EastEnders, Emmerdale).
* Keep the files small: leave out empty fields and trim summaries to about 400 characters.
