import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_perf_medians import evaluate, load_baseline, main


ROOT = Path(__file__).resolve().parents[1]
BASELINE = load_baseline(ROOT / "config/aa20_perf_medians_baseline.json")


def report(ready=874, ttftf=240, p95=10, p99=16.3):
    return {
        "meta": {"finished": True, "crashed": False},
        "milestones": {"loaderHidden": ready, "visibleTexturedCoverage": ttftf},
        "frames": {"p95_ms": p95, "p99_ms": p99},
    }


class PerfMedianGateTests(unittest.TestCase):
    def test_accepts_three_medians_inside_release_and_baseline_budgets(self):
        checks = evaluate([report(), report(1100, 300, 12, 20), report(900, 200, 11, 18)], baseline=BASELINE)
        self.assertTrue(all(check["passed"] for check in checks))

    def test_rejects_severe_regression_even_when_inside_hard_ceiling(self):
        # 30 ms is below the 100 ms absolute p95 ceiling, but three times the
        # checked-in 10 ms median and therefore a release regression.
        rows = [report(p95=30), report(p95=31), report(p95=29)]
        failed = {check["name"] for check in evaluate(rows, baseline=BASELINE) if not check["passed"]}
        self.assertEqual(failed, {"orbit frame p95"})

    def test_rejects_p95_and_p99_release_ceiling_regression(self):
        rows = [report(p95=101, p99=151), report(p95=110, p99=170), report(p95=99, p99=149)]
        failed = {check["name"] for check in evaluate(rows, baseline=BASELINE) if not check["passed"]}
        self.assertEqual(failed, {"orbit frame p95", "orbit frame p99"})

    def test_rejects_ready_ttftf_and_missing_p99(self):
        orbit_rows = [report(), report(), report()]
        del orbit_rows[1]["frames"]["p99_ms"]
        cold_rows = [report(16000, 31000), report(17000, 32000), report(14000, 29000)]
        failed = {check["name"] for check in evaluate(orbit_rows, cold_rows, baseline=BASELINE) if not check["passed"]}
        self.assertEqual(failed, {"cold ready", "cold TTFTF", "orbit frame p99"})

    def test_rejects_boolean_negative_and_nonfinite_metrics(self):
        for bad in (True, False, -1, float("nan"), float("inf")):
            rows = [report(p95=bad), report(p95=bad), report(p95=bad)]
            failed = {check["name"] for check in evaluate(rows, baseline=BASELINE) if not check["passed"]}
            self.assertIn("orbit frame p95", failed)

    def test_uses_stationary_cold_reports_instead_of_orbit_milestones(self):
        orbit_rows = [report(), report(), report()]
        for row in orbit_rows:
            row["milestones"].pop("visibleTexturedCoverage")
        cold_rows = [report(), report(1100, 300), report(900, 200)]
        self.assertTrue(all(check["passed"] for check in evaluate(orbit_rows, cold_rows, baseline=BASELINE)))

    def test_current_r4_medians_pass_checked_in_baseline(self):
        # Checked-in numeric snapshot of the r4 reference run. Do not depend on
        # ignored local artifacts existing on a fresh CI checkout.
        orbit = [report(p95=10.1, p99=16.5), report(p95=9.9, p99=16.3),
                 report(p95=10.0, p99=16.1)]
        cold = [report(872.8, 240.0), report(874.0, 248.2),
                report(875.4, 206.0)]
        self.assertTrue(all(check["passed"] for check in evaluate(orbit, cold, baseline=BASELINE)))

    def test_missing_and_malformed_baselines_fail(self):
        self.assertRaises(ValueError, load_baseline, ROOT / "config/does-not-exist.json")
        self.assertEqual(main(["a.json", "b.json", "c.json", "--baseline", "does-not-exist.json"]), 1)
        with tempfile.TemporaryDirectory() as directory:
            malformed = Path(directory) / "malformed.json"
            malformed.write_text('{"version": 1, "medians": {}}')
            self.assertRaises(ValueError, load_baseline, malformed)
            self.assertEqual(main(["a.json", "b.json", "c.json", "--baseline", str(malformed)]), 1)

    def test_cli_requires_baseline(self):
        with self.assertRaises(SystemExit) as error:
            main(["a.json", "b.json", "c.json"])
        self.assertEqual(error.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
