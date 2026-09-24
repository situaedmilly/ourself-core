import test from "node:test";
import assert from "node:assert/strict";
import { normalizeOllamaLaunch, buildOllamaProposal } from "./ollamaself-launch.mjs";

test("OLLAMASELF launch normalizes as cognitive realization, not authority", () => {
  const launch = normalizeOllamaLaunch({
    instance_id: "OLLAMASELF-001",
    model: "local-model",
    authority_ref: "A-001",
    requested_capabilities: ["inference"]
  });
  assert.equal(launch.realization_class, "COGNITIVE_REALIZATION");
  assert.equal(launch.requested_effect, "MODEL_INFERENCE");
  assert.equal(launch.external_actuation, false);
});

test("OLLAMASELF proposal cannot self-authorize or declare external effect", () => {
  const proposal = buildOllamaProposal(normalizeOllamaLaunch({
    instance_id: "OLLAMASELF-001",
    model: "local-model"
  }));
  assert.equal(proposal.boundary.may_grant_authority, false);
  assert.equal(proposal.boundary.may_self_admit, false);
  assert.equal(proposal.boundary.may_self_actuate, false);
  assert.equal(proposal.boundary.may_mutate_governance, false);
  assert.equal(proposal.boundary.may_declare_external_effect_realized, false);
});
