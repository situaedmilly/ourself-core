import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  canonicalDecisionBytes,
  decodePortalAdmissionHeader,
  portalTrustStatus,
  verifyPortalAdmissionEnvelope
} from '../portal-adapter.v0.2.mjs';

const makeFixture = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-portal-adapter-'));
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const publicKeyFile = path.join(dir, 'trusted-portal-signer.pem');
  const revocationsFile = path.join(dir, 'revocations.json');
  const hardwareRegistryFile = path.join(dir, 'hardware.json');
  const ecosystemRealitiesFile = path.join(dir, 'realities.json');
  const identityBindingsFile = path.join(dir, 'bindings.json');
  const jurisdictionRegistryFile = path.join(dir, 'jurisdictions.json');
  fs.writeFileSync(publicKeyFile, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(revocationsFile, JSON.stringify({
    schema_version: 'ourself.portal-revocations.v1',
    revoked_decision_ids: []
  }), { mode: 0o600 });
  fs.writeFileSync(hardwareRegistryFile, JSON.stringify({
    schema: 'ourself.hardware.instances.v0.1',
    physical_substrates: [
      { instance_id: 'HW-TEST-SOURCE', identity_status: 'BOUND', identity_attestation_ref: 'attestation://source', identity_verification_method: 'SYNTHETIC_TEST', evidence_refs: ['evidence://source'] },
      { instance_id: 'HW-TEST-TARGET', identity_status: 'BOUND', identity_attestation_ref: 'attestation://target', identity_verification_method: 'SYNTHETIC_TEST', evidence_refs: ['evidence://target'] }
    ]
  }), { mode: 0o600 });
  fs.writeFileSync(ecosystemRealitiesFile, JSON.stringify({
    schema: 'ourself.hardware.ecosystem-realities.v0.1', realities: []
  }), { mode: 0o600 });
  fs.writeFileSync(identityBindingsFile, JSON.stringify({
    schema: 'ourself.hardware.identity-bindings.v0.1', bindings: []
  }), { mode: 0o600 });
  fs.writeFileSync(jurisdictionRegistryFile, JSON.stringify({
    schema: 'ourself.hardware.jurisdictions.v0.1',
    jurisdictions: [
      { subject_id: 'HW-TEST-SOURCE', authority_status: 'VERIFIED', verification_method: 'SYNTHETIC_TEST', certifier_identity_ref: 'OURSELF:TEST-CERTIFIER', evidence_refs: ['evidence://jurisdiction/source'] },
      { subject_id: 'HW-TEST-TARGET', authority_status: 'VERIFIED', verification_method: 'SYNTHETIC_TEST', certifier_identity_ref: 'OURSELF:TEST-CERTIFIER', evidence_refs: ['evidence://jurisdiction/target'] }
    ]
  }), { mode: 0o600 });
  const config = {
    publicKeyFile,
    trustedKeyId: 'test-key-01',
    trustedSignerIdentityRef: 'OURSELF:PORTAL-SIGNER:TEST',
    expectedSourceIdentityRef: 'HW-TEST-SOURCE',
    expectedTargetIdentityRef: 'HW-TEST-TARGET',
    authorityGrantRef: 'AUTHORITY-GRANT-TEST-001',
    allowedSignerCapabilities: ['inference.chat.completions'],
    bundleVerified: true,
    hardwareRegistryFile,
    ecosystemRealitiesFile,
    identityBindingsFile,
    jurisdictionRegistryFile,
    revocationsFile
  };
  const now = Date.now();
  const decision = {
    decision_id: 'decision-test-001',
    source_identity_ref: config.expectedSourceIdentityRef,
    target_identity_ref: config.expectedTargetIdentityRef,
    decision: 'ADMIT',
    admitted_capabilities: ['inference.chat.completions'],
    policy_version: 'OURSELF-PORTAL-POLICY-v0.1',
    issued_at: new Date(now - 1000).toISOString(),
    expires_at: new Date(now + 60_000).toISOString(),
    authority_grant_ref: 'AUTHORITY-GRANT-TEST-001',
    evidence_refs: ['evidence://identity/source', 'evidence://identity/target']
  };
  const signature = crypto.sign(null, canonicalDecisionBytes(decision), privateKey).toString('base64');
  const envelope = {
    decision,
    signer: {
      algorithm: 'Ed25519',
      key_id: config.trustedKeyId,
      identity_ref: config.trustedSignerIdentityRef
    },
    signature: { encoding: 'base64', value: signature }
  };
  return { dir, config, decision, envelope, privateKey };
};

test('valid signed admission verifies only for the configured identities and capability', () => {
  const f = makeFixture();
  const result = verifyPortalAdmissionEnvelope(f.envelope, f.config, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, true);
  assert.equal(result.decisionId, f.decision.decision_id);
  assert.match(result.decisionDigest, /^[a-f0-9]{64}$/);
});

