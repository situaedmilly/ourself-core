# OURSELF CLIENT DEPLOYER v1

## Purpose
A manifest-driven, fail-closed verifier for client website readiness. The initial version validates a client manifest and source file, probes local origin health/page and public HTTPS hosts, and writes a redacted JSON receipt. It does **not** mutate DNS, create Cloudflare tunnels, start/restart services, deploy a provider, read credentials, or claim persistence from a single successful request.

## Lifecycle
`DECLARE → VALIDATE → BUILD/START (operator-controlled) → VERIFY → RECORD → STOP`

- **Declare:** client-specific JSON manifest.
- **Validate:** schema identity, required fields, URL/hostname sanity, source file existence.
- **Verify:** `/health`, root page, and HTTPS apex/www (or explicit publicHosts).
- **Record:** SHA-256 of exact manifest bytes, per-check outcome, timestamp, and explicit non-mutation statements.
- **Stop:** the verifier itself exits; it leaves running services unchanged.

## RAWMAC canonical path
`/Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1/`

The direct RAWMAC installation mirrors `tools/client-deployer-v1.mjs`, `tools/client-deployer-v1.test.mjs`, this document, and a client manifest example. This is a local execution/custody surface; GitHub is version-control and CI evidence, not the runtime authority.

## Commands
```sh
cd /Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1
node client-deployer-v1.mjs preflight --manifest ./manifest.example.json
node client-deployer-v1.mjs verify --manifest ./manifest.example.json
node client-deployer-v1.mjs receipt --manifest ./manifest.example.json --receipt ./evidence/CLIENT-DEPLOYER-RECEIPT.json
node --test client-deployer-v1.test.mjs
```

Use an actual client manifest only after checking its current state. A receipt with status `PASS` means only the probes configured and run at that timestamp passed. A failed public check is a legitimate `BLOCKED`, not a reason to suppress the failure.

## Manifest fields
- `schema`: exact schema identifier.
- `client`, `domain`, `origin`: required.
- `sourcePath`: optional path relative to manifest directory.
- `healthPath` and `rootPath`: optional URL paths.
- `expectedHealthText`: optional substring required in health response.
- `www`: default true.
- `publicHosts`: optional explicit hostname list; if present, overrides domain/www defaults.

## Security boundaries
- Never place tokens, API keys, cookies, or credentials in manifests or receipts.
- DNS and tunnel changes are intentionally out of scope for v1 and must be separate admitted operations with rollback and read-back.
- Never treat declaration as authority, a proposal as admission, a receipt as effect, or an observed public page as proof of service persistence.
- GitHub Actions runs tests only; it does not access RAWMAC or deploy client sites.
