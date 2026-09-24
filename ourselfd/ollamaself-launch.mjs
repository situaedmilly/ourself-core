export const OLLAMASELF_LAUNCH_VERSION = "0.1";

export function normalizeOllamaLaunch(request) {
  if (!request || typeof request !== "object") throw new Error("launch_request_required");
  if (!request.instance_id || !request.model) throw new Error("instance_id_and_model_required");

  return {
    transition_id: request.transition_id ?? `OLLAMA-LAUNCH-${request.instance_id}`,
    instance_id: request.instance_id,
    model: request.model,
    context_ref: request.context_ref ?? null,
    authority_ref: request.authority_ref ?? null,
    requested_capabilities: Array.isArray(request.requested_capabilities)
      ? [...request.requested_capabilities]
      : [],
    realization_class: "COGNITIVE_REALIZATION",
    requested_effect: "MODEL_INFERENCE",
    external_actuation: false
  };
}

export function buildOllamaProposal(launch) {
  return {
    proposal_type: "COGNITIVE_OUTPUT",
    instance_id: launch.instance_id,
    model: launch.model,
    context_ref: launch.context_ref,
    requested_transition: {
      mutation_class: "STATE_MUTATION",
      effect: "MODEL_INFERENCE",
      authority_ref: launch.authority_ref
    },
    boundary: {
      may_generate_inference: true,
      may_request_transition: true,
      may_grant_authority: false,
      may_self_admit: false,
      may_self_actuate: false,
      may_mutate_governance: false,
      may_declare_external_effect_realized: false
    }
  };
}
