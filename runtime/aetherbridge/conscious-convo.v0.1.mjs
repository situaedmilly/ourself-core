import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CONSCIOUS_CONVO_VERSION = 'ourself.conscious-convo.v0.1';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(value);
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9._:-]{8,128}$/.test(value);
const MAX_TRANSCRIPT = 220_000;
const MAX_FOUNDER_INPUT = 20_000;

export function validateConsciousConvo(input) {
  const reasons = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { valid: false, reasons: ['OBJECT_REQUIRED'] };
  const allowed = new Set(['conversation_id','conversation_title','source_platform','source_capture_mode','source_session_ref','captured_at','founder_input','transcript']);
  for (const key of Object.keys(input)) if (!allowed.has(key)) reasons.push('UNKNOWN_FIELD:' + key);
  if (!safeId(input.conversation_id)) reasons.push('CONVERSATION_ID_INVALID');
  if (typeof input.conversation_title !== 'string' || input.conversation_title.length > 240) reasons.push('TITLE_INVALID');
  if (!['CHATGPT','OURSELF'].includes(input.source_platform)) reasons.push('SOURCE_PLATFORM_INVALID');
  if (!['FOUNDER_PASTE','GPT_ACTION','API'].includes(input.source_capture_mode)) reasons.push('CAPTURE_MODE_INVALID');
  if (input.source_session_ref !== undefined && (typeof input.source_session_ref !== 'string' || input.source_session_ref.length > 256)) reasons.push('SESSION_REF_INVALID');
  if (input.captured_at !== undefined && !Number.isFinite(Date.parse(input.captured_at))) reasons.push('CAPTURED_AT_INVALID');
  if (typeof input.founder_input !== 'string' || input.founder_input.length > MAX_FOUNDER_INPUT) reasons.push('FOUNDER_INPUT_INVALID');
  if (typeof input.transcript !== 'string' || input.transcript.length > MAX_TRANSCRIPT) reasons.push('TRANSCRIPT_INVALID');
  if (!(input.founder_input.trim() || input.transcript.trim())) reasons.push('CONTENT_REQUIRED');
  return { valid: reasons.length === 0, reasons };
}

function readLedger(file) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o022) !== 0) throw new Error('CONSCIOUS_CONVO_LEDGER_PERMISSIONS_INVALID');
    const rows = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    let previous = null;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const supplied = row.receipt_sha256;
      const unsigned = { ...row };
      delete unsigned.receipt_sha256;
      if (row.previous_receipt_sha256 !== previous || supplied !== sha256(canonical(unsigned))) throw new Error('CONSCIOUS_CONVO_LEDGER_CHAIN_INVALID:' + i);
      previous = supplied;
    }
    return rows;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

const admissionValidFor = (admission, capability) => admission?.allowed === true &&
  admission.requiredCapability === capability &&
  typeof admission.decisionId === 'string' && admission.decisionId.length > 0 &&
  typeof admission.decisionDigest === 'string' && /^[a-f0-9]{64}$/.test(admission.decisionDigest) &&
  Array.isArray(admission.admittedCapabilities) && admission.admittedCapabilities.includes(capability);

