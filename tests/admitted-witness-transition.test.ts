import assert from "node:assert/strict";
import test from "node:test";
import { makeNode, serialize, witnessArtifact, type WitnessReceipt } from "../src/representation-witness.ts";
import {
  admitWitnessedEffect,
  authorizationDecision,
  consumeAdmittedWitness,
  fixedClock,
  recordExecution,
  requestActuation,
  witnessEffect,
  type AuthorizationGrant,
} from "../src/admitted-witness-transition.ts";

function admittedReceipt(): WitnessReceipt {
  const source = makeNode("openapi", "OBJECT", { version: "3.1.0" }, [], {
    hierarchy: ["openapi"],
    cardinality: { min: 1, max: 1 },
    authority: "OURSELF",
    jurisdiction: "LOCAL",
    relation: [{ kind: "CONTRACT", target: "WEBSELFHOOK" }],
  });
  const artifact = serialize({
    __ourself: {
      IDENTITY: source.identity,
      HIERARCHY: source.hierarchy,
      TYPE: source.type,
      CARDINALITY: source.cardinality,
      AUTHORITY: source.authority,
      JURISDICTION: source.jurisdiction,
      RELATION: source.relation,
      VALUE: source.value,
    },
    value: source.value,
  }, "json");
  return witnessArtifact(source, artifact, "json", "2026-10-04T20:00:00.000Z");
}

function grant(): AuthorizationGrant {
  return {
    grant_id: "GRANT-1",
    subject: "SUBJECT-1",
    transition: "REPRESENTATION-NEXT",
    issued_at: "2026-10-04T20:00:00.000Z",
    expires_at: "2026-10-04T20:10:00.000Z",
    status: "ACTIVE",
  };
}

test("admitted witness is accepted but does not authorize by itself", () => {
  const w = consumeAdmittedWitness(admittedReceipt());
  assert.equal(w.status, "WITNESS_ACCEPTED");
});

test("invalid witness cannot enter the authorization transition", () => {
  const receipt = admittedReceipt();
  const invalid = { ...receipt, decision: "REJECT" } as WitnessReceipt;
  const w = consumeAdmittedWitness(invalid);
  assert.equal(w.status, "WITNESS_NOT_ADMITTED");
});

test("valid authorization before expiry is requestable", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:09:59.999Z"),
  );
  assert.equal(d.status, "AUTHORIZED");
  assert.equal(d.actuation, "ACTUATION_REQUESTABLE");
});

test("authorization expires exactly at the boundary", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:10:00.000Z"),
  );
  assert.equal(d.status, "EXPIRED");
  assert.equal(d.actuation, "ACTUATION_FORBIDDEN");
  assert.notEqual(d.status, "REVOKED");
});

test("authorization remains expired after the boundary", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:11:00.000Z"),
  );
  assert.equal(d.status, "EXPIRED");
});

test("authorization boundary does not actuate", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:09:00.000Z"),
  );
  const request = requestActuation(d, "REQ-1", "REPRESENTATION-NEXT");
  assert.equal(request.status, "ACTUATION_REQUESTED");
  assert.notEqual(request.status, "EXECUTED");
});

test("expired authorization forbids actuation request", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:10:00.000Z"),
  );
  const request = requestActuation(d, "REQ-EXPIRED", "REPRESENTATION-NEXT");
  assert.equal(request.status, "ACTUATION_FORBIDDEN");
});

test("actuation request does not execute", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:09:00.000Z"),
  );
  const request = requestActuation(d, "REQ-2", "REPRESENTATION-NEXT");
  assert.equal(request.status, "ACTUATION_REQUESTED");
});

test("execution does not witness itself", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:09:00.000Z"),
  );
  const request = requestActuation(d, "REQ-3", "REPRESENTATION-NEXT");
  const execution = recordExecution(request, {
    execution_id: "EXEC-3",
    executor: "FOREIGN_ACTUATOR",
  });
  const effect = witnessEffect(execution, null);
  assert.equal(execution.status, "EXECUTED");
  assert.equal(effect.status, "EFFECT_UNWITNESSED");
});

test("external evidence is required to witness effect", () => {
  const d = authorizationDecision(
    grant(),
    "REPRESENTATION-NEXT",
    fixedClock("2026-10-04T20:09:00.000Z"),
  );
  const request = requestActuation(d, "REQ-4", "REPRESENTATION-NEXT");
  const execution = recordExecution(request, {
    execution_id: "EXEC-4",
    executor: "FOREIGN_ACTUATOR",
  });
  const effect = witnessEffect(execution, {
    execution_id: "EXEC-4",
    evidence_id: "EVID-4",
  });
  assert.equal(effect.status, "EFFECT_WITNESSED");
});

test("witnessed effect has a separate admission step", () => {
  const effect = {
    status: "EFFECT_WITNESSED" as const,
    execution_id: "EXEC-5",
    evidence_id: "EVID-5",
  };
  const admission = admitWitnessedEffect(effect);
  assert.equal(admission.admission, "EFFECT_ADMITTED");
});
