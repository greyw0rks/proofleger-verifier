# ProofLedger Verifier Achievement Tracker

The achievement tracker monitors wallet activity and flags earned milestones.

## Milestones Tracked

| Achievement | Category | Threshold |
|---|---|---|
| `first-anchor` | anchor | 1 |
| `power-user` | anchor | 10 |
| `century` | anchor | 100 |
| `first-attest` | attest | 1 |
| `super-attester` | attest | 25 |

## CLI

```bash
# All recent achievements
node src/query.js achievements

# Specific wallet
node src/query.js achievements SP1SY1...
```

## API

```bash
GET /v2/achievements
GET /v2/achievements?address=SP1SY1...
```

## Database Table

```sql
SELECT * FROM earned_achievements;
-- address | achievement | earned_at | notified
```

## Log

New achievements are appended to `achievements.log` as JSON lines.