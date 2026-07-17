import copy
import unittest

from scripts.validate_ux_browser_gate import EXPECTED_CONTROL_ACTIONS, evaluate as evaluate_ux
from scripts.validate_viewport_audits import evaluate as evaluate_viewports


def ux_report():
    hud_values = {"fps-counter":"FPS: IDLE | Zoom: 1200","hex-count":"1,234 TOPS | 56 SKIRTS",
        "tri-count":"1.2M","draw-stats":"Calls: 635 | G:14 | T:20","sector-val":"278, -235",
        "hex-val":"12, -7","tile-height":"2500.1m","camera-height":"1200m",
        "near-lod-bands":"2 / 5 / 10 km","far-lod-bands":"25 / 60 km",
        "moving-lod-summary":"moving: uniform skirtless L3 (118 m)",
        "settled-lod-summary":"settled: fixed 2 / 5 / 10 / 25 / 60 km bands",
        "distance-scale-label":"1 km"}
    return {"search":{"results":1,"maxLongTaskMs":0,"tabFocused":True,"typedByKeyboard":True,
            "oneFrameResponse":True,"keyboardSelected":True,"selectedName":"Habicht",
            "cameraMoved":True,"urlUpdated":True,"selectionMs":100,"statusAfter":"Habicht selected."},
        "controls":{"actions":[{"name":name,"passed":True} for name in EXPECTED_CONTROL_ACTIONS],"uncovered":[]},
        "hud":{"settled":True,"engineState":"STATIC","fpsIdle":True,"numericLow":False,
            "fpsSamples":["FPS: IDLE | Zoom: 1200"]*20,"values":hud_values,"placeholders":[]},
        "navigation":{"moved":True,"urlUpdated":True,"inputIsolated":True},
        "persistence":{"stored":True,"explicitUrl":"http://localhost/?view=1&at=a&eye=b",
            "localRestore":{"ready":True,"stored":True,"maxPoseDelta":0.01,"url":"http://localhost/"},
            "sharedUrlOverride":{"ready":True,"maxPoseDelta":0.01,"url":"http://localhost/?view=1&at=c&eye=d"},
            "sharedExplicitUrl":"http://localhost/?view=1&at=c&eye=d",
            "conflictingStoredUrl":"http://localhost/?view=1&at=e&eye=f"},
        "reload":{"stored":True},
        "reducedMotion":{"matches":True,"duration":"0.00001s","iterationCount":"1"},
        "axe":{"seriousCritical":[]}}


def viewport(width):
    return {"viewportAudit":{"width":width,"horizontalOverflow":False,"outOfViewport":[],
        "overlaps":[],"controlOutOfViewport":[],"missedHitTargets":[]}}


class AA20UiGateTests(unittest.TestCase):
    def test_requires_complete_visible_control_coverage(self):
        missing = ux_report(); missing["controls"]["uncovered"] = ["copy-log-btn"]
        failed = ux_report(); failed["controls"]["actions"][0]["passed"] = False
        arbitrary = ux_report(); arbitrary["controls"]["actions"][0]["name"] = "made-up-control"
        short = ux_report(); short["controls"]["actions"] = short["controls"]["actions"][:-1]
        duplicate = ux_report(); duplicate["controls"]["actions"].append(duplicate["controls"]["actions"][0].copy())
        for fixture in (missing, failed, arbitrary, short, duplicate):
            row = next(row for row in evaluate_ux(fixture) if row["name"] == "truthful controls")
            self.assertFalse(row["passed"])

    def test_requires_idle_hud_without_placeholders(self):
        low_fps = ux_report(); low_fps["hud"]["fpsSamples"] = ["FPS: 3 | Zoom: 1200"] * 20
        placeholder = ux_report(); placeholder["hud"]["values"]["tri-count"] = "Initializing…"
        empty = ux_report(); empty["hud"]["values"]["distance-scale-label"] = ""
        console_placeholder = ux_report(); console_placeholder["hud"]["placeholders"] = ["console-output"]
        for fixture in (low_fps, placeholder, empty, console_placeholder):
            row = next(row for row in evaluate_ux(fixture) if row["name"] == "truthful HUD")
            self.assertFalse(row["passed"])

    def test_requires_keyboard_search_and_both_persistence_paths(self):
        slow = ux_report(); slow["search"]["selectionMs"] = 501
        boolean = ux_report(); boolean["search"]["selectionMs"] = True
        local = ux_report(); local["persistence"]["localRestore"]["maxPoseDelta"] = 1
        shared = ux_report(); shared["persistence"]["sharedUrlOverride"]["maxPoseDelta"] = 1
        negative = ux_report(); negative["persistence"]["localRestore"]["maxPoseDelta"] = -1
        self.assertFalse(next(row for row in evaluate_ux(slow) if row["name"] == "keyboard search selection")["passed"])
        self.assertFalse(next(row for row in evaluate_ux(boolean) if row["name"] == "keyboard search selection")["passed"])
        for fixture in (local, shared, negative):
            self.assertFalse(next(row for row in evaluate_ux(fixture) if row["name"] == "view persistence")["passed"])

    def test_reduced_motion_requires_effectively_still_animation(self):
        moving = ux_report(); moving["reducedMotion"]["duration"] = "10s"
        repeated = ux_report(); repeated["reducedMotion"]["iterationCount"] = "infinite"
        for fixture in (moving, repeated):
            self.assertFalse(next(row for row in evaluate_ux(fixture) if row["name"] == "reduced motion")["passed"])

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
