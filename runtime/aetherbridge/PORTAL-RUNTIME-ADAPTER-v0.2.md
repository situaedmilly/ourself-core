# AETHERBRIDGE PIPE|PORTAL Runtime Adapter v0.2

Status: DEPLOYED ON OURSELFMAC · BOOT ACTIVE · UNIVERSAL AT THIS SERVICE BOUNDARY · FAIL-CLOSED · TRUST NOT PROVISIONED

## 1. Purpose

Version 0.2 makes PORTAL admission mandatory for every API route served by the AETHERBRIDGE Pipe|Portal process. It adds an independently root-signed INPUTSELFTRUSTSELF bundle so the five admission trust inputs are derived from a certified trust package instead of being manually entered as unrelated environment variables.

It does not grant kernel authority, hardware actuation, owner identity, or universal enforcement across every OURSELF subsystem.

## 2. Enforcement boundary

The process reports PORTAL_REQUIRED_FOR_ALL_API_ROUTES.

The only unauthenticated/read-only exemptions are:

- GET /healthz: loopback liveness only.
- GET /portal/v1/status: existing bearer authentication; returns trust and route status only.

Every other recognized API route requires an admission envelope:

| Route | Required capability |
|---|---|
| POST /v1/chat/completions | inference.chat.completions |
| GET /v1/models | inference.models.read |
| GET /v1/capabilities | ecosystem.capabilities.read |
| GET /v1/reality | ecosystem.reality.read |
| POST /v1/matter | ecosystem.matter.submit |
| POST /v1/selfstatement | ecosystem.selfstatement.submit |
| GET /v1/matter/{matter_ref} | ecosystem.matter.read |
| GET /health | agentbridge.health.read |
| GET /reality | gbtself.reality.read |
| POST /REALIZE/ACTIONGPT | actiongpt.realize |
| POST /portal/v1/chat/completions | inference.chat.completions |

Direct /v1/* paths remain as compatibility paths, but bearer authentication alone is no longer sufficient. Unknown /v1/* routes are denied as PORTAL_ROUTE_UNMAPPED.

The GBTSELF routes additionally retain their existing GBTSELF bearer-authentication requirement. Authentication does not substitute for PORTAL admission.

## 3. INPUTSELFTRUSTSELF root-signed bundle

The runtime reads:

- AETHERBRIDGE_PORTAL_ROOT_PUBLIC_KEY_FILE
- AETHERBRIDGE_PORTAL_ROOT_KEY_ID
- AETHERBRIDGE_PORTAL_ROOT_SIGNER_IDENTITY_REF
- AETHERBRIDGE_PORTAL_TRUST_BUNDLE_FILE
- Four canonical OURHARDWARESELFS registry file paths already bound in launchd.

The bundle schema is ourself.inputselftrustself.bundle.v1. Its canonical payload is signed by an Ed25519 independent certifier root. The bundle contains:

- PORTAL issuer public key, derived key ID, and signer identity.
- Exact source and target identity references.
- Authority grant reference.
- Permitted signer capabilities.
- SHA-256 digests of hardware, ecosystem-reality, identity-binding, and jurisdiction registries.
- Issue and expiry timestamps.

The root certifier and PORTAL decision signer must have different public keys and different identity references. The PORTAL key ID is derived as ed25519-sha256:{SHA256(SPKI-DER)}. Registry drift, signature failure, expiry, unverified identity, missing attestation evidence, or unverified jurisdiction invalidates the bundle.

The five runtime trust inputs are resolved from this signed bundle:

1. Trusted public key.
2. Trusted key ID.
3. Trusted signer identity.
4. Expected source identity.
5. Expected target identity.

The bundle also binds the authority grant and signer capability scope.

## 4. Admission envelope

The request carries a canonical base64url JSON envelope in X-OURSELF-PORTAL-ADMISSION. The PORTAL signer signs the canonical JSON bytes of the decision object with Ed25519.

The verifier checks signer, source, target, capability, authority grant, evidence references, issue time, expiry (maximum 15 minutes), signature, registry identity, jurisdiction, and revocation state.

A reverse-direction passage is a separate decision with source and target explicitly reversed. A forward admission is never mirrored automatically.

## 5. Receipts

Admission verification and PIPE response/transport observations are separate JSONL events. The append path calls fsync. These receipts are local durable observations, not independently signed witness certificates and not proof of remote custody or external effect.

## 6. Current activation disposition

The adapter source is mounted in the supervised Mac process after restart. AetherBridge API routes are fail-closed behind PORTAL. Because no independent root key or trust bundle is currently provisioned, production API traffic is expected to receive admission denial. The service health probe remains available.

The current hardware registry still marks OURSELFMAC DISCOVERED; macOS jurisdiction remains DECLARED_NOT_VERIFIED; REALISELF's substrate binding remains UNRESOLVED; AGENTBRIDGE remains DECLARED. A boot-active AetherBridge process is not evidence that these identity and jurisdiction states have been certified.

## 7. Scope limitation

This is universal enforcement for the AetherBridge Pipe|Portal service boundary only. OURSELFPIMAC, SELFPI, other service processes, OURKERNELSELF enforcement, and other ecosystem realities require their own adapter deployment and conformance evidence before OURSELFECOSYSTEM can be described as universally enforced.

## 8. Rollback

Pre-cutover server source backup:

runtime/aetherbridge/pipeportal-server.mjs.pre-universal-portal-gate-20261102

Rollback requires restoring that exact file and restarting the supervised launchd service. Do not roll back merely to bypass an unresolved admission. Founder approval and a migration plan are required for any compatibility exception.
