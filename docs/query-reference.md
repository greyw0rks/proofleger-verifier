# ProofLedger Verifier Query Reference

## Synopsis

```bash
node src/query.js <command> [args]
```

## Commands

### `stats`
Print database statistics for both chains.
```bash
node src/query.js stats
```

### `proof <hash>`
Look up a proof by partial hash.
```bash
node src/query.js proof a1b2c3
```

### `wallet <address>`
All Stacks proofs for a wallet.
```bash
node src/query.js wallet SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK
```

### `recent [limit]`
Latest N proofs (default 20).
```bash
node src/query.js recent 50
```

### `search <term>`
Full-text search by title, hash, or address.
```bash
node src/query.js search "diploma"
```

### `top [limit]`
Top N wallets by anchor count.
```bash
node src/query.js top 10
```

### `export [json|csv]`
Export verified proofs to file.
```bash
node src/query.js export json   # → export.json
node src/query.js export csv    # → export.csv
```

### `celo stats|recent|wallet`
Celo chain specific queries.
```bash
node src/query.js celo stats
node src/query.js celo recent 10
node src/query.js celo wallet 0x1234...
```

### `report <address>`
Full multi-chain wallet report saved to JSON.
```bash
node src/query.js report SP1SY1...
```