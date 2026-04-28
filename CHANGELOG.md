# Changelog

## [1.13.0] - 2026-05-03

### Added

**New Modules:**
- `src/attestation-indexer.js` — sync attestation-registry.clar events to `hash_attestations` table
- `src/counter-indexer.js` — derive per-wallet counters from proofs, auto-trigger achievement awards

**Updated:**
- `src/api-v2.js` — new endpoints:
  - `GET /v2/attestations/:hash` — third-party attestations and weight for a hash
  - `GET /v2/timeline?days=14` — daily activity chart data
- `src/scheduler.js` v1.5 — adds `counter-sync` (15min) and extended cross-chain summary

**New DB Tables:**
- `hash_attestations` — per-hash third-party attestation records
- `wallet_counters` — per-wallet anchor/attest totals derived from proofs

## [1.12.0] - 2026-05-02
- achievement, bridge indexers; API v2 talent/achievements/bridge

## [1.11.0] - 2026-05-01
- talent, SDK indexers; query v1.6

## [1.0.0] - 2026-04-05
- Initial release