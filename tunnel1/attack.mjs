import { executeProposal } from "./membrane.mjs";

const cases = [
  {
    name: "authorized",
    actor: "HERMES-001",
    authority_ref: "TB1-AUTH-001",
    operation: "write_file"
  },
  {
    name: "forged-authority",
    actor: "HERMES-001",
    authority_ref: "HERMES-SELF-AUTHORIZE",
    operation: "write_file"
  },
  {
    name: "capability-escalation",
    actor: "HERMES-001",
    authority_ref: "TB1-AUTH-001",
    operation: "spawn_process"
  },
  {
    name: "actor-substitution",
    actor: "ATTACKER-001",
    authority_ref: "TB1-AUTH-001",
    operation: "write_file"
  },
  {
    name: "resource-escape",
    actor: "HERMES-001",
    authority_ref: "TB1-AUTH-001",
    operation: "write_file",
    resource: "../outside.txt"
  }
];

for (const c of cases) {
  const receipt = await executeProposal({
    request_id: "TB1-ATTACK-" + c.name,
    actor: c.actor,
    operation: c.operation,
    resource: c.resource ?? "tunnel1/attack.txt",
    proposed_transition: { from: "absent", to: c.name },
    authority_ref: c.authority_ref,
    idempotency_key: "TB1-ATTACK-" + c.name
  });
  const expected = c.name === "authorized" ? "ADMIT" : "DENY";
  if (receipt.determination.decision !== expected) {
    throw new Error(`T1_ATTACK_BYPASS:${c.name}:${receipt.determination.decision}`);
  }
  if (c.name !== "authorized" && receipt.actuation !== "NOT_ACTUATED") {
    throw new Error(`T1_ATTACK_ACTUATED:${c.name}`);
  }
  console.log(c.name, receipt.determination.decision, receipt.actuation, receipt.determination.reasons.join(","));
}
