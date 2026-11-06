# SELFTOSYS Pi Root Intake Deployment Receipt v0.1

**Observed:** 2026-11-06 23:37 UTC  
**Host:** OURSELFPIMAC  
**Device:** Raspberry Pi 5 Model B, Debian 13, aarch64  
**Deployment:** `/home/selfadmin/.local/share/ourself/selftosys-root-intake-v0.1`  
**Runtime:** Python 3.13.5  
**State:** RUNNING / LOOPBACK-ONLY / STATUS-ONLY

## Instantiated components

- HTTP intake process running as the existing `selfadmin` user.
- Health endpoint: `http://127.0.0.1:49372/health`
- Binding-state endpoint: `http://127.0.0.1:49372/v1/binding/state`
- Challenge gate: `POST http://127.0.0.1:49372/v1/challenges`
- Local process PID at verification: `52161`
- Listener observed at `127.0.0.1:49372`; no wildcard or LAN bind.
- Source, test, and service-unit artifacts are committed alongside this receipt.

## Verification evidence

1. Python unittest suite: **4 tests passed**.
2. Live health request: HTTP 200, `health=OK`, `authority=NONE`, `signing=DISABLED`.
3. Live binding-state request: `UNBOUND`, `NOT_ESTABLISHED`, `NOT_VERIFIED`, `BLOCKED`.
4. Live challenge request: HTTP 423 `ROOT_NOT_ADMITTED`; `challengeIssued=false`; `signatureProduced=false`.
5. Socket inspection: listener bound only to `127.0.0.1:49372`.
6. Process inspection: Python service process PID 52161 was active.

## Persistence limitation

A user-level systemd unit was staged at `~/.config/systemd/user/selftosys-root-intake.service`. Enabling it was not possible in the remote execution context because the user-scope D-Bus session environment was unavailable (`DBUS_SESSION_BUS_ADDRESS` and `XDG_RUNTIME_DIR` unset). The service is currently running as a detached process, not verified as reboot-persistent. No system-level service installation was attempted.

## Security boundary

This is a local intake control surface, not a root authority. It has no signing key, certificate, admitted trust anchor, external listener, mTLS configuration, challenge signer, or custody quorum. It cannot issue root proofs. It refuses non-loopback binding until a separate, evidence-backed admission and transport implementation exists.

## Disposition

**SOFTWARE INTAKE: INSTANTIATED AND LIVE.**  
**ROOT HARDWARE: UNBOUND.**  
**INDEPENDENT CUSTODY: UNBOUND.**  
**AUTHENTICATED ROOT TRANSPORT: NOT ESTABLISHED.**  
**LIVE ROOT CHALLENGE: NOT VERIFIED.**  
**PRODUCTION ROOT: NOT GENERATED.**

This receipt records a bounded deployment effect and must not be interpreted as root admission or sovereignty.
