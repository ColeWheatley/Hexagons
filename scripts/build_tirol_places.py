#!/usr/bin/env python3
# @atlas: Builds data/places/tirol_places.json, the shared place index for Hexagons and the Nunatak forecast map. It holds peaks, ski areas, towns, huts, glaciers, valleys, passes and lakes inside Land Tirol (OSM relation 52343, whole state incl. East Tyrol), each with an elevation, prominence/isolation and a display tier.
"""Build the shared Tirol place index (labels + search) for Hexagons and the Nunatak forecast map.

Sources, all cached under data/places/sources/ so a rebuild is reproducible offline (pass --refresh to refetch):
  * the Land Tirol boundary: OSM relation 52343 via Nominatim (ODbL, (c) OpenStreetMap contributors);
  * Wikidata (CC0) items with coordinates in the Tirol bounding box, per class: mountains/summits, ski resorts,
    municipalities and villages, mountain huts, glaciers, valleys, mountain passes, lakes; with German labels and
    aliases, elevation (P2044), prominence (P2660), topographic isolation (P2659), population (P1082) and the
    number of Wikipedia sitelinks (a fame proxy);
  * the OSM peak extract frontend/app/assets/tirol_peaks.geojson (ODbL) for the many named summits Wikidata lacks;
  * the hand-placed ski-area coordinates in frontend/app/assets/skigebiete.json, which win over Wikidata's
    (Wikidata often puts a resort on its valley village).

Every item keeps only places whose coordinate lies inside the boundary, or within BORDER_M of it, so border summits
(Wildspitze's neighbours, Similaun, Grossglockner, Zugspitze) stay in.

Display tier (1 = shown from far away ... 4 = only close up) is decided HERE so both apps agree:
  peaks   by prominence, topographic isolation, sitelinks, plus a curated ski-touring list (SKI_TOURING) that
          is lifted to at least tier 1 or 2. That list is the editorial part: edit it, rebuild.
  towns   by population; villages one tier lower.
  others  by sitelinks.

Output: data/places/tirol_places.json (compact rows, see FIELDS). The Nunatak forecast app vendors a copy
(frontend/forecast/places/ there, synced by its tools/sync_places.py).
"""
from __future__ import annotations

import argparse
import json
import math
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/places/tirol_places.json"
SRC = ROOT / "data/places/sources"
OSM_PEAKS = ROOT / "frontend/app/assets/tirol_peaks.geojson"
SKI_HAND = ROOT / "frontend/app/assets/skigebiete.json"
UA = "hexagons-place-index/1 (+https://github.com/ColeWheatley/Hexagons)"
BBOX = (10.05, 46.62, 13.0, 47.76)          # lon_min, lat_min, lon_max, lat_max (padded around Land Tirol)
BORDER_M = 350.0                             # keep summits sitting on the state border

# Wikidata classes per kind. A place is kept once, under the first kind that claims it (order matters: a
# mountain that is also a ski resort item stays a peak; the resort is its own item).
KIND_CLASSES = [
    ("peak", ["Q8502", "Q207326"]),            # mountain, summit
    ("ski", ["Q130003"]),                      # ski resort
    ("town", ["Q667509"]),                     # municipality of Austria
    ("village", ["Q532", "Q3957", "Q11183787", "Q134514235", "Q2168991", "Q134515462"]),   # village, town, Ortschaft, Dorf, Rotte, Weiler (Austrian items: Obergurgl, Vent, Praxmar, Lüsens)
    ("hut", ["Q182676"]),                      # mountain hut
    ("glacier", ["Q35666"]),
    ("valley", ["Q39816"]),
    ("pass", ["Q133056"]),
    ("lake", ["Q23397"]),
]
FIELDS = ["name", "terms", "kind", "lat", "lon", "ele", "prom", "iso_km", "tier", "wd"]

