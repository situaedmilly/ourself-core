# SELFTOSYS Hardware Discovery Gate 001

**Discovery date:** 2026-11-06
**Scope:** Read-only inspection of OURSELFMAC and OURSELFPIMAC
**Gate:** HARDWARE_DISCOVERY
**Disposition:** PARTIAL_DISCOVERY_COMPLETE / NO_PRODUCTION_HARDWARE_ADMITTED
**Mutation policy:** No keys generated; no credentials, services, packages, configuration, or trust stores modified.

## 1. Hosts inspected

| Host | Observed platform |
|---|---|
| OURSELFMAC | Mac mini Mac16,10, Apple M4, 16 GB, macOS 27.0.1, Darwin arm64 |
| OURSELFPIMAC | Raspberry Pi 5 Model B Rev 1.1, Debian 13.6, Linux 6.18.39+rpt-rpi-2712, aarch64 |

## 2. OURSELFMAC observations

- Apple Secure Enclave service is present in the I/O Registry: AppleSEPManager is registered, matched, and active; AppleKeyStore and AppleMesaSEPDriver are also present.
- A read-only Swift/CryptoKit capability probe succeeded: CryptoKit imports, `SecureEnclave.isAvailable` returned `true`, and the Secure Enclave P-256 signing key type is available.
- No Secure Enclave key was generated. No keychain item or identity was created or changed.
- `security list-smartcards` returned `No smartcards found`.
- `security find-identity -v` returned `0 valid identities found`.
- USB enumeration showed Apple/GenesysLogic hubs, a generic USB card reader, JLab GO Charge, and Logitech USB keyboard. No dedicated HSM, YubiKey, Nitrokey, or other identifiable security token was observed in the enumerated devices.
- `p11tool` is installed. The inspected Homebrew package list showed GnuTLS, but no SoftHSM, OpenSC, YubiKey, Nitrokey, TPM, or HSM package.
- Hardware reports Apple M4 with Secure Boot Full Security, SIP enabled, Signed System Volume enabled, and kernel CTRR enabled.
- Internal storage is a 251.0 GB physical disk with a 245.1 GB APFS container. This is host storage, not HSM custody.

### Mac interpretation

The Apple Secure Enclave is a real hardware-backed cryptographic facility and CryptoKit exposes a Secure Enclave P-256 signing-key API. This is a viable candidate for a bounded device-bound signing primitive or non-production prototype.

It is not admitted as the SELFTOSYS root authority by this discovery. The current evidence does not establish OURSELF-controlled independent physical custody, multi-person root authorization, independently controlled recovery, exportable/portable HSM backup, or a general-purpose PKCS#11 HSM interface. Apple's platform, firmware, and OS policy remain part of its trust boundary. Secure Enclave availability is not equivalent to sovereign root custody.

## 3. OURSELFPIMAC observations

- Raspberry Pi 5 Model B Rev 1.1, Debian 13.6, ARM64.
- `/dev/hwrng` exists as a root-owned character device (mode 0600, major 10, minor 183).
- Kernel RNG source reports `107d208000.rng`; available sources are `107d208000.rng none`.
- No `/dev/tpm*`, `/sys/class/tpm`, or `/sys/class/tpmrm` exists.
- `systemd-tpm2-setup.service` is installed but inactive; its condition was unmet (`ConditionSecurity=measured-uki`). This is not evidence of a TPM.
- PCI enumeration showed the Broadcom BCM2712 PCIe bridge and Raspberry Pi RP1 south bridge.
- USB enumeration showed root hubs only. No HSM, security token, or TPM device was observed.
- No `pkcs11-tool`, `p11tool`, `softhsm2-util`, `opensc-tool`, `tpm2_getcap`, or `tpm2_pcrread` executable was found.
- No matching TPM/HSM/PKCS#11/YubiKey/Nitrokey package was found in the installed package inventory.
- No TPM, secure-element, or RNG-named node was found in the inspected device-tree paths.

### Pi interpretation

The Pi exposes a hardware random-number generator driver. An RNG is not a TPM, HSM, secure element, measured-boot root, key vault, or signing authority. The Pi is currently a runtime/compute host, not an admitted SELFTOSYS root device.

## 4. Gate results

| Predicate | Evidence result |
|---|---|
| Mac host identity/platform | OBSERVED |
| Apple Secure Enclave subsystem | OBSERVED_PRESENT |
| CryptoKit Secure Enclave API availability | OBSERVED_TRUE |
| Mac external dedicated HSM | NOT_OBSERVED |
| Mac smartcard/security token | NOT_OBSERVED |
| Mac valid signing identities | ZERO_OBSERVED |
| Pi hardware RNG | OBSERVED_PRESENT |
| Pi TPM device | NOT_OBSERVED |
| Pi HSM/security token | NOT_OBSERVED |
| Pi PKCS#11/TPM toolchain | NOT_OBSERVED |
| Independent physical custodian | NOT_ESTABLISHED |
| Production root authority | NOT_ESTABLISHED |

## 5. Admission decision

**HARDWARE_DISCOVERY = PARTIAL_COMPLETE**
**HARDWARE_ADMISSION = BLOCKED**

Mac Secure Enclave is retained as a candidate for a limited, device-bound cryptographic component. It is not promoted to root authority. Pi RNG is recorded only as entropy-source evidence, not secure key custody.

No production key, test key, certificate, root identity, trust bundle, or keychain identity was created. No host configuration, service, package, firmware, or repository checkout was changed during host inspection.

## 6. Next gate

SELFTOSYS must now define a hardware admission matrix that compares:
- Mac Secure Enclave for device-bound non-exportable signing and its actual recovery/administrative limits.
- A genuinely OURSELF-owned, physically controlled, dedicated HSM option.
- A multi-person custody and recovery design independent of endpoint administration.

Do not select a product or generate a production root until the threat model, administrative separation, recovery model, hardware identity, and custody evidence pass review.

## 7. Authority invariant

Hardware capability is not authority. A hardware-backed key is not automatically a sovereign root. SELFTOSYS admission requires OURSELF ownership, bounded roles, independently reviewable custody, tested recovery, and explicit founder authorization for the exact production ceremony.