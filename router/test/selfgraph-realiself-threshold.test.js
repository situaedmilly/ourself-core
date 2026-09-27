import test from 'node:test';
import assert from 'node:assert/strict';
import { assessRealiseLFThreshold } from '../selfgraph-realiself-threshold.js';

const declared = Array.from({ length: 17 }, (_, i) => ({
  instance_id: `i-${i + 1}`
}));

const witness = (instance_id) => ({
  instance_id,
  witness_status: 'WITNESSED',
  witness_ref: `WITNESS-${instance_id}`,
  observed_at: '2051-01-01T00:00:00.000Z',
  evidence_ref: `EVIDENCE-${instance_id}`
});

test('0/17 remains NOT_REALIZED', () => {
  const result = assessRealiseLFThreshold(declared, []);
  assert.equal(result.status, 'NOT_REALIZED');
  assert.equal(result.unresolved_witness_obligations.length, 17);
});

test('16/17 remains NOT_REALIZED', () => {
  const result = assessRealiseLFThreshold(declared, declared.slice(0, 16).map(x => witness(x.instance_id)));
  assert.equal(result.status, 'NOT_REALIZED');
  assert.equal(result.unresolved_witness_obligations.length, 1);
});

test('17/17 transitions to REALIZED only with complete witnesses', () => {
  const result = assessRealiseLFThreshold(declared, declared.map(x => witness(x.instance_id)));
  assert.equal(result.status, 'REALIZED');
  assert.equal(result.threshold_met, true);
  assert.deepEqual(result.unresolved_witness_obligations, []);
});

test('duplicate witness ids fail closed', () => {
  assert.throws(
    () => assessRealiseLFThreshold(declared, [witness('i-1'), witness('i-1')]),
    /DUPLICATE_WITNESSED_INSTANCE/
  );
});

test('unknown witness ids fail closed', () => {
  assert.throws(
    () => assessRealiseLFThreshold(declared, [witness('i-999')]),
    /UNKNOWN_WITNESS_INSTANCE/
  );
});

test('missing witness evidence fails closed', () => {
  const incomplete = declared.map(x => witness(x.instance_id));
  delete incomplete[16].evidence_ref;
  const result = assessRealiseLFThreshold(declared, incomplete);
  assert.equal(result.status, 'NOT_REALIZED');
});
