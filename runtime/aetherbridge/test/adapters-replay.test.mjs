// adapters-replay.test.mjs — REPLAY-INTEGRITY REGRESSION TESTS (CODERBULL-3 / TEST).
//
// Pins two confirmed replay-integrity contracts of the aetherbridge adapters:
//   DEFECT A (canonical-matter-adapter): a genuine, identical re-admission must return
//     { replay: true } instead of throwing IMMUTABLE_ADMISSION_CONFLICT. The replay
//     guard must read the NESTED receipt fields existing.subject.matter_ref /
//     existing.subject.payload_hash (as established by the readback verification at
//     canonical-matter-adapter.mjs lines 105-107), NOT top-level fields. A genuine
//     conflict (tampered stored receipt) must still throw IMMUTABLE_ADMISSION_CONFLICT.
//   DEFECT B (selfstatement-adapter): the COMPLETED-replay branch must verify that the
//     stored record's evaluation_ref equals the requested evaluationId and throw a
//     mismatch error otherwise (as established by the readback verification at
//     selfstatement-adapter.mjs lines 125-131). A replay for the SAME evaluation must
//     still return { replay: true }.
//
// SAFETY: both adapters default to REAL custody/data stores. Every call in this file
// overrides intakeFile, custodyDir, and (where used) statementsFile with throwaway
// directories created under os.tmpdir(). No default path is ever exercised. Temp
// dirs are removed in each test's teardown.
//
// No npm dependencies: node:test + node:assert/strict only (node v22).

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { admitMatterEnvelope } from "/Users/millysituated/OURSELF/ourself-core/runtime/aetherbridge/canonical-matter-adapter.mjs";
import { bindEvaluationToSelfstatement } from "/Users/millysituated/OURSELF/ourself-core/runtime/aetherbridge/selfstatement-adapter.mjs";

const sha256 = value => crypto.createHash("sha256").update(value).digest("hex");

function makeTempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aetherbridge-replay-test-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

// ---------------------------------------------------------------------------
// DEFECT A fixtures: a minimal intake store + throwaway custody dir.
// ---------------------------------------------------------------------------

function writeIntake(dir, { matterRef, payloadHash, withSource = false }) {
  const record = {
    encounter_ref: "ENCOUNTER-FIXTURE-A1",
    conversation_occurrence_ref: "OCCURRENCE-FIXTURE-A1",
    request_id: "REQUEST-FIXTURE-A1",
    payload_hash: payloadHash,
    receipt_standing: "RECEIVED_LOCAL_NOT_CANONICAL",
    received_at: "2026-01-01T00:00:00.000Z"
  };
  if (withSource) {
    const artifactsDir = path.join(dir, "artifacts");
    fs.mkdirSync(artifactsDir, { recursive: true });
    const bytes = Buffer.from("fixture source bytes for defect A\n");
    fs.writeFileSync(path.join(artifactsDir, "source-a.bin"), bytes);
    record.source_artifact = {
      ref: "artifacts/source-a.bin",
      sha256: sha256(bytes),
      byte_length: bytes.length
    };
  }
  const intakeFile = path.join(dir, "matter.json");
  fs.writeFileSync(intakeFile, JSON.stringify({ [matterRef]: record }, null, 2) + "\n");
  return intakeFile;
}

// ---------------------------------------------------------------------------
// DEFECT B fixtures: full valid chain — intake + source bytes + canonical
// admission receipt + bounded cognitive-evaluation receipt + statements store.
// ---------------------------------------------------------------------------

