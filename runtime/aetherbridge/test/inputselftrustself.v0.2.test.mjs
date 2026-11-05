import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canonicalDecisionBytes } from '../portal-adapter.v0.2.mjs';
import { verifyInputSelfTrustSelfBundle } from '../inputselftrustself.v0.2.mjs';

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inputselftrustself-'));
  const { publicKey: rootPublicKey, privateKey: rootPrivateKey } = crypto.generateKeyPairSync('ed25519');
  const { publicKey: portalPublicKey } = crypto.generateKeyPairSync('ed25519');
  const rootPublicKeyFile = path.join(dir, 'independent-root.pem');
  fs.writeFileSync(rootPublicKeyFile, rootPublicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600 });

  const files = {
    hardwareRegistryFile: path.join(dir, 'hardware.json'),
    ecosystemRealitiesFile: path.join(dir, 'realities.json'),
    identityBindingsFile: path.join(dir, 'bindings.json'),
    jurisdictionRegistryFile: path.join(dir, 'jurisdictions.json')
  };
  fs.writeFileSync(files.hardwareRegistryFile, JSON.stringify({
    schema: 'ourself.hardware.instances.v0.1',
    physical_substrates: [
      { instance_id: 'HW-SOURCE', identity_status: 'BOUND', identity_attestation_ref: 'attestation://source', identity_verification_method: 'SYNTHETIC_TEST', evidence_refs: ['evidence://source'] },
      { instance_id: 'HW-TARGET', identity_status: 'BOUND', identity_attestation_ref: 'attestation://target', identity_verification_method: 'SYNTHETIC_TEST', evidence_refs: ['evidence://target'] }
    ]
  }), { mode: 0o600 });
  fs.writeFileSync(files.ecosystemRealitiesFile, JSON.stringify({
    schema: 'ourself.hardware.ecosystem-realities.v0.1', realities: []
  }), { mode: 0o600 });
  fs.writeFileSync(files.identityBindingsFile, JSON.stringify({
    schema: 'ourself.hardware.identity-bindings.v0.1', bindings: []
  }), { mode: 0o600 });
  fs.writeFileSync(files.jurisdictionRegistryFile, JSON.stringify({
    schema: 'ourself.hardware.jurisdictions.v0.1',
    jurisdictions: [
      { subject_id: 'HW-SOURCE', authority_status: 'VERIFIED', verification_method: 'SYNTHETIC_TEST', certifier_identity_ref: 'OURSELF:INDEPENDENT-CERTIFIER:TEST', evidence_refs: ['evidence://jurisdiction/source'] },
      { subject_id: 'HW-TARGET', authority_status: 'VERIFIED', verification_method: 'SYNTHETIC_TEST', certifier_identity_ref: 'OURSELF:INDEPENDENT-CERTIFIER:TEST', evidence_refs: ['evidence://jurisdiction/target'] }
    ]
  }), { mode: 0o600 });

  const portalPublicKeyPem = portalPublicKey.export({ type: 'spki', format: 'pem' }).toString();
  const portalKeyId = 'ed25519-sha256:' + crypto.createHash('sha256')
    .update(portalPublicKey.export({ type: 'spki', format: 'der' })).digest('hex');
  const rootConfig = {
    rootPublicKeyFile,
    rootKeyId: 'ROOT-TEST-KEY',
    rootSignerIdentityRef: 'OURSELF:INDEPENDENT-CERTIFIER:TEST',
    ...files
  };
  const payload = {
    schema_version: 'ourself.inputselftrustself.bundle.v1',
    bundle_id: 'INPUTSELFTRUSTSELF-TEST-001',
    issued_at: new Date(Date.now() - 1000).toISOString(),
    expires_at: new Date(Date.now() + 60_000).toISOString(),
    authority_grant_ref: 'AUTHORITY-GRANT-TEST',
    certifier: {
      algorithm: 'Ed25519',
      key_id: rootConfig.rootKeyId,
      identity_ref: rootConfig.rootSignerIdentityRef,
      device_identity_ref: 'OURSELF:TEST-HSM-DEVICE',
      root_certificate_sha256: 'c'.repeat(64)
    },
    portal_signer: {
      algorithm: 'Ed25519',
      key_id: portalKeyId,
      identity_ref: 'OURSELF:PORTAL-ISSUER:TEST',
      public_key_pem: portalPublicKeyPem,
      allowed_capabilities: ['host.admin.c10.witness.preflight']
    },
    source_identity_ref: 'HW-SOURCE',
    target_identity_ref: 'HW-TARGET',
    endpoint_certificates: {
      source: { identity_ref: 'HW-SOURCE', sha256: 'a'.repeat(64) },
      target: { identity_ref: 'HW-TARGET', sha256: 'b'.repeat(64) }
    },
    registry_sha256: Object.fromEntries(Object.entries(files).map(([key, file]) => [
      ({ hardwareRegistryFile: 'hardware', ecosystemRealitiesFile: 'ecosystem_realities', identityBindingsFile: 'identity_bindings', jurisdictionRegistryFile: 'jurisdictions' })[key],
      crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
    ]))
  };
  const bundle = {
    payload,
    signature: {
      encoding: 'base64',
      value: crypto.sign(null, canonicalDecisionBytes(payload), rootPrivateKey).toString('base64')
    }
  };
  return { dir, rootConfig, payload, bundle, rootPrivateKey };
}

