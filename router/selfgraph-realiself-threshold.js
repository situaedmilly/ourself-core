const REQUIRED_INSTANCE_COUNT = 17;

function assertUnique(ids, label) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`DUPLICATE_${label}_INSTANCE:${id}`);
    seen.add(id);
  }
}

export function assessRealiseLFThreshold(declaredInstances, witnessedInstances) {
  if (!Array.isArray(declaredInstances) || !Array.isArray(witnessedInstances)) {
    throw new TypeError('REALISELF_THRESHOLD_INPUTS_MUST_BE_ARRAYS');
  }

  const declaredIds = declaredInstances.map((x) => x.instance_id);
  const witnessedIds = witnessedInstances.map((x) => x.instance_id);

  if (declaredIds.length !== REQUIRED_INSTANCE_COUNT) {
    throw new Error(`DECLARED_INSTANCE_COUNT_MUST_BE_${REQUIRED_INSTANCE_COUNT}`);
  }

  assertUnique(declaredIds, 'DECLARED');
  assertUnique(witnessedIds, 'WITNESSED');

  const declared = new Set(declaredIds);
  const unknown = witnessedIds.filter((id) => !declared.has(id));
  if (unknown.length) {
    throw new Error(`UNKNOWN_WITNESS_INSTANCE:${unknown[0]}`);
  }

  const witnessed = new Set(witnessedIds);
  const unresolved = declaredIds.filter((id) => !witnessed.has(id));

  const validWitnesses = witnessedInstances.every((instance) =>
    instance.witness_status === 'WITNESSED' &&
    Boolean(instance.witness_ref) &&
    Boolean(instance.observed_at) &&
    Boolean(instance.evidence_ref)
  );

  const thresholdMet =
    witnessedIds.length === REQUIRED_INSTANCE_COUNT &&
    unresolved.length === 0 &&
    validWitnesses;

  return {
    required_instance_count: REQUIRED_INSTANCE_COUNT,
    witnessed_instance_count: witnessedIds.length,
    unresolved_witness_obligations: unresolved,
    threshold_met: thresholdMet,
    status: thresholdMet ? 'REALIZED' : 'NOT_REALIZED'
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const declared = Array.from({ length: REQUIRED_INSTANCE_COUNT }, (_, i) => ({
    instance_id: `OURSELF-SELFGRAPH-REALISELF-INSTANCE-${i + 1}`
  }));
  const witnessed = declared.map((instance) => ({
    ...instance,
    witness_status: 'WITNESSED',
    witness_ref: `WITNESS-${instance.instance_id}`,
    observed_at: new Date().toISOString(),
    evidence_ref: `EVIDENCE-${instance.instance_id}`
  }));

  console.log(JSON.stringify(
    assessRealiseLFThreshold(declared, witnessed),
    null,
    2
  ));
}
