# Tunnel 2 — OURSELF Agent Runtime v0.1

## Closed execution relation

OURSELF -> MODEL -> AGENT -> OURSELF -> HARNESS -> AUTOMATION -> OURSELF

Model output is a proposal source, never constitutional authority.

## Transition boundary

CURRENT_STATE + PROPOSED_TRANSITION
-> GOVERNANCE_DETERMINATION
-> ADMITTED / DENIED
-> BOUNDED ACTUATION
-> OBSERVATION
-> RECEIPT
-> RECONTACT

## Invariants

PROPOSED_TRANSITION != EXECUTED_TRANSITION
AUTHORIZED_TRANSITION != SUCCESSFUL_TRANSITION
SUCCESSFUL_TRANSITION != OBSERVED_EFFECT
EVENT != AUTHORITY
RECEIPT != AUTHORIZATION

## v0.1 implementation

- tunnel2-transition.mjs defines the explicit transition envelope and privileged mutation classes.
- tunnel2-agent-runtime.mjs compiles structured model output into a transition and requests determination.
- tunnel2-harness.mjs executes only admitted operations inside a bounded temporary workspace.
- tunnel2-agent-runtime.test.mjs proves ordinary state mutation can cross the membrane while authority and governance mutation are denied without explicit authority.
- GitHub Actions provides automation and verification only; it is not constitutional authority.

## Deliberate non-goals

No unrestricted shell.
No self-hosted runner dependency.
No automatic authority mutation.
No governance self-authorization.
No model-controlled admission.
No event-history rewriting.

Next gate: connect the bounded receipt to the universal event ledger without allowing the ledger to mint authority.
