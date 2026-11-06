#!/usr/bin/env python3
"""
Checks every source in british-tv/app/src/main/assets/channels.js against archive.org.

Run it on a computer that can reach archive.org:
    python3 tools/check_sources.py

It prints one line per source and writes sources-report.txt (problems only) next to where you run it.
Paste that file back into the chat. Needs Python 3; Node.js is used if installed (to read channels.js),
otherwise it falls back to tools/sources.json.
"""
import json, os, re, subprocess, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CHANNELS_JS = os.path.join(HERE, '..', 'british-tv', 'app', 'src', 'main', 'assets', 'channels.js')
HEADERS = {'User-Agent': 'Mozilla/5.0 (telly-addicts source check)'}


def load_channels():
    js = ("global.window={};eval(require('fs').readFileSync(process.argv[1],'utf8')+';global.C=window.CHANNELS');"
          "console.log(JSON.stringify(C.map(c=>({n:c.n,name:c.name,sources:c.sources,adBreak:c.adBreak||null}))))")
    try:
        out = subprocess.run(['node', '-e', js, CHANNELS_JS], capture_output=True, text=True, check=True).stdout
        return json.loads(out)
    except Exception:
        with open(os.path.join(HERE, 'sources.json')) as f:
            return json.load(f)


def get_json(url, tries=3):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=40) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:
            last = e
            time.sleep(1.5)
    raise last


def jsre(pattern):
    # JS regexes here are used case-insensitively; Python accepts the same syntax for what we use
    return re.compile(pattern, re.I)


def check_item(ident, src):
    try:
        meta = get_json('https://archive.org/metadata/' + urllib.parse.quote(ident))
    except Exception as e:
        return 'FAIL', 'could not be loaded (%s)' % e
    files = [f for f in meta.get('files', []) if f.get('name', '').lower().endswith(('.mp4', '.m4v'))]
    if not meta.get('files'):
        return 'FAIL', 'item not found or empty'
    if not files:
        formats = sorted({f.get('format', '?') for f in meta['files']})[:6]
        return 'FAIL', 'no mp4 files (has: %s)' % ', '.join(formats)
    names = [f['name'] for f in files]
    if src.get('include'):
        rx = jsre(src['include'])
        names = [n for n in names if rx.search(n)]
        if not names and 'christmas|xmas' in src['include']:
            return 'OK', 'no Christmas files here (normal for the Christmas channel)'
        if not names:
            return 'FAIL', 'has %d mp4 files but none match include %r; first file: %s' % (len(files), src['include'], files[0]['name'])
    if src.get('exclude'):
        rx = jsre(src['exclude'])
        names = [n for n in names if not rx.search(n)]
        if not names:
            return 'FAIL', 'all mp4 files removed by exclude %r' % src['exclude']
    return 'OK', '%d playable file(s), e.g. %s' % (len(names), names[0])


def check_search(src):
    q = urllib.parse.quote(src['search'])
    url = 'https://archive.org/advancedsearch.php?q=%s&fl[]=identifier&fl[]=title&rows=%d&output=json' % (q, src.get('rows', 25))
    try:
        data = get_json(url)
    except Exception as e:
        return 'FAIL', 'search failed (%s)' % e
    docs = data.get('response', {}).get('docs', [])
    if not docs:
        return 'FAIL', 'search found nothing'
    return 'OK', '%d results, e.g. %s' % (len(docs), docs[0].get('identifier'))


def main():
    channels = load_channels()
    problems, total, bad = [], 0, 0
    for ch in channels:
        print('\n== %s %s' % (ch['n'], ch['name']))
        srcs = list(ch['sources'])
        if ch.get('adBreak'):
            srcs.append({'search': ch['adBreak']['search'], 'rows': ch['adBreak'].get('rows', 25), '_ad': True})
        for src in srcs:
            total += 1
            if src.get('item'):
                status, msg = check_item(src['item'], src)
                label = src['item']
            else:
                status, msg = check_search(src)
                label = 'search: ' + src['search'][:70] + (' [adverts]' if src.get('_ad') else '')
            print('  [%s] %s -> %s' % (status, label, msg))
            if status != 'OK':
                bad += 1
                problems.append('%s %s | %s | %s' % (ch['n'], ch['name'], label, msg))
            time.sleep(0.5)
    with open('sources-report.txt', 'w') as f:
        f.write('%d of %d sources have problems\n\n' % (bad, total))
        f.write('\n'.join(problems) + '\n')
    print('\n%d of %d sources have problems. Wrote sources-report.txt' % (bad, total))


if __name__ == '__main__':
    main()
