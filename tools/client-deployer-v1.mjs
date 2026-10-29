#!/usr/bin/env node
/**
 * OURSELF CLIENT DEPLOYER v1
 * Safe-by-default verifier/receipt writer. It never edits DNS, starts services,
 * deploys a provider, or reads credential files. Those mutations require separate
 * explicit, audited adapters and authority.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const args = process.argv.slice(2);
const value = (flag, fallback = undefined) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : fallback;
};
const command = args[0] || 'help';
const manifestPath = value('--manifest');
const receiptPath = value('--receipt');
const timeoutMs = Math.max(1000, Math.min(Number(value('--timeout-ms', '6000')) || 6000, 20000));
const iso = () => new Date().toISOString();
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

async function loadManifest() {
  if (!manifestPath) throw new Error('Missing required --manifest <path>');
  const raw = await readFile(path.resolve(manifestPath), 'utf8');
  const manifest = JSON.parse(raw);
  const errors = [];
  if (manifest.schema !== 'OURSELF-CLIENT-WEBSITE-MANIFEST-v1') errors.push('schema must be OURSELF-CLIENT-WEBSITE-MANIFEST-v1');
  if (!manifest.client || typeof manifest.client !== 'string') errors.push('client is required');
  if (!manifest.domain || typeof manifest.domain !== 'string' || manifest.domain.includes('/') || manifest.domain.includes(':')) errors.push('domain must be a hostname, not a URL');
  if (!manifest.origin || typeof manifest.origin !== 'string') errors.push('origin URL is required');
  let origin;
  try { origin = new URL(manifest.origin); } catch { errors.push('origin must be a valid URL'); }
  if (origin && !['http:', 'https:'].includes(origin.protocol)) errors.push('origin protocol must be http or https');
  if (manifest.publicHosts && (!Array.isArray(manifest.publicHosts) || manifest.publicHosts.some(h => typeof h !== 'string' || h.includes('/') || h.includes(':')))) errors.push('publicHosts must be an array of hostnames');
  if (errors.length) throw new Error('Manifest validation failed: ' + errors.join('; '));
  return { manifest, raw };
}
async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'OURSELF-CLIENT-DEPLOYER/1.0' } });
    const body = await response.text();
    return { url, ok: response.status >= 200 && response.status < 300, status: response.status, elapsed_ms: Date.now() - started, body_excerpt: body.slice(0, 500) };
  } catch (e) {
    return { url, ok: false, status: null, elapsed_ms: Date.now() - started, error: e.name === 'AbortError' ? 'TIMEOUT' : String(e.message || e).slice(0, 240) };
  } finally { clearTimeout(timer); }
}
async function run() {
  if (command === 'help' || command === '--help') {
    console.log('Usage: node tools/client-deployer-v1.mjs <preflight|verify|receipt> --manifest FILE [--receipt FILE] [--timeout-ms 6000]');
    console.log('preflight validates manifest/files; verify probes local origin and configured public hosts; receipt writes a redacted JSON receipt.');
    return;
  }
  const { manifest, raw } = await loadManifest();
  const sourcePath = manifest.sourcePath ? path.resolve(path.dirname(path.resolve(manifestPath)), manifest.sourcePath) : null;
  const checks = [];
  checks.push({ name: 'manifest_valid', ok: true, detail: manifest.schema });
  if (sourcePath) {
    try {
      const stat = await import('node:fs/promises').then(m => m.stat(sourcePath));
      checks.push({ name: 'source_file_present', ok: stat.isFile() && stat.size > 0, detail: path.basename(sourcePath), bytes: stat.size });
    } catch { checks.push({ name: 'source_file_present', ok: false, detail: 'configured sourcePath is missing or unreadable' }); }
  }
  if (command === 'verify' || command === 'receipt') {
    const localRoot = await probe(new URL(manifest.healthPath || '/health', manifest.origin).toString());
    checks.push({ name: 'local_origin_health', ...localRoot, ok: localRoot.ok && (manifest.expectedHealthText ? localRoot.body_excerpt.includes(manifest.expectedHealthText) : true) });
    const rootUrl = new URL(manifest.rootPath || '/', manifest.origin).toString();
    const localPage = await probe(rootUrl);
    checks.push({ name: 'local_origin_page', ...localPage, ok: localPage.ok });
    for (const host of (manifest.publicHosts || [manifest.domain, ...(manifest.www ? ['www.' + manifest.domain] : [])])) {
      const result = await probe('https://' + host + (manifest.rootPath || '/'));
      checks.push({ name: 'public_https_' + host, ...result, ok: result.ok });
    }
  }
  const ok = checks.every(c => c.ok);
  const receipt = {
    schema: 'OURSELF-CLIENT-DEPLOYER-RECEIPT-v1',
    generated_at: iso(),
    client: manifest.client,
    domain: manifest.domain,
    manifest_sha256: sha256(raw),
    command,
    status: ok ? 'PASS' : 'BLOCKED',
    checks,
    safety: {
      dns_mutated: false,
      service_started_or_restarted: false,
      credentials_read_or_recorded: false,
      deployment_performed: false,
      note: 'Verification only. A passing probe proves the tested URL at this time, not persistence, ownership, uptime, or payment processing.'
    }
  };
  console.log(JSON.stringify(receipt, null, 2));
  if (command === 'receipt' || receiptPath) {
    const out = path.resolve(receiptPath || path.join(path.dirname(path.resolve(manifestPath)), 'evidence', 'CLIENT-DEPLOYER-RECEIPT.json'));
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
    console.error('RECEIPT_WRITTEN=' + out);
  }
  if (!ok) process.exitCode = 2;
}
run().catch(e => { console.error('CLIENT_DEPLOYER_ERROR=' + e.message); process.exitCode = 1; });
