import crypto from 'node:crypto';
import fs from 'node:fs';
import {
  canonicalDecisionBytes,
  verifyRegistryIdentityBindings
} from './portal-adapter.v0.2.mjs';

const nonEmpty = value => typeof value === 'string' && value.trim().length > 0;
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

function readProtectedFile(file) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o022) !== 0) {
    throw new Error('PROTECTED_FILE_INVALID');
  }
  return fs.readFileSync(file);
}

function fileDigest(file) {
  return sha256(readProtectedFile(file));
}

export function verifyInputSelfTrustSelfBundle(bundle, rootConfig, options = {}) {
  const reasons = [];
  const nowMs = options.nowMs ?? Date.now();
  const maxBundleTtlMs = options.maxBundleTtlMs ?? 30 * 24 * 60 * 60 * 1000;

  if (!bundle || typeof bundle !== 'object' || !bundle.payload || typeof bundle.payload !== 'object') {
    return { valid: false, reasons: ['trust_bundle_shape_invalid'], resolvedConfig: null };
  }

  const payload = bundle.payload;
  const certifier = payload.certifier;
  const portalSigner = payload.portal_signer;
  const signature = bundle.signature;

  if (payload.schema_version !== 'ourself.inputselftrustself.bundle.v1') reasons.push('trust_bundle_schema_invalid');
  if (!nonEmpty(payload.bundle_id)) reasons.push('trust_bundle_id_missing');
  if (!nonEmpty(payload.authority_grant_ref)) reasons.push('trust_bundle_authority_grant_missing');
  if (!certifier || certifier.algorithm !== 'Ed25519') reasons.push('certifier_algorithm_invalid');
  if (!nonEmpty(rootConfig.rootKeyId) || certifier?.key_id !== rootConfig.rootKeyId) reasons.push('certifier_key_id_untrusted');
  if (!nonEmpty(rootConfig.rootSignerIdentityRef) || certifier?.identity_ref !== rootConfig.rootSignerIdentityRef) reasons.push('certifier_identity_untrusted');
  if (!/^[a-f0-9]{64}$/.test(certifier?.root_certificate_sha256 ?? '')) reasons.push('certifier_root_certificate_digest_invalid');

  const issuedAt = Date.parse(payload.issued_at ?? '');
  const expiresAt = Date.parse(payload.expires_at ?? '');
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) reasons.push('trust_bundle_time_invalid');
  else {
    if (issuedAt > nowMs + 30_000) reasons.push('trust_bundle_issued_in_future');
    if (expiresAt <= nowMs) reasons.push('trust_bundle_expired');
    if (expiresAt <= issuedAt || expiresAt - issuedAt > maxBundleTtlMs) reasons.push('trust_bundle_ttl_invalid');
  }

  let rootPublicKey;
  let portalPublicKey;
  try {
    rootPublicKey = crypto.createPublicKey(readProtectedFile(rootConfig.rootPublicKeyFile));
    if (rootPublicKey.asymmetricKeyType !== 'ed25519') throw new Error('ROOT_KEY_NOT_ED25519');
  } catch {
    reasons.push('independent_root_public_key_unavailable');
  }

  try {
    if (!portalSigner || portalSigner.algorithm !== 'Ed25519' || !nonEmpty(portalSigner.public_key_pem)) throw new Error('PORTAL_SIGNER_SHAPE_INVALID');
    portalPublicKey = crypto.createPublicKey(portalSigner.public_key_pem);
    if (portalPublicKey.asymmetricKeyType !== 'ed25519') throw new Error('PORTAL_KEY_NOT_ED25519');
    const fingerprint = sha256(portalPublicKey.export({ type: 'spki', format: 'der' }));
    if (portalSigner.key_id !== 'ed25519-sha256:' + fingerprint) reasons.push('portal_signer_key_id_not_derived_from_public_key');
  } catch {
    reasons.push('portal_signer_public_key_invalid');
  }

  if (rootPublicKey && portalPublicKey) {
    const rootFingerprint = sha256(rootPublicKey.export({ type: 'spki', format: 'der' }));
    const portalFingerprint = sha256(portalPublicKey.export({ type: 'spki', format: 'der' }));
    if (rootFingerprint === portalFingerprint) reasons.push('certifier_and_portal_signer_must_be_distinct');
  }

  let signatureBytes;
  try {
    if (signature?.encoding !== 'base64' || !nonEmpty(signature.value)) throw new Error('SIGNATURE_INVALID');
    signatureBytes = Buffer.from(signature.value, 'base64');
    if (signatureBytes.length !== 64 || signatureBytes.toString('base64') !== signature.value) throw new Error('SIGNATURE_INVALID');
  } catch {
    reasons.push('trust_bundle_signature_encoding_invalid');
  }

  if (rootPublicKey && signatureBytes) {
    try {
      if (!crypto.verify(null, canonicalDecisionBytes(payload), rootPublicKey, signatureBytes)) {
        reasons.push('trust_bundle_root_signature_invalid');
      }
    } catch {
      reasons.push('trust_bundle_root_signature_invalid');
    }
  }

  const requiredRegistryDigests = {
    hardware: rootConfig.hardwareRegistryFile,
    ecosystem_realities: rootConfig.ecosystemRealitiesFile,
    identity_bindings: rootConfig.identityBindingsFile,
    jurisdictions: rootConfig.jurisdictionRegistryFile
  };
  const suppliedDigests = payload.registry_sha256;
  if (!suppliedDigests || typeof suppliedDigests !== 'object') {
    reasons.push('trust_bundle_registry_digests_missing');
  } else {
    for (const [name, file] of Object.entries(requiredRegistryDigests)) {
      try {
        if (!nonEmpty(file) || suppliedDigests[name] !== fileDigest(file)) reasons.push('registry_digest_mismatch:' + name);
      } catch {
        reasons.push('registry_digest_unavailable:' + name);
      }
    }
  }

  if (!nonEmpty(payload.source_identity_ref)) reasons.push('source_identity_ref_missing');
  if (!nonEmpty(payload.target_identity_ref)) reasons.push('target_identity_ref_missing');
  const endpointCertificates = payload.endpoint_certificates;
  if (!endpointCertificates || typeof endpointCertificates !== 'object') reasons.push('endpoint_certificate_bindings_missing');
  else {
    for (const [name, identityRef] of [['source', payload.source_identity_ref], ['target', payload.target_identity_ref]]) {
      const item = endpointCertificates[name];
      if (!item || item.identity_ref !== identityRef || !/^[a-f0-9]{64}$/.test(item.sha256 ?? '')) reasons.push('endpoint_certificate_binding_invalid:' + name);
    }
    if (endpointCertificates.source?.sha256 === endpointCertificates.target?.sha256) reasons.push('endpoint_certificates_must_be_distinct');
  }
  if (payload.source_identity_ref === payload.target_identity_ref) reasons.push('source_target_identity_must_differ');
  if (!nonEmpty(portalSigner?.identity_ref)) reasons.push('portal_signer_identity_missing');
  if (nonEmpty(certifier?.identity_ref) && certifier.identity_ref === portalSigner?.identity_ref) reasons.push('certifier_and_portal_signer_identities_must_be_distinct');
  if ([payload.source_identity_ref, payload.target_identity_ref].includes(certifier?.identity_ref)) reasons.push('certifier_identity_must_be_distinct_from_endpoints');
  if ([payload.source_identity_ref, payload.target_identity_ref].includes(portalSigner?.identity_ref)) reasons.push('portal_signer_identity_must_be_distinct_from_endpoints');
  const allowedOperations = new Set([
    'host.admin.c10.witness.preflight', 'host.admin.c10.witness.identity.generate',
    'host.admin.c10.witness.csr.export', 'host.admin.c10.witness.certificate.install',
    'host.admin.c10.witness.service.install', 'host.admin.c10.witness.service.start',
    'host.admin.c10.witness.service.status', 'host.admin.c10.witness.subject.observe',
    'host.admin.c10.witness.evidence.export'
  ]);
  if (!Array.isArray(portalSigner?.allowed_capabilities) ||
      portalSigner.allowed_capabilities.length === 0 ||
      portalSigner.allowed_capabilities.some(value => !nonEmpty(value) || (value.startsWith('host.admin.') && !allowedOperations.has(value))) ||
      new Set(portalSigner.allowed_capabilities).size !== portalSigner.allowed_capabilities.length) {
    reasons.push('portal_signer_capability_scope_invalid');
  }

  const registryConfig = {
    hardwareRegistryFile: rootConfig.hardwareRegistryFile,
    ecosystemRealitiesFile: rootConfig.ecosystemRealitiesFile,
    identityBindingsFile: rootConfig.identityBindingsFile,
    jurisdictionRegistryFile: rootConfig.jurisdictionRegistryFile
  };
  if (nonEmpty(payload.source_identity_ref) && nonEmpty(payload.target_identity_ref)) {
    reasons.push(...verifyRegistryIdentityBindings({
      source_identity_ref: payload.source_identity_ref,
      target_identity_ref: payload.target_identity_ref
    }, registryConfig, certifier.identity_ref));
  }

  if (reasons.length) return { valid: false, reasons: [...new Set(reasons)], resolvedConfig: null };

  return {
    valid: true,
    reasons: [],
    resolvedConfig: {
      publicKeyPem: portalSigner.public_key_pem,
      trustedKeyId: portalSigner.key_id,
      trustedSignerIdentityRef: portalSigner.identity_ref,
      expectedSourceIdentityRef: payload.source_identity_ref,
      expectedTargetIdentityRef: payload.target_identity_ref,
      authorityGrantRef: payload.authority_grant_ref,
      allowedSignerCapabilities: portalSigner.allowed_capabilities,
      bundleId: payload.bundle_id,
      bundleDigest: sha256(canonicalDecisionBytes(payload)),
      certifierKeyId: certifier.key_id,
      certifierIdentityRef: certifier.identity_ref,
      rootCertificateSha256: certifier.root_certificate_sha256,
      expectedSourceCertificateSha256: endpointCertificates.source.sha256,
      expectedTargetCertificateSha256: endpointCertificates.target.sha256,
      bundleVerified: true,
      bootstrapReasons: []
    }
  };
}