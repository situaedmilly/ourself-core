import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const IDENTITY_MOAT_SCHEMA = 'OURSELF.IDENTITYMOAT.v0.1';
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const sort = value => Array.isArray(value) ? value.map(sort)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]))
    : value;
export const canonicalJson = value => JSON.stringify(sort(value));

function validateIdentity(identity) {
  if (identity?.schema_version !== IDENTITY_MOAT_SCHEMA || identity.state !== 'ENROLLED') {
    return 'IDENTITY_NOT_ENROLLED';
  }
  try {
    const key = crypto.createPublicKey(identity.public_key_spki_pem);
    if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') {
      return 'IDENTITY_KEY_MUST_BE_P256';
    }
    const fingerprint = sha256(key.export({ type: 'spki', format: 'der' }));
    if (fingerprint !== identity.public_key_sha256 ||
        identity.identity_id !== 'OURSELF-FOUNDER-' + fingerprint.slice(0, 20)) {
      return 'IDENTITY_PUBLIC_KEY_BINDING_MISMATCH';
    }
  } catch {
    return 'IDENTITY_PUBLIC_KEY_INVALID';
  }
  return null;
}

function verifySignature(identity, challenge, signatureBase64) {
  try {
    const signature = Buffer.from(signatureBase64, 'base64');
    return signature.length > 0 &&
      signature.toString('base64').replace(/=+$/, '') === signatureBase64.replace(/=+$/, '') &&
      crypto.verify('sha256', Buffer.from(canonicalJson(challenge)),
        identity.public_key_spki_pem, signature);
  } catch {
    return false;
  }
}

function validateChallenge({ identity, challenge, now }) {
  if (!challenge || challenge.identity_id !== identity.identity_id ||
      challenge.schema_version !== 'OURSELF.IDENTITY_CHALLENGE.v0.1') return 'CHALLENGE_IDENTITY_MISMATCH';
  const issued = Date.parse(challenge.issued_at);
  const expires = Date.parse(challenge.expires_at);
  const current = new Date(now).getTime();
  if (!Number.isFinite(issued) || !Number.isFinite(expires) ||
      issued > current || expires <= current) return 'CHALLENGE_EXPIRED_OR_NOT_YET_VALID';
  return null;
}

function makeChallenge(identity, { audience, scope, now = new Date(), ttlMs = 90_000 } = {}) {
  if (typeof audience !== 'string' || !audience.trim() ||
      typeof scope !== 'string' || !scope.trim() ||
      !Number.isFinite(ttlMs) || ttlMs < 1 || ttlMs > 300_000) {
    throw new TypeError('CHALLENGE_SCOPE_AUDIENCE_AND_TTL_REQUIRED');
  }
  const issuedAt = new Date(now).toISOString();
  return Object.freeze({
    schema_version: 'OURSELF.IDENTITY_CHALLENGE.v0.1',
    challenge_id: crypto.randomUUID(),
    identity_id: identity.identity_id,
    audience,
    scope,
    nonce: crypto.randomBytes(32).toString('base64url'),
    issued_at: issuedAt,
    expires_at: new Date(new Date(now).getTime() + ttlMs).toISOString()
  });
}

function verifiedResult(identity, challenge) {
  return {
    verified: true,
    disposition: 'IDENTITY_KEY_POSSESSION_VERIFIED',
    identity_id: identity.identity_id,
    principal_id: identity.principal_id,
    audience: challenge.audience,
    scope: challenge.scope,
    authenticator: identity.authenticator.class,
    authority: false,
    assurance_limit: 'LOCAL_KEY_POSSESSION_AND_AUTHENTICATOR_POLICY_ONLY'
  };
}

export function createIdentityRecord({
  principalId, publicKeySpkiPem, authenticator = 'MACOS_SECURE_ENCLAVE_BIOMETRY',
  createdAt = new Date().toISOString()
}) {
  if (typeof principalId !== 'string' || !principalId.trim()) throw new TypeError('PRINCIPAL_ID_REQUIRED');
  if (typeof publicKeySpkiPem !== 'string' || !publicKeySpkiPem.includes('BEGIN PUBLIC KEY')) {
    throw new TypeError('PUBLIC_KEY_SPKI_PEM_REQUIRED');
  }
  const key = crypto.createPublicKey(publicKeySpkiPem);
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') {
    throw new TypeError('IDENTITY_KEY_MUST_BE_P256');
  }
  const der = key.export({ type: 'spki', format: 'der' });
  const fingerprint = sha256(der);
  return Object.freeze({
    schema_version: IDENTITY_MOAT_SCHEMA,
    identity_id: 'OURSELF-FOUNDER-' + fingerprint.slice(0, 20),
    principal_id: principalId,
    key_algorithm: 'ECDSA_P256_SHA256',
    public_key_spki_pem: publicKeySpkiPem,
    public_key_sha256: fingerprint,
    authenticator: {
      class: authenticator,
      hardware_backed: authenticator === 'MACOS_SECURE_ENCLAVE_BIOMETRY',
      user_presence_required: true,
      private_key_exportable: false
    },
    state: 'ENROLLED',
    identity_attestation: 'UNVERIFIED',
    authority: false,
    created_at: createdAt
  });
}

