# MORPH-SEMANTICS-001 · The Conditions Under Which a Change Earns the Name MORPH

**Stable ID:** `SELF-SPEC-01K3MMORPHSEMANTICS0010000`
**Display ID:** `MORPH-SEMANTICS-001`
**Entity Type:** `specification`
**Created At:** `2026-08-19`
**Created By:** operator directive `Reality shift, update OURSELF STORE ALL THIS NEW MATTER`
**Repository:** `situaedmilly/ourself-core`
**Canonical Path:** `specifications/MORPH-SEMANTICS-001.md`
**Status:** `CHAMBER_OPEN`
**Evidence Tier:** `Symbolic`
**Derived From:** `SELF-LAW-01JZXA0EVIDENCE000000000001`, `SELF-LAW-01JZXA0STABLEID00000000001`
**Supersedes:** none
**Superseded By:** `null`

---

## 0 · Scope and Standing

This chamber does **not** define what changes. It defines the conditions under which a
change earns the name **MORPH**.

Nothing in this document is `Verified` as operational behaviour. The whole specification is
`Symbolic` doctrine until an admissibility evaluator exists and is witnessed. Recording a law
is not enforcing it.

---

## 1 · MORPH as a Formal Transition Object

Candidate semantics:

```text
M : (S_i, C, P, A) -> (S_j, Delta, W)
```

| Symbol  | Reading                                          |
|---------|--------------------------------------------------|
| `S_i`   | prior established state                          |
| `C`     | interpretation context                           |
| `P`     | proposed transition                              |
| `A`     | authority applicable to that transition          |
| `S_j`   | resulting observed state                         |
| `Delta` | witnessed distinction between states             |
| `W`     | witness / lineage establishing what occurred     |

**Not every invocation of that function is a lawful MORPH.** The function is the mechanism.
Admissibility is the law.

---

## 2 · The Admissibility Predicate

```text
MORPH(T)
  iff
      SOURCE_STATE_RESOLVED
    & TARGET_TRANSITION_TYPED
    & CONTEXT_BOUND
    & PRECONDITIONS_SATISFIED
    & SELECTION_STANDING_VALID                    [guarded: where required]
    & AUTHORITY_VALID                             [guarded: where effectful]
    & SUBJECT_SCOPE_BOUND
    & EFFECT_OBSERVED_OR_EXPLICITLY_NOT_OBSERVABLE
    & WITNESS_VALID
    & RESULTING_STATE_DISTINGUISHED
    & LINEAGE_PRESERVED
```

### 2.1 The guarded conjuncts are not optional — they are context-indexed

`MORPH(T)` is **not a flat predicate**. Two conjuncts carry guards:

```text
SELECTION_STANDING_VALID   where required
AUTHORITY_VALID            where effectful
```

A guard that is itself untyped is an implicit semantic cast entering through the back door: a
transition could evade `AUTHORITY_VALID` merely by being classified `non-effectful` without
anyone having to justify that classification.

**Therefore the guards are themselves typed obligations.**

```text
required(T)  : a SELECTION_REQUIREMENT judgement, typed SELECTION, carrying its own witness
effectful(T) : an EFFECT_CLASSIFICATION judgement, typed OBSERVATION, carrying its own witness
```

Discharging a guard is an act with standing. An undischarged guard resolves to
`GUARD_UNRESOLVED`, and `GUARD_UNRESOLVED` is **not** equivalent to `guard false`.

```text
GuardFalse  !=  GuardUnresolved
```

### 2.2 The observability escape hatch must carry its own witness

`EFFECT_OBSERVED_OR_EXPLICITLY_NOT_OBSERVABLE` correctly admits a MORPH whose effect cannot
be observed. Without further constraint this hatch swallows the specimen set: specimen M-03
(authorised operation, no observed effect) and specimen M-06 (effect observed, no authorised
transition) can both be re-described as observability failures.

**Therefore `NOT_OBSERVABLE` is a claim requiring its own evidence:**

