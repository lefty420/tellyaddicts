#!/usr/bin/env python3
r"""Build the app's ready-made Auto EPG channel lists from the Telly Addict Scraper.

Takes either the scraper's text files, or the GUI's master library straight from SQLite (which is better: the
library has already deduplicated each episode and picked the best copy of it).

    python3 tools/import_scrape.py archive_*.txt
    python3 tools/import_scrape.py --library ~/Library/Application\ Support/Telly\ Addict\ Scraper/library.db
    python3 tools/import_scrape.py --library library.db master_list.txt      (both at once is fine)

It writes two things:

  british-tv/data/<channel>.json   one file per channel, published through GitHub and fetched by the app at
  british-tv/data/index.json       start-up, so a new scrape reaches the TV without building a new APK. index.json
                                   gives each channel a revision; the app rebuilds only the channels that changed.
  british-tv/app/.../autodata.js   the same lists built into the app, used when the published ones cannot be
                                   reached (--no-bundle skips this, which keeps the APK small).

Every entry is routed by its show to the channel(s) whose category lists it (tools/shows.json = the scraper's
categories), so a drama never lands on CITV. Only the channels that get programmes are replaced; the rest are kept.

--library   read the GUI's library.db (repeatable); best/pinned copy of each episode only
--channel   fallback channel for shows not in shows.json (default: skip them)
--route     "Show name=channel id" sends one show to a different channel (repeatable)
--no-bundle  do not write autodata.js into the app
"""
import argparse, hashlib, json, os, re, sqlite3, urllib.parse
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'british-tv', 'app', 'src', 'main', 'assets', 'autodata.js')
DATA_DIR = os.path.join(HERE, '..', 'british-tv', 'data')
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

def parse_library(path):
    """The best (or hand-picked) copy of every episode in the GUI's master library, in the same shape as parse()."""
    db = sqlite3.connect('file:%s?mode=ro' % urllib.parse.quote(os.path.abspath(path)), uri=True)
    db.row_factory = sqlite3.Row
    rows = db.execute("""
        SELECT s.name AS show, v.url AS url, v.identifier AS ident, v.source_title AS source
        FROM episodes e
        JOIN shows s ON s.id = e.show_id
        JOIN versions v ON v.id = COALESCE(e.pinned_version_id, e.best_version_id)
    """).fetchall()
    for r in rows:
        ident, url = r['ident'], r['url']
        base = 'https://archive.org/download/%s/' % ident
        if not ident or not url or not url.startswith(base):
            continue                                   # only clean archive.org/download links are kept
        yield ident, (r['source'] or r['show'] or ident), urllib.parse.unquote(url[len(base):]), (r['show'] or 'Unknown Show')
    db.close()

def publish(data, touched):
    """Write british-tv/data/<channel>.json for every channel, plus index.json naming each one's revision."""
    os.makedirs(DATA_DIR, exist_ok=True)
    index = {}
    for ch, items in sorted(data.items()):
        body = json.dumps(items, ensure_ascii=False, separators=(',', ':'))
        index[ch] = hashlib.sha1(body.encode('utf-8')).hexdigest()[:10]
        with open(os.path.join(DATA_DIR, ch + '.json'), 'w', encoding='utf-8') as f:
            f.write(body)
    with open(os.path.join(DATA_DIR, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
                   'channels': index,
                   'counts': {ch: len(data[ch]) for ch in sorted(data)}},
                  f, ensure_ascii=False, indent=1)
    for ch in sorted(index):
        mark = ' (updated)' if ch in touched else ''
        size = os.path.getsize(os.path.join(DATA_DIR, ch + '.json')) // 1024
        print('  data/%-14s %4d KB  rev %s%s' % (ch + '.json', size, index[ch], mark))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('files', nargs='*')
    ap.add_argument('--library', action='append', default=[])
    ap.add_argument('--channel')
    ap.add_argument('--route', action='append', default=[])
    ap.add_argument('--no-bundle', action='store_true')
    a = ap.parse_args()
    if not a.files and not a.library:
        ap.error('give at least one archive_*.txt file or --library library.db')
    routes = dict(r.split('=', 1) for r in a.route)
    smap = show_map()
    data = load_existing()
    per, skipped = {}, 0                               # channel -> ident -> item
    sources = [(p, parse_library) for p in a.library] + [(p, parse) for p in a.files]
    for path, reader in sources:
        for ident, source, name, show in reader(path):
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
    publish(data, set(per))
    if a.no_bundle:
        print('autodata.js not written (--no-bundle)')
    else:
        with open(OUT, 'w', encoding='utf-8') as f:
            f.write(PREFIX + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
        print('  autodata.js    %4d KB  (built into the app as the offline copy)' % (os.path.getsize(OUT) // 1024))
    print('\nCommit british-tv/data/ and push: the app picks the new lists up at its next start.')

if __name__ == '__main__':
    main()
