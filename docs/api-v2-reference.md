# ProofLedger Verifier API v2 Reference

Base URL: `http://localhost:3001`

## Endpoints

### `GET /v2/stats`
Combined Stacks + Celo statistics.

### `GET /v2/leaderboard?limit=20`
Top wallets ranked by proof activity score.
```json
{ "entries": [{ "rank": 1, "address": "SP1...", "anchors": 45, "score": 520 }] }
```

### `GET /v2/timeline/daily?days=30`
Daily anchor/attest/mint counts.
```json
{ "data": [{ "date": "2026-04-23", "anchors": 12, "attests": 8, "unique_wallets": 5 }] }
```

### `GET /v2/timeline/weekly?weeks=12`
Weekly aggregated activity.

### `GET /v2/doctypes`
Top document types by anchor count.

### `GET /v2/wallet?address=SP1...`
All Stacks + Celo proofs for a wallet.

### `GET /v2/proof?hash=a1b2...`
Look up a proof by partial hash.

### `GET /v2/recent?limit=20`
Latest Stacks proofs.

### `GET /v2/celo/recent?limit=20`
Latest Celo proofs.

### `GET /v2/celo/wallet?address=0x...`
Celo proofs for an EVM address.

### `GET /health`
Service health check with record counts.