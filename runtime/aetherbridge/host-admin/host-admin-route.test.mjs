import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  canonicalHostAdminRequestBytes,
  createHostAdminRoute,
  validateHostAdminRequest
} from './host-admin-route.v0.1.mjs';

const PIN = {
  repository: 'situaedmilly/ALTONUMBUSELF',
  branch: 'morph-xi/selfmoat-proving',
  commit: '3fdde73c099f9b99814d72dc224c638965be27e9',
  path: 'evidence/morph-xiii/FINAL-PROOF-001.json',
  sha256: '22a4228da535aab04fb653b19f07d71fc81d3305fc9a0db398a2e6acfc717c5f'
};
const now = Date.now();
const request = overrides => ({
  schema_version: 'ourself.host-admin-request.v0.1',
  request_id: 'C10-REQUEST-0001',
  idempotency_key: 'idempotency-key-00000001',
  source_identity_ref: 'OURSELFMAC',
  target_identity_ref: 'OURSELFPIMAC',
  operation_id: 'c10.witness.preflight',
  capability: 'host.admin.c10.witness.preflight',
  workload_profile: 'OURSELF-C10-WITNESS-v0.1',
  purpose: 'Preflight the isolated C10 witness runtime',
  authority_grant_ref: 'FOUNDER-GRANT-C10-001',
  policy_version: 'ourself.host-admin-policy.v0.1',
  nonce: 'n'.repeat(48),
  issued_at: new Date(now - 1000).toISOString(),
  expires_at: new Date(now + 60_000).toISOString(),
  evidence_refs: ['evidence://c10/preflight'],
  subject_binding: { ...PIN },
  ...overrides
});
const canonical = value => Array.isArray(value) ? value.map(canonical) :
  (value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value);
const receiptHash = record => crypto.createHash('sha256').update(JSON.stringify(canonical(Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'receipt_sha256'))))).digest('hex');

const fixture = ({ allowed = true, authenticated = true, dispatch = null } = {}) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-host-admin-route-'));
  const journalPath = path.join(root, 'portal', 'host-admin-requests.jsonl');
  const sampleRequest = request();
  const sampleRequestDigest = crypto.createHash('sha256').update(canonicalHostAdminRequestBytes(sampleRequest)).digest('hex');
  const envelope = { decision: {
    decision_id: 'PORTAL-DECISION-0001',
    authority_grant_ref: 'FOUNDER-GRANT-C10-001',
    issued_at: new Date(now - 2000).toISOString(),
    expires_at: new Date(now + 120_000).toISOString(),
    evidence_refs: [
      'evidence://c10/admission',
      'host-admin-request:' + sampleRequest.request_id,
      'host-admin-request-sha256:' + sampleRequestDigest,
      ...sampleRequest.evidence_refs
    ]
  } };
  const readEnvelope = { decision: {
    decision_id: 'PORTAL-STATUS-DECISION-0002',
    authority_grant_ref: 'FOUNDER-GRANT-C10-001',
    issued_at: new Date(now - 2000).toISOString(),
    expires_at: new Date(now + 120_000).toISOString(),
    evidence_refs: ['host-admin-request:C10-REQUEST-0001']
  } };
  const route = createHostAdminRoute({
    portalConfig: {},
    decodeAdmissionHeader: value => value === 'valid-envelope' ? envelope : (value === 'read-envelope' ? readEnvelope : null),
    verifyAdmissionEnvelope: (_envelope, _config, options) => ({
      allowed,
      reasons: allowed ? [] : ['inputselftrustself_bundle_unverified'],
      decisionId: _envelope.decision.decision_id,
      decisionDigest: 'a'.repeat(64),
      sourceIdentityRef: 'HW-OURSELFMAC-001',
      targetIdentityRef: 'HW-OURSELFPIMAC-001',
      admittedCapabilities: [options.requiredCapability],
      expiresAt: envelope.decision.expires_at
    }),
    authenticate: () => authenticated,
    journalPath,
    dispatch,
    now: () => now
  });
  return { root, journalPath, route };
};

test('accepts only the pinned C10 request shape and operation catalog', () => {
  assert.deepEqual(validateHostAdminRequest(request(), now), { valid: true, reasons: [] });
  assert.equal(validateHostAdminRequest(request({ operation_id: 'shell.execute', capability: 'host.admin.shell.execute' }), now).valid, false);
  assert.equal(validateHostAdminRequest(request({ arbitrary_argv: ['id'] }), now).valid, false);
  assert.equal(validateHostAdminRequest(request({ subject_binding: { ...PIN, commit: '0'.repeat(40) } }), now).valid, false);
  assert.equal(validateHostAdminRequest(request({ expires_at: new Date(now + 301_000).toISOString() }), now).valid, false);
});

