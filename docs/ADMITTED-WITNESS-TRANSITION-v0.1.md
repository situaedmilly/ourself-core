# ADMITTED_WITNESS_TRANSITION v0.1

## Purpose

Define the bounded transition that consumes an admitted REPRESENTATION_WITNESS receipt without collapsing admission, authorization, actuation, execution, effect, or effect admission.

## Constitutional separation

```text
ADMISSION
  !=
AUTHORIZATION
  !=
ACTUATION
  !=
EXECUTION
  !=
EFFECT
  !=
WITNESS
  !=
EFFECT ADMISSION
```

An admitted witness is an evidence-bearing input. It does not itself grant authority.

## Witness intake

A receipt enters this transition only when:

- witness = REPRESENTATION_WITNESS
- version = 0.1
- syntax = PASS
- representation = COMPLETE
- semantic_equality = PASS
- decision = ADMIT
- losses = []
- drift = []

The intake result is `WITNESS_ACCEPTED`. It is not an authorization result.

## Authorization grant

```text
AUTHORIZATION_GRANT
├── grant_id
├── subject
├── transition
├── issued_at
├── expires_at
└── status
```

A grant is requestable only when:

```text
grant.status = ACTIVE
AND
now < expires_at
AND
grant.transition = requested transition
```

Boundary semantics:

```text
now < expires_at  -> AUTHORIZED / ACTUATION_REQUESTABLE
now >= expires_at -> EXPIRED / ACTUATION_FORBIDDEN
```

`EXPIRED` is a distinct authorization state. It is not `REVOKED`, `REJECTED`, `EXECUTED`, or `STOP`.

## Injected clock

The authorization decision receives a `Clock` interface. Tests use `fixedClock()` so temporal behavior is deterministic and hostile boundary conditions are directly testable.

## Actuation boundary

`requestActuation()` can only produce `ACTUATION_REQUESTED` from an `AUTHORIZED` decision. It never executes an actuator.

## Execution boundary

`recordExecution()` records an execution receipt supplied by the actuator/runtime. The request itself does not imply execution.

## Effect witness boundary

`witnessEffect()` requires external evidence tied to the execution ID. Execution does not witness itself.

## Effect admission

`admitWitnessedEffect()` requires a separate `EffectAdmissionDecision`. A witnessed effect is evidence for admission; it is not automatically admitted.

The independent decision contains:

```text
eligible = true  -> EFFECT_ADMITTED
eligible = false -> EFFECT_NOT_ADMITTED
```

The function does not derive eligibility from `EFFECT_WITNESSED` or `evidence_id` alone.

## Failure classes

The implementation uses explicit reasons for:

- `WITNESS_NOT_ADMISSIBLE`
- `AUTHORIZATION_REVOKED`
- `TRANSITION_MISMATCH`
- `AUTHORIZATION_EXPIRED`
- `AUTHORIZATION_NOT_ACTIVE`
- `AUTHORIZATION_REQUIRED`
- `ACTUATION_REQUEST_REQUIRED`
- `EFFECT_WITNESS_REQUIRED`
- `EFFECT_ADMISSION_DECISION_FALSE`

## Non-authority of foreign surfaces

GitHub, CI, model runtimes, and other foreign surfaces do not acquire OURSELF authority merely by transporting or observing these transitions.

## Verification command

Node 22 can execute the test file directly with:

```bash
node --experimental-strip-types --test tests/admitted-witness-transition.test.ts
```

The repository does not require npm configuration for this bounded test path.

## Expected state machine

```text
ADMITTED WITNESS
      |
      v
WITNESS_ACCEPTED
      |
      v
AUTHORIZATION_REQUIRED
      |
      +---- now >= expires_at ----> EXPIRED
      |                                |
      |                                v
      |                        ACTUATION_FORBIDDEN
      |
      +---- now < expires_at -----> AUTHORIZED
                                      |
                                      v
                             ACTUATION_REQUESTED
                                      |
                                      v
                                  EXECUTED
                                      |
                                      v
                             EFFECT_UNWITNESSED
                                      |
                         external evidence arrives
                                      |
                                      v
                              EFFECT_WITNESSED
                                      |
                                      v
                              EFFECT_ADMITTED
```
