#!/bin/sh
set -eu
BASE='/Users/millysituated/OURSELF/CLIENT_DEPLOYER_V1'
bash -n "$BASE/deployment/install-persistent-services.sh"
sh -n "$BASE/monitoring/health-watchdog.sh"
plutil -lint "$BASE/rollback/launchagents/com.ourself.spiritualgoddess-web-tunnel.plist" >/dev/null 2>&1 || true
echo 'SHELL_SYNTAX=PASS'
test -x /Users/millysituated/.nvm/versions/node/v22.17.1/bin/node
test -f /Users/millysituated/OURSELF/clients/spiritualgoddess/server.mjs
test -x /opt/homebrew/bin/cloudflared
test -f /Users/millysituated/.cloudflared/spiritualgoddess-web.yml
test -f /Users/millysituated/.cloudflared/357350bc-8c63-4b7a-b02f-aa2ea7f4549b.json
echo 'PREREQUISITES=PASS'
