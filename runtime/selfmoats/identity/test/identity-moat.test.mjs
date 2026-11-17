import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createIdentityRecord, IdentityChallengeRegistry, PersistentIdentityChallengeRegistry, canonicalJson } from '../identity-moat.v0.1.mjs';
const makeKey = () => crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

test('identity record binds P-256 SPKI fingerprint but never grants authority', () => {
  const pair = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  assert.equal(identity.state, 'ENROLLED');
  assert.equal(identity.identity_attestation, 'UNVERIFIED');
  assert.equal(identity.authority, false);
  assert.equal(identity.authenticator.private_key_exportable, false);
  assert.match(identity.public_key_sha256, /^[a-f0-9]{64}$/);
});

test('rejects non-P-256 keys', () => {
  const pair = crypto.generateKeyPairSync('ed25519');
  assert.throws(() => createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) }), /IDENTITY_KEY_MUST_BE_P256/);
});

test('fresh scoped proof verifies and is one-time', () => {
  const pair = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  const registry = new IdentityChallengeRegistry();
  const now = new Date('2026-11-17T17:00:00.000Z');
  const challenge = registry.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session', now });
  const signature = crypto.sign('sha256', Buffer.from(canonicalJson(challenge)), pair.privateKey).toString('base64');
  const first = registry.verify({ identity, challenge, signatureBase64: signature, now: new Date(now.getTime() + 1) });
  assert.equal(first.verified, true);
  assert.equal(first.authority, false);
  assert.equal(first.assurance_limit, 'LOCAL_KEY_POSSESSION_AND_AUTHENTICATOR_POLICY_ONLY');
  assert.equal(registry.verify({ identity, challenge, signatureBase64: signature, now }).reason, 'CHALLENGE_REPLAYED');
});

test('rejects challenge substitution', () => {
  const pair = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  const registry = new IdentityChallengeRegistry();
  const challenge = registry.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session' });
  const signature = crypto.sign('sha256', Buffer.from(canonicalJson(challenge)), pair.privateKey).toString('base64');
  assert.equal(registry.verify({ identity, challenge: { ...challenge, scope: 'admin.root' }, signatureBase64: signature }).reason, 'CHALLENGE_NOT_ISSUED_BY_THIS_RUNTIME');
});

test('rejects expired, missing, and invalid signatures', () => {
  const pair = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  const registry = new IdentityChallengeRegistry();
  const now = new Date('2026-11-17T17:00:00.000Z');
  const expired = registry.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session', now, ttlMs: 1000 });
  assert.equal(registry.verify({ identity, challenge: expired, signatureBase64: 'AA==', now: new Date(now.getTime() + 1000) }).reason, 'CHALLENGE_EXPIRED_OR_NOT_YET_VALID');
  const missing = registry.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session', now });
  assert.equal(registry.verify({ identity, challenge: missing, signatureBase64: null, now }).reason, 'SIGNATURE_MISSING');
  assert.equal(registry.verify({ identity, challenge: missing, signatureBase64: 'AA==', now }).reason, 'SIGNATURE_INVALID');
});


test('rejects a substituted identity public key/fingerprint binding', () => {
  const first = makeKey();
  const second = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: first.publicKey.export({ type: 'spki', format: 'pem' }) });
  const registry = new IdentityChallengeRegistry();
  const challenge = registry.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session' });
  const substituted = { ...identity, public_key_spki_pem: second.publicKey.export({ type: 'spki', format: 'pem' }) };
  assert.equal(registry.verify({ identity: substituted, challenge, signatureBase64: 'AA==' }).reason,
    'IDENTITY_PUBLIC_KEY_BINDING_MISMATCH');
});

test('persistent challenge registry survives runtime reconstruction and rejects replay', () => {
  const pair = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-identity-challenges-'));
  try {
    const now = new Date('2026-11-17T17:00:00.000Z');
    const firstRuntime = new PersistentIdentityChallengeRegistry({ directory });
    const challenge = firstRuntime.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session', now });
    const signature = crypto.sign('sha256', Buffer.from(canonicalJson(challenge)), pair.privateKey).toString('base64');
    const restartedRuntime = new PersistentIdentityChallengeRegistry({ directory });
    const first = restartedRuntime.verify({ identity, challenge, signatureBase64: signature, now: new Date(now.getTime() + 1) });
    assert.equal(first.verified, true);
    const thirdRuntime = new PersistentIdentityChallengeRegistry({ directory });
    assert.equal(thirdRuntime.verify({ identity, challenge, signatureBase64: signature, now }).reason,
      'CHALLENGE_REPLAYED');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('persistent registry does not consume a challenge on invalid proof', () => {
  const pair = makeKey();
  const identity = createIdentityRecord({ principalId: 'founder:local', publicKeySpkiPem: pair.publicKey.export({ type: 'spki', format: 'pem' }) });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-identity-challenges-'));
  try {
    const registry = new PersistentIdentityChallengeRegistry({ directory });
    const challenge = registry.issue(identity, { audience: 'ourselfd.local', scope: 'founder.session' });
    assert.equal(registry.verify({ identity, challenge, signatureBase64: 'AA==' }).reason, 'SIGNATURE_INVALID');
    const signature = crypto.sign('sha256', Buffer.from(canonicalJson(challenge)), pair.privateKey).toString('base64');
    assert.equal(registry.verify({ identity, challenge, signatureBase64: signature }).verified, true);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