test('independent root signature resolves the five PORTAL trust inputs from a certified bundle', () => {
  const f = fixture();
  const result = verifyInputSelfTrustSelfBundle(f.bundle, f.rootConfig);
  assert.equal(result.valid, true, JSON.stringify(result));
  assert.equal(result.resolvedConfig.bundleVerified, true);
  assert.equal(result.resolvedConfig.trustedSignerIdentityRef, f.payload.portal_signer.identity_ref);
  assert.equal(result.resolvedConfig.expectedSourceIdentityRef, 'HW-SOURCE');
  assert.equal(result.resolvedConfig.expectedTargetIdentityRef, 'HW-TARGET');
  assert.equal(result.resolvedConfig.authorityGrantRef, 'AUTHORITY-GRANT-TEST');
  assert.equal(result.resolvedConfig.expectedSourceCertificateSha256, 'a'.repeat(64));
  assert.equal(result.resolvedConfig.expectedTargetCertificateSha256, 'b'.repeat(64));
});

test('bundle tampering and registry drift invalidate independent certification', () => {
  const f = fixture();
  const tampered = structuredClone(f.bundle);
  tampered.payload.target_identity_ref = 'HW-OTHER';
  const invalidSignature = verifyInputSelfTrustSelfBundle(tampered, f.rootConfig);
  assert.equal(invalidSignature.valid, false);
  assert.ok(invalidSignature.reasons.includes('trust_bundle_root_signature_invalid'));

  fs.appendFileSync(f.rootConfig.hardwareRegistryFile, ' ');
  const driftedRegistry = verifyInputSelfTrustSelfBundle(f.bundle, f.rootConfig);
  assert.equal(driftedRegistry.valid, false);
  assert.ok(driftedRegistry.reasons.includes('registry_digest_mismatch:hardware'));
});

test('independent certifier and PORTAL signer cannot share one key or identity', () => {
  const f = fixture();
  const rootPem = fs.readFileSync(f.rootConfig.rootPublicKeyFile, 'utf8');
  const rootKey = crypto.createPublicKey(rootPem);
  const rootKeyId = 'ed25519-sha256:' + crypto.createHash('sha256')
    .update(rootKey.export({ type: 'spki', format: 'der' })).digest('hex');
  f.payload.portal_signer.public_key_pem = rootPem;
  f.payload.portal_signer.key_id = rootKeyId;
  f.payload.portal_signer.identity_ref = f.payload.certifier.identity_ref;
  f.bundle.signature.value = crypto.sign(null, canonicalDecisionBytes(f.payload), f.rootPrivateKey).toString('base64');
  const result = verifyInputSelfTrustSelfBundle(f.bundle, f.rootConfig);
  assert.equal(result.valid, false);
  assert.ok(result.reasons.includes('certifier_and_portal_signer_must_be_distinct'));
  assert.ok(result.reasons.includes('certifier_and_portal_signer_identities_must_be_distinct'));
});
