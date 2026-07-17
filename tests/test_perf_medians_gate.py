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
        orbit_rows = [report(), report(), report()]
        del orbit_rows[1]["frames"]["p99_ms"]
        cold_rows = [report(16000, 31000), report(17000, 32000), report(14000, 29000)]
        failed = {check["name"] for check in evaluate(orbit_rows, cold_rows) if not check["passed"]}
        self.assertEqual(failed, {"cold ready", "cold TTFTF", "orbit frame p99"})

    def test_uses_stationary_cold_reports_instead_of_orbit_milestones(self):
        orbit_rows = [report(), report(), report()]
        for row in orbit_rows:
            row["milestones"].pop("visibleTexturedCoverage")
        cold_rows = [report(), report(1100, 550), report(900, 450)]
        self.assertTrue(all(check["passed"] for check in evaluate(orbit_rows, cold_rows)))


if __name__ == "__main__":
    unittest.main()
