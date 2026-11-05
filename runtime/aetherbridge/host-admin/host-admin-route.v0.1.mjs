import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const HOST_ADMIN_ROUTE_VERSION = 'ourself.host-admin-route.v0.1';
export const HOST_ADMIN_REQUEST_SCHEMA = 'ourself.host-admin-request.v0.1';
export const HOST_ADMIN_POLICY = 'ourself.host-admin-policy.v0.1';
export const HOST_ADMIN_PROFILE = 'OURSELF-C10-WITNESS-v0.1';

const OPERATIONS = new Set([
  'c10.witness.preflight',
  'c10.witness.identity.generate',
  'c10.witness.csr.export',
  'c10.witness.certificate.install',
  'c10.witness.service.install',
  'c10.witness.service.start',
  'c10.witness.service.status',
  'c10.witness.subject.observe',
  'c10.witness.evidence.export'
]);
const TOP_LEVEL_KEYS = new Set([
  'schema_version','request_id','idempotency_key','source_identity_ref',
  'target_identity_ref','operation_id','capability','workload_profile',
  'artifact_digests','purpose','authority_grant_ref','policy_version',
  'nonce','issued_at','expires_at','evidence_refs','subject_binding'
]);
const TRUST_IDENTITY_BINDINGS = Object.freeze({
  OURSELFMAC: 'HW-OURSELFMAC-001',
  OURSELFPIMAC: 'HW-OURSELFPIMAC-001'
});
const PIN = Object.freeze({
  repository: 'situaedmilly/ALTONUMBUSELF',
  branch: 'morph-xi/selfmoat-proving',
  commit: '3fdde73c099f9b99814d72dc224c638965be27e9',
  path: 'evidence/morph-xiii/FINAL-PROOF-001.json',
  sha256: '22a4228da535aab04fb653b19f07d71fc81d3305fc9a0db398a2e6acfc717c5f'
});
const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const canonicalize = value => Array.isArray(value) ? value.map(canonicalize) :
  (value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])])) : value);
export const canonicalHostAdminRequestBytes = request => Buffer.from(JSON.stringify(canonicalize(request)), 'utf8');

export function validateHostAdminRequest(request, nowMs = Date.now()) {
  const reasons = [];
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return { valid: false, reasons: ['request_object_required'] };
  }
  for (const key of Object.keys(request)) if (!TOP_LEVEL_KEYS.has(key)) reasons.push('unrecognized_field:' + key);
  for (const key of TOP_LEVEL_KEYS) {
    if (key !== 'artifact_digests' && !(key in request)) reasons.push('required_field_missing:' + key);
  }
  if (request.schema_version !== HOST_ADMIN_REQUEST_SCHEMA) reasons.push('schema_version_invalid');
  if (typeof request.request_id !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(request.request_id)) reasons.push('request_id_invalid');
  if (typeof request.idempotency_key !== 'string' || request.idempotency_key.length < 16 || request.idempotency_key.length > 128) reasons.push('idempotency_key_invalid');
  if (request.source_identity_ref !== 'OURSELFMAC') reasons.push('source_identity_invalid');
  if (request.target_identity_ref !== 'OURSELFPIMAC') reasons.push('target_identity_invalid');
  if (!OPERATIONS.has(request.operation_id)) reasons.push('operation_not_allowlisted');
  if (request.capability !== 'host.admin.' + request.operation_id) reasons.push('capability_operation_mismatch');
  if (request.workload_profile !== HOST_ADMIN_PROFILE) reasons.push('workload_profile_invalid');
  if (!nonEmpty(request.purpose) || request.purpose.length > 512 || request.purpose.length < 8) reasons.push('purpose_invalid');
  if (!nonEmpty(request.authority_grant_ref)) reasons.push('authority_grant_ref_invalid');
  if (request.policy_version !== HOST_ADMIN_POLICY) reasons.push('policy_version_invalid');
  if (typeof request.nonce !== 'string' || !/^[A-Za-z0-9_-]{32,128}$/.test(request.nonce)) reasons.push('nonce_invalid');
  if (!Array.isArray(request.evidence_refs) || request.evidence_refs.length < 1 ||
      request.evidence_refs.some(value => !nonEmpty(value)) ||
      new Set(request.evidence_refs).size !== request.evidence_refs.length) reasons.push('evidence_refs_invalid');
  const issuedAt = Date.parse(request.issued_at ?? '');
  const expiresAt = Date.parse(request.expires_at ?? '');
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) reasons.push('request_time_invalid');
  else {
    if (issuedAt > nowMs + 30_000) reasons.push('request_issued_in_future');
    if (expiresAt <= nowMs || expiresAt <= issuedAt || expiresAt - issuedAt > 300_000) reasons.push('request_ttl_invalid');
  }
  const binding = request.subject_binding;
  if (!binding || typeof binding !== 'object' || Array.isArray(binding)) reasons.push('subject_binding_missing');
  else {
    const keys = Object.keys(binding).sort();
    if (keys.join(',') !== 'branch,commit,path,repository,sha256') reasons.push('subject_binding_shape_invalid');
    for (const [key, value] of Object.entries(PIN)) if (binding[key] !== value) reasons.push('subject_binding_mismatch:' + key);
  }
  if (request.artifact_digests !== undefined) {
    if (!request.artifact_digests || typeof request.artifact_digests !== 'object' || Array.isArray(request.artifact_digests)) reasons.push('artifact_digests_invalid');
    else for (const [key, value] of Object.entries(request.artifact_digests)) {
      if (!nonEmpty(key) || typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) reasons.push('artifact_digest_invalid:' + key);
    }
  }
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}

