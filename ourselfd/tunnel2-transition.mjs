export const TUNNEL2_VERSION = "0.1";

export const MUTATION_CLASSES = Object.freeze([
  "STATE_MUTATION","STRUCTURAL_MUTATION","CAPABILITY_MUTATION",
  "AUTHORITY_MUTATION","IDENTITY_MUTATION","GOVERNANCE_MUTATION"
]);

export function createTransition(input) {
  if (!input || typeof input !== "object") throw new Error("transition_required");
  for (const field of ["transition_id","actor","current_state_ref","proposed_state_ref","requested_operation"]) {
    if (!input[field]) throw new Error("missing_" + field);
  }
  if (!MUTATION_CLASSES.includes(input.mutation_class)) throw new Error("invalid_mutation_class");
  return Object.freeze({
    transition_id: input.transition_id, actor: structuredClone(input.actor),
    authority_ref: input.authority_ref ?? null, current_state_ref: input.current_state_ref,
    proposed_state_ref: input.proposed_state_ref, mutation_class: input.mutation_class,
    requested_operation: input.requested_operation, capability_required: input.capability_required ?? null,
    evidence_required: [...(input.evidence_required ?? [])],
    policy_ref: input.policy_ref ?? "TUNNEL2-POLICY-0.1",
    idempotency_key: input.idempotency_key ?? input.transition_id
  });
}

export function determineTransition(transition, authority = {}) {
  const privileged = new Set(["CAPABILITY_MUTATION","AUTHORITY_MUTATION","IDENTITY_MUTATION","GOVERNANCE_MUTATION"]);
  if (privileged.has(transition.mutation_class) && authority.explicit !== true) {
    return { determination:"DENIED", reason:"explicit_authority_required" };
  }
  return { determination:"ADMITTED", reason:"policy_allows_transition" };
}
