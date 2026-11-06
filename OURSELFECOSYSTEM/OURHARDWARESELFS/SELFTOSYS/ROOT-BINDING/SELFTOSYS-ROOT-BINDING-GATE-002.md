# SELFTOSYS Root Binding Gate 002

**Authority principal:** OURSELF  
**Gate:** SELFTOSYS_ROOT_BINDING  
**Observation date:** 2026-11-06  
**Disposition:** BLOCKED / NO ROOT BINDING / NO ROOT CONNECTION  
**Schema:** `SELFTOSYS-ROOT-BINDING.schema.json` v0.1

## 1. Decision

The root binding gate remains **BLOCKED**. No hardware currently evidenced on OURSELFMAC or OURSELFPIMAC qualifies as the independent SELFTOSYS root boundary. No independent custodian or witness has been bound. No authenticated transport to a root authority exists. No live Mac ↔ SELFTOSYS_ROOT roundtrip has occurred.

This is a live inspection result, not an assumption derived from the prior architecture documents.

## 2. Hardware observations

### OURSELFMAC

- Host: OURSELFMAC.local, Apple M4 Mac mini, macOS 27.0.1.
- Apple Secure Enclave subsystem is active in the I/O Registry.
- CryptoKit Secure Enclave capability was previously observed available.
- No Secure Enclave key was generated in this campaign.
- `security list-smartcards` returned: no smartcards found.
- `security find-identity -v` returned: zero valid identities.
- No dedicated HSM or identifiable hardware security token was evidenced in the inspected inventory.

**Disposition:** Secure Enclave remains a bounded endpoint/device cryptographic candidate. It is not admitted as SELFTOSYS root because custody, administrative independence, quorum, independent recovery, and independent witness controls are not established.

### OURSELFPIMAC

- Host: OURSELFPIMAC, Raspberry Pi 5 Model B Rev 1.1, Debian 13.6, aarch64.
- `/dev/hwrng` exists and is root-owned.
- No `/dev/tpm*` node or `/sys/class/tpm` entry was present.
- USB inventory showed root hubs only.
- No PKCS#11, TPM, or HSM command-line interface was found in the inspected PATH.
- SSH service is running, but this does not make the Pi a root authority.

**Disposition:** Pi RNG is an entropy source only. It is not root key custody, TPM evidence, or HSM evidence.

### Hardware binding result

- Dedicated OURSELF-owned root hardware: NOT PRESENT IN INSPECTED HOST INVENTORY.
- Exact root device identity, serial, firmware, asset record: UNBOUND.
- Physical custody receipt: ABSENT.
- Root key boundary: NOT ESTABLISHED.
- Production root key: NOT GENERATED.
- No test key generated.

## 3. Independent custody

The following role bindings remain absent:

| Role | Binding state |
|---|---|
| Root physical custodian 1 | UNBOUND |
| Root physical custodian 2 | UNBOUND |
| Root approval quorum participants | UNBOUND |
| Independent ceremony witness | UNBOUND |
| Endpoint administrator(s) | Known host administration exists; not accepted as root custody |
| PORTAL decision signer | Separate role required; not accepted as root custodian or witness |

No custodian or witness identity has been inferred from a device login, email address, GitHub account, endpoint administrator, or Founder authorization.

**Disposition:** H05, H06, H07, and H08 cannot pass without independent role, quorum, recovery, and witness evidence. The complete H01-H12 hardware admission matrix remains controlling. Unknown is not pass.

## 4. Transport discovery

### Existing Cloudflare tunnels on OURSELFMAC

The following tunnel processes were observed running:

- `spiritualgoddess-web`
- `getsituated-web`
- `conversation-event-membrane`

Their inspected ingress rules route existing website, event, and voice services to local Mac services. No SELFTOSYS root intake endpoint or root-signing service is configured in those ingress rules.

Cloudflare tunnel presence is transport infrastructure only. It does not establish OURSELF root identity, custody, approval, witness, or trust. No new route was created and no existing route was changed.

### Mac ↔ Pi SSH

