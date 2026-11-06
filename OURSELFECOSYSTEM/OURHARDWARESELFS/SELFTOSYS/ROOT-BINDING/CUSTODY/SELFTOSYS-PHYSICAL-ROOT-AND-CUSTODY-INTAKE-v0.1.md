# SELFTOSYS Physical Root and Custody Intake v0.1

## Purpose
This intake binds a real, independently controlled hardware signing boundary and real human custodians before any production root is admitted. It is not a procurement receipt or an assertion that roles have been filled.

## Physical hardware intake
Required evidence:
- Exact manufacturer, model, hardware revision, serial number, and ownership record.
- Physical inspection record by an observer independent of the proposed custodian.
- Hardware security boundary and supported signing algorithms.
- Proof that root private keys are generated inside that boundary and cannot be exported.
- Hardware administrator and physical custodian are distinct principals.
- Documented tamper response, backup/recovery, revocation, replacement, and destruction.
- Firmware provenance, update policy, and audit evidence.
- Independent qualification report against H01-H12.

A Pi hardware RNG, Mac Secure Enclave availability flag, OS keychain, SSH host key, self-signed certificate, or software key file does not satisfy this intake by itself.

## Human custody intake
Required natural-person roles:
1. CUSTODIAN_A
2. CUSTODIAN_B
3. APPROVER_A
4. APPROVER_B
5. INDEPENDENT_WITNESS

Each person must independently:
- Be explicitly nominated and accept the role.
- Authenticate under a distinct identity.
- Acknowledge exact duties, prohibitions, recovery responsibilities, and conflict-of-interest rules.
- Provide evidence of acceptance and identity verification.
- Participate in a witnessed ceremony or independent review.

The two custodians, two approvers, and independent witness must be five distinct natural persons unless a formally approved policy explicitly defines a stricter separation. Founder authority does not silently fill these roles. No role is assigned by this template.

## Pi-to-root transport
The Pi intake uses a dedicated mTLS client identity. The root endpoint must present a certificate chaining to the independently admitted OURSELF root trust anchor, pass hostname validation, and match an independently recorded SHA-256 leaf-certificate pin. The Pi client certificate must be issued through the admitted process; its private key must be held in a protected workload identity boundary.

Required deployment inputs are supplied out-of-band after qualification:
- `SELFTOSYS_ROOT_ENDPOINT` (HTTPS URL)
- `SELFTOSYS_ROOT_CA_BUNDLE` (admitted root trust chain)
- `SELFTOSYS_ROOT_CERT_SHA256` (independently witnessed leaf pin)
- `SELFTOSYS_CLIENT_CERT` (Pi workload identity certificate)
- `SELFTOSYS_CLIENT_KEY` (protected private-key handle/file path, never committed)

The connector has no plaintext fallback, no trust-on-first-use, and no certificate generation. Transport peer verification is not root-signature verification. The cryptographic challenge receipt must be separately verified.

## Present state
- Hardware root: UNBOUND
- Custodians: UNASSIGNED
- Independent witness: UNASSIGNED
- Root endpoint: UNRESOLVED
- mTLS trust anchor: UNAVAILABLE
- Pi mTLS connection: NOT ESTABLISHED

No production key has been generated and no production trust consumer is activated.
