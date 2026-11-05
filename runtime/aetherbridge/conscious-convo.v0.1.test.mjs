import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createConsciousConvoStore, validateConsciousConvo } from './conscious-convo.v0.1.mjs';

const fixture = (overrides = {}) => ({
  conversation_id: 'cc_test_0001',
  conversation_title: 'Founder alchemy session',
  source_platform: 'CHATGPT',
  source_capture_mode: 'FOUNDER_PASTE',
  source_session_ref: 'chatgpt-session-test',
  captured_at: '2026-11-05T21:00:00.000Z',
  founder_input: 'Preserve this conversation as OURSELF source material.',
  transcript: 'Founder: Reality shift.\nAssistant: ConsciousConvo output.',
  ...overrides
});

const admission = capability => ({
  allowed: true,
  requiredCapability: capability,
  decisionId: 'PORTAL-TEST-DECISION-0001',
  decisionDigest: 'a'.repeat(64),
  signerKeyId: 'test-portal-signer',
  admittedCapabilities: [capability]
});

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-conscious-convo-'));
  const store = createConsciousConvoStore({
    dataDir: dir,
    authenticate: req => req?.headers?.authorization === 'Bearer founder-token'
  });
  return {
    dir, store,
    auth: { headers: { authorization: 'Bearer founder-token' } },
    submitAdmission: admission('ecosystem.consciousconvo.submit'),
    readAdmission: admission('ecosystem.consciousconvo.read')
  };
}

test('validates the closed ConsciousConvo contract', () => {
  assert.equal(validateConsciousConvo(fixture()).valid, true);
  assert.equal(validateConsciousConvo(fixture({ extra: true })).valid, false);
  assert.equal(validateConsciousConvo(fixture({ transcript: '', founder_input: '' })).valid, false);
});

test('requires founder authentication and independently scoped PORTAL admission', () => {
  const { store, auth } = setup();
  const input = fixture();
  const raw = Buffer.from(JSON.stringify(input));
  assert.equal(store.submit(raw, input, {}).statusCode, 401);
  assert.equal(store.submit(raw, input, auth).statusCode, 403);
  assert.equal(store.submit(raw, input, auth, admission('ecosystem.consciousconvo.read')).statusCode, 403);
  assert.equal(store.submit(raw, fixture({ extra: true }), auth, admission('ecosystem.consciousconvo.submit')).statusCode, 400);
});

test('preserves exact request bytes and records verified PORTAL admission', () => {
  const { dir, store, auth, submitAdmission, readAdmission } = setup();
  const input = fixture();
  const raw = Buffer.from(JSON.stringify(input, null, 2) + '\n');
  const result = store.submit(raw, input, auth, submitAdmission);
  assert.equal(result.statusCode, 201);
  assert.equal(result.payload.standing, 'PORTAL_ADMITTED_FOUNDER_SUBMITTED_LOCAL_RECORD');
  assert.equal(result.payload.portal_admission, 'VERIFIED_ADMISSION');
  assert.equal(result.payload.portal_decision_id, submitAdmission.decisionId);
  assert.equal(result.payload.portal_required_capability, 'ecosystem.consciousconvo.submit');
  assert.equal(result.payload.cognition_executed, false);
  assert.deepEqual(fs.readFileSync(path.join(dir, result.payload.source_artifact)), raw);
  assert.equal(store.read(input.conversation_id, auth, readAdmission).payload.source.transcript, input.transcript);
  assert.equal(store.list(auth, readAdmission).payload.records.length, 1);
});

test('same conversation and same bytes are idempotent; conflicting bytes are held', () => {
  const { store, auth, submitAdmission } = setup();
  const input = fixture();
  const raw = Buffer.from(JSON.stringify(input));
  assert.equal(store.submit(raw, input, auth, submitAdmission).statusCode, 201);
  assert.equal(store.submit(raw, input, auth, submitAdmission).payload.idempotent_replay, true);
  const conflict = fixture({ transcript: 'Different conversation bytes.' });
  assert.equal(store.submit(Buffer.from(JSON.stringify(conflict)), conflict, auth, submitAdmission).statusCode, 409);
});

test('rejects corrupted source bytes on record read', () => {
  const { dir, store, auth, submitAdmission, readAdmission } = setup();
  const input = fixture();
  const result = store.submit(Buffer.from(JSON.stringify(input)), input, auth, submitAdmission);
  fs.appendFileSync(path.join(dir, result.payload.source_artifact), 'tamper');
  assert.equal(store.read(input.conversation_id, auth, readAdmission).payload.error, 'CONVERSATION_SOURCE_INTEGRITY_FAILED');
});

test('recovers an identical orphaned source artifact after an interrupted receipt write', () => {
  const { dir, store, auth, submitAdmission } = setup();
  const input = fixture();
  const raw = Buffer.from(JSON.stringify(input));
  const sourceDir = path.join(dir, 'source');
  fs.mkdirSync(sourceDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(sourceDir, input.conversation_id + '.request.raw'), raw, { mode: 0o600 });
  const result = store.submit(raw, input, auth, submitAdmission);
  assert.equal(result.statusCode, 201);
  assert.equal(result.payload.source_readback_verified, true);
});

test('rejects a modified hash-chained receipt ledger', () => {
  const { dir, store, auth, submitAdmission, readAdmission } = setup();
  const input = fixture();
  store.submit(Buffer.from(JSON.stringify(input)), input, auth, submitAdmission);
  const ledgerPath = path.join(dir, 'receipts.jsonl');
  const row = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
  row.conversation_title = 'Tampered title';
  fs.writeFileSync(ledgerPath, JSON.stringify(row) + '\n');
  assert.equal(store.list(auth, readAdmission).statusCode, 503);
});

test('idempotent replay rechecks source bytes before returning the prior receipt', () => {
  const { dir, store, auth, submitAdmission } = setup();
  const input = fixture();
  const raw = Buffer.from(JSON.stringify(input));
  const result = store.submit(raw, input, auth, submitAdmission);
  fs.appendFileSync(path.join(dir, result.payload.source_artifact), 'tamper');
  assert.equal(store.submit(raw, input, auth, submitAdmission).payload.error, 'CONVERSATION_SOURCE_INTEGRITY_FAILED');
});
