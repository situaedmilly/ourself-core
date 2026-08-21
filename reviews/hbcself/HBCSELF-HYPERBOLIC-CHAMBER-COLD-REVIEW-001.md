# HBCSELF-HYPERBOLIC-CHAMBER-COLD-REVIEW-001

**Stable ID:** `SELF-REVIEW-01K3MHBCCOLDREVIEW00100000`
**Gate ID:** `SELF-GATE-01K3MHBCCOLDREVIEWGATE0100`
**Entity Type:** `cold_review`
**Created At:** `2026-08-19`
**Authorizing Command:** `AUTHORIZE_HBCSELF_HYPERBOLIC_RESPONSE_GEOMETRY_COLD_REVIEW_AND_EQUATION_CHAMBER_01`
**Controlling Signal:** `FOUNDATION_SIGNAL` (boot rule 9 — grants no mutation authority)
**Authority Provenance:** `DIRECTIVE_DERIVED` (weaker than marker-derived)
**Repository:** `situaedmilly/ourself-core`
**Status:** `COMPLETE`
**Evidence Tier:** `Symbolic` (mathematical analysis; no empirical run witnessed)

> This gate does not exist to prove the founder right.

---

## TERMINAL VERDICT

```text
B = COHERENT_AFTER_SPEC_REPAIR
```

**Verdict ID:** `SELF-VERDICT-01K3MHBCCOLDREVIEW00100000`

| Metric                      | Value |
|-----------------------------|-------|
| `PROPOSITIONS_REVIEWED`     | 40 |
| `EQUATIONS_REVIEWED`        | 17 |
| `COUNTEREXAMPLES_GENERATED` | 26 |
| `CATEGORY_COLLAPSES_FOUND`  | 9 |
| `UNIDENTIFIABLE_VARIABLES`  | 7 (of 16 examined) |
| `NOVEL_SEMANTIC_RESIDUE`    | 6 |
| `EXISTING_PRIMITIVES_REUSED`| 6 |
| `NEW_PRIMITIVE_REQUIRED`    | `UNRESOLVED` — leaning **NO** (see §H) |

**Not `A`**, because nine category collapses must be repaired before any equation is executed;
three of them are symbol collisions that would silently corrupt a simulator.

**Not `C`**, because no collapse reaches the foundation. Every defect found is a notation,
scoping, or identifiability defect, and each has a stated repair.

**Not `D`**, because the model families *are* distinguishable — but only inside a simulator,
where ground truth is authored. From black-box witness data alone several of them are **not**
distinguishable, which is finding F-02 and is the single most important result of this review.

---

## §A · Intake Classification

| Item | `SOURCE_CLASS` | `EPISTEMIC_STATE` |
|------|----------------|-------------------|
| P-01 … P-40 | `SYMBOLIC_MODEL` / `HYPOTHESIS` | `DERIVED` mostly; `OBSERVED` for P-11, P-18, P-37, P-38 |
| E-01 … E-17 | `EQUATION` | `HYPOTHETICAL` |
| ResponseGeometry candidate | `HYPOTHESIS` | `HYPOTHETICAL` |
| The word "hyperbolic" | `SYMBOLIC_MODEL` | `UNKNOWN` until §I |

Raw Matter preserved verbatim in the proposition ledger
(`SELF-LEDGER-01K3MHBCPROPLEDGER00100000`). Contradictions are recorded, not normalized.

---

## §B · The Nine Category Collapses

These are the repairs that make the verdict `B` rather than `A`.

### CC-01 · `A_t` is both an argument of `F` and a separate operator

```text
E-01:  R_t = F_t(S_t, X_t, C_t, A_t)          authority INSIDE the response law
E-17:  R_capability --A_t/admissibility--> R_admitted   authority OUTSIDE it
```

**These cannot both hold.** If `A_t` is an argument of `F`, there is no capability response to
mask — `F` never produces the inadmissible output, and P-11 (`CAPABILITY != ADMITTED`) becomes
unrepresentable. If `A_t` is a separate operator, E-01's signature is wrong.

