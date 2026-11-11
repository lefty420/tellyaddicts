#!/usr/bin/env python3
"""A hand-off file for the scraper: what is missing from the library.

Part 1, shows on a channel list in tools/shows.json with no files at all (`no_files`).
Part 2, shows we do have, with the seasons and episodes the library holds (`partial`), so the scraper can set them
against its TVmaze guide and go and find the rest. Shows with a TVmaze id are merged under it (Poirot is held under
two names). Only episodes up to 1999 matter.

    python3 tools/missing_report.py     # writes tools/missing-for-scraper.json

The TV can also write the per-episode comparison itself (Options > Missing episodes report); this is the version
that needs no TV.
"""
import json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
def norm(t):
    t = str(t or "").lower().replace("&", " and ").replace("'", "").replace("’", "")
    return re.sub(r"^the ", "", re.sub(r"[^a-z0-9]+", " ", t).strip())
lib = json.loads((ROOT / "british-tv/data/library.json").read_text(encoding="utf-8"))
sj = json.loads((ROOT / "tools/shows.json").read_text(encoding="utf-8"))
def ranges(nums):
    nums = sorted(set(nums)); out = []; i = 0
    while i < len(nums):
        j = i
        while j + 1 < len(nums) and nums[j + 1] == nums[j] + 1: j += 1
        out.append(f"{nums[i]}-{nums[j]}" if j > i else str(nums[i])); i = j + 1
    return ",".join(out)
chan = {}
for ch, v in sj.items():
    for n in v.get("shows", []): chan.setdefault(norm(n), []).append(ch)
have = {norm(s["n"]) for s in lib["shows"]}
# a channel with its own published file (data/cooking.json) holds shows the library does not
for f in (ROOT / "british-tv/data").glob("*.json"):
    try:
        rows = json.loads(f.read_text(encoding="utf-8"))
    except Exception:
        continue
    if isinstance(rows, list):
        have.update(norm(r.get("s")) for r in rows if isinstance(r, dict) and r.get("s"))
no_files = {ch: [n for n in v.get("shows", []) if norm(n) not in have] for ch, v in sj.items()}
no_files = {k: v for k, v in no_files.items() if v}
merged = {}
for s in lib["shows"]:
    tv = s.get("tv") or {}
    key = tv.get("id") if tv.get("id", 0) and tv.get("id", 0) > 0 else "n:" + norm(s["n"])
    m = merged.setdefault(key, {"show": tv.get("n") or s["n"], "tvmaze_id": tv.get("id") if isinstance(tv.get("id"), int) and tv["id"] > 0 else None,
                                "library_names": [], "channels": set(), "seasons": {}, "unnumbered": 0, "files": 0})
    if s["n"] not in m["library_names"]: m["library_names"].append(s["n"])
    m["channels"].update(chan.get(norm(s["n"]), []))
    for e in s.get("e", []):
        m["files"] += 1
        mm = re.match(r"S(\d+)E(\d+)", str(e.get("c") or ""))
        if mm: m["seasons"].setdefault(int(mm[1]), []).append(int(mm[2]))
        else: m["unnumbered"] += 1
partial = []
for m in merged.values():
    partial.append({"show": m["show"], "tvmaze_id": m["tvmaze_id"], "library_names": m["library_names"], "channels": sorted(m["channels"]),
                    "files": m["files"], "unnumbered_files": m["unnumbered"],
                    "have_seasons": {str(k): ranges(v) for k, v in sorted(m["seasons"].items())}})
partial.sort(key=lambda x: x["show"].lower())
out = {"note": "no_files: listed on a channel but nothing found, please search for them. partial: what the library holds per season (episode ranges); "
               "compare with the TVmaze guide (tvmaze_id) and find the missing seasons/episodes, 1999 and earlier only. "
               "unnumbered_files are files with no season/episode: map them before treating episodes as missing.",
       "no_files": no_files, "partial": partial}
(ROOT / "tools/missing-for-scraper.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(sum(len(v) for v in no_files.values()), "shows with no files;", len(partial), "shows with files")
