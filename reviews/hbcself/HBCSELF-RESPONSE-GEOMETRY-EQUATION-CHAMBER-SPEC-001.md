# HBCSELF-RESPONSE-GEOMETRY-EQUATION-CHAMBER-SPEC-001

**Stable ID:** `SELF-SPEC-01K3MHBCEQCHAMBER001000000`
**Display ID:** `HBCSELF_RESPONSE_GEOMETRY_EQUATION_CHAMBER_01`
**Entity Type:** `chamber_specification`
**Created At:** `2026-08-19`
**Controlling Signal:** `FOUNDATION_SIGNAL`
**Status:** `SPECIFIED_NOT_IMPLEMENTED`
**Evidence Tier:** `Symbolic`
**Gated By:** `SELF-VERDICT-01K3MHBCCOLDREVIEW00100000` = `B` → repairs R-01 … R-09 required

---

## 0 · Release Condition

This specification is produced under the cold review's §J clause: artifact 5 is written **only
if** the cold review establishes that an executable chamber is coherent. It does — verdict `B`.

**`B` is not `A`.** No implementation is authorized. This document is a design, and the design
is **not buildable until R-01 … R-09 are applied**, because six of the nine repairs change
model semantics rather than presentation.

```text
CHAMBER SPECIFIED  !=  CHAMBER AUTHORIZED  !=  CHAMBER IMPLEMENTED
```

---

## 1 · Purpose

```text
PURPOSE      = run the equations as models, generate counterexamples,
               compare trajectories, and falsify claims
NOT PURPOSE  = prove the equations true
```

Model families **0**, **14**, and **15** exist specifically so the propositions can lose. A
chamber in which the propositions cannot lose is not this chamber.

---

## 2 · Repair Gate

| Repair | Must land before | Reason |
|---|---|---|
| R-01 drop `A_t` from `F` | family 12 | otherwise the capability/admissibility split is unrepresentable |
| R-02 `S`→`X` for state | all | otherwise the simulator type-checks and is wrong |
| R-03 `obs`/`O`/`W` split | family 13 | otherwise adjudication can read around the witness |
| R-04 single interpretation law | family 9 | otherwise `I` has two signatures |
| R-05 `X` non-Markov, `H` explicit | families 4, 6 | otherwise hysteresis and delay are unrepresentable |
| R-06 rename effect "topology" | family 15 | terminology discipline |
| R-07 per-family sensitivity instrument | families 3, 4, 7, 9 | otherwise the chamber computes a meaningless derivative |
| R-08 no `ResponseGeometry` mint | — | the chamber consumes refs, it does not mint objects |
| R-09 ladder observability caveat | families 9, 10, 11 | otherwise the chamber reports unwitnessable findings as findings |

---

## 3 · Model Families

| # | Family | Sensitivity instrument (R-07) | Falsification role |
|---|---|---|---|
| 0 | **no coupling** | none — `χ ≡ 0` and that is the correct answer | **null model.** Every claimed morph must first fail to be explained here. |
| 1 | linear response | Jacobian | baseline where `χ` is literal mathematics |
| 2 | state-dependent response | Jacobian at fixed `X` | tests P-04 |
| 3 | threshold response | threshold crossing rate; distance-to-boundary `‖S−Θ(X)‖` | **CX-09** — where `∂R/∂S` fails |
| 4 | hysteresis | crossing rate per branch; branch label in `X` | **CX-06** — forces P-23 |
| 5 | saturation | Jacobian, reported with saturation flag | CX-08 |
| 6 | delayed response | sensitivity as a functional of signal history | CX-05 |
| 7 | stochastic response | `∂E[R]/∂S`; transition probability `P(R′\|S,X)` | CX-04 |
| 8 | adaptive state | Jacobian between updates | separates P-27 from P-28 |
| 9 | interpretation mutation | finite-difference table over `𝔦` | **CX-10 pair** |
| 10 | response-function mutation | finite-difference table over `F` | **CX-10 pair** |
| 11 | coupling mutation | finite-difference over `K` | **CX-11** |
| 12 | capability vs admissibility split | two surfaces, probed separately | **CX-16 / F-04** |
| 13 | partial observability / multi-modal witness | per-modality probe sets `π_m` | **CX-12, CX-18** |
| 14 | invalid-method / correct-conclusion | none | **CX-14** — the chamber must be able to be right for the wrong reason |
| 15 | projected vs observed effect reachability | set/graph difference (R-06) | CX-23 … CX-25 |

### 3.1 The three obligatory adversarial families

- **Family 0** implements the null-model law. Any run claiming a morph MUST also be run under
  family 0; if family 0 reproduces the witness, the deeper claim is refused.
- **Families 9+10 run as a matched pair.** The chamber MUST produce the F-02 result: an
  interpretation morph and a compensating response-law morph yielding **byte-identical**
  response trajectories. If the chamber ever distinguishes them from trajectory data alone,
  **the chamber is wrong**, not F-02.
- **Family 14** exists so the chamber can be right for the wrong reason and still report
  `method_validity = INVALID`.

---

## 4 · Run Contract

### Inputs

