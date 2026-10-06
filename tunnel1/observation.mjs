import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const OBSERVER_REF = "OURSELF-OBS-TB1-001";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * OBSERVATION META-CODE
 *
 * OBSERVE is a bounded, non-mutating acquisition of a named realization
 * by a distinct observer through a declared mechanism.
 *
 * OBSERVER != OBSERVED
 * OBSERVATION != EVIDENCE
 * DECLARATION != OBSERVATION
 *
 * OBSERVE:
 *   IDENTIFY(observer, observed)
 *   ACQUIRE(declared_mechanism)
 *   NORMALIZE(acquired_state)
 *   HASH(normalized_bytes)
 *   RETURN(observation)
 */
export async function observeFile({ target, observed_ref }) {
  const observed_at = new Date().toISOString();

  try {
    const bytes = await readFile(target);
    const value = bytes.toString("utf8");

    return {
      observer_ref: OBSERVER_REF,
      observed_ref: String(observed_ref),
      observation_type: "file_state",
      method: "filesystem.readFile:utf8",
      target,
      observed_at,
      exists: true,
      byte_length: bytes.byteLength,
      sha256: sha256(bytes),
      value
    };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;

    return {
      observer_ref: OBSERVER_REF,
      observed_ref: String(observed_ref),
      observation_type: "file_state",
      method: "filesystem.readFile:utf8",
      target,
      observed_at,
      exists: false,
      byte_length: 0,
      sha256: sha256(""),
      value: null
    };
  }
}

export function observationFingerprint(observation) {
  return sha256(JSON.stringify({
    observer_ref: observation.observer_ref,
    observed_ref: observation.observed_ref,
    observation_type: observation.observation_type,
    method: observation.method,
    exists: observation.exists,
    byte_length: observation.byte_length,
    sha256: observation.sha256,
    value: observation.value
  }));
}
