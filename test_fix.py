from __future__ import annotations

import subprocess
import sys
import unittest
from pathlib import Path


FIX_SCRIPT = Path(__file__).with_name("fix.py")


class FixCliTests(unittest.TestCase):
    def run_fix(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(FIX_SCRIPT), *arguments],
            check=False,
            capture_output=True,
            text=True,
        )

    def test_prints_repository_and_cli_issue_number(self) -> None:
        result = self.run_fix("77")

        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout.strip(), "fix Hazyshades/Sendly-Test-Repo#77")
        self.assertEqual(result.stderr, "")

    def test_missing_argument_prints_usage_and_fails(self) -> None:
        result = self.run_fix()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Usage: python fix.py <issue-number>", result.stderr)

    def test_invalid_arguments_fail(self) -> None:
        for arguments in (("abc",), ("0",), ("-4",), ("12", "13")):
            with self.subTest(arguments=arguments):
                result = self.run_fix(*arguments)
                self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
