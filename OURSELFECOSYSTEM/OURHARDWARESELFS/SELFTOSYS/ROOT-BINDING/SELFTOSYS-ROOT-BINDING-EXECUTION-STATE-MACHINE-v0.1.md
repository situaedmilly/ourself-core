# SELFTOSYS Root Binding Execution State Machine v0.1

**Reality:** SELFTOSYS  
**Authority principal:** OURSELF  
**Status:** ENGINEERED / NOT ADMITTED / NOT CONNECTED  
**Control mode:** Fail-closed  
**Date:** 2026-11-06

## 1. Purpose

This contract turns the root-binding gate into an explicit transition system. It prevents a discovery result, founder instruction, transport channel, software key, or successful local test from being promoted into root authority.

The state machine governs four binding dimensions:

1. Root hardware identity and protected key boundary
2. Independent physical custody and administrative separation
3. Authenticated transport to the root-side intake
4. Live nonce-bound challenge/response, independently verified

No transition creates or manufactures missing evidence. Transitions consume evidence references produced by the relevant physical, administrative, cryptographic, and network actors.

## 2. Current authoritative state

```yaml
reality: SELFTOSYS
binding_state: UNBOUND
root_hardware: UNRESOLVED
independent_custody: UNRESOLVED
authenticated_transport: UNRESOLVED
live_connection: UNRESOLVED
production_root_key: NOT_GENERATED
root_endpoint: NOT_ESTABLISHED
admission: BLOCKED
```

The Mac Secure Enclave is a hardware-backed cryptographic primitive candidate, not an admitted OURSELF root. The Pi hardware RNG is an entropy source, not a TPM/HSM or root-key custody boundary. The existing Cloudflare tunnels and SSH host-key pin do not constitute a root endpoint or authenticated root transport.

## 3. State model

Allowed states:

- `UNBOUND`: no candidate root binding admitted.
- `EVIDENCE_INTAKE`: evidence references are being assembled; no qualification implied.
- `QUALIFICATION`: all required evidence is present and under independent review.
- `ADMITTED`: all admission predicates have passed and the live root challenge has been independently verified.
- `REJECTED`: evidence or controls fail a required predicate. Re-entry requires a new, explicitly versioned intake.

Allowed transitions:

| From | Event | To | Mandatory guard |
|---|---|---|---|
| UNBOUND | OPEN_INTAKE | EVIDENCE_INTAKE | Candidate hardware identity supplied; no admission effect |
| EVIDENCE_INTAKE | SUBMIT_FOR_QUALIFICATION | QUALIFICATION | H01-H12 evidence references present; role and custody evidence present |
| EVIDENCE_INTAKE | REJECT_EVIDENCE | REJECTED | Reviewer records failed predicate and evidence |
| QUALIFICATION | ADMIT_BINDING | ADMITTED | All H01-H12 PASS; independent review complete; custody/quorum/recovery pass; mTLS peer identity verified; nonce challenge passes |
| QUALIFICATION | REJECT_EVIDENCE | REJECTED | Reviewer records failed predicate and evidence |
| REJECTED | OPEN_NEW_INTAKE | EVIDENCE_INTAKE | New intake identifier; prior record retained and immutable |

There is no direct transition from UNBOUND, EVIDENCE_INTAKE, or REJECTED to ADMITTED. There is no transition that treats founder authorization as a substitute for physical custody, independent review, or cryptographic proof.

## 4. Admission predicates

All predicates are mandatory. UNKNOWN, missing, stale, self-attested without corroboration, or unreviewed evidence evaluates to BLOCK.

| ID | Predicate | Minimum evidence |
|---|---|---|
| H01 | Ownership | Legal/organizational ownership and asset identity |
| H02 | Hardware boundary | Exact make/model/serial, physical inspection, protected boundary description |
| H03 | Key generation | Ceremony record showing generation inside the admitted boundary |
| H04 | Key attributes | Non-exportability, permitted algorithms, usage constraints, key identifier |
| H05 | Administrative separation | Distinct administrators for root hardware, network endpoint, and relying systems |
| H06 | Multi-person authorization | Enforced quorum with distinct authenticated principals |
| H07 | Recovery | Independently controlled recovery procedure and tested recovery evidence |
| H08 | Independence | Evidence that no single person, host, provider, or credential can unilaterally control root authority |
| H09 | Audit | Tamper-evident, independently reviewable event records |
| H10 | Runtime isolation | Root signing boundary isolated from requester and general-purpose workloads |
| H11 | API and integration | Root-side endpoint, exact request/response contracts, peer identity and policy enforcement |
| H12 | Lifecycle | Provisioning, rotation, revocation, destruction, and incident procedures |

