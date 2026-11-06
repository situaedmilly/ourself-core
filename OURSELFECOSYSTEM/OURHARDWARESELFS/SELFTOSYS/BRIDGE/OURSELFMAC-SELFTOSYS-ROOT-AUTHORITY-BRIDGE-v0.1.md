# OURSELFMAC ↔ SELFTOSYS Independent Root Authority Bridge v0.1

**Authority principal:** OURSELF
**Client:** OURSELFMAC
**Root authority:** SELFTOSYS_ROOT
**Contract state:** ENGINEERED / NOT DEPLOYED
**Hardware state:** ROOT HARDWARE NOT BOUND
**Production key state:** NOT GENERATED
**Transport state:** NOT ESTABLISHED
**Trust activation:** BLOCKED

## 1. Objective

Establish a controlled interface between OURSELFMAC and an independently controlled OURSELF root authority without making the Mac the root custodian, root signer, or sole authorization domain.

OURSELFMAC is the requester and verifier. SELFTOSYS_ROOT is the authority. The root authority's custody, key boundary, authorization quorum, recovery, and witness system must remain independently administered from OURSELFMAC.

The bridge contract can be engineered before the physical root is selected. Engineering this contract does not establish a root identity, trust relationship, network path, or signing capability.

## 2. Authority separation

### OURSELFMAC: client and relying party
- Constructs bounded authority requests and certificate signing requests (CSRs).
- Supplies explicit purpose, target identity, jurisdiction, requested capabilities, validity, and evidence references.
- Verifies returned signatures, certificate chains, key identifiers, policy identifiers, and receipts.
- Stores only public trust material, request receipts, and endpoint private keys belonging to the Mac's own endpoint identity.
- Cannot read, export, replace, back up, or directly invoke the SELFTOSYS root private key.
- Cannot unilaterally authorize root ceremonies or root-policy changes.

### SELFTOSYS_ROOT: independent authority
- Runs on a separately owned and custody-controlled hardware boundary.
- Generates and retains root private-key material inside its admitted cryptographic boundary.
- Requires configured quorum and founder-scoped authority for root creation, root rotation, root revocation, root-policy change, and subordinate authority issuance.
- Records every operation in an independently verifiable audit chain.
- Does not accept arbitrary network signing calls from OURSELFMAC.
- Does not expose root private-key material or a general-purpose root-signing API.

### Independent custody and witness
- Custodian and witness credentials are separate from OURSELFMAC administrator credentials.
- Witness verifies device, policy, participants, quorum, public-key fingerprints, and ceremony receipt.
- Witness cannot silently sign as the root.
- Recovery and succession require their own quorum and evidence.

## 3. Connectivity model

The bridge is logically connected but the root signing boundary is not continuously network-exposed.

1. Mac creates a canonical request bundle.
2. Mac submits it to a non-authoritative intake relay or exports it for controlled transfer.
3. Root-side intake validates syntax, digest, request identity, scope, and evidence references.
4. Independent custody and witness roles review the request.
5. Authorized root ceremony or subordinate issuance is performed inside the SELFTOSYS boundary.
6. Root-side system emits a signed result bundle and append-only receipt.
7. Mac imports the result and independently verifies signature, chain, policy, request binding, and receipt.
8. Runtime trust consumers receive only admitted public trust material.

The relay is transport, not authority. It cannot approve, sign, or change a request. Network reachability is not an authorization signal.

## 4. Request contract

Every request must contain:
- contract: ourself.selftosys.root-request.v0.1
- request_id: globally unique immutable identifier
- created_at: UTC timestamp
- requester: stable endpoint identity reference for OURSELFMAC
- authority: exact SELFTOSYS root authority identifier, once established
- operation: enumerated operation
- target: exact subject and intended endpoint identity
- jurisdiction: explicit scope
- capabilities: explicit least-privilege capability list
- validity: requested not-before and expiry
- csr: CSR reference and SHA-256 digest, where certificate issuance is requested
- evidence: typed evidence references with SHA-256 digests
- founder_authorization: reference to a scoped authorization receipt
- idempotency_key: stable key preventing duplicate operation
- request_digest: canonical SHA-256 over all request fields excluding the digest itself

Allowed operations:
- SUBMIT_ENDPOINT_CSR
- REQUEST_SUBORDINATE_CERTIFICATE
- REQUEST_TRUST_BUNDLE
- REQUEST_REVOCATION
- REQUEST_STATUS
- REQUEST_ROOT_POLICY_REVIEW

Forbidden through the online bridge:
- EXPORT_ROOT_PRIVATE_KEY
- SIGN_ARBITRARY_BYTES
- REPLACE_ROOT
- CHANGE_ROOT_POLICY
- DISABLE_QUORUM
- BYPASS_WITNESS
- RESTORE_ROOT_FROM_UNVERIFIED_BACKUP
- AUTHORIZE_SELF
- EXECUTE_ROOT_CEREMONY

Root creation, root rotation, root recovery, and root-policy changes are offline or physically controlled ceremonies. They are not online API operations.

## 5. Result and receipt contract

A response must bind to original request_id, request_digest, operation, authority identifier, policy digest, and disposition.

