import crypto from 'node:crypto';
import fs from 'node:fs';

export const PORTAL_ADAPTER_VERSION = 'ourself.pipe-portal-runtime-adapter.v0.2';

const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
};

export const canonicalDecisionBytes = decision =>
  Buffer.from(JSON.stringify(canonicalize(decision)), 'utf8');

const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;

export function portalTrustStatus(config = {}) {
  const missing = [];
  for (const [key, value] of [
    ['public_key_pem_or_file', config.publicKeyPem || config.publicKeyFile],
    ['trusted_key_id', config.trustedKeyId],
    ['trusted_signer_identity_ref', config.trustedSignerIdentityRef],
    ['expected_source_identity_ref', config.expectedSourceIdentityRef],
    ['expected_target_identity_ref', config.expectedTargetIdentityRef],
    ['hardware_registry_file', config.hardwareRegistryFile],
    ['ecosystem_realities_file', config.ecosystemRealitiesFile],
    ['identity_bindings_file', config.identityBindingsFile],
    ['jurisdiction_registry_file', config.jurisdictionRegistryFile],
    ['revocations_file', config.revocationsFile]
  ]) if (!nonEmpty(value)) missing.push(key);

  const protectedFiles = [
    ['public_key_file', config.publicKeyFile],
    ['hardware_registry_file', config.hardwareRegistryFile],
    ['ecosystem_realities_file', config.ecosystemRealitiesFile],
    ['identity_bindings_file', config.identityBindingsFile],
    ['jurisdiction_registry_file', config.jurisdictionRegistryFile],
    ['revocations_file', config.revocationsFile]
  ];
  for (const [label, file] of protectedFiles) {
    if (!nonEmpty(file)) continue;
    let valid = false;
    try {
      const stat = fs.lstatSync(file);
      valid = stat.isFile() && !stat.isSymbolicLink() && (stat.mode & 0o022) === 0;
    } catch {}
    if (!valid) missing.push(label + '_missing_or_permissions_invalid');
  }
  if (nonEmpty(config.publicKeyPem)) {
    try {
      if (crypto.createPublicKey(config.publicKeyPem).asymmetricKeyType !== 'ed25519') missing.push('public_key_algorithm_invalid');
    } catch { missing.push('public_key_pem_invalid'); }
  }
  if (config.bundleVerified !== true) {
    missing.push('inputselftrustself_bundle_unverified');
    if (!nonEmpty(config.rootPublicKeyFile)) missing.push('independent_root_public_key_file');
    if (!nonEmpty(config.rootKeyId)) missing.push('independent_root_key_id');
    if (!nonEmpty(config.rootSignerIdentityRef)) missing.push('independent_root_signer_identity_ref');
    if (!nonEmpty(config.trustBundleFile)) missing.push('inputselftrustself_bundle_file');
  }
  for (const reason of Array.isArray(config.bootstrapReasons) ? config.bootstrapReasons : []) missing.push('trust_bundle:' + reason);

  return {
    configured: missing.length === 0,
    missing,
    inputselftrustself: {
      verified: config.bundleVerified === true,
      bundle_id: config.bundleId ?? null,
      bundle_digest: config.bundleDigest ?? null,
      certifier_key_id: config.certifierKeyId ?? null,
      certifier_identity_ref: config.certifierIdentityRef ?? null
    },
    adapter_version: PORTAL_ADAPTER_VERSION,
    scope: 'PORTAL_GATED_ROUTES_ONLY'
  };
}

const VERIFIED_STATES = new Set(['IDENTITY_VERIFIED', 'BOUND', 'MOATED', 'OPERATIONAL', 'PROVEN']);
const VERIFIED_AUTHORITY_STATES = new Set(['VERIFIED', 'IDENTITY_VERIFIED', 'BOUND', 'MOATED', 'OPERATIONAL', 'PROVEN']);

function readRegistry(file, expectedSchema, collectionKey) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o022) !== 0) throw new Error('REGISTRY_FILE_INVALID');
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (value?.schema !== expectedSchema || !Array.isArray(value?.[collectionKey])) throw new Error('REGISTRY_SCHEMA_INVALID');
  return value[collectionKey];
}

