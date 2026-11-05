import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const schemaPath = new URL('../contracts/root-authority-registration.v0.1.schema.json', import.meta.url);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

test('root authority registration schema is Draft 2020-12 and fail-closed at the top level', () => {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes('independent_review'));
  assert.ok(schema.required.includes('custody'));
  assert.ok(schema.required.includes('portal_signer'));
});

test('registration requires distinct endpoint evidence, registry digests, and lifecycle controls', () => {
  assert.deepEqual(schema.properties.endpoint_bindings.required, ['source', 'target']);
  assert.deepEqual(schema.properties.registry_bindings.required, ['hardware', 'ecosystem_realities', 'identity_bindings', 'jurisdictions']);
  assert.ok(schema.properties.lifecycle.required.includes('revocation_ref'));
  assert.ok(schema.properties.lifecycle.required.includes('independent_recontact_ref'));
});

test('private root key material is explicitly forbidden from registration', () => {
  assert.deepEqual(schema.properties.root_key.properties.private_key_material, { not: {} });
  assert.ok(!schema.properties.root_key.required.includes('private_key_material'));
});

test('BOUND requires an independent reviewer receipt', () => {
  assert.ok(schema.properties.status.enum.includes('BOUND'));
  assert.ok(schema.properties.independent_review.properties.disposition.enum.includes('VERIFIED'));
  assert.ok(schema.properties.independent_review.required.includes('review_receipt_ref'));
});

test('contract records the unbound state without creating production authority', () => {
  const contractPath = new URL('../ROOT-AUTHORITY-REGISTRATION-AND-CUSTODY-v0.1.md', import.meta.url);
  const contract = fs.readFileSync(contractPath, 'utf8');
  assert.match(contract, /CONTRACT_DEFINED \/ NO_AUTHORITY_BOUND/);
  assert.match(contract, /private root key MUST NOT be uploaded/i);
  assert.match(contract, /DEFINED BUT UNBOUND/);
});
