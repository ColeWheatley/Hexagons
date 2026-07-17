#!/usr/bin/env python3
"""Emit one operational status snapshot for a durable big-bake run."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any

import psutil

from bake_inventory import load_inventory


def directory_bytes(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    for item in path.rglob("*"):
        try:
            if item.is_file():
                total += item.stat().st_size
        except FileNotFoundError:
            pass
    return total


def gpu_status() -> dict[str, Any]:
    if not shutil.which("nvidia-smi"):
        return {"available": False}
    result = subprocess.run([
        "nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total",
        "--format=csv,noheader,nounits",
    ], text=True, capture_output=True, check=False)
    if result.returncode:
        return {"available": False, "error": result.stderr.strip()}
    util, used, total = [int(part.strip()) for part in result.stdout.split(",")]
    return {
        "available": True, "utilization_percent": util,
        "vram_used_mib": used, "vram_total_mib": total,
    }


def process_status(pid: int | None) -> dict[str, Any]:
    if not pid:
        return {"alive": False}
    try:
        root = psutil.Process(pid)
        processes = [root, *root.children(recursive=True)]
        before = {process.pid: process.cpu_times() for process in processes if process.is_running()}
        time.sleep(0.2)
        rss = 0
        read_bytes = 0
        write_bytes = 0
        encoder_count = 0
        cpu_seconds_delta = 0.0
        for process in processes:
            try:
                rss += process.memory_info().rss
                io = process.io_counters()
                read_bytes += io.read_bytes
                write_bytes += io.write_bytes
                command = " ".join(process.cmdline())
                encoder_count += "basisu" in command
                current = process.cpu_times()
                previous = before.get(process.pid)
                if previous:
                    cpu_seconds_delta += (
                        current.user + current.system - previous.user - previous.system
                    )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        return {
            "alive": root.is_running(), "pid": pid, "processes": len(processes),
            "encoder_processes": encoder_count,
            "cpu_percent_of_one_core_sum": cpu_seconds_delta / 0.2 * 100.0,
            "rss_bytes": rss, "io_read_bytes": read_bytes, "io_write_bytes": write_bytes,
        }
    except psutil.NoSuchProcess:
        return {"alive": False, "pid": pid}


def snapshot(inventory_path: Path, pid: int | None = None) -> dict[str, Any]:
    inventory = load_inventory(inventory_path)
    output_root = Path(inventory["output_root"])
    progress = inventory.get("progress", {})
    completed = progress.get("geometry_complete", 0) + progress.get("pages_complete", 0)
    total = progress.get("geometry_total", 0) + progress.get("pages_total", 0)
    created = dt.datetime.fromisoformat(inventory["created_at"])
    elapsed = max(0.001, (dt.datetime.now(dt.timezone.utc) - created).total_seconds())
    rate = completed / elapsed
    eta = (total - completed) / rate if rate > 0 else None
    memory = psutil.virtual_memory()
    disk = shutil.disk_usage(output_root if output_root.exists() else output_root.parent)
    spool = output_root / "upload_spool"
    upload = {
        state: len(list((spool / state).glob("*.json"))) if (spool / state).exists() else 0
        for state in ("pending", "running", "completed", "failed")
    }
    return {
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(),
        "run_id": inventory["run_id"], "git_commit": inventory["git_commit"],
        "progress": progress, "completion_fraction": completed / total if total else 0.0,
        "milestones": inventory.get("milestones", {}),
        "units_per_minute": rate * 60.0, "eta_seconds": eta,
        "retries": sum(max(0, int(item.get("attempts", 0)) - 1) for name in ("geometry", "texture_pages") for item in inventory[name]),
        "failures": progress.get("geometry_failed", 0) + progress.get("pages_failed", 0),
        "process": process_status(pid),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.2),
            "ram_used_bytes": memory.used, "ram_available_bytes": memory.available,
            "network": psutil.net_io_counters()._asdict(),
        },
        "gpu": gpu_status(),
        "disk": {
            "output_bytes": directory_bytes(output_root),
            "free_bytes": disk.free, "total_bytes": disk.total,
        },
        "upload": upload,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path, required=True)
    parser.add_argument("--pid-file", type=Path)
    parser.add_argument("--append", type=Path)
    args = parser.parse_args()
    pid = None
    if args.pid_file and args.pid_file.is_file():
        try:
            pid = int(args.pid_file.read_text().strip())
        except ValueError:
            pass
    result = snapshot(args.inventory, pid)
    payload = json.dumps(result, sort_keys=True)
    print(json.dumps(result, indent=2, sort_keys=True))
    if args.append:
        args.append.parent.mkdir(parents=True, exist_ok=True)
        with args.append.open("a", encoding="utf-8") as target:
            target.write(payload + "\n")


if __name__ == "__main__":
    main()