**Severity:** structural. **Repair R-01:** drop `A_t` from E-01. Canonical form becomes
`R_capability_t = F_t(S_t, X_t, C_t)` with admissibility applied downstream as in E-17. E-17
wins; E-01 is amended.

### CC-02 · Symbol `S` means two different things

`S` = signal/perturbation in E-01 … E-14 and E-17. `S` = state in E-15
(`M = (I,C,S,P,A) -> (S',Δ,W)`) and in MORPH-SEMANTICS-001 §1 (`S_i`, `S_j`).

**Severity:** high — a simulator implementing both would type-check and be wrong.
**Repair R-02:** rename state to `X` throughout the MORPH object: `M = (X_i, I, C, P, A) -> (X_j, Δ, W)`.

### CC-03 · Symbol `O` is both an operator and its output; `W` likewise

```text
E-03:   O_t = O(R_t, ΔX_t)         O_t is the OUTPUT, O is the operator
E-04:   J_t = J(O_t, W_t, A_t)     O_t as output, W_t separate
E-17:   ΔX_t --O_t--> W_t          O_t is now the OPERATOR, W_t the output
```

E-03 and E-17 disagree about what `O_t` denotes, and E-04 takes both an observation and a
witness as if they were independent when E-17 derives one from the other.

**Severity:** high. **Repair R-03:** fix `obs_t` as the operator, `O_t` as its output,
`W_t = attest(O_t, observer, modality)` as a distinct attestation step. Then
`J_t = J(W_t, A_t)` — `O_t` reaches adjudication only through `W_t`, which is the intended law
(`OBSERVATION !<= VERDICT`).

### CC-04 · Two incompatible interpretation laws

```text
P-03:  I_t = I(S_t, X_t)
E-02:  I_t = I_t(S_t, X_t, C_t, H_t)
```

**Severity:** medium. **Repair R-04:** adopt E-02, demote P-03 to a restricted case with the
explicit assumption `C, H ⊆ X`. Also: E-02 writes `I_t` on both sides — the function and its
value share a symbol. Write `I_t = 𝔦_t(S_t, X_t, C_t, H_t)`.

### CC-05 · `X` versus `H` are not independent

If `X_t` is Markov-sufficient, `H_t` is redundant and E-02/E-12 are over-parameterized. If
`H_t` is a genuine argument, `X_t` is not sufficient and E-01 is under-specified. E-01 and E-02
take opposite positions.

**Severity:** structural — this is an identifiability defect, not just notation.
**Repair R-05:** declare `X` **non-Markov by construction** and carry `H` explicitly. This is
required anyway by hysteresis (§C, attack 6). Then E-01 must read
`R_capability_t = F_t(S_t, X_t, C_t, H_t)`.

### CC-06 · "topology" is not a topology

P-26 and E-16 use `PROJECTED_EFFECT_TOPOLOGY` / `OBSERVED_EFFECT_TOPOLOGY`. No open sets, no
neighbourhood system, no continuity claim is present. The object described is a **reachability
set** or **effect dependency graph**.

**Severity:** terminology, but §F of the workflow law forbids exactly this.
**Repair R-06:** rename to `PROJECTED_EFFECT_REACHABILITY_SET` / `OBSERVED_EFFECT_REACHABILITY_SET`,
or mark "topology" `METAPHORICAL_SYNTHESIS` explicitly. Do not leave it unmarked.

### CC-07 · `χ = ∂R/∂S` is worst exactly where sensitivity matters most

For the threshold model E-14 (`S < Θ ⇒ R_0`, `S ≥ Θ ⇒ R_1`):

```text
∂R/∂S = 0        almost everywhere
∂R/∂S undefined  at S = Θ
```

The derivative is **zero precisely where the system is insensitive and undefined precisely
where it is maximally sensitive**. Naïve use of E-09 reports "this system is completely
insensitive to signal" about a system that flips state on an arbitrarily small perturbation.
This is close to the opposite of the intended meaning.

