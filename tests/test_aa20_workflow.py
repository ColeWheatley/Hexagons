import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AA20WorkflowContractTests(unittest.TestCase):
    def test_trusted_release_candidates_run_asset_backed_job(self):
        workflow = (ROOT / ".github/workflows/aa20-ci.yml").read_text()
        self.assertIn("github.event_name == 'push'", workflow)
        self.assertIn("github.event_name == 'pull_request'", workflow)
        self.assertIn("github.event.pull_request.head.repo.full_name == github.repository", workflow)
        self.assertIn("github.event_name == 'workflow_dispatch' && inputs.release_browser", workflow)
        self.assertIn("runs-on: [self-hosted, hexagons-assets, chromium]", workflow)
        self.assertIn("timeout-minutes: 75", workflow)

    def test_release_script_verifies_assets_and_versioned_baseline_before_acceptance(self):
        script = (ROOT / "scripts/release_browser_gates.sh").read_text()
        verify_at = script.index("scripts/verify_release_assets.py")
        build_at = script.index("npm ci")
        baseline_at = script.index("--baseline config/aa20_perf_medians_baseline.json")
        self.assertLess(verify_at, build_at)
        self.assertGreater(baseline_at, build_at)


if __name__ == "__main__":
    unittest.main()
