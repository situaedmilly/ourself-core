import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// SELFSTATEMENT COGNITION BINDING ADAPTER — evidence reconciliation, not new cognition.
// Binds an existing, hash-verified OURSELF_GOVERNED_COGNITIVE_EVALUATION receipt into
// a PENDING PipePortal SELFStatement. Every artifact is re-verified before binding.
// No model call is made. No record is overwritten without preserving its prior standing.

const DEFAULT_INTAKE = "/Users/millysituated/OURSELF/ourself-core/runtime/aetherbridge/data/matter.json";
const DEFAULT_STATEMENTS = "/Users/millysituated/OURSELF/ourself-core/runtime/aetherbridge/data/selfstatements.json";
const DEFAULT_CUSTODY = "/Users/millysituated/OURSELF/runtime/safeselfmutations";
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function requireSafeId(value, label) {
  if (typeof value !== "string" || !value.length || value.includes("/") || value.includes("\\") || /\s/.test(value)) {
    throw new TypeError(label + " is not a safe identifier");
  }
}

export function bindEvaluationToSelfstatement({
  matterRef,
  requestedOperation = "PEEP",
  evaluationId,
  intakeFile = DEFAULT_INTAKE,
  statementsFile = DEFAULT_STATEMENTS,
  custodyDir = DEFAULT_CUSTODY,
  boundBy = "FOUNDER_AUTHORIZED_EVIDENCE_RECONCILIATION"
}) {
  requireSafeId(matterRef, "matterRef");
  requireSafeId(evaluationId, "evaluationId");

  // 1. Intake record: identity and payload hash.
  const intake = JSON.parse(fs.readFileSync(intakeFile, "utf8"));
  const matter = intake[matterRef];
  if (!matter) throw new Error("MATTER_NOT_FOUND_IN_INTAKE_STORE");

  // 2. Source bytes readback: exact artifact must still hash to the intake claim.
  const artifact = matter.source_artifact;
  if (!artifact) throw new Error("MATTER_HAS_NO_SOURCE_ARTIFACT");
  const sourcePath = path.join(path.dirname(intakeFile), artifact.ref);
  if (!fs.existsSync(sourcePath)) throw new Error("SOURCE_ARTIFACT_MISSING");
  const sourceBytes = fs.readFileSync(sourcePath);
  const sourceHash = sha256(sourceBytes);
  if (sourceHash !== artifact.sha256 || sourceBytes.length !== artifact.byte_length) {
    throw new Error("SOURCE_ARTIFACT_READBACK_MISMATCH");
  }

  // 3. Canonical admission receipt: must exist and chain to the same payload hash.
  const admissionFile = path.join(custodyDir, "MATTER-ADMISSION-" + matterRef + ".json");
  if (!fs.existsSync(admissionFile)) throw new Error("CANONICAL_ADMISSION_MISSING");
  const admission = JSON.parse(fs.readFileSync(admissionFile, "utf8"));
  if (admission.subject.payload_hash !== matter.payload_hash) throw new Error("ADMISSION_PAYLOAD_HASH_MISMATCH");
  if (admission.subject.source_artifact.sha256 !== sourceHash) throw new Error("ADMISSION_SOURCE_HASH_MISMATCH");

  // 4. Cognitive evaluation receipt: must exist, chain to admission, and declare itself bounded.
  const evalFile = path.join(custodyDir, "COGNITIVE-EVALUATION-" + matterRef + ".json");
  if (!fs.existsSync(evalFile)) throw new Error("COGNITIVE_EVALUATION_RECEIPT_MISSING");
  const evalBytes = fs.readFileSync(evalFile);
  const evaluation = JSON.parse(evalBytes.toString("utf8"));
  if (evaluation.evaluation_id !== evaluationId) throw new Error("EVALUATION_ID_MISMATCH");
  if (evaluation.source.matter_ref !== matterRef) throw new Error("EVALUATION_MATTER_REF_MISMATCH");
  if (evaluation.source.payload_hash !== matter.payload_hash) throw new Error("EVALUATION_PAYLOAD_HASH_MISMATCH");
  if (evaluation.source.admission_id !== admission.admission_id) throw new Error("EVALUATION_ADMISSION_CHAIN_MISMATCH");
  if (evaluation.source.raw_source_sha256 !== sourceHash) throw new Error("EVALUATION_SOURCE_HASH_MISMATCH");
  if (evaluation.evaluation.status !== "COMPLETED_BOUNDED_LOCAL_EVALUATION") throw new Error("EVALUATION_NOT_COMPLETED");
  if (evaluation.governance.external_effect !== false) throw new Error("EVALUATION_CLAIMS_EXTERNAL_EFFECT");

  // 5. Selfstatement: locate the pending record for this matter + operation.
  const statements = JSON.parse(fs.readFileSync(statementsFile, "utf8"));
  const key = sha256(JSON.stringify({ matter_ref: matterRef, requested_operation: requestedOperation }));
  // Server hashes {matter_ref, requested_operation}; Node JSON.stringify key order matches insertion order used by server.
  let record = statements[key];
  if (!record) {
    record = Object.values(statements).find(s => s.matter_ref === matterRef && s.requested_operation === requestedOperation);
  }
  if (!record) throw new Error("SELFSTATEMENT_NOT_FOUND_FOR_MATTER_AND_OPERATION");
  if (record.standing === "COMPLETED") {
    if (record.evaluation_ref !== evaluationId) throw new Error("SELFSTATEMENT_EVALUATION_REF_CONFLICT");
    return { replay: true, record, evaluation_file_sha256: sha256(evalBytes) };
  }
  if (record.standing !== "PENDING_EVALUATION") throw new Error("UNEXPECTED_SELFSTATEMENT_STANDING:" + record.standing);

  const result = evaluation.evaluation.result || {};
  const now = new Date().toISOString();
  const priorStanding = record.standing;
  const completed = {
    ...record,
    statement: typeof result.summary === "string" ? result.summary : null,
    distinction: Array.isArray(result.distinctions) ? result.distinctions : null,
    standing: "COMPLETED",
    completion_kind: "BOUND_EXISTING_VERIFIED_LOCAL_EVALUATION",
    completion_note: "No new cognition was run for this completion. A pre-existing COMPLETED_BOUNDED_LOCAL_EVALUATION receipt, hash-chained to the intake payload hash, canonical admission, and exact source bytes, was bound into this SELFStatement by evidence reconciliation.",
    evaluation_ref: evaluation.evaluation_id,
    evaluation_receipt_sha256: sha256(evalBytes),
    evaluation_model: evaluation.runtime.model,
    evaluation_endpoint: evaluation.runtime.endpoint,
    evaluation_status: evaluation.evaluation.status,
    custody_ref: admission.admission_id,
    custody_file_sha256: sha256(fs.readFileSync(admissionFile)),
    source_artifact_sha256: sourceHash,
    bound_by: boundBy,
    bound_at: now,
    prior_standing: priorStanding,
    residue: ["remote GitHub custody not established", "HOLLABACK not delivered"],
    meaning: "COMPLETED BY HASH-CHAINED EVIDENCE RECONCILIATION; LOCAL ONLY — NOT REMOTE CUSTODY, NOT EXTERNAL EFFECT",
    governance: {
      input_hash_verified: true,
      admission_payload_hash_match: true,
      evaluation_chains_to_admission: true,
      source_bytes_readback_verified: true,
      new_cognition_run: false,
      external_effect: false,
      remote_github_custody: "NOT_ESTABLISHED",
      hollaback: "NOT_DELIVERED"
    }
  };
  const outKey = Object.keys(statements).find(k => statements[k] === record) || key;
  const tmp = statementsFile + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ ...statements, [outKey]: completed }, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(tmp, statementsFile);

  // 6. Readback: the persisted bytes must contain the completed standing and the hash chain.
  const readback = JSON.parse(fs.readFileSync(statementsFile, "utf8"))[outKey];
  if (readback.standing !== "COMPLETED" ||
      readback.evaluation_ref !== evaluationId ||
      readback.custody_ref !== admission.admission_id ||
      readback.evaluation_receipt_sha256 !== sha256(evalBytes) ||
      readback.prior_standing !== priorStanding) {
    throw new Error("SELFSTATEMENT_READBACK_MISMATCH");
  }
  return { replay: false, key: outKey, record: readback, evaluation_file_sha256: sha256(evalBytes), admission_file_sha256: sha256(fs.readFileSync(admissionFile)) };
}
