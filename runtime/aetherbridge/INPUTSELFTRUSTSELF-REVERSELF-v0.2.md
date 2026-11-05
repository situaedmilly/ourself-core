# INPUTSELFTRUSTSELF · REVERSELF v0.2

## Purpose

Resolve the five PORTAL trust inputs by reverse-engineering their authoritative origin, not by filling environment variables with guessed values.

The five values are outputs of a verified trust bundle. They are not self-authenticating configuration.

## Five-input resolution map

| Runtime input | Authoritative bundle source | Acceptance condition |
|---|---|---|
| Trusted public key | payload.portal_signer.public_key_pem | Valid Ed25519 public key; root bundle signature verifies |
| Trusted key ID | payload.portal_signer.key_id | Must equal ed25519-sha256:{SHA256(SPKI-DER)} |
| Trusted signer identity | payload.portal_signer.identity_ref | Non-empty identity; distinct from certifier identity |
| Expected source identity | payload.source_identity_ref | Exact identity exists in hardware/reality registry and passes identity plus jurisdiction evidence gates |
| Expected target identity | payload.target_identity_ref | Exact identity exists in hardware/reality registry and passes identity plus jurisdiction evidence gates |

The decision's authority_grant_ref must match the bundle grant. The PORTAL issuer's allowed_capabilities must contain the capability requested by the route.

## Independent trust root

The bundle is signed by a separate Ed25519 certifier. The runtime pins the certifier's public key, key ID, and identity reference through launchd configuration.

The certifier key and PORTAL decision-signing key must be different keys and different identities. The certifier's private key must remain outside the AetherBridge runtime and outside the PORTAL signer custody boundary. The runtime receives only the root public key and signed bundle.

A public key file on the same Mac is not, by itself, proof of independent custody. The root key must be provisioned from an independently controlled authority or offline custody process and verified out-of-band.

## Registry binding requirements

A status label alone is insufficient.

A physical substrate must carry:
- A verified identity state.
- identity_attestation_ref.
- identity_verification_method.
- Non-empty evidence_refs.

A reality-to-substrate binding must carry:
- A verified binding state.
- Exact subject and object IDs.
- attestation_ref.
- verification_method.
- Non-empty evidence_refs.

A jurisdiction record must carry:
- A verified authority state.
- certifier_identity_ref.
- verification_method.
- Non-empty evidence_refs.

The trust bundle binds exact SHA-256 digests of all four registries. Any registry drift invalidates the bundle and requires recertification.

## Existing signer discovery disposition

The active OURSELFD issuer OURSELF-AGENTBRIDGE-ISSUER-V1 / agentbridge-runtime-v1 is scoped to CREATE_LOCAL_WITNESS. It is not authorized for PORTAL admission signing and must not be broadened by relabeling.

The OURSELF-ED25519-002 candidate is a different key and does not match the active issuer. Its existence and 0600 permissions do not establish authority for PORTAL admission.

The previously observed Secure Enclave signer uses a different P-256 contract and an expired relation. It is not a substitute for the required Ed25519 certifier.

No signer key is generated, relabeled, or repurposed by this realization.

## Current unresolved inputs

No root public key, root key ID, root signer identity, or signed INPUTSELFTRUSTSELF bundle is provisioned in the live launchd environment. Therefore the five runtime values remain unresolved and are deliberately not populated.

Once the independent root trust anchor and signed bundle are supplied, the runtime derives the five values, verifies registry digests and evidence, and only then permits a PORTAL decision to be evaluated.
