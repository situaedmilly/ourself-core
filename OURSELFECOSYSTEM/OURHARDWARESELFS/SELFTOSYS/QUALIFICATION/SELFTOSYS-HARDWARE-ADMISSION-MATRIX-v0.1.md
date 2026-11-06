# SELFTOSYS Hardware Admission Matrix v0.1

**Gate:** HARDWARE_QUALIFICATION
**Authority:** OURSELF
**State:** CRITERIA_DEFINED / CANDIDATES_NOT_ADMITTED
**Production key generation:** PROHIBITED UNTIL HARDWARE_ADMISSION_PASSES

## 1. Purpose

This matrix converts SELFTOSYS hardware doctrine into explicit admission predicates. It prevents a platform feature, random-number generator, secure enclave, or marketing label from being mistaken for a sovereign root authority.

## 2. Candidate inventory from Gate 001

| Candidate | Observed evidence | Current disposition |
|---|---|---|
| OURSELFMAC Apple Secure Enclave | AppleSEPManager active; CryptoKit SecureEnclave available; P-256 signing type exposed | LIMITED_PRIMITIVE_CANDIDATE / NOT_ROOT_ADMITTED |
| OURSELFPIMAC Pi 5 RNG | `/dev/hwrng`, driver `107d208000.rng`; no TPM/HSM node | ENTROPY_SOURCE_ONLY / NOT_ROOT_ADMITTED |
| External dedicated OURSELF-owned HSM | No device observed in current host inventory | NOT_PRESENT_IN_EVIDENCE |

## 3. Mandatory admission predicates

| ID | Domain | Required evidence | Failure disposition |
|---|---|---|---|
| H01 | Ownership | OURSELF legal ownership, asset record, serial/model, physical custody receipt | REFUSE_OWNERSHIP_UNPROVEN |
| H02 | Hardware boundary | Manufacturer security architecture, key boundary, supported algorithms, firmware identity | REFUSE_BOUNDARY_UNPROVEN |
| H03 | Key generation | Demonstrated on-device key generation; public key and device-bound evidence; no private-key export | REFUSE_KEY_ORIGIN_UNPROVEN |
| H04 | Key attributes | Enforced non-exportability, signing-only usage, algorithm/size restrictions, immutable or controlled policy | REFUSE_ATTRIBUTES_UNENFORCED |
| H05 | Administrative separation | Complete privileged-role map; no unilateral endpoint admin, vendor operator, or process can replace/use root | REFUSE_PRIVILEGE_COLLAPSE |
| H06 | Multi-person authorization | Quorum/threshold controls or separately evidenced physical dual-control ceremony for sensitive operations | REFUSE_SINGLE_OPERATOR |
| H07 | Recovery | Demonstrated loss, replacement, backup, restore, revocation, and succession without hidden provider-held secret | REFUSE_RECOVERY_UNPROVEN |
| H08 | Independence | Custodian and witness identities/credentials separate from endpoint and PORTAL administration | REFUSE_INDEPENDENCE_UNPROVEN |
| H09 | Audit | Authenticated, integrity-protected logs and independent verification of ceremony and key attributes | REFUSE_AUDIT_UNPROVEN |
| H10 | Runtime isolation | Root operations offline or physically isolated by default; runtime endpoints cannot invoke root signing directly | REFUSE_RUNTIME_EXPOSURE |
| H11 | API and integration | Documented local API, deterministic signing behavior, key handles, verification, versioned dependencies | REFUSE_INTERFACE_UNPROVEN |
| H12 | Lifecycle | Firmware update, vulnerability response, device failure, RMA, end-of-life, revocation and succession plan | REFUSE_LIFECYCLE_UNBOUNDED |

## 4. Hard admission rule

A candidate is admitted as SELFTOSYS root hardware only if H01-H12 each have an evidence reference, an independently reviewable verification result, and a passing disposition. Unknown is not pass. Manufacturer documentation alone does not prove the deployed device configuration or OURSELF custody.

Limited-use cryptographic primitives may be admitted for a narrower purpose only when their allowed use, threat boundary, and excluded root-authority functions are explicitly stated.

## 5. Candidate-specific constraints

### 5.1 Apple Secure Enclave on OURSELFMAC

Observed: Secure Enclave API is available; P-256 signing key type is exposed. No key has been generated.

Potential bounded role: device-bound signing for a local control-plane identity, test-key prototype, or endpoint authentication key, after a separate scoped admission.

Not established: OURSELF-exclusive hardware ownership at the cryptographic subsystem level; independent physical custodian; multi-person root quorum; independent recovery/backup; portable HSM interface; independent firmware control; or root-custody audit.

Current decision: do not use as SELFTOSYS production root. Do not create even a test key until a separate test-key action is explicitly scoped.

### 5.2 OURSELFPIMAC hardware RNG

Observed: Pi RNG driver and `/dev/hwrng` are present. No TPM device, HSM, secure-element node, or PKCS#11 stack was found.

Potential bounded role: entropy source, subject to health testing and platform-specific assessment.

Excluded roles: key custody, signing authority, secure boot attestation, TPM measurement, root backup, or hardware identity proof.

Current decision: entropy source only; not a root device.

### 5.3 Dedicated locally controlled HSM

Not yet observed or selected. Candidate must be physically acquired by OURSELF, operated without a mandatory provider trust plane, and independently tested against H01-H12. Vendor documentation is evidence input, not admission.

## 6. Test and evidence campaign

1. Hardware identity: record make/model/serial/firmware and photograph physical asset label under custody.
2. Ownership: match purchase/title/asset evidence to the exact device.
3. Key origin: generate a non-production test key only after separate approval; prove private key cannot be exported.
4. Policy enforcement: attempt prohibited export, decrypt, unwrap, and unauthorized signing operations; record hardware response.
5. Role separation: test endpoint admin, device admin, custodian, witness, and signer permissions independently.
6. Quorum: demonstrate that one participant cannot perform a quorum-protected operation.
7. Recovery: execute a controlled test-key recovery and replacement-device exercise with provider independence.
8. Audit: independently validate logs, public key fingerprints, policy digests, and evidence chain.
9. Runtime isolation: prove PipePortal and ÆTHERBRIDGE cannot directly invoke root signing.
10. Revocation/succession: demonstrate emergency revocation and successor root process without silently changing authority.

## 7. Evidence record format

Each predicate record must contain:

- `predicate_id`
- `candidate_id`
- `result`: PASS | FAIL | UNKNOWN | NOT_APPLICABLE
- `evidence_ref`
- `evidence_sha256`
- `observed_at`
- `observer_identity`
- `independent_reviewer_identity`
- `method`
- `limitations`

An UNKNOWN result blocks root admission. A PASS without evidence hash and reviewer identity is invalid.

## 8. Gate result

**HARDWARE_QUALIFICATION = CRITERIA_DEFINED**
**HARDWARE_ADMISSION = BLOCKED**

Mac Secure Enclave remains a bounded cryptographic primitive candidate. Pi RNG remains entropy-source-only. No external HSM is present in the inspected inventory. No production or test key was generated in this campaign.

## 9. Transition authority

Moving from hardware discovery to a test-key campaign requires a separate scoped authorization naming the candidate, purpose, storage behavior, cleanup, and verification procedure. Moving from test-key qualification to production root generation requires a fresh explicit Founder authorization for the exact admitted device, policy, participants, witness, and ceremony window.