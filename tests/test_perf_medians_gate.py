import copy
import unittest

from scripts.validate_perf_medians import evaluate


def report(ready=1000, ttftf=500, p95=20, p99=35):
    return {
        "meta": {"finished": True, "crashed": False},
        "milestones": {"loaderHidden": ready, "visibleTexturedCoverage": ttftf},
        "frames": {"p95_ms": p95, "p99_ms": p99},
    }


class PerfMedianGateTests(unittest.TestCase):
    def test_accepts_three_medians_inside_release_budgets(self):
        checks = evaluate([report(), report(1100, 550, 22, 38), report(900, 450, 18, 32)])
        self.assertTrue(all(check["passed"] for check in checks))

    def test_rejects_p95_and_p99_regression_medians(self):
        rows = [report(p95=101, p99=151), report(p95=110, p99=170), report(p95=99, p99=149)]
        failed = {check["name"] for check in evaluate(rows) if not check["passed"]}
        self.assertEqual(failed, {"orbit frame p95", "orbit frame p99"})

    def test_rejects_ready_ttftf_and_missing_p99(self):
        rows = [report(16000, 31000), report(17000, 32000), report(14000, 29000)]
        del rows[1]["frames"]["p99_ms"]
        failed = {check["name"] for check in evaluate(rows) if not check["passed"]}
        self.assertEqual(failed, {"cold ready", "cold TTFTF", "orbit frame p99"})


if __name__ == "__main__":
    unittest.main()
