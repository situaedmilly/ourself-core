# SELFECTION Runtime Contract · v0.1 CANDIDATE

SELFECTION is the effect-manifestation runtime boundary. It receives only independently authorized transitions and attempts their bounded realization in a target substrate.

## Preconditions

A transition may enter SELFECTION only when all required refs exist:

- selected candidate ref
- authority-decision ref
- target-substrate ref
- effect-boundary ref
- rollback/compensation ref when required
- witness-policy ref

## Outputs

- execution-attempt ref
- observed effects
- witness refs
- unresolved effects
- failure/rollback state

## Hard laws

`SELFLECTION != SELFECTION`  
`Selected != Authorized`  
`Authorized != Executed`  
`Executed != Successful`  
`Successful != Standing`  
`RuntimeEffect != InstitutionalAdjudication`

## v0.1 prohibition

This file defines the runtime contract only. No autonomous executor, GitHub Action, shell runner, mutation loop, credential flow, or deployment mechanism is implemented or authorized here.
