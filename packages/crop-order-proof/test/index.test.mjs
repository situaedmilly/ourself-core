import test from "node:test";
import assert from "node:assert/strict";
import { proveOrder } from "../src/index.mjs";

const event = (event_id, parents = [], overrides = {}) => ({
  event_id,
  reality_id: event_id === "A" ? "AGENTBRIDGE" : "ALTONUMBUSELF",
  instance_id: "instance-" + event_id,
  parents,
  authority: { status: "ADMITTED", reference: "authority:" + event_id },
  execution: {
    status: "OBSERVED",
    receipt_id: "receipt:" + event_id,
    pre_state_hash: "pre:" + event_id,
    post_state_hash: "post:" + event_id,
  },
  evidence: { status: "VERIFIED", digest: "sha256:" + event_id },
  ...overrides,
});

test("orders cross-reality events by explicit causal parent", () => {
  const proof = proveOrder([event("B", ["A"]), event("A")]);
  assert.deepEqual(proof.ordered_event_ids, ["A", "B"]);
  assert.deepEqual(proof.concurrent_pairs, []);
  assert.equal(proof.result, "ORDER_PROVEN");
});

test("reports independent events as concurrent, not causally ordered", () => {
  const proof = proveOrder([event("B"), event("A")]);
  assert.deepEqual(proof.ordered_event_ids, ["A", "B"]);
  assert.deepEqual(proof.concurrent_pairs, [["A", "B"]]);
});

test("rejects missing dependencies", () => {
  assert.throws(() => proveOrder([event("B", ["MISSING"])]), /MISSING_DEPENDENCY/);
});

test("rejects causal cycles", () => {
  assert.throws(() => proveOrder([event("A", ["B"]), event("B", ["A"])]), /CAUSAL_CYCLE/);
});

test("rejects unproven authority", () => {
  assert.throws(
    () => proveOrder([event("A", [], { authority: { status: "PROPOSED", reference: "x" } })]),
    /AUTHORITY_UNPROVEN/,
  );
});

test("rejects unverified execution evidence", () => {
  assert.throws(
    () => proveOrder([event("A", [], { execution: { status: "PENDING" } })]),
    /EXECUTION_UNPROVEN/,
  );
});

test("rejects duplicate event identifiers", () => {
  assert.throws(() => proveOrder([event("A"), event("A")]), /DUPLICATE_EVENT/);
});
