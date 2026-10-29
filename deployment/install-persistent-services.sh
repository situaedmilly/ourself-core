#!/bin/bash
# Spiritual Goddess reference deployment: installs boot-level launchd services.
# Requires administrator authorization; never prints or embeds tunnel credentials.
set -euo pipefail
BASE='/Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1'
USER_NAME='millysituated'
GROUP_NAME='staff'
NODE='/Users/millysituated/.nvm/versions/node/v22.17.1/bin/node'
SITE='/Users/millysituated/OURSELF/clients/spiritualgoddess/server.mjs'
TUNNEL='/Users/millysituated/.cloudflared/spiritualgoddess-web.yml'
CF='/opt/homebrew/bin/cloudflared'
WATCHDOG="$BASE/monitoring/health-watchdog.sh"
DAEMONS='/Library/LaunchDaemons'
LOGDIR="$BASE/evidence"
mkdir -p "$LOGDIR"
[ -x "$NODE" ] || { echo "BLOCKED: Node executable missing"; exit 2; }
[ -f "$SITE" ] || { echo "BLOCKED: site server missing"; exit 2; }
[ -x "$CF" ] || { echo "BLOCKED: cloudflared missing"; exit 2; }
[ -f "$TUNNEL" ] || { echo "BLOCKED: named tunnel config missing"; exit 2; }
[ -f '/Users/millysituated/.cloudflared/357350bc-8c63-4b7a-b02f-aa2ea7f4549b.json' ] || { echo 'BLOCKED: named tunnel credentials file missing'; exit 2; }
write_service() {
  local path="$1" label="$2" args_xml="$3" out="$4" err="$5"
  cat > "$path" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>$label</string>
<key>UserName</key><string>$USER_NAME</string>
<key>GroupName</key><string>$GROUP_NAME</string>
<key>ProgramArguments</key><array>$args_xml</array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>10</integer>
<key>ProcessType</key><string>Background</string>
<key>StandardOutPath</key><string>$out</string>
<key>StandardErrorPath</key><string>$err</string>
</dict></plist>
PLIST
  /usr/bin/plutil -lint "$path"
}
write_service "$DAEMONS/online.spiritualguidancegoddess.site.plist" online.spiritualguidancegoddess.site "<string>$NODE</string><string>$SITE</string>" "$LOGDIR/origin-daemon.stdout.log" "$LOGDIR/origin-daemon.stderr.log"
write_service "$DAEMONS/com.ourself.spiritualgoddess-web-tunnel.plist" com.ourself.spiritualgoddess-web-tunnel "<string>$CF</string><string>tunnel</string><string>--config</string><string>$TUNNEL</string><string>run</string><string>357350bc-8c63-4b7a-b02f-aa2ea7f4549b</string>" "$LOGDIR/tunnel-daemon.stdout.log" "$LOGDIR/tunnel-daemon.stderr.log"
cat > "$DAEMONS/com.ourself.client-deployer-watchdog.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>com.ourself.client-deployer-watchdog</string>
<key>UserName</key><string>root</string><key>GroupName</key><string>wheel</string>
<key>ProgramArguments</key><array><string>$WATCHDOG</string></array>
<key>RunAtLoad</key><true/><key>StartInterval</key><integer>60</integer>
<key>StandardOutPath</key><string>$LOGDIR/watchdog-launchd.stdout.log</string>
<key>StandardErrorPath</key><string>$LOGDIR/watchdog-launchd.stderr.log</string>
</dict></plist>
PLIST
/usr/bin/plutil -lint "$DAEMONS/com.ourself.client-deployer-watchdog.plist"
chown root:wheel "$DAEMONS/online.spiritualguidancegoddess.site.plist" "$DAEMONS/com.ourself.spiritualgoddess-web-tunnel.plist" "$DAEMONS/com.ourself.client-deployer-watchdog.plist"
chmod 644 "$DAEMONS/online.spiritualguidancegoddess.site.plist" "$DAEMONS/com.ourself.spiritualgoddess-web-tunnel.plist" "$DAEMONS/com.ourself.client-deployer-watchdog.plist"
mkdir -p "$BASE/rollback/launchagents"
for label in online.spiritualguidancegoddess.site com.ourself.spiritualgoddess-web-tunnel; do
  src="/Users/millysituated/Library/LaunchAgents/$label.plist"
  [ ! -f "$src" ] || cp -p "$src" "$BASE/rollback/launchagents/$label.plist"
done
for label in online.spiritualguidancegoddess.site com.ourself.spiritualgoddess-web-tunnel com.ourself.client-deployer-watchdog; do
  /bin/launchctl bootout "system/$label" >/dev/null 2>&1 || true
  /bin/launchctl bootstrap system "$DAEMONS/$label.plist"
  /bin/launchctl enable "system/$label"
  /bin/launchctl kickstart -k "system/$label"
done
for label in online.spiritualguidancegoddess.site com.ourself.spiritualgoddess-web-tunnel; do
  /bin/launchctl bootout "gui/501/$label" >/dev/null 2>&1 || true
done
/usr/bin/pmset -c sleep 0
/usr/bin/pmset -a autorestart 1
echo 'INSTALL_STATUS=SYSTEM_DAEMONS_INSTALLED'
for label in online.spiritualguidancegoddess.site com.ourself.spiritualgoddess-web-tunnel com.ourself.client-deployer-watchdog; do
  /bin/launchctl print "system/$label" | /usr/bin/grep -E 'state =|pid =|runs =|path =|program ='
done
/usr/bin/pmset -g custom
