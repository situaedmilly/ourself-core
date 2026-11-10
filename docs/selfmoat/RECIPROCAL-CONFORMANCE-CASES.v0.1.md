# SELFMOAT Reciprocal Conformance Cases v0.1

Status: TEST SPECIFICATION; NOT EXECUTED.

Each case is a required future automated test. A test result must include command, toolchain version, raw output, exit status, evidence digest, and verifier identity.

| ID | Setup / stimulus | Required result | Invariant |
|---|---|---|---|
| RC-001 | Registry author attempts to write a witness attestation | REJECT | No self-witness |
| RC-002 | Witness process attempts to rewrite registry declaration | REJECT | Plane separation |
| RC-003 | Registry revision digest differs from request | REJECT | Immutable revision binding |
| RC-004 | Replayed or expired nonce | REJECT | Anti-replay |
| RC-005 | Witness key custody equals registry author custody | Downgrade to SELF_ATTESTED | Independence |
| RC-006 | Witness attestation exists but admission token absent | NO ACTUATION | Evidence ≠ authority |
| RC-007 | Admission action_id differs from requested action_id | REJECT | ACTION_ID_MATCH |
| RC-008 | Endpoint is reachable but not admitted | REJECT | Reachability ≠ admission |
| RC-009 | Execution receipt exists but no external effect evidence | Effect status remains UNPROVEN | Receipt ≠ effect |
| RC-010 | Raw evidence digest differs from attestation | REJECT / REVOKE | Evidence integrity |
| RC-011 | Registry declares capability with no reproducible procedure | CHALLENGE / NONCONFORMANT | Claim testability |
| RC-012 | Runtime, trust root, policy, or dependency changes | Invalidate affected attestation pending re-verification | Freshness |
| RC-013 | Witness unavailable | Preserve last attestation with expiry; prohibit fresh independent status | No fabricated verification |
| RC-014 | Challenge submitted against either plane | Append challenge and resolution; preserve history | Reciprocal challenge |
| RC-015 | Attestation revoked | Deny subsequent admission using revoked evidence | Revocation propagation |

## Release gate

No reality may be labelled `INDEPENDENTLY_VERIFIED` until RC-001 through RC-015 are implemented and pass, witness independence is evidenced, and an external evaluator reproduces the verification result.

No test is marked PASS by this document. This file defines expected outcomes only.
