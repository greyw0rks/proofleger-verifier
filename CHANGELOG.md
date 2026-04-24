# Changelog

## [1.5.0] - 2026-04-24

### Added

**New Modules:**
- `src/revocation-checker.js` — cross-reference proofs against on-chain revocation registry
- `src/endorsement-indexer.js` — track endorsement counts per document hash
- `src/profile-indexer.js` — mirror on-chain profiles into local database
- `src/achievement-tracker.js` — detect earned milestones, log to achievements.log

**API v2 New Endpoints:**
- `GET /v2/revocations` — all revoked credentials
- `GET /v2/achievements` — earned achievements with optional address filter
- `GET /v2/profiles?address=` — local profile data

**Database New Tables:**
- `endorsements` — per-hash endorser records
- `profiles` — mirrored on-chain wallet profiles
- `earned_achievements` — detected milestone achievements

**CLI New Commands:**
- `node src/query.js revocations` — list revoked proofs
- `node src/query.js achievements [address]` — list earned achievements

**Updated Modules:**
- `src/index.js` — runs revocation + achievement checks every sync cycle
- `src/api-v2.js` — serves new endpoints
- `src/query.js` — new commands, revoked status shown in wallet/recent output

**Docs:**
- achievement-tracker.md, revocation-checking.md

## [1.4.0] - 2026-04-23
- batch verifier, leaderboard, timeline, anomaly detector

## [1.3.0] - 2026-04-22
- stats reporter, search, dedup, cleanup, config

## [1.0.0] - 2026-04-05
- Initial release