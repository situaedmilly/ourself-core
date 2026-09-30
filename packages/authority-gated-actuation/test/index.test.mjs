import test from "node:test";
import assert from "node:assert/strict";
import { proveOrder } from "../../crop-order-proof/src/index.mjs";
import { createActuationKernel, createOutboxWorker, recontactDelivery } from "../src/index.mjs";

function makeStore() {
  const intents = new Map();
  const outboxes = [];
  const attempts = new Map();
  const receipts = [];
  let sequence = 0;
  return {
    intents, outboxes, attempts, receipts,
    transaction(fn) {
      return fn({
        findByIdempotencyKey(key) { return outboxes.find((x) => x.idempotency_key === key) ?? null; },
        enqueue(item) { const outbox = { ...item, outbox_id: `outbox-${++sequence}` }; outboxes.push(outbox); return outbox; },
        setIntentState(intentId, state) { intents.set(intentId, { ...(intents.get(intentId) ?? {}), intent_id: intentId, state }); },
        recordReceipt(receipt) { receipts.push({ receipt_id: `receipt-${++sequence}`, ...receipt }); },
        claimNext() { const item = outboxes.find((x) => x.status === "PENDING"); if (!item) return null; item.status = "CLAIMED"; item.claimed_at = new Date().toISOString(); return { ...item }; },
        startAttempt(item) { const attempt = { attempt_id: `attempt-${++sequence}`, intent_id: item.intent_id, status: "STARTED" }; attempts.set(attempt.attempt_id, attempt); return attempt; },
        finishAttempt(id, observed) { const a = attempts.get(id); a.status = observed.status; a.provider_reference = observed.provider_reference ?? null; },
        failAttempt(id, error) { const a = attempts.get(id); a.status = "UNKNOWN"; a.error = error; },
        publishOutbox(id) { outboxes.find((x) => x.outbox_id === id).status = "PUBLISHED"; },
        retryOutbox(id) { outboxes.find((x) => x.outbox_id === id).status = "RETRY"; },
        findAttempt(id) { return attempts.get(id) ?? null; },
        markDelivered(id, providerReference) { const a = attempts.get(id); a.status = "DELIVERED"; a.provider_reference = providerReference; return { attempt_id: id, status: "DELIVERED" }; },
      });
    },
  };
}

const event = (id, parents = []) => ({
  event_id: id,
  reality_id: "OURSELF",
  instance_id: "test-instance",
  parents,
  authority: { status: "ADMITTED", reference: `authority:${id}` },
  execution: { status: "OBSERVED", receipt_id: `receipt:${id}`, pre_state_hash: `pre:${id}`, post_state_hash: `post:${id}` },
  evidence: { status: "VERIFIED", digest: `sha256:${id}` },
});

function intent(overrides = {}) {
  return {
    intent_id: "intent-001",
    reality_id: "OURSELF",
    instance_id: "instance-001",
    principal_id: "founder-test",
    intent_type: "MESSAGE_SEND",
    recipient_ref: "local:test-recipient",
    payload: { body: "governed test" },
    idempotency_key: "idem-001",
    policy_version: "test-policy-v1",
    state: "DECLARED",
    destination: "LOCAL_TEST",
    ...overrides,
  };
}

test("admits only verified authority + CROP proof and atomically enqueues outbox work", () => {
  const store = makeStore();
  const kernel = createActuationKernel({ authorityVerifier: { verify: () => ({ verified: true, admission_id: "adm-001", policy_version: "policy-v1" }) }, cropVerifier: proveOrder, outbox: store });
  const result = kernel.admitAndEnqueue(intent(), [event("A")]);
  assert.equal(result.state, "QUEUED");
  assert.equal(store.outboxes.length, 1);
  assert.equal(store.outboxes[0].status, "PENDING");
  assert.equal(store.receipts.filter((r) => r.receipt_type === "ADMISSION").length, 1);
  assert.equal(store.receipts.filter((r) => r.receipt_type === "CROP_PROOF").length, 1);
});

test("rejects unverified authority before outbox mutation", () => {
  const store = makeStore();
  const kernel = createActuationKernel({ authorityVerifier: { verify: () => ({ verified: false }) }, cropVerifier: proveOrder, outbox: store });
  assert.throws(() => kernel.admitAndEnqueue(intent(), [event("A")]), /AUTHORITY_UNVERIFIED/);
  assert.equal(store.outboxes.length, 0);
});

test("idempotency replays the existing admission without a second outbox row", () => {
  const store = makeStore();
  const kernel = createActuationKernel({ authorityVerifier: { verify: () => ({ verified: true, admission_id: "adm-001", policy_version: "policy-v1" }) }, cropVerifier: proveOrder, outbox: store });
  const first = kernel.admitAndEnqueue(intent(), [event("A")]);
  const second = kernel.admitAndEnqueue(intent(), [event("A")]);
  assert.equal(first.replay, false);
  assert.equal(second.replay, true);
  assert.equal(store.outboxes.length, 1);
});

test("transport ACK cannot complete the intent; delivery is a separate recontact observation", () => {
  const store = makeStore();
  store.intents.set("intent-001", intent());
  const kernel = createActuationKernel({ authorityVerifier: { verify: () => ({ verified: true, admission_id: "adm-001", policy_version: "policy-v1" }) }, cropVerifier: proveOrder, outbox: store });
  kernel.admitAndEnqueue(intent(), [event("A")]);
  const worker = createOutboxWorker({ outbox: store, transport: { submit: () => ({ status: "ACCEPTED", issuer: "FAKE_TRANSPORT", provider_reference: "fake-submit-001" }) } });
  const ack = worker.dispatchOnce();
  assert.equal(ack.status, "ACCEPTED");
  assert.equal(store.intents.get("intent-001").state, "ACTUATING");
  assert.equal(store.receipts.at(-1).receipt_type, "TRANSPORT_ACK");
  assert.equal(store.receipts.at(-1).verified, false);

  const delivered = recontactDelivery({ outbox: store, report: { status: "DELIVERED", issuer: "FAKE_TRANSPORT", provider_reference: "fake-delivery-001", attempt_id: ack.attempt_id } });
  assert.equal(delivered.status, "DELIVERED");
  assert.equal(store.intents.get("intent-001").state, "COMPLETED");
  assert.equal(store.receipts.at(-1).receipt_type, "DELIVERY_REPORT");
});
