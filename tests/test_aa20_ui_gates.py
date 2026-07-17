import copy
import unittest

from scripts.validate_ux_browser_gate import evaluate as evaluate_ux
from scripts.validate_viewport_audits import evaluate as evaluate_viewports


def ux_report():
    return {"search":{"results":1,"maxLongTaskMs":0}, "controls":{"after":0},
        "navigation":{"moved":True,"urlUpdated":True,"inputIsolated":True},
        "persistence":{"stored":True}, "reload":{"stored":True},
        "reducedMotion":{"matches":True}, "axe":{"seriousCritical":[]}}


def viewport(width):
    return {"viewportAudit":{"width":width,"horizontalOverflow":False,"outOfViewport":[],
        "overlaps":[],"controlOutOfViewport":[],"missedHitTargets":[]}}


class AA20UiGateTests(unittest.TestCase):
    def test_rejects_axe_serious_and_missing_axe(self):
        serious = ux_report(); serious["axe"]["seriousCritical"] = ["button-name"]
        missing = ux_report(); del missing["axe"]
        self.assertFalse(next(row for row in evaluate_ux(serious) if row["name"] == "axe serious/critical")["passed"])
        self.assertFalse(next(row for row in evaluate_ux(missing) if row["name"] == "axe serious/critical")["passed"])

    def test_requires_all_four_viewports(self):
        rows = [(str(width), viewport(width)) for width in (320,390,768)]
        self.assertFalse(evaluate_viewports(rows)[-1]["passed"])

    def test_rejects_overlap_at_any_required_width(self):
        rows = [(str(width), viewport(width)) for width in (320,390,768,1280)]
        rows[1][1]["viewportAudit"]["overlaps"] = [["#search","#panel"]]
        checks = evaluate_viewports(rows)
        self.assertFalse(checks[1]["passed"])
        self.assertTrue(checks[-1]["passed"])


if __name__ == "__main__":
    unittest.main()
