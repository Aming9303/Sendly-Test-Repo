#!/usr/bin/env python3
"""
CLI utility for referencing a GitHub issue in a repo-qualified format.

Usage:
    python fix.py <issue_number>

Examples:
    python fix.py 77
    python fix.py 82
"""

import sys

REPO = "Hazyshades/Sendly-Test-Repo"


def main() -> int:
    if len(sys.argv) != 2:
        print(f"Usage: python fix.py <issue_number>")
        return 2

    raw = sys.argv[1]
    if not raw.isdigit() or int(raw) <= 0:
        print(f"Error: invalid issue number '{raw}'. Expected a positive integer.")
        return 2

    print(f"fix {REPO}#{raw}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
