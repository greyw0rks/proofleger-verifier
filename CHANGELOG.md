# Changelog

## [1.5.0] - 2026-04-25

### Added

**New Modules:**
- `src/cache.js` — in-memory LRU cache for proof lookups and stats (500-entry, configurable TTL)
- `src/rate-limiter.js` — per-IP sliding window rate limiting (60 req/min default)
- `src/webhook.js` — HTTP webhook dispatcher with retry tracking and failure backoff
- `src/stats-aggregator.js` — hourly stats rollup with persistent snapshot table
- `src/search.js` — full-text search across hashes, titles, addresses on both chains
- `src/middleware.js` — composable CORS, rate-limit, and cache-header middleware

**Docs:**
- deployment.md — complete AWS Ubuntu production setup guide

### Improved
- API v2 now uses `proofCache` and `statsCache` for hot-path endpoints
- Rate limit headers (`X-RateLimit-Remaining`, `X-RateLimit-Reset`) on all responses
- Stats aggregation persists hourly snapshots to `stats_snapshots` table

## [1.4.0] - 2026-04-23
- batch verifier, leaderboard, timeline, anomaly detector, API v2 endpoints

## [1.3.0] - 2026-04-22
- stats reporter, search, dedup, cleanup, config

## [1.2.0] - 2026-04-21
- Celo indexer, multi-chain sync, API v2, health monitor

## [1.0.0] - 2026-04-05
- Initial release