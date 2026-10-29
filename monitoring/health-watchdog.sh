#!/bin/sh
# Periodic liveness and public reachability evidence. Run by launchd every 60s.
set -u
LOG='/Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1/evidence/uptime-watchdog.jsonl'
LOCK='/tmp/ourself-spiritualgoddess-watchdog.lock'
[ -e "$LOCK" ] && exit 0
: > "$LOCK" || exit 0
trap 'rm -f "$LOCK"' EXIT INT TERM
now() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
body=$(curl -fsS --connect-timeout 2 --max-time 5 http://127.0.0.1:49330/health 2>/dev/null || true)
if printf '%s' "$body" | grep -q 'SERVICE_READY'; then
  printf '{"at":"%s","check":"origin_health","status":"PASS"}\n' "$(now)" >> "$LOG"
else
  printf '{"at":"%s","check":"origin_health","status":"FAIL","action":"kickstart_origin"}\n' "$(now)" >> "$LOG"
  /bin/launchctl kickstart -k system/online.spiritualguidancegoddess.site >> "$LOG" 2>&1 || true
fi
for host in spiritualgoddess.online www.spiritualgoddess.online; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 3 --max-time 8 "https://$host/" 2>/dev/null || true)
  if [ "$code" = 200 ]; then status=PASS; else status=FAIL; fi
  printf '{"at":"%s","check":"public_https","host":"%s","status":"%s","http_status":"%s"}\n' "$(now)" "$host" "$status" "$code" >> "$LOG"
done
# Bound local evidence log size; keep one previous generation.
if [ -f "$LOG" ] && [ "$(wc -c < "$LOG")" -gt 10485760 ]; then
  mv "$LOG" "$LOG.1"
  chmod 640 "$LOG.1"
fi
