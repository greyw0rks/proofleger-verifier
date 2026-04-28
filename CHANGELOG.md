# Changelog

## [1.12.0] - 2026-05-02

### Added

**New Modules:**
- `src/achievement-indexer.js` — compute and award milestone badges, 6 seeded achievements
- `src/bridge-indexer.js` — track relay operators and cross-chain message confirmations

**Updated:**
- `src/api-v2.js` — new endpoints:
  - `GET /v2/talent/:address` — Talent Protocol score for an address
  - `GET /v2/talent` — top builders and stats
  - `GET /v2/achievements/:address` — earned badges for a wallet
  - `GET /v2/bridge` — relay operator and message stats
  - `GET /v2/leaderboard/talent` — top builders by score

**New DB Tables:**
- `achievements` — milestone badge definitions (6 seeded on init)
- `user_achievements` — per-wallet earned badges
- `relay_operators` — registered bridge operators
- `relay_messages` — cross-chain relay message history

## [1.11.0] - 2026-05-01
- talent, SDK indexers; query v1.6

## [1.10.0] - 2026-04-30
- governance, ZKP indexers; API v2 final endpoints

## [1.0.0] - 2026-04-05
- Initial release