export function verifyRegistryIdentityBindings(decision, config = {}, expectedCertifierIdentityRef = null) {
  const reasons = [];
  let hardware, realities, bindings, jurisdictions;
  try {
    hardware = readRegistry(config.hardwareRegistryFile, 'ourself.hardware.instances.v0.1', 'physical_substrates');
    realities = readRegistry(config.ecosystemRealitiesFile, 'ourself.hardware.ecosystem-realities.v0.1', 'realities');
    bindings = readRegistry(config.identityBindingsFile, 'ourself.hardware.identity-bindings.v0.1', 'bindings');
    jurisdictions = readRegistry(config.jurisdictionRegistryFile, 'ourself.hardware.jurisdictions.v0.1', 'jurisdictions');
  } catch {
    return ['identity_or_jurisdiction_registry_unavailable'];
  }

  const resolve = (identityRef, label) => {
    const substrate = hardware.find(item => item.instance_id === identityRef);
    if (substrate) {
      if (!VERIFIED_STATES.has(substrate.identity_status)) reasons.push(label + '_identity_registry_not_verified');
      if (!nonEmpty(substrate.identity_attestation_ref) ||
          !nonEmpty(substrate.identity_verification_method) ||
          !Array.isArray(substrate.evidence_refs) || substrate.evidence_refs.length === 0) {
        reasons.push(label + '_independent_identity_attestation_missing');
      }
      return { jurisdictionSubjects: [substrate.instance_id] };
    }

    const reality = realities.find(item => item.reality_id === identityRef);
    if (!reality) {
      reasons.push(label + '_identity_not_in_registry');
      return { jurisdictionSubjects: [] };
    }
    if (!VERIFIED_STATES.has(reality.status)) reasons.push(label + '_reality_registry_not_verified');
    if (!nonEmpty(reality.substrate_id)) {
      reasons.push(label + '_reality_not_bound_to_substrate');
      return { jurisdictionSubjects: [reality.reality_id] };
    }
    const boundSubstrate = hardware.find(item => item.instance_id === reality.substrate_id);
    if (!boundSubstrate || !VERIFIED_STATES.has(boundSubstrate.identity_status)) {
      reasons.push(label + '_bound_substrate_not_identity_verified');
    } else if (!nonEmpty(boundSubstrate.identity_attestation_ref) ||
               !nonEmpty(boundSubstrate.identity_verification_method) ||
               !Array.isArray(boundSubstrate.evidence_refs) || boundSubstrate.evidence_refs.length === 0) {
      reasons.push(label + '_bound_substrate_attestation_missing');
    }
    const binding = bindings.find(item =>
      item.subject_id === reality.reality_id &&
      item.object_id === reality.substrate_id &&
      ['REALIZED_ON', 'REALIZATION_PATH', 'BOUND_TO'].includes(item.relation) &&
      VERIFIED_STATES.has(item.status) &&
      Array.isArray(item.evidence_refs) && item.evidence_refs.length > 0 &&
      nonEmpty(item.verification_method) && nonEmpty(item.attestation_ref)
    );
    if (!binding) reasons.push(label + '_identity_binding_not_independently_verified');
    return { jurisdictionSubjects: [reality.reality_id, reality.substrate_id] };
  };

  for (const [label, identityRef] of [
    ['source', decision.source_identity_ref],
    ['target', decision.target_identity_ref]
  ]) {
    const resolved = resolve(identityRef, label);
    const jurisdiction = jurisdictions.find(item => resolved.jurisdictionSubjects.includes(item.subject_id));
    if (!jurisdiction) reasons.push(label + '_jurisdiction_missing');
    else {
      if (!VERIFIED_AUTHORITY_STATES.has(jurisdiction.authority_status)) reasons.push(label + '_jurisdiction_not_verified');
      if (!nonEmpty(jurisdiction.verification_method) ||
          !nonEmpty(jurisdiction.certifier_identity_ref) ||
          !Array.isArray(jurisdiction.evidence_refs) || jurisdiction.evidence_refs.length === 0) {
        reasons.push(label + '_jurisdiction_certification_evidence_missing');
      } else if (expectedCertifierIdentityRef && jurisdiction.certifier_identity_ref !== expectedCertifierIdentityRef) {
        reasons.push(label + '_jurisdiction_certifier_identity_mismatch');
      }
    }
  }

  return [...new Set(reasons)];
}

