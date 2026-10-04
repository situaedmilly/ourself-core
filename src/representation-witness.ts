import { createHash } from "node:crypto";

export const PROPERTIES = [
  "IDENTITY","HIERARCHY","TYPE","CARDINALITY",
  "AUTHORITY","JURISDICTION","RELATION","VALUE"
] as const;
export type Property = typeof PROPERTIES[number];
export type PropertyStatus = "PRESERVED" | "DRIFT" | "PROPERTY_LOSS";
export type RepresentationStatus = "COMPLETE" | "INCOMPLETE";
export type Decision = "ADMIT" | "REJECT" | "REPRESENTATION_INCOMPLETE";
export type SemanticType = "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN" | "NULL";
export type TargetFormat = "json" | "yaml";

export interface Cardinality { min: number; max: number | null; }
export interface Relation { kind: string; target: string; }
export interface SemanticNode {
  identity: string; hierarchy: string[]; type: SemanticType; cardinality: Cardinality;
  authority: string; jurisdiction: string; relation: Relation[]; value: unknown;
  children: SemanticNode[];
}
export interface PropertyRecord {
  property: Property; source_present: boolean; source_value: unknown;
  artifact_present: boolean; observable_value: unknown;
  status: PropertyStatus; loss_classification: string | null;
}
export interface WitnessReceipt {
  witness: "REPRESENTATION_WITNESS"; version: "0.1";
  semantic_id: string; serialization_id: string; parse_id: string | null;
  semantic_hash: string; structural_hash: string; serialization_hash: string;
  target_format: TargetFormat; syntax: "PASS" | "FAIL";
  representation: RepresentationStatus;
  coverage: Record<Property, "PRESENT" | "ABSENT">;
  observations: PropertyRecord[]; losses: string[]; drift: string[];
  semantic_equality: "PASS" | "FAIL" | "NOT_ESTABLISHABLE";
  decision: Decision; timestamp: string;
  artifact: { bytes: number; sha256: string };
}

const META = "__ourself";

