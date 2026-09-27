# OURSELF SELFGRAPH REALISELF INSTANCE THRESHOLD — 2051

## Constitutional purpose

This artifact defines the exact instance threshold for a **SELFGRAPH realization claim**.

It does **not** claim that the 17 graph jurisdictions are running databases. It establishes a proof-preserving transition rule for when their graph-instance records have been sufficiently witnessed to call the materialized SELFGRAPH set **REALIZED**.

## Threshold

Current constitutional set:

**17 declared graph jurisdictions**

Therefore:

`REQUIRED_WITNESSED_INSTANCES = 17`

The realization predicate is:

`REALIZED ⇔ witnessed_instance_count = 17`

with all 17 expected instance identifiers present exactly once.

## Fail-closed behavior

Any of the following keeps the result `NOT_REALIZED`:

- zero or partial witnesses
- missing instance witness
- duplicate instance identifier
- witness for an unknown instance
- missing witness reference
- missing observation timestamp
- missing evidence reference

The evaluator must never infer the missing witness.

## What REALIZED means

`REALIZED` means:

> The declared 17 SELFGRAPH jurisdictions have corresponding materialized instance records and each instance has an explicit witness satisfying the witness contract.

It does **not** mean:

`REALIZED ≠ RUNNING`

`REALIZED ≠ ADMITTED`

`REALIZED ≠ ACTUATED`

`REALIZED ≠ EFFECTED`

`REALIZED ≠ CUSTODIED`

`REALIZED ≠ PERMANENT`

The lifecycle distinctions remain constitutional.

## Evidence chain

`DECLARED → REGISTERED → PERSISTED → INITIALIZED → WITNESSED → REALIZED`

Only the transitions actually observed may be recorded.

## Cross-graph SELFMOAT

No jurisdiction may silently answer a question belonging to another jurisdiction.

A foreign-jurisdiction claim requires a typed cross-graph relation with provenance and witness.

Thus:

`EDGE_EXISTS ≠ EDGE_AUTHORIZED ≠ EDGE_ADMITTED ≠ EDGE_ACTUATED ≠ EDGE_EFFECTED`

## 2051 execution doctrine

The repository artifact is itself evidence of repository state only.

A repository write does not establish runtime realization.

Runtime realization must be witnessed by a separate execution observation.

## Next proof

Materialize or inspect the 17 instance records.

Then produce one witness record per instance.

Then run the threshold evaluator.

Expected fail-closed progression:

`0/17 → NOT_REALIZED`

`1/17 → NOT_REALIZED`

`16/17 → NOT_REALIZED`

`17/17 → REALIZED`

The threshold is therefore a **proof boundary**, not a declaration.
