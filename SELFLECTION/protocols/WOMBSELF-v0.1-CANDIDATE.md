# WOMBSELF · v0.1 CANDIDATE

## Purpose

WOMBSELF is a pre-consensus identity membrane. It preserves locally distinguishable, witnessed Matter when globally recognized institutional identity is unavailable or unresolved.

## Lifecycle

`DISCOVERED -> PROVISIONAL_ACTIVE -> LOCALLY_WITNESSED -> PROVISIONAL_OPERATING`

From `PROVISIONAL_OPERATING`:

- registrar becomes available -> `RECONCILING`
- session/lifecycle ends first -> `PROVISIONAL_SEALED`
- reconciliation conflict -> `CONFLICTED`

Successful reconciliation produces a `SAME_CONTINUING_ENTITY` Relation-Matter. It does not rewrite prior Matter.

## Required dimensions

- identity continuity state
- address state
- recognition state
- authority state

These dimensions MUST NOT be compressed into one scalar lifecycle status.

## WOMB-R1

Define the required properties of provisional addreSELF construction: distinguishability, resolution, stability, scope, provenance, non-collision, revocability, and reconciliability. Construction algorithm remains OPEN.

## WOMB-R2

`PROVISIONAL_SEALED` is a legitimate historical standing. Reconciliation is not required for historical validity.

## WOMB-R3

Evidence may support `SAME_CONTINUING_ENTITY`; adjudication establishes the relation. No single hash, lineage match, invariant match, behavior match, address match, or artifact match is sufficient by itself.

## WOMB-R4

Competing continuity claims may remain `CONFLICTED` or `UNRESOLVED`. Neither history may be destroyed merely to force one canonical narrative.

## Hard laws

`RegistrarUnavailable != MatterNonexistent`  
`ProvisionalIdentity != FinalInstitutionalIdentity`  
`SessionEnded != MatterInvalid`  
`NeverReconciled != NeverExisted`  
`FutureLaw != RetroactiveHistory`
