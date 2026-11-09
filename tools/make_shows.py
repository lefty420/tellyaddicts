#!/usr/bin/env python3
"""Write the show lists in auto.js from tools/shows.json, so the two cannot drift apart.

tools/shows.json is the contract: it says which shows belong to which channel, and both this app and
the Telly Addict Scraper read it. auto.js carries a copy of those lists, because the genre guard runs
on the TV with no network: the guard uses them to keep a drama off CITV and a cartoon off the sitcom
channel, and the Auto EPG searches use them as extra keywords.

That copy used to be pasted in by hand, and had fallen behind: the Video Game Shows category was
missing from it altogether and Game Shows had 29 of its 116 shows. This writes it instead.

    python3 tools/make_shows.py            # update auto.js
    python3 tools/make_shows.py --check    # say whether it is up to date, change nothing

Categories flagged "songs" or "films" are left out on purpose. Everything in them is filed under one
name ("Christmas Songs", "Movies"), which says nothing about genre, so feeding them to the guard
would only make it match things it should not.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SHOWS = ROOT / "tools/shows.json"
AUTO = ROOT / "british-tv/app/src/main/assets/auto.js"

START = "var SHOWS = {"
END = "};"
HEADER = (
    "var SHOWS = {  // written by tools/make_shows.py from tools/shows.json (the contract with the scraper).\n"
    "               // Song and film categories are left out: everything in them is filed under one name,\n"
    "               // so it says nothing about genre. Run the script after editing shows.json.\n"
)


def js_string(s: str) -> str:
    """A JavaScript single-quoted string. The lists hold apostrophes ("Bucky O'Hare")."""
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def block(cats: dict) -> str:
    lines = []
    for channel, cat in cats.items():
        if cat.get("songs") or cat.get("films"):
            continue
        names = cat.get("shows") or []
        if not names:
            continue
        lines.append("  %s: [%s]" % (channel, ", ".join(js_string(n) for n in names)))
    return HEADER + ",\n".join(lines) + "\n" + END


def main() -> int:
    args = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    args.add_argument("--check", action="store_true", help="report only, change nothing")
    opts = args.parse_args()

    cats = json.loads(SHOWS.read_text(encoding="utf-8"))
    text = AUTO.read_text(encoding="utf-8")
    at = text.find(START)
    if at < 0:
        print(f"make_shows: no '{START}' in {AUTO.name}", file=sys.stderr)
        return 1
    stop = text.find("\n" + END, at)
    if stop < 0:
        print(f"make_shows: the SHOWS block in {AUTO.name} does not end with '{END}'", file=sys.stderr)
        return 1

    fresh = text[:at] + block(cats) + text[stop + len("\n" + END):]
    kept = {c: len(v.get("shows") or []) for c, v in cats.items() if not (v.get("songs") or v.get("films"))}
    left_out = [c for c, v in cats.items() if v.get("songs") or v.get("films")]
    print(f"{len(kept)} categories, {sum(kept.values())} shows"
          + (f"  (left out: {', '.join(left_out)})" if left_out else ""))

    if fresh == text:
        print("auto.js is up to date")
        return 0
    if opts.check:
        print("auto.js is OUT OF DATE: run tools/make_shows.py")
        return 1
    AUTO.write_text(fresh, encoding="utf-8")
    print("wrote", AUTO.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
