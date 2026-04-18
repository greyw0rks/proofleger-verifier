# ProofLedger Verifier — API Reference

## Contract
`SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK.proofleger-verifier`

## Public Functions

### verify-proof
```clarity
(verify-proof (proof-hash (buff 32))) → (response bool uint)
```
Charges 0.001 STX (1000 micro-STX) from caller to CONTRACT-OWNER.
Records verifier, block height, and verification count on-chain.
Emits a `proof-verified` print event.

## Read-Only Functions

### get-verification
```clarity
(get-verification (proof-hash (buff 32))) → (optional { verifier: principal, block-height: uint, verification-count: uint })
```

### get-total-verifications
```clarity
(get-total-verifications) → (response uint uint)
```

### get-total-fees
```clarity
(get-total-fees) → (response uint uint)
```

### get-verify-fee
```clarity
(get-verify-fee) → (response uint uint)
```
Returns `u1000` (0.001 STX in micro-STX).

## JavaScript Usage

```typescript
import { getVerificationRecord, getTotalVerifications } from "@/lib/verify-client";

const record = await getVerificationRecord("a1b2c3...");
// null if not verified, string if verified

const total = await getTotalVerifications();
// number
```