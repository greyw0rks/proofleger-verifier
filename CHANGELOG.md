# Changelog

## [1.1.0] - 2026-04-19

### Added

**New Modules:**
- `src/indexer.js` — paginated blockchain sync with cursor tracking
- `src/verifier.js` — on-chain hash verification via REST API
- `src/parser.js` — structured transaction data extraction
- `src/database.js` — SQLite schema, queries, and prepared statements
- `src/api.js` — REST HTTP endpoints (stats, proof, wallet, recent, search)
- `src/alerts.js` — unusual activity detection and logging
- `src/export.js` — CSV and JSON export
- `src/scheduler.js` — configurable sync schedule with retry

**CLI Improvements:**
- `search` command — full-text search by title, hash, address
- `top` command — top wallets by anchor count
- `export` command — export to JSON or CSV

**Docs:**
- api.md — REST API reference
- deployment.md — PM2 and tmux setup
- architecture.md — system design diagram

### Changed
- Modular architecture replacing monolithic index.js
- Better rate limit handling (429 backoff)
- Separate verify delay per hash to avoid bursts

## [1.0.0] - 2026-04-05
- Initial release: blockchain watcher with SQLite storage
- Basic query CLI (stats, proof, wallet, recent)