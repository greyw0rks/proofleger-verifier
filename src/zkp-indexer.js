/**
 * ProofLedger Verifier ZKP Indexer
 * Sync zkp-verifier.clar attestations to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./zkp-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ZKP] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureZKPTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS zkp_attestations (
      attest_id       INTEGER PRIMARY KEY,
      credential_hash TEXT NOT NULL,
      proof_type      TEXT,
      verifier        TEXT,
      verified_at     INTEGER,
      public_inputs   TEXT,
      valid           INTEGER NOT NULL DEFAULT 1,
      indexed_at      TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function insertZKPAttestation(db, entry) {
  db.prepare(`
    INSERT OR IGNORE INTO zkp_attestations
      (attest_id, credential_hash, proof_type, verifier,
       verified_at, public_inputs, valid)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.attestId,
    entry.credentialHash,
    entry.proofType,
    entry.verifier,
    entry.verifiedAt,
    entry.publicInputs,
    entry.valid ? 1 : 0,
  );
  log(`Indexed ZKP attest #${entry.attestId} [${entry.proofType}] valid=${entry.valid}`);
}

export function getZKPsByHash(db, credentialHash) {
  ensureZKPTable(db);
  return db.prepare(`
    SELECT * FROM zkp_attestations
    WHERE credential_hash = ?
    ORDER BY verified_at DESC
  `).all(credentialHash);
}

export function getZKPStats(db) {
  ensureZKPTable(db);
  const total    = db.prepare("SELECT COUNT(*) as c FROM zkp_attestations").get().c;
  const valid    = db.prepare("SELECT COUNT(*) as c FROM zkp_attestations WHERE valid = 1").get().c;
  const verifiers = db.prepare("SELECT COUNT(DISTINCT verifier) as c FROM zkp_attestations").get().c;
  const byType   = db.prepare(`
    SELECT proof_type, COUNT(*) as c
    FROM zkp_attestations GROUP BY proof_type ORDER BY c DESC
  `).all();
  return { total, valid, invalid: total - valid, verifiers, byType };
}