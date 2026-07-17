import unittest

from scripts.validate_capability_matrix import EXPECTED, validate_report


SIGNALS = {
    "low-device": {"deviceMemory": 2, "hardwareConcurrency": 4, "effectiveType": "4g", "saveData": False},
    "mid-device": {"deviceMemory": 4, "hardwareConcurrency": 4, "effectiveType": "4g", "saveData": False},
    "high-device": {"deviceMemory": 16, "hardwareConcurrency": 12, "effectiveType": "4g", "saveData": False},
    "save-data": {"deviceMemory": 16, "hardwareConcurrency": 12, "effectiveType": "4g", "saveData": True},
    "constrained-network": {"deviceMemory": 16, "hardwareConcurrency": 12, "effectiveType": "3g", "saveData": False},
}


def fixture():
    rows = []
    for name, (profile, workers, budget, jobs, high_enter, guard) in EXPECTED.items():
        texture_bytes = 100_000_000 if name == "high-device" else 20_000_000
        rows.append(
            {
                "name": name,
                "expectedProfile": profile,
                "injected": SIGNALS[name],
                "observed": {
                    **SIGNALS[name],
                    "provenance": {"method": "Page.addScriptToEvaluateOnNewDocument"},
                },
                "benchmark": {
                    "meta": {"finished": True, "crashed": False},
                    "memory": {"contextLostCount": 0, "glOutOfMemoryCount": 0},
                },
                "detailedStats": {
                    "capability": {
                        "profile": profile,
                        "workers": workers,
                        "textureBudgetBytes": budget,
                        "maxTextureJobs": jobs,
                        "highTextureEnterPx": high_enter,
                        "guardMarginScale": guard,
                    },
                    "vram": {
                        "highTextureBudgetBytes": budget,
                        "highTextureBytes": budget // 4,
                        "highTextureBudgetUtilization": 0.25,
                    },
                    "network": {"texBytes": texture_bytes},
                    "workerLanes": {
                        "geometry": {"workers": workers - 1},
                        "texture": {"workers": 1},
                    },
                    "failures": {"context": {"lost": 0, "recoveryFailures": 0, "recovering": False}},
                    "textureResidency": {
                        "highSourceSize": 4096 if name == "high-device" else None,
                        "highUploadSize": 4096 if name == "high-device" else None,
                        "highSkippedTopMips": 0,
                        "desired": {"high4096": 6 if profile != "low" else 0},
                        "resident": {"high4096": 6 if profile != "low" else 0},
                    },
                },
            }
        )
    return {
        "kind": "aa11-capability-matrix",
        "provenance": {
            "freshProfilePerCase": True,
            "injection": "Page.addScriptToEvaluateOnNewDocument",
        },
        "cases": rows,
    }


class CapabilityMatrixGateTests(unittest.TestCase):
    def test_accepts_complete_objective_matrix(self):
        result = validate_report(fixture())
        self.assertEqual(result["transferReductionPercent"]["save-data"], 80)

    def test_rejects_unobserved_signal_override(self):
        report = fixture()
        report["cases"][3]["observed"]["saveData"] = False
        with self.assertRaisesRegex(ValueError, "not injected"):
            validate_report(report)

    def test_rejects_transfer_and_high_quality_regression(self):
        report = fixture()
        high = next(row for row in report["cases"] if row["name"] == "high-device")
        high["detailedStats"]["textureResidency"]["highUploadSize"] = 2048
        save = next(row for row in report["cases"] if row["name"] == "save-data")
        save["detailedStats"]["network"]["texBytes"] = 95_000_000
        with self.assertRaisesRegex(ValueError, "4096px.*transfer reduction"):
            validate_report(report)

    def test_rejects_oom_or_worker_budget_drift(self):
        report = fixture()
        low = next(row for row in report["cases"] if row["name"] == "low-device")
        low["benchmark"]["memory"]["glOutOfMemoryCount"] = 1
        low["detailedStats"]["workerLanes"]["geometry"]["workers"] = 9
        with self.assertRaisesRegex(ValueError, "GL_OUT_OF_MEMORY.*worker lanes"):
            validate_report(report)


if __name__ == "__main__":
    unittest.main()
