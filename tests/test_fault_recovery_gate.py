import copy
import unittest

from scripts.validate_fault_recovery_gate import evaluate_fault_recovery_report, validate


def asset_rows(prefix):
    urls = [f"http://localhost/{prefix}-{index}" for index in range(20)]
    dropped = [urls[9], urls[19]]
    attempts = {url: (2 if url in dropped else 1) for url in urls}
    return {
        "uniqueResources": 20,
        "droppedFirstAttempts": 2,
        "requestAttempts": 22,
        "attemptsByResource": attempts,
        "droppedResources": dropped,
        "successfulResources": urls,
    }


def report():
    failures = {
        "tiles": {"failed": 0, "finalFailures": 0},
        "textures": {"failed": 0, "finalFailures": 0},
        "context": {
            "lost": 1,
            "restored": 1,
            "recoveryFailures": 0,
            "recovering": False,
            "recoveryDurationMs": 180,
        },
        "globalErrors": 0,
        "unhandledRejections": 0,
    }
    snapshot = {
        "loaderHidden": True,
        "fatalState": None,
        "visibleTexturedCoverage": True,
        "activeTexturePages": 4,
        "stats": {
            "tileClassification": {"visible": {"count": 3}},
            "failures": failures,
        },
    }
    return {
        "meta": {"kind": "aa2-fault-recovery", "fullAssets": True},
        "faultInjection": {
            "terrain": asset_rows("terrain.bin"),
            "texture": asset_rows("texture.ktx2"),
        },
        "ready": copy.deepcopy(snapshot),
        "contextRecovery": {
            "extensionSupported": True,
            "lossObserved": True,
            "restoreObserved": True,
            "renderedAfterRestore": True,
            "observedRecoveryMs": 220,
            "after": copy.deepcopy(snapshot),
        },
    }


class FaultRecoveryGatePolicyTests(unittest.TestCase):
    def test_accepts_bounded_request_and_context_recovery(self):
        candidate = report()
        self.assertTrue(validate(candidate))
        self.assertTrue(all(check["passed"] for check in candidate["checks"]))

    def test_rejects_missing_retry_and_retry_storm(self):
        candidate = report()
        row = candidate["faultInjection"]["terrain"]
        dropped = row["droppedResources"][0]
        row["attemptsByResource"][dropped] = 4
        row["requestAttempts"] = 25
        row["successfulResources"].remove(dropped)
        failed = {
            check["name"]
            for check in evaluate_fault_recovery_report(candidate)
            if not check["passed"]
        }
        self.assertIn("terrain-all-injected-drops-recovered", failed)
        self.assertIn("terrain-retry-budget-is-bounded", failed)

    def test_rejects_spinner_hang_and_slow_context_restore(self):
        candidate = report()
        candidate["ready"]["loaderHidden"] = False
        candidate["ready"]["fatalState"] = {"kind": "manifest"}
        candidate["contextRecovery"]["observedRecoveryMs"] = 5100
        candidate["contextRecovery"]["after"]["stats"]["failures"]["context"]["recoveryDurationMs"] = 5100
        failed = {
            check["name"]
            for check in evaluate_fault_recovery_report(candidate)
            if not check["passed"]
        }
        self.assertIn("faulted-load-painted-visible-textured-terrain", failed)
        self.assertIn("no-spinner-hang-or-final-resource-failure", failed)
        self.assertIn("webgl-context-restored-within-five-seconds", failed)

    def test_rejects_restore_without_a_repaint(self):
        candidate = report()
        candidate["contextRecovery"]["renderedAfterRestore"] = False
        failed = {
            check["name"]
            for check in evaluate_fault_recovery_report(candidate)
            if not check["passed"]
        }
        self.assertIn("context-restore-repainted-terrain-and-cleared-loader", failed)


if __name__ == "__main__":
    unittest.main()
