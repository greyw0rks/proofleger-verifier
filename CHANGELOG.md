# Changelog

## [1.6.0] - 2026-04-26

### Added

**New Modules:**
- `src/issuer-indexer.js` — sync `issuer-registry` contract events to local SQLite
- `src/batch-indexer.js` — expand `proof-batch` submissions into individual DB rows
- `src/nft-indexer.js` — track `proof-nft` mints and transfers per-token

**Updated:**
- `src/health-monitor.js` v1.2 — adds issuer, batch, and NFT table health checks
- `src/query.js` v1.4 — new CLI commands: `issuers`, `nfts`, `batch`

**New DB Tables:**
- `issuers` — on-chain issuer registrations
- `batch_submissions` — expanded batch proof entries
- `nft_certs` — NFT certificate ownership and transfer history

## [1.5.0] - 2026-04-25
- cache, rate limiter, webhooks, stats aggregator, search, middleware

## [1.4.0] - 2026-04-23
- batch verifier, leaderboard, timeline, anomaly detector

## [1.3.0] - 2026-04-22
- stats reporter, search, dedup, cleanup, config

## [1.2.0] - 2026-04-21
- Celo indexer, multi-chain sync, API v2, health monitor

## [1.0.0] - 2026-04-05
- Initial release