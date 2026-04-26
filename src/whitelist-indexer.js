/**
 * ProofLedger Verifier Whitelist Indexer
 * Sync whitelist.clar state to local SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./whitelist-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [WL] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureWhitelistTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS whitelist (
      address     TEXT PRIMARY KEY,
      label       TEXT,
      added_at    INTEGER,
      active      INTEGER NOT NULL DEFAULT 1,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertWhitelistEntry(db, entry) {
  db.prepare(`
    INSERT INTO whitelist (address, label, added_at, active)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET
      label      = excluded.label,
      added_at   = excluded.added_at,
      active     = excluded.active,
      indexed_at = datetime("now")
  `).run(entry.address, entry.label, entry.addedAt, entry.active ? 1 : 0);
}

export function removeFromWhitelist(db, address) {
  db.prepare("UPDATE whitelist SET active = 0 WHERE address = ?").run(address);
}

export function isWhitelisted(db, address) {
  ensureWhitelistTable(db);
  const row = db.prepare("SELECT * FROM whitelist WHERE address = ? AND active = 1").get(address);
  return !!row;
}

export function getWhitelistedAddresses(db) {
  ensureWhitelistTable(db);
  return db.prepare("SELECT * FROM whitelist WHERE active = 1 ORDER BY added_at DESC").all();
}

export function getWhitelistStats(db) {
  ensureWhitelistTable(db);
  const total  = db.prepare("SELECT COUNT(*) as c FROM whitelist").get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM whitelist WHERE active = 1").get().c;
  return { total, active };
}