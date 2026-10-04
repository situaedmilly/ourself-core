import assert from "node:assert/strict";
import test from "node:test";
import { makeNode, parseArtifact, representationWitness, serialize, witnessArtifact, type SemanticNode } from "../src/representation-witness.ts";

function source(): SemanticNode {
  return makeNode("openapi","OBJECT",{version:"3.1.0"},[],{
    hierarchy:["openapi"],cardinality:{min:1,max:1},authority:"OURSELF",
    jurisdiction:"LOCAL",relation:[{kind:"CONTRACT",target:"WEBSELFHOOK"}]
  });
}
function completeArtifact(s:SemanticNode):string {
  return serialize({__ourself:{
    IDENTITY:s.identity,HIERARCHY:s.hierarchy,TYPE:s.type,CARDINALITY:s.cardinality,
    AUTHORITY:s.authority,JURISDICTION:s.jurisdiction,RELATION:s.relation,VALUE:s.value
  },value:s.value},"json");
}

test("complete preservation is admissible",()=>{
  const s=source(), r=witnessArtifact(s,completeArtifact(s),"json","2026-10-04T00:00:00.000Z");
  assert.equal(r.syntax,"PASS"); assert.equal(r.representation,"COMPLETE");
  assert.equal(r.semantic_equality,"PASS"); assert.equal(r.decision,"ADMIT");
  assert.deepEqual(r.losses,[]); assert.deepEqual(r.drift,[]);
});

test("property loss is not drift and cannot be admitted",()=>{
  const s=source(), artifact=serialize({value:s.value},"json");
  const r=witnessArtifact(s,artifact,"json","2026-10-04T00:00:00.000Z");
  assert.equal(r.syntax,"PASS");
  assert.equal(r.coverage.AUTHORITY,"ABSENT");
  assert.ok(r.losses.includes("AUTHORITY_LOSS"));
  assert.equal(r.semantic_equality,"NOT_ESTABLISHABLE");
  assert.equal(r.decision,"REPRESENTATION_INCOMPLETE");
});

test("anti-inference: absent authority remains absent",()=>{
  const s=source(), parsed=parseArtifact(serialize({value:s.value},"json"),"json") as Record<string,unknown>;
  assert.equal((parsed as any).__ourself,undefined);
  const r=witnessArtifact(s,JSON.stringify(parsed,null,2)+"\n","json","2026-10-04T00:00:00.000Z");
  const auth=r.observations.find(x=>x.property==="AUTHORITY");
  assert.equal(auth?.artifact_present,false);
  assert.equal(auth?.status,"PROPERTY_LOSS");
  assert.equal(r.decision,"REPRESENTATION_INCOMPLETE");
});

test("represented authority drift is classified as drift",()=>{
  const s=source();
  const parsed=parseArtifact(completeArtifact(s),"json") as Record<string,any>;
  parsed.__ourself.AUTHORITY="EXTERNAL";
  const r=witnessArtifact(s,JSON.stringify(parsed,null,2)+"\n","json","2026-10-04T00:00:00.000Z");
  assert.equal(r.coverage.AUTHORITY,"PRESENT");
  assert.ok(r.drift.includes("AUTHORITY_DRIFT"));
  assert.equal(r.observations.find(x=>x.property==="AUTHORITY")?.status,"DRIFT");
  assert.equal(r.decision,"REJECT");
});

test("syntax pass does not imply constitutional admission",()=>{
  const artifact=serialize({openapi:"3.1.0",paths:{}}, "json");
  const r=witnessArtifact(source(),artifact,"json","2026-10-04T00:00:00.000Z");
  assert.equal(r.syntax,"PASS");
  assert.equal(r.decision,"REPRESENTATION_INCOMPLETE");
});

test("YAML parse-back preserves explicit metadata without inference",()=>{
  const s=source();
  const artifact=serialize({__ourself:{
    IDENTITY:s.identity,HIERARCHY:s.hierarchy,TYPE:s.type,CARDINALITY:s.cardinality,
    AUTHORITY:s.authority,JURISDICTION:s.jurisdiction,RELATION:s.relation,VALUE:s.value
  },value:s.value},"yaml");
  const parsed=parseArtifact(artifact,"yaml");
  assert.ok(parsed);
  const r=witnessArtifact(s,artifact,"yaml","2026-10-04T00:00:00.000Z");
  assert.equal(r.syntax,"PASS");
  assert.equal(r.coverage.AUTHORITY,"PRESENT");
});