# Ski-touring summits that must read early whatever their statistics say (editorial; Cole 2026-10-31: "as a ski
# touring app it's obviously a little higher priority"). name -> minimum tier. Unmatched names are printed.
SKI_TOURING = {
    "Wildspitze": 1, "Habicht": 1, "Zuckerhütl": 1, "Similaun": 1, "Weißkugel": 1, "Großvenediger": 1,
    "Großglockner": 1, "Olperer": 1, "Hochfeiler": 1, "Zugspitze": 1, "Schrankogel": 1, "Hoher Riffler": 1,
    "Parseierspitze": 1, "Serles": 1, "Lüsener Fernerkogel": 1, "Ruderhofspitze": 1, "Fluchtkogel": 2,
    "Hintere Schwärze": 2, "Glungezer": 2, "Patscherkofel": 2, "Saile (Nockspitze)": 2, "Pirchkogel": 2, "Sulzkogel": 2,
    "Zwieselbacher Rosskogel": 2, "Lampsenspitze": 2, "Schaflegerkogel": 2, "Rietzer Grießkogel": 2,
    "Hoher Seeblaskogel": 2, "Längentaler Weißer Kogel": 2, "Hohe Villerspitze": 2,
    "Hoher Burgstall": 2, "Elferspitze": 2, "Wilder Freiger": 2, "Wilder Pfaff - Cima del Prete": 2, "Schaufelspitze": 2,
    "Östlicher Daunkogel": 2, "Hinterer Brochkogel": 2, "Kraspesspitze": 2, "Gaislachkogel": 2, "Hohe Mut": 2,
    "Mittagskogel": 2, "Watzespitze": 2, "Rofelewand": 2, "Hochvernagtspitze": 2, "Nördlicher Ramolkogel": 2,
    "Kreuzspitze": 2, "Reichenspitze": 2, "Fußstein": 2, "Schrammacher": 2, "Kalkwand": 2, "Lizumer Reckner": 2,
    "Geier": 2, "Breiter Grieskogel": 2, "Gleirscher Fernerkogel": 2,
}


def normalize(value: str) -> str:
    """Same folding as frontend search (search_index.js normalizeSearchText)."""
    value = value.casefold().replace("ß", "ss").replace("æ", "ae").replace("œ", "oe")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return " ".join("".join(ch if ch.isalnum() else " " for ch in value).split())


def http_json(url: str, params: dict | None = None, accept: str = "application/json") -> object:
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": accept})
    for attempt in range(6):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return json.load(r)
        except Exception as e:  # WDQS throttles (429, at times 1 query/min): back off, then give up loudly
            if attempt == 5:
                raise
            print(f"  retry {attempt + 1} in 65 s after {e}", flush=True)
            time.sleep(65)
    raise AssertionError


def cached(name: str, fetch, refresh: bool):
    p = SRC / name
    if p.exists() and not refresh:
        return json.loads(p.read_text())
    data = fetch()
    SRC.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")
    return data


