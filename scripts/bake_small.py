#!/usr/bin/env python3
# @atlas: Throwaway visual-confirmation bake helper. Provides a hardcoded cheatsheet of known Tirol/Stubai ski-area points, previews point-centered sector ranges, counts intersecting source TIFs, and safely wraps the current waffle_iron.py CLI without running full/publish bakes unless explicitly confirmed.
"""Throwaway bake cheatsheet for visual-confirmation regions.

This wraps the current waffle_iron.py CLI without changing its behavior.
It previews point-centered sector ranges so we can design the next bake API
without leaning on hand-curated local TIF folders.
"""

from __future__ import annotations

import argparse
import glob
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
HEX_BACKEND = REPO_ROOT / "hex_backend"
sys.path.append(str(HEX_BACKEND))

try:
    from pyproj import Transformer
    import coordinate_utility as coord_util
except ModuleNotFoundError as exc:
    missing = exc.name or "project dependency"
    raise SystemExit(
        f"Missing {missing}. Run this through the project env, e.g.:\n"
        f"  pixi run python scripts/bake_small.py list\n"
        f"or:\n"
        f"  ./.pixi/envs/default/bin/python scripts/bake_small.py list"
    ) from exc


@dataclass(frozen=True)
class Location:
    label: str
    lat: float | None = None
    lon: float | None = None
    world_x: float | None = None
    world_y: float | None = None
    notes: str = ""


LOCATIONS: dict[str, Location] = {
    "stubai": Location(
        "Stubai buildings / current app start",
        lat=46.996315457481984,
        lon=11.119477646985764,
        notes="Matches waffle_iron.py STUBAI_LAT/LON; sector 73,252.",
    ),
    "stubai-old-source-center": Location(
        "Center of old hex_backend/stubai 81-TIF source set",
        lat=46.990250638907462,
        lon=11.129998452185918,
        notes=(
            "Old source TIF union center; sector 74,251. The exact 81-file "
            "set is not reproduced by any simple sector rectangle."
        ),
    ),
    "kuhtai-tour": Location(
        "Kuehtai ski-tour fallback",
        world_x=95855.9,
        world_y=222423.2,
        notes="Hardcoded frontend fallback in main.js.",
    ),
    "kappl": Location("Kappl", lat=47.06689, lon=10.35909),
    "st-anton": Location("St. Anton am Arlberg", lat=47.1275, lon=10.2640),
    "schlick-2000": Location("Schlick 2000", lat=47.1089, lon=11.3181),
    "axamer-lizum": Location("Axamer Lizum", lat=47.1928, lon=11.2928),
    "patscherkofel": Location("Patscherkofel", lat=47.2086, lon=11.4594),
    "nordkette": Location("Nordkette (Innsbruck)", lat=47.3050, lon=11.3833),
    "glungezer": Location("Glungezer", lat=47.2892, lon=11.5489),
    "seefeld": Location("Seefeld", lat=47.3306, lon=11.1878),
    "ischgl": Location("Ischgl", lat=46.9883, lon=10.2931),
    "serfaus-fiss-ladis": Location("Serfaus-Fiss-Ladis", lat=47.0378, lon=10.6058),
    "muttereralm": Location("Muttereralm", lat=47.2339, lon=11.3803),
    "bergeralm": Location("Bergeralm - Steinach am Brenner", lat=47.0883, lon=11.4742),
    "obergurgl": Location("Obergurgl-Hochgurgl", lat=46.8692, lon=11.0283),
    "innsbruck": Location("Innsbruck probe area", lat=47.26, lon=11.40),
}


def parse_pair(value: str, name: str, cast=float) -> tuple:
    normalized = value.lower().replace("x", ",")
    parts = [p.strip() for p in normalized.split(",") if p.strip()]
    if len(parts) != 2:
        raise argparse.ArgumentTypeError(f"{name} must look like A,B or AxB")
    try:
        return cast(parts[0]), cast(parts[1])
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"{name} has invalid numbers: {value}") from exc