**Severity:** high — this is the review's clearest mathematical falsification of a notation.
**Repair R-07:** E-09/E-10/E-11/E-12 are `NOTATION_ONLY` for any non-smooth family. Per model
class the permitted instrument is:

| Model family | Permitted sensitivity instrument |
|---|---|
| 1 linear, 5 saturation, 8 adaptive | derivative / Jacobian (smooth) |
| 3 threshold, 4 hysteresis, 15 discontinuous | **threshold crossing rate**, distance-to-boundary `‖S − Θ(X)‖`, local perturbation response over a finite ε-ball |
| 7 stochastic | `∂E[R]/∂S`, or transition probability `P(R' \| S, X)` — never the pathwise derivative |
| 6 delayed | sensitivity is a *functional* of the signal history, not a partial derivative at `t` |

### CC-08 · Minting `ResponseGeometry` violates the chamber's own law

Every field of the candidate is a `_ref`. It stores nothing of its own. It is a **view**. The
chamber's own MORPH-SEMANTICS-001 §9 states `Projection != UnderlyingSemanticState` and the
type plane records `PROJECTION !<= STATE`.

**Minting a derived view as stored state is the exact collapse the doctrine forbids.**
See §H. **Repair R-08:** do not mint. Define it as a computed projection or not at all.

### CC-09 · The self-modification ladder has no observable joints

P-27 → P-30 and P-05's six levels assert five successive non-equalities. Levels 4–6 (adaptive
response / response-function mutation / recursive self-modification) are **not separable from
black-box observation** — see finding F-02.

**Severity:** structural for any claim to *witness* a level.
**Repair R-09:** the ladder is retained as a **model-internal** taxonomy with an explicit
observability caveat: a level may be *authored* in simulation and *asserted* about a white-box
system, but MUST NOT be *witnessed* from trajectory data alone without a stated structural
assumption.

---

## §C · Attack Results Summary

Full per-item results: `HBCSELF-EQUATION-CONFORMANCE-MATRIX-001.md` and the counterexample
corpus. Headline outcomes from the 20 mandated attacks:

| Attack | Most damaging result |
|--------|----------------------|
| 1 · constant response | Bounds P-04 to an existential claim. Does **not** refute it ("may produce"). Refutes any reading of P-04 as universal. |
| 2 · memoryless | Refutes E-01 as written for hysteretic systems → CC-05. |
| 3 · stateless | Collapses P-03/E-02: with no `X`, interpretation morph is unrepresentable. Bounds the taxonomy's domain. |
| 4 · stochastic | Refutes E-09 pathwise. Survives with `∂E[R]/∂S`. |
| 5 · delayed | Refutes E-01's instantaneous signature; sensitivity becomes a functional. |
| 6 · hysteretic | Confirms P-23 (entry/persistence/exit) as **required**, not optional. Strongest confirmation in the set. |
| 7 · multi-stable | Refutes any claim that `X_{t+1}` is a function of `(S_t, X_t)` alone without basin labels. |
| 8 · saturating | Bounds E-09: `χ → 0` at saturation while the system remains fully responsive below it. |
| 9 · discontinuous | CC-07. |
| 10 · partially observable | **F-01, F-02, F-03** below. The most productive attack in the set. |
| 11 · adversarial observer | Confirms P-15 (`RAW WITNESS INTEGRITY != SEMANTIC VALIDITY`). |
| 12 · invalid method / correct conclusion | Confirms P-16. Independent axes established. |
| 13 · valid method / false hypothesis | Confirms P-16's converse; both axes needed in `schemas/event.v1.yaml`. |
| 14 · capable-but-unauthorized | Confirms P-11, P-13. Produces **F-04**. |
| 15 · authorized-but-incapable | Confirms P-13's converse. Refutes any model where authority implies executability. |
| 16 · multi-observer modality | Confirms P-35. PEEP required. |
| 17 · no-op transition | Confirms `NO_CHANGE` must be first class (M-05). |
| 18 · response without learning | Separates P-27 from P-28 **observably** — this joint survives. |
| 19 · learning without F-mutation | Not separable black-box → F-02. |
| 20 · F-mutation without self-modification | Not separable black-box → F-02. |

