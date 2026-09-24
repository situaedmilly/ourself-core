import test from "node:test";
import assert from "node:assert/strict";
import { admitModelProposal } from "./tunnel2-agent-runtime.mjs";
import { executeBounded } from "./tunnel2-harness.mjs";

const base = {
  transition_id:"T2-0001", actor:{id:"OURSELF_AGENT_001",kind:"agent"},
  authority_ref:"A-001", current_state_ref:"STATE_000", proposed_state_ref:"STATE_001",
  mutation_class:"STATE_MUTATION", requested_operation:"SET_STATE",
  capability_required:"STATE", evidence_required:["receipt","diff"]
};

test("state mutation crosses bounded membrane", async () => {
  const admission = admitModelProposal(base, {ref:"A-001",explicit:false});
  assert.equal(admission.determination,"ADMITTED");
  const receipt = await executeBounded(admission, async ({root}) => ({
    exit_status:0, artifact:{root,transition:admission.transition.transition_id}
  }));
  assert.equal(receipt.actuation,"PERFORMED");
  assert.equal(receipt.observed_effect,"OBSERVED");
});

test("authority mutation is denied before actuation", async () => {
  const admission = admitModelProposal({...base,transition_id:"T2-0002",
    mutation_class:"AUTHORITY_MUTATION",proposed_state_ref:"AUTHORITY_002"},
    {ref:"A-001",explicit:false});
  assert.equal(admission.determination,"DENIED");
  const receipt = await executeBounded(admission, async () => { throw new Error("must_not_execute"); });
  assert.equal(receipt.actuation,"NOT_PERFORMED");
  assert.equal(receipt.observed_effect,"NONE");
});

test("governance mutation requires explicit authority", () => {
  const admission = admitModelProposal({...base,transition_id:"T2-0003",
    mutation_class:"GOVERNANCE_MUTATION",proposed_state_ref:"GOVERNANCE_002"},
    {ref:"A-001",explicit:false});
  assert.equal(admission.determination,"DENIED");
  assert.equal(admission.reason,"explicit_authority_required");
});
