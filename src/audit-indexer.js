/**
 * ProofLedger Verifier Audit Indexer
 * Sync audit-trail.clar events to local SQLite for fast queries
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./audit-indexer.log";
const API  = CONFIG.STACKS_API || "https://api.hiro.so";
const C    = CONFIG.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";

function log(msg) {
  const line = `[${new Date().toISOString()}] [AUDIT] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureAuditTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      entry_id    INTEGER PRIMARY KEY,
      actor       TEXT NOT NULL,
      action      TEXT,
      target      TEXT,
      note        TEXT,
      block_height INTEGER,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function insertAuditEntry(db, entry) {
  db.prepare(`
    INSERT OR IGNORE INTO audit_log
      (entry_id, actor, action, target, note, block_height)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.entryId,
    entry.actor,
    entry.action,
    entry.target,
    entry.note,
    entry.blockHeight,
  );
}

export function getRecentAuditEntries(db, limit = 50) {
  ensureAuditTable(db);
  return db.prepare(`
    SELECT * FROM audit_log
    ORDER BY block_height DESC, entry_id DESC
    LIMIT ?
  `).all(limit);
}

export function getAuditByActor(db, actor, limit = 20) {
  ensureAuditTable(db);
  return db.prepare(`
    SELECT * FROM audit_log
    WHERE actor = ?
    ORDER BY block_height DESC
    LIMIT ?
  `).all(actor, limit);
}

export function getAuditStats(db) {
  ensureAuditTable(db);
  const total   = db.prepare("SELECT COUNT(*) as c FROM audit_log").get().c;
  const actors  = db.prepare("SELECT COUNT(DISTINCT actor) as c FROM audit_log").get().c;
  const actions = db.prepare("SELECT action, COUNT(*) as c FROM audit_log GROUP BY action ORDER BY c DESC LIMIT 5").all();
  return { total, actors, topActions: actions };
}