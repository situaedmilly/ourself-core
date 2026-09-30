#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v docker >/dev/null || { echo "DOCKER_REQUIRED"; exit 2; }
docker compose version >/dev/null || { echo "DOCKER_COMPOSE_REQUIRED"; exit 2; }

echo "OURSELF REPOSITORY POSTGRES REALITY"
echo "root=$ROOT"

docker compose up -d postgres

cleanup() {
  docker compose down
}
trap cleanup EXIT

echo "WAITING_FOR_POSTGRES"
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U ourself -d ourself >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "POSTGRES_BOOT_TIMEOUT"
    exit 1
  fi
  sleep 1
done

echo "APPLYING_CANONICAL_MIGRATION"
docker compose exec -T postgres psql -U ourself -d ourself -v ON_ERROR_STOP=1 < db/migrations/001_matter_messaging.sql

echo "RUNNING_REVERSELF"
export DATABASE_URL="postgresql://ourself:ourself@localhost:5432/ourself"

if [ ! -d node_modules/pg ]; then
  npm install --no-save pg
fi

node scripts/reverself-live-postgres.mjs | tee governed-messaging-receipt.json

node -e 'const fs=require("fs"); const r=JSON.parse(fs.readFileSync("governed-messaging-receipt.json","utf8")); if(r.result!=="PASSED") process.exit(1);'

echo "REVERSELF_LOCAL_RUNTIME=PASSED"
echo "RECEIPT=governed-messaging-receipt.json"