function buildBindFixture(dir, { evalId, statementEvalRef, statementStanding }) {
  const matterRef = "MATTER-EVAL-001";
  const operation = "PEEP";

  // Source artifact: exact bytes whose sha256/byte_length the intake claims.
  const artifactsDir = path.join(dir, "artifacts");
  fs.mkdirSync(artifactsDir, { recursive: true });
  const sourceBytes = Buffer.from("exact original request-body fixture for defect B\n");
  fs.writeFileSync(path.join(artifactsDir, "source-request.bin"), sourceBytes);
  const sourceHash = sha256(sourceBytes);
  const payloadHash = sha256(Buffer.from("canonical matter payload fixture"));

  const intakeFile = path.join(dir, "matter.json");
  fs.writeFileSync(intakeFile, JSON.stringify({
    [matterRef]: {
      encounter_ref: "ENCOUNTER-FIXTURE-B",
      conversation_occurrence_ref: "OCCURRENCE-FIXTURE-B",
      request_id: "REQUEST-FIXTURE-B",
      payload_hash: payloadHash,
      receipt_standing: "RECEIVED_LOCAL_NOT_CANONICAL",
      received_at: "2026-01-01T00:00:00.000Z",
      source_artifact: { ref: "artifacts/source-request.bin", sha256: sourceHash, byte_length: sourceBytes.length }
    }
  }, null, 2) + "\n");

  const custodyDir = path.join(dir, "custody");
  fs.mkdirSync(custodyDir, { recursive: true });
  const admissionId = "MATTER-ADMISSION-" + matterRef;
  fs.writeFileSync(path.join(custodyDir, "MATTER-ADMISSION-" + matterRef + ".json"), JSON.stringify({
    record_type: "OURSELF_CANONICAL_MATTER_ADMISSION",
    schema_version: "0.1.0",
    admission_id: admissionId,
    subject: {
      matter_ref: matterRef,
      payload_hash: payloadHash,
      source_artifact: {
        standing: "SOURCE_BYTES_VERIFIED",
        ref: "artifacts/source-request.bin",
        sha256: sourceHash,
        byte_length: sourceBytes.length,
        verified: true
      }
    }
  }, null, 2) + "\n");

  fs.writeFileSync(path.join(custodyDir, "COGNITIVE-EVALUATION-" + matterRef + ".json"), JSON.stringify({
    record_type: "OURSELF_GOVERNED_COGNITIVE_EVALUATION",
    schema_version: "0.1.0",
    evaluation_id: evalId,
    source: {
      matter_ref: matterRef,
      payload_hash: payloadHash,
      admission_id: admissionId,
      raw_source_sha256: sourceHash
    },
    runtime: { model: "fixture-model", endpoint: "local-fixture-endpoint" },
    evaluation: {
      status: "COMPLETED_BOUNDED_LOCAL_EVALUATION",
      result: { summary: "Fixture bounded local evaluation summary.", distinctions: ["fixture distinction"] }
    },
    governance: { external_effect: false, new_cognition_run: false }
  }, null, 2) + "\n");

  const statementsFile = path.join(dir, "selfstatements.json");
  const record = {
    matter_ref: matterRef,
    requested_operation: operation,
    standing: statementStanding
  };
  if (statementStanding === "COMPLETED") {
    record.evaluation_ref = statementEvalRef;
    record.evaluation_receipt_sha256 = sha256(Buffer.from("prior-fixture-eval-receipt"));
  }
  const key = sha256(JSON.stringify({ matter_ref: matterRef, requested_operation: operation }));
  fs.writeFileSync(statementsFile, JSON.stringify({ [key]: record }, null, 2) + "\n");

  return { intakeFile, custodyDir, statementsFile, matterRef, operation, key, payloadHash };
}

// ===========================================================================
// DEFECT A — canonical-matter-adapter replay guard
// ===========================================================================

test("DEFECT A: identical re-admission returns replay:true and does not throw", t => {
  const dir = makeTempDir(t);
  const matterRef = "MATTER-REPLAY-A1";
  const payloadHash = sha256(Buffer.from("defect A canonical matter payload"));
  const intakeFile = writeIntake(dir, { matterRef, payloadHash });
  const custodyDir = path.join(dir, "custody");

  const first = admitMatterEnvelope({ matterRef, expectedPayloadHash: payloadHash, intakeFile, custodyDir });
  assert.equal(first.replay, false, "first admission must not be a replay");
  assert.ok(fs.existsSync(first.file), "first admission must have written a receipt");

  // The regression: with a top-level (non-nested) replay guard this second,
  // byte-identical call throws IMMUTABLE_ADMISSION_CONFLICT instead of replaying.
  const second = admitMatterEnvelope({ matterRef, expectedPayloadHash: payloadHash, intakeFile, custodyDir });
  assert.equal(second.replay, true, "identical re-admission MUST return replay:true");
  assert.equal(second.file, first.file, "replay must point at the same receipt file");
  assert.equal(second.receipt.subject.matter_ref, matterRef, "replayed receipt must chain to the same matter_ref");
  assert.equal(second.receipt.subject.payload_hash, payloadHash, "replayed receipt must chain to the same payload_hash");

  const receipts = fs.readdirSync(custodyDir).filter(f => f.startsWith("MATTER-ADMISSION-"));
  assert.equal(receipts.length, 1, "a replay must not write a second receipt file");
});

