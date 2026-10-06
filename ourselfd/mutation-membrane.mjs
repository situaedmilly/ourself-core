export const POLICY_VERSION = "0.1";

const FORBIDDEN_WITHOUT_EXPLICIT_AUTHORITY = new Set([
  "CAPABILITY_MUTATION",
  "AUTHORITY_MUTATION",
  "IDENTITY_MUTATION",
  "GOVERNANCE_MUTATION",
]);

export function classifyMutation(current, proposed) {
  if (current?.governance_version !== proposed?.governance_version) return "GOVERNANCE_MUTATION";
  if (current?.authority !== proposed?.authority) return "AUTHORITY_MUTATION";
  if (current?.identity !== proposed?.identity) return "IDENTITY_MUTATION";
  if (current?.capabilities?.join("|") !== proposed?.capabilities?.join("|")) return "CAPABILITY_MUTATION";
  return "STATE_MUTATION";
}

export function determine({ transition, authority }) {
  const mutationClass = classifyMutation(transition.state_from, transition.state_proposed);
  const governanceMutation = mutationClass === "GOVERNANCE_MUTATION";
  const selfAuthorizing = governanceMutation && authority?.subject === transition.actor?.id;

  let determination = "ADMITTED";
  let reason = "policy_allows_state_mutation";
  if (FORBIDDEN_WITHOUT_EXPLICIT_AUTHORITY.has(mutationClass) && !authority?.explicit) {
    determination = "DENIED";
    reason = selfAuthorizing ? "governance_cannot_self_authorize" : "insufficient_authority";
  }
  if (selfAuthorizing) {
    determination = "DENIED";
    reason = "governance_cannot_self_authorize";
  }

  return { mutation_class: mutationClass, determination, reason, policy_version: POLICY_VERSION };
}

export function executeTransition({ transition, authority }) {
  const decision = determine({ transition, authority });
  const receipt = {
    transition_id: transition.transition_id,
    actor: transition.actor,
    authority_ref: authority?.ref ?? null,
    state: { from: transition.state_from, proposed: transition.state_proposed },
    mutation_class: decision.mutation_class,
    determination: decision.determination,
    actuation: "NOT_PERFORMED",
    observed_effect: "NONE",
    reason: decision.reason,
    policy_version: decision.policy_version,
  };
  if (decision.determination !== "ADMITTED") return receipt;
  receipt.actuation = "PERFORMED";
  const realized = structuredClone(transition.state_proposed);
  receipt.observed_effect = "OBSERVED";
  receipt.state_realized = realized;
  return receipt;
}
