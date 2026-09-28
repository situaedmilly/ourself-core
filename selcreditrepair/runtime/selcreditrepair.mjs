import {transition} from "./state-machine.mjs";
import {assertAgentCan,admitAction} from "./selfmoat.mjs";
import {EvidenceGraph} from "./evidence-graph.mjs";

export function createCase({case_id,report_id,created_at=new Date().toISOString()}){
  if(!case_id||!report_id)throw new Error("INVALID_CASE");
  return {case_id,report_id,created_at,state:"RECEIVED",agent_authority:"NONE",discrepancies:[],proposals:[],actions:[],observations:[],verification:null,graph:new EvidenceGraph()}
}
export function observe(c,record){assertAgentCan("observe");c.state=transition(c.state,"OBSERVED");c.original_report=structuredClone(record);c.graph.addNode({id:c.report_id,type:"REPORT"});return c}
export function differentiate(c,data){assertAgentCan("differentiate");c.state=transition(c.state,"DIFFERENTIATED");c.discrepancies.push({...data});return c}
export function bind(c,{discrepancy_id,evidence_refs,proposed_resolution}){assertAgentCan("bind");if(!Array.isArray(evidence_refs)||!evidence_refs.length)throw new Error("BIND_DENIED:EVIDENCE_REQUIRED");const d=c.discrepancies.find(x=>x.discrepancy_id===discrepancy_id);if(!d)throw new Error("BIND_DENIED:DISCREPANCY_MISSING");d.evidence_refs=[...evidence_refs];d.proposed_resolution=proposed_resolution;c.state=transition(c.state,"BOUND");return c}
export function reverse(c){assertAgentCan("reverse");c.state=transition(c.state,"REVERSED");return c}
export function propose(c,{action_ref,correction_request,verification_condition}){assertAgentCan("propose");if(!c.discrepancies.every(d=>Array.isArray(d.evidence_refs)&&d.evidence_refs.length))throw new Error("PROPOSE_DENIED:UNBOUND_DISCREPANCY");c.proposals.push({case_id:c.case_id,action_ref,correction_request,verification_condition});c.state=transition(c.state,"PROPOSED");c.state=transition(c.state,"AWAITING_HUMAN_AUTHORIZATION");return c}
export function authorize(c,authorization){const proposal=c.proposals.at(-1);admitAction({proposal,authorization});c.authorization=structuredClone(authorization);c.state=transition(c.state,"AUTHORIZED");return c}
export async function actuate(c,actuator){if(c.state!=="AUTHORIZED")throw new Error("ACTUATION_DENIED:NOT_AUTHORIZED");const proposal=c.proposals.at(-1);const admission=admitAction({proposal,authorization:c.authorization});c.state=transition(c.state,"ACTUATED");const receipt=await actuator({case_id:c.case_id,action_ref:proposal.action_ref,admission});c.actions.push({action_ref:proposal.action_ref,receipt});return c}
export function observeResult(c,observation){if(c.state!=="ACTUATED")throw new Error("OBSERVE_RESULT_DENIED:NOT_ACTUATED");c.state=transition(c.state,"OBSERVED_RESULT");c.observations.push(structuredClone(observation));return c}
export function verify(c,result){if(c.state!=="OBSERVED_RESULT")throw new Error("VERIFY_DENIED:NO_OBSERVATION");if(!["VERIFIED","NOT_VERIFIED","PARTIAL","DISPUTED","PENDING"].includes(result?.status))throw new Error("VERIFY_DENIED:INVALID_STATUS");c.verification=structuredClone(result);c.state=transition(c.state,result.status);return c}
