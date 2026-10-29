import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('help is available without credentials or external services', () => {
  const r = spawnSync(process.execPath, ['tools/client-deployer-v1.mjs', 'help'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /preflight\|verify\|receipt/);
});
test('invalid manifest fails closed', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ourself-deployer-'));
  try {
    const file = path.join(dir, 'manifest.json');
    writeFileSync(file, JSON.stringify({ schema: 'wrong', client: 'test', domain: 'example.com', origin: 'http://127.0.0.1:1' }));
    const r = spawnSync(process.execPath, ['tools/client-deployer-v1.mjs', 'preflight', '--manifest', file], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /Manifest validation failed/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('preflight checks configured source file', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'ourself-deployer-'));
  try {
    mkdirSync(path.join(dir, 'public'));
    writeFileSync(path.join(dir, 'public', 'index.html'), '<h1>ok</h1>');
    const file = path.join(dir, 'manifest.json');
    writeFileSync(file, JSON.stringify({ schema: 'OURSELF-CLIENT-WEBSITE-MANIFEST-v1', client: 'test', domain: 'example.com', origin: 'http://127.0.0.1:49330', sourcePath: 'public/index.html' }));
    const r = spawnSync(process.execPath, ['tools/client-deployer-v1.mjs', 'preflight', '--manifest', file], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /"name": "source_file_present"/);
    assert.match(r.stdout, /"ok": true/);
    assert.match(r.stdout, /"status": "PASS"/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
