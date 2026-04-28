/**
 * ProofLedger Verifier Attestation Registry Indexer
 * Sync attestation-registry.clar events to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./attestation-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ATTEST-REG] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureAttestationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hash_attestations (
      hash        TEXT NOT NULL,
      attester    TEXT NOT NULL,
      note        TEXT,
      weight      INTEGER NOT NULL DEFAULT 0,
      attested_at INTEGER,
      active      INTEGER NOT NULL DEFAULT 1,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now")),
      PRIMARY KEY (hash, attester)
    )
  `);
}

export function upsertAttestation(db, entry) {
  db.prepare(`
    INSERT INTO hash_attestations (hash, attester, note, weight, attested_at, active)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(hash, attester) DO UPDATE SET
      active     = excluded.active,
      indexed_at = datetime("now")
  `).run(entry.hash, entry.attester, entry.note, entry.weight, entry.attestedAt);
  log(`Upserted attestation: ${entry.hash?.slice(0, 14)}... by ${entry.attester?.slice(0, 10)}...`);
}

export function retractAttestation(db, hash, attester) {
  db.prepare("UPDATE hash_attestations SET active = 0 WHERE hash = ? AND attester = ?")
    .run(hash, attester);
}

export function getAttestationsForHash(db, hash) {
  ensureAttestationTable(db);
  return db.prepare(`
    SELECT * FROM hash_attestations
    WHERE hash = ? AND active = 1
    ORDER BY weight DESC, attested_at DESC
  `).all(hash);
}

export function getHashAttestationStats(db, hash) {
  ensureAttestationTable(db);
  const row = db.prepare(`
    SELECT COUNT(*) as count, SUM(weight) as total_weight
    FROM hash_attestations WHERE hash = ? AND active = 1
  `).get(hash);
  return { count: row?.count || 0, totalWeight: row?.total_weight || 0 };
}

export function getAttestationStats(db) {
  ensureAttestationTable(db);
  const total    = db.prepare("SELECT COUNT(*) as c FROM hash_attestations WHERE active = 1").get().c;
  const hashes   = db.prepare("SELECT COUNT(DISTINCT hash) as c FROM hash_attestations WHERE active = 1").get().c;
  const attesters = db.prepare("SELECT COUNT(DISTINCT attester) as c FROM hash_attestations WHERE active = 1").get().c;
  return { total, hashes, attesters };
}