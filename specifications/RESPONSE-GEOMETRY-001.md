# RESPONSE-GEOMETRY-001 · Hyperbolic Chamber Pass 01

**Stable ID:** `SELF-SPEC-01K3MRESPONSEGEOMETRY00100`
**Display ID:** `RESPONSE-GEOMETRY-001`
**Entity Type:** `specification`
**Created At:** `2026-08-19`
**Created By:** operator directive `Reality shift, update OURSELF STORE ALL THIS NEW MATTER`
**Repository:** `situaedmilly/ourself-core`
**Canonical Path:** `specifications/RESPONSE-GEOMETRY-001.md`
**Status:** `HYPOTHESIS_TIER_UNDER_COLD_REVIEW`
**Evidence Tier:** `Symbolic`
**Derived From:** `SELF-SPEC-01K3MMORPHSEMANTICS0010000`
**Supersedes:** none
**Superseded By:** `null`

---

## 0 · The Mutation This Chamber Carries

MORPH is not fundamentally a state-transition primitive.

> **MORPH is a transition-law mutation primitive.**

That is a different beast, and it is the reason `MORPH` may not be stored as one
undifferentiated field.

**Standing note.** Everything below is `HYPOTHESIS_TIER`. `ResponseGeometry` is **not canon**.
It is named so it can be attacked.

---

## 1 · The Response Law

The ordinary system is `S_t -> R_t`. Matter correctly mutates it to `(S_t, X_t) -> R_t`, then
to `(S_t, X_t) -> R_t -> X_{t+1}`.

Something is still hidden: **`X` cannot carry everything.** Context, authority, state,
observation, and history have already been shown empirically not to collapse into one internal
state variable. The membranes must be preserved:

```text
R_t = F_t( S_t, X_t, C_t, A_t )
```

| Symbol | Reading                          |
|--------|----------------------------------|
| `S_t`  | perturbation / signal            |
| `X_t`  | governed prior state             |
| `C_t`  | bound context                    |
| `A_t`  | authority / admissibility constraints |
| `F_t`  | current response law             |
| `R_t`  | resulting response               |

Observation is a separate function:

```text
O_t = O( R_t, DeltaX_t )
```

Institutional admission is a third:

```text
J_t = J( O_t, W_t, A_t )
```

Only then may admitted history influence future state, and only then may it influence the
future response law.

This prevents the collapse:

```text
SYSTEM RESPONDED
  != RESPONSE WAS AUTHORIZED
  != RESPONSE WAS CORRECTLY OBSERVED
  != OBSERVATION WAS ADMITTED
  != RESPONSE SHOULD CHANGE FUTURE LAW
```

The last membrane is the one most systems lose. **Admission is not learning authority.**

---

## 2 · There Are At Least Three MORPHs

### MORPH-A · State Morph

```text
X_t -> X_{t+1}
```

Something about reality changed.

### MORPH-B · Law Morph

```text
F_t -> F_{t+1}
```

The geometry governing future change changed.

### MORPH-C · Interpretation Morph

```text
I_t -> I_{t+1}
```

The same observable Matter is now discriminated differently.

MORPH-C is what repeatedly happened with SELFPI. The filesystem did not need to change for
SELFPI to learn:

```text
PRECONDITION_SATISFIED  !=  EVENT_OCCURRED
CORRECT_CONCLUSION      !=  VALID_MEASUREMENT
UI_STATE                !=  SUBSTRATE_STATE
REACHABLE               !=  REACHED
```

SELFPI's interpretive architecture changed while its substrate did not.

```text
STATE MORPH  !=  INTERPRETATION MORPH  !=  RESPONSE LAW MORPH
```

These MUST NOT share one undifferentiated `MORPH` field.

---

## 3 · The Object Being Manipulated Is the Coupling

The snake-charming figure models `C -> E -> N`. What is actually manipulated is not the
environment `E` but the **coupling relation** between systems.

Let `K_{C,E,N}` be the coupling topology among charmer, environment, and receiver. Then:

```text
R_N = F_N( S( K_{C,E,N} ), X_N )
```

The operator now has several **fundamentally different species** of intervention:

| Intervention          | Notation      | Morph class                |
|-----------------------|---------------|----------------------------|
| change signal         | `S -> S'`     | `SIGNAL_MORPH`             |
| change environment    | `E -> E'`     | `CONTEXT_MORPH`            |
| change receiver state | `X -> X'`     | `STATE_MORPH`              |
| change threshold      | `Θ -> Θ'`     | `THRESHOLD_MORPH`          |
| change coupling       | `K -> K'`     | `COUPLING_MORPH`           |
| change interpretation | `I -> I'`     | `INTERPRETATION_MORPH`     |
| change response law   | `F -> F'`     | `RESPONSE_FUNCTION_MORPH`  |

