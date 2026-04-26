# Changelog

## [1.10.0] - 2026-04-30

### Added

**New Modules:**
- `src/governance-indexer.js` — sync proposals and votes from `governance.clar`
- `src/zkp-indexer.js` — track ZK proof attestation records

**Updated:**
- `src/api-v2.js` — final endpoint additions:
  - `GET /v2/governance` — proposal stats and recent list
  - `GET /v2/proposals/:id/votes` — per-proposal vote breakdown
  - `GET /v2/zkp/:hash` — ZKP attestations for a credential hash
  - `GET /v2/mirror/:hash` — cross-chain mirror status
  - `GET /v2/stake/:address` — active staking position
  - `GET /v2/recent?limit=n` — latest proof submissions
  - `GET /v2/leaderboard/staking` — top stakers by weight

**New DB Tables:**
- `proposals` — on-chain governance proposals
- `governance_votes` — stake-weighted votes per proposal
- `zkp_attestations` — ZK proof verification records

## [1.9.0] - 2026-04-29
- mirror, staking, vault indexers; scheduler v1.4

## [1.8.0] - 2026-04-28
- audit, whitelist, router indexers; query v1.5

## [1.0.0] - 2026-04-05
- Initial release