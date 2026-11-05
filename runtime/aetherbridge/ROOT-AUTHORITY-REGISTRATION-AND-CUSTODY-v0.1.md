# OURSELF Root Authority Registration and Custody Contract v0.1

**Status:** CONTRACT_DEFINED / NO_AUTHORITY_BOUND
**Purpose:** Define evidence required before any root identity may certify the InputSelfTrustSelf bundle used by PORTAL.
**Scope:** ConsciousConvo PORTAL admission and the existing AetherBridge trust verifier. This contract does not create an issuer, key, certificate, trust bundle, authority grant, or admission.

## 1. Authority boundary

A root authority is accepted only after an independent reviewer verifies the evidence in this contract against the actual custodian and trust domain. A declaration, local file, repository commit, self-signed certificate, synthetic test fixture, or successful unit test is not proof of independent authority.

The root authority MUST be distinct from OURSELFMAC and its endpoint administrator, OURSELFPIMAC and its endpoint administrator, the PORTAL decision signer, the endpoint identities being certified, and any candidate/test issuer or issuer whose scope is limited to another capability.

No root identity is inferred from a key filename, key ID, device label, repository ownership, or prior test artifact.

## 2. Required registration record

The intake record MUST conform to contracts/root-authority-registration.v0.1.schema.json and bind:

1. Canonical authority ID, identity reference, and trust-domain ID.
2. Ed25519 root public key in PEM form, SHA-256 SPKI fingerprint, and stable key ID.
3. Physical custody substrate, custodian identity, administrative owner, and evidence of separation from both endpoint administrators and PORTAL signer administration.
4. Signing authority scope explicitly permitting InputSelfTrustSelf bundle signing and exact endpoint certificate issuance scope, if applicable.
5. Distinct PORTAL signer identity, public key, key ID, and exact capabilities. Root and PORTAL signer keys and identities MUST differ.
6. Source and target endpoint identity references, CSR SHA-256 digests, certificate SHA-256 digests, SAN bindings, EKUs, and hardware identity evidence.
7. Hardware, ecosystem reality, identity-binding, and jurisdiction registry digests plus independent evidence supporting each binding.
8. Revocation, rotation, expiry, compromise response, recovery, and recontact procedures with named accountable authorities.
9. Independent reviewer identity, evidence retrieval references, review time, disposition, and signed review receipt.

## 3. Evidence requirements

Every evidence item MUST include an immutable reference, SHA-256 digest, issuer/observer identity, observation timestamp, validity interval where relevant, retrieval method, and provenance. Evidence must be independently retrievable by the reviewer. A submitter-provided digest without retrievable source bytes is insufficient.

The reviewer MUST verify legal/organizational identity and authority of the custodian; actual key-custody substrate and access-control boundary; administrative separation from source, target, and PORTAL signer; root public-key fingerprint through an out-of-band channel; root-key possession through a challenge signed by the root key and verified against the independently pinned public key; exact signing scope and delegation chain; PORTAL signer separation and capability scope; endpoint CSR-to-certificate public-key continuity, SANs, EKUs, and fingerprints; jurisdiction and hardware identity evidence against pinned registries; and revocation, rotation, recovery, audit integrity, and independent recontact.

The private root key MUST NOT be uploaded, pasted into the intake, stored in this repository, or transferred to either endpoint. A challenge signature is evidence of possession, not by itself evidence of independent custody or authority.

## 4. State machine

Allowed lifecycle:

RECEIVED -> EVIDENCE_REVIEW -> IDENTITY_VERIFIED -> BOUND

Incomplete, contradictory, unverifiable, expired, revoked, or non-independent evidence MUST end in refusal or quarantine. No automatic promotion is permitted. BOUND requires a signed independent reviewer receipt and every mandatory evidence domain verified.

## 5. Downstream activation gate

Only after BOUND may the approved custodian sign the production InputSelfTrustSelf bundle. The existing verifier must then validate the root signature, key ID, signer identity, signer separation, exact capabilities, endpoint bindings, registry digests, validity, and revocation state.

Operational sequence:

AUTHORITY_BOUND -> TRUST_BUNDLE_ROOT_SIGNED -> ENDPOINT_CERTIFICATES_VERIFIED -> PORTAL_ADMISSION_VERIFIED -> CONSCIOUSCONVO_ROUTE_ACTIVATED

Each transition requires its own evidence receipt. A previous stage does not imply the next stage succeeded.

## 6. Explicit non-authorizations

This contract does not authorize generating or self-signing a production root key, promoting any candidate/test key, changing issuer capability scope, issuing endpoint certificates without independently verified authority, modifying launchd trust environment or Keychain, activating PORTAL trust or bypassing admission, submitting or reading ConsciousConvo production records, host administration, Pi dispatch, cognition execution, or external effects.

## 7. Current binding disposition

At contract creation, known machine evidence says no approved independent root identity, root public-key location, root key ID, trusted PORTAL signer, or verified production InputSelfTrustSelf bundle is configured. Existing candidate/test issuers and the CREATE_LOCAL_WITNESS issuer are not eligible substitutes. Therefore this contract is DEFINED BUT UNBOUND and production PORTAL admission remains fail-closed.

The contract becomes actionable only when a genuinely independent custodian and reviewer supply verifiable evidence. It cannot manufacture the trust domain it describes.