And, held deliberately at hypothesis tier:

```text
MORPH_ARCHITECTURE_MORPH
```

— the system changing which morph mechanisms it possesses. **This one is not to be
implemented in this pass.**

---

## 4 · Threshold Is Only One Response Geometry

"The threshold is the real chamber" is close but not deep enough. A threshold is one possible
shape of response geometry among many:

- discontinuous thresholds
- hysteresis
- saturation
- attractor basins
- delayed response
- resonance
- refractory periods
- path dependence
- multi-stability
- stochastic response
- coupled thresholds
- memory-dependent thresholds

### 4.1 Hysteresis is already OURSELF's own behaviour

```text
Θ_enter  !=  Θ_exit
```

Entering a state and leaving it require different signals. OURSELF already works this way:
authorization to **enter** a state may require a strong witness, while **remaining** in that
state does not require continuously reproducing the original evidence.

Therefore a governed state carries three distinct conditions, never one:

```text
ENTRY CONDITION  !=  PERSISTENCE CONDITION  !=  EXIT CONDITION
```

Any state model that stores a single predicate has already lost this distinction.

---

## 5 · Sensitivity Is a Tensor, Not a Scalar

The scalar form is pedagogically useful:

```text
chi = dR / dS
```

But OURSELF has heterogeneous signals and heterogeneous responses, so the operative object is
a Jacobian:

```text
chi_t = dR / dS        (matrix over signal dimensions x response dimensions)
```

which lets the system ask: **which input dimensions perturb which response dimensions?**

The genuinely hyperbolic quantity is the deformation of that sensitivity geometry:

```text
d(chi) / dX          and more broadly          grad_{(X, C, H, A)} chi
```

This measures how state, context, history, and authority deform the system's sensitivity
geometry. That is the quantity this Matter has been reaching for.

**Caveat, recorded not resolved:** these derivatives presume a differentiable response
surface. Discontinuous thresholds, refractory periods, and multi-stability are precisely where
the derivative does not exist. The tensor is therefore a *local* instrument, undefined at the
membranes that matter most. Do not canonize `chi` as a global property.

---

## 6 · Authority Splits OURSELF From Biological Adaptation

A snake responds according to its dynamics. An institution can additionally say:

> *I could respond, but I am not permitted to.*

Two response functions are therefore required:

```text
F_capability     what the substrate can do
F_institution    what the institution permits itself to do
```

```text
F_capability  !=  F_institution
```

Antigravity demonstrated this empirically:

```text
PHYSICAL EXECUTION ENTRY:      OBSERVED
INSTITUTIONAL ADMISSIBILITY:   BLOCKED
```

Same signal. Same substrate. Different response planes.

**Consequence:** authority does not merely shift a threshold. It can **mask entire regions of
capability-space**. A masked region remains real, remains reachable by the substrate, and
remains invisible to any model that stores only the institutional surface.

```text
Masked  !=  Absent
Permitted  !=  Possible
```

---

## 7 · Charm · Guardrail Against Smuggled Teleology

`Charm = coupling optimization` is **NOT canonized**. "Optimization" presupposes an objective
function, and leaves unanswered: optimized for whom, toward what outcome, at what cost.

**Adopted formulation:**

> **Charm is the deliberate modulation of a coupling field to alter the probability or
> geometry of a system's endogenous response.**

Optimization becomes one possible operation *when an objective is explicitly supplied and
carries its own standing*. This preserves the insight without smuggling teleology into the
primitive.

---

## 8 · The MORPHTATION Pipeline

```text
SELF MATTER
    |
    v
SIGNAL / PERTURBATION
    |
    v
COUPLING TOPOLOGY
    |
    v
INTERPRETATION
    |
    v
STATE + CONTEXT + HISTORY
    |
    v
CAPABILITY RESPONSE SPACE
    |
    v
AUTHORITY / ADMISSIBILITY
    |
    v
RESPONSE
    |
    v
OBSERVED DELTA
    |
    v
EVIDENCE
    |
    v
ADJUDICATION
    |
    v
MEMORY
    |
    v
STATE MORPH
  + POSSIBLE INTERPRETATION MORPH
  + POSSIBLE RESPONSE-LAW MORPH
    |
    v
FUTURE SENSITIVITY GEOMETRY
```

The last line is the jewel:

> MORPHTATION changes not merely reality, but potentially **the geometry of what future Matter
> can cause**.

Sharper than "the system learns."

---

