#!/usr/bin/env python3
"""Assemble the v2 bake corpus: one sheet per footprint, as a directory of symlinks.

Sources (EPSG:31254, 6250x5000 px, 0.2 m): the original aerial_tifs directory
(2023 and 2025 M28 sheets) plus the M31 sheets warped onto the M28 grid.
Where two sheets share a footprint (2023 and 2025), the 2023 sheet wins so every
page already in the published release keeps its source.  Originals are never
touched; the corpus directory only holds symlinks.

Writes <corpus>/ (symlinks) and a name/bytes/sha256 TSV in the format of
hex_backend/aerial_source_inventory.tsv.  Known hashes are reused from the old
audited TSV and the fetch manifest when name+size agree; everything else is hashed.

usage: build_corpus_v2.py CORPUS_DIR OUT_TSV SRC_DIR [SRC_DIR ...]
"""
import glob
import hashlib
import json
import os
import sys
from multiprocessing import Pool

import rasterio

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KNOWN_TSV = os.path.join(REPO, "hex_backend", "aerial_source_inventory.tsv")
FETCH_MANIFEST = os.path.expanduser("~/data/Hexagons/zillertal_fetch_manifest.jsonl")


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(8 << 20), b""):
            h.update(b)
    return h.hexdigest()


def bounds(path):
    with rasterio.open(path) as r:
        assert (r.width, r.height, r.count) == (6250, 5000, 3), (path, r.width, r.height, r.count)
        assert abs(r.res[0] - 0.2) < 1e-9 and abs(r.res[1] - 0.2) < 1e-9, path
        return tuple(round(v, 3) for v in r.bounds)


def year_rank(name):
    # 2023 first (what the published release was baked from), then older, then newer
    year = name.rsplit("_", 1)[1][:4]
    return (0 if year == "2023" else 1, year)


def main():
    corpus, out_tsv, srcs = sys.argv[1], sys.argv[2], sys.argv[3:]
    paths = sorted(p for d in srcs for p in glob.glob(os.path.join(d, "*.tif")))
    with Pool(24) as pool:
        bs = pool.map(bounds, paths, chunksize=40)
    by_bounds = {}
    for p, b in zip(paths, bs):
        by_bounds.setdefault(b, []).append(p)
    chosen, dropped = [], []
    for b, ps in sorted(by_bounds.items()):
        ps.sort(key=lambda p: year_rank(os.path.basename(p)))
        chosen.append(ps[0])
        dropped += ps[1:]
    print(f"{len(paths)} sheets, {len(chosen)} unique footprints, {len(dropped)} duplicates dropped")

    known = {}
    for line in open(KNOWN_TSV):
        name, size, digest = line.rstrip("\n").split("\t")
        known[(name, int(size))] = digest
    if os.path.exists(FETCH_MANIFEST):
        for line in open(FETCH_MANIFEST):
            rec = json.loads(line)
            if rec.get("status") == "ok":
                known[(rec["name"], rec["tif"]["bytes"])] = rec["tif"]["sha256"]

    os.makedirs(corpus, exist_ok=True)
    need_hash = []
    rows = {}
    for p in chosen:
        name, size = os.path.basename(p), os.stat(p).st_size
        link = os.path.join(corpus, name)
        if os.path.lexists(link):
            if os.path.realpath(link) != os.path.realpath(p):
                raise SystemExit(f"corpus link {link} points elsewhere")
        else:
            os.symlink(os.path.realpath(p), link)
        digest = known.get((name, size))
        if digest:
            rows[name] = (size, digest)
        else:
            need_hash.append(p)
    print(f"{len(rows)} hashes reused, hashing {len(need_hash)} files")
    with Pool(16) as pool:
        for p, d in zip(need_hash, pool.imap(sha256, need_hash, chunksize=4)):
            rows[os.path.basename(p)] = (os.stat(p).st_size, d)
    with open(out_tsv, "w") as f:
        for name in sorted(rows):
            f.write(f"{name}\t{rows[name][0]}\t{rows[name][1]}\n")
    total = sum(v[0] for v in rows.values())
    print(f"wrote {out_tsv}: {len(rows)} files, {total} bytes")
    json.dump({"dropped_duplicates": sorted(os.path.basename(p) for p in dropped)},
              open(out_tsv + ".dropped.json", "w"), indent=1)


if __name__ == "__main__":
    main()
