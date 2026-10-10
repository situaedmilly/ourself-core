# OURSELF Daily / Intraday Proof Ledger

stable_id: `SELF-DELTA-01M4JFXP2KTRV1S39MZ8NJS713`
display_id: `OURSELFSHIFT-EVIDENCE-INGESTION-20261010-001`
entity_type: `evidence_ingestion_delta`
created_at: `2026-10-10T08:47:23Z`
created_by: `FOUNDER_AUTHORIZED_PUBLISH_VIA_SELFPI_OPENSEAT`
repository: `situaedmilly/ourself-core`
canonical_path: `governance/proof-ledger/entries/2026-10-10/SELF-DELTA-01M4JFXP2KTRV1S39MZ8NJS713.md`
status: `RECORDED`
evidence_tier: `Verified`
derived_from: [`SELF-DELTA-01M4JFKZAPED8AB98A0C0JRNF5`]
supersedes: []
superseded_by: null

---

## Purpose

Ingest the AETHERBRIDGE evidence chain into the canonical OURSELF proof ledger
designated by founder disposition `SELF-DELTA-01M4JFKZAPED8AB98A0C0JRNF5`
(commit `becee9cf3ddf7dab9392226375171c562f60a5e0`), binding every item to its
source, hash, custody relationship and verification status. This gate is
**evidence ingestion only** — not promotion and not actuation.

## Inventory

- manifest: `occurrence-001/evidence/20261010T084612Z.aetherbridge-evidence-ingestion-manifest.json`
- manifest_sha256: `73d731ca31d56c6f744410637b003a3af0aa76ec06af0f5de8314ea1b36e2922`
- items: **41** (0 missing)
- excluded by policy: transport token value, SSH private key, any credential

## Evidence Chains Ingested

### 1. Local circuit origin custody (2026-09-09) — tier: Verified
| item | sha256 | custody | verification |
|---|---|---|---|
| `authority.json` | `6a1b8d4008d1ef2ebb4b3cd6a4e491c4e544b7555db2ad8bee76c6f44b45bd66` | origin authorization, 3 proposal_ids match | Hash verified |
| `prepared.json` | `b28effdeb5d0f0702d11864c1ff703d4d0d4d4fc625e40d9527425d969c60f1d` | source pins (`selfcomm.py b999c20c…`) | Hash verified |
| `REPORT.json` | `a49cce3f6b7b459afd6f8b90939d4ae31c7e604089ddd752e385649229cf20ae` | parent of 3 return receipts | Reconciled 3/3 receipt hashes match |
| `proof-store/events.jsonl` | `fc2a40555dd74aa697db679a60cc72221cedd8e9297816d6bc9ca3f53a23e6b9` | append-only hash chain | 6/6 linked for witness proposal, ends RECONCILED |
| `proof-store/proposals/ae-local-cef5a600….json` | `6ac05d2b9861a19a3a6ba15379ee8dff6c743e812e9d281b6de87cd400f18a43` | record cited by crossing witness | Reconciled to witness `record_sha256` |

### 2. AETHERBRIDGE build + repair receipts (2026-10-09) — tier: Verified
Direct-bus ingress, RAWMAC-origin observation, credential push (no value printed),
409 refusal diagnosis (`RETURN_PREIMAGE_MISMATCH`), G7 repair preflight/manifest/receipt,
pre- and post-repair database snapshots (original recoverable), custody reconciliation.

Key anchors:
| receipt | sha256 |
|---|---|
| `20261009T202452Z.g7-repair-manifest.json` | `64eb4745b47dfd7f0088bf7958c0c2da6a1cefa547256ab5fc3bc254eb29388a` |
| `20261009T212335Z.custody-reconciliation.receipt` | `8f854ceb4a53683fbefac6045febf670753dd3419253c35b8966e0a6955f71b0` |
| `20261009T202452Z.exchange.sqlite.pre-repair-backup` | `a4b96b0e85db295ea4f303c6260c475832215edb7cbc3fd7ed67c63f1fc03c83` |

### 3. Authenticated crossing (2026-10-09T21:18:48Z) — tier: Verified (fields) / Unwitnessed (raw body)
`20261009T212253Z.authenticated-crossing.receipt`
sha256 `3945ac0e856aa65032cd4066c689009ddd57c1e8771ad5b0c9415303e5393a03`

- RAWMAC-origin HTTP 200 is **founder-reported**; every returned field was
  independently corroborated on SELFPI against the database, record file and
  proof-store path (request/record/binding hashes match).
- the raw response body was **not persisted** → raw-body claim tier: Unwitnessed.
- standing preserved: `LOCAL_PROOF_CHECK_ONLY_NO_INSTITUTIONAL_ADMISSION`.

### 4. OURSELF_ALCHEMY registration custody — tier: Verified
Founder declaration (authority source), registration record (12/12 readback PASS),
registration receipt, recontact evidence — under
`ourself-alchemy-runtime/{authority,instance,receipts,evidence}`.

### 5. Provenance-caveated item — tier: Probable
`20261010T070425Z.final-gate-report.json` — **not authored by this session**;
parallel/RAWMAC-terminal provenance; `raw_response_body_persisted=false`;
internal fields consistent with this session's state. Ingested with that caveat.

### 6. Quarantined residue — excluded from evidence
`20261009T212253Z.custody-reconciliation.receipt.partial-failed-write` —
truncated output of a failed write, renamed so it cannot be mistaken for the
real receipt (1458-byte `…212335Z` receipt is authoritative).

## Authority and Evidence Boundary

```text
GATE                        = OURSELFSHIFT_EVIDENCE_INGESTION
EVIDENCE_DESTINATION        = OURSELF_CANONICAL_PROOF_LEDGER (DESIGNATED)
INGESTED_ITEMS              = 41 (0 missing)
INGESTION_STANDING          = LOCAL_PROOF_CHECK_ONLY_NO_INSTITUTIONAL_ADMISSION
OURSELFSHIFT_CANONICAL_ADMISSION = NOT_ESTABLISHED
PROMOTION                   = NOT_CROSSED
ACTUATION                   = NOT_ATTEMPTED
```

## Refused Inferences

This entry does not:

- establish canonical admission for OURSELFSHIFT or ANY entity;
- convert founder-reported RAWMAC output into an independently persisted raw-body witness;
- convert the parallel-provenance gate report into a this-session witness;
- authorize promotion, actuation, external effects or unrelated repository mutations;
- modify any pre-existing file in the repository (append-style new entry only);
- ingest any credential, token value or private key.

## Continuity Rule

Supersedes nothing. Superseded only by a later entry that retains this stable ID
and declares an explicit `superseded_by` relationship. History rewriting prohibited.
