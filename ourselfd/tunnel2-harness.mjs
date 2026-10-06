import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export async function executeBounded(admission, operation) {
  if (admission?.determination !== "ADMITTED") {
    return { transition_id: admission?.transition?.transition_id ?? null,
      actuation:"NOT_PERFORMED", observed_effect:"NONE", exit_status:0 };
  }
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ourself-tunnel2-"));
  const before = await fs.readdir(root);
  const result = await operation({root});
  const after = await fs.readdir(root);
  return {
    transition_id: admission.transition.transition_id, actuation:"PERFORMED",
    observed_effect:"OBSERVED", exit_status:result?.exit_status ?? 0,
    before, after, artifact:result?.artifact ?? null
  };
}
