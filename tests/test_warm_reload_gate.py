import importlib.util
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location(
    "validate_warm_reload",
    Path(__file__).parents[1] / "scripts" / "validate_warm_reload.py",
)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def report(*, controlled=True, same_controller=True):
    first = "http://localhost/service-worker.abc.js"
    second = first if same_controller else "http://localhost/service-worker.def.js"
    return {
        "meta": {
            "kind": "service-worker-warm-reload",
            "sameProfile": True,
            "ttftfBasis": "navigation-start-to-visible-textured-coverage",
            "coldNetworkProfile": {
                "name": "good-lte",
                "latencyMs": 100,
                "downloadMbps": 10,
                "uploadMbps": 5,
            },
            "warmNetworkProfile": {
                "name": "unthrottled-local",
                "latencyMs": 0,
                "downloadMbps": None,
                "uploadMbps": None,
            },
            "networkEmulationClearedBeforeWarm": True,
            "cacheResetBeforeCold": {
                "temporaryProfile": True,
                "browserCacheCleared": True,
                "browserCookiesCleared": True,
                "originStorageCleared": True,
            },
        },
        "cold": {
            "meta": {"finished": True, "crashed": False},
            "navigationTiming": {"requestToResponseMs": 100, "transferSize": 4096},
            "benchmarkTiming": {"visibleTexturedCoverageFromNavigationMs": 500},
        },
        "warm": {
            "meta": {"finished": True, "crashed": False},
            "benchmarkTiming": {"visibleTexturedCoverageFromNavigationMs": 150},
        },
        "comparison": {
            "coldTTFTFMs": 500,
            "warmTTFTFMs": 150,
            "improvementPercent": 70,
        },
        "serviceWorker": {
            "beforeWarmNavigation": {
                "ready": True,
                "controlled": controlled,
                "controllerScriptURL": first,
            },
            "afterWarmNavigation": {
                "controlled": controlled,
                "controllerScriptURL": second,
            },
        },
        "coldResponses": [
            {
                "resourceType": "Document",
                "url": "http://localhost/?bench=coldload",
                "status": 200,
                "fromServiceWorker": False,
                "fromDiskCache": False,
                "fromPrefetchCache": False,
                "serviceWorkerResponseSource": None,
                "encodedDataLength": 4096,
                "requestToResponseMs": 100,
                "observedReceiveMbps": 0.3,
            },
            {
                "resourceType": "Script",
                "url": "http://localhost/main.abc.js",
                "status": 200,
                "fromServiceWorker": False,
                "fromDiskCache": False,
                "fromPrefetchCache": False,
                "serviceWorkerResponseSource": None,
                "encodedDataLength": 800_000,
                "observedReceiveMbps": 9.5,
            },
        ],
        "warmResponses": [
            {
                "resourceType": "Document",
                "url": "http://localhost/?bench=coldload",
                "status": 200,
                "fromServiceWorker": False,
                "fromDiskCache": True,
                "fromPrefetchCache": False,
                "serviceWorkerResponseSource": None,
                "requestToResponseMs": 2,
            },
            {
                "resourceType": "Fetch",
                "url": "http://localhost/tile_manifest.json?v=1",
                "status": 200,
                "fromServiceWorker": True,
                "fromDiskCache": False,
                "fromPrefetchCache": False,
                "serviceWorkerResponseSource": "network",
            },
        ],
    }


class WarmReloadGateTests(unittest.TestCase):
    def test_accepts_controlled_same_profile_pair(self):
        row = MODULE.validate_pair(report(), "fixture")
        self.assertEqual(row["improvement"], 70)

    def test_rejects_uncontrolled_warm_navigation(self):
        with self.assertRaisesRegex(ValueError, "did not control"):
            MODULE.validate_pair(report(controlled=False), "fixture")

    def test_rejects_controller_change(self):
        with self.assertRaisesRegex(ValueError, "controller changed"):
            MODULE.validate_pair(report(same_controller=False), "fixture")

    def test_rejects_a_cached_cold_document(self):
        fixture = report()
        fixture["coldResponses"][0]["fromDiskCache"] = True
        with self.assertRaisesRegex(ValueError, "pre-existing cache"):
            MODULE.validate_pair(fixture, "fixture")

    def test_rejects_missing_latency_evidence(self):
        fixture = report()
        fixture["coldResponses"][0]["requestToResponseMs"] = 5
        with self.assertRaisesRegex(ValueError, "100 ms latency"):
            MODULE.validate_pair(fixture, "fixture")

    def test_rejects_non_manifest_warm_network_fetch(self):
        fixture = report()
        fixture["warmResponses"].append({
            "resourceType": "Script",
            "url": "http://localhost/main.abc.js",
            "status": 200,
            "fromServiceWorker": False,
            "fromDiskCache": False,
            "fromPrefetchCache": False,
            "serviceWorkerResponseSource": None,
        })
        with self.assertRaisesRegex(ValueError, "non-manifest assets"):
            MODULE.validate_pair(fixture, "fixture")

    def test_rejects_profiler_relative_comparison_metric(self):
        fixture = report()
        fixture["comparison"]["coldTTFTFMs"] = 300
        with self.assertRaisesRegex(ValueError, "navigation-clock milestone"):
            MODULE.validate_pair(fixture, "fixture")


if __name__ == "__main__":
    unittest.main()
