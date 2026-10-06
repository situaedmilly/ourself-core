# CROP — Cross-Reality Order Proof v0.1

CROP is a small, deterministic verifier for causal ordering across event records from distinct realities (for example, AgentBridge and ALTONUMBUSELF).

## Scope

This package verifies a supplied event DAG. It does **not**:
- establish that an authority reference is genuine;
- cryptographically verify signatures, receipts, or hashes;
- execute actions or admit events into a live runtime;
- establish a globally true total order for concurrent events;
- provide a messaging, SMS, SMPP, SIP, or carrier integration.

The returned field `authority_and_evidence: INPUT_ASSERTIONS_ONLY` is deliberate: the verifier checks required evidence fields and status assertions, but a trusted admission/evidence adapter must verify those assertions before calling CROP.

## Event contract

```json
{
  "event_id": "evt-002",
  "reality_id": "ALTONUMBUSELF",
  "instance_id": "altonum-instance-01",
  "parents": ["evt-001"],
  "authority": {
    "status": "ADMITTED",
    "reference": "authority-receipt-ref"
  },
  "execution": {
    "status": "OBSERVED",
    "receipt_id": "execution-receipt-ref",
    "pre_state_hash": "sha256:...",
    "post_state_hash": "sha256:..."
  },
  "evidence": {
    "status": "VERIFIED",
    "digest": "sha256:..."
  }
}
```

A parent reference means a declared causal dependency, not merely an earlier timestamp. Every parent must be present in the supplied graph. Missing parents and cycles reject the proof. Independent events are reported as concurrent; lexicographic tie-breaking in the returned topological list is only a reproducible serialization, not a claim that one concurrent event happened first.

## Use

Node.js 22+:

```js
import { proveOrder } from "./src/index.mjs";

const proof = proveOrder(events);
console.log(JSON.stringify(proof, null, 2));
```

Run the test suite from this directory:

```sh
node --test
```

## Result contract

- `ORDER_PROVEN`: the supplied graph is acyclic and every event passes the package's structural/status gates.
- Throws `MISSING_DEPENDENCY`, `CAUSAL_CYCLE`, `AUTHORITY_UNPROVEN`, `EXECUTION_UNPROVEN`, or other validation errors on invalid input.
- `concurrent_pairs`: pairs for which neither event is a causal ancestor of the other.

## Next integration boundary

Connect a trusted OURSELF admission/evidence adapter that verifies authority, signatures, receipts, and state commitments; persist immutable event records; then add a transport adapter. Keep message delivery, external telecom gateways, and runtime actuation outside this pure verifier.
