# Tunnel 3 — Mutation Membrane v0.1

## Constitutional boundary

PROPOSED_MUTATION != EXECUTED_MUTATION
AUTHORIZED_TRANSITION != SUCCESSFUL_TRANSITION
SUCCESSFUL_TRANSITION != OBSERVED_EFFECT

Runtime chain:

CURRENT_STATE -> PROPOSED_TRANSITION -> CLASSIFY -> DETERMINE -> ADMIT/DENY -> ACTUATE -> OBSERVE -> RECEIPT -> NEW STATE

## Mutation classes

- STATE_MUTATION
- CAPABILITY_MUTATION
- AUTHORITY_MUTATION
- IDENTITY_MUTATION
- GOVERNANCE_MUTATION

v0.1 admits ordinary STATE_MUTATION. Capability, authority, identity, and governance mutation require explicit authority.

Governance mutation is rejected when the proposing actor is the authority subject. The governor cannot create the authority that legitimizes its own governance transition.

## Observation rule

Actuation is not evidence of realization. The receipt records determination, actuation, and observed effect as separate fields. state_realized is emitted only after the observation boundary is crossed.

## Scope

This is a bounded local execution membrane. It does not claim host-level authority, root authority, hardware authority, or GitHub Actions authority. The workflow is a realization chamber for the test, not the constitutional source of authority.
