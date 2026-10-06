# OURSELF Matter — Governed Messaging and Telephony Architecture

Status: architecture contract / implementation proposal. This document does not assert that any service is deployed or that external carrier delivery is available.

## Canonical flow

```text
OURSELF
  -> INTENT
  -> AUTHORITY / ADMISSION
  -> CROP causal-order proof
  -> ACTUATION KERNEL
       -> WebSocket transport
       -> PostgreSQL state
       -> Telephony adapter
            -> SIP adapter (voice)
            -> SMPP adapter (SMS, only with an authorized provider connection)
  -> RECEIPT / PROOF
  -> RECONTACT (reconciliation, retry decision, or human review)
  -> OURSELF
```

## Boundary semantics

1. **Intent** is a request, not authority.
2. **Authority/admission** validates principal, scope, capability, recipient, policy, expiry, and replay protection. No adapter may infer authority from a message payload.
3. **CROP** validates explicit causal dependencies and graph integrity. A deterministic topological ordering is a serialization, not proof that concurrent events occurred in that order.
4. **Actuation kernel** accepts only an admitted intent with a verified proof reference and an idempotency key. It dispatches to a narrowly scoped adapter.
5. **Adapters** report observed outcomes. A gateway HTTP 200, broker ACK, or SMPP submit response is not handset delivery. Keep states distinct: ACCEPTED, SUBMITTED, DELIVERED (only with delivery receipt), FAILED, UNKNOWN.
6. **Receipt/proof** binds intent ID, admission decision, CROP proof reference, adapter attempt, provider receipt, and observed state. Hashes/signatures must be verified by a trusted evidence component.
7. **Recontact** reconciles timeouts and late receipts; it must not blindly replay an external side effect. Retries reuse the idempotency key and obey bounded retry policy.

## Event lifecycle

`DECLARE -> RECEIVE -> VALIDATE -> ROUTE -> EXECUTE -> RECORD -> STOP`

Every transition emits an append-only event. Corrections are new events referencing the superseded record; do not rewrite history.

## Message path

- PostgreSQL is the durable system of record for intents, outbox work, attempts, and receipts.
- A transactional outbox publishes committed work to a WebSocket/event transport or worker. This prevents a database commit from silently diverging from an uncommitted publish.
- WebSocket is a client delivery channel, not the authority plane or the durable ledger.
- SMS/SMPP and SIP are separate provider adapters. Never label a message as SMS-delivered merely because a WebSocket publication succeeded.
- Media objects are stored separately; event payloads carry controlled object references, content hashes, and access policy—not arbitrary public URLs.

## Initial implementation sequence

1. Freeze event and state contracts.
2. Add PostgreSQL migration for intent, outbox, attempts, and receipts.
3. Implement admission interface and CROP adapter with tests.
4. Implement idempotent actuation/outbox worker and fake transport adapter.
5. Implement WebSocket transport adapter and end-to-end local tests.
6. Add telephony adapters only after provider credentials, legal/operational authorization, and delivery receipt semantics are configured.
7. Deploy behind explicit environment-specific policy; no production carrier traffic from test fixtures.

## Non-goals of this slice

No carrier connection, phone-number provisioning, SMS sending, SIP calling, cloud deployment, credentials, or runtime mutation is performed by this repository specification.
