# Changelog

## [1.7.0] - 2026-04-27

### Added

**New Modules:**
- `src/reputation-indexer.js` — sync on-chain reputation scores to SQLite from local proof records
- `src/delegation-indexer.js` — track active delegation grants and revocations
- `src/snapshot.js` — export full DB state to timestamped JSON backup

**Updated:**
- `src/api-v2.js` — new endpoints: `/v2/reputation/:address`,
  `/v2/leaderboard/reputation`, `/v2/delegation/:delegator`, `/v2/search`

**New DB Tables:**
- `reputation` — per-wallet scores derived from anchor/attest history
- `delegations` — active delegation grants

## [1.6.0] - 2026-04-26
- issuer, batch, and NFT indexers; health v1.2; query v1.4

## [1.5.0] - 2026-04-25
- cache, rate limiter, webhooks, stats aggregator, search, middleware

## [1.4.0] - 2026-04-23
- batch verifier, leaderboard, timeline, anomaly detector

## [1.0.0] - 2026-04-05
- Initial release