- Mac SSH configuration contains an alias for OURSELFPIMAC.
- The Mac known-hosts ED25519 fingerprint for OURSELFPIMAC matched the Pi's currently observed ED25519 host-key fingerprint: `SHA256:JRneJPb/DoqXUBQcHXd+lGjkr5uuDPh25J5uJ+X72Y0`.
- A fresh Mac-to-Pi SSH connection attempt timed out on IPv4 and IPv6 before completing the transport handshake.
- Therefore the stored host-key pin is observed, but a live authenticated SSH session was **not** established.
- The Pi is not the SELFTOSYS root, so even a successful Mac ↔ Pi SSH session would not satisfy Mac ↔ root connectivity.

**Disposition:** Root transport = NOT_CONFIGURED. Root peer identity and trust anchor = UNBOUND. No mutual-authentication evidence exists.

## 5. Live connection

No SELFTOSYS root endpoint exists in the observed configuration. No root-side intake service, root authority identity, root certificate, root challenge signer, or signed response receipt is available.

No root challenge was dispatched. No response was received. No live connection is claimed.

`LIVE_CONNECTION = BLOCKED_ROOT_UNBOUND`

## 6. Admission matrix impact

| Predicate | Current result | Reason |
|---|---|---|
| H01 Ownership | UNKNOWN | No exact root asset or OURSELF ownership record |
| H02 Hardware boundary | UNKNOWN | No selected root device |
| H03 Key generation | UNKNOWN | No admitted device; no test or production key generated |
| H04 Key attributes | UNKNOWN | No selected device or enforced root-key policy |
| H05 Administrative separation | UNKNOWN | Root custody/admin roles not bound |
| H06 Multi-person authorization | UNKNOWN | Quorum participants and enforcement not evidenced |
| H07 Recovery | UNKNOWN | No OURSELF-controlled recovery drill |
| H08 Independence | UNKNOWN | Independent custodian and witness not bound |
| H09 Audit | UNKNOWN | No root ceremony or independent audit chain |
| H10 Runtime isolation | UNKNOWN | No root service exists to test |
| H11 API and integration | UNKNOWN | No root-side hardware adapter or intake endpoint |
| H12 Lifecycle | UNKNOWN | No selected device lifecycle and succession evidence |

No predicate is marked PASS. This gate does not admit hardware, issue a certificate, authorize root generation, or activate trust consumers.

## 7. Required evidence to clear the gate

1. Bind an exact physical root device: manufacturer, model, serial, firmware, asset record, and OURSELF ownership evidence.
2. Record physical custody with at least two distinct custodians and independently verified identity evidence.
3. Bind independent root approvers and an independent witness, with explicit non-overlap against endpoint administration and PORTAL signing.
4. Demonstrate quorum enforcement, non-exportable key attributes, independent recovery, audit integrity, runtime isolation, and lifecycle controls.
5. Implement root-side intake and policy enforcement inside the admitted hardware boundary.
6. Establish an independently verified bootstrap trust exchange and mutually authenticated transport.
7. Perform a nonce-bound Mac ↔ root challenge/response. Verify the signed response, authority identity, policy digest, request binding, and independent witness receipt.
8. Only after all predicates pass, obtain the separate scoped Founder authorization for the exact production root ceremony.

## 8. Prohibited shortcuts

- Do not promote the Mac Secure Enclave to root by relabelling it.
- Do not promote Pi `/dev/hwrng` or the Pi host to root authority.
- Do not use a Cloudflare tunnel, SSH host pin, or TLS session as proof of root authority.
- Do not create a self-signed bootstrap root or treat relay identity as OURSELF.
- Do not generate test or production root keys under this gate.
- Do not mark the connection live until a signed, nonce-bound response from the independently admitted root has been received and verified.

**Final gate state:** `ROOT_HARDWARE=UNBOUND` · `INDEPENDENT_CUSTODY=UNBOUND` · `ROOT_TRANSPORT=NOT_CONFIGURED` · `LIVE_CONNECTION=BLOCKED_ROOT_UNBOUND`
