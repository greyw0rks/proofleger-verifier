# ProofLedger Verifier

Institutional blockchain indexer for ProofLedger. Watches the Stacks blockchain for document anchoring activity and stores verified proofs in a local SQLite database.

## Architecture

```
Stacks Blockchain → Verifier (polls every 15min) → SQLite DB → REST API
```

ProofLedger (on-chain) = permanent, censorship-resistant  
ProofLedger Verifier = fast, searchable institutional database

## Install & Start

```bash
npm install
node src/index.js
```

## CLI Queries

```bash
node src/query.js stats              # database overview
node src/query.js recent 20          # latest 20 proofs
node src/query.js proof <hash>       # lookup by hash
node src/query.js wallet SP1SY1...   # proofs by wallet
node src/query.js search "diploma"   # full-text search
node src/query.js top 10             # top wallets by anchors
node src/query.js export json        # export to JSON
node src/query.js export csv         # export to CSV
```

## REST API

```bash
# Start with API
node src/index.js

# Query
curl http://localhost:3001/stats
curl "http://localhost:3001/proof?hash=a1b2"
curl "http://localhost:3001/wallet?address=SP..."
curl "http://localhost:3001/recent?limit=10"
curl "http://localhost:3001/search?q=diploma"
```

## What It Tracks

- `store` / `anchor-document` — document hashes anchored to Bitcoin
- `attest` / `attest-document` — third-party attestations
- `mint` — soulbound achievement NFTs

## Contract Address

`SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK`