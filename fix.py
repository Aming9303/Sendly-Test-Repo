#!/usr/bin/env python3
"""Utility to print a fix reference for a given issue number.

Usage:
    python fix.py <issue_number>

Examples:
    python fix.py 77          # prints: fix Hazyshades/Sendly-Test-Repo#77
    python fix.py             # prints usage and exits with code 1
    python fix.py abc         # prints error and exits with code 1
"""

import sys

REPO = "Hazyshades/Sendly-Test-Repo"


def main(argv):
    if len(argv) != 2:
        print("Usage: python fix.py <issue_number>", file=sys.stderr)
        print("Example: python fix.py 77", file=sys.stderr)
        return 1

    raw = argv[1]
    try:
        issue_number = int(raw)
    except ValueError:
        print("Error: '{}' is not a valid issue number".format(raw), file=sys.stderr)
        print("Usage: python fix.py <issue_number>", file=sys.stderr)
        return 1

    if issue_number <= 0:
        print("Error: issue number must be positive, got {}".format(issue_number), file=sys.stderr)
        return 1

    print("fix {}#{}".format(REPO, issue_number))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
