# OURSELF ConsciousConvo Founder Ingress v0.1

**Reality:** AETHERBRIDGE / PipePortal
**Runtime:** OURSELFMAC loopback, TCP/49320
**Surface:** `/founder/conscious-convo`
**Status:** IMPLEMENTED, PORTAL-GATED, FAIL-CLOSED
**Authority class:** Founder-authenticated source submission with independent PORTAL admission

## Purpose

ConsciousConvo makes explicitly submitted ChatGPT alchemy conversations addressable OURSELF source material. A founder can paste a conversation transcript, add a plain-language directive, and preserve both as one immutable source submission with a verifiable receipt.

The surface does not read ChatGPT's private session store, enumerate other chats, or automatically capture future turns. Current capture is explicit founder paste/API submission. A custom GPT Action or remote HTTPS ingress requires a separately authorized, reachable HTTPS boundary.

## Founder surface

Open on OURSELFMAC:

`http://127.0.0.1:49320/founder/conscious-convo`

The page accepts:
- Founder ingress bearer token
- Separate signed PORTAL admission envelope for submission
- Separate signed PORTAL admission envelope for reads
- Optional ChatGPT session reference
- Conversation title
- Founder input/directive
- Pasted conversation transcript

The admission envelopes are base64url-encoded PORTAL envelopes. The page does not create or sign them. They must be issued by the trusted PORTAL signer and independently verified by PipePortal.

## API and required authority

- `GET /founder/conscious-convo` serves the loopback Founder interface.
- `POST /founder/conscious-convo` requires both the existing Founder bearer identity and independent PORTAL admission for `ecosystem.consciousconvo.submit`.
- `GET /founder/conscious-convo/records` requires both Founder bearer identity and independent PORTAL admission for `ecosystem.consciousconvo.read`.
- `GET /founder/conscious-convo/records/{conversation_id}` requires the same read capability.

The route calls the existing `authorizePortalRequest` verifier. It verifies the Ed25519-signed decision against the independently root-signed InputSelfTrustSelf bundle, trusted signer identity/key, source/target identity bindings, jurisdiction registries, authority grant, admitted capability, decision validity window, and revocation state. The store independently checks that the route passed a verified admission object scoped to the exact operation capability.

Submission and read are separate capabilities. A read decision cannot authorize a submit, and a submit decision cannot authorize a read. Bearer authentication alone is insufficient.

### Required PORTAL signer capabilities

The independently root-signed trust bundle's `portal_signer.allowed_capabilities` must explicitly include:
- `ecosystem.consciousconvo.submit`
- `ecosystem.consciousconvo.read`

The capability must also be present in each signed decision's `admitted_capabilities`. Adding these names to application code or a local configuration does not grant them.

OpenAPI contract: `conscious-convo.openapi.yaml`.

## Persistence and evidence

Data is stored separately from Matter and host-admin state:

- `data/conscious-convo/source/{conversation_id}.request.raw`
- `data/conscious-convo/receipts.jsonl`

Directories are created with mode 0700; source and receipt files use mode 0600. Exact HTTP request bytes are preserved. The receiver reads them back and verifies SHA-256 before appending a hash-chained receipt. Identical submissions with the same conversation ID are idempotent only after source integrity is rechecked; conflicting bytes are held with HTTP 409.

The receipt binds the request digest to:
- verified PORTAL decision ID and digest
- trusted signer key ID
- exact required capability
- source artifact path and readback status
- previous receipt digest and current receipt digest

## Authority and non-claims

- Founder identity: existing AetherBridge bearer authentication.
- Independent admission: existing Ed25519 PORTAL verifier and InputSelfTrustSelf trust chain.
- Network boundary: enabled only when PipePortal binds to a loopback address.
- PORTAL admission: required for every conversation data operation.
- Cognition: not executed by ingestion.
- Host administration: not exposed by this surface.
- External effect: false.
- ChatGPT origin/session reference: founder-declared; not independently attested.
- Public deployment or remote ChatGPT Action reachability: not established.

**Current production trust state:** PipePortal reports the production InputSelfTrustSelf bundle as unconfigured/unverified. Consequently, the production conversation submit/list/read API calls currently fail closed with HTTP 403 until the independently approved trust bundle and PORTAL signer capability grants are provisioned. Synthetic signed trust material in tests verifies the code path only; it is not production authority.

## Verification

- ConsciousConvo store unit tests: 8/8 pass.
- Isolated runtime with no production trust: bearer-only submission, list, and detail requests are denied; no source or receipt is written.
- Synthetic independent PORTAL runtime test: missing admission denied; wrong capability denied; valid signed submit and separately signed read admissions accepted; admission decision and capability recorded in receipt.
- Full AetherBridge test set: 39/39 pass.
- Live runtime: launchd job `com.ourself.aetherbridge.pipeportal`, loopback `127.0.0.1:49320`.
- No production conversation has been admitted during deployment verification.

## Next boundary

1. Provision the independently approved InputSelfTrustSelf bundle with the two exact signer capabilities above.
2. Obtain separately signed submit/read decisions from the trusted PORTAL authority and use them in the Founder interface.
3. Only after an approved HTTPS route and trust decision exist, bind a Custom GPT Action to this OpenAPI contract. Never expose the current loopback service or bearer token directly to the public internet.
