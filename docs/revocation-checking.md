# ProofLedger Verifier — Revocation Checking

## Overview

After syncing and verifying proofs, the verifier also checks whether any
previously verified proofs have been revoked via the `revocations.clar` contract.

## Database States

| `verified` value | Meaning |
|---|---|
| `0` | Not yet verified on-chain |
| `1` | Verified — exists and not revoked |
| `2` | Revoked — issuer has revoked this credential |

## CLI

```bash
node src/query.js revocations
```

## API

```bash
GET /v2/revocations
# Returns all proofs with verified = 2
```

## Proof endpoint

```bash
GET /v2/proof?hash=a1b2c3...
# Returns proof with revocation status included
```

## Frequency

Revocation checks run on every sync cycle (every 15 minutes by default)
against the 50 most recently verified proofs.