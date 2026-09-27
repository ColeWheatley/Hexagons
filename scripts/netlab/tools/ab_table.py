#!/usr/bin/env python3
"""Tabulate netlab baseline vs candidate runs: ab_table.py BASE_DIR CAND_DIR [scenario...]"""
import json, sys
from pathlib import Path

base, cand = Path(sys.argv[1]), Path(sys.argv[2])
args = sys.argv[3:]
tag = 'cand1'
if args and args[0].startswith('--tag='):
    tag = args.pop(0).split('=', 1)[1]
scenarios = args or ['cold', 'warm', 'pan', 'jump']


def load(root, prefix, scenario):
    for name in (f'{scenario}-1', f'{prefix}{scenario}-1'):
        p = root / name / 'result.json'
        if p.exists():
            return json.loads(p.read_text())
    return None


def mb(x):
    return f"{x / 1e6:.1f}" if isinstance(x, (int, float)) else "–"


def s(x):
    return f"{x / 1000:.1f}" if isinstance(x, (int, float)) else "–"


rows = ["| scenario | phase | build | SpeedIndex s | VC50 s | VC85 s | VC95 s | loader s | MB | re-DL MB |",
        "|---|---|---|---:|---:|---:|---:|---:|---:|---:|"]
for scenario in scenarios:
    for label, root, prefix in (('live', base, ''), ('next', cand, f'{tag}-')):
        r = load(root, prefix, scenario)
        if not r:
            rows.append(f"| {scenario} | – | {label} | (missing) | | | | | | |")
            continue
        net = r.get('network', {})
        for i, (phase, v) in enumerate(r.get('visual', {}).items()):
            rows.append("| {} | {} | {} | {} | {} | {} | {} | {} | {} | {} |".format(
                scenario, phase, label, s(v.get('speedIndexMs')), s(v.get('tVC50Ms')), s(v.get('tVC85Ms')),
                s(v.get('tVC95Ms')),
                s(r.get('milestones', {}).get('loaderHiddenMs')) if i == 0 else '',
                mb(net.get('measuredPhaseBytes', net.get('totalBytes'))) if i == 0 else '',
                mb(net.get('redownloadBytes')) if i == 0 else ''))
print("\n".join(rows))
