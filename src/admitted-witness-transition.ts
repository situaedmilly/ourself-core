import type { WitnessReceipt } from "./representation-witness.ts";

export type AuthorizationGrantStatus = "ACTIVE" | "EXPIRED" | "REVOKED";
export type AuthorizationDecisionStatus = "AUTHORIZED" | "EXPIRED" | "REVOKED" | "REJECTED";
export type ActuationStatus = "ACTUATION_REQUESTABLE" | "ACTUATION_REQUESTED" | "ACTUATION_FORBIDDEN";
export type ExecutionStatus = "EXECUTED";
export type EffectStatus = "EFFECT_WITNESSED" | "EFFECT_UNWITNESSED";
export type EffectAdmission = "EFFECT_ADMITTED" | "EFFECT_NOT_ADMITTED";

export interface AuthorizationGrant {
  grant_id: string;
  subject: string;
  transition: string;
  issued_at: string;
  expires_at: string;
  status: AuthorizationGrantStatus;
}

export interface Clock {
  now(): string;
}

export interface WitnessAcceptance {
  status: "WITNESS_ACCEPTED" | "WITNESS_NOT_ADMITTED";
  reason: string | null;
  semantic_id: string;
}

export interface AuthorizationDecision {
  status: AuthorizationDecisionStatus;
  actuation: ActuationStatus;
  reason: string | null;
  grant_id: string;
}

export interface ActuationRequest {
  status: "ACTUATION_REQUESTED" | "ACTUATION_FORBIDDEN";
  request_id: string;
  transition: string;
  grant_id: string;
  reason: string | null;
}

export interface ExecutionReceipt {
  status: ExecutionStatus;
  request_id: string;
  execution_id: string;
  executor: string;
}

export interface EffectWitness {
  status: EffectStatus;
  execution_id: string;
  evidence_id: string | null;
}

export interface EffectAdmissionReceipt {
  admission: EffectAdmission;
  execution_id: string;
  evidence_id: string | null;
  reason: string | null;
}

export function fixedClock(timestamp: string): Clock {
  return { now: () => timestamp };
}

export function consumeAdmittedWitness(receipt: WitnessReceipt): WitnessAcceptance {
  const admitted =
    receipt.witness === "REPRESENTATION_WITNESS" &&
    receipt.version === "0.1" &&
    receipt.syntax === "PASS" &&
    receipt.representation === "COMPLETE" &&
    receipt.semantic_equality === "PASS" &&
    receipt.decision === "ADMIT" &&
    receipt.losses.length === 0 &&
    receipt.drift.length === 0;

  return {
    status: admitted ? "WITNESS_ACCEPTED" : "WITNESS_NOT_ADMITTED",
    reason: admitted ? null : "WITNESS_NOT_ADMISSIBLE",
    semantic_id: receipt.semantic_id,
  };
}

export function authorizationDecision(
  grant: AuthorizationGrant,
  transition: string,
  clock: Clock,
): AuthorizationDecision {
  if (grant.status === "REVOKED") {
    return {
      status: "REVOKED",
      actuation: "ACTUATION_FORBIDDEN",
      reason: "AUTHORIZATION_REVOKED",
      grant_id: grant.grant_id,
    };
  }

  if (grant.transition !== transition) {
    return {
      status: "REJECTED",
      actuation: "ACTUATION_FORBIDDEN",
      reason: "TRANSITION_MISMATCH",
      grant_id: grant.grant_id,
    };
  }

  if (clock.now() >= grant.expires_at) {
    return {
      status: "EXPIRED",
      actuation: "ACTUATION_FORBIDDEN",
      reason: "AUTHORIZATION_EXPIRED",
      grant_id: grant.grant_id,
    };
  }

  if (grant.status !== "ACTIVE") {
    return {
      status: "REJECTED",
      actuation: "ACTUATION_FORBIDDEN",
      reason: "AUTHORIZATION_NOT_ACTIVE",
      grant_id: grant.grant_id,
    };
  }

  return {
    status: "AUTHORIZED",
    actuation: "ACTUATION_REQUESTABLE",
    reason: null,
    grant_id: grant.grant_id,
  };
}

export function requestActuation(
  decision: AuthorizationDecision,
  request_id: string,
  transition: string,
): ActuationRequest {
  if (decision.status !== "AUTHORIZED") {
    return {
      status: "ACTUATION_FORBIDDEN",
      request_id,
      transition,
      grant_id: decision.grant_id,
      reason: decision.reason ?? "AUTHORIZATION_REQUIRED",
    };
  }

  return {
    status: "ACTUATION_REQUESTED",
    request_id,
    transition,
    grant_id: decision.grant_id,
    reason: null,
  };
}

export function recordExecution(
  request: ActuationRequest,
  execution: { execution_id: string; executor: string },
): ExecutionReceipt {
  if (request.status !== "ACTUATION_REQUESTED") {
    throw new Error("ACTUATION_REQUEST_REQUIRED");
  }

  return {
    status: "EXECUTED",
    request_id: request.request_id,
    execution_id: execution.execution_id,
    executor: execution.executor,
  };
}

export function witnessEffect(
  execution: ExecutionReceipt,
  externalEvidence: { execution_id: string; evidence_id: string } | null,
): EffectWitness {
  if (
    externalEvidence === null ||
    externalEvidence.execution_id !== execution.execution_id
  ) {
    return {
      status: "EFFECT_UNWITNESSED",
      execution_id: execution.execution_id,
      evidence_id: null,
    };
  }

  return {
    status: "EFFECT_WITNESSED",
    execution_id: execution.execution_id,
    evidence_id: externalEvidence.evidence_id,
  };
}

export function admitWitnessedEffect(effect: EffectWitness): EffectAdmissionReceipt {
  if (effect.status !== "EFFECT_WITNESSED" || effect.evidence_id === null) {
    return {
      admission: "EFFECT_NOT_ADMITTED",
      execution_id: effect.execution_id,
      evidence_id: effect.evidence_id,
      reason: "EFFECT_WITNESS_REQUIRED",
    };
  }

  return {
    admission: "EFFECT_ADMITTED",
    execution_id: effect.execution_id,
    evidence_id: effect.evidence_id,
    reason: null,
  };
}
