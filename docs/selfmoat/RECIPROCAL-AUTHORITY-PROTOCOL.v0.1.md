# OURSELF SELFMOAT Reciprocal Authority Protocol v0.1

Status: DRAFT / CONTRACT ONLY  
Owner: OSOS  
Scope: Registry ↔ independently witnessed SELFMOAT estate  
Execution effect: NONE. This document defines admission and verification requirements; it does not grant device, host, network, or foreign-system authority.

## 1. Constitutional invariant

The Operational Registry and the Witnessed Estate are reciprocal but non-equivalent authorities.

- The Registry is authoritative for declared identity, intended capability, declared authority boundary, dependency claims, and required conformance criteria.
- The Witnessed Estate is authoritative only for observations made by its independently controlled witness process, including evidence provenance, verification method, observed result, and continuity.
- Neither plane may write or self-certify the other's authoritative record.
- The witness may report non-conformance; it may not silently rewrite registry declarations.
- The registry may request verification; it may not manufacture a witness observation.
- A receipt proves that a receipt was issued. An external effect requires separate effect observation.

## 2. Symmetrical authority model

| Operation | Registry authority | Witness estate authority |
|---|---|---|
| Declare reality identity | AUTHOR | READ / CHALLENGE |
| Declare capability and policy | AUTHOR | READ / TEST AGAINST |
| Submit verification request | AUTHOR | ACCEPT / REJECT |
| Observe runtime | NO | AUTHOR |
| Record evidence provenance | NO | AUTHOR |
| Evaluate conformance | DECLARED CRITERIA ONLY | INDEPENDENT EVALUATION |
| Change registry status | PROPOSE ONLY | ATTEST / CHALLENGE; registry custodian applies governed transition |
| Revoke witness trust | NO unilateral power | NO unilateral power |
| Admit execution endpoint | GOVERNED AUTHORITY GATE ONLY | WITNESS EVIDENCE INPUT |
| Assert external effect | NO | ONLY WITH OBSERVATION PROOF |

Symmetry means reciprocal constraints and challenge rights, not identical permissions. The two planes have deliberately different functions.

## 3. Required identities and separation

Every verification cycle MUST identify:

- registry_id and immutable registry_revision (commit SHA or content digest);
- reality_id and reality_revision;
- witness_id and witness_key_id;
- verifier software identity and version;
- target endpoint identity and attestation state;
- request_id and nonce;
- issued_at, observed_at, verified_at;
- evidence digest and evidence location;
- verification procedure and exact command/test identifier;
- result, limitations, and unresolved gaps.

The witness signing key MUST NOT be controlled by the registry writer or by the runtime being evaluated. If separate custody cannot be demonstrated, classify the result as SELF-ATTESTED, never INDEPENDENTLY_VERIFIED.

## 4. Verification state machine

`REQUESTED → ACCEPTED → OBSERVED → EVALUATED → ATTESTED`

Terminal or exceptional outcomes:

- `REJECTED`: request invalid, unauthorized, stale, or outside witness scope.
- `INCONCLUSIVE`: evidence insufficient or contradictory.
- `NONCONFORMANT`: observed behavior violates declared criteria.
- `EXPIRED`: nonce, time window, or evidence freshness invalidated.
- `REVOKED`: prior attestation withdrawn with reason and successor record.

No state may be skipped. Revisions append new records; they never overwrite historical observations.

## 5. Reciprocal challenge

Each side MUST be able to challenge the other's current assertion.

Registry challenge to witness:
- unknown or unauthorized witness identity;
- invalid signature or key status;
- evidence digest mismatch;
- expired or replayed nonce;
- missing procedure, verifier version, or observation context.

Witness challenge to registry:
- missing or duplicate reality identity;
- undeclared dependency or authority boundary;
- capability without a reproducible acceptance criterion;
- stale registry revision;
- declared state inconsistent with accumulated observations.

Challenges are append-only and must carry the challenged record digest, challenge reason, challenger identity, timestamp, and resolution link.

## 6. Admission and effect separation

The witness plane is evidence input, not an execution authority. A witnessed PASS does not itself authorize actuation.

Execution requires a distinct admission decision bound to:
- exact action_id;
- exact reality_id and endpoint identity;
- subject identity;
- capability and scope;
- jurisdiction;
- policy revision;
- expiry and replay protection.

The runtime MUST reject absent, mismatched, expired, or revoked admission. No authority, no effect.

## 7. Freshness and revocation

Every attestation has a validity interval and a revocation check. Material changes to runtime version, host identity, trust root, policy, dependency, or capability invalidate affected attestations unless the verification policy explicitly permits continuity.

A new attestation supersedes but does not erase an old one. Revocation records preserve the reason, authority, timestamp, and affected evidence digests.

## 8. Minimum acceptance criteria for INDEPENDENTLY_VERIFIED

All conditions are mandatory:

1. Registry revision is immutable and digest-verified.
2. Witness identity is independently controlled and its key custody is evidenced.
3. Challenge nonce is unique, time-bound, and replay-resistant.
4. Target endpoint identity is bound to the observation.
5. Verification procedure is reproducible and versioned.
6. Raw evidence is preserved and digest-verified.
7. Evaluator is distinct from the registry author and target runtime operator.
8. Result is signed by the witness identity.
9. External effect claims have independent effect evidence, not merely an execution receipt.
10. Revocation and continuity checks pass.

If any criterion is missing, maximum classification is `RUNTIME_VERIFIED` or `SELF_ATTESTED`, as applicable.

## 9. Prohibited equivalences

- repository exists ≠ runtime exists;
- process responds ≠ capability is authorized;
- endpoint reachable ≠ endpoint admitted;
- test passes ≠ external effect occurred;
- receipt exists ≠ effect succeeded;
- same-account second repository ≠ independent witness;
- model output ≠ authority;
- registry status ≠ witness attestation.

## 10. Implementation boundary

This v0.1 protocol is a normative draft. It does not implement cryptographic signing, key custody, challenge transport, witness isolation, runtime probing, revocation distribution, or an admission gate. Those components require separate source implementation, threat-model review, tests, and deployment evidence.