Each predicate record must include: `predicateId`, `status`, `evidenceRefs[]`, `method`, `observedAt`, `observerId`, `independentReviewerId`, `limitations[]`, and `contentDigest`.

## 5. Role separation

The following roles must resolve to distinct, independently authenticated principals:

- Custodian A
- Custodian B
- Approver A
- Approver B
- Independent witness
- Root hardware administrator
- Root endpoint/network administrator
- PORTAL signer

A person may not satisfy two roles whose separation is required by the qualification policy. Founder authority authorizes the ceremony and policy intent; it does not silently assume custodian, witness, reviewer, or endpoint-administrator roles.

## 6. Transport and live-connection proof

Transport admission requires:

- Exact root endpoint and protocol
- Root-side identity certificate chained to an admitted OURSELF trust anchor
- Client identity and certificate validation
- Mutual TLS or an equivalently strong mutually authenticated protocol
- Explicit audience, purpose, and operation binding
- Revocation and expiry handling
- A recorded handshake transcript or verifiable transport evidence

Live connection admission requires a fresh challenge:

1. Verifier creates a cryptographically random nonce with an expiry and unique challenge ID.
2. Challenge binds the intended root identity, verifier identity, protocol version, audience, and requested proof operation.
3. Root-side protected boundary signs the canonical challenge digest.
4. Verifier validates the signature against the admitted root public key and checks nonce freshness, expiry, identity binding, and single-use status.
5. An independent reviewer verifies the receipt and evidence chain.

A successful TCP connection, TLS handshake without an admitted root trust anchor, SSH host-key match, HTTP 200, tunnel health status, or unsigned response is not a live root proof.

## 7. Runtime admission algorithm

```text
admit(binding):
  require binding.state == QUALIFICATION
  require exactHardwareIdentity(binding)
  require protectedBoundaryEvidence(binding)
  require allPredicates(H01..H12) == PASS
  require independentReviewComplete(binding)
  require distinctCustodiansApproversWitness(binding)
  require quorumEnforced(binding)
  require recoveryIndependentlyControlled(binding)
  require rootEndpointEstablished(binding)
  require mutualAuthenticationVerified(binding)
  require freshNonceChallengeVerified(binding)
  require receiptDigestAndEvidenceChainVerified(binding)
  return ADMITTED

otherwise:
  return BLOCKED with exact failed or unresolved predicates
```

The algorithm is a policy contract, not a claim that a runtime adapter currently exists. It must not return ADMITTED when any guard is unknown.

## 8. Prohibited transitions and side effects

This state machine does not authorize:

- Generating a production root key
- Generating a test key under the production identity
- Signing certificates, CSRs, challenges, or receipts
- Creating or enabling a root endpoint
- Changing Cloudflare DNS, tunnel ingress, Access policy, firewall, or router configuration
- Treating a Mac Secure Enclave key, Pi RNG, provider-issued identity, self-signed certificate, or SSH host key as OURSELF root
- Enabling PipePortal or ÆTHERBRIDGE production trust consumers

Those actions require their own scoped authorization and, where relevant, a physically attended custody ceremony.

## 9. Operational sequencing

1. Bind exact physical hardware identity and ownership evidence.
2. Establish two-person physical custody, independent witness, and distinct administrative roles.
3. Qualify the protected key boundary and lifecycle controls.
4. Establish root-side intake under the admitted boundary.
5. Establish mutually authenticated transport using the admitted root trust anchor.
6. Run a fresh nonce-bound challenge and independent verification.
7. Submit H01-H12 and all receipts to the admission verifier.
8. Only after ADMITTED, issue a separate activation authorization for each relying system.

No step may be inferred from completion of a prior step.

## 10. Current disposition

The current environment remains **UNBOUND / BLOCKED**. This artifact makes the admission path deterministic and auditable; it does not claim that hardware, custodians, endpoint, credentials, transport, or live root connection have appeared. The next state-changing event must be evidence-backed physical root-hardware intake, followed by independent custody qualification.
