/**
 * ProofLedger Verifier SDK Indexer
 * Sync sdk-registry.clar integration data to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./sdk-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [SDK] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureSDKTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sdk_integrations (
      app_id        INTEGER PRIMARY KEY,
      name          TEXT NOT NULL,
      owner         TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT "free",
      call_count    INTEGER NOT NULL DEFAULT 0,
      active        INTEGER NOT NULL DEFAULT 1,
      registered_at INTEGER,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertIntegration(db, entry) {
  db.prepare(`
    INSERT INTO sdk_integrations (app_id, name, owner, plan, call_count, active, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(app_id) DO UPDATE SET
      call_count = excluded.call_count,
      active     = excluded.active,
      indexed_at = datetime("now")
  `).run(
    entry.appId,
    entry.name,
    entry.owner,
    entry.plan,
    entry.callCount,
    entry.active ? 1 : 0,
    entry.registeredAt,
  );
  log(`Upserted SDK integration #${entry.appId}: ${entry.name}`);
}

export function getActiveIntegrations(db) {
  ensureSDKTable(db);
  return db.prepare(`
    SELECT * FROM sdk_integrations
    WHERE active = 1
    ORDER BY call_count DESC
  `).all();
}

export function getSDKStats(db) {
  ensureSDKTable(db);
  const total      = db.prepare("SELECT COUNT(*) as c FROM sdk_integrations").get().c;
  const active     = db.prepare("SELECT COUNT(*) as c FROM sdk_integrations WHERE active = 1").get().c;
  const totalCalls = db.prepare("SELECT SUM(call_count) as s FROM sdk_integrations").get().s || 0;
  const byPlan     = db.prepare(`
    SELECT plan, COUNT(*) as c FROM sdk_integrations WHERE active = 1
    GROUP BY plan ORDER BY c DESC
  `).all();
  return { total, active, totalCalls, byPlan };
}