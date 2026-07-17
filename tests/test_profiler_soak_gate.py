import copy
import unittest

from scripts.validate_profiler_soak import evaluate


def report():
    samples = []
    for minute in range(31):
        samples.append({
            "elapsedSeconds": minute * 60,
            "profilerMode": "bounded-recovery",
            "profilerSampleCount": min(180, minute * 60),
            "profilerSerializedBytes": min(200_000, 80_000 + minute * 10_000),
            "heap": {"usedJSHeapSize": 100_000_000 + minute * 100_000},
            "report": {"memory": {"contextLostCount": 0, "glOutOfMemoryCount": 0}},
        })
    return {"requestedDurationSeconds": 1800, "samples": samples}


class ProfilerSoakGateTests(unittest.TestCase):
    def test_accepts_bounded_flat_tail(self):
        self.assertTrue(all(check["passed"] for check in evaluate(report())))

    def test_rejects_short_soak_and_unbounded_profiler(self):
        candidate = report()
        candidate["requestedDurationSeconds"] = 60
        candidate["samples"] = candidate["samples"][:2]
        candidate["samples"][-1]["profilerSampleCount"] = 181
        candidate["samples"][-1]["profilerSerializedBytes"] = 900_000
        failed = {check["name"] for check in evaluate(candidate) if not check["passed"]}
        self.assertTrue({"faithful-soak-duration", "retained-memory-timeline-present",
            "profiler-ring-buffer-bounded", "profiler-serialized-size-bounded"} <= failed)

    def test_rejects_profiler_tail_and_heap_growth_slopes(self):
        candidate = report()
        for index, sample in enumerate(candidate["samples"]):
            sample["profilerSerializedBytes"] = 100_000 + index * 10_000
            sample["heap"]["usedJSHeapSize"] = 100_000_000 + index * 2_000_000
        failed = {check["name"] for check in evaluate(candidate) if not check["passed"]}
        self.assertIn("profiler-memory-tail-slope-flat", failed)
        self.assertIn("retained-js-heap-slope-bounded", failed)
        self.assertIn("retained-js-heap-growth-bounded", failed)


if __name__ == "__main__":
    unittest.main()
