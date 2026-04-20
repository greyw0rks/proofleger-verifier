# ProofLedger Verifier — Celo Indexer

The Celo indexer watches the ProofLedger Celo contract for new document anchoring transactions.

## How It Works

1. Polls CeloScan API for new transactions to `0x251B3302c0CcB1cFBeb0cda3dE06C2D312a41735`
2. Parses `anchorDocument` calls from transaction input data
3. Stores in `celo_proofs` SQLite table alongside Stacks data

## Database Schema

```sql
CREATE TABLE celo_proofs (
  id           INTEGER PRIMARY KEY,
  txid         TEXT UNIQUE,
  from_address TEXT,
  block_number INTEGER,
  timestamp    TEXT,
  gas_used     INTEGER,
  verified     INTEGER DEFAULT 1
);
```

## Query Celo Data

```bash
node src/query.js celo stats
node src/query.js celo recent 10
node src/query.js celo wallet 0x1234...
```

## API v2

```bash
curl http://localhost:3001/v2/stats           # combined Stacks + Celo
curl http://localhost:3001/v2/celo/recent     # latest Celo proofs
curl "http://localhost:3001/v2/wallet?address=SP1..."  # both chains
```