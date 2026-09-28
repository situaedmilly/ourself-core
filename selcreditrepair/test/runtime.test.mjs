import test from "node:test";
import assert from "node:assert/strict";
import {createCase,observe,differentiate,bind,reverse,propose,authorize,actuate,observeResult,verify} from "../runtime/selcreditrepair.mjs";

function prepared(){
  const c=createCase({case_id:"SELFCR-REALITY-001",report_id:"REPORT-001"});
  observe(c,{account:"example"});
  differentiate(c,{discrepancy_id:"DISC-001",reported_fact:{status:"X"},source_claim:{status:"X"},user_assertion:{status:"Y"},agent_inference:{reason:"mismatch"},discrepancy_type:"STATUS"});
  c.graph.addNode({id:"EVID-001",type:"EVIDENCE"});
  bind(c,{discrepancy_id:"DISC-001",evidence_refs:["EVID-001"],proposed_resolution:{status:"Y"}});
  reverse(c);
  propose(c,{action_ref:"ACTION-001",correction_request:{status:"Y"},verification_condition:{status:"Y"}});
  return c;
}

test("SELFMOAT blocks actuation before human authorization",async()=>{
  const c=prepared();
  await assert.rejects(()=>actuate(c,async()=>({receipt_id:"R"})),/NOT_AUTHORIZED/);
});

test("SELFMOAT rejects non-human and out-of-scope authorization",()=>{
  const c=prepared();
  assert.throws(()=>authorize(c,{authorization_id:"AUTH-X",case_id:c.case_id,authorized_by:"AGENT",authorized_action_refs:["ACTION-001"]}),/AUTHORITY_NOT_HUMAN/);
  assert.throws(()=>authorize(c,{authorization_id:"AUTH-X",case_id:c.case_id,authorized_by:"HUMAN",authorized_action_refs:["ACTION-X"]}),/ACTION_OUT_OF_SCOPE/);
});

test("receipt does not establish effect; verification requires observation",async()=>{
  const c=prepared();
  authorize(c,{authorization_id:"AUTH-001",case_id:c.case_id,authorized_by:"HUMAN",authorized_action_refs:["ACTION-001"]});
  await actuate(c,async()=>({receipt_id:"RECEIPT-001",submitted:true}));
  observeResult(c,{source:"EXTERNAL_SYSTEM",changed_record:null});
  verify(c,{status:"NOT_VERIFIED",reason:"No changed record observed"});
  assert.equal(c.state,"NOT_VERIFIED");
});
