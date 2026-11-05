import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { canonicalDecisionBytes } from '../portal-adapter.v0.2.mjs';
import { canonicalHostAdminRequestBytes } from '../host-admin/host-admin-route.v0.1.mjs';

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', error => error ? reject(error) : resolve()));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('runtime mounts PORTAL, denies missing admission, and forwards verified admission into existing PIPE', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-portal-runtime-'));
  const dataDir = path.join(root, 'data');
  const portalDir = path.join(dataDir, 'portal');
  fs.mkdirSync(portalDir, { recursive: true, mode: 0o700 });
  const token = 'integration-test-ingress-token-0123456789';
  const tokenFile = path.join(root, 'ingress-token');
  fs.writeFileSync(tokenFile, token, { mode: 0o600 });
  const gbtselfToken = 'integration-test-gbtself-token-0123456789';
  const gbtselfTokenFile = path.join(root, 'gbtself-ingress-token');
  fs.writeFileSync(gbtselfTokenFile, gbtselfToken, { mode: 0o600 });

  const { publicKey: rootPublicKey, privateKey: rootPrivateKey } = crypto.generateKeyPairSync('ed25519');
  const { publicKey: portalPublicKey, privateKey: portalPrivateKey } = crypto.generateKeyPairSync('ed25519');
  const rootPublicKeyFile = path.join(root, 'independent-root.pem');
  const trustBundleFile = path.join(root, 'inputselftrustself-bundle.json');
  fs.writeFileSync(rootPublicKeyFile, rootPublicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o600 });

  const revocationsFile = path.join(portalDir, 'revoked-decisions.json');
  const hardwareRegistryFile = path.join(root, 'hardware.json');
  const ecosystemRealitiesFile = path.join(root, 'realities.json');
  const identityBindingsFile = path.join(root, 'bindings.json');
  const jurisdictionRegistryFile = path.join(root, 'jurisdictions.json');
  fs.writeFileSync(revocationsFile, JSON.stringify({
    schema_version: 'ourself.portal-revocations.v1',
    revoked_decision_ids: []
  }), { mode: 0o600 });

  const sourceIdentityRef = 'HW-OURSELFMAC-001';
  const targetIdentityRef = 'HW-OURSELFPIMAC-001';
  const signerIdentityRef = 'OURSELF:INTEGRATION-PORTAL-SIGNER';
  fs.writeFileSync(hardwareRegistryFile, JSON.stringify({
    schema: 'ourself.hardware.instances.v0.1',
    physical_substrates: [
      { instance_id: sourceIdentityRef, identity_status: 'BOUND', identity_attestation_ref: 'attestation://source', identity_verification_method: 'SYNTHETIC_TEST', evidence_refs: ['evidence://source'] },
      { instance_id: targetIdentityRef, identity_status: 'BOUND', identity_attestation_ref: 'attestation://target', identity_verification_method: 'SYNTHETIC_TEST', evidence_refs: ['evidence://target'] }
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
      { subject_id: sourceIdentityRef, authority_status: 'VERIFIED', verification_method: 'SYNTHETIC_TEST', certifier_identity_ref: 'OURSELF:INTEGRATION-ROOT-CERTIFIER', evidence_refs: ['evidence://jurisdiction/source'] },
      { subject_id: targetIdentityRef, authority_status: 'VERIFIED', verification_method: 'SYNTHETIC_TEST', certifier_identity_ref: 'OURSELF:INTEGRATION-ROOT-CERTIFIER', evidence_refs: ['evidence://jurisdiction/target'] }
    ]
  }), { mode: 0o600 });
  const rootKeyId = 'integration-root-key';
  const rootSignerIdentityRef = 'OURSELF:INTEGRATION-ROOT-CERTIFIER';
  const portalPublicKeyPem = portalPublicKey.export({ type: 'spki', format: 'pem' }).toString();
  const keyId = 'ed25519-sha256:' + crypto.createHash('sha256')
    .update(portalPublicKey.export({ type: 'spki', format: 'der' })).digest('hex');
  const authorityGrantRef = 'AUTHORITY-GRANT-INTEGRATION-001';
  const registryDigest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const bundlePayload = {
    schema_version: 'ourself.inputselftrustself.bundle.v1',
    bundle_id: 'INPUTSELFTRUSTSELF-INTEGRATION-001',
    issued_at: new Date(Date.now() - 1000).toISOString(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
    authority_grant_ref: authorityGrantRef,
    certifier: {
      algorithm: 'Ed25519',
      key_id: rootKeyId,
      identity_ref: rootSignerIdentityRef,
      device_identity_ref: 'OURSELF:INTEGRATION-HSM-DEVICE',
      root_certificate_sha256: 'c'.repeat(64)
    },
    portal_signer: {
      algorithm: 'Ed25519',
      key_id: keyId,
      identity_ref: signerIdentityRef,
      public_key_pem: portalPublicKeyPem,
      allowed_capabilities: [
        'inference.chat.completions',
        'ecosystem.consciousconvo.submit',
        'ecosystem.consciousconvo.read',
        'host.admin.c10.witness.preflight',
        'host.admin.c10.witness.service.status'
      ]
    },
    source_identity_ref: sourceIdentityRef,
    target_identity_ref: targetIdentityRef,
    endpoint_certificates: {
      source: { identity_ref: sourceIdentityRef, sha256: 'a'.repeat(64) },
      target: { identity_ref: targetIdentityRef, sha256: 'b'.repeat(64) }
    },
    registry_sha256: {
      hardware: registryDigest(hardwareRegistryFile),
      ecosystem_realities: registryDigest(ecosystemRealitiesFile),
      identity_bindings: registryDigest(identityBindingsFile),
      jurisdictions: registryDigest(jurisdictionRegistryFile)
    }
  };
  const trustBundle = {
    payload: bundlePayload,
    signature: {
      encoding: 'base64',
      value: crypto.sign(null, canonicalDecisionBytes(bundlePayload), rootPrivateKey).toString('base64')
    }
  };
  fs.writeFileSync(trustBundleFile, JSON.stringify(trustBundle), { mode: 0o600 });
  const port = await freePort();
  const serverPath = path.resolve('runtime/aetherbridge/pipeportal-server.mjs');
  const child = spawn(process.execPath, [serverPath], {
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      AETHERBRIDGE_BIND_HOST: '127.0.0.1',
      AETHERBRIDGE_PORT: String(port),
      AETHERBRIDGE_TOKEN_FILE: tokenFile,
      AETHERBRIDGE_GBTSELF_TOKEN_FILE: gbtselfTokenFile,
      AETHERBRIDGE_DATA_DIR: dataDir,
      AETHERBRIDGE_CUSTODY_DIR: path.join(root, 'custody'),
      AETHERBRIDGE_PORTAL_ROOT_PUBLIC_KEY_FILE: rootPublicKeyFile,
      AETHERBRIDGE_PORTAL_ROOT_KEY_ID: rootKeyId,
      AETHERBRIDGE_PORTAL_ROOT_SIGNER_IDENTITY_REF: rootSignerIdentityRef,
      AETHERBRIDGE_PORTAL_TRUST_BUNDLE_FILE: trustBundleFile,
      AETHERBRIDGE_PORTAL_HARDWARE_REGISTRY_FILE: hardwareRegistryFile,
      AETHERBRIDGE_PORTAL_ECOSYSTEM_REALITIES_FILE: ecosystemRealitiesFile,
      AETHERBRIDGE_PORTAL_IDENTITY_BINDINGS_FILE: identityBindingsFile,
      AETHERBRIDGE_PORTAL_JURISDICTION_REGISTRY_FILE: jurisdictionRegistryFile,
      AETHERBRIDGE_PORTAL_REVOCATIONS_FILE: revocationsFile
    },
    stdio: 'ignore'
  });

  const base = `http://127.0.0.1:${port}`;
  const headers = { authorization: `Bearer ${token}` };
  try {
    let live = false;
    for (let i = 0; i < 40; i++) {
      try {
        const response = await fetch(base + '/healthz');
        if (response.ok) { live = true; break; }
      } catch {}
      if (child.exitCode !== null) break;
      await delay(100);
    }
    assert.equal(live, true, 'test runtime must become live');

    const statusResponse = await fetch(base + '/portal/v1/status', { headers });
    assert.equal(statusResponse.status, 200);
    const status = await statusResponse.json();
    assert.equal(status.adapter_version, 'ourself.pipe-portal-runtime-adapter.v0.2');
    assert.equal(status.trust.configured, true, JSON.stringify(status));

    const deniedResponse = await fetch(base + '/portal/v1/chat/completions', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'not-allowed', messages: [] })
    });
    assert.equal(deniedResponse.status, 403);
    const denied = await deniedResponse.json();
    assert.equal(denied.error, 'PORTAL_ADMISSION_DENIED');
    assert.ok(denied.reasons.includes('admission_envelope_missing'));

    const legacyRoutes = [
      ['GET', '/v1/models'],
      ['GET', '/v1/capabilities'],
      ['GET', '/v1/reality'],
      ['POST', '/v1/matter'],
      ['POST', '/v1/selfstatement'],
      ['GET', '/v1/matter/synthetic-id']
    ];
    for (const [method, route] of legacyRoutes) {
      const response = await fetch(base + route, {
        method,
        headers: { ...headers, 'content-type': 'application/json' },
        ...(method === 'POST' ? { body: '{}' } : {})
      });
      assert.equal(response.status, 403, route + ' must fail closed without PORTAL admission');
      const body = await response.json();
      assert.equal(body.error, 'PORTAL_ADMISSION_DENIED');
      assert.ok(body.reasons.includes('admission_envelope_missing'));
    }

    const unmappedRoute = await fetch(base + '/v1/unmapped', { headers });
    assert.equal(unmappedRoute.status, 403);
    assert.equal((await unmappedRoute.json()).error, 'PORTAL_ROUTE_UNMAPPED');

    const gbtselfHeaders = { authorization: 'Bearer ' + gbtselfToken };
    for (const [method, route] of [
      ['GET', '/health'],
      ['GET', '/reality'],
      ['POST', '/REALIZE/ACTIONGPT']
    ]) {
      const response = await fetch(base + route, {
        method,
        headers: gbtselfHeaders
      });
      assert.equal(response.status, 403, route + ' must require PORTAL admission');
      assert.equal((await response.json()).error, 'PORTAL_ADMISSION_DENIED');
    }

    const now = Date.now();
    const decision = {
      decision_id: 'PORTAL-INTEGRATION-DECISION-001',
      source_identity_ref: sourceIdentityRef,
      target_identity_ref: targetIdentityRef,
      decision: 'ADMIT',
      admitted_capabilities: ['inference.chat.completions'],
      policy_version: 'OURSELF-PORTAL-POLICY-v0.1',
      issued_at: new Date(now - 1000).toISOString(),
      expires_at: new Date(now + 60_000).toISOString(),
      authority_grant_ref: 'AUTHORITY-GRANT-INTEGRATION-001',
      evidence_refs: ['evidence://integration/source', 'evidence://integration/target']
    };
    const envelope = {
      decision,
      signer: { algorithm: 'Ed25519', key_id: keyId, identity_ref: signerIdentityRef },
      signature: {
        encoding: 'base64',
        value: crypto.sign(null, canonicalDecisionBytes(decision), portalPrivateKey).toString('base64')
      }
    };
    const admissionHeader = Buffer.from(JSON.stringify(envelope)).toString('base64url');
    const pipeResponse = await fetch(base + '/portal/v1/chat/completions', {
      method: 'POST',
      headers: {
        ...headers,
        'content-type': 'application/json',
        'x-ourself-portal-admission': admissionHeader
      },
      body: JSON.stringify({ model: 'not-allowed', messages: [] })
    });
    assert.equal(pipeResponse.status, 400);
    const pipeBody = await pipeResponse.json();
    assert.equal(pipeBody.error, 'MODEL_NOT_IN_POLICY');

    const receiptPath = path.join(portalDir, 'verification-receipts.jsonl');
    const receipts = fs.readFileSync(receiptPath, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    assert.ok(receipts.some(item => item.event === 'PORTAL_ADMISSION_VERIFICATION' && item.result === 'DENIED'));
    assert.ok(receipts.some(item => item.event === 'PORTAL_ADMISSION_VERIFICATION' && item.result === 'VERIFIED_ADMISSION'));
    assert.ok(receipts.some(item => item.event === 'PIPE_RESPONSE_OBSERVED' && item.decision_id === decision.decision_id));

    const signAdmission = (decisionId, capability, evidenceRefs) => {
      const hostDecision = {
        decision_id: decisionId,
        source_identity_ref: sourceIdentityRef,
        target_identity_ref: targetIdentityRef,
        decision: 'ADMIT',
        admitted_capabilities: [capability],
        policy_version: 'OURSELF-PORTAL-POLICY-v0.1',
        issued_at: new Date(Date.now() - 1000).toISOString(),
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        authority_grant_ref: authorityGrantRef,
        evidence_refs: evidenceRefs
      };
      const hostEnvelope = {
        decision: hostDecision,
        signer: { algorithm: 'Ed25519', key_id: keyId, identity_ref: signerIdentityRef },
        signature: {
          encoding: 'base64',
          value: crypto.sign(null, canonicalDecisionBytes(hostDecision), portalPrivateKey).toString('base64')
        }
      };
      return Buffer.from(JSON.stringify(hostEnvelope)).toString('base64url');
    };

    const conversationPayload = {
      conversation_id: 'cc_portal_integration_001',
      conversation_title: 'PORTAL-gated ConsciousConvo',
      source_platform: 'CHATGPT',
      source_capture_mode: 'FOUNDER_PASTE',
      source_session_ref: 'synthetic-chatgpt-session',
      captured_at: new Date().toISOString(),
      founder_input: 'Admit this conversation as founder-submitted source material.',
      transcript: 'Founder: Reality shift.\\nAssistant: PORTAL admission is required.'
    };
    const noConversationAdmission = await fetch(base + '/founder/conscious-convo', {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify(conversationPayload)
    });
    assert.equal(noConversationAdmission.status, 403);
    assert.equal((await noConversationAdmission.json()).error, 'PORTAL_ADMISSION_DENIED');

    const wrongCapabilityAdmission = signAdmission('PORTAL-CONVO-WRONG-CAP-001', 'ecosystem.consciousconvo.read', ['evidence://integration/conversation-submit']);
    const wrongCapability = await fetch(base + '/founder/conscious-convo', {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json', 'x-ourself-portal-admission': wrongCapabilityAdmission }, body: JSON.stringify(conversationPayload)
    });
    assert.equal(wrongCapability.status, 403);
    assert.ok((await wrongCapability.json()).reasons.includes('required_capability_not_admitted'));

    const conversationSubmitAdmission = signAdmission('PORTAL-CONVO-SUBMIT-001', 'ecosystem.consciousconvo.submit', ['evidence://integration/conversation-submit']);
    const conversationSubmitted = await fetch(base + '/founder/conscious-convo', {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json', 'x-ourself-portal-admission': conversationSubmitAdmission }, body: JSON.stringify(conversationPayload)
    });
    assert.equal(conversationSubmitted.status, 201);
    const conversationReceipt = await conversationSubmitted.json();
    assert.equal(conversationReceipt.portal_admission, 'VERIFIED_ADMISSION');
    assert.equal(conversationReceipt.portal_required_capability, 'ecosystem.consciousconvo.submit');
    assert.equal(conversationReceipt.portal_decision_id, 'PORTAL-CONVO-SUBMIT-001');
    assert.equal(conversationReceipt.cognition_executed, false);

    const conversationReadAdmission = signAdmission('PORTAL-CONVO-READ-001', 'ecosystem.consciousconvo.read', ['evidence://integration/conversation-read']);
    const conversationList = await fetch(base + '/founder/conscious-convo/records', {
      headers: { ...headers, 'x-ourself-portal-admission': conversationReadAdmission }
    });
    assert.equal(conversationList.status, 200);
    assert.equal((await conversationList.json()).records.length, 1);
    const conversationDetail = await fetch(base + '/founder/conscious-convo/records/' + conversationPayload.conversation_id, {
      headers: { ...headers, 'x-ourself-portal-admission': conversationReadAdmission }
    });
    assert.equal(conversationDetail.status, 200);
    assert.equal((await conversationDetail.json()).source.transcript, conversationPayload.transcript);

    const deniedConversationRead = await fetch(base + '/founder/conscious-convo/records', { headers });
    assert.equal(deniedConversationRead.status, 403);
    assert.equal((await deniedConversationRead.json()).error, 'PORTAL_ADMISSION_DENIED');

    const hostRequest = {
      schema_version: 'ourself.host-admin-request.v0.1',
      request_id: 'C10-REQUEST-INTEGRATION-001',
      idempotency_key: 'c10-integration-idempotency-0001',
      source_identity_ref: 'OURSELFMAC',
      target_identity_ref: 'OURSELFPIMAC',
      operation_id: 'c10.witness.preflight',
      capability: 'host.admin.c10.witness.preflight',
      workload_profile: 'OURSELF-C10-WITNESS-v0.1',
      purpose: 'Preflight the isolated C10 witness runtime',
      authority_grant_ref: authorityGrantRef,
      policy_version: 'ourself.host-admin-policy.v0.1',
      nonce: 'integration-nonce-' + 'n'.repeat(32),
      issued_at: new Date(Date.now() - 500).toISOString(),
      expires_at: new Date(Date.now() + 30_000).toISOString(),
      evidence_refs: ['evidence://integration/c10-preflight'],
      subject_binding: {
        repository: 'situaedmilly/ALTONUMBUSELF',
        branch: 'morph-xi/selfmoat-proving',
        commit: '3fdde73c099f9b99814d72dc224c638965be27e9',
        path: 'evidence/morph-xiii/FINAL-PROOF-001.json',
        sha256: '22a4228da535aab04fb653b19f07d71fc81d3305fc9a0db398a2e6acfc717c5f'
      }
    };
    const hostRequestDigest = crypto.createHash('sha256').update(canonicalHostAdminRequestBytes(hostRequest)).digest('hex');
    const hostAdmission = signAdmission(
      'PORTAL-HOST-ADMIN-DECISION-001',
      'host.admin.c10.witness.preflight',
      [
        'evidence://integration/c10-admission',
        'host-admin-request:' + hostRequest.request_id,
        'host-admin-request-sha256:' + hostRequestDigest,
        ...hostRequest.evidence_refs
      ]
    );
    const hostResponse = await fetch(base + '/portal/v1/host-admin/requests', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json', 'x-ourself-portal-admission': hostAdmission },
      body: JSON.stringify(hostRequest)
    });
    assert.equal(hostResponse.status, 503);
    const hostBody = await hostResponse.json();
    assert.equal(hostBody.error, 'HOST_ADMIN_CAPABILITY_NOT_CONFIGURED');
    assert.equal(hostBody.dispatch, false);
    assert.equal(hostBody.request_id, hostRequest.request_id);

    const replayResponse = await fetch(base + '/portal/v1/host-admin/requests', {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json', 'x-ourself-portal-admission': hostAdmission },
      body: JSON.stringify(hostRequest)
    });
    assert.equal(replayResponse.status, 409);

    const statusAdmission = signAdmission(
      'PORTAL-HOST-ADMIN-STATUS-DECISION-001',
      'host.admin.c10.witness.service.status',
      ['host-admin-request:' + hostRequest.request_id]
    );
    const hostStatusResponse = await fetch(base + '/portal/v1/host-admin/requests/' + hostRequest.request_id, {
      headers: { ...headers, 'x-ourself-portal-admission': statusAdmission }
    });
    assert.equal(hostStatusResponse.status, 200);
    const hostStatus = await hostStatusResponse.json();
    assert.equal(hostStatus.standing, 'ADMISSION_VERIFIED_RUNTIME_UNAVAILABLE');
    assert.equal(hostStatus.dispatch, false);

    const hostJournalPath = path.join(portalDir, 'host-admin-requests.v0.2.jsonl');
    const hostJournal = fs.readFileSync(hostJournalPath, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    assert.ok(hostJournal.some(item => item.event === 'HOST_ADMIN_REQUEST_BLOCKED' && item.request_id === hostRequest.request_id));
    assert.ok(hostJournal.some(item => item.event === 'HOST_ADMIN_STATUS_READ' && item.request_id === hostRequest.request_id));
  } finally {
    child.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => child.once('exit', resolve)),
      delay(2000)
    ]);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
