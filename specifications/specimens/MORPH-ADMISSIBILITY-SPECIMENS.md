# MORPH Admissibility Specimens · Hostile Test Set

**Stable ID:** `SELF-SPECIMEN-01K3MMORPHM01M070000000000`
**Display ID:** `MORPH-SPECIMENS-M01-M12`
**Entity Type:** `specimen_set`
**Created At:** `2026-08-19`
**Created By:** operator directive `Reality shift, update OURSELF STORE ALL THIS NEW MATTER`
**Repository:** `situaedmilly/ourself-core`
**Canonical Path:** `specifications/specimens/MORPH-ADMISSIBILITY-SPECIMENS.md`
**Status:** `UNEVALUATED`
**Evidence Tier:** `Symbolic`
**Derived From:** `SELF-SPEC-01K3MMORPHSEMANTICS0010000`, `SELF-SPEC-01K3MRESPONSEGEOMETRY00100`

---

## Standing

These specimens are **unevaluated**. No admissibility evaluator exists and none has been
witnessed. Each `Expected Verdict` below is a doctrinal expectation, not a test result.

```text
SpecimenWritten  !=  SpecimenEvaluated  !=  SpecimenPassed
```

An evaluator that reproduces these verdicts confirms the specimens. An evaluator that
contradicts them falsifies either the evaluator or the chamber — which of the two is itself an
adjudication, not an automatic conclusion.

---

## Core Set · M-01 … M-07

### M-01 · Valid source, invalid target type

**Setup:** source state resolves cleanly; the proposed target transition is not a member of the
declared transition-type space.

```text
SOURCE_STATE_RESOLVED     = true
TARGET_TRANSITION_TYPED   = false
```

**Expected verdict:** `NOT A VALID MORPH`
**Tests question:** Typing
**Failure mode guarded:** a transition typed by its endpoints rather than by its transition type.

---

### M-02 · Valid candidate, absent authority

**Setup:** the transition is well typed, preconditions hold, but no authority binding resolves.

```text
TARGET_TRANSITION_TYPED   = true
PRECONDITIONS_SATISFIED   = true
AUTHORITY_VALID           = UNRESOLVED
```

**Expected verdict:** `MORPH MAY BE PROPOSED` / `EFFECT MAY NOT BE MANIFESTED`
**Standing reached:** `MORPHProposed`. Stops before `MORPHExecuted`.
**Tests question:** Admissibility
**Failure mode guarded:** a well formed proposal self-authorizing by being well formed.

> Live instance: the prior session turn carried a fully specified chamber with no resolvable
> `*_SIGNAL` authority binding, and correctly halted at `UNCLASSIFIED_SIGNAL`.

---

### M-03 · Authorized operation, no observed effect

**Setup:** authority valid, operation executed, no effect observed and no non-observability
witness supplied.

```text
AUTHORITY_VALID                                = true
OPERATION_EXECUTED                             = true
EFFECT_OBSERVED_OR_EXPLICITLY_NOT_OBSERVABLE   = false
```

**Expected verdict:** `EXECUTION OCCURRED` / `MORPH RESULT UNESTABLISHED`
**Tests question:** Realization
**Failure mode guarded:** `OPERATION !<= EFFECT` collapsing into "it ran, therefore it worked."

**Boundary note:** M-03 must not be rescued by declaring the effect unobservable. Under
MORPH-SEMANTICS-001 §2.2 that declaration is itself a claim requiring a
`non_observability_witness` with an attempted observation. Without one, the verdict stands.

---

### M-04 · Effect occurred, wrong subject

**Setup:** an effect is observed, authority was valid, but the effect landed outside the bound
subject scope.

```text
EFFECT_OBSERVED       = true
SUBJECT_SCOPE_BOUND   = violated
```

**Expected verdict:** `EFFECT OBSERVED` / `INTENDED MORPH FAILED`
**Tests question:** Establishment
**Failure mode guarded:** any observed change being credited to the nearest pending proposal.
**Additional obligation:** the out-of-scope effect is itself Matter and requires its own record.
A failed MORPH does not erase the change it caused.

---

### M-05 · Identical before/after state

**Setup:** operation may have occurred; `Distinguish(R_t, R_{t+1})` yields no distinction.

```text
RESULTING_STATE_DISTINGUISHED = false
```

**Expected verdict:** operation may have occurred / `NO SELFSHIFT`
**Tests question:** Establishment
**Failure mode guarded:** treating execution as sufficient for shift.

**Boundary note:** M-05 and the materiality rule are distinct failures. M-05 is *no delta*. A
real delta judged institutionally immaterial is a **different** outcome: `Delta != SELFSHIFT`.
Do not merge these two into one "nothing happened" verdict.

