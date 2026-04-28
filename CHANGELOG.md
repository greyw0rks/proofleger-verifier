# Changelog

## [1.11.0] - 2026-05-01

### Added

**New Modules:**
- `src/talent-indexer.js` — sync Talent Protocol attestations to SQLite
- `src/sdk-indexer.js` — track SDK integration registrations and call metrics

**Updated:**
- `src/query.js` v1.6 — new commands: `talent`, `sdk`, `governance`, `staking`, `mirrors`;
  `stats` command now shows full cross-system summary in one shot

**New DB Tables:**
- `talent_attestations` — builder scores from Talent Protocol
- `sdk_integrations` — registered SDK apps with plan and call count

## [1.10.0] - 2026-04-30
- governance, ZKP indexers; API v2 final endpoints

## [1.9.0] - 2026-04-29
- mirror, staking, vault indexers; scheduler v1.4

## [1.8.0] - 2026-04-28
- audit, whitelist, router indexers; query v1.5

## [1.0.0] - 2026-04-05
- Initial release