test('rejects requests without authenticated caller or valid PORTAL admission', async () => {
  const unauthenticated = fixture({ authenticated: false });
  assert.equal((await unauthenticated.route.submit(request(), 'valid-envelope')).statusCode, 401);
  fs.rmSync(unauthenticated.root, { recursive: true, force: true });

  const denied = fixture({ allowed: false });
  assert.equal((await denied.route.submit(request(), 'valid-envelope')).statusCode, 403);
  assert.equal(fs.existsSync(denied.journalPath), false);
  fs.rmSync(denied.root, { recursive: true, force: true });
});

test('requires request and PORTAL decision identity, capability, and authority bindings to agree', async () => {
  const f = fixture();
  const mismatch = request({ authority_grant_ref: 'OTHER-GRANT' });
  assert.equal((await f.route.submit(mismatch, 'valid-envelope')).statusCode, 403);
  assert.equal(fs.existsSync(f.journalPath), false);
  fs.rmSync(f.root, { recursive: true, force: true });
});

test('verified admission is receipted but never dispatched when PIPE/Pi runtime is absent', async () => {
  const f = fixture();
  const result = await f.route.submit(request(), 'valid-envelope');
  assert.equal(result.statusCode, 503);
  assert.equal(result.payload.error, 'HOST_ADMIN_CAPABILITY_NOT_CONFIGURED');
  assert.equal(result.payload.dispatch, false);
  const [receipt] = fs.readFileSync(f.journalPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(receipt.event, 'HOST_ADMIN_REQUEST_BLOCKED');
  assert.equal(receipt.standing, 'ADMISSION_VERIFIED_RUNTIME_UNAVAILABLE');
  assert.equal(receipt.dispatch, false);
  assert.equal(receipt.nonce_sha256, crypto.createHash('sha256').update('n'.repeat(48)).digest('hex'));
  assert.equal(receipt.receipt_sha256, receiptHash(receipt));
  assert.equal(JSON.stringify(receipt).includes('n'.repeat(48)), false);
  fs.rmSync(f.root, { recursive: true, force: true });
});

test('durably records dispatch intent before mTLS dispatch and never equates response with verified effect', async () => {
  let received;
  const f = fixture({ dispatch: async message => {
    received = message;
    return { statusCode: 200, payload: { standing: 'PREFLIGHT_OBSERVED', mutation: false } };
  } });
  const result = await f.route.submit(request(), 'valid-envelope');
  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.dispatch, true);
  assert.equal(result.payload.effect_verified, false);
  assert.equal(result.payload.external_effect, false);
  assert.equal(received.request.request_id, 'C10-REQUEST-0001');
  assert.equal(received.admission.decision.decision_id, 'PORTAL-DECISION-0001');
  const records = fs.readFileSync(f.journalPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.deepEqual(records.map(item => item.event), ['HOST_ADMIN_DISPATCH_INTENT', 'HOST_ADMIN_DISPATCH_RESULT']);
  assert.equal(records[1].previous_receipt_sha256, records[0].receipt_sha256);
  assert.equal(records[0].receipt_sha256, receiptHash(records[0]));
  assert.equal(records[1].receipt_sha256, receiptHash(records[1]));
  const status = f.route.read('C10-REQUEST-0001', 'read-envelope', true);
  assert.equal(status.statusCode, 200);
  assert.equal(status.payload.standing, 'BROKER_OPERATION_RESPONSE_RECEIVED');
  assert.equal(status.payload.effect_verified, false);
  fs.rmSync(f.root, { recursive: true, force: true });
});

test('unknown PIPE outcome is receipted and cannot be retried with the same admission', async () => {
  const f = fixture({ dispatch: async () => { throw new Error('socket closed after write'); } });
  const result = await f.route.submit(request(), 'valid-envelope');
  assert.equal(result.statusCode, 502);
  assert.equal(result.payload.standing, 'DISPATCH_OUTCOME_UNKNOWN');
  assert.equal(result.payload.external_effect, 'UNKNOWN');
  assert.equal((await f.route.submit(request(), 'valid-envelope')).statusCode, 409);
  const records = fs.readFileSync(f.journalPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(records[1].standing, 'DISPATCH_OUTCOME_UNKNOWN');
  fs.rmSync(f.root, { recursive: true, force: true });
});

test('enforces one-use decision, nonce, and idempotency; status read is read-only', async () => {
  const f = fixture();
  assert.equal((await f.route.submit(request(), 'valid-envelope')).statusCode, 503);
  assert.equal((await f.route.submit(request(), 'valid-envelope')).statusCode, 409);
  const status = f.route.read('C10-REQUEST-0001', 'read-envelope', true);
  assert.equal(status.statusCode, 200);
  assert.equal(status.payload.standing, 'ADMISSION_VERIFIED_RUNTIME_UNAVAILABLE');
  assert.equal(status.payload.dispatch, false);
  assert.equal(f.route.read('missing-0001', 'read-envelope', true).statusCode, 404);
  fs.rmSync(f.root, { recursive: true, force: true });
});
