import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHelpRequest, makeHelpRequest } from '../help-moat.v0.1.mjs';
const request = action => makeHelpRequest({ requestId: 'HELP-TEST-001', requester: 'founder:local', subject: 'test subject', action });

test('explain, summarize and draft remain assistance-only', () => {
  for (const action of ['EXPLAIN', 'SUMMARIZE', 'DRAFT']) {
    const decision = evaluateHelpRequest(request(action));
    assert.equal(decision.disposition, 'ALLOW_HELP_ONLY');
    assert.equal(decision.effect_performed, false);
    assert.equal(decision.authority_granted, false);
  }
});

test('proposals are explicitly not authorization', () => {
  const decision = evaluateHelpRequest(request('PROPOSE'));
  assert.equal(decision.disposition, 'ALLOW_PROPOSAL_ONLY');
  assert.equal(decision.reason, 'PROPOSAL_IS_NOT_AUTHORIZATION');
});

test('inspection requires explicit source scope', () => {
  assert.equal(evaluateHelpRequest(request('INSPECT')).disposition, 'DENY');
  assert.equal(evaluateHelpRequest(makeHelpRequest({
    requestId: 'HELP-TEST-002', requester: 'founder:local', subject: 'file', action: 'INSPECT', inputRef: 'file://approved/source'
  }), { sourceProvided: true }).disposition, 'ALLOW_READ_ONLY');
  assert.equal(evaluateHelpRequest(request('INSPECT'), { sourceProvided: true }).reason, 'READ_SCOPE_NOT_EXPLICIT');
});

test('all effect-bearing actions fail closed regardless of requester identity', () => {
  for (const action of ['EXECUTE', 'MUTATE', 'DELETE', 'NETWORK', 'CREDENTIAL_ACCESS', 'IDENTITY_ENROLL', 'AUTHORITY_GRANT', 'BROKER_ACTUATION', 'BOOT', 'RESTORE']) {
    const decision = evaluateHelpRequest(request(action), { sourceProvided: true });
    assert.equal(decision.disposition, 'DENY', action);
    assert.equal(decision.effect_performed, false, action);
    assert.equal(decision.authority_granted, false, action);
  }
});

test('unknown actions and malformed requests deny by default', () => {
  assert.equal(evaluateHelpRequest(request('IMPERSONATE')).reason, 'UNKNOWN_ACTION_DEFAULT_DENY');
  assert.equal(evaluateHelpRequest({ action: 'EXPLAIN' }).reason, 'REQUEST_SCHEMA_INVALID');
  assert.equal(evaluateHelpRequest({ ...request('EXPLAIN'), requester: '' }).reason, 'REQUEST_PRINCIPAL_OR_SUBJECT_MISSING');
});
