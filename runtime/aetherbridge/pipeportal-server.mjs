import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Transform } from 'node:stream';

const HOST = process.env.AETHERBRIDGE_BIND_HOST || '127.0.0.1';
const PORT = Number(process.env.AETHERBRIDGE_PORT || 49320);
const TOKEN_FILE = process.env.AETHERBRIDGE_TOKEN_FILE || path.join(os.homedir(), '.config/ourself-aetherbridge/ingress-token');
const DATA_DIR = process.env.AETHERBRIDGE_DATA_DIR || path.join(os.homedir(), 'OURSELF/ourself-core/runtime/aetherbridge/data');
const CUSTODY_DIR = process.env.AETHERBRIDGE_CUSTODY_DIR || path.join(os.homedir(), 'OURSELF/runtime/safeselfmutations');
const sha256File = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
// External custody receipts are observed on local disk. Presence is evidence of a
// local durable receipt, never of remote custody or external effect.
const observeExternalCustody = matterRef => {
  const safe = typeof matterRef === 'string' && matterRef.length > 0 && !matterRef.includes('/') && !matterRef.includes('..');
  const receipts = { admission: null, evaluation: null, readback: null };
  if (safe) {
    for (const [kind, prefix] of [['admission','MATTER-ADMISSION-'],['evaluation','COGNITIVE-EVALUATION-'],['readback','MATTER-READBACK-']]) {
      const f = path.join(CUSTODY_DIR, prefix + matterRef + '.json');
      if (fs.existsSync(f)) {
        let sha = null, ok = false;
        try { sha = sha256File(f); ok = true; } catch { ok = false; }
        receipts[kind] = { present: ok, file: path.basename(f), sha256: sha };
      }
    }
  }
  return { matter_ref: matterRef, receipts, remote_github_custody: 'NOT_ESTABLISHED', hollaback: 'NOT_DELIVERED', standing: receipts.readback ? 'CANONICAL_LOCAL_WITH_READBACK' : (receipts.admission ? 'CANONICAL_LOCAL_ADMISSION' : 'INTAKE_ONLY'), note: 'Observed external custody receipts are local durable files; this is not remote custody or external effect.' };
};
// ── CANONICAL MODEL GATEWAY (additive, 2026-10-11) ─────────────────────────
// One governed inference surface in front of existing OpenAI-compatible Ollama
// runtimes. OURSELF does not run an inference engine here: it authenticates,
// routes by an explicit allowlist policy, observes upstreams, and receipts
// every proxied call. Upstreams (RAWMAC local, SELFPI via tunnel) are untouched
// and remain valid direct routes until the Founder retires them.
// Rollback: delete this block and the two gateway routes below (backup:
// pipeportal-server.mjs.pre-gateway-backup-20261011, sha b0356c55...).
const PROXY_LOG = path.join(path.dirname(DATA_DIR), 'logs', 'inference-proxy.jsonl');
const UPSTREAMS = {
  SELFPI: { endpoint: 'http://127.0.0.1:11435', role: 'CANONICAL_UPSTREAM' },
  RAWMAC: { endpoint: 'http://127.0.0.1:11434', role: 'FALLBACK_UPSTREAM' }
};
const MODEL_POLICY = {
  'ourmodelselfgenesis:latest': { upstream: 'SELFPI', policy_class: 'CANONICAL' },
  'qwen3.5:4b': { upstream: 'RAWMAC', policy_class: 'FALLBACK' },
  'tnc-r2:latest': { upstream: 'RAWMAC', policy_class: 'FALLBACK' },
  'tnc-r2sys:latest': { upstream: 'RAWMAC', policy_class: 'FALLBACK' },
  'tnc-r2sysctl:latest': { upstream: 'RAWMAC', policy_class: 'FALLBACK' },
  'tnc-r2control:latest': { upstream: 'RAWMAC', policy_class: 'FALLBACK' },
  'tnc-r2probe:latest': { upstream: 'RAWMAC', policy_class: 'FALLBACK' },
  'smollm2:135m': { upstream: 'RAWMAC', policy_class: 'FALLBACK' }
};
// Receipts record routing metadata only: never message content, never headers,
// never the ingress token.
const appendProxyReceipt = entry => { try { fs.mkdirSync(path.dirname(PROXY_LOG), { recursive: true, mode: 0o700 }); fs.appendFileSync(PROXY_LOG, JSON.stringify(entry) + '\n', { mode: 0o600 }); } catch {} };
const probeUpstream = async (id, u) => {
  const base = { id, endpoint: u.endpoint.replace('http://', ''), role: u.role, observed_at: new Date().toISOString() };
  try {
    const r = await fetch(u.endpoint + '/api/tags', { signal: AbortSignal.timeout(4000) });
    const j = await r.json();
    return { ...base, reachable: r.status === 200, observed_status: r.status, models: (j.models || []).map(m => ({ id: m.name, digest: m.digest, parameter_size: m.details?.parameter_size ?? null, quantization: m.details?.quantization_level ?? null, context_length: m.details?.context_length ?? null })) };
  } catch (e) {
    return { ...base, reachable: false, error: e.name === 'TimeoutError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE', models: [] };
  }
};
// Upstream client (2026-10-12 timeout fix). node:http instead of global fetch:
// undici's default headersTimeout is 300s, which aborted EVERY upstream call
// whose first token took >300s (i.e. every cold canonical model load) —
// observed as four UPSTREAM_UNREACHABLE receipts at exactly ~301.2-301.5s
// while a 289s call survived. node:http has no hidden headers cap; timeouts
// here are explicit. Rollback: restore pipeportal-server.mjs.pre-timeout-fix-backup-20261012.
const UPSTREAM_HEADER_TIMEOUT_MS = 600000; // first byte from upstream (cold loads may take ~300s+)
const UPSTREAM_CONNECT_TIMEOUT_MS = 10000; // TCP connect only
const UPSTREAM_BODY_TIMEOUT_MS = 600000;   // non-streaming body collection
const upstreamPost = (endpoint, bodyObj) => new Promise((resolve, reject) => {
  const payload = Buffer.from(JSON.stringify(bodyObj));
  const u = new URL(endpoint + '/v1/chat/completions');
  let settled = false;
  const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': payload.length } }, upRes => {
    settled = true; clearTimeout(headerTimer); req.setTimeout(0);
    resolve({ status: upRes.statusCode, contentType: upRes.headers['content-type'], stream: upRes });
  });
  const fail = err => { if (settled) return; settled = true; clearTimeout(headerTimer); req.destroy(); reject(err); };
  const headerTimer = setTimeout(() => fail(Object.assign(new Error('UPSTREAM_HEADERS_TIMEOUT'), { name: 'TimeoutError' })), UPSTREAM_HEADER_TIMEOUT_MS);
  // Connect timeout must bind to the socket's 'connect' event — req.setTimeout
  // is a socket IDLE timeout and would kill any request whose headers take
  // >10s (every cold canonical load). Observed once as UPSTREAM_TIMEOUT at
  // exactly 10004ms before this correction.
  req.on('socket', s => {
    if (settled) return;
    const connectTimer = setTimeout(() => fail(Object.assign(new Error('UPSTREAM_CONNECT_TIMEOUT'), { name: 'TimeoutError' })), UPSTREAM_CONNECT_TIMEOUT_MS);
    if (s.connecting) s.once('connect', () => clearTimeout(connectTimer));
    else clearTimeout(connectTimer);
  });
  req.on('error', e => fail(e.name === 'TimeoutError' ? e : Object.assign(e, { name: 'UPSTREAM_SOCKET_ERROR' })));
  req.end(payload);
});
const collectBody = (stream, timeoutMs) => new Promise((resolve, reject) => {
  const chunks = []; let done = false;
  const timer = setTimeout(() => { if (!done) { done = true; stream.destroy(); reject(Object.assign(new Error('UPSTREAM_BODY_TIMEOUT'), { name: 'TimeoutError' })); } }, timeoutMs);
  stream.on('data', c => chunks.push(c));
  stream.on('end', () => { if (!done) { done = true; clearTimeout(timer); resolve(Buffer.concat(chunks)); } });
  stream.on('error', e => { if (!done) { done = true; clearTimeout(timer); reject(e); } });
});
const MAX_BODY = 256 * 1024;
fs.mkdirSync(path.dirname(TOKEN_FILE), {recursive:true, mode:0o700});
fs.mkdirSync(DATA_DIR, {recursive:true, mode:0o700});
let token;
try { token = fs.readFileSync(TOKEN_FILE, 'utf8').trim(); } catch { token = ''; }
if (token.length < 32) { console.error('AETHERBRIDGE_BLOCKED: token file missing or too short'); process.exit(78); }
const matterFile = path.join(DATA_DIR, 'matter.json');
const statementFile = path.join(DATA_DIR, 'selfstatements.json');
const readStore = f => { try { return JSON.parse(fs.readFileSync(f,'utf8')); } catch { return {}; } };
const writeStore = (f, v) => { const tmp = f + '.' + process.pid + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(v,null,2)+'\n',{mode:0o600}); fs.renameSync(tmp,f); };
const hash = v => crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const send = (res, status, body) => { const b=JSON.stringify(body); res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':Buffer.byteLength(b)}); res.end(b); };
const auth = req => { const h=req.headers.authorization||''; if (!h.startsWith('Bearer ')) return false; const supplied=h.slice(7); return supplied.length===token.length && crypto.timingSafeEqual(Buffer.from(supplied),Buffer.from(token)); };
const readRawBody = req => new Promise((resolve,reject)=>{ const chunks=[]; let n=0, settled=false; req.on('data',c=>{if(settled)return;n+=c.length;if(n>MAX_BODY){settled=true;reject(Object.assign(new Error('BODY_TOO_LARGE'),{status:413}));req.destroy();return;}chunks.push(c);});req.on('end',()=>{if(!settled)resolve(Buffer.concat(chunks));});req.on('error',e=>{if(!settled)reject(e);});});
const readBody = async req => { const raw=await readRawBody(req); try { return JSON.parse(raw.toString('utf8')||'{}'); } catch { throw Object.assign(new Error('INVALID_JSON'),{status:400}); } };
const sourceDir = path.join(DATA_DIR, 'source-bytes');
fs.mkdirSync(sourceDir,{recursive:true,mode:0o700});
const hashBytes = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const safeId = s => typeof s==='string' && s.length>0 && s.length<=200 && !s.includes('/') && !s.includes('\\') && !/\s/.test(s);
const server = http.createServer(async (req,res)=>{
  const url = new URL(req.url,'http://127.0.0.1');
  if (req.method==='GET' && url.pathname==='/health') return send(res,200,{server:'AETHERBRIDGE-PIPEPORTAL',status:'LISTENING',reality:'BUBBLESELF-ALCHEMY',authentication:'BEARER_REQUIRED_FOR_API',runtime:'LOCAL',external_effect:false});
  if (!url.pathname.startsWith('/v1/')) return send(res,404,{error:'ROUTE_NOT_FOUND'});
  if (!auth(req)) return send(res,401,{error:'CALLER_UNBOUND',standing:'NOT_ADMITTED'});
  if (req.method==='GET' && url.pathname==='/v1/models') {
    const upstreams = await Promise.all(Object.entries(UPSTREAMS).map(([id, u]) => probeUpstream(id, u)));
    return send(res, 200, { as_of: new Date().toISOString(), record_type: 'OURSELF_OBSERVED_MODEL_REGISTRY', schema_version: '1.0.0', canonical_model: 'ourmodelselfgenesis:latest', policy: MODEL_POLICY, upstreams, note: 'Registry observed from live upstreams at request time. Policy classes are OURSELF declarations; reachability and digests are observations. Supersedes the 2026-09-29 THIRDEYE snapshot as the live surface; that snapshot is preserved as lineage.', external_effect: false });
  }
  if (req.method==='POST' && url.pathname==='/v1/chat/completions') {
    let b; try { b = await readBody(req); } catch (e) { return send(res, e.status || 400, { error: e.message }); }
    const model = typeof b.model === 'string' ? b.model : '';
    const rule = MODEL_POLICY[model];
    if (!rule) return send(res, 400, { error: 'MODEL_NOT_IN_POLICY', model, model_must_be_one_of: Object.keys(MODEL_POLICY) });
    const upstream = UPSTREAMS[rule.upstream];
    const t0 = Date.now();
    let upRes;
    let attempt = 0;
    const maxAttempts = b.stream === true ? 1 : 2;
    while (attempt < maxAttempts) {
      attempt += 1;
      const attemptStarted = Date.now();
      try {
        upRes = await upstreamPost(upstream.endpoint, b);
        break;
      } catch (e) {
        const entry = { ts: new Date().toISOString(), route: 'POST /v1/chat/completions', model, policy_class: rule.policy_class, upstream: rule.upstream, stream: b.stream === true, attempt, max_attempts: maxAttempts, status: 'UPSTREAM_REQUEST_FAILED', error: e.name === 'TimeoutError' ? 'UPSTREAM_TIMEOUT' : (e.name === 'UPSTREAM_SOCKET_ERROR' ? 'UPSTREAM_UNREACHABLE' : e.message || 'UPSTREAM_UNREACHABLE'), duration_ms: Date.now() - attemptStarted, retry_scheduled: attempt < maxAttempts, external_effect: false };
        appendProxyReceipt(entry);
        if (attempt >= maxAttempts) {
          // Stream clients expect SSE; a JSON 502 left them parsing forever
          // (observed: OpenCode held an orphaned connection after receipt 12).
          // Answer with a well-formed SSE error event so the client unblocks.
          if (b.stream === true) { res.writeHead(502, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store' }); res.end('data: ' + JSON.stringify({ error: { message: entry.error, type: 'AETHERBRIDGE_UPSTREAM_FAILURE', attempts: attempt } }) + '\n\n'); return; }
          return send(res, 502, { error: entry.error, attempts: attempt, note: 'Upstream did not answer after bounded retry; each failed attempt was receipted.' });
        }
      }
    }
    if (b.stream === true) {
      res.writeHead(upRes.status, { 'content-type': upRes.contentType || 'text/event-stream', 'cache-control': 'no-store' });
      const h = crypto.createHash('sha256');
      let hashFinalized = false;
      const tap = new Transform({ transform(c, _e, cb) { if (!hashFinalized) h.update(c); cb(null, c); } });
      let logged = false;
      const done = note => { if (logged) return; logged = true; const entry = { ts: new Date().toISOString(), route: 'POST /v1/chat/completions', model, policy_class: rule.policy_class, upstream: rule.upstream, stream: true, attempt, max_attempts: maxAttempts, upstream_status: upRes.status, duration_ms: Date.now() - t0, response_sha256: (hashFinalized ? null : (hashFinalized = true, h.digest('hex'))), transport: 'STREAM_PASSTHROUGH', external_effect: false }; if (note) entry.transport_note = note; appendProxyReceipt(entry); };
      tap.on('end', () => done());
      res.on('close', () => { if (!logged) done('CLIENT_ABORTED_OR_TRUNCATED'); });
      upRes.stream.pipe(tap).pipe(res);
      return;
    }
    let buf;
    try { buf = await collectBody(upRes.stream, UPSTREAM_BODY_TIMEOUT_MS); }
    catch (e) { const entry = { ts: new Date().toISOString(), route: 'POST /v1/chat/completions', model, policy_class: rule.policy_class, upstream: rule.upstream, stream: false, attempt, max_attempts: maxAttempts, status: 'UPSTREAM_BODY_FAILED', error: e.name === 'TimeoutError' ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_STREAM_INTERRUPTED', duration_ms: Date.now() - t0, external_effect: false }; appendProxyReceipt(entry); return send(res, 502, { error: entry.error, attempts: attempt, note: 'Upstream headers arrived but the body failed; receipted.' }); }
    let usage = null, textSha = null, finish = null;
    try { const j = JSON.parse(buf.toString('utf8')); usage = j.usage ?? null; finish = j.choices?.[0]?.finish_reason ?? null; const t = j.choices?.[0]?.message?.content; if (typeof t === 'string') textSha = crypto.createHash('sha256').update(t).digest('hex'); } catch {}
    appendProxyReceipt({ ts: new Date().toISOString(), route: 'POST /v1/chat/completions', model, policy_class: rule.policy_class, upstream: rule.upstream, stream: false, attempt, max_attempts: maxAttempts, upstream_status: upRes.status, duration_ms: Date.now() - t0, response_sha256: textSha, usage, finish_reason: finish, external_effect: false });
    res.writeHead(upRes.status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': buf.length });
    return res.end(buf);
  }
  if (req.method==='GET' && url.pathname==='/v1/capabilities') {
    const matters=readStore(matterFile), statements=readStore(statementFile);
    const obs=Object.keys(matters).map(matter_ref=>observeExternalCustody(matter_ref));
    const anyCompletedSelfstatement=Object.values(statements).some(s=>s.standing==='COMPLETED');
    const anyReadback=obs.some(o=>o.receipts.readback);
    const anyAdmission=obs.some(o=>o.receipts.admission);
    const available=['POST /v1/matter','POST /v1/selfstatement','GET /v1/matter/{matter_ref}','GET /v1/reality','GET /v1/capabilities','GET /v1/models','POST /v1/chat/completions (governed inference proxy: policy-routed, upstream-observed, receipted)'];
    const unavailable=['HOLLABACK delivery'];
    const unresolved=['production deployment','founder/conversation scope adapter'];
    if (anyCompletedSelfstatement) available.push('completed SELFStatement evaluation (observed standing=COMPLETED in local store, bound to external evaluation receipts)'); else unavailable.push('completed SELFStatement evaluation');
    if (anyAdmission) available.push('canonical Matter admission (observed external receipts in custody store)'); else unresolved.push('canonical Matter adapter');
    if (anyReadback) available.push('custody readback (observed external readback receipts in custody store)'); else unavailable.push('custody readback');
    return send(res,200,{as_of:new Date().toISOString(),available,unavailable,unresolved,unauthorized:[],evidence_refs:['AETHERBRIDGE-PIPEPORTAL-LOCAL-RUNTIME','CUSTODY_DIR_OBSERVATION:'+CUSTODY_DIR],external_effect:false});
  }
  if (req.method==='GET' && url.pathname==='/v1/reality') {
    const matters=readStore(matterFile), statements=readStore(statementFile);
    const obs=Object.keys(matters).map(matter_ref=>observeExternalCustody(matter_ref));
    const anyCompletedSelfstatement=Object.values(statements).some(s=>s.standing==='COMPLETED');
    const anyReadback=obs.some(o=>o.receipts.readback);
    const anyAdmission=obs.some(o=>o.receipts.admission);
    const blocked=['PUBLIC_DEPLOYMENT','HOLLABACK'];
    if (!anyAdmission) blocked.push('CANONICAL_MATTER_ADAPTER');
    if (!anyCompletedSelfstatement) blocked.push('COGNITIVE_EVALUATION');
    if (!anyReadback) blocked.push('CUSTODY_READBACK');
    const unresolved=[];
    if (!anyAdmission) unresolved.push('CANONICAL_MATTER_ADAPTER');
    if (!anyCompletedSelfstatement) unresolved.push('COGNITIVE_EVALUATION');
    if (!anyReadback) unresolved.push('CUSTODY_READBACK');
    return send(res,200,{as_of:new Date().toISOString(),source_refs:Object.keys(matters),standings:{ingress:'LISTENING',matter_receipts:'LOCAL_DURABLE',evaluation:anyCompletedSelfstatement?'OBSERVED_COMPLETED_LOCAL':'PENDING_ADAPTER',custody:anyReadback?'OBSERVED_CANONICAL_LOCAL_READBACK':(anyAdmission?'OBSERVED_CANONICAL_LOCAL_ADMISSION':'UNRESOLVED'),production:'NOT_DEPLOYED',remote_github_custody:'NOT_ESTABLISHED',hollaback:'NOT_DELIVERED'},current_actimanirun:'BUBBLESELF-ALCHEMY',operable_front:'AUTHENTICATED_LOCAL_INGRESS',blocked_fronts:blocked,unresolved_bindings:unresolved,external_custody_observation:obs,contradictions:[],continuity_standing:anyCompletedSelfstatement?'BOUND_LOCAL_EVALUATION':'PARTIAL',matter_count:Object.keys(matters).length,selfstatement_count:Object.keys(statements).length,observation_note:'External custody standings derive from observed local receipt files, not from declarations; remote custody and external effect remain unclaimed.'});
  }
  if (req.method==='POST' && url.pathname==='/v1/matter') {
    let b, rawBytes; try { rawBytes=await readRawBody(req); b=JSON.parse(rawBytes.toString('utf8')||'{}'); } catch(e) { return send(res,e.status||400,{error:e.message==='Unexpected end of JSON input'?'INVALID_JSON':e.message}); }
    const bubbleRequestId = typeof b.request_id==='string' ? b.request_id : null;
    if (typeof b.message_id==='string' && typeof b.conversation_id==='string' && typeof b.input==='string') {
      b = {matter_ref:b.message_id, conversation_occurrence_ref:b.conversation_id, founder_input:b.input, requested_cognition_scope:'PEEP', request_id:bubbleRequestId};
    }
    if (!safeId(b.matter_ref) || !safeId(b.conversation_occurrence_ref) || typeof b.founder_input!=='string' || b.founder_input.length>100000 || !safeId(b.requested_cognition_scope)) return send(res,400,{error:'INVALID_MATTER_PREIMAGE',required:['matter_ref/message_id','conversation_occurrence_ref/conversation_id','founder_input/input','requested_cognition_scope']});
    const payload={matter_ref:b.matter_ref,conversation_occurrence_ref:b.conversation_occurrence_ref,founder_input:b.founder_input,requested_cognition_scope:b.requested_cognition_scope,request_id:bubbleRequestId};
    const payloadHash=hash(payload), store=readStore(matterFile), existing=store[b.matter_ref];
    if (existing) return existing.payload_hash===payloadHash ? send(res,200,{...existing,idempotent_replay:true}) : send(res,409,{error:'MATTER_IDENTITY_CONFLICT',matter_ref:b.matter_ref,standing:'HELD'});
    const sourceName=b.matter_ref+'.raw';
    const sourcePath=path.join(sourceDir,sourceName);
    const rawBodySha256=hashBytes(rawBytes);
    let sourceFd;
    try { sourceFd=fs.openSync(sourcePath,'wx',0o600); fs.writeFileSync(sourceFd,rawBytes); fs.fsyncSync(sourceFd); fs.closeSync(sourceFd); sourceFd=undefined; }
    catch(e) { if(sourceFd!==undefined) try{fs.closeSync(sourceFd);}catch{}; return send(res,e.code==='EEXIST'?409:500,{error:e.code==='EEXIST'?'SOURCE_ARTIFACT_ALREADY_EXISTS':'SOURCE_ARTIFACT_WRITE_FAILED',matter_ref:b.matter_ref,standing:'HELD'}); }
    const persisted=fs.readFileSync(sourcePath);
    const persistedHash=hashBytes(persisted);
    if(persistedHash!==rawBodySha256 || !persisted.equals(rawBytes)) return send(res,500,{error:'SOURCE_ARTIFACT_READBACK_MISMATCH',matter_ref:b.matter_ref,standing:'HELD'});
    const receipt={matter_ref:b.matter_ref,request_id:bubbleRequestId,encounter_ref:'enc_'+crypto.randomUUID(),payload_hash:payloadHash,conversation_occurrence_ref:b.conversation_occurrence_ref,requested_cognition_scope:b.requested_cognition_scope,source_artifact:{ref:'source-bytes/'+sourceName,sha256:rawBodySha256,byte_length:rawBytes.length,encoding:'EXACT_HTTP_REQUEST_BODY_BYTES',readback_verified:true},receipt_standing:'RECEIVED_LOCAL_NOT_CANONICAL',evaluation_standing:'NOT_STARTED',selfstatement_ref:null,custody_ref:null,residue:['canonical Matter adapter unresolved','cognitive evaluation not run','custody readback not established'],received_at:new Date().toISOString()};
    store[b.matter_ref]=receipt; writeStore(matterFile,store);
    return send(res,202,{...receipt,accepted_matter_ref:b.matter_ref,meaning:'EXACT REQUEST BODY PRESERVED LOCALLY; INTAKE IS NOT CANONICAL CUSTODY OR COGNITION'});
  }
  if (req.method==='POST' && url.pathname==='/v1/selfstatement') {
    let b; try { b=await readBody(req); } catch(e) { return send(res,e.status||400,{error:e.message}); }
    if (!safeId(b.matter_ref) || !['PEEP','PRESSURE','RECONCILE','TRAJECT','DARKMATTER'].includes(b.requested_operation)) return send(res,400,{error:'INVALID_EVALUATION_REQUEST',required:{matter_ref:'string',requested_operation:['PEEP','PRESSURE','RECONCILE','TRAJECT','DARKMATTER']}});
    const matters=readStore(matterFile), matter=matters[b.matter_ref];
    if (!matter) return send(res,404,{error:'MATTER_NOT_VISIBLE',matter_ref:b.matter_ref});
    const key=hash({matter_ref:b.matter_ref,requested_operation:b.requested_operation}), store=readStore(statementFile);
    if (store[key]) return send(res,202,{...store[key],idempotent_replay:true});
    const pending={selfstatement_ref:'ss_'+crypto.randomUUID(),matter_ref:b.matter_ref,source_matter_refs:[b.matter_ref],requested_operation:b.requested_operation,statement:null,distinction:null,standing:'PENDING_EVALUATION',residue:['cognition adapter not connected','custody adapter not connected'],custody_ref:null,created_at:new Date().toISOString(),meaning:'PENDING IS NOT A COMPLETED SELFSTATEMENT'};
    store[key]=pending; writeStore(statementFile,store);
    return send(res,202,pending);
  }
  const match=url.pathname.match(/^\/v1\/matter\/([^/]+)$/);
  if (req.method==='GET' && match) {
    const id=decodeURIComponent(match[1]), matter=readStore(matterFile)[id];
    if (!matter) return send(res,404,{error:'MATTER_NOT_VISIBLE',matter_ref:id});
    const statements=Object.values(readStore(statementFile)).filter(s=>s.matter_ref===id);
    return send(res,200,{...matter,selfstatements:statements,evaluation_standing:statements.some(s=>s.standing==='COMPLETED')?'COMPLETED':'PENDING',external_custody:observeExternalCustody(id),residue:[...matter.residue,...(statements.length?[]:['no evaluation requested'])]});
  }
  return send(res,404,{error:'ROUTE_NOT_FOUND'});
});
server.listen(PORT,HOST,()=>console.log(JSON.stringify({event:'AETHERBRIDGE_PIPEPORTAL_LISTENING',host:HOST,port:PORT,health:'http://'+HOST+':'+PORT+'/health',reality:'BUBBLESELF-ALCHEMY',token_file: path.basename(TOKEN_FILE),data_dir:DATA_DIR,public:false})));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
