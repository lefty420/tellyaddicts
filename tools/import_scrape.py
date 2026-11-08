#!/usr/bin/env python3
"""Turn the text files written by the archive.org scraper script (archive_*.txt) into
british-tv/app/src/main/assets/autodata.js, which the app's experimental Auto EPG uses as ready-made channel lists
(no searching on the TV, so those channels load straight away).

    python3 tools/import_scrape.py archive_drama_and_3.txt --channel thebill   (the channel called Drama has the id thebill)

--channel   channel id that gets the programmes (ids are in channels.js: drama, sitcoms, gameshows, citv, music, ...)
--route     "Show name=channel id" sends one show to a different channel (repeatable)
Running it again with another file adds to / replaces that channel's list; other channels are kept.
"""
import argparse, json, os, re, sys, urllib.parse

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'british-tv', 'app', 'src', 'main', 'assets', 'autodata.js')
PREFIX = 'window.AUTODATA = '

def load_existing():
    try:
        s = open(OUT, encoding='utf-8').read()
        return json.loads(s[len(PREFIX):].rstrip().rstrip(';'))
    except Exception:
        return {}

def parse(path):
    text = open(path, encoding='utf-8', errors='replace').read()
    for m in re.finditer(r'Title: (.*?) \(Source: (.*?)\)\nArchive Folder \(ID\): (.*?)\nURL: (\S+)', text):
        title, source, ident, url = m.groups()
        base = 'https://archive.org/download/' + ident + '/'
        if not url.startswith(base):
            continue                                   # only clean archive.org/download links are kept
        name = urllib.parse.unquote(url[len(base):])
        sm = re.match(r'\[(.*?)\]', title)
        yield ident, source, name, (sm.group(1) if sm else 'Unknown Show')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--channel', required=True)
    ap.add_argument('--route', action='append', default=[])
    a = ap.parse_args()
    routes = dict(r.split('=', 1) for r in a.route)
    data = load_existing()
    per = {}                                           # channel -> ident -> item
    for ident, source, name, show in parse(a.file):
        ch = routes.get(show, a.channel)
        it = per.setdefault(ch, {}).setdefault(ident, {'id': ident, 't': source, 'f': []})
        it['f'].append([name, show])
    for ch, items in per.items():
        out = []
        for it in items.values():
            shows = {s for _, s in it['f']}
            if len(shows) == 1:
                it['s'] = shows.pop()
                it['f'] = [n for n, _ in it['f']]
            out.append(it)
        data[ch] = out
        print('%-10s %5d items %6d files' % (ch, len(out), sum(len(i['f']) for i in out)))
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(PREFIX + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('wrote', os.path.abspath(OUT), os.path.getsize(OUT) // 1024, 'KB')

if __name__ == '__main__':
    main()
