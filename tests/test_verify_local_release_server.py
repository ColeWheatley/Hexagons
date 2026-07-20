import functools
import tempfile
import threading
import unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from scripts.verify_local_release_server import verify


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


class LocalReleaseServerVerifierTests(unittest.TestCase):
    def test_accepts_exact_dist_and_rejects_stale_build(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            served, expected = root / "served", root / "expected"
            for directory in (served, expected):
                directory.mkdir()
                (directory / "index.html").write_text('<script src="main.abc123.js"></script>')
                (directory / "main.abc123.js").write_text("current")
                (directory / "tile_manifest.json").write_text('{"release":"current"}')
            handler = functools.partial(QuietHandler, directory=str(served))
            server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                base = f"http://127.0.0.1:{server.server_port}"
                self.assertTrue(verify(base, expected, attempts=2, delay=0)["verified"])
                (expected / "main.abc123.js").write_text("newer")
                with self.assertRaisesRegex(RuntimeError, "does not match"):
                    verify(base, expected, attempts=1, delay=0)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
