#!/usr/bin/env python3
"""Pack the scraper's per-show episode files (data/eps/*.json) into one file, data/epdb.json, for Magic EPG.

Magic EPG fills the channel guides with every episode a show has, not only the ones the library has a file for.
The scraper already publishes every episode each source knows in data/eps/<show>.json; the TV would have to
fetch hundreds of small files at start-up to use them, so this packs them into one compact file.

    python3 tools/build_epdb.py            # write british-tv/data/epdb.json
    python3 tools/build_epdb.py --check    # say whether it is up to date, change nothing

The key is the show name the way the app's normShow() makes it (lower case, & as "and", leading "the" dropped,
only letters and digits kept). Each episode is [season, episode, title, air date]. Specials (season 0) are left out.
Run it after the scraper publishes new episode files.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPS = ROOT / "british-tv/data/eps"
OUT = ROOT / "british-tv/data/epdb.json"


def norm_show(s):
    s = str(s).lower().replace("&", "and")
    s = re.sub(r"^the\s+", "", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def build():
    shows = {}
    for f in sorted(EPS.glob("*.json")):
        try:
            d = json.loads(f.read_text(encoding="utf-8"))
        except ValueError:
            continue
        name = d.get("show") or ""
        eps = [[e["s"], e["e"], e.get("t") or "", e.get("a") or ""]
               for e in d.get("eps", []) if isinstance(e.get("s"), int) and isinstance(e.get("e"), int) and e["s"] > 0]
        if name and eps:
            shows[norm_show(name)] = {"n": name, "e": eps}
    return {"format": "telly-addicts-epdb", "v": 1, "shows": shows}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--force", action="store_true", help="overwrite a v2 file written by the scraper")
    a = ap.parse_args()
    if OUT.exists() and not a.force and '"v":2' in OUT.read_text(encoding="utf-8")[:200]:
        print("data/epdb.json is the scraper's (v2): not overwriting. Use --force to replace it.")
        return 0
    text = json.dumps(build(), ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n"
    stale = not OUT.exists() or OUT.read_text(encoding="utf-8") != text
    if a.check:
        print("stale: run tools/build_epdb.py" if stale else "up to date")
        return 1 if stale else 0
    if stale:
        OUT.write_text(text, encoding="utf-8")
    n = text.count('"n":')
    print(("wrote" if stale else "unchanged:"), OUT.relative_to(ROOT), "-", n, "shows,", round(len(text) / 1048576, 2), "MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
