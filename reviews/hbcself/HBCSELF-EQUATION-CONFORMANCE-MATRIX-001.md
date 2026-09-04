# HBCSELF-EQUATION-CONFORMANCE-MATRIX-001

**Stable ID:** `SELF-MATRIX-01K3MHBCEQCONFORM001000000`
**Entity Type:** `conformance_matrix`
**Created At:** `2026-08-19`
**Controlling Signal:** `FOUNDATION_SIGNAL`
**Status:** `COMPLETE`
**Evidence Tier:** `Symbolic` — analysis only. **No equation was numerically evaluated.**

```text
EQUATION EXECUTABLE  !=  EQUATION TRUE
```

---

## Summary

| `MATHEMATICAL_STATUS` | Count | Items |
|---|---|---|
| `WELL_FORMED` | 2 | E-05, E-13 |
| `WELL_FORMED_WITH_ASSUMPTIONS` | 5 | E-03, E-06, E-07, E-08, E-14 |
| `UNDER_SPECIFIED` | 3 | E-01, E-02, E-04 |
| `NOTATION_ONLY` | 3 | E-09, E-10, E-16 |
| `DIMENSIONALLY_UNDEFINED` | 2 | E-11, E-12 |
| `CATEGORY_ERROR` | 1 | E-15 |
| `DEFINITION_CANDIDATE` | 1 | E-17 |
| **Total** | **17** | |

No equation is `FALSE_BY_COUNTEREXAMPLE` as a *definition*. Three are false as *universal
claims about all model families* (E-09, E-10, E-14) and are demoted to family-scoped.

---

## E-01 · `R_t = F_t(S_t, X_t, C_t, A_t)`

- **Mathematical status:** `UNDER_SPECIFIED`
- **Epistemic status:** `HYPOTHETICAL`
- **Institutional status:** `CONTRADICTS_EXISTING_LAW`

**Domain/codomain:** undeclared. **Fails:** attack 2 (memoryless), attack 5 (delayed), attack 6
(hysteresis) — for all three, `R_t` is not a function of the instantaneous tuple unless `X_t`
absorbs unbounded history, which contradicts E-02's separate `H_t`.

**CC-01:** `A_t` as an argument of `F` makes P-11 unrepresentable — `F` never emits the
inadmissible response, so there is no capability response to mask.
**CC-05:** `X` vs `H` sufficiency conflict with E-02.

**Repair R-01 + R-05:** `R_capability_t = F_t(S_t, X_t, C_t, H_t)`; admissibility downstream.

---

## E-02 · `I_t = I_t(S_t, X_t, C_t, H_t)`

- **Status:** `UNDER_SPECIFIED` · `HYPOTHETICAL` · `CONTRADICTS_EXISTING_LAW` (vs P-03)

Symbol `I_t` denotes both the function and its value. **CC-04.** Also inherits CC-05: if `X` is
Markov-sufficient, `H` is redundant; the corpus never decides.

**Repair R-04:** `I_t = 𝔦_t(S_t, X_t, C_t, H_t)`; P-03 demoted to the restricted case.

---

## E-03 · `O_t = O(R_t, ΔX_t)`

- **Status:** `WELL_FORMED_WITH_ASSUMPTIONS` · `HYPOTHETICAL` · `REFINES_EXISTING_PRIMITIVE`

**Assumptions required:** a probe set `π` and a noise/partiality model. Without them the
signature implies the observer has access to the true `ΔX`, which contradicts P-19.

**CC-03:** `O` is the operator here and the output in E-17.
**Repair R-03:** `O_t = obs_π(R_t, ΔX_t)`, with `π` an explicit argument so that F-03's
`NO_CHANGE_OBSERVED_UNDER_PROBE_SET_π` is expressible.

---

## E-04 · `J_t = J(O_t, W_t, A_t)`

- **Status:** `UNDER_SPECIFIED` · `HYPOTHETICAL` · `CONTRADICTS_EXISTING_LAW`

Takes `O_t` and `W_t` as independent, but E-17 derives `W_t` from `O_t`. Passing the raw
observation *alongside* its attestation lets adjudication read around the witness — the exact
route by which `OBSERVATION !<= VERDICT` gets violated in an implementation.

**Repair R-03:** `J_t = J(W_t, A_t)`. Observation reaches adjudication **only** through
attestation.

---

## E-05 · `X_t -> X_{t+1}`

- **Status:** `WELL_FORMED` · `DERIVED` · `EXISTING_LAW_COMPATIBLE`

