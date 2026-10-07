"""Archive lifecycle regressions, using synthetic data and a CLI evaluator fixture."""

import hashlib
import json
import stat
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import manage_leaderboard as archive


# This fixture stands in for an external official CLI. Tests exercise archiving,
# provenance and re-scoring; the real evaluator has its own upstream test suite.
EVALUATOR = '''
import argparse, hashlib, json
from pathlib import Path
p = argparse.ArgumentParser()
for key in ['prediction-root', 'gold-root', 'config-root', 'output']:
    p.add_argument('--' + key, required=True, type=Path)
a = p.parse_args()
tasks, digest = [], hashlib.sha256()
for config in sorted(a.config_root.glob('task_*.json'), key=lambda p: int(p.stem[5:])):
    digest.update(config.name.encode() + b'\\0' + config.read_bytes() + b'\\0')
    prediction = a.prediction_root / config.stem / 'prediction.csv'
    gold = a.gold_root / config.stem / 'gold.csv'
    passed = prediction.is_file() and prediction.read_bytes() == gold.read_bytes()
    error = None if passed else ('missing_prediction' if not prediction.exists() else 'relation_mismatch')
    tasks.append({'task_id': config.stem, 'passed': passed, 'score': int(passed), 'error_code': error})
correct = sum(t['passed'] for t in tasks)
a.output.write_text(json.dumps({'task_count': len(tasks), 'passed_task_count': correct,
    'task_accuracy': correct / len(tasks), 'config_set_sha256': digest.hexdigest(), 'tasks': tasks}))
'''


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        self.store = self.base / "store"
        self.dataset = self.base / "dataset"
        for n in (1, 2):
            archive.write_json(self.dataset / "evaluation/configs" / f"task_{n}.json", {"task_id": f"task_{n}"})
            gold = self.dataset / "output" / f"task_{n}" / "gold.csv"
            gold.parent.mkdir(parents=True)
            gold.write_text("answer\n1\n")
        self.evaluator = self.base / "trusted-evaluator/evaluate.py"
        self.evaluator.parent.mkdir()
        self.evaluator.write_text(EVALUATOR)

    def snapshot(self, scope="private"):
        return archive.snapshot_dataset(self.store, self.dataset, self.evaluator,
                                         expected_tasks=2, scope=scope)

    def package(self):
        path = self.base / "participant.zip"
        with zipfile.ZipFile(path, "w") as package:
            package.writestr("metadata.json", json.dumps({"schema_version": "1.0", "method_name": "Fixture"}))
            package.writestr("predictions/task_1/prediction.csv", "answer\n1\n")
            for n in (1, 2):
                package.writestr(f"traces/task_{n}/trace.json", json.dumps({"task_id": f"task_{n}", "cost": 1}))
        return path

    def test_repeated_snapshot_is_stable_and_gold_change_creates_new_version(self):
        first = self.snapshot()
        self.assertEqual(first, self.snapshot())
        (self.dataset / "output/task_1/gold.csv").write_text("answer\n2\n")
        second = self.snapshot()
        self.assertNotEqual(first, second)
        self.assertEqual((self.store / "datasets" / first / "output/task_1/gold.csv").read_text(), "answer\n1\n")

    def test_missing_prediction_counts_in_denominator_and_retests_preserve_history(self):
        version1 = self.snapshot()
        package = self.package()
        archive.ingest_archive(self.store, "team-run", package)
        first = archive.evaluate_submission(self.store, "team-run", version1)
        self.assertEqual((first["correct"], first["task_count"]), (1, 2))
        old_summary = self.store / "submissions/team-run/evaluations" / first["run_id"] / "evaluation_summary.json"
        before = old_summary.read_bytes()
        (self.dataset / "output/task_1/gold.csv").write_text("answer\n2\n")
        version2 = self.snapshot()
        refreshed = archive.refresh_leaderboard(self.store, version2)
        second = refreshed["results"][0]
        self.assertEqual(second["correct"], 0)
        self.assertNotEqual(first["run_id"], second["run_id"])
        self.assertEqual(before, old_summary.read_bytes())
        comparison = archive.read_json(self.store / "submissions/team-run/evaluations" / second["run_id"] / "comparison.json")
        self.assertEqual([t["task_id"] for t in comparison["changed_tasks"]], ["task_1"])
        self.assertEqual(second["previous_run_id"], first["run_id"])

    def test_modified_prediction_and_gold_are_rejected_before_scoring(self):
        version = self.snapshot()
        archive.ingest_archive(self.store, "team-run", self.package())
        prediction = self.store / "submissions/team-run/extracted/predictions/task_1/prediction.csv"
        prediction.write_text("answer\n99\n")
        with self.assertRaisesRegex(ValueError, "Archived files have changed"):
            archive.evaluate_submission(self.store, "team-run", version)
        prediction.write_text("answer\n1\n")
        gold = self.store / "datasets" / version / "output/task_1/gold.csv"
        gold.write_text("answer\n99\n")
        with self.assertRaisesRegex(ValueError, "Archived files have changed"):
            archive.evaluate_submission(self.store, "team-run", version)

    def test_expected_checksum_and_size_are_enforced_and_archive_is_not_replaced(self):
        package = self.package()
        source = self.base / "source.json"
        archive.write_json(source, {"archive": {"sha256": "0" * 64, "bytes": package.stat().st_size}})
        archive.intake_submission(self.store, "team-run", source)
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            archive.ingest_archive(self.store, "team-run", package)
        self.assertFalse((self.store / "submissions/team-run/receipt.json").exists())
        with self.assertRaisesRegex(ValueError, "byte count mismatch"):
            archive.ingest_archive(self.store, "another-run", package,
                                   expected_sha256=archive.sha256_file(package), expected_bytes=0)
        archive.ingest_archive(self.store, "another-run", package, expected_sha256=archive.sha256_file(package))
        with self.assertRaisesRegex(ValueError, "already archived"):
            archive.ingest_archive(self.store, "another-run", package)

    def test_zip_traversal_symlink_and_duplicate_paths_are_rejected(self):
        for kind in ["traversal", "symlink", "duplicate"]:
            with self.subTest(kind=kind):
                package = self.base / f"bad-{kind}.zip"
                with zipfile.ZipFile(package, "w") as handle:
                    if kind == "traversal":
                        handle.writestr("../escape.txt", "data")
                    elif kind == "symlink":
                        member = zipfile.ZipInfo("link")
                        member.create_system = 3
                        member.external_attr = (stat.S_IFLNK | 0o777) << 16
                        handle.writestr(member, "../outside")
                    else:
                        handle.writestr("file.txt", "one")
                        handle.writestr("FILE.txt", "two")
                extracted = self.base / f"extract-{kind}"
                extracted.mkdir()
                with self.assertRaises(ValueError):
                    archive.safe_extract(package, extracted)
                self.assertEqual(list(extracted.iterdir()), [])
        self.assertFalse((self.base / "escape.txt").exists())

    def test_public_and_private_previous_runs_are_separate(self):
        private_version, public_version = self.snapshot(), self.snapshot(scope="public")
        archive.ingest_archive(self.store, "team-run", self.package())
        first = archive.evaluate_submission(self.store, "team-run", private_version)
        public = archive.evaluate_submission(self.store, "team-run", public_version)
        self.assertIsNone(public["previous_run_id"])
        second = archive.evaluate_submission(self.store, "team-run", private_version)
        self.assertEqual(second["previous_run_id"], first["run_id"])

    def test_official_full_snapshot_requires_all_410_task_ids(self):
        with self.assertRaisesRegex(ValueError, "Expected 410 configs"):
            archive.snapshot_dataset(self.store, self.dataset, self.evaluator)

    def test_evaluator_failure_retains_logs_and_failed_record(self):
        self.evaluator.write_text("import sys\nprint('fixture fatal', file=sys.stderr)\nsys.exit(2)\n")
        version = self.snapshot()
        archive.ingest_archive(self.store, "team-run", self.package())
        with self.assertRaisesRegex(ValueError, "preserved logs"):
            archive.evaluate_submission(self.store, "team-run", version)
        record = next((self.store / "submissions/team-run/evaluations").glob("*/run.json"))
        self.assertEqual(archive.read_json(record)["status"], "failed")
        self.assertIn("fixture fatal", (record.parent / "stderr.txt").read_text())

    def test_refresh_continues_after_bad_submission_and_lists_pending_archives(self):
        version = self.snapshot()
        package = self.package()
        archive.ingest_archive(self.store, "bad-team", package)
        archive.ingest_archive(self.store, "good-team", package)
        (self.store / "submissions/bad-team/extracted/predictions/task_1/prediction.csv").write_text("edited\n")
        source = self.base / "pending.json"
        archive.write_json(source, {"archive": {"sha256": archive.sha256_file(package)}})
        archive.intake_submission(self.store, "pending-team", source)
        report = archive.refresh_leaderboard(self.store, version)
        self.assertEqual((report["successful_count"], report["failed_count"]), (1, 1))
        self.assertEqual(report["awaiting_archive_submissions"], ["pending-team"])
        self.assertEqual([r["status"] for r in report["results"]], ["failed", "completed"])

    def test_evaluator_missing_summary_is_recorded_as_failure(self):
        self.evaluator.write_text("print('fixture succeeded without writing output')\n")
        version = self.snapshot()
        archive.ingest_archive(self.store, "team-run", self.package())
        with self.assertRaisesRegex(ValueError, "preserved logs"):
            archive.evaluate_submission(self.store, "team-run", version)
        record = next((self.store / "submissions/team-run/evaluations").glob("*/run.json"))
        self.assertEqual(archive.read_json(record)["status"], "failed")


if __name__ == "__main__":
    unittest.main()
