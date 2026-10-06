import { createTransition, determineTransition } from "./tunnel2-transition.mjs";

export function compileModelOutput(modelOutput) {
  if (!modelOutput || typeof modelOutput !== "object") throw new Error("model_output_required");
  return createTransition(modelOutput);
}

export function admitModelProposal(modelOutput, authority) {
  const transition = compileModelOutput(modelOutput);
  return { transition, ...determineTransition(transition, authority) };
}
