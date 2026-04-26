# Changelog

## [1.8.0] - 2026-04-28

### Added

**New Modules:**
- `src/audit-indexer.js` — sync `audit-trail.clar` events to `audit_log` table
- `src/whitelist-indexer.js` — track whitelist add/remove events
- `src/router-indexer.js` — parse `proof-router.clar` events, cross-reference proofs

**Updated:**
- `src/query.js` v1.5 — new CLI commands: `audit`, `whitelist`, `router`, `snapshot`

**New DB Tables:**
- `audit_log` — governance and admin action history
- `whitelist` — whitelisted anchor addresses
- `routed_anchors` — routing decisions with proof match status

## [1.7.0] - 2026-04-27
- reputation indexer, delegation indexer, snapshot, API v2 update

## [1.6.0] - 2026-04-26
- issuer, batch, and NFT indexers; health v1.2; query v1.4

## [1.5.0] - 2026-04-25
- cache, rate limiter, webhooks, stats aggregator, search, middleware

## [1.0.0] - 2026-04-05
- Initial release