```yaml
non_observability_witness:
  stable_id:
  reason_class:        # NO_INSTRUMENT | OUT_OF_SCOPE | DESTROYED_BEFORE_READ |
                       # PRIVACY_BOUNDED | SUBSTRATE_OPAQUE | REGISTRAR_UNAVAILABLE
  attempted_observation_refs: []
  observer_ref:
  bounded_until:       # when the non-observability claim expires and must be re-established
  evidence_tier:       # never Verified on the effect itself; only on the attempt
```

Declaring an effect unobservable never upgrades the effect. It records that the system looked
and states what stopped it.

```text
NotObserved  !=  NotObservable
NotObservable  !=  EffectEstablished
```

---

## 3 · The Standing Ladder

```text
TransitionOccurred   !=   MORPHEstablished
```

Reality can change without OURSELF possessing enough evidence to lawfully call that change a
MORPH.

```text
MORPHProposed != MORPHExecuted != MORPHWitnessed != MORPHAdjudicated
```

Each arrow is a separate act with separate authority, separate evidence, and separate failure
modes. No stage implies its successor. No stage may be inferred backwards from its successor
without the successor's own lineage.

---

## 4 · The Semantic Type Plane

Ordinary schema systems validate `string`, `integer`, `boolean`, `enum`, `object`. OURSELF
requires a second plane:

```text
DECLARATION
CLAIM
OBSERVATION
DISTINCTION
SELECTION
AUTHORIZATION
OPERATION
EFFECT
EVIDENCE
ADJUDICATION
STANDING
```

### 4.1 Non-promotion rules

The relation `X !<= Y` reads: *this semantic type cannot be implicitly promoted into the
other.*

```text
DECLARATION     !<=  AUTHORIZATION
OBSERVATION     !<=  VERDICT
EFFECT          !<=  SUCCESS
RECONCILIATION  !<=  CANONICALITY
CLAIM           !<=  EVIDENCE
SELECTION       !<=  AUTHORIZATION
OPERATION       !<=  EFFECT
EVIDENCE        !<=  ADJUDICATION
CAPABILITY      !<=  ADMISSIBILITY
PROJECTION      !<=  STATE
```

### 4.2 The implementation-level law

**Stable ID:** `SELF-LAW-01K3MNOIMPLICITSEMCAST0000`

> **No implicit semantic casts across jurisdiction boundaries.**

A field may not silently cast `SelectionDecision -> Authorization` any more than a strongly
typed language should silently cast an incompatible runtime object.

An explicit cast is permitted **only** as a named, witnessed promotion act carrying its own
stable ID, its own authority, and its own evidence tier. The promotion act is Matter. The
promotion is never a property of the field.

This makes the jurisdiction constitution executable as a **non-coercive type system**.

---

## 5 · MORPH as a Typed Edge

In SELFGRAPH4REALITY a MORPH is not the generic edge

```text
STATE-A  --changed_to-->  STATE-B
```

It is a contracted edge, and **the edge itself is Matter**. See
`schemas/morph.v1.yaml` (`SELF-SCHEMA-01K3MMORPHEDGE000000000000`).

```text
EndpointsExist  !=  TransitionEstablished
```

Seeing two states does not establish the transition joining them. This generalises the earlier
relation-Matter discovery: `source_state + target_state != MORPH`.

---

## 6 · Forward and Reverse Transduction Are Asymmetric

**Forward · realization**

```text
S_t --M--> R_{t+1}
representation -> interpretation -> candidate -> selection -> authorization -> operation -> effect
```

**Reverse · institutional realization**

```text
R_{t+1} --W--> S_{t+1}
realized state -> observation -> witness -> evidence -> distinction -> adjudication -> symbolic standing
```

These are **not inverses**.

```text
W  !=  M^-1
```

Reality cannot generally be reconstructed from its symbolic witness, and executing a symbolic
specification does not guarantee the exact intended reality.

The ouroboros is not perfect reversibility. It is **governed recursive transduction with
information loss, uncertainty, and witness boundaries**. This is the strictly stronger claim,
because it is falsifiable.

---

## 7 · SELFSHIFT Is Not Delta

The minus sign stays symbolic unless a domain supplies an actual difference operator.

