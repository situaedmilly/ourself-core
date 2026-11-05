import test from 'node:test';
import assert from 'node:assert/strict';
import { createPipeHostAdminClient } from './pipe-host-admin-client.v0.1.mjs';

test('PIPE client refuses to initialize before INPUTSELFTRUSTSELF verification', () => {
  assert.throws(() => createPipeHostAdminClient({
    endpoint: 'https://pimac.example:49443',
    portalConfig: { bundleVerified: false },
    clientKeyFile: '/missing/key',
    clientCertificateFile: '/missing/cert',
    rootCaFile: '/missing/ca'
  }), /PIPE_TRUST_BUNDLE_NOT_VERIFIED/);
});

test('PIPE client rejects non-TLS, arbitrary-port, and loopback endpoints', () => {
  const config = {
    bundleVerified: true,
    expectedSourceCertificateSha256: 'a'.repeat(64),
    expectedTargetCertificateSha256: 'b'.repeat(64),
    rootCertificateSha256: 'c'.repeat(64),
    rootPublicKeyFile: '/missing/root-public.pem'
  };
  for (const endpoint of [
    'http://pimac.example:49443',
    'https://pimac.example:443',
    'https://localhost:49443',
    'https://127.0.0.1:49443'
  ]) {
    assert.throws(() => createPipeHostAdminClient({
      endpoint, portalConfig: config,
      clientKeyFile: '/missing/key',
      clientCertificateFile: '/missing/cert',
      rootCaFile: '/missing/ca'
    }));
  }
});

test('PIPE client requires signed source, target, and root certificate pins', () => {
  assert.throws(() => createPipeHostAdminClient({
    endpoint: 'https://pimac.example:49443',
    portalConfig: { bundleVerified: true },
    clientKeyFile: '/missing/key',
    clientCertificateFile: '/missing/cert',
    rootCaFile: '/missing/ca'
  }), /PIPE_SIGNED_ENDPOINT_BINDINGS_MISSING/);
});
