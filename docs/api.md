# ProofLedger Verifier REST API

Start with API enabled:
```bash
node src/index.js --api
```

Default port: `3001`

## Endpoints

### GET /stats
Protocol-wide statistics.

```json
{
  "total_anchors": 500,
  "total_attests": 375,
  "total_mints": 340,
  "total_verified": 480,
  "total_senders": 120
}
```

### GET /proof?hash={partial_hash}
Look up a specific proof.

### GET /wallet?address={SP...}
All proofs for a wallet.

### GET /recent?limit=20
Latest proofs.

### GET /search?q={term}
Search by title, hash, or address.

### GET /health
Health check.

## Cross-Origin

All endpoints include `Access-Control-Allow-Origin: *`
so they can be queried from any frontend.