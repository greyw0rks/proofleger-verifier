# Changelog

## [1.2.0] - 2026-04-21

### Added

**Celo Chain Support:**
- `src/celo-indexer.js` — CeloScan API polling for new transactions
- `src/celo-database.js` — SQLite schema for Celo proofs
- `src/multi-chain-sync.js` — parallel Stacks + Celo sync orchestration

**API v2:**
- `src/api-v2.js` — extended HTTP endpoints
- `GET /v2/stats` — combined Stacks + Celo stats
- `GET /v2/celo/recent` — latest Celo proofs
- `GET /v2/celo/wallet` — Celo proofs by address
- `GET /v2/wallet` — both chains for any address

**CLI Improvements:**
- `node src/query.js celo stats` — Celo database stats
- `node src/query.js celo recent` — latest Celo txs
- `node src/query.js celo wallet <addr>` — Celo wallet proofs
- `node src/query.js report <addr>` — full multi-chain wallet report

**Infrastructure:**
- `src/health-monitor.js` — periodic health checks with staleness alerts
- `src/wallet-report.js` — per-wallet JSON report generation

**Docs:**
- celo-indexer.md, health-monitoring.md

## [1.1.0] - 2026-04-19
- Modular refactor, REST API, export module

## [1.0.0] - 2026-04-05
- Initial release