No proposition was rescued by redefining its terms mid-test.

---

## §D · Identifiability Attack

Sixteen variables examined: `S, X, C, H, A, I, F, K, R_capability, R_admitted, ΔX, O, W, J, χ, Θ`.

### F-01 · Seven variables are not identifiable from finite trajectory data

| Variable | Class | Why |
|---|---|---|
| `X` | `LATENT` | Only enters observation through `F∘I`. Distinct `X` with equal images are indistinguishable. |
| `C` | `LATENT` / partly `UNIDENTIFIABLE` | Enters only alongside `X` in every equation. `C` and `X` are **not separately identifiable** without an intervention that moves one while holding the other. |
| `H` | `UNIDENTIFIABLE` vs `X` | CC-05. Any `H`-effect can be re-encoded as a larger `X`. |
| `I` | `UNIDENTIFIABLE` vs `F` | **F-02.** |
| `F` | `UNIDENTIFIABLE` vs `I` | **F-02.** |
| `K` | `UNIDENTIFIABLE` vs `S` | `R` depends on `S(K)`. Only the composite is observable. A coupling change and a signal change are the same observation. **This is why no specimen exercises `COUPLING_CHANGED`.** |
| `R_capability` | `LATENT` wherever `A` binds | **F-04.** |

Directly observable: `R_admitted`, `O`, `W` (the witness stream). Derived: `ΔX`, `J`, `χ`.
`Θ` is identifiable **only near crossings** — a system never driven near its threshold yields
no information about where the threshold is.

### F-02 · Interpretation morph and response-function morph are observationally equivalent

**Distinction:** `SELF-DIST-01K3MIFNONIDENT01000000000` — declared in Delta-621 as D-1754, cited here

Only the composition is ever witnessed:

```text
R = F_t( I_t(S, X, C, H) )
```

For any pair `(I, F)` and any invertible `g` on the interpretation codomain,
`(g∘I, F∘g⁻¹)` produces an **identical** response trajectory for **every** input. Therefore:

> A change in `I` and a compensating change in `F` are indistinguishable from any amount of
> trajectory data.

**This directly attacks P-07 and RESPONSE-GEOMETRY-001 §2.** The three-way distinction
`STATE MORPH != INTERPRETATION MORPH != RESPONSE-FUNCTION MORPH` is **real inside a model** and
**not witnessable from behaviour**. The SELFPI specimen (M-08) is evidence of an interpretation
morph only because SELFPI's interpretive architecture was inspected **white-box** — not because
its outputs changed in a way that identified the mechanism.

**Consequence, and it is a good one:** the `witness_discrimination` block's `UNDETERMINED`
value is not a courtesy. It is the **default and most common correct answer** for
`INTERPRETATION_CHANGED` and `RESPONSE_FUNCTION_CHANGED` under black-box observation. A system
that reports these as `true`/`false` from trajectory data alone is manufacturing evidence.

### F-03 · State morph is identifiable only up to the probe set

Direct restatement of P-19. Two internal states agreeing on every probe are one state as far as
the institution may lawfully claim. `STATE_CHANGED = false` is therefore **always** an
`observable-by-probe-set` claim and never an absolute one. It should be recorded as
`NO_CHANGE_OBSERVED_UNDER_PROBE_SET_π`, not `NO_CHANGE`.

### F-04 · Capability–admissibility complementarity

**Distinction:** `SELF-DIST-01K3MFCAPMASK0100000000000` — declared in Delta-621 as D-1755, cited here

`A` is observable **only where it binds** (you see the block). `R_capability` is observable
**only where `A` does not bind** (you see the unmasked response). At no operating point are
both observable simultaneously.

```text
A observable        <=>  A binds        <=>  R_capability masked
R_capability observable <=>  A does not bind <=>  A unobservable
```

