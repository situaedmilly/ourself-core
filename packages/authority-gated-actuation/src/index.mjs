/**
 * Authority-Gated Actuation Kernel v0.1
 *
 * Boundary:
 *   DECLARED -> AUTHORITY_VERIFIED -> ACTUATION_ADMITTED -> OUTBOX_ENQUEUED
 *
 * Transport outcomes are observations only. They cannot grant authority,
 * complete an intent, or bypass admission.
 */

const TERMINAL_INTENT_STATES = new Set(["COMPLETED", "FAILED"]);

function requiredString(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${name} must be a non-empty string`);
  }
}

function validateIntent(intent) {
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    throw new TypeError("intent must be an object");
  }
  for (const name of ["intent_id", "reality_id", "instance_id", "principal_id", "intent_type", "recipient_ref", "idempotency_key"]) {
    requiredString(intent[name], `intent.${name}`);
  }
  if (!Object.hasOwn(intent, "payload")) throw new TypeError("intent.payload is required");
}

function requireVerifiedAuthority(admission) {
  if (!admission || admission.verified !== true) throw new Error("AUTHORITY_UNVERIFIED");
  requiredString(admission.admission_id, "admission.admission_id");
  requiredString(admission.policy_version, "admission.policy_version");
}

function requireCropProof(proof) {
  if (!proof || proof.result !== "ORDER_PROVEN") throw new Error("CROP_UNPROVEN");
  if (proof.authority_and_evidence !== "INPUT_ASSERTIONS_ONLY") throw new Error("CROP_CONTRACT_MISMATCH");
}

export function createActuationKernel({ authorityVerifier, cropVerifier, outbox, clock = () => new Date().toISOString() }) {
  if (!authorityVerifier || typeof authorityVerifier.verify !== "function") throw new TypeError("authorityVerifier.verify is required");
  if (typeof cropVerifier !== "function") throw new TypeError("cropVerifier is required");
  if (!outbox || typeof outbox.transaction !== "function") throw new TypeError("outbox.transaction is required");

  return {
    admitAndEnqueue(intent, causalEvents) {
      validateIntent(intent);

      const authority = authorityVerifier.verify(intent);
      requireVerifiedAuthority(authority);

      const proof = cropVerifier(causalEvents);
      requireCropProof(proof);

      return outbox.transaction((tx) => {
        const existing = tx.findByIdempotencyKey(intent.idempotency_key);
        if (existing) {
          if (existing.intent_id !== intent.intent_id) throw new Error("IDEMPOTENCY_KEY_CONFLICT");
          return { ...existing, replay: true };
        }
        if (TERMINAL_INTENT_STATES.has(intent.state)) throw new Error("TERMINAL_INTENT_CANNOT_ACTUATE");

        const now = clock();
        const admissionReceipt = {
          receipt_type: "ADMISSION",
          issuer: "OURSELF-AUTHORITY",
          issuer_reference: authority.admission_id,
          verified: true,
          received_at: now,
          intent_id: intent.intent_id,
          policy_version: authority.policy_version,
        };
        const cropReceipt = {
          receipt_type: "CROP_PROOF",
          issuer: "CROP",
          issuer_reference: `${proof.algorithm}:${proof.version}`,
          verified: true,
          received_at: now,
          intent_id: intent.intent_id,
          proof,
        };

        const outboxItem = tx.enqueue({
          intent_id: intent.intent_id,
          destination: intent.destination ?? "LOCAL_TEST",
          payload: intent.payload,
          idempotency_key: intent.idempotency_key,
          status: "PENDING",
          created_at: now,
          admission_id: authority.admission_id,
          crop_result: proof.result,
        });

        tx.recordReceipt(admissionReceipt);
        tx.recordReceipt(cropReceipt);
        tx.setIntentState(intent.intent_id, "QUEUED");

        return {
          intent_id: intent.intent_id,
          state: "QUEUED",
          outbox_id: outboxItem.outbox_id,
          admission_id: authority.admission_id,
          crop_result: proof.result,
          replay: false,
        };
      });
    },
  };
}

/** Transport is an observation port, never an authority port. */
export function createOutboxWorker({ outbox, transport, clock = () => new Date().toISOString() }) {
  if (!outbox || typeof outbox.transaction !== "function") throw new TypeError("outbox.transaction is required");
  if (!transport || typeof transport.submit !== "function") throw new TypeError("transport.submit is required");

  return {
    dispatchOnce() {
      const claimed = outbox.transaction((tx) => tx.claimNext());
      if (!claimed) return null;
      const attempt = outbox.transaction((tx) => tx.startAttempt(claimed));

      try {
        const observed = transport.submit(claimed);
        if (!observed || typeof observed.status !== "string") throw new Error("TRANSPORT_INVALID_OBSERVATION");

        return outbox.transaction((tx) => {
          tx.finishAttempt(attempt.attempt_id, observed);
          tx.recordReceipt({
            receipt_type: "TRANSPORT_ACK",
            issuer: observed.issuer ?? "LOCAL_TEST_TRANSPORT",
            issuer_reference: observed.provider_reference ?? null,
            verified: false,
            received_at: clock(),
            intent_id: claimed.intent_id,
            attempt_id: attempt.attempt_id,
            observed_state: observed.status,
          });
          tx.publishOutbox(claimed.outbox_id);
          tx.setIntentState(claimed.intent_id, "ACTUATING");
          return { ...observed, attempt_id: attempt.attempt_id, outbox_id: claimed.outbox_id };
        });
      } catch (error) {
        return outbox.transaction((tx) => {
          tx.failAttempt(attempt.attempt_id, String(error.message ?? error));
          tx.recordReceipt({
            receipt_type: "OBSERVATION",
            issuer: "LOCAL_TEST_TRANSPORT",
            issuer_reference: null,
            verified: false,
            received_at: clock(),
            intent_id: claimed.intent_id,
            attempt_id: attempt.attempt_id,
            observed_state: "FAILED",
          });
          tx.retryOutbox(claimed.outbox_id);
          tx.setIntentState(claimed.intent_id, "UNKNOWN");
          return { status: "FAILED", attempt_id: attempt.attempt_id, outbox_id: claimed.outbox_id };
        });
      }
    },
  };
}

export function recontactDelivery({ outbox, report, clock = () => new Date().toISOString() }) {
  if (!report || report.status !== "DELIVERED") throw new Error("DELIVERY_REPORT_UNVERIFIED");
  requiredString(report.attempt_id, "report.attempt_id");

  return outbox.transaction((tx) => {
    const attempt = tx.findAttempt(report.attempt_id);
    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    const result = tx.markDelivered(report.attempt_id, report.provider_reference ?? null);
    tx.recordReceipt({
      receipt_type: "DELIVERY_REPORT",
      issuer: report.issuer ?? "LOCAL_TEST_TRANSPORT",
      issuer_reference: report.provider_reference ?? null,
      verified: true,
      received_at: clock(),
      intent_id: attempt.intent_id,
      attempt_id: attempt.attempt_id,
      observed_state: "DELIVERED",
    });
    tx.setIntentState(attempt.intent_id, "COMPLETED");
    return result;
  });
}
