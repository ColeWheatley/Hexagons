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
        "meta": {"kind": "service-worker-warm-reload", "sameProfile": True},
        "cold": {"meta": {"finished": True, "crashed": False}},
        "warm": {"meta": {"finished": True, "crashed": False}},
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


if __name__ == "__main__":
    unittest.main()