The capability surface and the admissibility surface are therefore **jointly unobservable at
every point**. P-11 is true and its two sides can never be measured together. Mapping either
surface requires probing across many operating points and accepting that each probe reveals
exactly one side.

This is novel residue. It is **not** an uncertainty principle in the physical sense — there is
no conjugate-variable structure and no bound of the form `ΔaΔb ≥ c`. Marked
`METAPHORICAL_SYNTHESIS` if described that way.

---

## §E · Null-Model Attack (workflow law §D)

Applied to the three headline deep-morph claims.

| Claim | Shallower model that explains the same witness | Survives? |
|---|---|---|
| SELFPI underwent an **interpretation morph** | `PARAMETER_UPDATE_ONLY` — a threshold or rule table changed; no interpretive architecture moved. Also `OBSERVER_LIMITATION` — the analyst's reading of SELFPI changed, not SELFPI. | **Not from behaviour.** Survives only on white-box inspection evidence, which must be cited. |
| Antigravity demonstrated a **capability/admissibility split** | `MEASUREMENT_ERROR` — the entry was observed but the execution never began. `STATE_CHANGE_ONLY` — a flag flipped and blocked a normal path. | **Yes, weakly.** The split is the more economical explanation *only if* both the physical entry and the institutional block were separately witnessed. If only the block was witnessed, `STATE_CHANGE_ONLY` is sufficient and the split is unearned. |
| WOMBSELF showed **materiality changed while observation did not** | `OBSERVER_LIMITATION` — the materiality function was always context-dependent and the earlier evaluation was simply wrong. | **Yes.** But note the shallower model is *not weaker here*: "we evaluated it wrong the first time" and "materiality is a function of `(Δ, C)`" have the same operational consequence — re-evaluate on context change. The deep claim adds no predictive content over the shallow one. Recorded as `NO_ADDED_PREDICTIVE_CONTENT`. |

**Null-model verdict:** none of the three deep claims is *refuted*, and none is *established
from witness data alone*. All three currently rest on white-box or founder-supplied context.

---

## §F · Mathematical Discipline Compliance

| Term | Status in this corpus |
|---|---|
| `hyperbolic` | `METAPHORICAL_SYNTHESIS` — see §I |
| `geometry` | `METAPHORICAL_SYNTHESIS` — no metric, no connection, no curvature is defined anywhere |
| `morph` | `METAPHORICAL_SYNTHESIS` — it is **not** a morphism: no category, objects, or composition law with identity and associativity has been established. If a category is ever supplied this can be promoted. |
| `frequency` | not used in this corpus; reserved |
| `resonance` | not used in this corpus; reserved |
| `sensitivity` | `LITERAL_MATHEMATICS` **only** for smooth families (1, 5, 8); `METAPHORICAL_SYNTHESIS` elsewhere pending R-07 |
| `manifold` | not used; MUST NOT be introduced without a chart/atlas |

**Note on "morph":** the notation `M : (S_i,C,P,A) -> (S_j,Δ,W)` is a **function**, not a
morphism. Its source and target are different kinds of tuple, so it does not compose with
itself, and no identity element is defined. Category-theoretic language should be withheld.

---

## §G · PEEP · Cross-Modal Position of This Review

| Field | Value |
|---|---|
| `observer` | HBCSELF, this session |
| `modality` | static analysis of supplied text; local filesystem read |
| `instrument` | `git`, `cat`, `find`; no execution of any model |
| `raw_result_ref` | the committed diff |
| `interpretation_rule` | workflow law §F mathematical discipline |
| `method_validity` | `VALID` for notation/typing/identifiability claims; **`INVALID`** for any claim about how these systems actually behave — nothing was run |
| `claim_validity` | independent of the above; see per-item ledger |
| `observability_scope` | the supplied propositions and this repository **only**. SELFPI, WOMBSELF, Antigravity, TG4R, MORPHSELF and SELFGRAPH4REALITY are **not present in this repository** and were not inspected. |
| `cross_modal_relation` | `UNRESOLVED` |

