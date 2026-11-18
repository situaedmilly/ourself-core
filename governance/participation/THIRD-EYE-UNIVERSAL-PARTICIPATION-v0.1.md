# OURSELF Third Eye — Universal Participation Contract v0.1

Status: CANONICAL CONTRACT PROPOSED; DOMAIN ADAPTERS NOT YET INSTALLED
Authority: Founder-directed implementation work; this document does not grant runtime authority.
Canonical sequence: OBSERVE → INTERPRET → DESIGN → ACT → WITNESS

## Purpose

Provide one substrate-neutral participation contract for every OURSELF reality and execution environment. Each domain implements a local adapter, but no adapter may redefine the contract, elevate model output into authority, or infer consent.

## Participation record

Every consequential operation MUST be representable by a record containing:

- contract_version and unique cycle_id
- domain and target_system
- observation plus evidence items classified as DECLARED, OBSERVED, VERIFIED, INFERRED, or UNKNOWN
- interpretation, assumptions, alternatives, and confidence kept distinct from observation
- desired_outcome, selected_option, and constraints
- proposed_action and exact scope
- authority source, principal identity, grant time, expiry, nonce, and revocation reference
- expected postconditions and domain-specific witness predicates

Missing, malformed, expired, replayed, revoked, or scope-mismatched participation records MUST fail closed for consequential actions.

## Authorization rule

Authorization is valid only when all conditions hold:
1. The authority source is recognized by the target domain.
2. The principal is authenticated and authorized for the target.
3. The exact proposed action matches the authorized action.
4. Every requested scope element is covered by the grant.
5. The grant is current, unrevoked, and bound to this operation (nonce / replay protection).
6. The target's own admission policy independently accepts the request.

A boolean supplied by a caller, model, agent, or request body is not sufficient proof of authority. A participation record is not itself a cryptographic credential unless the target verifies its signature and trust chain.

## Execution and witness

- DESIGN and ACT are separate transitions.
- Admission is not actuation.
- An adapter MUST NOT execute merely because a proposal exists or a model recommends it.
- The target domain executes only after its own admission gate passes.
- WITNESS records actual observations and effects separately.
- A receipt is not proof of an effect; domain-specific postconditions must be evaluated independently.
- Failed, partial, and indeterminate effects remain explicit; never normalize them to success.

## Universal invariants

- OBSERVATION_IS_NOT_INTERPRETATION
- INTERPRETATION_IS_NOT_FACT
- MODEL_OUTPUT_IS_NOT_AUTHORITY
- PROPOSAL_IS_NOT_AUTHORIZATION
- AUTHORIZATION_IS_BOUNDED_BY_ACTION_AND_SCOPE
- AUTHENTICATION_IS_NOT_AUTHORIZATION
- ADMISSION_IS_NOT_ACTUATION
- RECEIPT_IS_NOT_EFFECT
- UNKNOWN_AND_INFERRED_REMAIN_DISTINCT_FROM_VERIFIED
- HUMAN_AUTONOMY_AND_CONSENT_ARE_FIRST_CLASS_CONSTRAINTS
- NO_AUTHORITY_NO_EFFECT

## Adapter obligations

Each adapter MUST expose: inspect(input), map(input), admit(participation, action, scope), execute(admission), and witness(execution). It MUST preserve source identifiers and evidence classifications, return machine-readable denial reasons, and provide tests for missing authority, action mismatch, scope mismatch, expiry, replay, revocation, failed execution, and false witness claims.

### Current integration inventory (evidence-bounded)

| Domain | Existing surface | Required integration | Status |
|---|---|---|---|
| Cognitive / Third Eye | Cognitive-Transmutation-Core local participation-cycle module | Canonical schema, identity-bound grant verification, lifecycle and domain predicates | Local implementation observed; not yet committed to this repository |
| Processor / actuation | OURPROCESSORSELF causal actuation admission | Replace caller-trusted authorization booleans with verified participation decision; bind exact transition, action, scope, and witness predicates | Existing independent actuator gate observed; Third Eye adapter not installed |
| Agent bridge / SELFCOMM | ourself-agent-bridge-kernel server token gate, proposal/approval and queue boundaries | Bind authenticated principal and human approval to scoped participation record; preserve queue/approval separation | Existing authentication and approval gates observed; Third Eye adapter not installed |
| OSOS | OURSYSTEMSELFOPERATIN repository | Establish actual OS/runtime participation interface only after an inspectable implementation exists | Repository currently exposes README only in inspected default-branch tree; no runtime adapter verified |
| Client/business systems | Domain-specific booking, payment, communication, and data systems | Per-domain consent, policy, authorization, and postcondition adapter | Not inventoried or installed by this contract |

## Rollout gates

1. Contract and schema review.
2. Adapter implementation in each repository on isolated branches.
3. Adapter-specific tests and negative security tests.
4. Cross-adapter conformance suite.
5. Independent witness of target state and effect.
6. Founder-approved activation per domain.

No global enable switch may bypass local trust roots, policy, or consent. A domain remains NOT_ADMITTED until all its gates pass. This contract does not claim universal activation.
