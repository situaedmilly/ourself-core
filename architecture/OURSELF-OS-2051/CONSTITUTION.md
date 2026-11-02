# OURSELF OS — Constitutional Contract
**Document:** OURSELF-OS-CONSTITUTION-v0.1  
**Status:** PROPOSED — REVIEW REQUIRED

## 1. Purpose

This document defines invariants that every OURSELF OS deployment mode must preserve. It governs architecture and implementation review; it is not itself a technical enforcement mechanism.

## 2. Authority hierarchy

1. **Owner / root authority:** establishes legitimate ownership and governance.
2. **Constitution:** defines non-bypassable policy, delegation, jurisdiction, revocation.
3. **Independent authority evaluator:** evaluates protected requests against the constitution.
4. **Execution runtime:** performs only the operation admitted by a valid capability.
5. **Independent witness:** records execution and verifies externally observable postconditions.
6. **Recovery authority:** isolates, revokes, and restores without depending on the potentially compromised workload.

No single agent, model, application, runtime, or witness may unilaterally control authority, execution, and proof.

## 3. Core distinctions

- Identity ≠ identifier ≠ addressability ≠ authentication ≠ authorization.
- Existence ≠ registration ≠ admission.
- Device ≠ node ≠ process ≠ session ≠ endpoint.
- Observation ≠ authority.
- Declaration ≠ verification.
- Proposal ≠ admission.
- Admission ≠ execution.
- Execution receipt ≠ independently witnessed external effect.
- Model output ≠ policy.
- Memory ≠ ownership.
- Connectivity ≠ trust.
- Availability ≠ integrity.

## 4. Constitutional invariants

### C-01 — No self-authorization
A requester cannot grant itself the authority required to execute its request.

### C-02 — Explicit principal and target
Every protected operation identifies its requesting principal, target node, resource, and requested capability.

### C-03 — Scoped capabilities
Authorization is limited by operation, resource, context, time, and permitted effect. Broad ambient authority is prohibited by default.

### C-04 — Revocability
Capabilities and delegations have explicit expiry and revocation semantics. Revocation must be checked at the enforcement point.

### C-05 — Independent enforcement
The authority evaluator is separated from untrusted model output and from the workload requesting execution. Where technical independence is unavailable, the limitation is declared.

### C-06 — Fail-safe protected operations
If authorization, integrity, or required evidence cannot be established, protected operations are denied or quarantined. Availability-oriented read-only functions may degrade separately when policy permits.

### C-07 — Provenance preservation
Foreign or untrusted input retains provenance and cannot become authority-bearing through parsing, summarization, memory, or model inference.

### C-08 — Independent witness
The executor cannot authoritatively certify its own external effect. Effect claims require an independent observation source appropriate to the operation.

### C-09 — Recovery independence
Recovery credentials, snapshots, and restoration procedures are not controlled solely by the workload being recovered.

### C-10 — Controlled mutation
Changes to constitution, trust roots, authorization policy, key material, and recovery controls require a higher-order authorization path and auditable review.

### C-11 — Platform honesty
Each deployment declares which guarantees are enforced by OURSELF, the host OS, hardware, a remote service, or operational procedure.

### C-12 — No silent capability promotion
A successful test, observation, receipt, or connection cannot automatically grant production privileges or certification.

## 5. Protected request envelope

Every protected request must identify or resolve to:

- request_id
- requester_principal_id
- target_node_id
- capability_id
- operation
- resource_scope
- policy_version
- issued_at and expires_at
- nonce or replay guard
- preconditions and requested postconditions
- evidence requirements

The authority decision is separately recorded with disposition, reason code, evaluator identity, policy version, and decision timestamp.

## 6. Execution lifecycle

DECLARE → RECEIVE → VALIDATE → ROUTE → AUTHORIZE → EXECUTE → WITNESS → RECORD → STOP

Every transition has a defined rejection and timeout disposition. Operations with external effects must define idempotency or replay protection.

## 7. Evidence lifecycle

DECLARED → LOCATED → OBSERVED → VERIFIED → ADMITTED → EXECUTED → EFFECT_WITNESSED

- **DECLARED:** an assertion or intended state exists.
- **LOCATED:** the referenced artifact, device, or service was resolved.
- **OBSERVED:** a source returned a state observation.
- **VERIFIED:** the observation passed applicable integrity and correctness checks.
- **ADMITTED:** the subject was accepted into a specified trust or execution domain.
- **EXECUTED:** an authorized operation was carried out.
- **EFFECT_WITNESSED:** an independent source established the relevant postcondition.

These are typed states, not interchangeable labels.

## 8. Receipt minimum

A receipt should bind schema/version, request and operation identifiers, principal and target identities, capability and policy references, timestamps and expiry, precondition and postcondition results, executor identity, witness identity and observation method, artifact hashes or immutable references, final disposition, and limitations.

A cryptographic signature proves control of a signing key over particular bytes; it does not by itself prove that the described event occurred.

## 9. Dispute and recovery

Conflicting observations remain conflicting until reconciled. Preserve source provenance, timestamps, uncertainty, and disposition rationale. Recovery revokes affected capabilities, isolates compromised workloads, restores from a verified checkpoint, and produces a recovery receipt.

## 10. Constitutional change

This document is proposed doctrine. Changes to these invariants require explicit versioning, review of affected implementations, and conformance-test updates. Implementations pin the constitution version they enforce.
