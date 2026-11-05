import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { X509Certificate } from 'node:crypto';

const IDENTITY = Object.freeze({
  source: { name: 'OURSELFMAC', ref: 'HW-OURSELFMAC-001', uri: 'OURSELF:OURSELFMAC', hardwareUri: 'OURSELF:HW-OURSELFMAC-001' },
  target: { name: 'OURSELFPIMAC', ref: 'HW-OURSELFPIMAC-001', uri: 'OURSELF:OURSELFPIMAC', hardwareUri: 'OURSELF:HW-OURSELFPIMAC-001' }
});
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const normalizeFingerprint = value => String(value || '').replace(/:/g, '').toLowerCase();
const hasSan = (cert, uri) => String(cert.subjectAltName || '').split(/,\s*/).includes('URI:' + uri);

function readProtected(file, label, privateKey = false) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & (privateKey ? 0o077 : 0o022)) !== 0) {
    throw new Error('PIPE_PROTECTED_FILE_INVALID:' + label);
  }
  if (privateKey && typeof process.getuid === 'function' && stat.uid !== process.getuid()) {
    throw new Error('PIPE_PRIVATE_KEY_OWNER_INVALID');
  }
  return fs.readFileSync(file);
}

function validateEndpoint(endpoint) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      !['', '/'].includes(url.pathname) || url.port !== '49443') {
    throw new Error('PIPE_ENDPOINT_CONTRACT_INVALID');
  }
  if (url.hostname === 'localhost' || url.hostname === '0.0.0.0' ||
      url.hostname === '127.0.0.1' || url.hostname === '::1') {
    throw new Error('PIPE_ENDPOINT_MUST_BE_REMOTE_HOST');
  }
  if (net.isIP(url.hostname) === 4 && url.hostname.startsWith('127.')) {
    throw new Error('PIPE_ENDPOINT_MUST_BE_REMOTE_HOST');
  }
  return url;
}

function verifyLocalIdentity(portalConfig, clientKeyBytes, clientCertBytes, caBytes) {
  const rootPublicBytes = readProtected(portalConfig.rootPublicKeyFile, 'independent_root_public_key');
  const rootPublic = crypto.createPublicKey(rootPublicBytes);
  if (rootPublic.asymmetricKeyType !== 'ed25519') throw new Error('PIPE_ROOT_PUBLIC_KEY_ALGORITHM_INVALID');
  const rootCert = new X509Certificate(caBytes);
  const now = Date.now();
  if (!rootCert.ca || !rootCert.verify(rootCert.publicKey) || Date.parse(rootCert.validFrom) > now || Date.parse(rootCert.validTo) <= now) throw new Error('PIPE_ROOT_CERTIFICATE_INVALID');
  if (!hasSan(rootCert, 'OURSELF:' + portalConfig.certifierIdentityRef) || !hasSan(rootCert, 'OURSELF:' + portalConfig.certifierDeviceIdentityRef)) throw new Error('PIPE_CERTIFIER_ROOT_IDENTITY_SAN_INVALID');
  if (sha256(caBytes) !== portalConfig.rootCertificateSha256) throw new Error('PIPE_ROOT_CERTIFICATE_BUNDLE_DIGEST_MISMATCH');
  const rootDer = rootPublic.export({ type: 'spki', format: 'der' });
  const caDer = rootCert.publicKey.export({ type: 'spki', format: 'der' });
  if (!rootDer.equals(caDer)) throw new Error('PIPE_ROOT_PUBLIC_KEY_CERTIFICATE_MISMATCH');

  const clientCert = new X509Certificate(clientCertBytes);
  const clientKey = crypto.createPrivateKey(clientKeyBytes);
  if (clientKey.asymmetricKeyType !== 'ed25519') throw new Error('PIPE_CLIENT_PRIVATE_KEY_ALGORITHM_INVALID');
  const clientPublic = crypto.createPublicKey(clientKey);
  const certPublic = clientCert.publicKey.export({ type: 'spki', format: 'der' });
  const keyPublic = clientPublic.export({ type: 'spki', format: 'der' });
  if (!certPublic.equals(keyPublic)) throw new Error('PIPE_CLIENT_CERTIFICATE_PRIVATE_KEY_MISMATCH');
  if (clientCert.ca || clientCert.publicKey.asymmetricKeyType !== 'ed25519' || !clientCert.verify(rootCert.publicKey) || clientCert.issuer !== rootCert.subject) {
    throw new Error('PIPE_CLIENT_CERTIFICATE_CHAIN_INVALID');
  }
  if (!hasSan(clientCert, IDENTITY.source.uri) || !hasSan(clientCert, IDENTITY.source.hardwareUri)) {
    throw new Error('PIPE_CLIENT_CERTIFICATE_IDENTITY_INVALID');
  }
  if (normalizeFingerprint(clientCert.fingerprint256) !== normalizeFingerprint(portalConfig.expectedSourceCertificateSha256)) {
    throw new Error('PIPE_CLIENT_CERTIFICATE_BUNDLE_FINGERPRINT_MISMATCH');
  }
  if (Date.parse(clientCert.validFrom) > now || Date.parse(clientCert.validTo) <= now) {
    throw new Error('PIPE_CLIENT_CERTIFICATE_TIME_INVALID');
  }
  return { rootCert, clientCert };
}