```yaml
run_id:              # SELF-RUN-<26>
model_family:        # 0..15
model_version:
seed:                # REQUIRED for any stochastic family
initial_state:       # X_0, including branch/basin labels where applicable
context:             # C_0
history:             # H_0 — explicit, per R-05
authority:           # A — the admissibility surface
signal_sequence:     # S_0..S_T
parameters:
observation_model:   # probe set pi, per modality
measurement_model:   # method_validity rules
expected_invariants:
falsification_targets:
```

### Outputs

```yaml
state_trajectory:
response_trajectory:
capability_response:          # family 12: distinct from admitted
admitted_response:
interpretation_trajectory:
response_function_trajectory:
coupling_trajectory:
observations:
witnesses:
measurement_validity:
claim_validity:               # independent of measurement_validity
invariant_results:
counterexample_results:
witness_discrimination:       # per R-09
  STATE_CHANGED:              # true | false | UNDETERMINED
  INTERPRETATION_CHANGED:     # DEFAULT UNDETERMINED under black-box observation
  RESPONSE_FUNCTION_CHANGED:  # DEFAULT UNDETERMINED under black-box observation
  COUPLING_CHANGED:           # DEFAULT UNDETERMINED — see CX-11
  NO_CHANGE:                  # first-class
null_model_result:            # what family 0 produced for the same inputs
```

### 4.1 The ground-truth membrane

The chamber authors ground truth and therefore **knows** which of `X, I, F, K` it moved. It
MUST emit that separately from what the observation model could establish:

```yaml
ground_truth_morph:   # what the simulator actually did — AUTHORED
witnessed_morph:      # what the observation model could establish — DERIVED
```

**These two blocks MUST NEVER be merged.** Merging them is how a simulator manufactures
evidence: it would let an authored fact be reported as a witnessed finding. The gap between
them **is the experimental result** — it measures exactly how much of the taxonomy is
observable.

---

## 5 · Determinism Contract

```text
same input + same model + same seed  =>  BYTE_IDENTICAL canonical run artifact
stochastic model without explicit seed  =>  FAIL CLOSED
wall clock in deterministic content     =>  FORBIDDEN
network                                 =>  NOT REQUIRED
```

Timestamps, if recorded at all, live in a separate non-canonical envelope excluded from the
byte-identity hash.

---

## 6 · Mathematical Safety Interlocks

The chamber MUST refuse, at runtime, to compute:

1. any derivative on a family not marked smooth (3, 4, 6, 7, 9, 10, 11, 15) — return
   `SENSITIVITY_INSTRUMENT_UNAVAILABLE`, never a number;
2. a pathwise derivative on any stochastic family — return `∂E[R]/∂S` or refuse;
3. `∂χ/∂X` or `∇χ` on any discrete state space — return the finite-difference table or refuse;
4. a Jacobian on a signal space without a declared basis — refuse.

> **Do not pretend a derivative exists because the notation looks good.**

A refusal is a first-class output, not an error.

---

## 7 · What the Chamber May Not Do

```text
NOT_AUTHORIZED:
  canonize any proposition on the basis of a run
  mint ResponseGeometry or any other primitive
  morph the foundational IR, TG4R, or MORPHSELF
  modify runtime
  run network experiments
  alter existing sealed artifacts
  self-ratify
```

A run is `EVIDENCE` at most. `EVIDENCE !<= ADJUDICATION`. A green invariant check is a green
invariant check about a model, and a model is a `PROJECTION`.

```text
MODEL AGREES WITH PROPOSITION  !=  PROPOSITION TRUE OF REALITY
```

---

## 8 · Discriminating Experiments

The command asks what would have to be observed to distinguish competing models. From §D of the
cold review:

| Competing models | Discriminating observation | Available? |
|---|---|---|
| `I`-morph vs `F`-morph | **None from trajectory data** (F-02). Requires white-box inspection of the interpretation stage. | Inside the chamber only |
| `K`-morph vs `S`-change | **None** (F-01). Requires independent measurement of the coupling channel. | Inside the chamber only |
| `X`-morph vs no morph | Probe-set-relative only (F-03). Widen `π`. | Partially |
| capability vs admissibility | Probe across many operating points; each probe reveals exactly one side (F-04). | Yes, expensively |
| learning vs `F`-mutation | **None** — the `F`/`X` boundary is a modelling choice (CX-21). | Never |
| self-mod vs authorized self-mod | The authorization record, checked independently of behaviour. | **Yes** — the one clean joint |

**This table is the chamber's actual scientific yield.** It says which distinctions in the
corpus can ever be earned by observation, and which are permanently model-internal.

---

## 9 · Next Lawful Step

1. Apply R-01 … R-09 to MORPH-SEMANTICS-001 and RESPONSE-GEOMETRY-001. **Requires a
   `MUTATION_SIGNAL`.**
2. Re-run this cold review against the repaired corpus for an `A`/`B` re-verdict.
3. Resolve §H questions 5–6 by inspecting MORPHSELF and TG4R — **outside this repository**.
4. Only then may implementation authority be *requested*. Requesting is not receiving.

Nothing in this document authorizes step 1.