function readJournal(file) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o022) !== 0) throw new Error('HOST_ADMIN_JOURNAL_PERMISSIONS_INVALID');
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return [];
    const records = raw.trimEnd().split('\n').map(line => JSON.parse(line));
    let previous = null;
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const supplied = record.receipt_sha256;
      const unsigned = { ...record };
      delete unsigned.receipt_sha256;
      if (record.previous_receipt_sha256 !== previous || typeof supplied !== 'string' ||
          sha256(canonicalHostAdminRequestBytes(unsigned)) !== supplied) {
        throw new Error('HOST_ADMIN_JOURNAL_HASH_CHAIN_INVALID:' + index);
      }
      previous = supplied;
    }
    return records;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function appendJournal(file, entry) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const dirStat = fs.lstatSync(path.dirname(file));
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink() || (dirStat.mode & 0o022) !== 0) {
    throw new Error('HOST_ADMIN_JOURNAL_DIRECTORY_INVALID');
  }
  const journal = readJournal(file);
  const record = {
    ...entry,
    previous_receipt_sha256: journal.length ? journal[journal.length - 1].receipt_sha256 : null
  };
  record.receipt_sha256 = sha256(canonicalHostAdminRequestBytes(record));
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | fs.constants.O_NOFOLLOW, 0o600);
  try {
    fs.writeSync(fd, JSON.stringify(record) + '\n');
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

export function createHostAdminRoute({
  portalConfig,
  decodeAdmissionHeader,
  verifyAdmissionEnvelope,
  authenticate,
  journalPath,
  dispatch = null,
  now = () => Date.now()
}) {
  for (const [name, value] of Object.entries({ decodeAdmissionHeader, verifyAdmissionEnvelope, authenticate, journalPath })) {
    if (typeof value !== (name === 'journalPath' ? 'string' : 'function')) throw new TypeError('HOST_ADMIN_ROUTE_DEPENDENCY_INVALID:' + name);
  }
  if (dispatch !== null && typeof dispatch !== 'function') throw new TypeError('HOST_ADMIN_ROUTE_DEPENDENCY_INVALID:dispatch');

  const submit = async (request, admissionHeader, authContext) => {
    if (!authenticate(authContext)) return { statusCode: 401, payload: { error: 'CALLER_UNBOUND', standing: 'NOT_ADMITTED' } };
    const checked = validateHostAdminRequest(request, now());
    if (!checked.valid) return { statusCode: 400, payload: { error: 'HOST_ADMIN_REQUEST_INVALID', reasons: checked.reasons, dispatch: false } };

    const envelope = decodeAdmissionHeader(admissionHeader);
    const verification = verifyAdmissionEnvelope(envelope, portalConfig, {
      requiredCapability: request.capability,
      maxTtlMs: 300_000
    });
    if (!verification.allowed) {
      return { statusCode: 403, payload: {
        error: 'PORTAL_ADMISSION_DENIED',
        decision_id: verification.decisionId ?? null,
        reasons: verification.reasons,
        standing: 'NOT_ADMITTED',
        dispatch: false
      } };
    }
    const decision = envelope?.decision;
    const requestDigest = sha256(canonicalHostAdminRequestBytes(request));
    const requiredEvidenceRefs = [
      'host-admin-request:' + request.request_id,
      'host-admin-request-sha256:' + requestDigest,
      ...request.evidence_refs
    ];
    if (verification.sourceIdentityRef !== TRUST_IDENTITY_BINDINGS[request.source_identity_ref] ||
        verification.targetIdentityRef !== TRUST_IDENTITY_BINDINGS[request.target_identity_ref] ||
        decision?.authority_grant_ref !== request.authority_grant_ref ||
        !verification.admittedCapabilities?.includes(request.capability) ||
        !requiredEvidenceRefs.every(reference => decision?.evidence_refs?.includes(reference)) ||
        Date.parse(request.issued_at) < Date.parse(decision?.issued_at) ||
        Date.parse(request.expires_at) > Date.parse(verification.expiresAt)) {
      return { statusCode: 403, payload: { error: 'HOST_ADMIN_REQUEST_ADMISSION_BINDING_MISMATCH', dispatch: false } };
    }

    let journal;
    try { journal = readJournal(journalPath); }
    catch (error) { return { statusCode: 503, payload: { error: 'HOST_ADMIN_JOURNAL_UNAVAILABLE', reason: error.message, dispatch: false } }; }

    const nonceDigest = sha256(request.nonce);
    const idempotencyDigest = sha256(request.idempotency_key);
    const replay = journal.find(item =>
      item.request_id === request.request_id ||
      item.nonce_sha256 === nonceDigest ||
      item.idempotency_key_sha256 === idempotencyDigest ||
      item.decision_id === verification.decisionId
    );
    if (replay) return { statusCode: 409, payload: { error: 'HOST_ADMIN_REPLAY_OR_IDEMPOTENCY_CONFLICT', dispatch: false } };

    if (typeof dispatch === 'function') {
      const intent = {
        schema_version: 'ourself.host-admin-request-receipt.v0.1',
        event: 'HOST_ADMIN_DISPATCH_INTENT',
        request_id: request.request_id,
        decision_id: verification.decisionId,
        decision_sha256: verification.decisionDigest,
        operation_id: request.operation_id,
        capability: request.capability,
        source_identity_ref: request.source_identity_ref,
        target_identity_ref: request.target_identity_ref,
        subject_binding: request.subject_binding,
        authority_grant_ref: request.authority_grant_ref,
        nonce_sha256: nonceDigest,
        idempotency_key_sha256: idempotencyDigest,
        admitted_at: new Date(now()).toISOString(),
        standing: 'DISPATCH_INTENT_DURABLE',
        dispatch_attempted: false,
        effect_verified: false
      };
      try { appendJournal(journalPath, intent); }
      catch (error) { return { statusCode: 503, payload: { error: 'HOST_ADMIN_DISPATCH_INTENT_RECEIPT_FAILED', reason: error.message, dispatch: false } }; }
      try {
        const brokerResponse = await dispatch({ request, admission: envelope });
        const statusCode = Number.isInteger(brokerResponse?.statusCode) ? brokerResponse.statusCode : 502;
        const mutation = brokerResponse?.payload?.mutation === true;
        const standing = statusCode === 200 ? 'BROKER_OPERATION_RESPONSE_RECEIVED' : 'BROKER_OPERATION_DENIED_OR_BLOCKED';
        appendJournal(journalPath, {
          schema_version: 'ourself.host-admin-request-receipt.v0.1',
          event: 'HOST_ADMIN_DISPATCH_RESULT',
          request_id: request.request_id,
          decision_id: verification.decisionId,
          operation_id: request.operation_id,
          broker_status_code: statusCode,
          standing,
          dispatch_attempted: true,
          dispatch_response_received: true,
          mutation_reported_by_broker: mutation,
          effect_verified: false,
          completed_at: new Date(now()).toISOString()
        });
        return { statusCode, payload: {
          ...(brokerResponse?.payload || { error: 'BROKER_RESPONSE_INVALID' }),
          request_id: request.request_id,
          decision_id: verification.decisionId,
          standing,
          dispatch_attempted: true,
          dispatch: true,
          effect_verified: false,
          external_effect: mutation ? 'UNVERIFIED' : false
        } };
      } catch (error) {
        try {
          appendJournal(journalPath, {
            schema_version: 'ourself.host-admin-request-receipt.v0.1',
            event: 'HOST_ADMIN_DISPATCH_RESULT',
            request_id: request.request_id,
            decision_id: verification.decisionId,
            operation_id: request.operation_id,
            standing: 'DISPATCH_OUTCOME_UNKNOWN',
            dispatch_attempted: true,
            dispatch_response_received: false,
            effect_verified: false,
            reason: 'PIPE_RESPONSE_UNAVAILABLE_AFTER_DISPATCH_ATTEMPT',
            completed_at: new Date(now()).toISOString()
          });
        } catch {}
        return { statusCode: 502, payload: {
          error: 'PIPE_DISPATCH_OUTCOME_UNKNOWN',
          request_id: request.request_id,
          decision_id: verification.decisionId,
          standing: 'DISPATCH_OUTCOME_UNKNOWN',
          dispatch_attempted: true,
          dispatch: true,
          effect_verified: false,
          external_effect: 'UNKNOWN'
        } };
      }
    }

    const receipt = {
      schema_version: 'ourself.host-admin-request-receipt.v0.1',
      event: 'HOST_ADMIN_REQUEST_BLOCKED',
      request_id: request.request_id,
      decision_id: verification.decisionId,
      decision_sha256: verification.decisionDigest,
      operation_id: request.operation_id,
      capability: request.capability,
      source_identity_ref: request.source_identity_ref,
      target_identity_ref: request.target_identity_ref,
      subject_binding: request.subject_binding,
      authority_grant_ref: request.authority_grant_ref,
      nonce_sha256: nonceDigest,
      idempotency_key_sha256: idempotencyDigest,
      admitted_at: new Date(now()).toISOString(),
      standing: 'ADMISSION_VERIFIED_RUNTIME_UNAVAILABLE',
      dispatch: false,
      reason: 'PIPE_DISPATCH_AND_PI_INGRESS_NOT_CONFIGURED'
    };
    try { appendJournal(journalPath, receipt); }
    catch (error) { return { statusCode: 503, payload: { error: 'HOST_ADMIN_RECEIPT_WRITE_FAILED', reason: error.message, dispatch: false } }; }

    return { statusCode: 503, payload: {
      error: 'HOST_ADMIN_CAPABILITY_NOT_CONFIGURED',
      request_id: request.request_id,
      decision_id: verification.decisionId,
      standing: 'ADMISSION_VERIFIED_RUNTIME_UNAVAILABLE',
      dispatch: false
    } };
  };

  const read = (requestId, admissionHeader, authContext) => {
    if (!authenticate(authContext)) return { statusCode: 401, payload: { error: 'CALLER_UNBOUND' } };
    if (typeof requestId !== 'string' || !/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) {
      return { statusCode: 400, payload: { error: 'REQUEST_ID_INVALID' } };
    }
    try {
      const journal = readJournal(journalPath);
      const original = journal.find(item => ['HOST_ADMIN_REQUEST_BLOCKED', 'HOST_ADMIN_DISPATCH_INTENT'].includes(item.event) && item.request_id === requestId);
      if (!original) return { statusCode: 404, payload: { error: 'HOST_ADMIN_REQUEST_NOT_FOUND' } };
      const latest = [...journal].reverse().find(item => item.request_id === requestId && ['HOST_ADMIN_REQUEST_BLOCKED', 'HOST_ADMIN_DISPATCH_RESULT'].includes(item.event)) || original;
      const envelope = decodeAdmissionHeader(admissionHeader);
      const verification = verifyAdmissionEnvelope(envelope, portalConfig, {
        requiredCapability: 'host.admin.c10.witness.service.status',
        maxTtlMs: 300_000
      });
      if (!verification.allowed) return { statusCode: 403, payload: {
        error: 'PORTAL_ADMISSION_DENIED',
        decision_id: verification.decisionId ?? null,
        reasons: verification.reasons
      } };
      const decision = envelope?.decision;
      if (verification.sourceIdentityRef !== TRUST_IDENTITY_BINDINGS[original.source_identity_ref] ||
          verification.targetIdentityRef !== TRUST_IDENTITY_BINDINGS[original.target_identity_ref] ||
          decision?.authority_grant_ref !== original.authority_grant_ref ||
          !decision?.evidence_refs?.includes('host-admin-request:' + requestId)) {
        return { statusCode: 403, payload: { error: 'HOST_ADMIN_STATUS_ADMISSION_BINDING_MISMATCH' } };
      }
      if (journal.some(item => item.decision_id === verification.decisionId)) {
        return { statusCode: 409, payload: { error: 'HOST_ADMIN_STATUS_ADMISSION_REPLAY' } };
      }
      appendJournal(journalPath, {
        schema_version: 'ourself.host-admin-request-receipt.v0.1',
        event: 'HOST_ADMIN_STATUS_READ',
        request_id: requestId,
        decision_id: verification.decisionId,
        decision_sha256: verification.decisionDigest,
        capability: 'host.admin.c10.witness.service.status',
        nonce_sha256: null,
        admitted_at: new Date(now()).toISOString(),
        dispatch: false
      });
      return { statusCode: 200, payload: {
        request_id: original.request_id,
        decision_id: original.decision_id,
        operation_id: original.operation_id,
        standing: latest.standing,
        dispatch: latest.dispatch ?? latest.dispatch_attempted ?? false,
        dispatch_attempted: latest.dispatch_attempted ?? false,
        effect_verified: latest.effect_verified ?? false,
        reason: latest.reason ?? null,
        admitted_at: original.admitted_at
      } };
    } catch (error) {
      return { statusCode: 503, payload: { error: 'HOST_ADMIN_JOURNAL_UNAVAILABLE', reason: error.message } };
    }
  };

  return Object.freeze({ submit, read });
}