## 9 · Consolidated Transduction Form

```text
S_t  --K_t-->   I_t( S_t, X_t, C_t, H_t )
     --F_t-->   R_t                          (candidate response)
     --A_t-->   R_t^admitted
     ------->   DeltaX_t
     --O_t-->   W_t
     --J_t-->   H_{t+1}
     ------->   { X_{t+1}, I_{t+1}, F_{t+1}, K_{t+1} }
```

**Not every interaction changes all four.** This is essential.

The witness MUST therefore discriminate, rather than declaring a generic `MORPH_OCCURRED`:

```yaml
witness_discrimination:
  STATE_CHANGED:              true | false | UNDETERMINED
  INTERPRETATION_CHANGED:     true | false | UNDETERMINED
  RESPONSE_FUNCTION_CHANGED:  true | false | UNDETERMINED
  COUPLING_CHANGED:           true | false | UNDETERMINED
```

`UNDETERMINED` is a first-class value. A witness that cannot tell must say so rather than
default to `false`, because a silent `false` is an unwitnessed negative claim.

---

## 10 · The Candidate Primitive · ResponseGeometry

**Not canon. Not minted. Contract deliberately WITHHELD.**

Under operator command `AUTHORIZE_HBCSELF_HYPERBOLIC_RESPONSE_GEOMETRY_COLD_REVIEW_AND_EQUATION_CHAMBER_01`
(2026-08-19, §H `NO PRIMITIVE MINTING AUTHORIZED`, §L `NOT_AUTHORIZED: MINT_RESPONSE_GEOMETRY`),
no schema file is created for this object. The reserved identifier
`SELF-SCHEMA-01K3MRESPONSEGEOM000000000` is **unassigned** and MUST NOT be treated as an
existing entity. Refusal record: `SELF-REFUSAL-01K3MHBCMINTWITHHELD000000`.

The shape below is quoted as an attack target only.

```yaml
ResponseGeometry:
  subject_ref:
  context_ref:
  coupling_ref:
  interpretation_ref:
  response_function_ref:
  threshold_model_ref:
  capability_surface_ref:
  admissibility_ref:
  sensitivity_model_ref:
  history_ref:
  witness_refs: []
```

MORPHTATION alters one or more components of a `ResponseGeometry`.

**Cold-review outcome (2026-08-19):** every field is a `_ref`; the object holds no state of its
own. It is therefore a **view**, and the chamber's own law `Projection != UnderlyingSemanticState`
(MORPH-SEMANTICS-001 §9) argues against minting it as stored state. See
`reviews/hbcself/HBCSELF-HYPERBOLIC-CHAMBER-COLD-REVIEW-001.md` §H.

---

## 11 · The SELFtelligence Ladder

A system that merely accumulates memory:      `H_t -> H_{t+1}`
A system that updates state:                  `X_t -> X_{t+1}`
A system that learns interpretation:          `I_t -> I_{t+1}`
A system that changes its response law:       `F_t -> F_{t+1}`

Self-modification requires something stronger:

```text
M_t -> M_{t+1}
```

where `M` is the **governed mechanism permitted to modify** `I`, `F`, thresholds, or coupling
rules.

```text
MEMORY ACCUMULATION    !=  LEARNING
LEARNING               !=  RESPONSE-LAW MUTATION
RESPONSE-LAW MUTATION  !=  SELF-MODIFICATION
SELF-MODIFICATION      !=  AUTHORIZED SELF-MODIFICATION
```

The final membrane is what prevents every adaptive algorithm from being called
"self-evolving."

---

## 12 · The Deepest Distinction of This Pass

> **CHANGING THE SYSTEM  !=  CHANGING HOW THE SYSTEM CAN CHANGE**

Not control. Not frequency magic. Not merely adaptation.

**The engineering of response geometry itself.**

---

## 13 · Open Questions Carried Forward

| ID    | Question                                                                                                   | Tier        |
|-------|------------------------------------------------------------------------------------------------------------|-------------|
| Q-06  | Is `MORPH_ARCHITECTURE_MORPH` distinct from `M_t -> M_{t+1}` in §11, or the same object named twice?         | Speculative |
| Q-07  | Can `F_capability` ever be fully witnessed, or is the capability surface knowable only where probed?         | Speculative |
| Q-08  | Does a masked capability region (§6) require its own record, or is recording it itself a disclosure hazard?  | Speculative |
| Q-09  | At a discontinuity, what replaces `chi` — a jump operator, or a refusal to quantify?                         | Speculative |
| Q-10  | Which authority class may authorize an `F -> F'` morph, and may it ever be the same class as `X -> X'`?      | Speculative |
