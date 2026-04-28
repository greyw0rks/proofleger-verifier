/**
 * ProofLedger Verifier Counter Indexer
 * Sync proof-counter.clar data and trigger achievement checks
 */
import { appendFileSync } from "fs";
import { checkAndAwardAchievements } from "./achievement-indexer.js";

const LOG = "./counter-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [COUNTER] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureCounterTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet_counters (
      address      TEXT PRIMARY KEY,
      anchors      INTEGER NOT NULL DEFAULT 0,
      attests      INTEGER NOT NULL DEFAULT 0,
      verifies     INTEGER NOT NULL DEFAULT 0,
      last_action  INTEGER,
      synced_at    TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function syncCountersFromProofs(db) {
  ensureCounterTable(db);

  const wallets = db.prepare(`
    SELECT
      sender,
      SUM(CASE WHEN category = anchor THEN 1 ELSE 0 END) as anchors,
      SUM(CASE WHEN category = attest THEN 1 ELSE 0 END) as attests,
      MAX(created_at) as last_action
    FROM proofs
    GROUP BY sender
  `).all();

  let synced = 0; let newAchievements = 0;
  for (const w of wallets) {
    db.prepare(`
      INSERT INTO wallet_counters (address, anchors, attests, last_action, synced_at)
      VALUES (?, ?, ?, ?, datetime("now"))
      ON CONFLICT(address) DO UPDATE SET
        anchors     = excluded.anchors,
        attests     = excluded.attests,
        last_action = excluded.last_action,
        synced_at   = datetime("now")
    `).run(w.sender, w.anchors, w.attests, w.last_action);

    // Trigger achievement check for each wallet
    try {
      const awarded = checkAndAwardAchievements(db, w.sender);
      newAchievements += awarded.length;
    } catch {}
    synced++;
  }

  log(`Synced ${synced} wallets, awarded ${newAchievements} new achievements`);
  return { synced, newAchievements };
}

export function getTopByAnchors(db, limit = 20) {
  ensureCounterTable(db);
  return db.prepare(`
    SELECT * FROM wallet_counters
    ORDER BY anchors DESC LIMIT ?
  `).all(limit);
}

export function getCounterStats(db) {
  ensureCounterTable(db);
  const total       = db.prepare("SELECT COUNT(*) as c FROM wallet_counters").get().c;
  const totalAnchor = db.prepare("SELECT SUM(anchors) as s FROM wallet_counters").get().s || 0;
  const totalAttest = db.prepare("SELECT SUM(attests) as s FROM wallet_counters").get().s || 0;
  return { total, totalAnchor, totalAttest };
}