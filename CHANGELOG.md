# Changelog

## [1.4.0] - 2026-04-23

### Added

**New Modules:**
- `src/batch-verifier.js` — parallel on-chain verification with concurrency control
- `src/leaderboard.js` — wallet rankings and doc type breakdown from local DB
- `src/timeline.js` — daily/weekly/hourly activity time-series
- `src/anomaly-detector.js` — burst detection, duplicate titles, new high-volume wallets

**API v2 New Endpoints:**
- `GET /v2/leaderboard` — top wallets by score
- `GET /v2/timeline/daily` — daily activity data
- `GET /v2/timeline/weekly` — weekly activity data
- `GET /v2/doctypes` — document type breakdown

**CLI New Commands:**
- `node src/query.js leaderboard [limit]` — ranked wallet list
- `node src/query.js timeline [days]` — daily activity table
- `node src/query.js anomalies` — run anomaly checks

**Docs:**
- api-v2-reference.md — complete endpoint reference

## [1.3.0] - 2026-04-22
- stats reporter, search, dedup, cleanup, config

## [1.2.0] - 2026-04-21
- Celo indexer, multi-chain sync, API v2, health monitor

## [1.0.0] - 2026-04-05
- Initial release