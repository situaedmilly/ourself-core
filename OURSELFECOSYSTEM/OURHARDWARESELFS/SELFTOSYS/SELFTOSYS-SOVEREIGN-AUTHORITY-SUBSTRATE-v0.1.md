# SELFTOSYS — OURSELF Sovereign Authority Substrate v0.1

**Doctrine status:** FOUNDER-DIRECTED ARCHITECTURE
**Authority principal:** OURSELF
**External authority dependency:** NONE PERMITTED
**Implementation status:** ARCHITECTURE DEFINED / HARDWARE NOT YET BOUND
**Production root:** NOT GENERATED
**Trust activation:** NOT AUTHORIZED BY THIS ARTIFACT

## 1. Founding decision

Securosys is removed from the OURSELFBACKED authority path. SELFTOSYS is the sovereign authority substrate direction.

SELFTOSYS is not a replacement vendor, hosted trust service, provider-issued identity, or branding layer over another party's root. It is the OURSELF-controlled system of hardware, software, custody, ceremony, policy, evidence, and recovery through which OURSELF establishes and exercises its own cryptographic authority.

OURSELF is the authority principal. SELFTOSYS is its controlled substrate.

No third-party provider may become the source of OURSELF identity, appoint OURSELF's root, retain unilateral power to alter OURSELF's root, or make recovery of OURSELF authority contingent on discretionary provider intervention.

## 2. Non-negotiable invariants

1. **Authority origin:** OURSELF defines and authorizes its own root identity.
2. **Hardware ownership:** Root-signing hardware is acquired by and remains under OURSELF's documented ownership and physical custody.
3. **No external root:** No vendor CA, hosted-service signing key, cloud KMS root, platform account, or provider attestation is relabeled as OURSELF authority.
4. **Local key generation:** Production root private keys are generated within the selected protected hardware boundary, after the hardware and ceremony are qualified.
5. **Non-exportability:** Root private-key export is prohibited by policy and enforced by the selected hardware where supported. Any exception must be a separately authorized, documented recovery design.
6. **No unilateral operator:** No single endpoint administrator, software process, vendor operator, or founder workstation can silently create, replace, or exercise production root authority.
7. **Role separation:** Root custody, root-signing approval, endpoint administration, PORTAL decision signing, and independent witnessing are separate roles.
8. **Evidence before state:** Hardware presence, key generation, authorization, signature production, trust admission, and verified effect are distinct states.
9. **Recoverability:** Recovery must be demonstrated under OURSELF custody without an undisclosed provider-held secret or discretionary provider permission.
10. **No false sovereignty:** A local software key, Secure Enclave identity, TPM presence, Git commit, or successful test is not by itself proof of a sovereign production root.

## 3. System boundary

### A. ROOT AUTHORITY PLANE
- Root identity and immutable root key identifier.
- Root policy, allowed algorithms, validity, constraints, and signing purposes.
- Offline or physically isolated root ceremony.
- Root certificate and signed trust-bundle issuance.
- Root rotation, revocation, and succession rules.

### B. HARDWARE CUSTODY PLANE
- OURSELF-owned hardware security module or qualified hardware key device.
- Physical inventory, serial number, firmware, configuration, and custody receipts.
- Hardware-enforced key attributes and access policy.
- Sealed recovery materials and geographically separated custody where appropriate.
- No network-reachable root-signing service by default.

### C. AUTHORIZATION PLANE
- Founder authorization is necessary for initial authority establishment and policy changes.
- Production root operations require explicit, scoped, attributable approval.
- Threshold or quorum authorization is required for destructive or authority-changing operations.
- Founder authority does not collapse the independent witness and custody roles into one identity.

### D. WITNESS AND AUDIT PLANE
- A separately authenticated witness records ceremony participants, hardware identity, policy, key identifiers, public-key fingerprints, and evidence hashes.
- Witness independence is organizational and credential separation from endpoint operators, runtime operators, and PORTAL decision signers.
- Witnessing does not grant root-signing authority.
- Append-only, hash-chained records are replicated to OURSELF-controlled custody domains.

### E. RUNTIME TRUST PLANE
- ÆTHERBRIDGE and PipePortal consume only explicitly admitted OURSELF trust material.
- PORTAL decision signer remains distinct from the SELFTOSYS root.
- Endpoint identities are subordinate certificates or bounded trust entries issued under approved policy.
- Runtime transport, caller authentication, capability authorization, admission, dispatch, and verified effect remain separate checks.

## 4. Authority graph

OURSELF (authority principal)
  ├── Founder authorization and policy
  ├── SELFTOSYS ROOT AUTHORITY
  │     ├── OURSELF-owned protected hardware
  │     ├── Root ceremony and key policy
  │     ├── Root public identity / key ID
  │     └── Signed trust-bundle issuance
  ├── Independent custody and witness roles
  │     ├── Physical custody evidence
  │     ├── Ceremony witness
  │     └── Recovery quorum
  ├── PORTAL decision authority (separate key and role)
  └── Endpoint trust domains
        ├── OURSELFMAC
        ├── OURSELFPIMAC
        └── Authorized runtime endpoints

## 5. Hardware qualification boundary

