# ProofLedger Verifier Health Monitoring

## Health Check Output

```json
{
  "timestamp": "2026-04-21T10:00:00Z",
  "checks": {
    "database": { "ok": true, "stacks": 1240, "celo": 380 },
    "stacks_sync": { "ok": true, "ageMinutes": 8 },
    "celo_sync": { "ok": true, "ageMinutes": 12 }
  },
  "overall": "healthy"
}
```

## API Health Endpoint

```bash
curl http://localhost:3001/health
```

## Log Files

| File | Contents |
|---|---|
| `verifier.log` | Sync events, TX processing |
| `alerts.log` | Unusual activity alerts |
| `health.log` | Health check results |
| `celo-agent.log` | Celo bot activity |

## Alerts Triggered When

- Sync stale > 30 minutes
- Unverified backlog > 100 proofs
- High transaction volume (>100/hour)
- New sender first seen