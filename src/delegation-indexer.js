/**
 * ProofLedger Verifier Delegation Indexer
 * Track active delegations from delegation.clar
 */
import { appendFileSync } from "fs";

const LOG = "./delegation-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [DELEG] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureDelegationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS delegations (
      delegator    TEXT PRIMARY KEY,
      delegate     TEXT NOT NULL,
      granted_at   INTEGER,
      expires_at   INTEGER,
      anchor_only  INTEGER NOT NULL DEFAULT 0,
      active       INTEGER NOT NULL DEFAULT 1,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function insertDelegation(db, entry) {
  db.prepare(`
    INSERT OR REPLACE INTO delegations
      (delegator, delegate, granted_at, expires_at, anchor_only, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(
    entry.delegator,
    entry.delegate,
    entry.grantedAt,
    entry.expiresAt,
    entry.anchorOnly ? 1 : 0,
  );
}

export function revokeDelegation(db, delegator) {
  db.prepare("UPDATE delegations SET active = 0 WHERE delegator = ?").run(delegator);
}

export function getActiveDelegations(db) {
  ensureDelegationTable(db);
  return db.prepare("SELECT * FROM delegations WHERE active = 1").all();
}

export function isDelegateAuthorized(db, delegate, delegator) {
  ensureDelegationTable(db);
  const row = db.prepare(`
    SELECT * FROM delegations
    WHERE delegator = ? AND delegate = ? AND active = 1
  `).get(delegator, delegate);
  return !!row;
}

export function getDelegationStats(db) {
  ensureDelegationTable(db);
  const total  = db.prepare("SELECT COUNT(*) as c FROM delegations").get().c;
  const active = db.prepare("SELECT COUNT(*) as c FROM delegations WHERE active = 1").get().c;
  return { total, active };
}