**This is the review's own most important limitation.** Every claim about SELFPI, WOMBSELF, and
Antigravity in this document is founder-supplied testimony, `epistemic_class: CLAIMED`. Per
P-35, this review's non-observation of them does not falsify them — but neither does it
corroborate them. `INSTITUTIONAL_STATUS` for any proposition resting on those specimens is
`REQUIRES_FOUNDER_DECISION`.

---

## §H · ResponseGeometry Primitive Attack

Eleven mandated questions.

| # | Question | Answer |
|---|---|---|
| 1 | Is this actually one object? | **No.** It has no cohesion criterion. Its fields change on different clocks — `context_ref` per interaction, `response_function_ref` rarely, `history_ref` monotonically. |
| 2 | Is it a view over existing objects? | **Yes.** Every field is a `_ref`. It holds zero own state. |
| 3 | Does it duplicate context? | **Yes** — `context_ref` is already carried by MORPH and EVENT. |
| 4 | Does it duplicate state? | **Yes** — `history_ref` duplicates lineage. |
| 5 | Does it duplicate MORPHSELF? | `UNRESOLVED` — MORPHSELF is not in this repository and was not inspected. |
| 6 | Does it duplicate TG4R? | `UNRESOLVED` — same reason. **These two cannot be answered from here and alone block a `NO` verdict from becoming final.** |
| 7 | Is `sensitivity_model` derived? | **Yes** — computable from `F`, `I`, `K`, `Θ`. Storing it denormalizes a derived quantity and creates a staleness surface. |
| 8 | Is `threshold_model` optional? | **Yes** — linear and saturating families have no threshold. Must be nullable, which means it is not constitutive. |
| 9 | Can response geometry exist without a threshold? | **Yes** (model families 1, 5, 6, 7). Threshold is one shape among twelve. |
| 10 | Does `witness_refs` belong here? | **No.** It belongs in lineage. Placing it here lets a view accumulate its own evidence, which is how a view becomes mistaken for state. |
| 11 | Would minting this create a god-object? | **Yes.** Eleven refs spanning state, context, history, authority, capability and evidence — the exact five membranes RESPONSE-GEOMETRY-001 §1 was written to keep apart. |

**Result:** `ResponseGeometry` as specified is a **god-object shaped like a view**. It would
re-collapse, in one record, every membrane the chamber established.

```text
NEW_PRIMITIVE_REQUIRED = UNRESOLVED  (leaning NO)
```

`UNRESOLVED` rather than `NO` **only** because questions 5 and 6 require inspecting MORPHSELF
and TG4R, which are outside this repository and outside this review's observability scope.

**No primitive minted.** Refusal record `SELF-REFUSAL-01K3MHBCMINTWITHHELD000000`. The
identifier reserved in the draft is left **unassigned**.

---

## §I · The "Hyperbolic" Claim

Tested against the four options.

- **A · literal hyperbolic geometry** — **NO.** No metric tensor, no distance function, no
  curvature, no geodesics, no negatively-curved space. Nothing in the corpus defines a
  manifold, so nothing can have curvature of any sign.
- **B · nonlinear-dynamics metaphor** — **PARTIALLY, AND DANGEROUSLY.** "Hyperbolic" is a
  *technical* term in dynamical systems: a hyperbolic fixed point is one whose linearization
  has no eigenvalue on the imaginary axis (or unit circle), giving well-defined stable and
  unstable manifolds. The corpus discusses thresholds, multi-stability and basins — the
  neighbourhood of that theory — but establishes **no** linearization and **no** spectrum, so
  the technical sense is **not** earned. Using the word near this material risks a reader
  inferring a theorem that has not been proved.
- **C · amplification / extreme-case review method** — **YES.** This is what the term actually
  denotes in practice: push every claim to its boundary, null case, and failure path. §B of the
  workflow law describes exactly this and nothing more.
- **D · combination** — **C, with an unearned borrowing from B.**

