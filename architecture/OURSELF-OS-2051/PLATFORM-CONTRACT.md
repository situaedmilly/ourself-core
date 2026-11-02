# OURSELF OS — Universal Platform Contract
**Document:** OURSELF-OS-PLATFORM-CONTRACT-v0.1  
**Status:** PROPOSED — NO PLATFORM CERTIFIED BY THIS DOCUMENT

## 1. Compatibility model

OURSELF OS uses a common constitutional and service contract with platform-specific adapters. It does not assume a common instruction set, firmware, kernel, driver model, security chip, or privilege model.

A platform is supported only at a declared deployment tier with evidence from that tier's conformance suite.

## 2. Deployment tiers

| Tier | Description | What OURSELF controls |
|---|---|---|
| T1 — Hosted Runtime | Service or process within an existing OS | OURSELF runtime boundary; host retains kernel and device authority |
| T2 — Isolated Environment | Dedicated VM, appliance, isolated OS environment | Guest environment within hypervisor and host constraints |
| T3 — Native OS | Direct boot with OURSELF-managed kernel and drivers | Explicitly supported hardware and boot chain |
| T4 — Distributed Node | Coordination across independently admitted nodes | Only capabilities granted to each node and network boundary |

A platform may support multiple tiers. Passing T1 does not imply T2 or T3 support.

## 3. Required adapter interfaces

Each adapter declares implementation status, version, privilege requirements, test coverage, failure behavior, and evidence source for:

1. Architecture discovery: ISA, word size, endianness, CPU features.
2. Boot and integrity: firmware mode, secure/measured boot availability, image verification.
3. Process isolation: process identity, sandbox, VM boundary, privilege separation.
4. Memory: allocation, limits, protection, paging, accelerator memory.
5. Storage: filesystem semantics, permissions, encryption, atomicity, durability, snapshots.
6. Devices: driver model, device identity, DMA and peripheral access controls.
7. Cryptography: supported algorithms, key storage, signing, verification, rotation.
8. Network: interfaces, routing, name resolution, transport, firewall policy, identity binding.
9. Time: monotonic clock, wall-clock source, synchronization, uncertainty.
10. Updates: signed artifacts, compatibility checks, staged rollout, rollback.
11. Recovery: known-good image, backup custody, restoration, post-recovery verification.
12. Observability: logs, metrics, audit events, independent witness integration.

Unsupported capabilities return an explicit UNSUPPORTED or DEGRADED disposition. An adapter must not simulate a security guarantee and present it as hardware enforcement.

## 4. Reference platform families

| Platform family | Initial deployment candidate | Important boundary |
|---|---|---|
| Apple macOS / Apple Silicon | T1, then evaluated T2 | Host macOS retains kernel and device control in T1; Secure Enclave is not a general-purpose arbitrary workload enclave |
| Linux ARM64 / Raspberry Pi | T1, T2 where supported, later selected T3 | Firmware, boot chain, kernel, drivers, and security capabilities vary by board |
| Linux x86-64 | T1, T2, later selected T3 | Hardware-backed attestation depends on exact CPU, firmware, and configuration |
| Windows | T1, then evaluated T2 | Windows retains host-kernel control in T1 |
| Heterogeneous accelerators | Adapter-specific | Accelerator access is not equivalent to general-purpose OS authority |
| Quantum or neuromorphic systems | Research adapter only | No assumed general-purpose OS, instruction, or security model |

This is a target matrix, not a statement that any listed platform has passed conformance.

## 5. Adapter manifest

Each platform implementation publishes a machine-readable manifest containing:

- schema: ourself.platform-adapter/v0.1
- exact vendor, family, architecture, hardware model, firmware and OS versions
- supported deployment tiers
- adapter name, version, source revision
- capability states for boot integrity, process isolation, memory, storage, devices, key protection, attestation, network, updates, and recovery
- enforcement attribution: OURSELF, host OS, hardware, external service, or operational procedure
- limitations and residual risks
- conformance suite version, result, and evidence references

All capability states default to UNSUPPORTED until observed and tested. Empty evidence references do not certify a capability.

## 6. Minimum conformance suite

- Verify platform and architecture identification.
- Validate adapter manifest against its schema.
- Test least privilege against a harmless protected resource.
- Prove unauthorized requests are rejected.
- Prove expired and revoked capabilities are rejected.
- Prove replayed requests are rejected where replay protection is required.
- Prove untrusted input cannot alter policy or trust roots.
- Verify workload isolation at the declared tier.
- Verify signed update acceptance and invalid-signature rejection.
- Exercise rollback and recovery in a disposable test environment.
- Verify receipt integrity and independent postcondition observation.
- Record unsupported guarantees and residual risks.

## 7. Support declaration

A platform support statement includes exact hardware model, firmware, OS/kernel version, adapter version, deployment tier, test-suite version, result, evidence references, and known limitations.

The words universal, secure, native, and certified are not implementation claims without corresponding evidence.