export function createConsciousConvoStore({ dataDir, authenticate }) {
  if (typeof dataDir !== 'string' || typeof authenticate !== 'function') throw new TypeError('CONSCIOUS_CONVO_DEPENDENCY_INVALID');
  const root = path.resolve(dataDir);
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const sourceDir = path.join(root, 'source');
  fs.mkdirSync(sourceDir, { recursive: true, mode: 0o700 });
  const ledgerFile = path.join(root, 'receipts.jsonl');

  const submit = (rawBytes, input, authContext, admission) => {
    if (!authenticate(authContext)) return { statusCode: 401, payload: { error: 'FOUNDER_CALLER_UNBOUND' } };
    if (!admissionValidFor(admission, 'ecosystem.consciousconvo.submit')) return { statusCode: 403, payload: { error: 'PORTAL_ADMISSION_REQUIRED', required_capability: 'ecosystem.consciousconvo.submit' } };
    const checked = validateConsciousConvo(input);
    if (!checked.valid) return { statusCode: 400, payload: { error: 'CONSCIOUS_CONVO_INVALID', reasons: checked.reasons } };
    const bodyDigest = sha256(rawBytes);
    let ledger;
    try { ledger = readLedger(ledgerFile); }
    catch (error) { return { statusCode: 503, payload: { error: 'CONSCIOUS_CONVO_LEDGER_UNAVAILABLE', reason: error.message } }; }
    const prior = ledger.find(row => row.conversation_id === input.conversation_id);
    if (prior) {
      const expectedArtifact = 'source/' + input.conversation_id + '.request.raw';
      if (prior.source_artifact !== expectedArtifact) return { statusCode: 503, payload: { error: 'CONVERSATION_SOURCE_REFERENCE_INVALID' } };
      try {
        const existingBytes = fs.readFileSync(path.join(root, expectedArtifact));
        if (sha256(existingBytes) !== prior.request_sha256) return { statusCode: 503, payload: { error: 'CONVERSATION_SOURCE_INTEGRITY_FAILED' } };
      } catch (error) { return { statusCode: 503, payload: { error: 'CONVERSATION_SOURCE_UNAVAILABLE', reason: error.code || error.message } }; }
      return prior.request_sha256 === bodyDigest
        ? { statusCode: 200, payload: { ...prior, idempotent_replay: true } }
        : { statusCode: 409, payload: { error: 'CONVERSATION_ID_CONFLICT', conversation_id: input.conversation_id, standing: 'HELD' } };
    }

    const sourceName = input.conversation_id + '.request.raw';
    const sourcePath = path.join(sourceDir, sourceName);
    let fd;
    try {
      fd = fs.openSync(sourcePath, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o600);
      fs.writeFileSync(fd, rawBytes);
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = undefined;
    } catch (error) {
      if (fd !== undefined) try { fs.closeSync(fd); } catch {}
      if (error.code === 'EEXIST') {
        try {
          if (!fs.readFileSync(sourcePath).equals(rawBytes)) return { statusCode: 409, payload: { error: 'SOURCE_ARTIFACT_CONFLICT', standing: 'HELD' } };
        } catch (readError) { return { statusCode: 503, payload: { error: 'SOURCE_ARTIFACT_RECOVERY_UNAVAILABLE', reason: readError.code || readError.message } }; }
      } else {
        return { statusCode: 500, payload: { error: 'SOURCE_ARTIFACT_WRITE_FAILED', standing: 'HELD' } };
      }
    }
    const readback = fs.readFileSync(sourcePath);
    if (!readback.equals(rawBytes) || sha256(readback) !== bodyDigest) return { statusCode: 500, payload: { error: 'SOURCE_READBACK_MISMATCH', standing: 'HELD' } };

    const unsigned = {
      schema_version: CONSCIOUS_CONVO_VERSION,
      record_type: 'CONSCIOUS_CONVO',
      conversation_id: input.conversation_id,
      conversation_title: input.conversation_title,
      source_platform: input.source_platform,
      source_capture_mode_declared: input.source_capture_mode,
      source_session_ref: input.source_session_ref ?? null,
      captured_at: input.captured_at ?? new Date().toISOString(),
      received_at: new Date().toISOString(),
      founder_input_sha256: sha256(input.founder_input),
      transcript_sha256: sha256(input.transcript),
      request_sha256: bodyDigest,
      request_byte_length: rawBytes.length,
      source_artifact: 'source/' + sourceName,
      source_readback_verified: true,
      standing: 'PORTAL_ADMITTED_FOUNDER_SUBMITTED_LOCAL_RECORD',
      portal_admission: 'VERIFIED_ADMISSION',
      portal_decision_id: admission.decisionId,
      portal_decision_sha256: admission.decisionDigest,
      portal_signer_key_id: admission.signerKeyId ?? null,
      portal_required_capability: admission.requiredCapability,
      cognition_executed: false,
      external_effect: false
    };
    const record = { ...unsigned, previous_receipt_sha256: ledger.length ? ledger[ledger.length - 1].receipt_sha256 : null };
    record.receipt_sha256 = sha256(canonical(record));
    let ledgerFd;
    try {
      ledgerFd = fs.openSync(ledgerFile, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW, 0o600);
      fs.writeSync(ledgerFd, JSON.stringify(record) + '\n');
      fs.fsyncSync(ledgerFd);
    } catch (error) {
      return { statusCode: 503, payload: { error: 'CONSCIOUS_CONVO_RECEIPT_WRITE_FAILED', reason: error.message, standing: 'SOURCE_PRESERVED_RECEIPT_PENDING' } };
    } finally { if (ledgerFd !== undefined) try { fs.closeSync(ledgerFd); } catch {} }
    return { statusCode: 201, payload: record };
  };

  const list = (authContext, admission) => {
    if (!authenticate(authContext)) return { statusCode: 401, payload: { error: 'FOUNDER_CALLER_UNBOUND' } };
    if (!admissionValidFor(admission, 'ecosystem.consciousconvo.read')) return { statusCode: 403, payload: { error: 'PORTAL_ADMISSION_REQUIRED', required_capability: 'ecosystem.consciousconvo.read' } };
    try { return { statusCode: 200, payload: { records: readLedger(ledgerFile).slice(-50).reverse() } }; }
    catch (error) { return { statusCode: 503, payload: { error: 'CONSCIOUS_CONVO_LEDGER_UNAVAILABLE', reason: error.message } }; }
  };

  const read = (conversationId, authContext, admission) => {
    if (!authenticate(authContext)) return { statusCode: 401, payload: { error: 'FOUNDER_CALLER_UNBOUND' } };
    if (!admissionValidFor(admission, 'ecosystem.consciousconvo.read')) return { statusCode: 403, payload: { error: 'PORTAL_ADMISSION_REQUIRED', required_capability: 'ecosystem.consciousconvo.read' } };
    if (!safeId(conversationId)) return { statusCode: 400, payload: { error: 'CONVERSATION_ID_INVALID' } };
    try {
      const record = readLedger(ledgerFile).find(row => row.conversation_id === conversationId);
      if (!record) return { statusCode: 404, payload: { error: 'CONVERSATION_NOT_FOUND' } };
      const raw = fs.readFileSync(path.join(root, record.source_artifact));
      if (sha256(raw) !== record.request_sha256) return { statusCode: 503, payload: { error: 'CONVERSATION_SOURCE_INTEGRITY_FAILED' } };
      return { statusCode: 200, payload: { receipt: record, source: JSON.parse(raw.toString('utf8')) } };
    } catch (error) { return { statusCode: 503, payload: { error: 'CONSCIOUS_CONVO_READ_FAILED', reason: error.message } }; }
  };

  return Object.freeze({ submit, list, read });
}