A transition relation, not a claim. Survives everything, including attack 17 (no-op), provided
the identity transition is admitted as a value — which is exactly why `NO_CHANGE` must be
first class. Under attack 7 (multi-stable), `X` must carry a basin label or the relation is not
functional.

---

## E-06 · `I_t -> I_{t+1}` · E-07 · `F_t -> F_{t+1}` · E-08 · `K_t -> K_{t+1}`

- **Status (all three):** `WELL_FORMED_WITH_ASSUMPTIONS` · `HYPOTHETICAL` · `REQUIRES_FOUNDER_DECISION`

Each is well-formed **as a model-internal transition**. Each is **unwitnessable** from
trajectory data:

- E-06 vs E-07 — **F-02.** `(I, F)` and `(g∘I, F∘g⁻¹)` are behaviourally identical for every
  invertible `g`. An interpretation morph and a compensating response-law morph cannot be told
  apart.
- E-08 — **F-01.** `R` depends on `S(K)`; only the composite is observable. A coupling change
  and a signal change produce the same witness. This is why the specimen set has no
  `COUPLING_CHANGED` case: none can be constructed observationally.

**Repair R-09:** admissible as authored ground truth in simulation or as white-box assertion.
Not as a witnessed finding.

---

## E-09 · `χ = ∂R/∂S`

- **Status:** `NOTATION_ONLY` · `HYPOTHETICAL` · `CONTRADICTS_EXISTING_LAW`

**The review's clearest falsification.** For the threshold family (E-14):

```text
∂R/∂S = 0        for all S != Θ
∂R/∂S undefined  at S = Θ
```

The quantity is **zero exactly where the system is insensitive** and **undefined exactly where
it is maximally sensitive**. Reporting `χ = 0` for a system that flips state under an
arbitrarily small perturbation near `Θ` is close to the inverse of the intended meaning.

Also fails: attack 4 (stochastic — pathwise derivative undefined; needs `∂E[R]/∂S`), attack 5
(delayed — sensitivity is a functional of signal history, not a partial at `t`), attack 8
(saturation — `χ→0` while the system remains fully responsive below the knee), attack 9.

**Valid only for:** model families 1 (linear), 5 (saturation, off the asymptote), 8 (adaptive,
between updates). **Repair R-07.**

---

## E-10 · `χ_matrix = ∂R_vector/∂S_vector`

- **Status:** `NOTATION_ONLY` · `HYPOTHETICAL` · `REFINES_EXISTING_PRIMITIVE`

Inherits every E-09 defect, and adds: the Jacobian requires `R` and `S` to be vector spaces of
declared finite dimension with a fixed basis. OURSELF signals are **heterogeneous and typed** —
a signal space mixing an authority token, a timestamp, and a file blob has no vector-space
structure, so `∂R/∂S` has no meaning componentwise.

**Repair R-07 + declare the signal space.** Until a coordinate system exists, the honest object
is a **sensitivity relation** (which input dimensions demonstrably move which output
dimensions), not a matrix of derivatives.

---

## E-11 · `∂χ/∂X` · E-12 · `∇_(X,C,H,A) χ`

- **Status (both):** `DIMENSIONALLY_UNDEFINED` · `HYPOTHETICAL` · `REQUIRES_FOUNDER_DECISION`

`X`, `C`, `H`, `A` are **governed institutional states** — discrete, typed, partly symbolic.
Differentiation with respect to them requires a smooth manifold structure on state space that
does not exist and has not been proposed. `A` in particular is a set of permissions; the
derivative of anything with respect to a permission is undefined.

These are the two items where the notation is furthest ahead of the mathematics. They are also
where the corpus's genuine idea lives — *how context, history, authority and state deform
sensitivity* — so the repair matters.

**Repair R-07:** replace with a **finite-difference sensitivity table**: hold the model fixed,
vary one of `X, C, H, A` across a declared discrete set, recompute the family-appropriate
sensitivity instrument, and tabulate. That is executable, honest, and answers the same question
without claiming a gradient.

---

## E-13 · `Θ_enter != Θ_exit` as a hysteresis model

- **Status:** `WELL_FORMED` · `DERIVED` · `NOVEL_SEMANTIC_RESIDUE`

A parameter inequality, cleanly defined, standard. Directly forces P-23. **Survives every
attack.** The strongest equation in the set.

One consequence to record: under hysteresis `R_t != F(S_t, X_t)` unless `X_t` encodes which
branch the system is on. This is the concrete mechanism behind CC-05.

---

## E-14 · `S < Θ(X) ⇒ R_0` , `S ≥ Θ(X) ⇒ R_1`