function requestJson(url, options, timeoutMs, maxBytes) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined ? null : Buffer.from(JSON.stringify(options.body));
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      error ? reject(error) : resolve(result);
    };
    const req = https.request(url, {
      method: options.method,
      key: options.key,
      cert: options.cert,
      ca: options.ca,
      rejectUnauthorized: true,
      minVersion: tls.TLSv1_3,
      maxVersion: tls.TLSv1_3,
      servername: net.isIP(url.hostname) ? IDENTITY.target.name : url.hostname,
      checkServerIdentity: (_hostname, peerCert) => {
        try {
          const x509 = new X509Certificate(peerCert.raw);
          if (!x509.verify(options.rootPublicKey)) return new Error('PIPE_SERVER_CERTIFICATE_CHAIN_INVALID');
          if (!hasSan(x509, IDENTITY.target.uri) || !hasSan(x509, IDENTITY.target.hardwareUri)) {
            return new Error('PIPE_SERVER_CERTIFICATE_IDENTITY_INVALID');
          }
          if (normalizeFingerprint(x509.fingerprint256) !== normalizeFingerprint(options.expectedTargetFingerprint)) {
            return new Error('PIPE_SERVER_CERTIFICATE_FINGERPRINT_MISMATCH');
          }
          return undefined;
        } catch {
          return new Error('PIPE_SERVER_CERTIFICATE_VALIDATION_FAILED');
        }
      },
      headers: {
        accept: 'application/json',
        ...(body ? { 'content-type': 'application/json', 'content-length': body.length } : {})
      },
      agent: false
    }, response => {
      const chunks = [];
      let total = 0;
      response.on('data', chunk => {
        total += chunk.length;
        if (total > maxBytes) {
          req.destroy(new Error('PIPE_RESPONSE_TOO_LARGE'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          finish(null, { statusCode: response.statusCode || 502, payload: parsed });
        } catch {
          finish(new Error('PIPE_RESPONSE_INVALID_JSON'));
        }
      });
      response.on('error', error => finish(error));
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('PIPE_REQUEST_TIMEOUT')));
    req.on('error', error => finish(error));
    if (body) req.write(body);
    req.end();
  });
}

export function createPipeHostAdminClient({
  endpoint,
  portalConfig,
  clientKeyFile,
  clientCertificateFile,
  rootCaFile,
  timeoutMs = 12000,
  maxResponseBytes = 512 * 1024
}) {
  if (!portalConfig || portalConfig.bundleVerified !== true) throw new Error('PIPE_TRUST_BUNDLE_NOT_VERIFIED');
  const url = validateEndpoint(endpoint);
  if (!portalConfig.expectedSourceCertificateSha256 || !portalConfig.expectedTargetCertificateSha256 ||
      !portalConfig.rootCertificateSha256 || !portalConfig.rootPublicKeyFile) {
    throw new Error('PIPE_SIGNED_ENDPOINT_BINDINGS_MISSING');
  }
  const keyBytes = readProtected(clientKeyFile, 'primary_client_private_key', true);
  const certBytes = readProtected(clientCertificateFile, 'primary_client_certificate');
  const caBytes = readProtected(rootCaFile, 'independent_root_certificate');
  const { rootCert, clientCert } = verifyLocalIdentity(portalConfig, keyBytes, certBytes, caBytes);
  const rootPublicKey = crypto.createPublicKey(readProtected(portalConfig.rootPublicKeyFile, 'independent_root_public_key'));
  const endpointBase = new URL(url.origin);

  const dispatch = async ({ request, admission }) => {
    const response = await requestJson(new URL('/host-admin/v1/requests', endpointBase), {
      method: 'POST',
      key: keyBytes,
      cert: certBytes,
      ca: caBytes,
      rootPublicKey,
      expectedTargetFingerprint: portalConfig.expectedTargetCertificateSha256,
      body: { request, admission }
    }, timeoutMs, maxResponseBytes);
    return response;
  };

  return Object.freeze({
    configured: true,
    status: {
      configured: true,
      transport: 'TLS1.3_MTLS',
      endpoint_host: url.hostname,
      endpoint_port: Number(url.port),
      source_identity_ref: IDENTITY.source.ref,
      target_identity_ref: IDENTITY.target.ref,
      source_certificate_sha256: normalizeFingerprint(clientCert.fingerprint256),
      target_certificate_sha256: normalizeFingerprint(portalConfig.expectedTargetCertificateSha256),
      root_certificate_sha256: sha256(caBytes),
      private_key_export: false
    },
    dispatch
  });
}
