# SELFLECTION · v0.1 CANDIDATE

SELFLECTION is a governed selection membrane over candidate Matter. It compares candidate relations/transitions against current context, evidence, standing, constraints, and authority prerequisites, then emits a `SelectionDecision`.

SELFLECTION does not execute effects and does not create authority.

## Inputs

- candidate Matter refs
- current standing refs
- evidence / witness refs
- constraint refs
- authority prerequisite refs
- conflict refs

## Outputs

`SelectionDecision` in one of:

- `SELECTED_FOR_AUTHORITY_REVIEW`
- `HELD_FOR_EVIDENCE`
- `BLOCKED_BY_CONSTRAINT`
- `CONFLICT_REQUIRES_HIGHERSHIFT`
- `NOT_EVALUABLE`

## Hard laws

`SelectionDecision != AuthorityDecision`  
`SelectionDecision != Execution`  
`MostRecentCandidate != HighestStandingCandidate`  
`MostFrequentClaim != CanonicalClaim`  
`Selected != Authorized`  
`Selected != Executed`

## SELFECTION boundary

Only an independently authorized transition may cross into SELFECTION. SELFLECTION may nominate; it may not manifest.