function sha256(v: string | Uint8Array): string {
  return createHash("sha256").update(v).digest("hex");
}
function canonical(v: unknown): string {
  if (v === null) return "null";
  if (typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonical).join(",") + "]";
  const o = v as Record<string, unknown>;
  return "{" + Object.keys(o).sort().map(k => JSON.stringify(k) + ":" + canonical(o[k])).join(",") + "}";
}
function projection(n: SemanticNode, includeValue: boolean): unknown {
  return {
    identity:n.identity, hierarchy:n.hierarchy, type:n.type, cardinality:n.cardinality,
    authority:n.authority, jurisdiction:n.jurisdiction,
    relation:[...n.relation].sort((a,b)=>canonical(a).localeCompare(canonical(b))),
    ...(includeValue ? {value:n.value} : {}),
    children:[...n.children].sort((a,b)=>a.identity.localeCompare(b.identity)).map(c=>projection(c,includeValue))
  };
}
function yamlScalar(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return /^[A-Za-z0-9_./:@+-]+$/.test(v) ? v : JSON.stringify(v);
  return String(v);
}
function yamlSerialize(v: unknown, indent=0): string[] {
  const pad=" ".repeat(indent);
  if (Array.isArray(v)) {
    if (!v.length) return [pad+"[]"];
    return v.flatMap(x => x !== null && typeof x === "object"
      ? [pad+"-", ...yamlSerialize(x,indent+2)]
      : [pad+"- "+yamlScalar(x)]);
  }
  if (v !== null && typeof v === "object") {
    const o=v as Record<string,unknown>, keys=Object.keys(o).sort();
    if (!keys.length) return [pad+"{}"];
    const out:string[]=[];
    for (const k of keys) {
      const x=o[k];
      if (x !== null && typeof x === "object") { out.push(pad+k+":"); out.push(...yamlSerialize(x,indent+2)); }
      else out.push(pad+k+": "+yamlScalar(x));
    }
    return out;
  }
  return [pad+yamlScalar(v)];
}
export function serialize(v: unknown, format: TargetFormat): string {
  return format === "json" ? JSON.stringify(v,null,2)+"\n" : yamlSerialize(v).join("\n")+"\n";
}
function scalar(s:string):unknown {
  const t=s.trim();
  if(t==="null")return null;if(t==="true")return true;if(t==="false")return false;
  if(/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(t))return Number(t);
  if(t.startsWith('"')&&t.endsWith('"'))return JSON.parse(t);
  if(t.startsWith("'")&&t.endsWith("'"))return t.slice(1,-1).replace(/''/g,"'");
  return t;
}
function parseYaml(input:string):unknown {
  const lines=input.split(/\r?\n/).filter(x=>x.trim()&&!x.trimStart().startsWith("#"));
  const root:any={}; const stack:Array<{indent:number;value:any}>=[{indent:-1,value:root}];
  for(let i=0;i<lines.length;i++){
    const line=lines[i], indent=line.match(/^ */)![0].length, text=line.trim();
    while(stack.length>1&&indent<=stack[stack.length-1].indent)stack.pop();
    const parent=stack[stack.length-1].value;
    if(text==="-"||text.startsWith("- ")){
      if(!Array.isArray(parent))throw new Error("sequence parent");
      const rest=text==="-"?"":text.slice(2);
      if(rest)parent.push(scalar(rest));else{const child:any={};parent.push(child);stack.push({indent,value:child});}
      continue;
    }
    const c=text.indexOf(":");if(c<=0)throw new Error("mapping line "+(i+1));
    const key=text.slice(0,c), rest=text.slice(c+1).trim();
    if(rest){parent[key]=scalar(rest);continue;}
    const next=lines[i+1], ni=next?next.match(/^ */)![0].length:-1, nt=next?.trim()??"";
    const child=ni>indent&&(nt==="-"||nt.startsWith("- "))?[]:{};
    parent[key]=child;if(ni>indent)stack.push({indent,value:child});
  }
  return root;
}
export function parseArtifact(input:string,format:TargetFormat):unknown {
  return format==="json"?JSON.parse(input):parseYaml(input);
}
function inferType(v:unknown):SemanticType {
  if(v===null)return"NULL";if(Array.isArray(v))return"ARRAY";if(typeof v==="string")return"STRING";
  if(typeof v==="number")return"NUMBER";if(typeof v==="boolean")return"BOOLEAN";return"OBJECT";
}
interface Observation { coverage:Set<Property>; values:Partial<Record<Property,unknown>>; }
function observeArtifact(v:unknown):Observation {
  const coverage=new Set<Property>();const values:Partial<Record<Property,unknown>>={};
  coverage.add("TYPE");values.TYPE=inferType(v);
  coverage.add("VALUE");values.VALUE=v;
  if(v&&typeof v==="object"&&!Array.isArray(v)){
    const meta=(v as Record<string,unknown>)[META];
    if(meta&&typeof meta==="object"&&!Array.isArray(meta)){
      const m=meta as Record<string,unknown>;
      for(const p of PROPERTIES) if(Object.prototype.hasOwnProperty.call(m,p)){coverage.add(p);values[p]=m[p];}
    }
  }
  return {coverage,values};
}
function sourceValue(n:SemanticNode,p:Property):unknown {
  return ({IDENTITY:n.identity,HIERARCHY:n.hierarchy,TYPE:n.type,CARDINALITY:n.cardinality,
    AUTHORITY:n.authority,JURISDICTION:n.jurisdiction,RELATION:n.relation,VALUE:n.value} as Record<Property,unknown>)[p];
}
export function makeNode(identity:string,type:SemanticType,value:unknown,children:SemanticNode[]=[],p:Partial<SemanticNode>={}):SemanticNode {
  return {identity,hierarchy:p.hierarchy??[identity],type,cardinality:p.cardinality??{min:1,max:1},
    authority:p.authority??"OURSELF",jurisdiction:p.jurisdiction??"LOCAL",relation:p.relation??[],
    value,children};
}
export function representationWitness(source:SemanticNode,format:TargetFormat,timestamp=new Date().toISOString()):WitnessReceipt {
  const semanticHash=sha256(canonical(projection(source,true)));
  const structuralHash=sha256(canonical(projection(source,false)));
  const artifactValue={
    [META]:{IDENTITY:source.identity,HIERARCHY:source.hierarchy,TYPE:source.type,CARDINALITY:source.cardinality,
      AUTHORITY:source.authority,JURISDICTION:source.jurisdiction,RELATION:source.relation,VALUE:source.value},
    value:source.value
  };
  const artifact=serialize(artifactValue,format), serializationHash=sha256(new TextEncoder().encode(artifact));
  let parsed:unknown;try{parsed=parseArtifact(artifact,format);}catch{
    const coverage=Object.fromEntries(PROPERTIES.map(p=>[p,"ABSENT"])) as Record<Property,"PRESENT"|"ABSENT">;
    return {witness:"REPRESENTATION_WITNESS",version:"0.1",semantic_id:semanticHash,serialization_id:serializationHash,
      parse_id:null,semantic_hash:semanticHash,structural_hash:structuralHash,serialization_hash:serializationHash,target_format:format,
      syntax:"FAIL",representation:"INCOMPLETE",coverage,observations:[],losses:PROPERTIES.map(p=>p+"_LOSS"),drift:[],
      semantic_equality:"NOT_ESTABLISHABLE",decision:"REPRESENTATION_INCOMPLETE",timestamp,
      artifact:{bytes:Buffer.byteLength(artifact),sha256:serializationHash}};
  }
  const obs=observeArtifact(parsed),coverage=Object.fromEntries(PROPERTIES.map(p=>[p,obs.coverage.has(p)?"PRESENT":"ABSENT"])) as Record<Property,"PRESENT"|"ABSENT">;
  const observations:PropertyRecord[]=[],losses:string[]=[],drift:string[]=[];
  for(const p of PROPERTIES){
    const expected=sourceValue(source,p),present=obs.coverage.has(p),actual=obs.values[p];
    if(!present){losses.push(p+"_LOSS");observations.push({property:p,source_present:true,source_value:expected,artifact_present:false,observable_value:undefined,status:"PROPERTY_LOSS",loss_classification:p+"_LOSS"});}
    else if(canonical(expected)===canonical(actual))observations.push({property:p,source_present:true,source_value:expected,artifact_present:true,observable_value:actual,status:"PRESERVED",loss_classification:null});
    else{drift.push(p+"_DRIFT");observations.push({property:p,source_present:true,source_value:expected,artifact_present:true,observable_value:actual,status:"DRIFT",loss_classification:p+"_DRIFT"});}
  }
  const complete=losses.length===0, equal=complete&&drift.length===0;
  return {witness:"REPRESENTATION_WITNESS",version:"0.1",semantic_id:semanticHash,serialization_id:serializationHash,
    parse_id:sha256(canonical(parsed)),semantic_hash:semanticHash,structural_hash:structuralHash,serialization_hash:serializationHash,
    target_format:format,syntax:"PASS",representation:complete?"COMPLETE":"INCOMPLETE",coverage,observations,losses,drift,
    semantic_equality:complete?(equal?"PASS":"FAIL"):"NOT_ESTABLISHABLE",
    decision:complete?(equal?"ADMIT":"REJECT"):"REPRESENTATION_INCOMPLETE",timestamp,
    artifact:{bytes:Buffer.byteLength(artifact),sha256:serializationHash}};
}