Disposition enum:
- RECEIVED
- EVIDENCE_REVIEW
- AWAITING_QUORUM
- APPROVED
- REFUSED
- ISSUED
- REVOKED
- EXPIRED
- QUARANTINED

A final receipt must include:
- request ID and request digest
- authority ID and root key ID
- policy digest and policy version
- result artifact digest
- signer key ID and signature algorithm
- signature over canonical receipt bytes
- custodian approval references and quorum result
- independent witness identity and witness receipt
- event timestamp and monotonic sequence or append-only log reference
- revocation/status lookup reference

A receipt is not proof of live deployment. Mac must verify the returned artifact and separately verify runtime admission and observed effect.

## 6. Transport and bootstrap rules

- Preferred transport is outbound from OURSELFMAC to a controlled intake relay; inbound access to the root signing boundary is prohibited by default.
- If a network channel is later admitted, use mutually authenticated TLS with separately issued endpoint credentials and pinned authority identity.
- Before root trust exists, do not invent a bootstrap CA or trust the relay's self-signed certificate as OURSELF authority.
- Initial bootstrap is a witnessed out-of-band exchange of public identity material and signed fingerprints.
- The Mac's endpoint identity is subordinate to SELFTOSYS; it never becomes the root.
- Network failure, unknown result, stale receipt, duplicate request, invalid signature, revoked credential, or policy mismatch fails closed.
- Never automatically retry an operation that may have crossed the signing boundary unless the root-side idempotency ledger proves it was not executed.

## 7. Authorization model

Transport authentication, requester identity, capability authorization, founder authorization, custodian quorum, witness approval, admission, dispatch, and verified effect are separate predicates.

A valid Mac request does not authorize itself. A founder authorization receipt is scoped to an operation, target, policy digest, expiry, and request digest. Custody quorum and witness evidence remain mandatory where policy requires them.

The independent root authority must not rely on OURSELFMAC's local administrator account, Secure Enclave, SSH agent, GitHub identity, or PipePortal bearer token as proof of independent custody.

## 8. Failure behavior

- Unknown authority ID: BLOCKED_AUTHORITY_UNBOUND.
- Root hardware not admitted: BLOCKED_HARDWARE_NOT_ADMITTED.
- Request digest mismatch: REFUSED_REQUEST_INTEGRITY.
- Missing founder authorization: REFUSED_FOUNDER_AUTHORIZATION.
- Missing quorum: AWAITING_QUORUM.
- Missing independent witness: BLOCKED_WITNESS_UNBOUND.
- Invalid or revoked requester: REFUSED_REQUESTER_IDENTITY.
- Policy mismatch: REFUSED_POLICY_MISMATCH.
- Timeout after possible dispatch: OUTCOME_UNKNOWN; no automatic retry.
- Receipt signature invalid: QUARANTINED_RECEIPT.
- Root or witness evidence absent: no trust bundle admission.

## 9. Interface boundary

The Mac-side client may implement canonical request construction and digesting, CSR generation for the Mac endpoint identity only, outbound request transport to a future admitted relay, response and receipt verification, public trust-bundle validation, and audit evidence capture.

The root-side implementation may later provide isolated request intake, policy and quorum enforcement, HSM adapter, witnessed signing ceremony, signed receipt and audit ledger, and public trust-bundle export.

No root-side adapter is implemented against a physical HSM yet. No production endpoint is configured. The contract intentionally defines the boundary without simulating a real authority.

## 10. Acceptance tests required before connection

1. Mac cannot request or receive root private-key bytes.
2. Mac cannot submit arbitrary bytes for root signing.
3. Request digest and request ID are checked on both sides.
4. Duplicate requests are idempotently rejected or return the original receipt.
5. Founder authorization is bound to exact request and target.
6. Custodian quorum is enforced by root-side policy, not Mac client code.
7. Witness identity is distinct from requester, root signer, endpoint admin, and PORTAL signer.
8. Root-side audit receipt is independently verifiable.
9. Relay compromise cannot create an approval or root signature.
10. Mac independently verifies returned certificates and receipts.
11. Root service remains unavailable to network signing when offline ceremony mode is selected.
12. Revocation and unknown-outcome behavior fail closed.

## 11. Current execution state

| Predicate | State |
|---|---|
| Mac client/root authority separation | CONTRACTED |
| Request/receipt semantics | CONTRACTED |
| Root authority ID and key ID | UNBOUND |
| Root hardware and custody | NOT ADMITTED |
| Independent custodian and witness | NOT BOUND |
| Mac endpoint certificate | NOT ISSUED |
| Bootstrap trust | NOT ESTABLISHED |
| Transport endpoint | NOT CONFIGURED |
| Root-side HSM adapter | NOT IMPLEMENTED |
| Production root | NOT GENERATED |
| Live Mac ↔ root connection | NOT ESTABLISHED |

## 12. Next gate

The next gate is SELFTOSYS_ROOT_BINDING. It requires physical root hardware identity, OURSELF ownership evidence, custody-role bindings, quorum and recovery evidence, witness identity, and root-side interface implementation. Only after that gate passes can a Mac endpoint identity be issued and a real authenticated connection be established.

**Governing invariant:** OURSELFMAC can request, verify, and consume authority. Only independently controlled SELFTOSYS can originate OURSELF root authority.