# ------------------------------------------------------------------ sources
def fetch_boundary():
    d = http_json("https://nominatim.openstreetmap.org/search", {
        "state": "Tirol", "country": "Austria", "polygon_geojson": 1, "polygon_threshold": 0.0003,
        "format": "json", "limit": 1})
    hit = d[0]
    assert hit["osm_type"] == "relation" and int(hit["osm_id"]) == 52343, hit["display_name"]
    return {"type": "Feature", "properties": {"source": "OSM relation 52343 via Nominatim",
            "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "licence": "ODbL, (c) OpenStreetMap contributors"}, "geometry": hit["geojson"]}


SPARQL = """
SELECT ?item ?cls ?loc ?label ?labelEn ?ele ?prom ?iso ?pop ?links (GROUP_CONCAT(DISTINCT ?alt; separator="|") AS ?alts) WHERE {
  VALUES ?cls { %s }
  SERVICE wikibase:box { ?item wdt:P625 ?loc .
    bd:serviceParam wikibase:cornerSouthWest "Point(%f %f)"^^geo:wktLiteral .
    bd:serviceParam wikibase:cornerNorthEast "Point(%f %f)"^^geo:wktLiteral . }
  ?item wdt:P31 ?cls .
  OPTIONAL { ?item rdfs:label ?label FILTER(LANG(?label) = "de") }
  OPTIONAL { ?item rdfs:label ?labelEn FILTER(LANG(?labelEn) = "en") }
  OPTIONAL { ?item skos:altLabel ?alt FILTER(LANG(?alt) IN ("de", "en", "it")) }
  OPTIONAL { ?item wdt:P2044 ?ele }
  OPTIONAL { ?item wdt:P2660 ?prom }
  OPTIONAL { ?item wdt:P2659 ?iso }
  OPTIONAL { ?item wdt:P1082 ?pop }
  OPTIONAL { ?item wikibase:sitelinks ?links }
} GROUP BY ?item ?cls ?loc ?label ?labelEn ?ele ?prom ?iso ?pop ?links
"""


_last_wdqs = [0.0]


def fetch_wikidata(classes: list[str]):
    wait = 62 - (time.time() - _last_wdqs[0])   # stay under the strictest WDQS rule seen (1 query / minute)
    if wait > 0:
        time.sleep(wait)
    _last_wdqs[0] = time.time()
    q = SPARQL % (" ".join(f"wd:{c}" for c in classes), BBOX[0], BBOX[1], BBOX[2], BBOX[3])
    d = http_json("https://query.wikidata.org/sparql", {"query": q}, accept="application/sparql-results+json")
    rows = {}
    for b in d["results"]["bindings"]:
        qid = b["item"]["value"].rsplit("/", 1)[1]
        lon, lat = map(float, b["loc"]["value"].removeprefix("Point(").rstrip(")").split())
        val = lambda k: b[k]["value"] if k in b else None
        num = lambda k: float(b[k]["value"]) if k in b else None
        r = rows.setdefault(qid, {"qid": qid, "lon": lon, "lat": lat, "label": val("label") or val("labelEn"),
                                  "alts": set(), "ele": None, "prom": None, "iso": None, "pop": None, "links": 0})
        r["alts"].update(a for a in (val("alts") or "").split("|") if a)
        for k in ("ele", "prom", "iso", "pop"):
            v = num(k)
            if v is not None and (r[k] is None or v > r[k]):   # multiple statements: keep the largest
                r[k] = v
        r["links"] = max(r["links"], int(num("links") or 0))
    out = []
    for r in rows.values():
        if not r["label"] or r["label"].startswith("Q"):
            continue
        r["alts"] = sorted(r["alts"])
        out.append(r)
    return sorted(out, key=lambda r: r["qid"])


# ------------------------------------------------------------------ geometry (pure numpy; no shapely needed)
def rings_of(geom) -> list[np.ndarray]:
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return [np.asarray(ring, dtype=float) for poly in polys for ring in poly]


def inside_or_near(lon: np.ndarray, lat: np.ndarray, rings: list[np.ndarray], tol_m: float) -> np.ndarray:
    """Even-odd point-in-polygon over all rings (holes included), OR within tol_m of any ring edge."""
    kx = 111320.0 * math.cos(math.radians(47.1))
    inside = np.zeros(lon.shape, bool)
    near = np.zeros(lon.shape, bool)
    for ring in rings:
        x1, y1 = ring[:-1, 0], ring[:-1, 1]
        x2, y2 = ring[1:, 0], ring[1:, 1]
        for s in range(0, len(lon), 512):
            px, py = lon[s:s + 512, None], lat[s:s + 512, None]
            crosses = ((y1 > py) != (y2 > py)) & (px < (x2 - x1) * (py - y1) / np.where(y2 == y1, 1e-12, y2 - y1) + x1)
            inside[s:s + 512] ^= (crosses.sum(axis=1) % 2).astype(bool)
            ax, ay = (px - x1) * kx, (py - y1) * 111320.0           # segment distance in metres
            bx, by = (x2 - x1) * kx, (y2 - y1) * 111320.0
            t = np.clip((ax * bx + ay * by) / np.maximum(bx * bx + by * by, 1e-9), 0, 1)
            d = np.hypot(ax - t * bx, ay - t * by).min(axis=1)
            near[s:s + 512] |= d < tol_m
    return inside | near


def haversine_km(lat1, lon1, lat2, lon2):
    p = np.pi / 180
    a = np.sin((lat2 - lat1) * p / 2) ** 2 + np.cos(lat1 * p) * np.cos(lat2 * p) * np.sin((lon2 - lon1) * p / 2) ** 2
    return 12742.0 * np.arcsin(np.sqrt(a))


# ------------------------------------------------------------------ build
def to_float(v):
    try:
        return float(str(v).replace(",", ".").split()[0].rstrip("m"))
    except (TypeError, ValueError, IndexError):
        return None


def build(refresh: bool) -> dict:
    boundary = cached("tirol_boundary_osm_r52343.geojson", fetch_boundary, refresh)
    rings = rings_of(boundary["geometry"])
    wd = {}
    for kind, classes in KIND_CLASSES:
        wd[kind] = cached(f"wikidata_{kind}.json", lambda c=classes: fetch_wikidata(c), refresh)
        print(f"wikidata {kind:8s} {len(wd[kind]):5d} items in the bbox", flush=True)

    # one record per place; a QID claimed by an earlier kind is not repeated
    places, seen_q = [], set()
    for kind, _ in KIND_CLASSES:
        for r in wd[kind]:
            if r["qid"] in seen_q:
                continue
            seen_q.add(r["qid"])
            places.append({"name": r["label"], "alts": r["alts"], "kind": kind, "lat": r["lat"], "lon": r["lon"],
                           "ele": r["ele"], "prom": r["prom"], "iso_wd": r["iso"], "pop": r["pop"], "links": r["links"],
                           "wd": r["qid"]})

    # OSM peaks: join on wikidata tag, else on name within 300 m, else on any name within 120 m; the rest are new
    osm = json.loads(OSM_PEAKS.read_text())["features"]
    peaks_wd = [p for p in places if p["kind"] == "peak"]
    by_q = {p["wd"]: p for p in peaks_wd}
    plat = np.array([p["lat"] for p in peaks_wd]); plon = np.array([p["lon"] for p in peaks_wd])
    added = joined = 0
    for f in osm:
        pr = f.get("properties", {}); name = pr.get("name")
        lon, lat = f["geometry"]["coordinates"][:2]
        if not name or not (BBOX[0] <= lon <= BBOX[2] and BBOX[1] <= lat <= BBOX[3]):
            continue
        ele, prom = to_float(pr.get("ele")), to_float(pr.get("prominence"))
        hit = by_q.get(pr.get("wikidata"))
        if hit is None and len(plat):
            d = haversine_km(lat, lon, plat, plon) * 1000
            j = int(np.argmin(d))
            if d[j] < 300 and normalize(peaks_wd[j]["name"]) == normalize(name) or d[j] < 120:
                hit = peaks_wd[j]
        if hit is not None:
            joined += 1
            hit["name"] = name                       # OSM's local name spelling wins
            hit["lat"], hit["lon"] = lat, lon         # and OSM's summit position (Wikidata coords are often rounded)
            hit["ele"] = ele or hit["ele"]
            hit["prom"] = hit["prom"] or prom
            for k in ("alt_name", "name:de", "name:it", "name:en", "old_name", "loc_name"):
                hit["alts"] += [a for a in str(pr.get(k, "")).split(";") if a]
            continue
        added += 1
        places.append({"name": name, "alts": [a for k in ("alt_name", "name:de", "name:it", "loc_name")
                                               for a in str(pr.get(k, "")).split(";") if a],
                       "kind": "peak", "lat": lat, "lon": lon, "ele": ele, "prom": prom, "iso_wd": None, "pop": None,
                       "links": 0, "wd": pr.get("wikidata") or ""})
    print(f"OSM peaks: {joined} joined to Wikidata, {added} added")

    # hand-placed ski areas win over Wikidata's village coordinates
    hand = json.loads(SKI_HAND.read_text())["ski_areas"]
    skis = [p for p in places if p["kind"] == "ski"]
    for a in hand:
        lat, lon = a["gps"]["lat"], a["gps"]["lon"]
        hit = next((p for p in skis if normalize(p["name"]) == normalize(a["name"])), None)
        if hit is None and skis:
            d = [haversine_km(lat, lon, p["lat"], p["lon"]) for p in skis]
            j = int(np.argmin(d))
            hit = skis[j] if d[j] < 4 and (normalize(a["name"]).split()[0] in normalize(skis[j]["name"])) else None
        if hit is not None:
            hit["alts"].append(hit["name"]); hit["name"] = a["name"]; hit["lat"], hit["lon"] = lat, lon
        else:
            places.append({"name": a["name"], "alts": [], "kind": "ski", "lat": lat, "lon": lon, "ele": None, "prom": None,
                           "iso_wd": None, "pop": None, "links": 5, "wd": ""})

    # inside Land Tirol (or on its border)
    lat = np.array([p["lat"] for p in places]); lon = np.array([p["lon"] for p in places])
    keep = inside_or_near(lon, lat, rings, BORDER_M)
    places = [p for p, k in zip(places, keep) if k]
    print(f"inside Land Tirol (+{BORDER_M:.0f} m border): {len(places)}")

    # drop duplicate names of the same kind within 1.5 km (OSM double nodes, Wikidata duplicates)
    places.sort(key=lambda p: (-(p["links"] or 0), -(p["ele"] or 0)))
    dedup, last = [], {}
    for p in places:
        key = (p["kind"], normalize(p["name"]))
        if any(haversine_km(p["lat"], p["lon"], q["lat"], q["lon"]) < 1.5 for q in last.get(key, [])):
            continue
        last.setdefault(key, []).append(p); dedup.append(p)
    # a municipality and its own Ortschaft are one place to a reader: keep the town row
    towns = [p for p in dedup if p["kind"] == "town"]
    dup_village = lambda p: p["kind"] == "village" and any(normalize(t["name"]) == normalize(p["name"]) and haversine_km(p["lat"], p["lon"], t["lat"], t["lon"]) < 3 for t in towns)
    n0 = len(dedup); dedup = [p for p in dedup if not dup_village(p)]
    print(f"after same-name dedup: {len(dedup)} (dropped {len(places) - n0} same-kind, {n0 - len(dedup)} villages equal to their municipality)")
    places = dedup

    # ski areas listed twice (a hand-placed name and Wikidata's, or two Wikidata items for one resort) within 6 km
    # and sharing a distinctive word: keep the hand-placed / better-linked one
    skis = sorted([p for p in places if p["kind"] == "ski"], key=lambda p: (p["wd"] != "" and p["links"] < 5, -(p["links"] or 0)))
    stop = {"skigebiet", "ski", "am", "im", "in", "der", "die", "st", "bergbahn", "bergbahnen", "skizentrum"}
    words = lambda n: {w for w in normalize(n).split() if w not in stop and len(w) > 3}
    drop_ids, kept = set(), []
    for p in skis:
        if any(haversine_km(p["lat"], p["lon"], q["lat"], q["lon"]) < 6 and words(p["name"]) & words(q["name"]) for q in kept):
            drop_ids.add(id(p)); continue
        kept.append(p)
    if drop_ids:
        print(f"ski areas merged as duplicates: {sorted(p['name'] for p in skis if id(p) in drop_ids)}")
    places = [p for p in places if id(p) not in drop_ids]

    # topographic isolation among the peaks we hold (a lower bound at the border; Wikidata's P2659 wins if larger)
    pk = [p for p in places if p["kind"] == "peak" and p["ele"]]
    la = np.array([p["lat"] for p in pk]); lo = np.array([p["lon"] for p in pk]); el = np.array([p["ele"] for p in pk])
    for i, p in enumerate(pk):
        higher = el > el[i]
        iso = haversine_km(la[i], lo[i], la[higher], lo[higher]).min() if higher.any() else 60.0
        p["iso_km"] = round(max(float(iso), p["iso_wd"] or 0.0), 2)

    # tiers. The curated lift goes to the HIGHEST summit carrying a name only (OSM holds a second "Habicht" node).
    top_of = {}
    for p in places:
        if p["kind"] == "peak" and p["name"] in SKI_TOURING and (p["ele"] or 0) > (top_of.get(p["name"], {}).get("ele") or -1):
            top_of[p["name"]] = p
    missing = set(SKI_TOURING)
    for p in places:
        k, prom, iso, links, pop = p["kind"], p["prom"] or 0, p.get("iso_km") or 0, p["links"] or 0, p["pop"] or 0
        if k == "peak":
            t = 1 if prom >= 900 or iso >= 12 else 2 if prom >= 400 or iso >= 5 or links >= 8 else 3 if prom >= 150 or iso >= 2 or links >= 3 else 4
            if top_of.get(p["name"]) is p:
                t = min(t, SKI_TOURING[p["name"]]); missing.discard(p["name"])
        elif k == "ski":
            t = 1 if links >= 6 else 2
        elif k == "town":
            t = 1 if pop >= 10000 else 2 if pop >= 2500 else 3
        elif k == "village":
            t = 2 if links >= 12 else 3   # hamlets that matter for touring (Praxmar, Lüsens, Vent) stay at 3: close-up
        elif k in ("valley", "glacier"):
            t = 2 if links >= 8 else 3 if links >= 2 else 4
        else:  # hut, pass, lake
            t = 3 if links >= 3 else 4
        p["tier"] = t
    if missing:
        print(f"SKI_TOURING names not found (check spelling or the OSM extract): {sorted(missing)}")

    items = []
    for p in sorted(places, key=lambda p: (p["tier"], p["kind"], p["name"].casefold())):
        terms = [normalize(p["name"])]
        for a in [p["name"]] + p["alts"]:   # German transliteration: "oetztal" finds Ötztal, "suedtirol" Südtirol
            if any(c in a for c in "äöüÄÖÜ"):
                n = normalize(a.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("Ä", "Ae").replace("Ö", "Oe").replace("Ü", "Ue"))
                if n not in terms:
                    terms.append(n)
        for a in p["alts"]:
            n = normalize(a)
            if n and n not in terms:
                terms.append(n)
        items.append([p["name"], "|".join(terms), p["kind"], round(p["lat"], 5), round(p["lon"], 5),
                      int(round(p["ele"])) if p["ele"] else 0, int(round(p["prom"])) if p["prom"] else 0,
                      p.get("iso_km") or 0, p["tier"], p["wd"]])
    counts = {}
    for it in items:
        counts.setdefault(it[2], [0, 0, 0, 0])[it[8] - 1] += 1
    for k, c in sorted(counts.items()):
        print(f"  {k:8s} tiers 1-4: {c}")
    return {
        "version": 1,
        "area": "Land Tirol, the whole state incl. East Tyrol (OSM relation 52343), plus places within 350 m of its border",
        "attribution": "Places: Wikidata (CC0) and (c) OpenStreetMap contributors (ODbL).",
        "tiers": "1 = shown from far away ... 4 = only close up; decided in scripts/build_tirol_places.py",
        "fields": FIELDS,
        "items": items,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true", help="refetch the cached sources")
    a = ap.parse_args()
    out = build(a.refresh)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    enc = json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n"
    OUT.write_text(enc)
    print(f"wrote {OUT.relative_to(ROOT)}: {len(out['items'])} places, {len(enc.encode()):,} bytes")


if __name__ == "__main__":
    main()
