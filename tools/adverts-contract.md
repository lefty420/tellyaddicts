# Advert catalogue (scraper -> TV app)

The TV app plays advert breaks between programmes, and **never plays an advert from after 1999**. Today it finds adverts by
searching archive.org while the app runs, which is slow, and it can only guess an advert's year from its title. The
scraper should publish a checked catalogue instead, and the app will use it in place of those searches.

File: `british-tv/data/adverts.json`, listed in `index.json` as `"adverts": "<revision>"` like the other files.

```json
{
  "format": "telly-addicts-adverts", "v": 1,
  "adverts": [
    {
      "id": "archive-item-id/file.mp4",
      "url": "https://archive.org/download/archive-item-id/file.mp4",
      "title": "Cadbury's Flake 1987",
      "brand": "Cadbury",
      "year": 1987,
      "cat": ["food", "sweets"],
      "dur": 30,
      "region": "uk",
      "restricted": false
    }
  ]
}
```

| field | meaning |
|---|---|
| `year` | **Required, and checked** (from the item's own date, the broadcast info or the description, not guessed). Anything that cannot be dated to 1970-1999 is left out. |
| `cat` | One or more of: `toys`, `sweets`, `food`, `drink`, `household`, `cars`, `games`, `music`, `retail`, `finance`, `telecoms`, `health`, `charity`, `film`, `tv-promo`, `other`. The app matches these to the channel (toys and sweets on kids channels, household and food by day, and so on). |
| `dur` | Length in seconds, as measured from the file. Under 5 minutes. |
| `region` | `uk` only. Leave out US, Australian and other adverts. |
| `restricted` | `true` for alcohol, tobacco and gambling. The app keeps these out of children's and daytime breaks and before 9pm. |
| `brand` | The advertiser. The app never puts two adverts for the same brand in one break. |

Rules:
- BBC items (the BBC has no adverts) and anything from 2000 on are left out.
- Prefer `.mp4` (H.264 + AAC) over `.mkv`, so every box can play it.
- Where a file holds a whole ad break or a compilation, split it or list it with `dur` as the full length and `cat: ["compilation"]`.
- Aim for several hundred to a few thousand, with every year from 1970 to 1999 covered, 1980s and 1990s especially.
