#!/usr/bin/env python3
"""Validate same-profile service-worker cold/warm benchmark pairs."""

import argparse
import json
import statistics
from pathlib import Path
from urllib.parse import urlsplit


EXPECTED_COLD_PROFILE = {
    "name": "good-lte",
    "latencyMs": 100,
    "downloadMbps": 10,
    "uploadMbps": 5,
}


def metric(report, name):
    value = report.get("comparison", {}).get(name)
    if not isinstance(value, (int, float)):
        raise ValueError(f"missing numeric comparison.{name}")
    return float(value)


def validate_pair(report, path):
    problems = []
    if report.get("meta", {}).get("kind") != "service-worker-warm-reload":
        problems.append("not a service-worker warm-reload report")
    if report.get("meta", {}).get("sameProfile") is not True:
        problems.append("cold and warm navigations did not share a browser profile")

    report_meta = report.get("meta", {})
    if report_meta.get("ttftfBasis") != "navigation-start-to-visible-textured-coverage":
        problems.append("warm gate TTFTF does not start at document navigation")
    if report_meta.get("coldNetworkProfile") != EXPECTED_COLD_PROFILE:
        problems.append("cold navigation did not use the fixed good-LTE profile")
    warm_profile = report_meta.get("warmNetworkProfile", {})
    if warm_profile.get("latencyMs") != 0 or warm_profile.get("downloadMbps") is not None:
        problems.append("warm navigation was not restored to unthrottled localhost")
    if report_meta.get("networkEmulationClearedBeforeWarm") is not True:
        problems.append("network emulation was not explicitly cleared before warm navigation")

    reset = report_meta.get("cacheResetBeforeCold", {})
    for flag in (
        "temporaryProfile",
        "browserCacheCleared",
        "browserCookiesCleared",
        "originStorageCleared",
    ):
        if reset.get(flag) is not True:
            problems.append(f"cold cache reset missing {flag}")

    for phase in ("cold", "warm"):
        meta = report.get(phase, {}).get("meta", {})
        if meta.get("finished") is not True:
            problems.append(f"{phase} benchmark did not finish")
        if meta.get("crashed") is True:
            problems.append(f"{phase} benchmark crashed")
        absolute_ttftf = report.get(phase, {}).get("benchmarkTiming", {}).get(
            "visibleTexturedCoverageFromNavigationMs"
        )
        if not isinstance(absolute_ttftf, (int, float)):
            problems.append(f"{phase} is missing navigation-clock TTFTF")

    sw = report.get("serviceWorker", {})
    before = sw.get("beforeWarmNavigation", {})
    after = sw.get("afterWarmNavigation", {})
    if not before.get("ready"):
        problems.append("service worker was not ready before warm navigation")
    if not before.get("controlled"):
        problems.append("service worker did not control the page before warm navigation")
    if not after.get("controlled"):
        problems.append("service worker did not control the warm page")
    if before.get("controllerScriptURL") != after.get("controllerScriptURL"):
        problems.append("service-worker controller changed across the warm navigation")

    cold_responses = report.get("coldResponses", [])
    cold_documents = [row for row in cold_responses if row.get("resourceType") == "Document"]
    if not cold_documents:
        problems.append("missing cold document response provenance")
    elif any(
        row.get("fromServiceWorker") or row.get("fromDiskCache") or row.get("fromPrefetchCache")
        or row.get("serviceWorkerResponseSource") in {"cache-storage", "http-cache"}
        for row in cold_documents
    ):
        problems.append("cold document was served from a pre-existing cache")

    cold_navigation = report.get("cold", {}).get("navigationTiming", {}) or {}
    request_to_response = cold_documents[0].get("requestToResponseMs") if cold_documents else None
    if not isinstance(request_to_response, (int, float)) or request_to_response < 80:
        problems.append("cold navigation timing does not prove the 100 ms latency condition")
    if not isinstance(cold_navigation.get("transferSize"), (int, float)) or cold_navigation.get("transferSize") <= 0:
        problems.append("cold document transfer size does not prove an uncached network response")

    large_cold_responses = [
        row for row in cold_responses
        if isinstance(row.get("encodedDataLength"), (int, float))
        and row["encodedDataLength"] >= 100_000
        and isinstance(row.get("observedReceiveMbps"), (int, float))
    ]
    if not large_cold_responses:
        problems.append("missing a large cold transfer for throughput verification")
    elif max(row["observedReceiveMbps"] for row in large_cold_responses) > 12.5:
        problems.append("large cold transfer exceeded the configured 10 Mbit/s pipe")

    warm_responses = report.get("warmResponses", [])
    warm_documents = [row for row in warm_responses if row.get("resourceType") == "Document"]
    if not warm_documents:
        problems.append("missing warm document response provenance")
    elif not isinstance(warm_documents[0].get("requestToResponseMs"), (int, float)) \
            or warm_documents[0]["requestToResponseMs"] >= 80:
        problems.append("warm document timing does not prove latency emulation was cleared")
    warm_network_200 = [
        row for row in warm_responses
        if row.get("status") == 200
        and (
            row.get("serviceWorkerResponseSource") == "network"
            or (
                not row.get("fromServiceWorker")
                and not row.get("fromDiskCache")
                and not row.get("fromPrefetchCache")
                and row.get("serviceWorkerResponseSource") is None
            )
        )
    ]
    manifest_network = [
        row for row in warm_network_200
        if urlsplit(row.get("url") or "").path.endswith("/tile_manifest.json")
    ]
    # The document itself is deliberately network-fetched after clearing the
    # HTTP cache, so its latency provenance is observable. Everything else
    # must be either the authoritative manifest or served by the SW cache.
    document_network = [row for row in warm_network_200 if row.get("resourceType") == "Document"]
    unexpected_network = [row for row in warm_network_200 if row not in manifest_network and row not in document_network]
    if not manifest_network:
        problems.append("warm navigation did not fetch the authoritative manifest from network")
    if unexpected_network:
        problems.append("warm navigation fetched non-manifest assets from network")

    try:
        cold = metric(report, "coldTTFTFMs")
        warm = metric(report, "warmTTFTFMs")
        improvement = metric(report, "improvementPercent")
        if cold <= 0 or warm < 0:
            problems.append(f"invalid TTFTF values cold={cold} warm={warm}")
        cold_absolute = report.get("cold", {}).get("benchmarkTiming", {}).get(
            "visibleTexturedCoverageFromNavigationMs"
        )
        warm_absolute = report.get("warm", {}).get("benchmarkTiming", {}).get(
            "visibleTexturedCoverageFromNavigationMs"
        )
        if isinstance(cold_absolute, (int, float)) and abs(cold - cold_absolute) > 0.2:
            problems.append("comparison cold TTFTF is not the navigation-clock milestone")
        if isinstance(warm_absolute, (int, float)) and abs(warm - warm_absolute) > 0.2:
            problems.append("comparison warm TTFTF is not the navigation-clock milestone")
        expected_improvement = (cold - warm) / cold * 100
        if abs(improvement - expected_improvement) > 0.05:
            problems.append("reported warm improvement does not match cold/warm TTFTF")
    except ValueError as error:
        cold = warm = improvement = None
        problems.append(str(error))

    if problems:
        raise ValueError(f"{path}: " + "; ".join(problems))
    return {"cold": cold, "warm": warm, "improvement": improvement}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("reports", nargs="+", type=Path)
    parser.add_argument("--min-improvement-percent", type=float, default=60.0)
    args = parser.parse_args()

    rows = []
    failed = False
    for path in args.reports:
        try:
            row = validate_pair(json.loads(path.read_text()), path)
            rows.append(row)
            print(
                f"{path}: cold {row['cold']:.1f} ms -> warm {row['warm']:.1f} ms "
                f"({row['improvement']:.1f}% faster; controlled)",
            )
        except (OSError, json.JSONDecodeError, ValueError) as error:
            print(f"FAIL {error}")
            failed = True

    if rows:
        improvement = statistics.median(row["improvement"] for row in rows)
        cold = statistics.median(row["cold"] for row in rows)
        warm = statistics.median(row["warm"] for row in rows)
        print(
            f"median cold {cold:.1f} ms -> warm {warm:.1f} ms; improvement "
            f"{improvement:.1f}% (required {args.min_improvement_percent:.1f}%)",
        )
        if improvement < args.min_improvement_percent:
            print(
                f"FAIL median warm-reload TTFTF improvement {improvement:.1f}% is below "
                f"{args.min_improvement_percent:.1f}%",
            )
            failed = True
    else:
        failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
