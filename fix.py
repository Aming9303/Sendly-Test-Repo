#!/usr/bin/env python3
"""
fix.py — Utility to reference a specific issue in Hazyshades/Sendly-Test-Repo.

Usage:
    python fix.py 77
    python fix.py 82

Outputs the issue reference and exits 0 on success.
Exits 1 on missing or invalid arguments.
"""

import sys

REPO = "Hazyshades/Sendly-Test-Repo"

def main():
    if len(sys.argv) != 2:
        print(f"Usage: python fix.py <issue_number>")
        print(f"Example: python fix.py 77")
        sys.exit(1)

    arg = sys.argv[1]
    try:
        issue_num = int(arg)
        if issue_num <= 0:
            raise ValueError("Issue number must be positive")
    except ValueError:
        print(f"Error: '{arg}' is not a valid issue number")
        print(f"Usage: python fix.py <issue_number>")
        sys.exit(1)

    print(f"fix {REPO}#{issue_num}")
    sys.exit(0)

if __name__ == "__main__":
    main()
