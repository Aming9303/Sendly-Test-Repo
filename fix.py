#!/usr/bin/env python3
"""Print a repository-qualified reference to the issue being fixed."""

from __future__ import annotations

import sys
from collections.abc import Sequence


REPOSITORY = "Hazyshades/Sendly-Test-Repo"
USAGE = "Usage: python fix.py <issue-number>"


def parse_issue_number(value: str) -> int:
    """Return a positive issue number or raise ``ValueError``."""
    if not value.isascii() or not value.isdecimal():
        raise ValueError("issue number must contain only digits")

    issue_number = int(value)
    if issue_number <= 0:
        raise ValueError("issue number must be greater than zero")

    return issue_number


def main(argv: Sequence[str] | None = None) -> int:
    arguments = list(sys.argv[1:] if argv is None else argv)
    if len(arguments) != 1:
        print(USAGE, file=sys.stderr)
        return 2

    try:
        issue_number = parse_issue_number(arguments[0])
    except ValueError as error:
        print(f"Invalid issue number: {error}.", file=sys.stderr)
        print(USAGE, file=sys.stderr)
        return 2

    print(f"fix {REPOSITORY}#{issue_number}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
