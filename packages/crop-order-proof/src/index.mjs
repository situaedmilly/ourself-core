/**
 * CROP v0.1 — Cross-Reality Order Proof
 *
 * Pure, deterministic verifier for an admitted event DAG.
 * This module does not grant authority, execute actions, or attest to the truth
 * of externally supplied evidence. Callers must supply independently verified
 * authority and execution evidence.
 */

function required(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError("event." + name + " must be a non-empty string");
  }
}

function validateEventShape(event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new TypeError("Each event must be an object");
  }
  required(event.event_id, "event_id");
  required(event.reality_id, "reality_id");
  required(event.instance_id, "instance_id");
  if (!Array.isArray(event.parents)) throw new TypeError("event.parents must be an array");
  if (new Set(event.parents).size !== event.parents.length) {
    throw new Error("Duplicate parent reference in " + event.event_id);
  }
  for (const parent of event.parents) required(parent, "parents[]");
  if (!event.authority || event.authority.status !== "ADMITTED" ||
      typeof event.authority.reference !== "string" || !event.authority.reference) {
    throw new Error("AUTHORITY_UNPROVEN:" + event.event_id);
  }
  if (!event.execution || event.execution.status !== "OBSERVED" ||
      !event.execution.receipt_id || !event.execution.pre_state_hash ||
      !event.execution.post_state_hash) {
    throw new Error("EXECUTION_UNPROVEN:" + event.event_id);
  }
  if (!event.evidence || event.evidence.status !== "VERIFIED" ||
      !event.evidence.digest) {
    throw new Error("EVIDENCE_UNPROVEN:" + event.event_id);
  }
}

/**
 * Verify a complete event graph and return a deterministic topological order.
 * Parents must be included in events; missing parents are not silently inferred.
 * Events without a causal path between them remain concurrent.
 */
export function proveOrder(events) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");

  const byId = new Map();
  for (const event of events) {
    validateEventShape(event);
    if (byId.has(event.event_id)) throw new Error("DUPLICATE_EVENT:" + event.event_id);
    byId.set(event.event_id, event);
  }

  const indegree = new Map([...byId.keys()].map((id) => [id, 0]));
  const children = new Map([...byId.keys()].map((id) => [id, []]));

  for (const event of events) {
    for (const parentId of event.parents) {
      if (!byId.has(parentId)) {
        throw new Error("MISSING_DEPENDENCY:" + event.event_id + ":" + parentId);
      }
      indegree.set(event.event_id, indegree.get(event.event_id) + 1);
      children.get(parentId).push(event.event_id);
    }
  }

  // Lexicographic tie-breaking makes the linearization reproducible.
  const ready = [...indegree].filter(([, degree]) => degree === 0).map(([id]) => id).sort();
  const ordered = [];
  while (ready.length) {
    const id = ready.shift();
    ordered.push(id);
    for (const child of children.get(id).sort()) {
      const next = indegree.get(child) - 1;
      indegree.set(child, next);
      if (next === 0) {
        ready.push(child);
        ready.sort();
      }
    }
  }

  if (ordered.length !== byId.size) throw new Error("CAUSAL_CYCLE");

  const ancestors = new Map();
  for (const id of ordered) {
    const set = new Set();
    for (const parentId of byId.get(id).parents) {
      set.add(parentId);
      for (const ancestor of ancestors.get(parentId)) set.add(ancestor);
    }
    ancestors.set(id, set);
  }

  const concurrentPairs = [];
  const ids = [...byId.keys()].sort();
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      if (!ancestors.get(a).has(b) && !ancestors.get(b).has(a)) {
        concurrentPairs.push([a, b]);
      }
    }
  }

  return Object.freeze({
    algorithm: "CROP",
    version: "0.1",
    result: "ORDER_PROVEN",
    ordered_event_ids: ordered,
    concurrent_pairs: concurrentPairs,
    event_count: byId.size,
    authority_and_evidence: "INPUT_ASSERTIONS_ONLY",
  });
}
