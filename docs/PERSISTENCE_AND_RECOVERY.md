# Persistence and Recovery Gate — Spiritual Goddess reference

## Goal and limits
This reference deployment moves the origin and named Cloudflare Tunnel from user-session LaunchAgents into system LaunchDaemons, adds a 60-second health watchdog, and configures macOS not to sleep on AC power and to request automatic restart after power loss. It cannot guarantee uninterrupted uptime: power, ISP, hardware, DNS/provider incidents, and Cloudflare outages remain external failure modes. High availability requires an independent origin/hosting fallback.

## Current target
- Origin: `/Users/millysituated/OURSELF/clients/spiritualgoddess/server.mjs`, port 49330.
- Named tunnel: `spiritualgoddess-web`, UUID `357350bc-8c63-4b7a-b02f-aa2ea7f4549b`.
- Ingress: apex and www map to `http://127.0.0.1:49330`.
- RAWMAC deployer: `/Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1/`.

## Install
The reference installer is client-specific; do not run it unchanged for another client. It needs an administrator authorization prompt because it writes `/Library/LaunchDaemons` and changes power settings.

```sh
/bin/osascript -e 'do shell script "/bin/bash /Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1/deployment/install-persistent-services.sh" with administrator privileges'
```

The installer validates required files, writes three system launchd jobs, preserves copies of the old LaunchAgents for rollback, starts the origin/tunnel/watchdog, and requests `pmset -c sleep 0` and `pmset -a autorestart 1`. It does not print tunnel tokens.

## Acceptance gates
1. `plutil -lint` passes for all three system plist files.
2. `launchctl print system/online.spiritualguidancegoddess.site` shows running state and PID.
3. `launchctl print system/com.ourself.spiritualgoddess-web-tunnel` shows running state and PID.
4. `launchctl print system/com.ourself.client-deployer-watchdog` shows loaded job.
5. Local `/health`, local page, apex HTTPS, and www HTTPS all return expected 200 responses.
6. Kill/restart test: origin and tunnel jobs recover and public page returns 200.
7. Reboot test: after a controlled reboot, all three system jobs load before user login and public HTTPS returns 200. Until this is tested, reboot recovery remains UNVERIFIED.
8. Leave the Mac on reliable AC power, configure router/ISP stability, and test recovery after network interruption.

## Monitoring semantics
The watchdog logs local health and both public HTTPS probes to `evidence/uptime-watchdog.jsonl`. It kicks the origin job if local health fails. Public HTTPS failures are recorded but not automatically treated as origin failures. launchd KeepAlive supervises origin/tunnel process exits.

## Rollback
The previous LaunchAgent definitions are copied to `rollback/launchagents/`. To rollback, boot out the system jobs, remove their LaunchDaemons with administrator privileges, restore the saved LaunchAgents to `~/Library/LaunchAgents`, then bootstrap them in `gui/501`. Restore the previous power settings manually from the pre-change receipt if needed; record them before modifying power settings.

## Security
The installer references the existing credentials file by path; it never copies credential contents into a plist or receipt. Do not use `cloudflared tunnel run --token <secret>` in command lines. Existing unrelated Cloudflare jobs must be identified before changing them.
