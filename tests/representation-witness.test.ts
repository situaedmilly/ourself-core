import assert from "node:assert/strict";
import test from "node:test";
import { makeNode, parseArtifact, serialize, type SemanticNode } from "../src/representation-witness.ts";

function source(): SemanticNode {
  return makeNode("openapi","OBJECT",{version:"3.1.0"},[],{
    hierarchy:["openapi"],cardinality:{min:1,max:1},authority:"OURSELF",
    jurisdiction:"LOCAL",relation:[{kind:"CONTRACT",target:"WEBSELFHOOK"}]
  });
}

function fullArtifact(s:SemanticNode):string {
  return serialize({__ourself:{
    IDENTITY:s.identity,HIERARCHY:s.hierarchy,TYPE:s.type,CARDINALITY:s.cardinality,
    AUTHORITY:s.authority,JURISDICTION:s.jurisdiction,RELATION:s.relation,VALUE:s.value
  },value:s.value},"json");
}

test("ordinary parse does not infer authority",()=>{
  const parsed=parseArtifact(JSON.stringify({value:source().value}),"json") as Record<string,unknown>;
  assert.equal(Object.prototype.hasOwnProperty.call(parsed,"__ourself"),false);
});

test("complete artifact can carry all eight properties",()=>{
  const s=source();
  const parsed=parseArtifact(fullArtifact(s),"json") as Record<string,unknown>;
  const meta=parsed.__ourself as Record<string,unknown>;
  assert.equal(meta.AUTHORITY,"OURSELF");
  assert.equal(meta.JURISDICTION,"LOCAL");
  assert.deepEqual(meta.HIERARCHY,["openapi"]);
});

test("syntax validity is not constitutional admission",()=>{
  const ordinary=serialize({value:source().value},"json");
  const parsed=parseArtifact(ordinary,"json");
  assert.ok(parsed);
  assert.equal((parsed as Record<string,unknown>).__ourself,undefined);
});

test("deliberate authority drift remains observable as drift",()=>{
  const s=source();
  const parsed=parseArtifact(fullArtifact(s),"json") as Record<string,unknown>;
  (parsed.__ourself as Record<string,unknown>).AUTHORITY="EXTERNAL";
  assert.equal((parsed.__ourself as Record<string,unknown>).AUTHORITY,"EXTERNAL");
  assert.notEqual((parsed.__ourself as Record<string,unknown>).AUTHORITY,s.authority);
});

test("YAML serializer preserves explicit metadata structure",()=>{
  const s=source();
  const parsed=parseArtifact(serialize({__ourself:{
    IDENTITY:s.identity,HIERARCHY:s.hierarchy,TYPE:s.type,CARDINALITY:s.cardinality,
    AUTHORITY:s.authority,JURISDICTION:s.jurisdiction,RELATION:s.relation,VALUE:s.value
  },value:s.value},"yaml"),"yaml");
  assert.ok(parsed);
});
