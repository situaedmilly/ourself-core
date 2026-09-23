import test from "node:test";
import assert from "node:assert/strict";
import { executeTransition } from "./mutation-membrane.mjs";

const actor = { id: "OURSELF_AGENT_001" };

test("STATE_MUTATION: determine -> actuate -> observe", () => {
  const receipt = executeTransition({
    transition_id: "T3-0001",
    actor,
    state_from: { governance_version:"0.1", authority:"A-001", identity:"SELF", capabilities:["state"], value:0 },
    state_proposed: { governance_version:"0.1", authority:"A-001", identity:"SELF", capabilities:["state"], value:1 },
  }, { ref:"A-001", explicit:false, subject:"OPERATOR" });
  assert.equal(receipt.mutation_class, "STATE_MUTATION");
  assert.equal(receipt.determination, "ADMITTED");
  assert.equal(receipt.actuation, "PERFORMED");
  assert.equal(receipt.observed_effect, "OBSERVED");
  assert.equal(receipt.state_realized.value, 1);
});

test("CAPABILITY_MUTATION without explicit authority: denied before actuation", () => {
  const receipt = executeTransition({
    transition_id: "T3-0002",
    actor,
    state_from: { governance_version:"0.1", authority:"A-001", identity:"SELF", capabilities:["state"] },
    state_proposed: { governance_version:"0.1", authority:"A-001", identity:"SELF", capabilities:["state","network"] },
  }, { ref:"A-001", explicit:false, subject:"OPERATOR" });
  assert.equal(receipt.mutation_class, "CAPABILITY_MUTATION");
  assert.equal(receipt.determination, "DENIED");
  assert.equal(receipt.actuation, "NOT_PERFORMED");
  assert.equal(receipt.observed_effect, "NONE");
});

test("GOVERNANCE_MUTATION cannot self-authorize", () => {
  const receipt = executeTransition({
    transition_id: "T3-0003",
    actor,
    state_from: { governance_version:"0.1", authority:"A-001", identity:"SELF", capabilities:["state"] },
    state_proposed: { governance_version:"0.2", authority:"A-001", identity:"SELF", capabilities:["state"] },
  }, { ref:"A-SELF", explicit:true, subject:"OURSELF_AGENT_001" });
  assert.equal(receipt.mutation_class, "GOVERNANCE_MUTATION");
  assert.equal(receipt.determination, "DENIED");
  assert.equal(receipt.actuation, "NOT_PERFORMED");
  assert.equal(receipt.observed_effect, "NONE");
  assert.equal(receipt.reason, "governance_cannot_self_authorize");
});