export function verifyPortalAdmissionEnvelope(envelope, config = {}, options = {}) {
  const reasons = [];
  if (config.bundleVerified !== true) reasons.push('inputselftrustself_bundle_unverified');
  const nowMs = options.nowMs ?? Date.now();
  const maxTtlMs = options.maxTtlMs ?? 15 * 60 * 1000;
  const futureSkewMs = options.futureSkewMs ?? 30 * 1000;

  if (!envelope || typeof envelope !== 'object') {
    return { allowed: false, reasons: [...new Set([...reasons, 'admission_envelope_missing'])], decisionId: null, decisionDigest: null };
  }

  const decision = envelope.decision;
  const signer = envelope.signer;
  const signature = envelope.signature;
  if (!decision || typeof decision !== 'object') reasons.push('decision_missing');
  if (!signer || typeof signer !== 'object') reasons.push('signer_missing');
  if (!signature || typeof signature !== 'object') reasons.push('signature_missing');

  if (reasons.length) return { allowed: false, reasons, decisionId: null, decisionDigest: null };

  const decisionId = decision.decision_id ?? null;
  let decisionDigest = null;
  try { decisionDigest = crypto.createHash('sha256').update(canonicalDecisionBytes(decision)).digest('hex'); }
  catch { reasons.push('decision_not_canonicalizable'); }

  const requiredDecisionFields = [
    'decision_id', 'source_identity_ref', 'target_identity_ref', 'decision',
    'admitted_capabilities', 'policy_version', 'issued_at', 'expires_at', 'evidence_refs'
  ];
  for (const field of requiredDecisionFields) {
    if (!(field in decision)) reasons.push('decision_field_missing:' + field);
  }
  const allowedDecisionFields = new Set([
    ...requiredDecisionFields, 'authority_grant_ref'
  ]);
  for (const field of Object.keys(decision)) {
    if (!allowedDecisionFields.has(field)) reasons.push('decision_field_unrecognized:' + field);
  }

  if (!nonEmpty(decision.decision_id)) reasons.push('decision_id_invalid');
  if (decision.decision !== 'ADMIT') reasons.push('decision_not_admit');
  if (!nonEmpty(decision.source_identity_ref) || decision.source_identity_ref !== config.expectedSourceIdentityRef) reasons.push('source_identity_mismatch');
  if (!nonEmpty(decision.target_identity_ref) || decision.target_identity_ref !== config.expectedTargetIdentityRef) reasons.push('target_identity_mismatch');
  reasons.push(...verifyRegistryIdentityBindings(decision, config));
  if (!Array.isArray(decision.admitted_capabilities) || decision.admitted_capabilities.some(x => !nonEmpty(x)) || new Set(decision.admitted_capabilities).size !== decision.admitted_capabilities.length) reasons.push('admitted_capabilities_invalid');
  if (Array.isArray(decision.admitted_capabilities) && !decision.admitted_capabilities.includes(options.requiredCapability)) reasons.push('required_capability_not_admitted');
  if (!nonEmpty(decision.policy_version)) reasons.push('policy_version_invalid');
  if (!nonEmpty(decision.authority_grant_ref)) reasons.push('authority_grant_missing');
  if (nonEmpty(config.authorityGrantRef) && decision.authority_grant_ref !== config.authorityGrantRef) reasons.push('authority_grant_mismatch');
  if (Array.isArray(config.allowedSignerCapabilities) && !config.allowedSignerCapabilities.includes(options.requiredCapability)) reasons.push('signer_not_authorized_for_capability');
  if (!Array.isArray(decision.evidence_refs) || decision.evidence_refs.length === 0 || decision.evidence_refs.some(x => !nonEmpty(x))) reasons.push('evidence_refs_missing');

  const issuedAt = Date.parse(decision.issued_at ?? '');
  const expiresAt = Date.parse(decision.expires_at ?? '');
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) reasons.push('decision_time_invalid');
  else {
    if (issuedAt > nowMs + futureSkewMs) reasons.push('decision_issued_in_future');
    if (expiresAt <= nowMs) reasons.push('decision_expired');
    if (expiresAt <= issuedAt || expiresAt - issuedAt > maxTtlMs) reasons.push('decision_ttl_invalid');
  }

  if (signer.algorithm !== 'Ed25519') reasons.push('signer_algorithm_not_ed25519');
  if (!nonEmpty(config.trustedKeyId) || signer.key_id !== config.trustedKeyId) reasons.push('signer_key_id_untrusted');
  if (!nonEmpty(config.trustedSignerIdentityRef) || signer.identity_ref !== config.trustedSignerIdentityRef) reasons.push('signer_identity_untrusted');

  let publicKey;
  try {
    if (nonEmpty(config.publicKeyPem)) {
      publicKey = crypto.createPublicKey(config.publicKeyPem);
    } else {
      if (!nonEmpty(config.publicKeyFile)) throw new Error('PUBLIC_KEY_PATH_UNCONFIGURED');
      const stat = fs.lstatSync(config.publicKeyFile);
      if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o022) !== 0) throw new Error('PUBLIC_KEY_FILE_PERMISSIONS_INVALID');
      publicKey = crypto.createPublicKey(fs.readFileSync(config.publicKeyFile));
    }
    if (publicKey.asymmetricKeyType !== 'ed25519') throw new Error('PUBLIC_KEY_ALGORITHM_INVALID');
  } catch (error) {
    reasons.push(error.message === 'PUBLIC_KEY_FILE_PERMISSIONS_INVALID' ? 'public_key_file_permissions_invalid' : 'trusted_public_key_unavailable');
  }

  let signatureBytes;
  try {
    if (signature.encoding !== 'base64' || !nonEmpty(signature.value)) throw new Error('SIGNATURE_ENCODING_INVALID');
    signatureBytes = Buffer.from(signature.value, 'base64');
    if (signatureBytes.length !== 64 || signatureBytes.toString('base64') !== signature.value) throw new Error('SIGNATURE_BYTES_INVALID');
  } catch (error) {
    reasons.push(error.message === 'SIGNATURE_ENCODING_INVALID' ? 'signature_encoding_invalid' : 'signature_bytes_invalid');
  }

  if (publicKey && signatureBytes && decisionDigest) {
    try {
      if (!crypto.verify(null, canonicalDecisionBytes(decision), publicKey, signatureBytes)) reasons.push('signature_verification_failed');
    } catch { reasons.push('signature_verification_failed'); }
  }

  try {
    if (!nonEmpty(config.revocationsFile)) throw new Error('REVOCATIONS_PATH_UNCONFIGURED');
    const stat = fs.lstatSync(config.revocationsFile);
    if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o022) !== 0) throw new Error('REVOCATIONS_FILE_INVALID');
    const ledger = JSON.parse(fs.readFileSync(config.revocationsFile, 'utf8'));
    if (!ledger || ledger.schema_version !== 'ourself.portal-revocations.v1' || !Array.isArray(ledger.revoked_decision_ids)) throw new Error('REVOCATIONS_LEDGER_INVALID');
    if (ledger.revoked_decision_ids.includes(decisionId)) reasons.push('decision_revoked');
  } catch {
    reasons.push('revocation_state_unavailable');
  }

  return {
    allowed: reasons.length === 0,
    reasons: [...new Set(reasons)],
    decisionId,
    decisionDigest,
    sourceIdentityRef: decision.source_identity_ref ?? null,
    targetIdentityRef: decision.target_identity_ref ?? null,
    admittedCapabilities: Array.isArray(decision.admitted_capabilities) ? decision.admitted_capabilities : [],
    expiresAt: decision.expires_at ?? null,
    signerKeyId: signer.key_id ?? null
  };
}

export function decodePortalAdmissionHeader(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 16384) return null;
  try {
    const bytes = Buffer.from(value, 'base64url');
    if (bytes.length === 0 || bytes.toString('base64url') !== value) return null;
    return JSON.parse(bytes.toString('utf8'));
  } catch { return null; }
}