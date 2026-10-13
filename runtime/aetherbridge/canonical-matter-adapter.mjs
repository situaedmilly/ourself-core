import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_INTAKE = "/Users/millysituated/OURSELF/ourself-core/runtime/aetherbridge/data/matter.json";
const DEFAULT_CUSTODY = "/Users/millysituated/OURSELF/runtime/safeselfmutations";
const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function requireSafeId(value, label) {
  if (typeof value !== "string" || !value.length || value.includes("/") || value.includes("\\") || /\s/.test(value)) {
    throw new TypeError(label + " is not a safe identifier");
  }
}

export function admitMatterEnvelope({
  matterRef,
  expectedPayloadHash,
  intakeFile = DEFAULT_INTAKE,
  custodyDir = DEFAULT_CUSTODY,
  admittedBy = "FOUNDER_AUTHORIZED_PIPEPORTAL_EXECUTION",
  reality = "BUBBLESELF-ALCHEMY",
  actimanirun = "ACTIMANIRUN-BUBBLESELF-ALCHEMY"
}) {
  requireSafeId(matterRef, "matterRef");
  if (!/^[a-f0-9]{64}$/.test(expectedPayloadHash || "")) throw new TypeError("expectedPayloadHash must be lowercase SHA-256");
  const intake = JSON.parse(fs.readFileSync(intakeFile, "utf8"));
  const record = intake[matterRef];
  if (!record) throw new Error("MATTER_NOT_FOUND_IN_INTAKE_STORE");
  if (record.payload_hash !== expectedPayloadHash) throw new Error("INTAKE_PAYLOAD_HASH_MISMATCH");
  if (record.receipt_standing !== "RECEIVED_LOCAL_NOT_CANONICAL") {
    throw new Error("UNEXPECTED_INTAKE_STANDING:" + record.receipt_standing);
  }
  const file = path.join(custodyDir, "MATTER-ADMISSION-" + matterRef + ".json");
  if (fs.existsSync(file)) {
    const existing = JSON.parse(fs.readFileSync(file, "utf8"));
    const existingSubject = existing && existing.subject;
    if (!existingSubject || existingSubject.matter_ref !== matterRef || existingSubject.payload_hash !== expectedPayloadHash) {
      throw new Error("IMMUTABLE_ADMISSION_CONFLICT");
    }
    return { file, replay: true, receipt: existing };
  }
  const sourceArtifact = record.source_artifact || null;
  const sourcePath = sourceArtifact ? path.join(path.dirname(intakeFile), sourceArtifact.ref) : null;
  let sourceWitness = { standing: "MISSING", ref: null, sha256: null, byte_length: null, verified: false };
  if (sourceArtifact && sourcePath && fs.existsSync(sourcePath)) {
    const sourceBytes = fs.readFileSync(sourcePath);
    const sourceHash = sha256(sourceBytes);
    sourceWitness = { standing: sourceHash === sourceArtifact.sha256 && sourceBytes.length === sourceArtifact.byte_length ? "SOURCE_BYTES_VERIFIED" : "SOURCE_BYTES_MISMATCH", ref: sourceArtifact.ref, sha256: sourceHash, byte_length: sourceBytes.length, verified: sourceHash === sourceArtifact.sha256 && sourceBytes.length === sourceArtifact.byte_length };
    if (!sourceWitness.verified) throw new Error("SOURCE_ARTIFACT_READBACK_MISMATCH");
  }
  const now = new Date().toISOString();
  const receipt = {
    record_type: "OURSELF_CANONICAL_MATTER_ADMISSION",
    schema_version: "0.1.0",
    admission_id: "MATTER-ADMISSION-" + matterRef,
    admitted_at: now,
    admitted_by: admittedBy,
    reality,
    actimanirun,
    subject: {
      matter_ref: matterRef,
      encounter_ref: record.encounter_ref,
      conversation_occurrence_ref: record.conversation_occurrence_ref,
      request_id: record.request_id,
      payload_hash: record.payload_hash,
      source_artifact: sourceWitness,
      intake_received_at: record.received_at
    },
    custody: {
      standing: "CANONICAL_LOCAL_ADMISSION",
      store_path: file,
      immutable_successor_rule: "Existing admission bytes are never overwritten; corrections require a superseding successor.",
      remote_github_custody: "NOT_ESTABLISHED"
    },
    evaluation: {
      standing: sourceWitness.verified ? "READY_FOR_COGNITIVE_EVALUATION" : "BLOCKED_MISSING_SOURCE_BYTES",
      reason: sourceWitness.verified ? "Exact request-body source artifact hash and byte length verified before admission." : "Exact original request-body source artifact is absent or unverified.",
      selfstatement_ref: null
    },
    source_integrity: sourceWitness,
    readback: {
      required: true,
      verified: false
    },
    hollaback: {
      standing: "NOT_DELIVERED",
      recipient: null,
      delivery_receipt: null
    },
    invariants: {
      source_receipt_hash_matched_before_admission: true,
      source_receipt_promoted_in_place: false,
      original_intake_mutated: false,
      cognition_claimed: false,
      external_effect_claimed: false
    }
  };
  fs.mkdirSync(custodyDir, { recursive: true, mode: 0o700 });
  const bytes = JSON.stringify(receipt, null, 2) + "\n";
  const temp = file + "." + process.pid + ".tmp";
  fs.writeFileSync(temp, bytes, { flag: "wx", mode: 0o600 });
  fs.renameSync(temp, file);
  const readbackBytes = fs.readFileSync(file);
  const readback = JSON.parse(readbackBytes.toString("utf8"));
  if (sha256(readbackBytes) !== sha256(Buffer.from(bytes)) ||
      readback.subject.payload_hash !== expectedPayloadHash ||
      readback.subject.matter_ref !== matterRef) {
    throw new Error("CANONICAL_ADMISSION_READBACK_MISMATCH");
  }
  return { file, replay: false, receipt: readback, file_sha256: sha256(readbackBytes) };
}
