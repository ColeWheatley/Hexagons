#!/opt/homebrew/bin/python3.14
"""Print key A/B netlab metrics as Markdown; first result is the baseline."""
import argparse
import json
from pathlib import Path


def metrics(r):
    result = {
        'Network body bytes': r['network']['totalBytes'],
        'Requests': r['network']['requestCount'],
        'Measured-phase bytes': r['network'].get('measuredPhaseBytes'),
        'Re-download bytes': r['network']['redownloadBytes'],
        'Manifest last byte ms': r['network']['manifestLastByteMs'],
        'First tile last byte ms': r['network']['firstTileLastByteMs'],
        'Loader hidden ms': r['milestones']['loaderHiddenMs'],
        'JS heap MiB': r['memory']['jsHeapUsedBytes'] / 1024 ** 2 if r['memory']['jsHeapUsedBytes'] else None,
        'Chrome tree RSS MiB': r['memory']['chromeTreeRssKiB'] / 1024 if r['memory']['chromeTreeRssKiB'] else None,
    }
    for phase, v in r['visual'].items():
        for key in ('speedIndexMs', 'tVC50Ms', 'tVC85Ms', 'tVC95Ms'):
            result[f'{phase} {key}'] = v.get(key)
    for cat, v in r['network']['categories'].items():
        result[f'{cat} bytes'] = v['bytes']
    return result


def fmt(value):
    if value is None: return '—'
    return f'{value:,.1f}' if isinstance(value, float) else f'{value:,}'


def main():
    p = argparse.ArgumentParser()
    p.add_argument('results', nargs='+', type=Path)
    a = p.parse_args()
    if len(a.results) < 2: p.error('provide baseline and at least one comparison result')
    runs = [json.loads(x.read_text()) for x in a.results]
    if len({x['scenario'] for x in runs}) != 1:
        p.error('all results must use the same scenario')
    values = [metrics(x) for x in runs]
    keys = list(values[0]) + sorted(set().union(*(v.keys() for v in values)) - set(values[0]))
    labels = [str(x.parent) for x in a.results]
    print(f'## {runs[0]["scenario"]} comparison\n')
    print('| Metric | ' + ' | '.join(labels) + ' |')
    print('|---|' + '|'.join('---:' for _ in labels) + '|')
    for key in keys:
        base = values[0].get(key)
        cells = [fmt(base)]
        for other in values[1:]:
            v = other.get(key)
            delta = (v - base) / base * 100 if v is not None and base not in (None, 0) else None
            cells.append(fmt(v) + (f' ({delta:+.1f}%)' if delta is not None else ''))
        print('| ' + key + ' | ' + ' | '.join(cells) + ' |')

if __name__ == '__main__': main()