**Ruling:**

> **No literal hyperbolic metric or curvature is present anywhere in this corpus.**
> `hyperbolic` is marked `METAPHORICAL_SYNTHESIS` denoting *extreme-case amplification review*.
> It MUST NOT be used adjacent to `manifold`, `curvature`, `geodesic`, `spectrum`, or
> `stable/unstable manifold` without first supplying the mathematics.

Symbolic and alchemical language may remain as a synthesis layer. It may not stand as
mathematical evidence.

---

## §J · Required Repairs Before Any Implementation Request

| ID | Repair | Blocks |
|----|--------|--------|
| R-01 | Remove `A_t` from E-01; admissibility applies downstream only | Model families 12 |
| R-02 | Rename MORPH state symbol `S`→`X`; reserve `S` for signal | All |
| R-03 | Fix `obs_t` operator / `O_t` output / `W_t` attestation; `J_t = J(W_t, A_t)` | 13 |
| R-04 | Adopt E-02 interpretation law; rewrite `I_t = 𝔦_t(...)`; demote P-03 | 9 |
| R-05 | Declare `X` non-Markov; carry `H` explicitly in E-01 | 4, 6 |
| R-06 | Rename "effect topology" to "effect reachability set" or mark metaphorical | 15 |
| R-07 | Per-family sensitivity instrument table; no derivative on nonsmooth families | 3, 4, 7, 9 |
| R-08 | Do not mint `ResponseGeometry`; treat as computed projection | — |
| R-09 | Self-modification ladder is model-internal; add observability caveat | 9, 10, 11 |

An `A` verdict is reachable from here. It requires R-01 … R-09 applied and re-reviewed, plus
resolution of §H questions 5–6 against MORPHSELF and TG4R.

---

## §K · Custody

| Class | Count | Items |
|---|---|---|
| `RAW_OBSERVATION` | 0 | nothing was executed |
| `SESSION_WITNESS` | 1 | the committed diff |
| `CORRECTION` | 9 | CC-01 … CC-09 |
| `DERIVED_FINDING` | 4 | F-01 … F-04 |
| `PREM_CANDIDATE` | 0 | none promoted |
| `TRAJECTORY_CANDIDATE` | 16 | model families 0–15 |
| `SEMANTIC_RESIDUE` | 6 | NSR-01 … NSR-06 |
| `SPECIFICATION` | 9 | the artifacts of this session |
| `IMPLEMENTATION` | 0 | **none authorized, none produced** |

### Novel semantic residue

| ID | Residue |
|----|---------|
| NSR-01 | `GUARD_UNRESOLVED` as a third value distinct from guard-false |
| NSR-02 | `non_observability_witness` — `NotObserved != NotObservable` |
| NSR-03 | `UNDETERMINED` as the **default** witness-discrimination value under black-box observation (F-02) |
| NSR-04 | Capability–admissibility complementarity (F-04) |
| NSR-05 | Entry / persistence / exit as three separate predicates, forced by hysteresis |
| NSR-06 | `NO_ADDED_PREDICTIVE_CONTENT` — a deep model that makes no prediction the shallow one does not |

### Existing primitives reused (nothing re-invented)

Constitutional Evidence Rule · Stable Identity Doctrine · evidence tiers · Refused Mutations ·
Rollback Path · Workflow Execution Signal Hierarchy.

### Throughput note

Discovery throughput exceeded institutionalization throughput during this session: three
founder commands arrived while one was being institutionalized. Per workflow law §K this is
permitted transiently and prohibited permanently. **Recorded as backpressure, not as failure.**

---

## §L · Terminal Statement

```text
EQUATION EXECUTABLE  !=  EQUATION TRUE
```

Nothing in this corpus was executed. Nothing was canonized. No primitive was minted. The
equation chamber is specified but **not implemented**, as required.

The chamber is coherent enough to build **after** R-01 … R-09. Its value is not that it will
show the equations working. Its value is that model families 0, 14, and 15 exist specifically
so the propositions can lose.
