#!/usr/bin/env python3
"""Verify public Hexagons landing, app shell, manifest, and sample assets."""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
from urllib.parse import urljoin


def fetch(url: str) -> tuple[bytes, str, dict[str, str]]:
    request = urllib.request.Request(url, headers={"User-Agent": "Hexagons-release-verifier/1"})
    with urllib.request.urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"{url}: HTTP {response.status}")
        return response.read(), response.headers.get_content_type(), dict(response.headers)


def require_type(url: str, expected: str) -> bytes:
    payload, actual, _headers = fetch(url)
    if actual != expected:
        raise RuntimeError(f"{url}: Content-Type {actual!r}, expected {expected!r}")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://wheatley.cloud/hexagons/")
    args = parser.parse_args()
    base = args.base_url.rstrip("/") + "/"
    landing = require_type(base, "text/html").decode("utf-8")
    if 'href="app/"' not in landing:
        raise RuntimeError("landing page does not link to /hexagons/app/")
    app_url = urljoin(base, "app/")
    app = require_type(app_url, "text/html").decode("utf-8")
    manifest = json.loads(require_type(urljoin(app_url, "tile_manifest.json"), "application/json"))
    script_match = re.search(r'<script type="module" src="([^"]+\.js)"', app)
    style_match = re.search(r'<link rel="stylesheet" href="([^"]+\.css)"', app)
    worker_match = re.search(r"serviceWorker\.register\('([^']+\.js)'", app)
    if not all((script_match, style_match, worker_match)):
        raise RuntimeError("app shell lacks versioned JS/CSS/service-worker references")
    require_type(urljoin(app_url, script_match.group(1)), "text/javascript")
    require_type(urljoin(app_url, style_match.group(1)), "text/css")
    require_type(urljoin(app_url, worker_match.group(1)), "text/javascript")
    tiles = manifest.get("tiles", [])
    pages = manifest.get("texture_pages", {}).get("pages", [])
    if not tiles or not pages:
        raise RuntimeError("public manifest has no representative geometry or texture page")
    binary_template = manifest["binary"]["url_template"]
    tile = tiles[0]
    binary_url = binary_template.format(yq=tile["yq"], yr=tile["yr"])
    require_type(urljoin(app_url, binary_url), "application/octet-stream")
    urls = pages[0]["urls"]
    require_type(urljoin(app_url, urls["bootstrap"]), "image/webp")
    for tier in ("low", "medium", "high"):
        require_type(urljoin(app_url, urls[tier]), "image/ktx2")
    print(json.dumps({
        "landing": base, "application": app_url,
        "tiles": len(tiles), "pages": len(pages), "status": "verified",
    }))


if __name__ == "__main__":
    main()
