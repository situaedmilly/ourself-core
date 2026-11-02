# OURSELF OS — Implementation Roadmap
**Document:** OURSELF-OS-ROADMAP-v0.1  
**Status:** PROPOSED — EXECUTION NOT AUTHORIZED BY THIS DOCUMENT

## Governing rule

Do not begin with a new kernel. First prove constitutional authority and evidence contracts in a bounded runtime. Preserve existing implementations and graft only after inspection, type mapping, and conformance review.

## Gate 0 — Architecture custody

**Deliverables**
- Reviewed constitution and platform contract.
- Architecture decision records for subsystem boundaries.
- Inventory of existing OURSELF components and repositories.
- Traceability matrix mapping existing components to responsibilities or recording them as unmapped.
- Explicit owner, version, status, and evidence references.

**Exit criteria**
- No duplicate authority roots or competing identity registries.
- No existing subsystem silently overwritten or renamed.
- Every proposed integration has a named owner and boundary.

## Gate 1 — Constitutional core

**Deliverables**
- Versioned request, decision, capability, and receipt schemas.
- Pure policy evaluator with deterministic test vectors.
- Capability scope, expiry, revocation, and replay semantics.
- Denial and quarantine dispositions.

**Exit criteria**
- Unauthorized, expired, revoked, malformed, and replayed requests are rejected.
- Policy changes cannot be self-authorized by a workload.
- Tests distinguish authorization from execution.

## Gate 2 — First hosted platform adapters

**Candidates**
- Existing Mac host as T1.
- Existing Raspberry Pi / Linux host as T1.

**Deliverables**
- Separate adapter manifests for exact observed platform versions.
- Shared conformance suite.
- Read-only inventory and non-destructive test harness.

**Exit criteria**
- Both platforms pass the same applicable contract tests.
- Unsupported host guarantees remain explicitly unsupported.
- No native-kernel or reboot-resilience claim is inferred from hosted runtime tests.

## Gate 3 — Independent witness and recovery

**Deliverables**
- Witness process or service separated from the executor.
- Signed, schema-validated receipts.
- Independent postcondition probes.
- Recovery snapshots and tested restoration workflow.

**Exit criteria**
- A compromised or stopped workload cannot rewrite witness custody.
- Recovery is demonstrated in a disposable test environment.
- Receipt creation is distinguished from effect verification.

## Gate 4 — Isolated sovereign environment

**Deliverables**
- VM/appliance image and provisioning contract.
- Isolated workload execution.
- Controlled virtual device and network access.
- Measured startup evidence where supported.

**Exit criteria**
- Isolation boundary and hypervisor assumptions are documented.
- Provisioning, revocation, update, and rollback tests pass.

## Gate 5 — Native OS research prototype

**Deliverables**
- Narrowly scoped hardware support list.
- Boot chain and kernel architecture decision.
- Driver strategy, storage model, process model, recovery design.
- Emulator and disposable-hardware test plan.

**Exit criteria**
- Boots only on explicitly supported hardware.
- Secure startup and recovery are independently tested.
- No production designation until native conformance passes.

## Gate 6 — Distributed sovereign network

**Deliverables**
- Node identity and admission protocol.
- Network trust and capability exchange.
- Independent node revocation and quarantine.
- Cross-node evidence correlation and recovery.

**Exit criteria**
- Connectivity does not imply admission.
- Node compromise does not automatically confer authority over peers.
- Cross-node actions have end-to-end receipts and independent effect observations.

## Gate 7 — Future substrate research

Investigate robotics, ambient computing, heterogeneous accelerators, neuromorphic systems, and quantum co-processors only through explicit adapter research. Do not assume these systems share a conventional OS execution model.

## Immediate next actions

1. Inspect existing ourself-core, OURPROCESSORSELF, SELFGRAPH, OURSELFMCP, Pipe|PORTAL, and daemon contracts.
2. Identify canonical identity, authority, evidence, and recovery roots.
3. Map existing artifacts to the subsystem table in the architecture README.
4. Write conformance tests for the highest-risk invariants before integrating runtimes.
5. Select Mac and Pi as initial T1 adapter candidates only after fresh platform inventory.

## Current status ledger

| Claim | Status |
|---|---|
| Architecture proposal written | DRAFTED |
| Constitutional enforcement implemented | NOT ESTABLISHED |
| Platform adapters implemented | NOT ESTABLISHED |
| Mac T1 conformance | NOT RUN |
| Pi T1 conformance | NOT RUN |
| Native OURSELF kernel | NOT IMPLEMENTED |
| Bootable OURSELF OS image | NOT IMPLEMENTED |
| Independent OS-level witness | NOT ESTABLISHED |
| 2051 cross-substrate compatibility | LONG-HORIZON OBJECTIVE |

This roadmap authorizes no host mutation, privilege change, deployment, reboot, kernel replacement, or production admission.
