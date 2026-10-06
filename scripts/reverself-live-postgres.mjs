import pg from "pg";
import { proveOrder } from "../packages/crop-order-proof/src/index.mjs";

const { Client } = pg;
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL is required for repository-owned PostgreSQL verification");

const client = new Client({ connectionString: dbUrl });
const suffix = Date.now().toString(36);
let intentId;
let attemptId;

const event = (id, parents) => ({
  event_id: id,
  reality_id: "OURSELF",
  instance_id: "REVERSELF-LIVE-POSTGRES-01",
  parents,
  authority: { status: "ADMITTED", reference: "local-authority:" + suffix },
  execution: {
    status: "OBSERVED",
    receipt_id: "local-receipt:" + suffix + ":" + id,
    pre_state_hash: "sha256:pre-" + id,
    post_state_hash: "sha256:post-" + id,
  },
  evidence: { status: "VERIFIED", digest: "sha256:local-" + id },
});

function assert(condition, message) {
  if (!condition) throw new Error("REPOSITORY_POSTGRES_ASSERTION:" + message);
}

try {
  await client.connect();

  const expected = ["matter_intents","matter_events","matter_outbox","matter_delivery_attempts","matter_receipts"];
  const migrationCheck = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY($1::text[])
  `, [expected]);
  assert(migrationCheck.rowCount === 5, "canonical five-table schema is incomplete");

  const rlsCheck = await client.query(`
    SELECT relname, relrowsecurity FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname = ANY($1::text[])
  `, [expected]);
  assert(rlsCheck.rowCount === 5 && rlsCheck.rows.every(r => r.relrowsecurity), "RLS is not enabled on every persistence surface");

  await client.query("BEGIN");
  const intent = await client.query(`
    INSERT INTO public.matter_intents
      (reality_id, instance_id, principal_id, intent_type, recipient_ref, payload, idempotency_key, policy_version, state)
    VALUES
      ('OURSELF', 'REVERSELF-LIVE-POSTGRES-01', 'LOCAL-VERIFICATION', 'MESSAGE_SEND',
       'local:reverself-verification', $1::jsonb, $2, 'local-v1', 'ADMITTED')
    RETURNING intent_id
  `, [JSON.stringify({ body: "REVERSELF repository-owned PostgreSQL vertical slice" }), "local-reverself-" + suffix]);
  intentId = intent.rows[0].intent_id;

  const events = [];
  let parentIds = [];
  for (const type of ["CREATE","ADMIT","PERSIST","PUBLISH","RECEIVE"]) {
    const inserted = await client.query(`
      INSERT INTO public.matter_events
        (intent_id, reality_id, instance_id, event_type, parent_event_ids, proof_ref, evidence_digest, event_data)
      VALUES ($1, 'OURSELF', 'REVERSELF-LIVE-POSTGRES-01', $2, $3::uuid[], 'pending-crop', $4, $5::jsonb)
      RETURNING event_id
    `, [intentId, "evt:" + type.toLowerCase(), parentIds,
      "sha256:local-event-" + type.toLowerCase() + "-" + suffix,
      JSON.stringify({ source: "REVERSELF_REPOSITORY_POSTGRES" })]);
    const id = inserted.rows[0].event_id;
    events.push(event(id, parentIds));
    parentIds = [id];
  }

  const proof = proveOrder(events);
  assert(proof.result === "ORDER_PROVEN", "CROP did not prove the persisted event chain");
  assert(proof.ordered_event_ids.length === 5, "CROP did not return all five persisted events");

  await client.query(`
    UPDATE public.matter_events
    SET proof_ref = $2, evidence_digest = $3
    WHERE intent_id = $1
  `, [intentId, `CROP:${proof.algorithm}:${proof.version}`, "sha256:crop-" + suffix]);

  await client.query(`
    INSERT INTO public.matter_outbox (intent_id, destination, event_payload, status)
    VALUES ($1, 'LOCAL_TEST', $2::jsonb, 'PENDING')
  `, [intentId, JSON.stringify({ intent_id: intentId, body: "REVERSELF local test" })]);

  await client.query(`
    INSERT INTO public.matter_receipts
      (intent_id, receipt_type, issuer, issuer_reference, evidence_digest, verified, receipt_data)
    VALUES
      ($1, 'ADMISSION', 'OURSELF-AUTHORITY', 'local-authority:' || $2, $3, true, $4::jsonb),
      ($1, 'CROP_PROOF', 'CROP', 'CROP:0.1', $5, true, $6::jsonb)
  `, [intentId, suffix, "sha256:admission-" + suffix, JSON.stringify({ verified: true }),
      "sha256:crop-" + suffix, JSON.stringify(proof)]);

  const outbox = await client.query("SELECT outbox_id, status FROM public.matter_outbox WHERE intent_id = $1", [intentId]);
  assert(outbox.rowCount === 1 && outbox.rows[0].status === "PENDING", "outbox row was not durably created");

  const attempt = await client.query(`
    INSERT INTO public.matter_delivery_attempts
      (intent_id, destination, idempotency_key, attempt_number, status)
    VALUES ($1, 'LOCAL_TEST', 'local-attempt-' || $2, 1, 'ACCEPTED')
    RETURNING attempt_id
  `, [intentId, suffix]);
  attemptId = attempt.rows[0].attempt_id;

  await client.query(`
    INSERT INTO public.matter_receipts
      (intent_id, attempt_id, receipt_type, issuer, issuer_reference, evidence_digest, verified, receipt_data)
    VALUES ($1, $2, 'TRANSPORT_ACK', 'REVERSELF-MOCK', 'transport-accepted-' || $3, $4, false, $5::jsonb)
  `, [intentId, attemptId, suffix, "sha256:transport-" + suffix, JSON.stringify({ status: "ACCEPTED" })]);

  await client.query("UPDATE public.matter_intents SET state = 'ACTUATING', updated_at = now() WHERE intent_id = $1", [intentId]);
  await client.query("COMMIT");

  const committed = await client.query(`
    SELECT (SELECT count(*) FROM public.matter_intents WHERE intent_id = $1) AS intents,
           (SELECT count(*) FROM public.matter_events WHERE intent_id = $1) AS events,
           (SELECT count(*) FROM public.matter_outbox WHERE intent_id = $1) AS outbox,
           (SELECT count(*) FROM public.matter_delivery_attempts WHERE intent_id = $1) AS attempts,
           (SELECT state FROM public.matter_intents WHERE intent_id = $1) AS state
  `, [intentId]);
  const row = committed.rows[0];
  assert(row.intents === "1" && row.events === "5" && row.outbox === "1" && row.attempts === "1", "committed vertical slice counts are incorrect");
  assert(row.state === "ACTUATING", "transport ACK incorrectly completed the intent");

  await client.query("BEGIN");
  await client.query("UPDATE public.matter_delivery_attempts SET status = 'DELIVERED', completed_at = now() WHERE attempt_id = $1", [attemptId]);
  await client.query(`
    INSERT INTO public.matter_receipts
      (intent_id, attempt_id, receipt_type, issuer, issuer_reference, evidence_digest, verified, receipt_data)
    VALUES ($1, $2, 'DELIVERY_REPORT', 'REVERSELF-MOCK', 'delivery-' || $3, $4, true, $5::jsonb)
  `, [intentId, attemptId, suffix, "sha256:delivery-" + suffix, JSON.stringify({ status: "DELIVERED" })]);
  await client.query("UPDATE public.matter_intents SET state = 'COMPLETED', updated_at = now() WHERE intent_id = $1", [intentId]);
  await client.query("COMMIT");

  const completed = await client.query("SELECT state FROM public.matter_intents WHERE intent_id = $1", [intentId]);
  assert(completed.rows[0]?.state === "COMPLETED", "delivery recontact did not complete intent");

  console.log(JSON.stringify({
    schema: "OURSELF.REVERSELF.REPOSITORY_POSTGRES_RECEIPT.v0.1",
    result: "PASSED",
    repository: "situaedmilly/ourself-core",
    jurisdiction: "REPOSITORY-OWNED-POSTGRESQL",
    runtime: "PostgreSQL 17",
    intent_id: intentId,
    event_chain: proof.ordered_event_ids,
    crop_result: proof.result,
    transport_ack: "ACCEPTED",
    transport_ack_is_delivery: false,
    final_state: "COMPLETED",
    observed_at: new Date().toISOString(),
  }, null, 2));

  await client.query("BEGIN");
  await client.query("DELETE FROM public.matter_receipts WHERE intent_id = $1", [intentId]);
  await client.query("DELETE FROM public.matter_delivery_attempts WHERE intent_id = $1", [intentId]);
  await client.query("DELETE FROM public.matter_outbox WHERE intent_id = $1", [intentId]);
  await client.query("DELETE FROM public.matter_events WHERE intent_id = $1", [intentId]);
  await client.query("DELETE FROM public.matter_intents WHERE intent_id = $1", [intentId]);
  await client.query("COMMIT");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
