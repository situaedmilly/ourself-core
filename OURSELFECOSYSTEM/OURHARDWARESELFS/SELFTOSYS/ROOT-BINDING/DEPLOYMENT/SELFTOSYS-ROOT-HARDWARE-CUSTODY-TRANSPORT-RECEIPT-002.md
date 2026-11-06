# SELFTOSYS Root Hardware, Custody, and Transport Execution Receipt 002

**Date:** 2026-11-06  
**Host inspection:** OURSELFMAC.local and OURSELFPIMAC  
**Pi intake:** v0.2, running on loopback  
**Disposition:** HARDWARE/CUSTODY BLOCKED; mTLS ADAPTER STAGED; ROOT CONNECTION NOT ESTABLISHED

## Expanded hardware discovery

### OURSELFPIMAC
- Raspberry Pi 5, Debian 13, aarch64.
- `/dev/hwrng` exists.
- No `/dev/tpm*`, `/sys/class/tpm`, or `/sys/class/tee`.
- No `/dev/spidev*` or `/dev/i2c-*`.
- SPI bus device directory empty.
- I²C controllers 13 and 14 exist, but no attached I²C device entries were enumerated.
- USB inventory contained only Linux root hubs.
- Loaded security-related module search showed `i2c_brcmstb`; no TPM, HSM, TEE, or secure-element driver surfaced.
- Device-tree security/HSM/TPM/crypto search returned no matching nodes.
- Boot configuration has SPI and I²C parameters commented out and a `nospi10` overlay.
- No dedicated security module or token was detected in inspected surfaces.

### OURSELFMAC.local
- `SecureEnclave.isAvailable=true`.
- `security list-smartcards`: no smartcards found.
- `security find-identity -v`: zero valid identities.
- Local human account listing exposed only the founder account.
- Secure Enclave remains a device-bound cryptographic primitive candidate, not an independently custodied OURSELF root.

## Human custody

No two distinct natural-person custodians, two approvers, or independent witness have been explicitly nominated and accepted. The Mac founder account cannot satisfy independent custody. No human role has been assigned by inference.

The custody acceptance schema and intake procedure now exist. Their initial state is UNASSIGNED. Acceptance requires explicit human consent, distinct authenticated identities, and independent evidence.

## Pi intake deployment

- Updated service v0.2 is running as PID 53074.
- Listener remains bound only to `127.0.0.1:49372`.
- `GET /health` returned HTTP 200 and reported `upstreamTransport=CONFIGURATION_REQUIRED`.
- `POST /v1/challenges` returned HTTP 423 with `missing_environment:SELFTOSYS_ROOT_ENDPOINT`; no challenge was sent and no signature was produced.
- Binding state remains UNBOUND.

## mTLS connector

A strict upstream HTTPS/mTLS connector is staged in the Pi runtime and repository. It requires:
- Root HTTPS endpoint
- Admitted root CA bundle
- Pi client certificate and private-key path
- Independently recorded root leaf-certificate SHA-256 pin
- TLS 1.2 minimum, hostname validation, certificate validation, mutual TLS, and leaf pin match

No trust-on-first-use, plaintext fallback, local certificate generation, or private-key generation is implemented. A successful mTLS peer check would still be transport evidence only; the root's nonce signature remains separately unverified until a cryptographic proof verifier is implemented and independently reviewed.

## Tests

- Intake suite: 4/4 passed.
- Combined Pi runtime suite: 7/7 passed.
- mTLS connector suite: 3/3 passed.
- Live negative challenge test: HTTP 423, root endpoint configuration absent.

## Current authoritative state

| Component | State |
|---|---|
| Root hardware boundary | UNBOUND |
| Independent custodians | UNASSIGNED |
| Approvers and independent witness | UNASSIGNED |
| Root endpoint | UNRESOLVED |
| Admitted root trust anchor | UNAVAILABLE |
| Pi mTLS connection | NOT ESTABLISHED |
| Root challenge signature | NOT VERIFIED |
| Production root | NOT GENERATED |
| Admission | BLOCKED |

## Next transition

A physical hardware root must be supplied and inspected, and five distinct natural persons must explicitly accept the custody/approval/witness roles. Only then can a root-side endpoint, trust anchor, and mTLS identities be provisioned through the admitted ceremony. This receipt does not claim any of those conditions has occurred.
