# Changelog

## [1.14.0] - 2026-05-04

### Added

**New Modules:**
- `src/metadata-indexer.js` — sync metadata-registry.clar URIs (ipfs/arweave) to SQLite
- `src/dispute-indexer.js` — track open and resolved disputes per hash
- `src/bundle-indexer.js` — index proof-bundle.clar bundles and member hashes

**Updated:**
- `src/api-v2.js` — new endpoints completing full coverage:
  - `GET /v2/metadata/:hash` — off-chain metadata URI for a hash
  - `GET /v2/metadata` — metadata stats (total, pinned, by content type)
  - `GET /v2/disputes` — open dispute list with stats
  - `GET /v2/disputes/:hash` — disputes raised against a specific hash
  - `GET /v2/bundles/:id` — bundle info and all member hashes
  - `GET /v2/bundles` — bundle stats (total, sealed, hash count)

**New DB Tables:**
- `metadata_entries` — IPFS/Arweave URI records
- `disputes` — dispute records with resolution status
- `proof_bundles` + `bundle_hashes` — bundle membership tables

## [1.13.0] - 2026-05-03
- attestation, counter indexers; /attestations + /timeline endpoints

## [1.12.0] - 2026-05-02
- achievement, bridge indexers; API v2 talent/achievements/bridge

## [1.0.0] - 2026-04-05
- Initial release