const HELP_SCHEMA = 'OURSELF.HELPMOAT.REQUEST.v0.1';
const HELP_ONLY = new Set(['EXPLAIN', 'SUMMARIZE', 'DRAFT']);
const PROPOSAL_ONLY = new Set(['PROPOSE']);
const READ_ONLY = new Set(['INSPECT']);
const DENIED_EFFECTS = new Set([
  'EXECUTE', 'MUTATE', 'DELETE', 'NETWORK', 'CREDENTIAL_ACCESS',
  'IDENTITY_ENROLL', 'AUTHORITY_GRANT', 'BROKER_ACTUATION', 'BOOT', 'RESTORE'
]);

const result = (disposition, reason, request) => Object.freeze({
  schema_version: 'OURSELF.HELPMOAT.DECISION.v0.1',
  request_id: request?.request_id ?? null,
  disposition,
  reason,
  effect_performed: false,
  authority_granted: false,
  next_boundary: disposition === 'DENY'
    ? 'SEPARATE_AUTHORIZED_EXECUTION_MEMBRANE'
    : 'NO_EXTERNAL_EFFECT'
});

export function evaluateHelpRequest(request, { sourceProvided = false } = {}) {
  if (!request || request.schema_version !== HELP_SCHEMA ||
      typeof request.request_id !== 'string' || !request.request_id ||
      typeof request.action !== 'string') {
    return result('DENY', 'REQUEST_SCHEMA_INVALID', request);
  }
  if (typeof request.requester !== 'string' || !request.requester ||
      typeof request.subject !== 'string' || !request.subject) {
    return result('DENY', 'REQUEST_PRINCIPAL_OR_SUBJECT_MISSING', request);
  }

  const action = request.action.toUpperCase();
  if (HELP_ONLY.has(action)) return result('ALLOW_HELP_ONLY', 'NO_EXECUTABLE_CAPABILITY', request);
  if (PROPOSAL_ONLY.has(action)) return result('ALLOW_PROPOSAL_ONLY', 'PROPOSAL_IS_NOT_AUTHORIZATION', request);
  if (READ_ONLY.has(action)) {
    return sourceProvided && typeof request.input_ref === 'string' && request.input_ref.trim()
      ? result('ALLOW_READ_ONLY', 'EXPLICIT_SOURCE_SCOPE_ONLY', request)
      : result('DENY', 'READ_SCOPE_NOT_EXPLICIT', request);
  }
  if (DENIED_EFFECTS.has(action)) {
    return result('DENY', 'EFFECT_REQUIRES_SEPARATE_AUTHORITY_AND_EXECUTION_MEMBRANE', request);
  }
  return result('DENY', 'UNKNOWN_ACTION_DEFAULT_DENY', request);
}

export function makeHelpRequest({ requestId, requester, subject, action, inputRef = null }) {
  return Object.freeze({
    schema_version: 'OURSELF.HELPMOAT.REQUEST.v0.1',
    request_id: requestId,
    requester,
    subject,
    action,
    input_ref: inputRef
  });
}
