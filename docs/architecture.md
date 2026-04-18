# ProofLedger Verifier — Architecture

## Overview

```
verify.proofleger.vercel.app
├── / (Registry)          → fetches contract events from Hiro API
├── /verify               → client-side SHA-256 + Stacks wallet tx
└── /proof/[hash]         → server-rendered proof detail + verification status
```

## Data Flow

### Registry Page
1. Server fetches events from `proofleger3` contract via Hiro API
2. Events parsed into ProofRecord objects
3. Rendered as static table, revalidated every 30s

### Verify Flow
1. User drops file → browser computes SHA-256 locally (never uploaded)
2. User connects Leather/Xverse wallet
3. Frontend calls `openContractCall` → `verify-proof(hash)`
4. Contract charges 0.001 STX, logs verification on-chain
5. Transaction confirmed in next Stacks block (~10 min)

### Proof Detail
1. Hash from URL params
2. Server checks `get-verification` read-only call
3. If verified: shows green badge + verifier info
4. If not: shows VerifyButton for user to verify

## Key Files
- `src/lib/stacks.ts` — contract constants and API helpers
- `src/lib/verify-client.ts` — read-only contract queries
- `src/lib/hash-utils.ts` — client-side SHA-256 utilities
- `src/components/VerifyButton.tsx` — wallet connect + contract call
- `src/app/verify/page.tsx` — verify page with drag-and-drop