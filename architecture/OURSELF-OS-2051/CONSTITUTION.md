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

## 11. Owner identity, enrollment, and key custody

Owner authority is a cryptographically and procedurally established principal—not a conclusion inferred from physical possession, a username, device registration, account login, network location, or a model's recognition of a person.

A conforming enrollment procedure must define and preserve:
1. A stable owner principal identifier distinct from usernames, device IDs, and public-key fingerprints.
2. Generation or import of an owner root key through a documented trusted ceremony. Prefer offline or hardware-protected custody where supported; disclose platform limitations.
3. A proof-of-possession challenge signed by the owner root key and verified against the enrolled public key.
4. A versioned enrollment record binding the principal, public-key fingerprint, enrollment method, verifier, timestamp, policy version, and evidence references.
5. Separate delegated operational keys with explicit scope, expiry, and revocation. Operational services must not receive the owner root private key.
6. A documented key rotation, compromise response, revocation, and recovery procedure.
7. Independent custody or dual-control for recovery material, with the selected recovery threshold and its risks documented.

Private keys, recovery secrets, seed phrases, and raw authorization tokens must never be stored in source repositories, logs, receipts, or ordinary node registries. A public-key fingerprint or credential fingerprint does not prove physical identity by itself; the enrollment process and trust assumptions must be stated.

Until the enrollment and recovery procedures are implemented and verified, OWNERSELF remains NOT_ESTABLISHED.

## 12. Witness independence and evidence custody

Witness independence is a property of a threat model and an implemented trust boundary. It is not established by a module name, separate file, separate process label, hash, signature, or self-authored receipt alone.

A witness independence claim must identify and test:
- **Key separation:** who controls the witness signing key; whether the executor can read, invoke, replace, or rotate it.
- **Execution separation:** distinct process identity and privilege boundary; where practical, a separate host, VM, or independently administered service.
- **Evidence-channel separation:** append-only or externally anchored evidence custody that the executor cannot silently rewrite, suppress, or substitute.
- **Observation independence:** a fresh observation method appropriate to the claimed postcondition, not merely replay of executor output.
- **Time and provenance:** source identity, time basis, target identity, collection method, and integrity verification.
- **Compromise model:** what happens if the executor, host administrator, witness host, signing key, or transport is compromised.

A witness may be cryptographically intact but operationally coupled. Such a result must be reported as COUPLED or INDEPENDENCE_NOT_ESTABLISHED, not independently witnessed. Even an independent witness establishes only the postconditions within its observation scope and proof contract.

## 13. Parent authority and implementation jurisdiction

OSOS is the parent architecture and constitutional authority. OURSELF ECOSYSTEM, OURSELFDAEMON, OURPROCESSORSELF, MODELSELF, OURSELFMCP, host operating systems, and individual services are subordinate governed systems or implementation candidates. Their names, repository locations, or historical declarations do not independently grant them OSOS jurisdiction.

A host operating system remains the actual kernel authority in a hosted deployment. An OSOS-governed Linux node is not a Native OURSELF OS installation. Native status requires a separately verified boot chain, kernel, hardware adapter, and native conformance result.
