# ProofLedger Verifier Configuration

All settings configurable via environment variables.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `STACKS_API` | https://api.hiro.so | Hiro API base URL |
| `CELO_RPC` | https://feth.celo.org | Celo JSON-RPC endpoint |
| `CELOSCAN_API` | https://api.celoscan.io/api | CeloScan API for TX history |
| `STACKS_CONTRACT` | SP1SY1...QKK | Stacks deployer address |
| `CELO_CONTRACT` | 0x251B...1735 | Celo contract address |
| `DB_PATH` | ./proofs.db | SQLite database file path |
| `SYNC_INTERVAL_MS` | 900000 | Sync interval (15 min default) |
| `PAGE_SIZE` | 50 | Transactions per API page |
| `PORT` | 3001 | HTTP API port |
| `API_ENABLED` | true | Enable REST API server |
| `HIGH_VOLUME_THRESHOLD` | 100 | Alert threshold (txs/hour) |
| `STALE_SYNC_MINUTES` | 30 | Alert if sync older than this |

## Startup Options

```bash
node src/index.js             # full mode: sync + API
node src/index.js --no-api    # sync only, no HTTP server
node src/index.js --once      # single sync then exit (for cron)
```

## Cron Usage

```bash
# Run once every 15 minutes via cron
*/15 * * * * cd ~/proofleger-verifier && node src/index.js --once
```