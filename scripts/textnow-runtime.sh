#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
docker compose up -d postgres
cleanup(){ docker compose down >/dev/null 2>&1 || true; }
trap cleanup EXIT
for i in $(seq 1 30); do docker compose exec -T postgres pg_isready -U ourself -d ourself >/dev/null 2>&1 && break; [ "$i" -eq 30 ] && exit 1; sleep 1; done
docker compose exec -T postgres psql -U ourself -d ourself -v ON_ERROR_STOP=1 < db/migrations/001_matter_messaging.sql
docker compose exec -T postgres psql -U ourself -d ourself -v ON_ERROR_STOP=1 < db/migrations/002_textnow_runtime.sql
export DATABASE_URL="postgresql://ourself:ourself@localhost:5432/ourself"
[ -d node_modules/pg ] || npm install --no-save pg
node scripts/textnow-runtime-admission.mjs