test("DEFECT A: genuine conflict (tampered stored subject.payload_hash) still throws IMMUTABLE_ADMISSION_CONFLICT", t => {
  const dir = makeTempDir(t);
  const matterRef = "MATTER-REPLAY-A2";
  const payloadHash = sha256(Buffer.from("defect A canonical matter payload 2"));
  const intakeFile = writeIntake(dir, { matterRef, payloadHash });
  const custodyDir = path.join(dir, "custody");

  const first = admitMatterEnvelope({ matterRef, expectedPayloadHash: payloadHash, intakeFile, custodyDir });
  assert.equal(first.replay, false);

  // Hand-edit the stored receipt's NESTED payload_hash to a different valid 64-hex.
  const receipt = JSON.parse(fs.readFileSync(first.file, "utf8"));
  const tamperedHash = sha256(Buffer.from("tampered different payload"));
  assert.notEqual(tamperedHash, payloadHash);
  receipt.subject.payload_hash = tamperedHash;
  fs.writeFileSync(first.file, JSON.stringify(receipt, null, 2) + "\n");

  assert.throws(
    () => admitMatterEnvelope({ matterRef, expectedPayloadHash: payloadHash, intakeFile, custodyDir }),
    /IMMUTABLE_ADMISSION_CONFLICT/,
    "a tampered stored receipt must throw IMMUTABLE_ADMISSION_CONFLICT"
  );
});

// ===========================================================================
// DEFECT B — selfstatement-adapter COMPLETED-replay evaluation_ref guard
// ===========================================================================

test("DEFECT B: COMPLETED record bound to EVAL-ONE must NOT silently replay for EVAL-TWO", t => {
  const dir = makeTempDir(t);
  // Standing state: a selfstatement already COMPLETED against EVAL-ONE, while the
  // evaluation receipt now standing in custody is EVAL-TWO (as if a second bounded
  // evaluation had been run). Requesting the EVAL-TWO binding must not silently
  // return replay:true for a record whose evaluation_ref is EVAL-ONE.
  const fx = buildBindFixture(dir, { evalId: "EVAL-TWO", statementEvalRef: "EVAL-ONE", statementStanding: "COMPLETED" });

  let threw = null;
  try {
    bindEvaluationToSelfstatement({
      matterRef: fx.matterRef,
      requestedOperation: fx.operation,
      evaluationId: "EVAL-TWO",
      intakeFile: fx.intakeFile,
      statementsFile: fx.statementsFile,
      custodyDir: fx.custodyDir
    });
  } catch (err) {
    threw = err;
  }
  assert.ok(threw, "binding a COMPLETED record to a DIFFERENT evaluationId must throw, not return replay:true");
  assert.match(threw.message, /EVALUATION_REF/, "the thrown error must be an evaluation-ref mismatch");

  // The stored record must remain untouched by the rejected replay attempt.
  const statements = JSON.parse(fs.readFileSync(fx.statementsFile, "utf8"));
  assert.equal(statements[fx.key].evaluation_ref, "EVAL-ONE", "stored record's evaluation_ref must be unchanged");
  assert.equal(statements[fx.key].standing, "COMPLETED", "stored record's standing must be unchanged");
});

test("DEFECT B control: COMPLETED record replayed for the SAME evaluationId returns replay:true", t => {
  const dir = makeTempDir(t);
  const fx = buildBindFixture(dir, { evalId: "EVAL-ONE", statementEvalRef: "EVAL-ONE", statementStanding: "COMPLETED" });

  const result = bindEvaluationToSelfstatement({
    matterRef: fx.matterRef,
    requestedOperation: fx.operation,
    evaluationId: "EVAL-ONE",
    intakeFile: fx.intakeFile,
    statementsFile: fx.statementsFile,
    custodyDir: fx.custodyDir
  });
  assert.equal(result.replay, true, "same-evaluation replay must return replay:true");
  assert.equal(result.record.evaluation_ref, "EVAL-ONE");
  assert.ok(typeof result.evaluation_file_sha256 === "string" && result.evaluation_file_sha256.length === 64);
});

test("DEFECT B control: PENDING record still binds successfully (replay:false) with the valid fixture chain", t => {
  const dir = makeTempDir(t);
  const fx = buildBindFixture(dir, { evalId: "EVAL-ONE", statementEvalRef: null, statementStanding: "PENDING_EVALUATION" });

  const result = bindEvaluationToSelfstatement({
    matterRef: fx.matterRef,
    requestedOperation: fx.operation,
    evaluationId: "EVAL-ONE",
    intakeFile: fx.intakeFile,
    statementsFile: fx.statementsFile,
    custodyDir: fx.custodyDir
  });
  assert.equal(result.replay, false, "a PENDING record must bind as a fresh completion, not a replay");
  assert.equal(result.record.standing, "COMPLETED");
  assert.equal(result.record.evaluation_ref, "EVAL-ONE");
  assert.equal(result.record.custody_ref, "MATTER-ADMISSION-" + fx.matterRef);
  assert.equal(result.record.prior_standing, "PENDING_EVALUATION");
  assert.equal(result.record.governance.external_effect, false);
});