def parse_size(value: str) -> tuple[int, int]:
    width, height = parse_pair(value, "size", int)
    if width < 1 or height < 1:
        raise argparse.ArgumentTypeError("size dimensions must be positive")
    return width, height


def latlon_to_world(lat: float, lon: float) -> tuple[float, float]:
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:31254", always_xy=True)
    return transformer.transform(lon, lat)


def world_to_latlon(x: float, y: float) -> tuple[float, float]:
    transformer = Transformer.from_crs("EPSG:31254", "EPSG:4326", always_xy=True)
    lon, lat = transformer.transform(x, y)
    return lat, lon


def centered_sector_range(
    center_x: float,
    center_y: float,
    width: int,
    height: int,
) -> tuple[int, int, int, int]:
    sector = coord_util.SECTOR_SIZE_METERS
    min_sx = int((center_x - (width * sector * 0.5)) // sector)
    min_sy = int((center_y - (height * sector * 0.5)) // sector)
    return min_sx, min_sx + width - 1, min_sy, min_sy + height - 1


def current_waffle_range(center_sx: int, center_sy: int, grid: int) -> tuple[int, int, int, int]:
    half = grid // 2
    return center_sx - half, center_sx + half - 1, center_sy - half, center_sy + half - 1


def positive_area_tif_count(rng: tuple[int, int, int, int]) -> int | None:
    try:
        import rasterio
    except ModuleNotFoundError:
        return None

    min_sx, max_sx, min_sy, max_sy = rng
    x1, y1, _, _ = coord_util.sector_id_to_bounds_meters(min_sx, min_sy)
    _, _, x2, y2 = coord_util.sector_id_to_bounds_meters(max_sx, max_sy)

    count = 0
    for tif in glob.glob(str(REPO_ROOT / "hex_backend" / "aerial_tifs" / "*.tif")):
        try:
            with rasterio.open(tif) as src:
                b = src.bounds
        except Exception:
            continue
        if min(x2, b.right) > max(x1, b.left) and min(y2, b.top) > max(y1, b.bottom):
            count += 1
    return count


def normalize_target(raw: str) -> str:
    target = raw.lower()
    if target.startswith("bake:"):
        target = target.split(":", 1)[1]
    return target


def resolve_center(args: argparse.Namespace, target: str) -> tuple[float, float, str]:
    if args.center:
        sx, sy = parse_pair(args.center, "center", int)
        x, y = coord_util.get_sector_center(sx, sy)
        return x, y, f"sector {sx},{sy}"
    if args.latlon:
        lat, lon = parse_pair(args.latlon, "latlon", float)
        x, y = latlon_to_world(lat, lon)
        return x, y, f"lat/lon {lat},{lon}"
    if args.world:
        x, y = parse_pair(args.world, "world", float)
        return x, y, f"world {x},{y}"
    if target in LOCATIONS:
        loc = LOCATIONS[target]
        if loc.world_x is not None and loc.world_y is not None:
            return loc.world_x, loc.world_y, target
        assert loc.lat is not None and loc.lon is not None
        x, y = latlon_to_world(loc.lat, loc.lon)
        return x, y, target
    raise SystemExit(f"Unknown target '{target}'. Run 'scripts/bake_small.py list'.")


def print_locations() -> None:
    print("Known bake points:")
    for key, loc in LOCATIONS.items():
        if loc.world_x is not None and loc.world_y is not None:
            x, y = loc.world_x, loc.world_y
            lat, lon = world_to_latlon(x, y)
        else:
            assert loc.lat is not None and loc.lon is not None
            lat, lon = loc.lat, loc.lon
            x, y = latlon_to_world(lat, lon)
        sx, sy = coord_util.world_to_sector_id(x, y)
        print(f"  {key:24s} sector={sx},{sy} latlon={lat:.9f},{lon:.9f}")
        if loc.notes:
            print(f"    {loc.notes}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Preview or run small visual-confirmation terrain bakes."
    )
    parser.add_argument("target", nargs="?", default="list")
    parser.add_argument("size", nargs="?", default=None, help="Size like 12x12.")
    parser.add_argument("--size", dest="size_opt", help="Size like 12x12.")
    parser.add_argument("--center", help="Center sector, e.g. 73,252.")
    parser.add_argument("--latlon", help="Center latitude/longitude, e.g. 46.99,11.13.")
    parser.add_argument("--world", help="Center EPSG:31254 x/y meters.")
    parser.add_argument("--force", action="store_true", help="Forward --force to the baker.")
    parser.add_argument("--inspect-tifs", action="store_true", help="Count intersecting source TIFs.")
    parser.add_argument("--run", action="store_true", help="Actually run waffle_iron.py.")
    parser.add_argument(
        "--yes-full",
        action="store_true",
        help="Allow bake:full to run. Full bake publishes because waffle_iron.py enables S3.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    target = normalize_target(args.target)

    if target in {"list", "ls"}:
        print_locations()
        return 0

    if target == "full":
        cmd = [sys.executable, "-u", "hex_backend/waffle_iron.py", "--full"]
        if args.force:
            cmd.append("--force")
        print("Full bake command:")
        print("  " + " ".join(cmd))
        if args.run:
            if not args.yes_full:
                raise SystemExit("Refusing full publish bake without --yes-full.")
            return subprocess.call(cmd, cwd=REPO_ROOT)
        print("Preview only. Add --run --yes-full to execute.")
        return 0

    size_text = args.size_opt or args.size or "12x12"
    width, height = parse_size(size_text)
    center_x, center_y, source = resolve_center(args, target)
    center_sx, center_sy = coord_util.world_to_sector_id(center_x, center_y)
    lat, lon = world_to_latlon(center_x, center_y)
    rng = centered_sector_range(center_x, center_y, width, height)
    min_sx, max_sx, min_sy, max_sy = rng

    print(f"Target: {target} ({source})")
    print(f"Center world: {center_x:.3f}, {center_y:.3f}")
    print(f"Center lat/lon: {lat:.15f}, {lon:.15f}")
    print(f"Center sector: {center_sx},{center_sy}")
    print(f"Point-centered range: SX[{min_sx}..{max_sx}] SY[{min_sy}..{max_sy}] ({width}x{height})")

    if args.inspect_tifs:
        count = positive_area_tif_count(rng)
        if count is None:
            print("TIF count skipped: rasterio is unavailable.")
        else:
            print(f"Positive-area source TIF candidates: {count}")

    waffle_rng = current_waffle_range(center_sx, center_sy, width) if width == height else None
    can_current_baker_run = width == height and width % 2 == 0 and waffle_rng == rng
    cmd = [
        sys.executable,
        "-u",
        "hex_backend/waffle_iron.py",
        "--grid",
        str(width),
        "--center",
        f"{center_sx},{center_sy}",
    ]
    if args.force:
        cmd.append("--force")

    if can_current_baker_run:
        print("Current baker command:")
        print("  " + " ".join(cmd))
        if args.run:
            return subprocess.call(cmd, cwd=REPO_ROOT)
        print("Preview only. Add --run to execute.")
        return 0

    print("No run command emitted.")
    if waffle_rng and waffle_rng != rng:
        w_min_sx, w_max_sx, w_min_sy, w_max_sy = waffle_rng
        print(
            "Reason: current waffle_iron.py would bake "
            f"SX[{w_min_sx}..{w_max_sx}] SY[{w_min_sy}..{w_max_sy}], "
            "which differs from the point-centered range."
        )
    else:
        print("Reason: current waffle_iron.py only accepts square even --grid safely.")
    print("Next bake API should accept the explicit sector range above.")
    return 2 if args.run else 0


if __name__ == "__main__":
    raise SystemExit(main())
