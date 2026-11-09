#!/usr/bin/env python3
"""Set the app's version from CHANGELOG.md, so the two can never disagree.

CHANGELOG.md is the only place a release is written down. This reads the headings out of it and

  * writes british-tv/app/src/main/assets/version.js, which is what Options > What's new shows,
  * sets versionName and versionCode in british-tv/app/build.gradle.kts.

Run it after editing the changelog, and commit what it changes. The APK build runs it too, so a
forgotten run cannot ship an APK whose version disagrees with the changelog.

    python3 tools/make_version.py            # write the files
    python3 tools/make_version.py --check    # say what it would do, change nothing

Headings look like "## Alpha 0.1 - 2026-11-09" (an em dash is fine too). Lines starting with "- "
under a heading are that release's notes; anything else under it is ignored.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHANGELOG = ROOT / "CHANGELOG.md"
VERSION_JS = ROOT / "british-tv/app/src/main/assets/version.js"
GRADLE = ROOT / "british-tv/app/build.gradle.kts"

# "## Alpha 0.1 - 2026-11-09", with - or an em/en dash, and the date optional
HEADING = re.compile(
    r"^##\s+(?P<name>.*?\b(?P<version>\d+\.\d+(?:\.\d+)?))\s*(?:[-–—]\s*(?P<date>\d{4}-\d{2}-\d{2}))?\s*$"
)
HISTORY_KEPT = 8            # earlier releases the app carries, newest first


class Problem(Exception):
    """The changelog cannot be read as releases."""


def version_code(version: str) -> int:
    """0.1 -> 10, 0.1.1 -> 11, 0.2 -> 20, 1.0 -> 100. Always rises with the version."""
    parts = [int(p) for p in version.split(".")]
    while len(parts) < 3:
        parts.append(0)
    major, minor, patch = parts[:3]
    if minor > 9 or patch > 9:
        raise Problem(f"version {version}: minor and patch must stay under 10 for the version code")
    return major * 100 + minor * 10 + patch


def read_releases(text: str) -> list[dict]:
    """Every release in the changelog, newest first, as {name, version, date, notes}."""
    releases: list[dict] = []
    for line in text.splitlines():
        found = HEADING.match(line)
        if found:
            releases.append({
                "name": found.group("name").strip(),
                "version": found.group("version"),
                "date": found.group("date") or "",
                "notes": [],
            })
        elif releases and line.startswith("- "):
            releases[-1]["notes"].append(" ".join(line[2:].split()))
    if not releases:
        raise Problem("no release headings found: expected a line like '## Alpha 0.1 - 2026-11-09'")
    if not releases[0]["notes"]:
        raise Problem(f"the newest release ({releases[0]['name']}) has no '- ' notes under it")
    return releases


def version_js(releases: list[dict]) -> str:
    latest = releases[0]
    release = {
        "name": latest["name"],
        "version": latest["version"],
        "code": version_code(latest["version"]),
        "date": latest["date"],
        "notes": latest["notes"],
        "history": [
            {"name": r["name"], "date": r["date"], "notes": r["notes"]}
            for r in releases[1:1 + HISTORY_KEPT]
        ],
    }
    body = json.dumps(release, indent=2, ensure_ascii=False)
    return (
        "// Written by tools/make_version.py from CHANGELOG.md. Do not edit by hand.\n"
        "// This is what Options > What's new shows on the TV.\n"
        "window.RELEASE = " + body + ";\n"
    )


def patch_gradle(text: str, version: str, code: int) -> str:
    out, hits = re.subn(r"versionCode\s*=\s*\d+", f"versionCode = {code}", text, count=1)
    if not hits:
        raise Problem(f"no versionCode line in {GRADLE.name}")
    out, hits = re.subn(r'versionName\s*=\s*"[^"]*"', f'versionName = "{version}"', out, count=1)
    if not hits:
        raise Problem(f"no versionName line in {GRADLE.name}")
    return out


def main() -> int:
    args = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    args.add_argument("--check", action="store_true", help="report only, change nothing")
    opts = args.parse_args()

    try:
        releases = read_releases(CHANGELOG.read_text(encoding="utf-8"))
        latest = releases[0]
        code = version_code(latest["version"])
        js = version_js(releases)
        gradle = patch_gradle(GRADLE.read_text(encoding="utf-8"), latest["version"], code)
    except FileNotFoundError as e:
        print(f"make_version: cannot find {e.filename}", file=sys.stderr)
        return 1
    except Problem as e:
        print(f"make_version: {e}", file=sys.stderr)
        return 1

    stale = js != (VERSION_JS.read_text(encoding="utf-8") if VERSION_JS.exists() else "") \
        or gradle != GRADLE.read_text(encoding="utf-8")

    print(f"{latest['name']}  (versionName {latest['version']}, versionCode {code})"
          f"  {len(latest['notes'])} notes, {len(releases) - 1} earlier release(s)")
    if opts.check:
        print("the generated files are out of date" if stale else "the generated files are up to date")
        return 1 if stale else 0

    VERSION_JS.write_text(js, encoding="utf-8")
    GRADLE.write_text(gradle, encoding="utf-8")
    print("wrote" if stale else "unchanged:",
          VERSION_JS.relative_to(ROOT), "and", GRADLE.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
