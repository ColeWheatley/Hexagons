#!/usr/bin/env python3
"""Prove the release gate's HTTP server is serving this exact built dist."""
from __future__ import annotations

import argparse
import re
import time
import urllib.error
import urllib.request
from pathlib import Path


MAIN_RE = re.compile(rb"main\.[0-9a-f]+\.js")


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=2) as response:
        if response.status != 200:
            raise RuntimeError(f"{url} returned HTTP {response.status}")
        return response.read()


def verify(base_url: str, dist: Path, *, attempts: int = 50, delay: float = 0.1) -> dict:
    base = base_url.rstrip("/")
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            served_index = fetch(f"{base}/index.html")
            local_index = (dist / "index.html").read_bytes()
            if served_index != local_index:
                raise RuntimeError("served index.html does not match the current dist")
            match = MAIN_RE.search(local_index)
            if not match:
                raise RuntimeError("current dist index has no fingerprinted main bundle")
            main_name = match.group().decode()
            for relative in ("tile_manifest.json", main_name):
                if fetch(f"{base}/{relative}") != (dist / relative).read_bytes():
                    raise RuntimeError(f"served {relative} does not match the current dist")
            return {"base_url": base, "main_bundle": main_name, "verified": True}
        except (OSError, RuntimeError, urllib.error.URLError) as error:
            last_error = error
            time.sleep(delay)
    raise RuntimeError(f"release server verification failed: {last_error}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    parser.add_argument("dist", type=Path)
    args = parser.parse_args()
    result = verify(args.base_url, args.dist)
    print(f"release server verified: {result['base_url']} -> {result['main_bundle']}")


if __name__ == "__main__":
    main()
