# Changelog

## [1.9.0] - 2026-04-29

### Added

**New Modules:**
- `src/mirror-indexer.js` — track cross-chain Stacks↔Celo proof mirrors
- `src/staking-indexer.js` — sync active stakes and governance weights
- `src/vault-indexer.js` — index credential-vault entries and access grants

**Updated:**
- `src/scheduler.js` v1.4 — adds mirror, staking, vault, and cross-chain summary jobs;
  all jobs run on startup then on interval

**New DB Tables:**
- `proof_mirrors` — cross-chain mirror records with confirmation status
- `stakes` — active staker weights
- `vault_entries` + `vault_grants` — encrypted credential vault state

## [1.8.0] - 2026-04-28
- audit, whitelist, router indexers; query v1.5

## [1.7.0] - 2026-04-27
- reputation indexer, delegation indexer, snapshot, API v2 update

## [1.6.0] - 2026-04-26
- issuer, batch, and NFT indexers; health v1.2; query v1.4

## [1.0.0] - 2026-04-05
- Initial release