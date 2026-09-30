#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

command -v docker >/dev/null || { echo "DOCKER_REQUIRED"; exit 2; }
docker compose version >/dev/null || { echo "DOCKER_COMPOSE_REQUIRED"; exit 2; }

WITNESS_ID="$(python3 - <<'PY'
import uuid
print(uuid.uuid4())
PY
)"
WITNESS_KEY="reverself-persistence-witness-$WITNESS_ID"
RECEIPT="proof/reverself-persistence-witness.json"

cleanup() {
  docker compose down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "REVERSELF DATABASE PERSISTENCE WITNESS"
echo "witness_id=$WITNESS_ID"

docker compose up -d postgres

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

echo "INSERTING_COMMITTED_WITNESS"
docker compose exec -T postgres psql -U ourself -d ourself -v ON_ERROR_STOP=1 \
  -v witness_id="$WITNESS_ID" -v witness_key="$WITNESS_KEY" <<'SQL'
INSERT INTO public.matter_intents (
  intent_id, reality_id, instance_id, principal_id, intent_type,
  recipient_ref, payload, idempotency_key, policy_version, state
) VALUES (
  :'witness_id',
  'REVERSELF-PERSISTENCE-WITNESS',
  :'witness_id',
  'REPOSITORY-WITNESS',
  'MESSAGE_SEND',
  'LOCAL-PERSISTENCE',
  jsonb_build_object('witness','container-lifecycle-replacement','witness_id',:'witness_id'),
  :'witness_key',
  'v0.1',
  'ADMITTED'
);
SQL

echo "STOPPING_CONTAINER"
docker compose down

echo "RECREATING_CONTAINER"
docker compose up -d postgres

echo "WAITING_FOR_RECREATED_POSTGRES"
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U ourself -d ourself >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "POSTGRES_RECREATE_TIMEOUT"
    exit 1
  fi
  sleep 1
done

echo "READING_COMMITTED_WITNESS"
FOUND="$(docker compose exec -T postgres psql -U ourself -d ourself -At -v witness_id="$WITNESS_ID" -c "SELECT count(*) FROM public.matter_intents WHERE intent_id = :'witness_id';" | tr -d '[:space:]')"

if [ "$FOUND" != "1" ]; then
  echo "PERSISTENCE_WITNESS_FAILED"
  exit 1
fi

cat > "$RECEIPT" <<JSON
{
  "schema": "OURSELF.REVERSELF.REPOSITORY_POSTGRES_PERSISTENCE_RECEIPT.v0.1",
  "result": "PASSED",
  "repository": "situaedmilly/ourself-core",
  "jurisdiction": "REPOSITORY-OWNED-POSTGRESQL",
  "runtime": "PostgreSQL 17",
  "witness_id": "$WITNESS_ID",
  "witness_key": "$WITNESS_KEY",
  "boundary": "CONTAINER_LIFECYCLE_REPLACEMENT",
  "committed_before_replacement": true,
  "container_removed": true,
  "container_recreated": true,
  "same_named_volume_reused": true,
  "witness_row_found_after_recreation": true
}
JSON

echo "DATABASE_STATE_PERSISTENCE=PASSED"
echo "RECEIPT=$RECEIPT"
