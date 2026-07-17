import unittest

from scripts.validate_idle_browser_gate import evaluate_idle_browser_report, validate


def report(*, idle_frames=0, idle_renders=0, idle_task_ms=10, visibility=True):
    return {
        "visibility": {"supported": visibility},
        "intervals": {
            "active": {"viewerFrames": 120, "renderCalls": 100, "taskDurationMs": 200},
            "idle": {
                "viewerFrames": idle_frames,
                "renderCalls": idle_renders,
                "taskDurationMs": idle_task_ms,
            },
            "hidden": {"viewerFrames": 0, "renderCalls": 0},
            "recovery": {"viewerFrames": 1, "renderCalls": 1},
        },
    }


class IdleBrowserGatePolicyTests(unittest.TestCase):
    def test_accepts_idle_suspension_and_recovery(self):
        candidate = report()
        self.assertTrue(validate(candidate))
        self.assertTrue(all(check["passed"] for check in candidate["checks"]))

    def test_rejects_frame_render_and_cpu_regressions(self):
        candidate = report(idle_frames=40, idle_renders=3, idle_task_ms=150)
        failed = {check["name"] for check in evaluate_idle_browser_report(candidate) if not check["passed"]}
        self.assertEqual(
            failed,
            {
                "settled-frame-activity-reduced-at-least-90-percent",
                "settled-scene-does-not-render",
                "settled-main-thread-time-reduced-at-least-50-percent",
            },
        )

    def test_skips_visibility_checks_when_cdp_cannot_override_it(self):
        checks = evaluate_idle_browser_report(report(visibility=False))
        self.assertNotIn("hidden-tab-suspends-viewer-work", {check["name"] for check in checks})
        self.assertTrue(all(check["passed"] for check in checks))


if __name__ == "__main__":
    unittest.main()