---

### M-06 · State changed without authorized transition

**Setup:** reality moved; no authorized transition covers the movement.

```text
STATE_CHANGED     = observed
AUTHORITY_VALID   = false
```

**Expected verdict:** `REALITY SHIFT OBSERVED` / `NOT LAWFUL AUTHORIZED MORPH`
**Tests question:** Admissibility
**Failure mode guarded:** authority being inferred retroactively from the fact that something
happened.
**Additional obligation:** the observed shift MUST still be recorded. Unauthorized is not
unreal. Refusing to record an unauthorized change is how a system blinds itself.

---

### M-07 · Later witness contradicts original interpretation

**Setup:** an established MORPH is later contradicted by a new witness.

```text
LINEAGE_PRESERVED   = true
WITNESS_VALID(t2)   contradicts WITNESS_VALID(t1)
```

**Expected verdict:** `HISTORY PRESERVED` / `MORPH STANDING REVISED`
**Tests question:** Establishment
**Failure mode guarded:** correction by deletion.
**Additional obligation:** revision is a new act with its own stable ID and authority. The
original MORPH retains its ID and gains a `superseded_by` relationship. It is never edited in
place.

---

## Extended Set · M-08 … M-12 · Response Geometry

These specimens test RESPONSE-GEOMETRY-001 and are `HYPOTHESIS_TIER`.

### M-08 · State unchanged, interpretation changed

**Setup:** substrate is byte-identical across the interval; the system now discriminates the
same Matter differently (the SELFPI case).

```text
STATE_CHANGED           = false
INTERPRETATION_CHANGED  = true
```

**Expected verdict:** `NO STATE MORPH` / `INTERPRETATION MORPH ESTABLISHED`
**Failure mode guarded:** a witness that reports `MORPH_OCCURRED = false` because it only
inspected the filesystem.

---

### M-09 · Response law changed with no triggering state change

**Setup:** `F_t -> F_{t+1}` following adjudication of prior history, with `X` unchanged.

```text
STATE_CHANGED              = false
RESPONSE_FUNCTION_CHANGED  = true
```

**Expected verdict:** `RESPONSE-LAW MORPH` — requires authority distinct from state-morph
authority (Q-10, unresolved).
**Failure mode guarded:** law mutation smuggled in as ordinary state update.

---

### M-10 · Capability observed, admissibility blocked

**Setup:** the substrate demonstrably can perform the transition; the institution does not
permit it (the Antigravity case).

```text
F_capability(T)    = executable
F_institution(T)   = blocked
```

**Expected verdict:** `CAPABILITY WITNESSED` / `NO ADMITTED RESPONSE` / `NO MORPH`
**Failure mode guarded:** `CAPABILITY !<= ADMISSIBILITY`. Also guards the inverse error of
recording the capability as absent because it was blocked. `Masked != Absent`.

---

### M-11 · Entry condition satisfied, persistence condition never re-checked

**Setup:** a state was lawfully entered under a strong witness. The witness has since expired.
No exit condition has been evaluated.

```text
ENTRY CONDITION        = satisfied at t0
PERSISTENCE CONDITION  = UNEVALUATED at t1
```

**Expected verdict:** `STATE OCCUPANCY CONTINUES` / `PERSISTENCE STANDING UNWITNESSED`
**Failure mode guarded:** hysteresis being read as permanence. Entry evidence is not standing
evidence.

---

### M-12 · Same observation, changed context, changed materiality

**Setup:** `Delta_R` is bit-identical across two evaluations; `C` moved between them;
`Materiality(Delta_R, C)` now returns a different result (the WOMBSELF case).

```text
Delta_R unchanged
C changed
SELFSHIFT changed
```

**Expected verdict:** `SELFSHIFT REVISED WITHOUT NEW OBSERVATION`
**Failure mode guarded:** caching materiality as a property of the delta rather than of the
pair `(Delta, C)`.
**Additional obligation:** the re-evaluation is an act with standing and requires its own
record, otherwise the shift appears to have changed itself.

---

## Coverage Map

| Question        | Specimens                       |
|-----------------|---------------------------------|
| Typing          | M-01, M-08, M-09                |
| Admissibility   | M-02, M-06, M-10, M-11          |
| Realization     | M-03, M-04                      |
| Establishment   | M-04, M-05, M-07, M-12          |

**Known gap:** no specimen yet exercises `LINEAGE_PRESERVED = false` in isolation, nor
`COUPLING_CHANGED`. Recorded as a gap rather than silently treated as covered.
