/**
 * ProofLedger Verifier Bundle Indexer
 * Sync proof-bundle.clar bundles and hash members to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./bundle-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [BUNDLE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureBundleTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS proof_bundles (
      bundle_id   INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      creator     TEXT NOT NULL,
      created_at  INTEGER,
      hash_count  INTEGER NOT NULL DEFAULT 0,
      sealed      INTEGER NOT NULL DEFAULT 0,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now"))
    );
    CREATE TABLE IF NOT EXISTS bundle_hashes (
      bundle_id   INTEGER NOT NULL,
      index_      INTEGER NOT NULL,
      hash        TEXT NOT NULL,
      label       TEXT,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now")),
      PRIMARY KEY (bundle_id, index_)
    )
  `);
}

export function upsertBundle(db, bundle) {
  db.prepare(`
    INSERT INTO proof_bundles (bundle_id, name, creator, created_at, hash_count, sealed)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(bundle_id) DO UPDATE SET
      hash_count = excluded.hash_count,
      sealed     = excluded.sealed,
      indexed_at = datetime("now")
  `).run(
    bundle.bundleId,
    bundle.name,
    bundle.creator,
    bundle.createdAt,
    bundle.hashCount,
    bundle.sealed ? 1 : 0,
  );
}

export function insertBundleHash(db, entry) {
  db.prepare(`
    INSERT OR IGNORE INTO bundle_hashes (bundle_id, index_, hash, label)
    VALUES (?, ?, ?, ?)
  `).run(entry.bundleId, entry.index, entry.hash, entry.label);
}

export function getBundle(db, bundleId) {
  ensureBundleTables(db);
  return db.prepare("SELECT * FROM proof_bundles WHERE bundle_id = ?").get(bundleId);
}

export function getBundleHashes(db, bundleId) {
  ensureBundleTables(db);
  return db.prepare("SELECT * FROM bundle_hashes WHERE bundle_id = ? ORDER BY index_ ASC").all(bundleId);
}

export function getBundleStats(db) {
  ensureBundleTables(db);
  const total  = db.prepare("SELECT COUNT(*) as c FROM proof_bundles").get().c;
  const sealed = db.prepare("SELECT COUNT(*) as c FROM proof_bundles WHERE sealed = 1").get().c;
  const hashes = db.prepare("SELECT COUNT(*) as c FROM bundle_hashes").get().c;
  return { total, sealed, hashes };
}