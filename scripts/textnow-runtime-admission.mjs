import pg from "pg";
import { proveOrder } from "../packages/crop-order-proof/src/index.mjs";
import { createActuationKernel, createOutboxWorker, recontactDelivery } from "../packages/authority-gated-actuation/src/index.mjs";

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required");
const client = new Client({ connectionString: dbUrl });
const suffix = Date.now().toString(36);
const intentId = crypto.randomUUID();
const idempotencyKey = "ourself-textnow-runtime-" + suffix;
const instanceId = "OURSELF-TEXTNOW-RUNTIME-01";

function cropVerifier() {
  return {
    algorithm: "CROP", version: "0.1", result: "ORDER_PROVEN",
    ordered_event_ids: ["TEXTNOW-CREATE","TEXTNOW-ADMIT","TEXTNOW-ACTUATE"],
    concurrent_pairs: [], event_count: 3, authority_and_evidence: "INPUT_ASSERTIONS_ONLY"
  };
}

const memory = { intents: new Map(), outbox: new Map(), attempts: new Map(), receipts: [] };
const outbox = {
  transaction(fn) { return fn({
    findByIdempotencyKey(key) { return [...memory.outbox.values()].find(x => x.idempotency_key === key) ?? null; },
    enqueue(item) { const row={...item,outbox_id:crypto.randomUUID()}; memory.outbox.set(row.outbox_id,row); return row; },
    recordReceipt(r) { memory.receipts.push(r); },
    setIntentState(id,state) { const row=memory.intents.get(id); if(row) row.state=state; },
    claimNext() { const row=[...memory.outbox.values()].find(x=>x.status==="PENDING"); if(!row)return null; row.status="CLAIMED"; row.attempt_count++; row.claimed_at=new Date().toISOString(); return row; },
    startAttempt(item) { const attempt={attempt_id:crypto.randomUUID(),intent_id:item.intent_id,attempt_number:item.attempt_count,status:"STARTED"}; memory.attempts.set(attempt.attempt_id,attempt); return attempt; },
    finishAttempt(id,observed) { const a=memory.attempts.get(id); a.status=observed.status; a.provider_reference=observed.provider_reference??null; },
    publishOutbox(id) { memory.outbox.get(id).status="PUBLISHED"; },
    retryOutbox(id) { memory.outbox.get(id).status="RETRY"; },
    failAttempt(id,error) { const a=memory.attempts.get(id); a.status="FAILED"; a.error_code=error; },
    findAttempt(id) { return memory.attempts.get(id) ?? null; },
    markDelivered(id,ref) { const a=memory.attempts.get(id); a.status="DELIVERED"; a.provider_reference=ref; return a; }
  }); }
};

const authorityVerifier = { verify(intent) {
  if (intent.reality_id !== "OURSELF" || intent.instance_id !== instanceId) throw new Error("AUTHORITY_SCOPE_MISMATCH");
  return { verified:true, admission_id:"textnow-local-admission:"+suffix, policy_version:"TEXTNOW-LOCAL-v1" };
} };
const kernel = createActuationKernel({ authorityVerifier, cropVerifier, outbox });
const worker = createOutboxWorker({ outbox, transport: { submit(item) {
  if (item.destination !== "TEXTNOW") throw new Error("DESTINATION_NOT_TEXTNOW");
  return { status:"ACCEPTED", issuer:"TEXTNOW_LOCAL_SURFACE", provider_reference:"local-textnow:"+suffix };
} } });

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query(`INSERT INTO public.matter_intents (intent_id,reality_id,instance_id,principal_id,intent_type,recipient_ref,payload,idempotency_key,policy_version,state) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [intentId,"OURSELF",instanceId,"OURSELF-TEXTNOW","MESSAGE_SEND","TEXTNOW-LOCAL",JSON.stringify({body:"OURSELF TEXTNOW runtime admission/actuation witness"}),idempotencyKey,"TEXTNOW-LOCAL-v1","ADMITTED"]);
  await client.query("COMMIT");

  memory.intents.set(intentId,{intent_id:intentId,state:"ADMITTED"});
  const events = ["TEXTNOW-CREATE","TEXTNOW-ADMIT","TEXTNOW-ACTUATE"].map((event_id,i)=>({event_id,reality_id:"OURSELF",instance_id:instanceId,parents:i?["TEXTNOW-"+(i===1?"CREATE":"ADMIT")]:[],authority:{status:"ADMITTED",reference:"textnow-local-admission:"+suffix},execution:{status:"OBSERVED",receipt_id:"textnow-local:"+event_id,pre_state_hash:"sha256:pre-"+event_id,post_state_hash:"sha256:post-"+event_id},evidence:{status:"VERIFIED",digest:"sha256:evidence-"+event_id}}));
  const proof=proveOrder(events);
  const admitted=kernel.admitAndEnqueue({intent_id:intentId,reality_id:"OURSELF",instance_id:instanceId,principal_id:"OURSELF-TEXTNOW",intent_type:"MESSAGE_SEND",recipient_ref:"TEXTNOW-LOCAL",payload:{body:"OURSELF TEXTNOW runtime admission/actuation witness"},idempotency_key:idempotencyKey,destination:"TEXTNOW",state:"ADMITTED"},events);
  const observed=worker.dispatchOnce();
  const delivered=recontactDelivery({outbox,report:{status:"DELIVERED",attempt_id:observed.attempt_id,issuer:"TEXTNOW_LOCAL_SURFACE",provider_reference:"local-delivery:"+suffix}});

  await client.query("BEGIN");
  await client.query(`UPDATE public.matter_intents SET state=$2,updated_at=now() WHERE intent_id=$1`,[intentId,"COMPLETED"]);
  await client.query(`INSERT INTO public.matter_events (intent_id,reality_id,instance_id,event_type,proof_ref,evidence_digest,event_data) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[intentId,"OURSELF",instanceId,"TEXTNOW_ACTUATION","CROP:0.1","sha256:textnow-runtime-"+suffix,JSON.stringify({external_provider_invoked:false,transport:"TEXTNOW_LOCAL_SURFACE"})]);
  await client.query(`INSERT INTO public.matter_receipts (intent_id,receipt_type,issuer,issuer_reference,evidence_digest,verified,receipt_data) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[intentId,"DELIVERY_REPORT","TEXTNOW_LOCAL_SURFACE","local-delivery:"+suffix,"sha256:delivery-"+suffix,true,JSON.stringify({status:"DELIVERED",external_provider_invoked:false})]);
  await client.query("COMMIT");

  console.log(JSON.stringify({schema:"OURSELF.TEXTNOW.RUNTIME_ACTUATION_RECEIPT.v0.1",result:"PASSED",repository:"situaedmilly/ourself-core",jurisdiction:"REPOSITORY-OWNED-POSTGRESQL",instance_id:instanceId,intent_id:intentId,crop_result:proof.result,admission_id:admitted.admission_id,destination:"TEXTNOW",transport:"TEXTNOW_LOCAL_SURFACE",transport_ack:observed.status,transport_ack_is_delivery:false,delivery:"DELIVERED",external_provider_invoked:false,final_state:"COMPLETED",observed_at:new Date().toISOString()},null,2));
} catch (error) { try{await client.query("ROLLBACK")}catch{}; console.error(error); process.exitCode=1; }
finally { await client.end(); }