export const CONSCIOUS_CONVO_FOUNDER_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><title>OURSELF | ConsciousConvo</title>
<style>
:root{color-scheme:dark;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0b0e12;color:#e9edf2}
*{box-sizing:border-box}body{margin:0;padding:32px 18px;background:radial-gradient(ellipse at 50% -20%,#253447 0,transparent 55%),#0b0e12}
main{max-width:880px;margin:auto}header{border-bottom:1px solid #303b48;padding-bottom:22px;margin-bottom:24px}
.kicker{letter-spacing:.18em;text-transform:uppercase;color:#9db5cc;font-size:11px}h1{font-size:clamp(28px,5vw,44px);font-weight:550;letter-spacing:-.04em;margin:8px 0}
p{color:#aeb9c5}.panel{background:#111820;border:1px solid #293644;border-radius:16px;padding:20px;margin:16px 0}
label{display:block;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#aebdca;margin:14px 0 6px}
input,textarea,select{width:100%;background:#0b1118;color:#f3f6fa;border:1px solid #354454;border-radius:9px;padding:12px;font:inherit}
textarea{min-height:170px;resize:vertical}button{background:#dce8f4;color:#101820;border:0;border-radius:9px;padding:12px 18px;font-weight:650;cursor:pointer;margin:14px 8px 0 0}
button.secondary{background:#263545;color:#e5edf5}small,.note{color:#8796a5;font-size:12px}.status{white-space:pre-wrap;overflow-wrap:anywhere;color:#bcd8f4;margin-top:14px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:640px){.grid{grid-template-columns:1fr}body{padding:22px 12px}}
</style></head><body><main><header><div class="kicker">OURSELF · Founder ingress</div><h1>ConsciousConvo</h1>
<p>Bring a ChatGPT alchemy conversation into OURSELF. Paste the conversation output, add a founder directive, and preserve the source with a verifiable receipt.</p></header>
<section class="panel"><div class="grid"><div><label for="token">Founder ingress token</label><input id="token" type="password" autocomplete="off" placeholder="Paste local ingress token"></div>
<div><label for="session">ChatGPT session reference (optional)</label><input id="session" placeholder="Session or conversation reference"></div></div>
<label for="portalSubmit">PORTAL admission · submit capability (signed base64url envelope)</label><textarea id="portalSubmit" style="min-height:72px" placeholder="Paste independently signed admission for ecosystem.consciousconvo.submit"></textarea>
<label for="portalRead">PORTAL admission · read capability (signed base64url envelope)</label><textarea id="portalRead" style="min-height:72px" placeholder="Paste independently signed admission for ecosystem.consciousconvo.read"></textarea>
<label for="title">Conversation title</label><input id="title" placeholder="Name this alchemy conversation">
<label for="input">Founder input / directive</label><textarea id="input" style="min-height:90px" placeholder="What should OURSELF receive, preserve, or do with this conversation?"></textarea>
<label for="transcript">ConsciousConvo output · paste ChatGPT conversation</label><textarea id="transcript" placeholder="Paste the conversation text or exported transcript here. This does not automatically read other ChatGPT sessions."></textarea>
<button id="submit">Transmit to OURSELF</button><button class="secondary" id="recent">Load recent receipts</button>
<div class="status" id="status" role="status" aria-live="polite"></div>
</section><p class="note">Local-only Founder interface · submission and reads require separate capability-scoped PORTAL admission envelopes · no model execution or external effect is implied.</p>
</main><script>
const $=id=>document.getElementById(id);const status=$('status');
const auth=()=>({Authorization:'Bearer '+$('token').value.trim()});
const portal=(capability)=>{const value=$(capability==='ecosystem.consciousconvo.submit'?'portalSubmit':'portalRead').value.trim();return value?{'X-OURSELF-PORTAL-ADMISSION':value}:{};};
$('submit').onclick=async()=>{status.textContent='';const transcript=$('transcript').value;const founder_input=$('input').value;
if(!$('token').value.trim()){status.textContent='Founder token required.';return}
if(!$('portalSubmit').value.trim()){status.textContent='Independent PORTAL admission for ecosystem.consciousconvo.submit is required.';return}
if(!transcript.trim()&&!founder_input.trim()){status.textContent='Add a conversation transcript or founder input.';return}
const payload={conversation_id:'cc_'+crypto.randomUUID(),conversation_title:$('title').value.trim(),source_platform:'CHATGPT',source_capture_mode:'FOUNDER_PASTE',source_session_ref:$('session').value.trim()||undefined,captured_at:new Date().toISOString(),founder_input,transcript};
try{const r=await fetch('/founder/conscious-convo',{method:'POST',headers:{...auth(),...portal('ecosystem.consciousconvo.submit'),'Content-Type':'application/json'},body:JSON.stringify(payload)});const j=await r.json();status.textContent=JSON.stringify(j,null,2);if(r.ok){$('transcript').value='';$('input').value='';}}catch(e){status.textContent='Transmission failed: '+e.message}};
$('recent').onclick=async()=>{if(!$('token').value.trim()){status.textContent='Founder token required.';return}if(!$('portalRead').value.trim()){status.textContent='Independent PORTAL admission for ecosystem.consciousconvo.read is required.';return}try{const r=await fetch('/founder/conscious-convo/records',{headers:{...auth(),...portal('ecosystem.consciousconvo.read')}});status.textContent=JSON.stringify(await r.json(),null,2)}catch(e){status.textContent='Read failed: '+e.message}};
</script></body></html>`;
