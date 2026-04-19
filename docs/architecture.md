# ProofLedger Verifier Architecture

## Overview

The Verifier is an off-chain indexer that mirrors ProofLedger on-chain data into a queryable SQLite database.

## Components

```
┌─────────────────────────────────────────────┐
│              Stacks Blockchain               │
│  proofleger3 · credentials · achievements   │
└──────────────────┬──────────────────────────┘
                   │ poll every 15min
                   ▼
┌─────────────────────────────────────────────┐
│            ProofLedger Verifier             │
│                                             │
│  src/indexer.js   — paginated TX fetch      │
│  src/parser.js    — extract proof data      │
│  src/verifier.js  — on-chain verification   │
│  src/database.js  — SQLite write/read       │
│  src/api.js       — REST HTTP server        │
│  src/alerts.js    — unusual activity        │
│  src/scheduler.js — sync timing             │
│  src/export.js    — CSV/JSON export         │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────┴────────┐
          ▼                 ▼
      proofs.db         REST API
    (SQLite)         :3001/stats
                     :3001/proof
                     :3001/wallet
```

## Data Flow

1. Scheduler triggers sync every 15 minutes
2. Indexer fetches new transactions page by page
3. Parser extracts hash, title, docType from function args
4. Verifier confirms hash exists on-chain via read-only call
5. Database stores with verified=1 flag
6. API exposes data for external consumers

## Design Principles

- **Non-custodial**: No private keys, read-only indexing
- **Resilient**: If down, on-chain data is unaffected
- **Incremental**: Syncs from last known offset
- **Rate-aware**: Respects Hiro API limits (429 handling)