#!/usr/bin/env python3
"""Archive DataSpace submissions and rerun a frozen, trusted official evaluator.

Python standard library only. Participant archives are data and are never executed.
The filesystem manifests are authoritative; index.json is a rebuildable overview.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import platform
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import uuid
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any


WEBSITE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STORE = WEBSITE_ROOT / "leaderboard-private"
IDENTIFIER = re.compile(r"^[a-z0-9][a-z0-9._-]{0,119}$")
TASK_ID = re.compile(r"^task_([1-9][0-9]*)$")
MAX_ARCHIVE_FILES = 20_000
MAX_EXTRACTED_BYTES = 2 * 1024**3
MAX_MEMBER_BYTES = 128 * 1024**2


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def run_identifier() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ-") + uuid.uuid4().hex[:8]


def valid_identifier(value: str) -> str:
    if not IDENTIFIER.fullmatch(value) or value in {".", ".."}:
        raise ValueError(f"Invalid identifier: {value!r}")
    return value


def task_sort(task_id: str) -> int:
    match = TASK_ID.fullmatch(task_id)
    if not match:
        raise ValueError(f"Invalid task ID: {task_id!r}")
    return int(match.group(1))


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                     prefix=".write-", delete=False) as handle:
        tmp = Path(handle.name)
        json.dump(value, handle, indent=2, ensure_ascii=False, allow_nan=False)
        handle.write("\n")
    os.replace(tmp, path)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def digest_json(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                    ensure_ascii=False, allow_nan=False).encode()).hexdigest()


def inventory(root: Path, *, exclude: set[str] | None = None) -> list[dict[str, Any]]:
    entries = []
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root).as_posix()
        if relative in (exclude or set()):
            continue
        if path.is_symlink():
            raise ValueError(f"Symbolic link in immutable archive: {relative}")
        if path.is_file():
            entries.append({"path": relative, "bytes": path.stat().st_size,
                            "sha256": sha256_file(path)})
    return entries


def verify_inventory(root: Path, entries: list[dict[str, Any]], *,
                     exclude: set[str] | None = None) -> None:
    if inventory(root, exclude=exclude) != entries:
        raise ValueError(f"Archived files have changed: {root}")


def git_revision(path: Path) -> str | None:
    result = subprocess.run(["git", "-C", str(path), "rev-parse", "HEAD"],
                            capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None


def audit(store: Path, event: str, **details: Any) -> None:
    store.mkdir(parents=True, exist_ok=True)
    with (store / "audit.jsonl").open("a", encoding="utf-8") as handle:
        handle.write(json.dumps({"timestamp_utc": utc_now(), "event": event,
                                 **details}, ensure_ascii=False, allow_nan=False) + "\n")


def rebuild_index(store: Path) -> dict[str, Any]:
    datasets = [read_json(path) for path in sorted((store / "datasets").glob("*/snapshot.json"))]
    submissions = []
    for path in sorted((store / "submissions").glob("*")):
        if not path.is_dir() or path.name.startswith("."):
            continue
        receipt = read_json(path / "receipt.json") if (path / "receipt.json").exists() else None
        intake = read_json(path / "intake.json") if (path / "intake.json").exists() else None
        runs = [read_json(record) for record in sorted((path / "evaluations").glob("*/run.json"))]
        submissions.append({"submission_id": path.name, "status": "archived" if receipt else "awaiting_archive",
                            "intake": intake, "receipt": receipt, "evaluations": runs})
    index = {"schema_version": "1.0", "updated_at_utc": utc_now(),
             "datasets": datasets, "submissions": submissions}
    write_json(store / "index.json", index)
    return index


def intake_submission(store: Path, submission_id: str, source: Path,
                      email: Path | None = None) -> Path:
    submission_id = valid_identifier(submission_id)
    record = read_json(source)
    if not isinstance(record, dict):
        raise ValueError("Source record must be a JSON object")
    destination = store / "submissions" / submission_id
    if destination.exists():
        raise ValueError(f"Submission ID already exists: {submission_id}")
    destination.mkdir(parents=True)
    shutil.copyfile(source, destination / "source.json")
    if email:
        shutil.copyfile(email, destination / "submission-email.txt")
    write_json(destination / "intake.json", {
        "schema_version": "1.0", "submission_id": submission_id,
        "recorded_at_utc": utc_now(), "source_record_sha256": sha256_file(destination / "source.json"),
        "email_transcription_sha256": sha256_file(destination / "submission-email.txt") if email else None,
        "source": record,
    })
    audit(store, "submission_intake", submission_id=submission_id)
    rebuild_index(store)
    return destination


def snapshot_dataset(store: Path, dataset_root: Path, evaluator: Path, *,
                     label: str = "", expected_tasks: int = 410,
                     scope: str = "private") -> str:
    dataset_root, evaluator = dataset_root.resolve(), evaluator.resolve()
    scope = valid_identifier(scope)
    configs = sorted((dataset_root / "evaluation" / "configs").glob("task_*.json"),
                     key=lambda path: task_sort(path.stem))
    if len(configs) != expected_tasks or expected_tasks < 1:
        raise ValueError(f"Expected {expected_tasks} configs, found {len(configs)}")
    if expected_tasks == 410 and {p.stem for p in configs} != {f"task_{n}" for n in range(1, 411)}:
        raise ValueError("Official 410-task dataset must contain exactly task_1 through task_410")
    dataset_dir = store / "datasets"
    dataset_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".snapshot-", dir=dataset_dir) as tmp:
        stage = Path(tmp)
        for config in configs:
            if read_json(config).get("task_id") != config.stem:
                raise ValueError(f"Config filename/task_id mismatch: {config}")
            gold = dataset_root / "output" / config.stem / "gold.csv"
            if not gold.is_file():
                raise ValueError(f"Missing official gold: {gold}")
            for source, relative in [(config, Path("evaluation/configs") / config.name),
                                     (gold, Path("output") / config.stem / "gold.csv")]:
                target = stage / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
        for source in [dataset_root / "manifest.json", dataset_root / "checksums.sha256",
                       dataset_root / "README.md"]:
            if source.is_file():
                shutil.copyfile(source, stage / source.name)
        if (dataset_root / "metadata").is_dir():
            shutil.copytree(dataset_root / "metadata", stage / "metadata")
        evaluator_dir = stage / "evaluator"
        evaluator_dir.mkdir()
        shutil.copyfile(evaluator, evaluator_dir / "evaluate.py")
        for relative in ["schema", "tests"]:
            source = evaluator.parent / relative
            if source.is_dir():
                shutil.copytree(source, evaluator_dir / relative,
                                ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        if (evaluator.parent / "README.md").is_file():
            shutil.copyfile(evaluator.parent / "README.md", evaluator_dir / "README.md")
        entries = inventory(stage)
        scoring_entries = [item for item in entries if item["path"].startswith(("output/", "evaluation/configs/"))]
        fingerprint = digest_json({"scope": scope, "files": entries})
        dataset_id = f"dataspace-{scope}-{fingerprint[:20]}"
        config_digest = hashlib.sha256()
        for config in configs:
            config_digest.update(config.name.encode() + b"\0")
            config_digest.update((stage / "evaluation/configs" / config.name).read_bytes() + b"\0")
        evaluator_hash = sha256_file(evaluator_dir / "evaluate.py")
        manifest = read_json(stage / "manifest.json") if (stage / "manifest.json").exists() else {}
        declared = manifest.get("evaluation", {})
        warnings = []
        for key, actual in [("evaluator_sha256", evaluator_hash),
                            ("config_set_sha256", config_digest.hexdigest()),
                            ("public_config_set_sha256", config_digest.hexdigest())]:
            if declared.get(key) and declared[key] != actual:
                warnings.append({"field": key, "declared": declared[key], "actual": actual})
        record = {
            "schema_version": "1.0", "dataset_id": dataset_id, "scope": scope,
            "label": label, "created_at_utc": utc_now(), "task_count": len(configs),
            "task_ids": [p.stem for p in configs], "bundle_sha256": fingerprint,
            "scoring_sha256": digest_json(scoring_entries), "config_set_sha256": config_digest.hexdigest(),
            "gold_set_sha256": digest_json([e for e in entries if e["path"].startswith("output/")]),
            "evaluator_sha256": evaluator_hash, "source_dataset_root": str(dataset_root),
            "source_evaluator": str(evaluator), "evaluator_repository_revision": git_revision(evaluator.parent),
            "website_repository_revision": git_revision(WEBSITE_ROOT),
            "source_manifest_discrepancies": warnings, "files": entries,
            "snapshot_scope": "Gold, configs, evaluator, schema/tests and release metadata; task inputs remain at source_dataset_root.",
        }
        destination = dataset_dir / dataset_id
        if destination.exists():
            previous = read_json(destination / "snapshot.json")
            if previous["bundle_sha256"] != fingerprint:
                raise ValueError(f"Dataset ID collision: {dataset_id}")
            verify_inventory(destination, previous["files"], exclude={"snapshot.json"})
        else:
            write_json(stage / "snapshot.json", record)
            shutil.copytree(stage, destination)
            audit(store, "dataset_snapshot", dataset_id=dataset_id, scope=scope,
                  task_count=len(configs), bundle_sha256=fingerprint)
    rebuild_index(store)
    return dataset_id


def safe_extract(archive: Path, destination: Path) -> list[dict[str, Any]]:
    """Validate the whole ZIP before writing, preserving participant bytes verbatim."""
    with zipfile.ZipFile(archive) as package:
        members = package.infolist()
        if len(members) > MAX_ARCHIVE_FILES:
            raise ValueError("ZIP has too many members")
        if sum(item.file_size for item in members) > MAX_EXTRACTED_BYTES:
            raise ValueError("ZIP exceeds the uncompressed size limit")
        names: dict[str, bool] = {}
        for item in members:
            name = item.filename.rstrip("/")
            path = PurePosixPath(name)
            mode = item.external_attr >> 16
            if (not name or "\\" in name or "\x00" in item.filename or ":" in name
                    or path.is_absolute() or any(part in {".", "..", ""} for part in name.split("/"))):
                raise ValueError(f"Unsafe ZIP path: {item.filename!r}")
            if name.casefold() in names:
                raise ValueError(f"Duplicate ZIP path: {item.filename!r}")
            if stat.S_IFMT(mode) not in {0, stat.S_IFREG, stat.S_IFDIR}:
                raise ValueError(f"Non-regular ZIP member: {item.filename!r}")
            if item.flag_bits & 1 or item.file_size > MAX_MEMBER_BYTES:
                raise ValueError(f"Encrypted or oversized ZIP member: {item.filename!r}")
            names[name.casefold()] = item.is_dir()
        for name in names:
            for parent in PurePosixPath(name).parents:
                if str(parent) in names and not names[str(parent)]:
                    raise ValueError(f"ZIP file/directory conflict: {name}")
        for item in members:
            target = destination.joinpath(*PurePosixPath(item.filename).parts)
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with package.open(item) as source, target.open("xb") as handle:
                    shutil.copyfileobj(source, handle)
    return inventory(destination)


def package_root(extracted: Path) -> Path:
    candidates = [p.parent for p in extracted.rglob("metadata.json")
                  if (p.parent / "predictions").is_dir() and (p.parent / "traces").is_dir()]
    if len(candidates) != 1:
        raise ValueError("Expected exactly one package containing metadata.json, predictions/ and traces/")
    return candidates[0]


def ingest_archive(store: Path, submission_id: str, archive: Path, *,
                   expected_sha256: str | None = None, expected_bytes: int | None = None) -> Path:
    submission_id = valid_identifier(submission_id)
    destination = store / "submissions" / submission_id
    if (destination / "receipt.json").exists():
        raise ValueError("Submission is already archived; use a new ID for a different submission")
    if (destination / "intake.json").exists():
        intake = read_json(destination / "intake.json")
        if sha256_file(destination / "source.json") != intake["source_record_sha256"]:
            raise ValueError("Original submission source record has changed")
        source = read_json(destination / "source.json")
        expected_sha256 = expected_sha256 or source.get("archive", {}).get("sha256")
        if expected_bytes is None:
            expected_bytes = source.get("archive", {}).get("bytes")
    actual_hash, actual_bytes = sha256_file(archive), archive.stat().st_size
    if expected_sha256 and actual_hash != expected_sha256.lower():
        raise ValueError(f"Archive SHA-256 mismatch: {actual_hash}")
    if expected_bytes is not None and actual_bytes != expected_bytes:
        raise ValueError(f"Archive byte count mismatch: {actual_bytes}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".ingest-", dir=destination.parent) as tmp:
        stage = Path(tmp)
        original = stage / "original" / "submission.zip"
        original.parent.mkdir()
        shutil.copyfile(archive, original)
        if sha256_file(original) != actual_hash:
            raise ValueError("Source archive changed during intake")
        extracted = stage / "extracted"
        extracted.mkdir()
        files = safe_extract(original, extracted)
        root = package_root(extracted)
        metadata = read_json(root / "metadata.json")
        if not isinstance(metadata, dict):
            raise ValueError("metadata.json must be a JSON object")
        receipt = {
            "schema_version": "1.0", "submission_id": submission_id, "archived_at_utc": utc_now(),
            "original_filename": archive.name, "source_local_path": str(archive.resolve()),
            "archive_path": "original/submission.zip", "archive_sha256": actual_hash,
            "archive_bytes": actual_bytes, "expected_sha256": expected_sha256,
            "expected_bytes": expected_bytes, "package_root": root.relative_to(stage).as_posix(),
            "metadata": metadata, "extracted_files": files,
        }
        write_json(stage / "receipt.json", receipt)
        destination.mkdir(exist_ok=True)
        for child in stage.iterdir():
            if (destination / child.name).exists():
                raise ValueError(f"Archive artifacts already exist: {destination / child.name}")
        for child in stage.iterdir():
            shutil.move(str(child), destination / child.name)
    audit(store, "archive_ingested", submission_id=submission_id, sha256=actual_hash, bytes=actual_bytes)
    rebuild_index(store)
    return destination


def review_package(root: Path, task_ids: list[str]) -> dict[str, Any]:
    """Schema-neutral coverage review; flexible trace costs require a recorded adapter/manual audit."""
    metadata = read_json(root / "metadata.json")
    required = ["schema_version", "method_name", "organization", "submission_date", "contact",
                "backbone_models", "cost", "paper_url", "code_url"]
    expected = set(task_ids)
    predictions = {p.name for p in (root / "predictions").iterdir() if p.is_dir() and TASK_ID.fullmatch(p.name)}
    traces = {p.name for p in (root / "traces").iterdir() if p.is_dir() and TASK_ID.fullmatch(p.name)}
    present_predictions, present_traces, invalid_traces = set(), set(), []
    for task_id in sorted(expected, key=task_sort):
        if (root / "predictions" / task_id / "prediction.csv").is_file():
            present_predictions.add(task_id)
        trace = root / "traces" / task_id / "trace.json"
        if trace.is_file():
            present_traces.add(task_id)
            try:
                value = read_json(trace)
                if not isinstance(value, (dict, list)):
                    raise ValueError("Trace must be a JSON object or list")
            except (ValueError, OSError) as error:
                invalid_traces.append({"task_id": task_id, "error": str(error)})
    return {
        "expected_task_count": len(expected), "prediction_count": len(present_predictions),
        "trace_count": len(present_traces),
        "missing_prediction_tasks": sorted(expected - present_predictions, key=task_sort),
        "missing_trace_tasks": sorted(expected - present_traces, key=task_sort),
        "invalid_traces": invalid_traces,
        "out_of_scope_prediction_tasks": sorted(predictions - expected, key=task_sort),
        "out_of_scope_trace_tasks": sorted(traces - expected, key=task_sort),
        "metadata_missing_fields": [key for key in required if key not in metadata],
        "trace_cost_review": "pending_schema_specific_or_manual_audit",
        "selection_and_redaction_review": "pending_manual_review",
        "public_leaderboard_status": "pending_review",
    }


def latest_successful_run(submission: Path, scope: str, *, exclude_run: str = "") -> dict[str, Any] | None:
    for path in sorted((submission / "evaluations").glob("*/run.json"), reverse=True):
        record = read_json(path)
        if record.get("status") == "completed" and record.get("scope") == scope and record["run_id"] != exclude_run:
            return record
    return None


def compare_results(previous: dict[str, Any], current: dict[str, Any]) -> dict[str, Any]:
    old = {task["task_id"]: task for task in previous["tasks"]}
    new = {task["task_id"]: task for task in current["tasks"]}
    changed = []
    for task_id in sorted(old.keys() & new.keys(), key=task_sort):
        if (old[task_id]["passed"], old[task_id].get("error_code")) != (new[task_id]["passed"], new[task_id].get("error_code")):
            changed.append({"task_id": task_id, "previous_passed": old[task_id]["passed"],
                            "current_passed": new[task_id]["passed"],
                            "previous_error_code": old[task_id].get("error_code"),
                            "current_error_code": new[task_id].get("error_code")})
    return {
        "previous_correct": previous["passed_task_count"], "current_correct": current["passed_task_count"],
        "previous_task_count": previous["task_count"], "current_task_count": current["task_count"],
        "previous_accuracy": previous["task_accuracy"], "current_accuracy": current["task_accuracy"],
        "changed_tasks": changed, "added_tasks": sorted(new.keys() - old.keys(), key=task_sort),
        "removed_tasks": sorted(old.keys() - new.keys(), key=task_sort),
    }


def evaluate_submission(store: Path, submission_id: str, dataset_id: str) -> dict[str, Any]:
    submission = store / "submissions" / valid_identifier(submission_id)
    dataset = store / "datasets" / valid_identifier(dataset_id)
    receipt = read_json(submission / "receipt.json")
    snapshot = read_json(dataset / "snapshot.json")
    verify_inventory(dataset, snapshot["files"], exclude={"snapshot.json"})
    verify_inventory(submission / "extracted", receipt["extracted_files"])
    if sha256_file(submission / receipt["archive_path"]) != receipt["archive_sha256"]:
        raise ValueError("Original archive has changed")
    root = submission / receipt["package_root"]
    run_id = run_identifier()
    run_dir = submission / "evaluations" / run_id
    run_dir.mkdir(parents=True)
    previous = latest_successful_run(submission, snapshot["scope"])
    command = [sys.executable, "-B", str(dataset / "evaluator/evaluate.py"),
               "--prediction-root", str(root / "predictions"), "--gold-root", str(dataset / "output"),
               "--config-root", str(dataset / "evaluation/configs"),
               "--output", str(run_dir / "evaluation_summary.json")]
    record = {
        "schema_version": "1.0", "run_id": run_id, "submission_id": submission_id,
        "dataset_id": dataset_id, "scope": snapshot["scope"], "status": "running",
        "started_at_utc": utc_now(), "command": command, "archive_sha256": receipt["archive_sha256"],
        "dataset_bundle_sha256": snapshot["bundle_sha256"], "config_set_sha256": snapshot["config_set_sha256"],
        "gold_set_sha256": snapshot["gold_set_sha256"], "evaluator_sha256": snapshot["evaluator_sha256"],
        "manager_sha256": sha256_file(Path(__file__)), "manager_repository_revision": git_revision(WEBSITE_ROOT),
        "environment": {"python": sys.version, "executable": sys.executable, "platform": platform.platform()},
        "previous_run_id": previous["run_id"] if previous else None,
        "public_leaderboard_status": "pending_review",
    }
    shutil.copyfile(Path(__file__), run_dir / "manage_leaderboard.py")
    write_json(run_dir / "run.json", record)
    write_json(run_dir / "package_review.json", review_package(root, snapshot["task_ids"]))
    audit(store, "evaluation_started", submission_id=submission_id, dataset_id=dataset_id, run_id=run_id)
    with (run_dir / "stdout.txt").open("w") as stdout, (run_dir / "stderr.txt").open("w") as stderr:
        result = subprocess.run(command, stdout=stdout, stderr=stderr, cwd=run_dir)
    record.update({"finished_at_utc": utc_now(), "exit_code": result.returncode,
                   "status": "completed" if result.returncode == 0 else "failed"})
    if result.returncode == 0:
        try:
            summary = read_json(run_dir / "evaluation_summary.json")
            if summary["task_count"] != snapshot["task_count"] or summary["config_set_sha256"] != snapshot["config_set_sha256"]:
                raise ValueError("Evaluator task count/config hash does not match snapshot")
            if ({task["task_id"] for task in summary["tasks"]} != set(snapshot["task_ids"])
                    or len(summary["tasks"]) != snapshot["task_count"]
                    or sum(task["passed"] for task in summary["tasks"]) != summary["passed_task_count"]
                    or summary["task_accuracy"] != summary["passed_task_count"] / snapshot["task_count"]):
                raise ValueError("Evaluator task results/accuracy do not match summary")
            verify_inventory(dataset, snapshot["files"], exclude={"snapshot.json"})
            verify_inventory(submission / "extracted", receipt["extracted_files"])
        except (OSError, ValueError, KeyError, TypeError) as error:
            record.update({"status": "failed", "integrity_error": str(error)})
        else:
            record.update({"task_count": summary["task_count"], "correct": summary["passed_task_count"],
                           "task_accuracy": summary["task_accuracy"],
                           "summary_sha256": sha256_file(run_dir / "evaluation_summary.json"),
                           "failure_codes": dict(Counter(t["error_code"] for t in summary["tasks"] if not t["passed"]))})
            with (run_dir / "task_results.csv").open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=["task_id", "passed", "score", "error_code",
                                                           "gold_row_count", "prediction_row_count"])
                writer.writeheader()
                writer.writerows({key: task.get(key) for key in writer.fieldnames} for task in summary["tasks"])
            if previous:
                previous_summary = submission / "evaluations" / previous["run_id"] / "evaluation_summary.json"
                if sha256_file(previous_summary) != previous["summary_sha256"]:
                    record["comparison_error"] = "Previous evaluation summary has changed; comparison omitted"
                    audit(store, "comparison_integrity_error", submission_id=submission_id,
                          run_id=run_id, previous_run_id=previous["run_id"])
                else:
                    old = read_json(previous_summary)
                    comparison = compare_results(old, summary)
                    comparison.update({"previous_run_id": previous["run_id"], "previous_dataset_id": previous["dataset_id"],
                                       "current_run_id": run_id, "current_dataset_id": dataset_id})
                    write_json(run_dir / "comparison.json", comparison)
    write_json(run_dir / "run.json", record)
    audit(store, "evaluation_finished", submission_id=submission_id, dataset_id=dataset_id,
          run_id=run_id, status=record["status"], correct=record.get("correct"))
    rebuild_index(store)
    if record["status"] != "completed":
        raise ValueError(f"Evaluation failed; preserved logs: {run_dir}")
    return record


def refresh_leaderboard(store: Path, dataset_id: str) -> dict[str, Any]:
    valid_identifier(dataset_id)
    snapshot = read_json(store / "datasets" / dataset_id / "snapshot.json")
    verify_inventory(store / "datasets" / dataset_id, snapshot["files"], exclude={"snapshot.json"})
    refresh_id = run_identifier()
    results = []
    for receipt in sorted((store / "submissions").glob("*/receipt.json")):
        try:
            results.append(evaluate_submission(store, receipt.parent.name, dataset_id))
        except (OSError, ValueError, KeyError) as error:
            results.append({"submission_id": receipt.parent.name, "status": "failed", "error": str(error)})
    awaiting = [p.parent.name for p in sorted((store / "submissions").glob("*/intake.json"))
                if not (p.parent / "receipt.json").exists()]
    report = {"refresh_id": refresh_id, "dataset_id": dataset_id,
              "completed_at_utc": utc_now(), "results": results,
              "successful_count": sum(r["status"] == "completed" for r in results),
              "failed_count": sum(r["status"] == "failed" for r in results),
              "awaiting_archive_submissions": awaiting,
              "public_leaderboard_status": "pending_review"}
    write_json(store / "refreshes" / refresh_id / "refresh.json", report)
    audit(store, "leaderboard_refresh", refresh_id=refresh_id, dataset_id=dataset_id)
    return report


def main() -> int:
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--store", type=Path, default=DEFAULT_STORE)
    commands = parser.add_subparsers(dest="command", required=True)
    intake = commands.add_parser("intake", help="Record a submission email before archive access is available")
    intake.add_argument("--submission-id", required=True)
    intake.add_argument("--source", type=Path, required=True, help="JSON provenance and declared archive hashes")
    intake.add_argument("--email", type=Path)
    snapshot = commands.add_parser("snapshot", help="Freeze configs, gold, release metadata and trusted evaluator")
    snapshot.add_argument("--dataset-root", type=Path, required=True)
    snapshot.add_argument("--evaluator", type=Path, required=True)
    snapshot.add_argument("--label", default="")
    snapshot.add_argument("--expected-tasks", type=int, default=410)
    snapshot.add_argument("--scope", default="private")
    ingest = commands.add_parser("ingest", help="Verify, preserve and safely extract a participant ZIP")
    ingest.add_argument("--submission-id", required=True)
    ingest.add_argument("--archive", type=Path, required=True)
    ingest.add_argument("--sha256")
    ingest.add_argument("--bytes", type=int)
    evaluate = commands.add_parser("evaluate", help="Create a new evaluation without changing historical artifacts")
    evaluate.add_argument("--submission-id", required=True)
    evaluate.add_argument("--dataset-id", required=True)
    refresh = commands.add_parser("refresh", help="Reevaluate every archived submission on the same frozen dataset")
    refresh.add_argument("--dataset-id", required=True)
    commands.add_parser("status", help="Rebuild index.json and show the current archive status")
    args = parser.parse_args()
    store = args.store.resolve()
    try:
        if args.command == "intake":
            output = {"submission_path": str(intake_submission(store, args.submission_id, args.source, args.email))}
        elif args.command == "snapshot":
            output = {"dataset_id": snapshot_dataset(store, args.dataset_root, args.evaluator, label=args.label,
                                                     expected_tasks=args.expected_tasks, scope=args.scope)}
        elif args.command == "ingest":
            output = {"submission_path": str(ingest_archive(store, args.submission_id, args.archive,
                                                            expected_sha256=args.sha256, expected_bytes=args.bytes))}
        elif args.command == "evaluate":
            output = evaluate_submission(store, args.submission_id, args.dataset_id)
        elif args.command == "refresh":
            output = refresh_leaderboard(store, args.dataset_id)
        else:
            index = rebuild_index(store)
            output = {"store": str(store), "datasets": [{"dataset_id": d["dataset_id"], "scope": d["scope"],
                                                         "task_count": d["task_count"]} for d in index["datasets"]],
                      "submissions": [{"submission_id": s["submission_id"], "status": s["status"],
                                       "evaluations": len(s["evaluations"])} for s in index["submissions"]]}
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as error:
        print(f"Leaderboard archive error: {error}", file=sys.stderr)
        return 1
    print(json.dumps(output, indent=2, ensure_ascii=False, allow_nan=False))
    if args.command == "refresh" and output["failed_count"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
