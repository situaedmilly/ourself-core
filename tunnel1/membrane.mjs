import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("tunnel1/runtime");
const WORKSPACE = path.join(ROOT, "workspace");
const EVIDENCE = path.join(ROOT, "evidence");

const POLICY = Object.freeze({
  actor: "HERMES-001",
  authority: "TB1-AUTH-001",
  operations: new Set(["write_file"])
});

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalize(input) {
  return {
    request_id: String(input.request_id),
    actor: String(input.actor),
    operation: String(input.operation),
    resource: String(input.resource),
    proposed_transition: {
      from: String(input.proposed_transition.from),
      to: String(input.proposed_transition.to)
    },
    authority_ref: String(input.authority_ref),
    idempotency_key: String(input.idempotency_key)
  };
}

function determine(t) {
  const reasons = [];
  if (t.actor !== POLICY.actor) reasons.push("ACTOR_NOT_ADMITTED");
  if (t.authority_ref !== POLICY.authority) reasons.push("AUTHORITY_NOT_ADMITTED");
  if (!POLICY.operations.has(t.operation)) reasons.push("OPERATION_NOT_ADMITTED");
  if (!t.resource.startsWith("tunnel1/")) reasons.push("RESOURCE_OUTSIDE_BOUNDARY");
  if (t.proposed_transition.from === t.proposed_transition.to) reasons.push("NO_STATE_CHANGE");
  return { decision: reasons.length === 0 ? "ADMIT" : "DENY", reasons };
}

async function observe(target, observed_ref) {
  return observeFile({ target, observed_ref });
}

export async function executeProposal(input) {
  const transition = normalize(input);
  const before = await observe(
    path.join(WORKSPACE, transition.resource.replace(/^tunnel1\//, "")),
    transition.resource
  );
  const determination = determine(transition);
  let actuation = "NOT_ACTUATED";
  let after = before;

  if (determination.decision === "ADMIT") {
    const target = path.join(WORKSPACE, transition.resource.replace(/^tunnel1\//, ""));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, transition.proposed_transition.to, "utf8");
    actuation = "ACTUATED";
    after = await observe(target, transition.resource);
  }

  const receipt = {
    request_id: transition.request_id,
    actor: transition.actor,
    proposed_transition: transition.proposed_transition,
    determination,
    actuation,
    observed_effect: after,
    observation_fingerprint: observationFingerprint(after),
    evidence_hash: hash(JSON.stringify({ transition, determination, actuation, after }))
  };

  await mkdir(EVIDENCE, { recursive: true });
  await writeFile(
    path.join(EVIDENCE, transition.request_id + ".json"),
    JSON.stringify(receipt, null, 2) + "\n",
    "utf8"
  );

  return receipt;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const receipt = await executeProposal({
    request_id: "TB1-0001",
    actor: "HERMES-001",
    operation: "write_file",
    resource: "tunnel1/test.txt",
    proposed_transition: { from: "absent", to: "HELLO" },
    authority_ref: "TB1-AUTH-001",
    idempotency_key: "TB1-0001"
  });
  console.log(JSON.stringify(receipt, null, 2));
}
