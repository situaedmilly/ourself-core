# OURSELF Signal Boot

Before repository inspection or mutation:

1. Scan the incoming WORKFLOWEXECUTIONSPEECH for exact `*_SIGNAL` markers.
2. Resolve by this priority: `STOP_SIGNAL`, `AUTHORITY_SIGNAL`, `OPERATING_SIGNAL`, `OBJECTIVE_SIGNAL`, `INSPECTION_SIGNAL`, `MUTATION_SIGNAL`, `VERIFICATION_SIGNAL`, `SEAL_SIGNAL`, `FOUNDATION_SIGNAL`.
3. Announce `CONTROLLING_SIGNAL: <name>` before reading project files.
4. Enforce all lower-priority signals as constraints.
5. No known marker: return `UNCLASSIFIED_SIGNAL` and stop before inspection.
6. Unknown marker: return `UNKNOWN_SIGNAL` and fail closed.
7. `STOP_SIGNAL` overrides all signals.
8. `SEAL_SIGNAL` never grants mutation authority.
9. `FOUNDATION_SIGNAL` never grants mutation authority.

Use `OPERATING_SIGNAL` for session posture, context budgets, archaeology limits, or execution-mode shifts.
Canonical contract: `situaedmilly/self-protocol-suite/specifications/WORKFLOW-EXECUTION-SIGNAL-HIERARCHY-v1.md`.
