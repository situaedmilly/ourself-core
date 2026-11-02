# OURSELF OPERATING SYSTEM
## Universal Sovereign Computing Architecture

**Architecture ID:** OURSELF-OS-2051  
**Version:** 0.1.0  
**Status:** PROPOSED ARCHITECTURE — NOT AN IMPLEMENTED OPERATING SYSTEM

## Mission

OURSELF OS defines a common sovereignty architecture for compatible computational devices. It establishes how ownership, node identity, policy, authority, execution, evidence, memory, communication, updates, and recovery relate across different hardware and native operating systems.

Platform independence means a shared constitutional contract implemented through platform-specific adapters. It does not mean one binary can execute on every computer.

## Governing principle

> The owner governs the reality. The constitution defines permitted operations. The runtime performs only authorized work. An independent witness establishes what happened.

Hardware supplies resources. A kernel or host operating system manages those resources. OURSELF authority determines which governed operations may be admitted. A distinct witness records evidence. Recovery restores a known-good state through independently controlled procedures.

## Architecture layers

1. Owner and constitutional root — ownership, identity roots, policy, jurisdiction, delegation, revocation.
2. Independent authority plane — evaluates requests against policy and issues scoped capabilities.
3. Trust and defense fabric — integrity validation, isolation, threat detection, quarantine, controlled mutation.
4. Cognitive and application plane — models, agents, services, applications, user experiences.
5. Execution plane — host OS, native OURSELF kernel, virtual machine, or constrained runtime.
6. Hardware abstraction — CPU, memory, storage, accelerators, network, sensors, peripherals.
7. Independent witness and recovery — evidence custody, postcondition verification, rollback, restoration.

## Required logical subsystems

| Subsystem | Responsibility |
|---|---|
| OWNERSELF | Owner identity and root-of-trust establishment |
| CONSTITUTIONSELF | Policy, invariants, jurisdiction, delegation, revocation |
| NODESELF | Stable node identity and observed posture |
| BOOTSELF | Boot chain and startup integrity |
| KERNELSELF | Process, memory, scheduling, storage, device management |
| AUTHORITYSELF | Independent authorization decisions |
| CAPABILITYSELF | Scoped, expiring, revocable capabilities |
| OURSELFMCP | Typed capability and service communication |
| MODELSELF | Provider-neutral cognitive substrate |
| MEMORYSELF | Governed persistence, provenance, retention |
| NETWORKSELF | Addressing, transport, discovery, trust, admission |
| ALCHEMYSELF | Defensive inspection, isolation, validation, mutation controls |
| WITNESSSELF | Independent evidence and effect verification |
| RECOVERYSELF | Rollback, restoration, failover, continuity |
| UPDATESELF | Signed updates, compatibility, controlled rollout |
| INTERFACESELF | Human interaction, accessibility, presentation |

These are architectural responsibilities, not a requirement for sixteen separate processes. Separation must be enforced through explicit trust boundaries, scoped permissions, and independently testable contracts.

## Deployment modes

- **Sovereign Runtime:** OURSELF operates inside an existing OS.
- **Sovereign Environment:** OURSELF controls a dedicated VM, appliance image, or isolated environment.
- **Native OURSELF OS:** OURSELF boots directly on explicitly supported hardware and manages hardware through its own kernel and drivers.

A hosted runtime must not claim to replace its host kernel or control hardware that remains under host-OS authority.

## Certification law

DECLARED → LOCATED → OBSERVED → VERIFIED → ADMITTED → EXECUTED → EFFECT_WITNESSED

Each transition requires its own evidence. A process launch does not prove service health; a successful command does not prove an external effect; a receipt does not independently prove the effect it describes.

## Existing OURSELF systems

Existing repositories, daemons, runtimes, bridges, and protocols are implementation candidates only. Each must be inspected and mapped before integration. This document does not rename, replace, or certify OURPROCESSORSELF, OURSELFMCP, Pipe|PORTAL, OURSELFDAEMON, SELFGRAPH, or any other existing component.

## Documents

- [Constitution](CONSTITUTION.md)
- [Platform Contract](PLATFORM-CONTRACT.md)
- [Implementation Roadmap](ROADMAP.md)

## First acceptance gate

Review the constitutional contract, map existing implementations without duplication, and define conformance tests before authorizing runtime or kernel mutations.

## Parent authority doctrine

**OSOS is the parent architectural and constitutional authority.** It is not a synonym for OURSELF ECOSYSTEM, OURSELFDAEMON, OURPROCESSORSELF, or a Linux-based runtime. Those are governed ecosystems, services, implementation candidates, or execution environments beneath OSOS.

The governing model is:

> One constitutional root. Multiple platform-specific execution environments. Independently evaluated authority. Independently witnessed effects. Recoverable continuity.

A Raspberry Pi running Linux may be an OSOS-governed node. It is not thereby a Native OURSELF OS installation. A hosted deployment remains subordinate to the host kernel and the host's hardware-control boundary.

### Owner authority

Owner authority must be established by an explicit enrollment procedure bound to a protected owner root key and proof-of-possession challenge. Physical possession, username, local account, device registration, session, or successful login alone is insufficient. Enrollment must define key custody, delegated operational keys, rotation, revocation, and recovery. Private key material must never be copied into architecture documentation, registries, or receipts.

### Witness independence

A witness is independent only to the extent that:
- its signing keys are not controlled by the executor;
- its process and privilege boundary are separated from the workload being witnessed;
- the executor cannot rewrite, suppress, or substitute the evidence channel;
- the observation method and its claim ceiling are explicit;
- compromise and collusion assumptions are documented.

A separate source file or process name is not sufficient evidence of independence. If these properties are not demonstrated, the witness must be classified as coupled or independence-not-established.

### Root custody

The canonical physical/document root remains pending until Mac and Pi workspaces, repository custody, doctrine versioning, and distribution are reconciled. The current GitHub document set is a versioned architecture proposal, not yet a ratified permanent canonical root.

- [Initial Mac/Pi root reconciliation](ROOT-RECONCILIATION-2026-11-02.md)
- [Initial subsystem registry](SUBSYSTEM-REGISTRY.yaml)
