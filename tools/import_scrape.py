#!/usr/bin/env python3
"""Turn the text files written by the archive.org scraper script (archive_*.txt) into
british-tv/app/src/main/assets/autodata.js, which the app's experimental Auto EPG uses as ready-made channel lists
(no searching on the TV, so those channels load straight away).

    python3 tools/import_scrape.py archive_*.txt

Every entry is routed by its [Show] tag (or the item title) to the channel(s) whose category lists that show
(tools/shows.json = the scraper script's categories), so a drama never lands on CITV. Give it any number of files from
any category. Only the channels that get programmes are replaced; the other channels in autodata.js are kept.

--channel   fallback channel for shows not in shows.json (default: skip them)
--route     "Show name=channel id" sends one show to a different channel (repeatable)
"""
import argparse, json, os, re, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'british-tv', 'app', 'src', 'main', 'assets', 'autodata.js')
PREFIX = 'window.AUTODATA = '
EXTRA = {'noels house party': ['noel']}              # a show that also has its own channel

def norm(t):
    t = t.lower().replace('&', ' and ').replace("'", '').replace('\u2019', '')
    return re.sub(r'^the ', '', re.sub(r'[^a-z0-9]+', ' ', t).strip())

def show_map():
    m = {}
    for ch, v in json.load(open(os.path.join(HERE, 'shows.json'), encoding='utf-8')).items():
        for name in v['shows']:
            m.setdefault(norm(name), []).append(ch)
    for k, chs in EXTRA.items():
        m.setdefault(k, []).extend(chs)
    return m

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

def channels_for(show, source, smap, routes, fallback):
    if show in routes:
        return [routes[show]]
    for text in (show, source):                       # "Unknown Show" entries fall back to the item title
        n = norm(text)
        if n in smap:
            return smap[n]
        hit = [c for k, cs in smap.items() if len(k) > 4 and (' ' + k + ' ') in (' ' + n + ' ') for c in cs]
        if hit:
            return sorted(set(hit))
    return [fallback] if fallback else []

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='+')
    ap.add_argument('--channel')
    ap.add_argument('--route', action='append', default=[])
    a = ap.parse_args()
    routes = dict(r.split('=', 1) for r in a.route)
    smap = show_map()
    data = load_existing()
    per, skipped = {}, 0                               # channel -> ident -> item
    for path in a.files:
        for ident, source, name, show in parse(path):
            chs = channels_for(show, source, smap, routes, a.channel)
            skipped += not chs
            for ch in chs:
                it = per.setdefault(ch, {}).setdefault(ident, {'id': ident, 't': source, 'f': []})
                if [name, show] not in it['f']:
                    it['f'].append([name, show])
    for ch, items in sorted(per.items()):
        out = []
        for it in items.values():
            shows = {s for _, s in it['f']}
            if len(shows) == 1:
                it['s'] = shows.pop()
                it['f'] = [n for n, _ in it['f']]
            out.append(it)
        data[ch] = out
        print('%-10s %5d items %6d files' % (ch, len(out), sum(len(i['f']) for i in out)))
    if skipped:
        print('skipped %d files whose show is not in shows.json (use --channel or --route)' % skipped)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(PREFIX + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('wrote', os.path.abspath(OUT), os.path.getsize(OUT) // 1024, 'KB')

if __name__ == '__main__':
    main()
