# Changelog

## [1.3.0] - 2026-04-22

### Added

**New Modules:**
- `src/stats-reporter.js` — periodic markdown stats summary generation
- `src/search.js` — full-text search across Stacks and Celo records
- `src/dedup.js` — detect and remove duplicate txid entries
- `src/cleanup.js` — VACUUM, prune old records, report DB size
- `src/config.js` — centralized config with env var support

**Updated Modules:**
- `src/index.js` — full wiring of all modules, `--once` and `--no-api` flags

**Docs:**
- configuration.md — complete env var reference
- query-reference.md — full CLI command guide

### Changed
- Stats report now written to `stats-report.md` on every sync
- Daily summary logged after each sync cycle
- Duplicate removal runs automatically after each sync

## [1.2.0] - 2026-04-21
- Celo indexer, multi-chain sync, API v2, health monitor

## [1.1.0] - 2026-04-19
- Modular refactor, REST API, export module

## [1.0.0] - 2026-04-05
- Initial release