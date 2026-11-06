# PIPE|PORTAL MAC ↔ SELFPI transport evidence

**Observation date:** 2026-11-06  
**Status:** TRANSPORT VERIFIED · PORTAL TRUST UNCONFIGURED · HOST ADMIN NOT ADMITTED  
**Scope:** Mac PipePortal runtime and its SELFPI cognition upstream only.

## Observed topology

- Mac: `ourselfmac.local`, LAN address observed as `10.0.0.230`.
- Pi: `ourselfpimac.local`, LAN address observed as `10.0.0.108`.
- PipePortal on Mac: `127.0.0.1:49320`, process PID `6056`.
- PipePortal health: `GET /healthz` returned HTTP 200 and `status=LIVE`.
- Pi Ollama: `127.0.0.1:11434` on SELFPI.
- Mac-side canonical SELFPI upstream: `127.0.0.1:11435`.

## Verified transport

The Pi initiates an authenticated SSH connection to the Mac using the existing Pi-side key `id_ed25519_ourself_raumac`. The SSH reverse forward is loopback-bound:

```sshconfig
RemoteForward 127.0.0.1:11435 127.0.0.1:11434
```

On the Pi, the persistent reconnect watchdog is:

```text
/home/selfadmin/.local/bin/pipeportal-mac-pi-tunnel.sh
```

It is registered in the Pi user's crontab at boot after a 35-second delay. The watchdog uses a lock to prevent duplicate instances and retries after disconnects.

Verified from the Mac through `127.0.0.1:11435`:
- `GET /api/tags` returned HTTP 200.
- `GET /v1/models` returned `ourmodelselfgenesis:latest` and `hf.co/ISTA-DASLab/Qwen3.8-27B-GSQ-RCO-GGUF:IQ2_S`.
- The listener was observed on Mac loopback, not a LAN interface.

The PipePortal server source already identifies SELFPI `127.0.0.1:11435` as its canonical upstream and RAWMAC `127.0.0.1:11434` as fallback.

## Explicit authority and security disposition

| Boundary | State |
|---|---|
| Independent PORTAL trust root | NOT CONFIGURED |
| INPUTSELFTRUSTSELF trust bundle | NOT VERIFIED |
| Host-admin pipe | NOT CONFIGURED |
| Direct Mac-to-Pi SSH on TCP 22 | FILTERED |
| Firewall changes | NONE |
| New keys or root identities generated | NONE |
| Raw SSH shell exposed as a PORTAL substitute | NO |

The Pi-to-Mac reverse SSH connection is a transport for the Pi Ollama HTTP API only. It is not a PORTAL admission envelope, a host-admin channel, or proof of independent authority.

PipePortal remains live, but governed routes remain fail-closed until independent root authority, signed trust bundle, identity/jurisdiction bindings, and host-admin preconditions are independently verified.

## Verification commands

```bash
# Mac: PipePortal liveness
curl -i http://127.0.0.1:49320/healthz

# Mac: SELFPI model inventory through the reverse tunnel
curl http://127.0.0.1:11435/v1/models

# Pi: inspect persistent tunnel process
ps -ef | grep '[s]sh -N pipeportal-mac-pi'
```

**Disposition:** MAC↔SELFPI cognition transport restored and boot reconnect configured. PORTAL trust and host administration remain explicitly unconfigured / unadmitted.


## REVERSELF configuration implementation and verification (2026-11-06)

Implemented on OURSELFMAC in `runtime/aetherbridge/`:

- `config/pipeportal-reverself-config.v1.json`: explicit six-fact reconciliation contract and run-change ledger.
- `portal-reverself-preflight.mjs`: live read-only verifier. It reads PipePortal `/healthz`, probes direct OURSELFMAC → OURSELFPIMAC TCP/22 independently of the reverse Ollama tunnel, and emits a six-fact JSON report.
- Report path from this run: `/tmp/portal-rever-self-preflight.json` (ephemeral verification output, not authority evidence).

Six facts observed independently:
1. Independent PORTAL root: **NOT_CONFIGURED**.
2. INPUTSELFTRUSTSELF bundle + authority lineage: **NOT_VERIFIED**.
3. mTLS host-admin pipe: **NOT_CONFIGURED** (reason: `PORTAL_TRUST_UNVERIFIED`).
4. Direct Mac → Pi TCP/22: **FILTERED_OR_UNREACHABLE** (connect timed out). This does not contradict the working reverse Ollama API tunnel.
5. Firewall policy: **NO_CHANGE_BY_THIS_RUN**.
6. New keys/root identities: **NONE_CREATED_BY_THIS_RUN**; no raw SSH shell tunnel created.

Verification:
- PipePortal health: `LIVE`, PID `6056`.
- Preflight correctly returned `FAIL_CLOSED_TRUST_OR_HOST_ADMIN_PRECONDITIONS_UNSATISFIED` and exit code `2`; this is the expected negative result while independent trust evidence is absent.
- Existing AetherBridge + host-admin tests: **45 passed, 0 failed**.
- JavaScript syntax check: passed.

No production trust values were fabricated. No launchd trust environment, service source, firewall, SSH policy, keys, or authority records were mutated. No default-branch update, PR, or merge was performed. Transport remains distinct from trust, admission, and host administration.
