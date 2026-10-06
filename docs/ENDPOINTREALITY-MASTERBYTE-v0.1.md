# ENDPOINTREALITY / MASTERBYTE v0.1

`ENDPOINTSELFREALITY` is a deterministic, byte-addressable witness object for an observed OURSELF endpoint.

```text
ENDPOINTSELFPOINTER
        ↓
ENDPOINTSELFWITNESS
        ↓
ENDPOINTREALITY
        ↓
SELFTHOUGHT REFERENCE
```

## Master byte

`masterByteReality()` recursively sorts object keys, preserves array order, encodes the canonical representation as UTF-8, records exact byte length, computes SHA-256 over those bytes, and carries the exact bytes as base64.

The digest is an integrity identifier only. `HASH != AUTHORITY`.

## SELFTHOUGHT reference

`makeEndpointRealitySelfThought()` emits a `SELFTHOUGHT` with `thought_kind = ENDPOINTREALITY_REFERENCE`, `source = THIRDEYE`, and `authority = OBSERVATION_ONLY`.

A foreign SELF can reference `reality_id + sha256 + byte_length`, then independently verify the exact canonical bytes before treating the representation as admissible.

## OURSELFSHIFT_GLITCH

`detectOurselfShiftGlitch()` compares the master-byte hashes of two observations with the same `reality_id`.

A changed byte representation produces `OURSELFSHIFT_GLITCH / REALITY_BYTES_CHANGED`. This is a state-transition record, not a failure and not an authority grant.

## ACTIMANIRUN

`actimanirunEndpointReality()` records the self-thought and emits a receipt binding execution, thought, reality ID, master-byte hash, byte length, and optional shift ID. The receipt remains `OBSERVATION_ONLY`.

It does not open a port, send network traffic, expose MCP, or grant authority by itself.

## Observed SELFPI shape represented by the test fixture

```text
192.168.12.112
 ├── :22       SSH                 = REACHABLE
 ├── :3000     WEB APPLICATION     = RESPONDING
 │    ├── /mcp        = 404
 │    └── /v1/models = 404
 └── :11434    OLLAMA MODEL API    = RESPONDING
      ├── /mcp        = 404
      └── /v1/models = 200
```

Those facts came from the supplied Third-Eye observation. The model-list response bytes themselves are not embedded here because only a truncated response was supplied; exact body-level reproduction requires capturing the complete response bytes and hashing them.

## Moat

```text
POINTER ≠ PROOF
PROOF ≠ AUTHORITY
OBSERVATION ≠ ADMISSION
MCP DECLARATION ≠ LIVE MCP
HASH ≠ AUTHORITY
```