# OURSELF Universal Event Ledger v1

**Stable ID:** `SELF-LEDGER-01K8UNIVERSALEVENT000001`  
**Canonical repository:** `situaedmilly/ourself-core`  
**Canonical path:** `governance/event-ledger/events.ndjson`  
**Persistence authority:** Git commit history for this repository  
**Constitutional authority:** external/declared authority referenced by each event; the ledger MUST NOT mint authority  
**Mode:** append-only event memory

## Purpose

This ledger is the canonical event-lineage surface for durable OURSELF events across realization surfaces.

An event is a witnessed occurrence or governed transition. It is not automatically an authorization.

The ledger unifies:

`PROPOSAL -> DETERMINATION -> ACTUATION -> OBSERVATION -> RECEIPT -> MEMORY`

while preserving the distinctions between those relations.

## Authority boundary

- Ledger persistence proves that a record was committed to the canonical repository.
- `authority_ref` identifies the authority relied upon by an event; it does not create that authority.
- Evidence can corroborate an event but cannot mint authority.
- An event may record a denied proposal; denial is itself a durable event.
- A representation of an event is not the event's realized effect.
- GitHub workflow execution, commit history, issue comments, and artifacts are evidence surfaces, not constitutional authority by themselves.

## Canonical event requirements

Every event record MUST contain:

- `event_id`
- `event_type`
- `event_time`
- `sequence`
- `actor`
- `subject`
- `authority_ref`
- `causation`
- `state`
- `evidence_refs`
- `ledger_commit`
- `status`

Optional fields MAY include `receipt_ref`, `transition_ref`, `realization_ref`, `supersedes`, and `notes`.

## Event classes

- `DECLARED`
- `PROPOSED`
- `DETERMINED`
- `ACTUATED`
- `OBSERVED`
- `RECEIPTED`
- `DENIED`
- `SUPERSEDED`
- `RECONTACTED`
- `SEALED`

## Universal lineage rule

`EVENT != AUTHORITY`

`EVENT_RECORD != REALIZED_EFFECT`

`RECEIPT != AUTHORIZATION`

`EVIDENCE != AUTHORITY`

A later event may reference an earlier event, but reference does not transfer jurisdiction.

## Append rule

Records are never edited in place. A correction is a new event that:

1. references the event being corrected;
2. states the correction relation explicitly;
3. carries its own evidence;
4. is committed as a new Git object.

History rewriting is not the correction mechanism.

## Current genesis event

The first entry establishes the ledger itself as a durable memory surface. It does **not** claim that all historical OURSELF events have been reconstructed.

Historical events remain outside the canonical ledger until independently witnessed and appended.

## Verification boundary

A ledger entry is `VERIFIED` only when its referenced evidence is directly attributable to a primary artifact. A ledger commit proves persistence of the record; it does not by itself prove every external occurrence asserted by that record.

## Rollback

Rollback is performed by a new Git commit that supersedes or reverts the affected state. Existing event records remain historical evidence.
