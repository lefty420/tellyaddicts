#!/usr/bin/env python3
"""Writes british-tv/app/src/main/assets/absnum.js: for soaps whose files are named by overall episode number
("Neighbours Episode 2965", "Neighbours 1000"), the ranges that turn that number into a season and episode.

The numbers come from the episode guides in british-tv/data/eps (TVmaze names those episodes "Episode N").
Each range is [first overall number, season, first episode in that season, how many]. Only the shows listed in
SHOWS are written: the overall number must be unique per episode in the guide, which is true for Neighbours
(checked: 1,586 files with both a number and a year agreed with the guide's air year, none off by more than one).
Run it again after adding a show here; past episodes never change, so it need not run for every guide update."""
import glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'british-tv', 'data', 'eps')
OUT = os.path.join(HERE, '..', 'british-tv', 'app', 'src', 'main', 'assets', 'absnum.js')
SHOWS = ['Neighbours']


def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', s.lower().replace('&', ' and ')).strip()


def main():
    out = {}
    for f in glob.glob(os.path.join(DATA, '*.json')):
        d = json.load(open(f))
        if d.get('show') not in SHOWS:
            continue
        rows = sorted((int(m.group(1)), x['s'], x['e']) for x in d['eps']
                      for m in [re.match(r'^Episode (\d+)$', x.get('t', ''))] if m)
        if len({r[0] for r in rows}) != len(rows):
            sys.exit(d['show'] + ': overall numbers are not unique, not written')
        runs = []
        for n, s, e in rows:
            r = runs[-1] if runs else None
            if r and r[1] == s and n == r[0] + r[3] and e == r[2] + r[3]:
                r[3] += 1
            else:
                runs.append([n, s, e, 1])
        out[norm(d['show'])] = runs
    with open(OUT, 'w') as fh:
        fh.write('// Made by tools/make_absnum.py from the episode guides. Do not edit.\nwindow.ABSNUM = ' + json.dumps(out, separators=(',', ':')) + ';\n')
    print('wrote', OUT, {k: len(v) for k, v in out.items()})


if __name__ == '__main__':
    main()
