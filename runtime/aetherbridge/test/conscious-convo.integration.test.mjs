import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', error => error ? reject(error) : resolve()));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('ConsciousConvo fails closed without independent PORTAL trust and admission', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ourself-conscious-convo-runtime-'));
  const dataDir = path.join(root, 'data');
  const token = 'conscious-convo-integration-token-012345';
  const tokenFile = path.join(root, 'ingress-token');
  fs.writeFileSync(tokenFile, token, { mode: 0o600 });
  const port = await freePort();
  const serverPath = path.resolve('runtime/aetherbridge/pipeportal-server.mjs');
  const child = spawn(process.execPath, [serverPath], {
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      AETHERBRIDGE_BIND_HOST: '127.0.0.1',
      AETHERBRIDGE_PORT: String(port),
      AETHERBRIDGE_TOKEN_FILE: tokenFile,
      AETHERBRIDGE_DATA_DIR: dataDir,
      AETHERBRIDGE_CUSTODY_DIR: path.join(root, 'custody')
    },
    stdio: 'ignore'
  });
  const base = 'http://127.0.0.1:' + port;
  const headers = { authorization: 'Bearer ' + token, 'content-type': 'application/json' };
  const payload = {
    conversation_id: 'cc_integration_0001',
    conversation_title: 'Integration alchemy session',
    source_platform: 'CHATGPT',
    source_capture_mode: 'FOUNDER_PASTE',
    source_session_ref: 'synthetic-session-ref',
    captured_at: new Date().toISOString(),
    founder_input: 'Preserve and receive this session.',
    transcript: 'Founder: Reality shift.\\nAssistant: Conversation output.'
  };
  try {
    let live = false;
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(base + '/healthz')).ok) { live = true; break; } } catch {}
      if (child.exitCode !== null) break;
      await delay(100);
    }
    assert.equal(live, true, 'isolated PipePortal must become live');

    const ui = await fetch(base + '/founder/conscious-convo');
    assert.equal(ui.status, 200);
    assert.match(await ui.text(), /PORTAL admission/);

    const unauthenticated = await fetch(base + '/founder/conscious-convo', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload)
    });
    assert.equal(unauthenticated.status, 401);

    const bearerOnly = await fetch(base + '/founder/conscious-convo', {
      method: 'POST', headers, body: JSON.stringify(payload)
    });
    assert.equal(bearerOnly.status, 403);
    const denied = await bearerOnly.json();
    assert.equal(denied.error, 'PORTAL_ADMISSION_DENIED');
    assert.ok(denied.reasons.includes('inputselftrustself_bundle_unverified'));

    const listWithoutAdmission = await fetch(base + '/founder/conscious-convo/records', { headers: { authorization: headers.authorization } });
    assert.equal(listWithoutAdmission.status, 403);
    assert.equal((await listWithoutAdmission.json()).error, 'PORTAL_ADMISSION_DENIED');

    const detailWithoutAdmission = await fetch(base + '/founder/conscious-convo/records/' + payload.conversation_id, { headers: { authorization: headers.authorization } });
    assert.equal(detailWithoutAdmission.status, 403);
    assert.equal((await detailWithoutAdmission.json()).error, 'PORTAL_ADMISSION_DENIED');

    const health = await (await fetch(base + '/healthz')).json();
    assert.equal(health.founder_local_ingress, 'LOOPBACK_FOUNDER_AUTH_PLUS_PORTAL_CAPABILITY_ADMISSION');
    assert.equal(health.portal_trust.configured, false);

    const storeDir = path.join(dataDir, 'conscious-convo');
    assert.equal(fs.existsSync(path.join(storeDir, 'receipts.jsonl')), false);
    assert.equal(fs.existsSync(path.join(storeDir, 'source', payload.conversation_id + '.request.raw')), false);
  } finally {
    child.kill('SIGTERM');
    await delay(100);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
