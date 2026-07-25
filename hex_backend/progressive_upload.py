"""Durable bounded upload spool for completed bake transactions."""

from __future__ import annotations

import json
import os
import threading
import time
from pathlib import Path
from typing import Any

from bake_inventory import write_json_atomic


class ProgressiveUploadSpool:
    def __init__(self, root: Path, store: Any, release_id: str, *, workers: int = 4):
        self.root = root.resolve()
        self.store = store
        self.release_id = release_id
        self.worker_count = max(1, int(workers))
        self.pending = self.root / "pending"
        self.running = self.root / "running"
        self.completed = self.root / "completed"
        self.failed = self.root / "failed"
        for path in (self.pending, self.running, self.completed, self.failed):
            path.mkdir(parents=True, exist_ok=True)
        self._claim_lock = threading.Lock()
        self._stop_when_empty = threading.Event()
        self._threads: list[threading.Thread] = []
        self._restore_interrupted()

    @staticmethod
    def task_id(collection: str, key: tuple[int, int]) -> str:
        return f"{collection}-{key[0]}-{key[1]}"

    def _restore_interrupted(self) -> None:
        for path in sorted(self.running.glob("*.json")):
            task = json.loads(path.read_text())
            target = self.pending / f"{task['task_id']}.json"
            write_json_atomic(target, task)
            path.unlink()

    def spool(
        self, collection: str, key: tuple[int, int], assets: list[dict[str, str]]
    ) -> None:
        task_id = self.task_id(collection, key)
        if (self.completed / f"{task_id}.json").exists():
            return
        payload = {
            "schema_version": 1,
            "task_id": task_id,
            "collection": collection,
            "key": [int(key[0]), int(key[1])],
            "release_id": self.release_id,
            "assets": assets,
            "attempts": 0,
            "created_at": time.time(),
        }
        write_json_atomic(self.pending / f"{task_id}.json", payload)

    def start(self) -> None:
        if self._threads:
            return
        for index in range(self.worker_count):
            thread = threading.Thread(
                target=self._worker, args=(index,),
                name=f"hexagons-upload-{index}", daemon=False,
            )
            thread.start()
            self._threads.append(thread)

    def retry_failed(self) -> int:
        """Requeue durable failures when an operator explicitly resumes a run."""
        count = 0
        for path in sorted(self.failed.glob("*.json")):
            task = json.loads(path.read_text())
            task["attempts"] = 0
            task["last_error"] = None
            write_json_atomic(self.pending / f"{task['task_id']}.json", task)
            path.unlink()
            count += 1
        return count

    def _claim(self, worker: int) -> Path | None:
        with self._claim_lock:
            paths = sorted(self.pending.glob("*.json"))
            if not paths:
                return None
            source = paths[0]
            target = self.running / f"{source.stem}.worker-{worker}.json"
            try:
                os.replace(source, target)
            except FileNotFoundError:
                return None
            return target

    def _upload(self, task: dict[str, Any]) -> tuple[int, float, float]:
        # Imported lazily so backend unit tests can supply a LocalStore without
        # making the scripts directory a package.
        from release_publish import Asset, IMMUTABLE, sha256, upload_asset_idempotent

        uploaded_bytes = 0
        hash_seconds = 0.0
        upload_seconds = 0.0
        for descriptor in task["assets"]:
            asset = Asset(Path(descriptor["local"]), descriptor["logical"])
            if not asset.local.is_file():
                raise FileNotFoundError(asset.local)
            started = time.perf_counter()
            digest = sha256(asset.local)
            hash_seconds += time.perf_counter() - started
            key = f"releases/{self.release_id}/{asset.logical}"
            started = time.perf_counter()
            transferred = upload_asset_idempotent(
                self.store, key, asset, IMMUTABLE, digest, verify_payload=False
            )
            upload_seconds += time.perf_counter() - started
            if transferred:
                uploaded_bytes += asset.local.stat().st_size
        return uploaded_bytes, hash_seconds, upload_seconds

    def _worker(self, worker: int) -> None:
        while True:
            claimed = self._claim(worker)
            if claimed is None:
                if self._stop_when_empty.is_set() and not any(self.running.glob("*.json")):
                    return
                time.sleep(0.2)
                continue
            task = json.loads(claimed.read_text())
            started = time.perf_counter()
            try:
                transferred, hash_seconds, upload_seconds = self._upload(task)
                task.update({
                    "status": "complete",
                    "uploaded_bytes": transferred,
                    "elapsed_seconds": time.perf_counter() - started,
                    "hash_seconds": hash_seconds,
                    "upload_seconds": upload_seconds,
                    "completed_at": time.time(),
                    "last_error": None,
                })
                write_json_atomic(self.completed / f"{task['task_id']}.json", task)
                claimed.unlink()
            except Exception as exc:
                task["attempts"] = int(task.get("attempts", 0)) + 1
                task["last_error"] = str(exc)
                task["last_attempt_at"] = time.time()
                destination = (
                    self.failed if task["attempts"] >= 3 else self.pending
                ) / f"{task['task_id']}.json"
                write_json_atomic(destination, task)
                claimed.unlink()
                if task["attempts"] < 3:
                    time.sleep(2 ** (task["attempts"] - 1))

    def finish_and_wait(self) -> None:
        self._stop_when_empty.set()
        for thread in self._threads:
            thread.join()
        failures = sorted(self.failed.glob("*.json"))
        if failures:
            details = [json.loads(path.read_text()) for path in failures[:5]]
            raise RuntimeError(f"progressive upload failed after retries: {details}")

    def status(self) -> dict[str, int]:
        return {
            "pending": len(list(self.pending.glob("*.json"))),
            "running": len(list(self.running.glob("*.json"))),
            "completed": len(list(self.completed.glob("*.json"))),
            "failed": len(list(self.failed.glob("*.json"))),
        }

    def completed_tasks(self) -> list[dict[str, Any]]:
        return [json.loads(path.read_text()) for path in sorted(self.completed.glob("*.json"))]
