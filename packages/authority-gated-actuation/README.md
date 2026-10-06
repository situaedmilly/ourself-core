# Authority-Gated Actuation Kernel v0.1

This package establishes the transition from a proven causal event graph into an admitted transactional outbox item.

## Admission boundary

`DECLARED -> AUTHORITY_VERIFIED -> ACTUATION_ADMITTED -> OUTBOX_ENQUEUED`

The kernel requires:

- an independently verified authority decision;
- a CROP result of `ORDER_PROVEN`;
- a non-empty idempotency key;
- a transactional outbox implementation.

The kernel emits admission and CROP receipts inside the same outbox transaction. A duplicate idempotency key recontacts the existing outbox row instead of creating a second actuation.

## Transport boundary

The outbox worker consumes already-admitted work. A transport result is an observation only.

- transport ACK != authority
- transport ACK != execution
- transport ACK != delivery

The worker records `TRANSPORT_ACK` and leaves the intent in `ACTUATING`. A separate delivery report must be recontacted before the intent reaches `COMPLETED`.

## Scope

This slice contains no carrier credentials, SMS/SMPP connection, SIP connection, phone-number provisioning, or production deployment. The local test transport is the only transport realization.