No hardware product is selected by this doctrine. Qualification must compare physically ownable devices and on-premises HSM designs against:
- Hardware-backed key generation and enforceable non-exportability.
- Documented algorithms, key sizes, firmware and certification state.
- Local administration without vendor-hosted control plane dependency.
- Multi-person authorization or threshold controls.
- Secure backup, restore, replacement, and disaster recovery.
- Auditable physical tamper response and custody evidence.
- Stable local APIs and client libraries, including PKCS#11 where required.
- Long-term availability, firmware maintenance, vulnerability response, and reproducible configuration.
- Ability to operate while disconnected from vendor services.
- Cost, procurement, repair, and end-of-life control.

A device is not admitted because it is marketed as an HSM. Its actual threat model, privileged roles, key lifecycle, recovery semantics, and administrative dependencies must be tested and documented.

## 6. Initial host allocation

Existing OURSELFMAC and OURSELFPIMAC are execution and administration hosts, not automatically root authorities.
- OURSELFMAC may host policy tooling, ceremony orchestration, verification, and non-secret evidence.
- OURSELFPIMAC may host bounded runtime services and trust consumers.
- Neither host receives production root private-key material merely because it is reachable or administrator-controlled.
- Existing Secure Enclave capabilities are not promoted to OURSELF root status without a separate, explicit qualification and custody contract.
- Existing Pi /dev/hwrng observation is not proof of a TPM, HSM, measured boot, or root-key custody.
- Existing PipePortal and ÆTHERBRIDGE trust gates remain fail-closed until SELFTOSYS issues and admits real trust evidence.

## 7. Implementation sequence and gates

### STAGE 0 — ARCHITECTURE FREEZE
- Approve this boundary and threat model.
- Record root policy, roles, prohibited operations, and recovery objectives.
- Define a hardware qualification matrix.
- No keys generated.

### STAGE 1 — HARDWARE DISCOVERY
- Inspect existing OURSELF-owned hardware and inventory.
- Establish exact model, firmware, ownership, APIs, physical custody, and security capabilities.
- Identify whether a dedicated on-premises HSM is required.
- No production key generated.

### STAGE 2 — CUSTODY AND CEREMONY ENGINEERING
- Define custodian identities and role separation.
- Define quorum, sealed materials, dual-control operations, and witness evidence.
- Exercise a non-production ceremony with test keys.
- Prove loss, replacement, recovery, and revocation procedures.
- No production root generated.

### STAGE 3 — HARDWARE ADMISSION
- Bind the selected hardware by serial, configuration digest, firmware, physical custody, and qualification evidence.
- Verify the hardware boundary independently.
- Freeze recovery and succession procedures.
- No production root generated until all admission predicates pass.

### STAGE 4 — PRODUCTION ROOT CEREMONY
- Requires a fresh explicit Founder authorization for the exact device, participants, policy, and ceremony window.
- Generate the root key inside the admitted hardware boundary.
- Record public key, key ID, algorithms, attributes, hardware identity, policy digest, participant identities, witness receipt, and evidence hashes.
- Never record private key material in Git, logs, chat, or ordinary filesystem storage.

### STAGE 5 — TRUST ISSUANCE AND RUNTIME ADMISSION
- Issue the root public identity and signed trust bundle.
- Establish the separate PORTAL signer identity.
- Bind endpoint identities and jurisdictions.
- Run preflight and independent verification before activating trust consumers.
- Verify live signed challenge/response and revocation behavior.

### STAGE 6 — OPERATIONS AND SUCCESSION
- Routine signing under bounded authorization.
- Key rotation and revocation drills.
- Hardware failure and recovery drills.
- Independent audit and custody revalidation.
- Retirement and succession without provider permission.

## 8. Prohibited transitions

- Vendor account or service key -> OURSELF root.
- Local test key -> production root.
- Software-generated key -> HSM-backed root claim.
- Device discovered -> device admitted.
- Device admitted -> production root automatically generated.
- Founder authorization -> independent witness satisfied.
- Git commit -> deployed authority.
- Trust bundle parsed -> trust bundle verified.
- TLS connection -> authorized caller.
- Authorized caller -> admitted action.
- Dispatch -> verified effect.

## 9. Current state

| Predicate | State |
|---|---|
| Founder-directed SELFTOSYS architecture | DEFINED |
| Securosys authority path | REJECTED |
| OURSELF-owned production HSM | NOT YET IDENTIFIED |
| Hardware custody receipt | ABSENT |
| Independent custodian/witness binding | NOT YET ESTABLISHED |
| Production root key | NOT GENERATED |
| Root public identity / key ID | NOT ESTABLISHED |
| Root-signed trust bundle | ABSENT |
| PORTAL signer binding to SELFTOSYS | NOT ESTABLISHED |
| Production trust activation | BLOCKED |

## 10. Governing statement

OURSELF does not rent its identity. OURSELF does not inherit sovereignty from a vendor. OURSELF establishes authority through hardware it owns, roles it controls, ceremonies it witnesses, policies it enforces, and evidence it can independently verify.

SELFTOSYS is the machinery of that commitment. The system is not sovereign until every required predicate is evidenced in operation.