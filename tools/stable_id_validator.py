#!/usr/bin/env python3
"""OURSELF stable-ID validator.

stable_id:   SELF-TOOL-01K3MSTABLEIDVALIDATOR0000
entity_type: tool
status:      READ_ONLY
created_at:  2026-08-19

Discharges the Next Executable Action recorded in Delta-619
(SELF-ACTION-01JZXAESTABLEIDVALIDATOR01) and Delta-620
(SELF-ACTION-01K1C7R6STABLEVALIDATOR01):

  1. validates canonical ID syntax
  2. detects duplicate IDs
  3. detects durable records with missing IDs
  4. reports IDENTITY_DEBT without silently mutating records
  5. emits a machine-readable validation report
  6. requires separate human authorization before any bulk migration

READ-ONLY BY CONSTRUCTION. This tool opens files for reading only and never
writes to the repository. Repair is NOT implemented and is NOT authorized.

  ValidationPerformed != RepairAuthorized
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

# SELF-<TYPE>-<26-CHARACTER TIME-SORTABLE TOKEN>
# The lookbehind stops the pattern matching inside compound words such as
# HBCSELF-EQUATION-CONFORMANCE-MATRIX-001, which are document titles, not IDs.
ID_PATTERN = re.compile(
    r"(?<![A-Za-z0-9-])SELF-([A-Z][A-Z0-9]*)-([A-Z0-9]+(?:-[A-Z0-9]+)*)"
)

# A DECLARATION binds an ID to an entity. A CITATION merely references one.
# Cross-file citation is correct and required; only multiple DECLARATIONS of the
# same ID are a uniqueness defect.
#
#   IdCited != IdDeclared
DECLARATION_LABELS = (
    r"\*\*Stable ID:\*\*", r"\*\*Gate ID:\*\*", r"\*\*Verdict ID:\*\*",
    r"\*\*Refusal ID:\*\*", r"\*\*Rollback ID:\*\*", r"\*\*Action ID:\*\*",
    r"\*\*Seal ID:\*\*", r"\*\*Evidence ID:\*\*",
    r'"stable_id"\s*:', r"stable_id\s*:", r"Stable ID\s*:",
)
DECLARATION_PATTERN = re.compile(
    r"(?:" + "|".join(DECLARATION_LABELS) + r")\s*[`\"]?"
    r"((?<![A-Za-z0-9-])SELF-[A-Z][A-Z0-9]*-[A-Z0-9]+(?:-[A-Z0-9]+)*)[`\"]?"
)
TOKEN_LENGTH = 26

# Crockford base32 excludes I, L, O, U. Existing canon uses I and O, so this is
# reported as ADVISORY only. Enforcing it is open question Q-05 and would
# require a witnessed decision, not a tool default.
CROCKFORD_EXCLUDED = set("ILOU")

# A durable record is any markdown or yaml artifact under these roots.
DURABLE_ROOTS = ("governance", "specifications", "schemas", "reviews")
DURABLE_SUFFIXES = (".md", ".yaml", ".yml", ".json")
SKIP_DIRS = {".git", "__pycache__"}


def durable_files(root: Path):
    for path in sorted(root.rglob("*")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if not path.is_file() or path.suffix not in DURABLE_SUFFIXES:
            continue
        if path.relative_to(root).parts[0] in DURABLE_ROOTS:
            yield path


def scan(root: Path) -> dict:
    occurrences = defaultdict(list)   # stable_id -> [relative paths] (any mention)
    declarations = defaultdict(list)  # stable_id -> [relative paths] (binding sites)
    malformed = []
    advisory = []
    files_without_id = []

    for path in durable_files(root):
        rel = str(path.relative_to(root))
        text = path.read_text(encoding="utf-8", errors="replace")
        found = False

        for decl in DECLARATION_PATTERN.finditer(text):
            declarations[decl.group(1)].append(rel)

        for match in ID_PATTERN.finditer(text):
            sid, type_part, token = match.group(0), match.group(1), match.group(2)
            found = True
            occurrences[sid].append(rel)

            if "-" in token:
                # SELF-<TYPE>-<TOKEN>: the token is a single segment. Extra
                # hyphen-separated segments are a distinct defect from a
                # wrong-length token, and reporting only length would hide it.
                malformed.append({
                    "stable_id": sid,
                    "file": rel,
                    "defect": "TOKEN_CONTAINS_HYPHEN",
                    "expected": "single segment",
                    "actual": len(token),
                })
            if len(token) != TOKEN_LENGTH:
                malformed.append({
                    "stable_id": sid,
                    "file": rel,
                    "defect": "TOKEN_LENGTH",
                    "expected": TOKEN_LENGTH,
                    "actual": len(token),
                })
            bad = sorted(set(token) & CROCKFORD_EXCLUDED)
            if bad:
                advisory.append({
                    "stable_id": sid,
                    "file": rel,
                    "advisory": "NON_CROCKFORD_CHARACTERS",
                    "characters": bad,
                    "note": "Open question Q-05. Existing canon uses these. Not a defect.",
                })

        if not found:
            files_without_id.append(rel)

    # A duplicate is the same ID DECLARED in more than one place. An ID cited
    # across many files is a cross-reference and is correct.
    duplicates = [
        {"stable_id": sid, "declared_in": sorted(set(files))}
        for sid, files in sorted(declarations.items())
        if len(set(files)) > 1
    ]

    # An ID cited but never declared anywhere is a dangling reference.
    dangling = sorted(
        {sid for sid in occurrences if sid not in declarations}
    )

    # Deduplicate malformed reports: one entry per (id, defect).
    seen = set()
    unique_malformed = []
    for m in malformed:
        key = (m["stable_id"], m["defect"])
        if key not in seen:
            seen.add(key)
            unique_malformed.append(m)

    seen_adv = set()
    unique_advisory = []
    for a in advisory:
        if a["stable_id"] not in seen_adv:
            seen_adv.add(a["stable_id"])
            unique_advisory.append(a)

    identity_debt = sorted({m["stable_id"] for m in unique_malformed}) + \
                    sorted(f"MISSING_ID:{f}" for f in files_without_id)

    return {
        "stable_id": "SELF-EVID-01K3MSTABLEIDREPORT6210000",
        "entity_type": "validation_report",
        "tool": "SELF-TOOL-01K3MSTABLEIDVALIDATOR0000",
        "mode": "READ_ONLY",
        "repository_root": str(root),
        "roots_scanned": list(DURABLE_ROOTS),
        "summary": {
            "distinct_ids": len(occurrences),
            "distinct_declared_ids": len(declarations),
            "files_scanned": sum(1 for _ in durable_files(root)),
            "malformed": len(unique_malformed),
            "duplicate_declarations": len(duplicates),
            "dangling_references": len(dangling),
            "durable_files_without_any_id": len(files_without_id),
            "identity_debt_count": len(identity_debt),
            "advisory_non_crockford": len(unique_advisory),
        },
        "malformed": unique_malformed,
        "duplicate_declarations": duplicates,
        "dangling_references": dangling,
        "durable_files_without_any_id": files_without_id,
        "identity_debt": identity_debt,
        "advisory": unique_advisory,
        "standing": {
            "evidence_tier": "Verified",
            "scope": "Syntax, uniqueness, and presence only.",
            "explicit_non_claims": [
                "This tool does NOT establish that any ID identifies a real entity.",
                "This tool does NOT establish that a record's content is true.",
                "An ID proves identity continuity, not operational truth (Delta-619 law 7).",
                "Repair is not implemented and requires separate human authorization.",
                "A dangling reference may be a legitimate pointer to an entity in another repository.",
                "Malformed IDs inside illustrative example blocks are reported the same as live ones; the tool cannot tell them apart.",
            ],
        },
    }


def main() -> int:
    root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    report = scan(root)
    print(json.dumps(report, indent=2))
    # Exit 0 always: reporting IDENTITY_DEBT is the tool's job, not a failure.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
