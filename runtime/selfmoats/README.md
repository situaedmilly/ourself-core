# OURSELF SELFMOATS Runtime v0.1

This branch introduces two independent, fail-closed runtime boundaries.

## IDENTITYMOAT

- Binds a founder principal to a P-256 public key.
- Uses a macOS Secure Enclave private key and Keychain access control requiring the current biometric set.
- Issues short-lived, audience- and scope-bound challenges.
- Verifies ECDSA P-256/SHA-256 proofs and rejects replay.
- Records local key possession separately from independent identity attestation.
- Never derives constitutional authority from a biometric, key, local account, or successful signature.

The native helper's status command is observational. Its enroll command creates a persistent Secure Enclave key and writes a public identity record. Its sign command takes the enrolled principal ID and requests local biometric authorization to sign a challenge.

Enrollment is intentionally not invoked by tests or this branch build. It requires a live user-presence ceremony on the Mac.

## HELPMOAT

- Allows explanation, summarization and drafting as assistance only.
- Allows proposals only as proposals.
- Allows inspection only when the source scope is explicit.
- Denies execution, mutation, deletion, network, credential, identity-enrollment, authority-grant, broker, boot and restoration effects.
- Never treats model output, identity proof, proposal or receipt as authority.

All decisions explicitly report effect_performed=false and authority_granted=false.

## Verification

Run:

node --test runtime/selfmoats/identity/test/*.test.mjs runtime/selfmoats/help/test/*.test.mjs

Compile the native helper:

swiftc runtime/selfmoats/identity/secure-enclave-founder-key.swift -o /tmp/ourself-founder-key

Observe biometric availability:

/tmp/ourself-founder-key status

Do not run enroll without the founder physically present and ready to approve the biometric ceremony.
