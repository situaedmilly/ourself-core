# ENDPOINTREALITY / MASTERBYTE v0.1

## Purpose

`ENDPOINTREALITY` is the canonical byte-addressable witness object for an observed OURSELF endpoint.

```text
ENDPOINTSELFPOINTER
        ↓
ENDPOINTSELFWITNESS
        ↓
ENDPOINTREALITY
        ↓
SELFTHOUGHT REFERENCE
```

The pointer answers where/how to recontact. The witness records what was observed. The master-byte record provides deterministic byte identity. The self-thought lets another SELF reference that exact representation.

## Master-byte contract

`masterByteReality()` produces UTF-8 canonical bytes, exact byte length, SHA-256 over those bytes, and base64 carrying those exact bytes.

Canonicalization sorts object keys recursively and preserves array order. The resulting byte sequence is deterministic for the same semantic object.

The SHA-256 digest is an integrity identifier. It is not an authority grant and does not prove that a foreign SELF is entitled to actuate the endpoint.

## SELFTHOUGHT

`makeEndpointRealitySelfThought()` creates a SELFTHOUGHT whose kind is `ENDPOINTREALITY_REFERENCE`, whose source is `THIRDEYE`, and whose authority remains `OBSERVATION_ONLY`.

Another SELF can use `reality_id + sha256 + byte_length` as the reference key, then independently verify the supplied canonical bytes before admitting the representation.

## OURSELFSHIFT_GLITCH

`detectOurselfShiftGlitch(previous, next, ...)` compares master-byte hashes for the same `reality_id`.

A changed hash emits an `OURSELFSHIFT_GLITCH` with reason `REALITY_BYTES_CHANGED`. This is a state-transition record, not a claim that the new state is authorized.

A route changing from 404 to 200, for example, is an observed reality shift that still requires independent recontact and protocol admission before being called an MCP endpoint.

## ACTIMANIRUN

`actimanirunEndpointReality()` records the canonical self-thought and emits a receipt bound to `execution_id`, `thought_id`, `reality_id`, `reality_sha256`, `reality_bytes`, `shift_id`, and `authority = OBSERVATION_ONLY`.

This primitive does not open ports, send network traffic, create an MCP server, or grant endpoint authority by itself.

## Current SELFPI observation shape

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

The model catalog returned by `/v1/models` is runtime evidence. Capture the route/body bytes when exact network-response reproduction is required.

## SELFMOAT

```text
POINTER ≠ PROOF
PROOF ≠ AUTHORITY
OBSERVATION ≠ ADMISSION
MCP DECLARATION ≠ LIVE MCP
HASH ≠ AUTHORITY
```