test('reverse direction requires a separately signed and identity-matched decision', () => {
  const f = makeFixture();
  const reverseDecision = {
    ...f.decision,
    decision_id: 'decision-test-reverse-001',
    source_identity_ref: f.config.expectedTargetIdentityRef,
    target_identity_ref: f.config.expectedSourceIdentityRef
  };
  const reverseEnvelope = {
    decision: reverseDecision,
    signer: f.envelope.signer,
    signature: {
      encoding: 'base64',
      value: crypto.sign(null, canonicalDecisionBytes(reverseDecision), f.privateKey).toString('base64')
    }
  };
  const reverseConfig = {
    ...f.config,
    expectedSourceIdentityRef: f.config.expectedTargetIdentityRef,
    expectedTargetIdentityRef: f.config.expectedSourceIdentityRef
  };
  const accepted = verifyPortalAdmissionEnvelope(reverseEnvelope, reverseConfig, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(accepted.allowed, true);
  const forwardConfig = verifyPortalAdmissionEnvelope(reverseEnvelope, f.config, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(forwardConfig.allowed, false);
  assert.ok(forwardConfig.reasons.includes('source_identity_mismatch'));
  assert.ok(forwardConfig.reasons.includes('target_identity_mismatch'));
});

test('unsigned and tampered decisions fail closed', () => {
  const f = makeFixture();
  const tampered = structuredClone(f.envelope);
  tampered.decision.target_identity_ref = 'OURSELF:OTHER-TARGET';
  const result = verifyPortalAdmissionEnvelope(tampered, f.config, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('target_identity_mismatch'));
  assert.ok(result.reasons.includes('signature_verification_failed'));
});

test('expired decisions fail closed', () => {
  const f = makeFixture();
  const result = verifyPortalAdmissionEnvelope(f.envelope, f.config, {
    nowMs: Date.now() + 120_000, requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('decision_expired'));
});

test('missing target binding and missing trust configuration fail closed', () => {
  const f = makeFixture();
  const wrongTarget = { ...f.config, expectedTargetIdentityRef: 'OURSELF:OTHER-TARGET' };
  const result = verifyPortalAdmissionEnvelope(f.envelope, wrongTarget, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('target_identity_mismatch'));

  const unconfigured = verifyPortalAdmissionEnvelope(f.envelope, {}, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(unconfigured.allowed, false);
  assert.ok(unconfigured.reasons.includes('inputselftrustself_bundle_unverified'));
});

test('revoked decisions fail closed', () => {
  const f = makeFixture();
  fs.writeFileSync(f.config.revocationsFile, JSON.stringify({
    schema_version: 'ourself.portal-revocations.v1',
    revoked_decision_ids: [f.decision.decision_id]
  }), { mode: 0o600 });
  const result = verifyPortalAdmissionEnvelope(f.envelope, f.config, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('decision_revoked'));
});

test('capability expansion is rejected', () => {
  const f = makeFixture();
  const result = verifyPortalAdmissionEnvelope(f.envelope, f.config, {
    nowMs: Date.now(), requiredCapability: 'kernel.actuate'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('required_capability_not_admitted'));
});

test('discovered hardware and declared jurisdiction cannot pass the registry gate', () => {
  const f = makeFixture();
  const hardware = JSON.parse(fs.readFileSync(f.config.hardwareRegistryFile, 'utf8'));
  hardware.physical_substrates[1].identity_status = 'DISCOVERED';
  fs.writeFileSync(f.config.hardwareRegistryFile, JSON.stringify(hardware), { mode: 0o600 });
  const jurisdictions = JSON.parse(fs.readFileSync(f.config.jurisdictionRegistryFile, 'utf8'));
  jurisdictions.jurisdictions[1].authority_status = 'DECLARED_NOT_VERIFIED';
  fs.writeFileSync(f.config.jurisdictionRegistryFile, JSON.stringify(jurisdictions), { mode: 0o600 });
  const result = verifyPortalAdmissionEnvelope(f.envelope, f.config, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('target_identity_registry_not_verified'));
  assert.ok(result.reasons.includes('target_jurisdiction_not_verified'));
});

test('status labels cannot substitute for independently evidenced identity and jurisdiction', () => {
  const f = makeFixture();
  const hardware = JSON.parse(fs.readFileSync(f.config.hardwareRegistryFile, 'utf8'));
  delete hardware.physical_substrates[1].identity_attestation_ref;
  delete hardware.physical_substrates[1].identity_verification_method;
  fs.writeFileSync(f.config.hardwareRegistryFile, JSON.stringify(hardware), { mode: 0o600 });
  const jurisdictions = JSON.parse(fs.readFileSync(f.config.jurisdictionRegistryFile, 'utf8'));
  delete jurisdictions.jurisdictions[1].evidence_refs;
  delete jurisdictions.jurisdictions[1].verification_method;
  fs.writeFileSync(f.config.jurisdictionRegistryFile, JSON.stringify(jurisdictions), { mode: 0o600 });
  const result = verifyPortalAdmissionEnvelope(f.envelope, f.config, {
    nowMs: Date.now(), requiredCapability: 'inference.chat.completions'
  });
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('target_independent_identity_attestation_missing'));
  assert.ok(result.reasons.includes('target_jurisdiction_certification_evidence_missing'));
});

test('trust status reports missing signer configuration without granting admission', () => {
  const f = makeFixture();
  assert.equal(portalTrustStatus(f.config).configured, true);
  assert.equal(portalTrustStatus({}).configured, false);
});

test('admission header decoder accepts only bounded canonical base64url JSON', () => {
  const f = makeFixture();
  const encoded = Buffer.from(JSON.stringify(f.envelope)).toString('base64url');
  assert.deepEqual(decodePortalAdmissionHeader(encoded), f.envelope);
  assert.equal(decodePortalAdmissionHeader('not-base64-json!'), null);
  assert.equal(decodePortalAdmissionHeader('x'.repeat(17000)), null);
});
