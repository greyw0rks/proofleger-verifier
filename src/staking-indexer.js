/**
 * ProofLedger Verifier Staking Indexer
 * Sync staking.clar state to local SQLite for weight lookups
 */
import { appendFileSync } from "fs";

const LOG = "./staking-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [STAKE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureStakingTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stakes (
      staker       TEXT PRIMARY KEY,
      amount_ustx  INTEGER NOT NULL DEFAULT 0,
      weight       INTEGER NOT NULL DEFAULT 0,
      staked_at    INTEGER,
      lock_until   INTEGER,
      active       INTEGER NOT NULL DEFAULT 1,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertStake(db, entry) {
  db.prepare(`
    INSERT INTO stakes (staker, amount_ustx, weight, staked_at, lock_until, active)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(staker) DO UPDATE SET
      amount_ustx = excluded.amount_ustx,
      weight      = excluded.weight,
      staked_at   = excluded.staked_at,
      lock_until  = excluded.lock_until,
      active      = 1,
      indexed_at  = datetime("now")
  `).run(
    entry.staker,
    entry.amountUstx,
    entry.weight,
    entry.stakedAt,
    entry.lockUntil,
  );
  log(`Upserted stake: ${entry.staker} weight=${entry.weight}`);
}

export function removeStake(db, staker) {
  db.prepare("UPDATE stakes SET active = 0 WHERE staker = ?").run(staker);
  log(`Removed stake: ${staker}`);
}

export function getStake(db, staker) {
  ensureStakingTable(db);
  return db.prepare("SELECT * FROM stakes WHERE staker = ? AND active = 1").get(staker);
}

export function getTopStakers(db, limit = 20) {
  ensureStakingTable(db);
  return db.prepare(`
    SELECT * FROM stakes
    WHERE active = 1
    ORDER BY weight DESC
    LIMIT ?
  `).all(limit);
}

export function getStakingStats(db) {
  ensureStakingTable(db);
  const total       = db.prepare("SELECT COUNT(*) as c FROM stakes WHERE active = 1").get().c;
  const totalStaked = db.prepare("SELECT SUM(amount_ustx) as s FROM stakes WHERE active = 1").get().s || 0;
  const totalWeight = db.prepare("SELECT SUM(weight) as s FROM stakes WHERE active = 1").get().s || 0;
  return { total, totalStaked, totalWeight };
}