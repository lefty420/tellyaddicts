# data/art.json: show artwork, found once by the scraper

The TV used to search TVmaze for every show itself, one request at a time, the first time you reached it, so
a show was bare on its first visit and a refused request could leave it bare. The scraper now does that lookup
once for the whole library and publishes the answers; the TV reads them and only falls back to TVmaze for a show
the file does not list.

## File

`british-tv/data/art.json`, written by the scraper beside `library.json`:

```json
{
  "format": "telly-addicts-art",
  "v": 1,
  "rev": "a1b2c3d4e5",
  "shows": {
    "Bergerac": {
      "p": "https://image.tmdb.org/t/p/w500/abc.jpg",
      "b": "https://image.tmdb.org/t/p/w1280/def.jpg",
      "s": "Short plot summary, plain text.",
      "y": 1981, "e": 1991,
      "n": "BBC One",
      "g": "Crime, Drama",
      "r": 7.6,
      "i": 123
    }
  }
}
```

* Keys are the show names exactly as in `library.json` (`shows[].n`). The TV ignores case, a leading "The",
  and punctuation when it matches.
* Every field except the key is optional; send what you have. A show with no backdrop is still worth listing for
  its poster and summary.
* `p` poster (portrait, about 500 px wide is plenty), `b` backdrop (landscape, about 1280 px), `s` summary,
  `y` first year, `e` last year, `n` network, `g` genres as one string, `r` rating out of 10.
* `i` is the **TVmaze id**, if the scraper has it. With it the TV fetches one episode list when you open Info;
  without it the Info screen simply shows the show and not the episode's own details.
* Image URLs must be `https`. TMDb (`image.tmdb.org`) or TVmaze (`static.tvmaze.com`) addresses both work.
* No adult material, as everywhere else.

## index.json

Add `"art": "<rev>"` beside `"library"` and `"routes"`, the same revision as in `art.json`. The TV keeps one
copy per revision and downloads a new one only when it changes. If `art` is missing from the index the TV
checks `art.json` again every six hours instead.

## What the scraper should do

* Search TMDb (TV) first, which it already has a key for, then TVmaze for what TMDb lacks. Prefer a British
  show over an American one of the same name, and the oldest series when there are several.
* Look each show up once and keep the answer, sending it again unchanged on every later send. Re-check a show
  with no match only now and then, not on every send.
* List every show in `library.json`, not only the ones already on a channel, so Auto EPG has pictures too.
