# REVERSELF Repository PostgreSQL Runtime Launch

## Instance

- Repository: `situaedmilly/ourself-core`
- Branch: `reality/reverself-live-postgres-v0.1`
- Executed commit: `893e5714fcf3696e1c8c3c7f2abef8c0b24c5a96`
- Jurisdiction: `REPOSITORY-OWNED-POSTGRESQL`
- Runtime: PostgreSQL 17
- Observation: `2026-09-30T04:59:56.652Z`

## Witness

The local repository-defined command `npm run reverself:postgres` completed successfully.

- Canonical migration applied: yes
- REVERSELF executed: yes
- CROP result: `ORDER_PROVEN`
- Transport acknowledgement: `ACCEPTED`
- Transport acknowledgement is delivery: `false`
- Final state: `COMPLETED`
- Machine result: `PASSED`

## Persistence boundary

The Compose named volume `ourself-core_ourself-postgres-data` remained after the script's `docker compose down` teardown. This establishes volume existence, not durable synthetic application data, because the REVERSELF script cleans its synthetic database records before exit.

The machine receipt is therefore admitted as a repository proof artifact separately from database-state persistence.

## Invariants

```
VALID ≠ AUTHORIZED ≠ ACTUATABLE ≠ EXECUTED ≠ WITNESSED ≠ ADMITTED

ACK ≠ DELIVERY
```

This instance records exactly what the runtime established and does not promote transport acknowledgement into delivery or CROP order proof into broader authority.

## Next boundary

Repository evidence is now admitted. A future persistence witness must independently prove durable database state or a durable hash/ledger without conflating that evidence with this execution receipt.