- **Status:** `WELL_FORMED_WITH_ASSUMPTIONS` · `HYPOTHETICAL` · `EXISTING_LAW_COMPATIBLE`

Well-formed **as a model family**, and the source text correctly says "not as a universal
response law" — credit for the self-limitation. Requires `S` totally ordered and `Θ` single-valued;
neither holds for heterogeneous signal spaces.

Fails as a universal law under attacks 4, 6, 7, 8 (stochastic / hysteretic / multi-stable /
saturating), which is precisely why model families 3–7 are separate.

---

## E-15 · `M = (I,C,S,P,A) -> (S',Δ,W)`

- **Status:** `CATEGORY_ERROR` · `HYPOTHETICAL` · `CONTRADICTS_EXISTING_LAW`

**CC-02.** `S` here is *state*; everywhere else in the corpus `S` is *signal*. `S'` is the
resulting state. A simulator implementing both conventions would type-check and be silently
wrong.

Second defect: `I` appears as a tuple element here but is the interpretation *function*
elsewhere. Third: this signature adds `I` to MORPH-SEMANTICS-001 §1's `(S_i, C, P, A)` without
recording the change.

**"Morph" is not a morphism.** No category is defined. Source and target are different tuple
kinds, so `M` does not compose with itself and no identity element exists.
Category-theoretic language is withheld (see cold review §F).

**Repair R-02:** `M = (X_i, 𝔦, C, P, A) -> (X_j, Δ, W)`.

---

## E-16 · `PROJECTED_EFFECT_TOPOLOGY` vs `OBSERVED_EFFECT_TOPOLOGY`

- **Status:** `NOTATION_ONLY` · `HYPOTHETICAL` · `REQUIRES_FOUNDER_DECISION`

**CC-06.** No open sets, no neighbourhood system, no continuity claim, no topological
invariant. The object is a **reachability set** or **effect dependency graph**. The comparison
being reached for is a set/graph difference, which is perfectly well-defined once named
correctly.

**Repair R-06.**

---

## E-17 · The full candidate pipeline

```text
S_t --K_t--> I_t(S_t,X_t,C_t,H_t) --F_t--> R_capability_t
    --A_t/admissibility--> R_admitted_t --> ΔX_t --O_t--> W_t --J_t--> H_{t+1}
    --> { X_{t+1}, I_{t+1}, F_{t+1}, K_{t+1} }
```

- **Status:** `DEFINITION_CANDIDATE` · `HYPOTHETICAL` · `NOVEL_SEMANTIC_RESIDUE`

**This is the strongest object in the corpus** and should be treated as the canonical form that
E-01 … E-04 are amended *toward*, not away from.

It gets three things right that the component equations get wrong:

1. Admissibility is a **separate stage**, not an argument of `F` — this is what makes P-11
   representable (resolves CC-01 in E-17's favour).
2. `H_t` is carried explicitly alongside `X_t` (resolves CC-05 in E-17's favour).
3. The critical rule — **not every interaction may update `X, I, F, K`; `NO_CHANGE` must be a
   first-class result** — is exactly right and is the guard against the taxonomy inflating every
   interaction into a deep morph.

**Remaining defects:** CC-03 (`O_t` as operator here, output in E-03) and F-02/F-01 (the final
four-way split `{X, I, F, K}` is not witnessable — at most one of the four is even partly
observable, and only up to the probe set).

**Repair:** R-03, plus each of the four outputs carries `true | false | UNDETERMINED`, with
`UNDETERMINED` as the **default** for `I`, `F`, and `K` under black-box observation.

---

## Cross-Cutting Ledger

| Collapse | Equations implicated | Repair |
|---|---|---|
| CC-01 authority inside vs outside `F` | E-01, E-17 | R-01 |
| CC-02 `S` = signal vs state | E-15 | R-02 |
| CC-03 `O`/`W` operator vs output | E-03, E-04, E-17 | R-03 |
| CC-04 two interpretation laws | E-02, P-03 | R-04 |
| CC-05 `X` vs `H` sufficiency | E-01, E-02, E-13 | R-05 |
| CC-06 "topology" | E-16, P-26 | R-06 |
| CC-07 derivative on nonsmooth families | E-09, E-10, E-11, E-12 | R-07 |
| CC-08 minting a view as state | ResponseGeometry | R-08 |
| CC-09 unobservable ladder joints | E-06, E-07, E-08 | R-09 |

**Nine collapses. Nine repairs. Zero foundational fractures.** Verdict `B`.
