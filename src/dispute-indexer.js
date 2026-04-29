/**
 * ProofLedger Verifier Dispute Indexer
 * Sync dispute.clar records to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./dispute-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [DISPUTE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureDisputeTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS disputes (
      dispute_id  INTEGER PRIMARY KEY,
      hash        TEXT NOT NULL,
      plaintiff   TEXT NOT NULL,
      reason      TEXT,
      raised_at   INTEGER,
      resolved    INTEGER NOT NULL DEFAULT 0,
      resolution  TEXT,
      upheld      INTEGER NOT NULL DEFAULT 0,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertDispute(db, entry) {
  db.prepare(`
    INSERT INTO disputes
      (dispute_id, hash, plaintiff, reason, raised_at, resolved, resolution, upheld)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(dispute_id) DO UPDATE SET
      resolved   = excluded.resolved,
      resolution = excluded.resolution,
      upheld     = excluded.upheld,
      indexed_at = datetime("now")
  `).run(
    entry.disputeId,
    entry.hash,
    entry.plaintiff,
    entry.reason,
    entry.raisedAt,
    entry.resolved ? 1 : 0,
    entry.resolution || "",
    entry.upheld ? 1 : 0,
  );
  log(`Upserted dispute #${entry.disputeId} resolved=${entry.resolved}`);
}

export function getOpenDisputes(db, limit = 20) {
  ensureDisputeTable(db);
  return db.prepare(`
    SELECT * FROM disputes WHERE resolved = 0
    ORDER BY raised_at DESC LIMIT ?
  `).all(limit);
}

export function getDisputesForHash(db, hash) {
  ensureDisputeTable(db);
  return db.prepare("SELECT * FROM disputes WHERE hash = ? ORDER BY raised_at DESC").all(hash);
}

export function getDisputeStats(db) {
  ensureDisputeTable(db);
  const total    = db.prepare("SELECT COUNT(*) as c FROM disputes").get().c;
  const open     = db.prepare("SELECT COUNT(*) as c FROM disputes WHERE resolved = 0").get().c;
  const upheld   = db.prepare("SELECT COUNT(*) as c FROM disputes WHERE upheld = 1").get().c;
  return { total, open, resolved: total - open, upheld };
}