```text
Delta_R    = Distinguish(R_t, R_{t+1})
SELFSHIFT  = Materiality(Delta_R, C)
```

```text
Delta  !=  SELFSHIFT
```

A state difference can be real and institutionally immaterial. As WOMBSELF exposed,
materiality can change **while the underlying observation does not**, because context changed.
Materiality is therefore a function of `(Delta, C)` and must be re-evaluated when `C` moves —
a re-evaluation that is itself an act with standing.

---

## 8 · EVENT · Corrected Definition

The prior candidate — *a witnessed claim that a state transition occurred* — is too narrow. It
cannot type:

```text
AUTHORIZATION_GRANTED
SELECTION_RETRACTED
WITNESS_FAILED
REGISTRAR_UNAVAILABLE
```

each of which describes an institutional occurrence without asserting an external effect
transition.

**Adopted definition:**

> An **EVENT** is an addressable claim that an occurrence or state transition happened,
> carrying enough provenance to determine its epistemic standing.

Contract: `schemas/event.v1.yaml` (`SELF-SCHEMA-01K3MEVENTCLAIM00000000000`).

```text
EventEmitted  !=  OccurrenceEstablished
```

Events are addressable claims, never automatic truth.

---

## 9 · SELFREALIZATION as Semantic IR

The long-term object is not *YAML that generates interfaces*. It is a substrate-neutral
semantic intermediate representation from which interfaces, APIs, agents, execution plans, and
witness surfaces are **projected**.

```text
SELFREALIZATION IR
        |
        +-- HTML projection
        +-- mobile projection
        +-- CLI projection
        +-- API projection
        +-- agent projection
        +-- spatial projection
        +-- machine execution projection
```

Preserved under projection:

```text
Projection            !=  UnderlyingSemanticState
ProjectionCapability  !=  MutationAuthority
```

HTML becomes one emitter over semantic reality, not the ontology. The earlier HTML Alchemy
direction is enlarged, not invalidated.

---

## 10 · The Four Adversarial Questions

The chamber is closed only when all four are answered against the specimen set. **No runtime
is to be built before then.**

1. **Typing** — what source and target semantic types may a MORPH connect?
2. **Admissibility** — what preconditions make the transition structurally eligible?
3. **Realization** — what distinguishes proposed transition from actual effect?
4. **Establishment** — what evidence is sufficient to say the MORPH occurred?

Specimens M-01 … M-07: `specifications/specimens/MORPH-ADMISSIBILITY-SPECIMENS.md`
(`SELF-SPECIMEN-01K3MMORPHM01M070000000000`).

---

## 11 · The Compression Laws

**Stable ID:** `SELF-LAW-01K3MREPRNOTREALIZED000000`

> **No representation acquires the standing of realized state merely by representing it.**

**Stable ID:** `SELF-LAW-01K3MWITNESSCEILING0000000`

> **No realized state acquires greater symbolic standing than its witnesses establish.**

Between them sits MORPH. Not as magic. Not as description. As the typed constitutional
crossing between symbolic possibility and witnessed consequence.

### Deepest candidate definition

> **OURSELF is the governed continuity of typed transformations between represented state and
> realized state.**

Tight enough to formalize, implement, hostile-test, and falsify.

---

## 12 · Open Questions Carried Forward

| ID    | Question                                                                                          | Tier        |
|-------|---------------------------------------------------------------------------------------------------|-------------|
| Q-01  | Is `LINEAGE_PRESERVED` decidable without a total order over prior MORPHs?                          | Speculative |
| Q-02  | May a `GUARD_UNRESOLVED` MORPH ever reach `MORPHWitnessed`, or does it halt at `MORPHExecuted`?    | Speculative |
| Q-03  | Does the promotion act in §4.2 require a distinct authority class from the MORPH it enables?       | Speculative |
| Q-04  | Does §2.2's `bounded_until` create an expiry that can retroactively demote an established MORPH?   | Speculative |
| Q-05  | Do stable IDs require Crockford base32? Existing canon uses `I`/`O`, which Crockford excludes.     | Unwitnessed |

Open questions are recorded, not resolved. Resolving one requires its own witnessed mutation.