export class IdentityChallengeRegistry {
  #issued = new Map();
  #consumed = new Set();

  issue(identity, options = {}) {
    const invalid = validateIdentity(identity);
    if (invalid) throw new Error(invalid);
    const challenge = makeChallenge(identity, options);
    this.#issued.set(challenge.challenge_id, canonicalJson(challenge));
    return challenge;
  }

  verify({ identity, challenge, signatureBase64, now = new Date() } = {}) {
    const deny = reason => ({ verified: false, disposition: 'DENY', reason, authority: false });
    const invalid = validateIdentity(identity);
    if (invalid) return deny(invalid);
    if (!challenge || this.#issued.get(challenge.challenge_id) !== canonicalJson(challenge)) {
      return deny('CHALLENGE_NOT_ISSUED_BY_THIS_RUNTIME');
    }
    if (this.#consumed.has(challenge.challenge_id)) return deny('CHALLENGE_REPLAYED');
    const invalidChallenge = validateChallenge({ identity, challenge, now });
    if (invalidChallenge) return deny(invalidChallenge);
    if (typeof signatureBase64 !== 'string' || !signatureBase64) return deny('SIGNATURE_MISSING');
    if (!verifySignature(identity, challenge, signatureBase64)) return deny('SIGNATURE_INVALID');
    this.#consumed.add(challenge.challenge_id);
    return verifiedResult(identity, challenge);
  }
}

/*
 * Durable variant for a long-lived local runtime. The challenge file survives
 * process restarts; an atomic lock directory serializes verifiers; consumed
 * markers persist replay rejection. A stale lock fails closed and requires
 * operator review rather than silently reopening a challenge.
 */
export class PersistentIdentityChallengeRegistry {
  constructor({ directory }) {
    if (typeof directory !== 'string' || !directory) throw new TypeError('CHALLENGE_DIRECTORY_REQUIRED');
    this.directory = path.resolve(directory);
    fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const directoryStat = fs.lstatSync(this.directory);
    if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink() ||
        (directoryStat.mode & 0o077) !== 0 ||
        (typeof process.getuid === 'function' && directoryStat.uid !== process.getuid())) {
      throw new Error('CHALLENGE_DIRECTORY_MUST_BE_PRIVATE_LOCAL_DIRECTORY');
    }
  }

  #file(id, suffix) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('CHALLENGE_ID_INVALID');
    return path.join(this.directory, id + suffix);
  }

  issue(identity, options = {}) {
    const invalid = validateIdentity(identity);
    if (invalid) throw new Error(invalid);
    const challenge = makeChallenge(identity, options);
    const file = this.#file(challenge.challenge_id, '.json');
    fs.writeFileSync(file, canonicalJson(challenge), { flag: 'wx', mode: 0o600 });
    return challenge;
  }

  verify({ identity, challenge, signatureBase64, now = new Date() } = {}) {
    const deny = reason => ({ verified: false, disposition: 'DENY', reason, authority: false });
    const invalid = validateIdentity(identity);
    if (invalid) return deny(invalid);
    if (!challenge?.challenge_id) return deny('CHALLENGE_NOT_ISSUED_BY_THIS_RUNTIME');
    let file;
    try { file = this.#file(challenge.challenge_id, '.json'); }
    catch { return deny('CHALLENGE_ID_INVALID'); }
    const consumed = this.#file(challenge.challenge_id, '.consumed');
    const lock = this.#file(challenge.challenge_id, '.lock');
    if (fs.existsSync(consumed)) return deny('CHALLENGE_REPLAYED');
    try { fs.mkdirSync(lock, { mode: 0o700 }); }
    catch { return deny('CHALLENGE_REPLAYED_OR_VERIFICATION_IN_PROGRESS'); }
    try {
      if (!fs.existsSync(file)) return deny('CHALLENGE_NOT_ISSUED_BY_THIS_RUNTIME');
      const fileStat = fs.lstatSync(file);
      if (!fileStat.isFile() || fileStat.isSymbolicLink() || (fileStat.mode & 0o077) !== 0) {
        return deny('CHALLENGE_STORAGE_ENTRY_INVALID');
      }
      const stored = fs.readFileSync(file, 'utf8');
      if (stored !== canonicalJson(challenge)) return deny('CHALLENGE_NOT_ISSUED_BY_THIS_RUNTIME');
      const invalidChallenge = validateChallenge({ identity, challenge, now });
      if (invalidChallenge) return deny(invalidChallenge);
      if (typeof signatureBase64 !== 'string' || !signatureBase64) return deny('SIGNATURE_MISSING');
      if (!verifySignature(identity, challenge, signatureBase64)) return deny('SIGNATURE_INVALID');
      fs.writeFileSync(consumed, JSON.stringify({
        challenge_id: challenge.challenge_id,
        consumed_at: new Date(now).toISOString()
      }), { flag: 'wx', mode: 0o600 });
      fs.unlinkSync(file);
      return verifiedResult(identity, challenge);
    } finally {
      fs.rmdirSync(lock);
    }
  }
}
