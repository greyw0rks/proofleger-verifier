/**
 * ProofLedger Verifier Health Monitor — v1.2
 * Comprehensive service health with per-table record counts
 */
import { appendFileSync } from "fs";
import { existsSync } from "fs";

const HEALTH_LOG = "./health.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [HEALTH] ${msg}`;
  console.log(line);
  try { appendFileSync(HEALTH_LOG, line + "\n"); } catch {}
}

function tableCount(db, table) {
  try {
    return db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get().c;
  } catch { return -1; }
}

export function runHealthCheck(db) {
  const tables = [
    "proofs", "celo_proofs", "stats",
    "issuers", "batch_submissions", "nft_certs",
    "webhooks", "stats_snapshots",
  ];

  const counts = {};
  for (const t of tables) { counts[t] = tableCount(db, t); }

  const dbFile  = "./proofs.db";
  const dbOk    = existsSync(dbFile);
  const allOk   = Object.values(counts).every(c => c >= 0);

  const result = {
    status:    allOk && dbOk ? "ok" : "degraded",
    dbExists:  dbOk,
    tables:    counts,
    timestamp: new Date().toISOString(),
  };

  const statusLine = `status=${result.status} proofs=${counts.proofs} celo=${counts.celo_proofs} issuers=${counts.issuers} nfts=${counts.nft_certs}`;
  log(statusLine);

  return result;
}

export function startHealthMonitor(db, intervalMs = 300_000) {
  log("Health monitor started");
  runHealthCheck(db);
  const id = setInterval(() => runHealthCheck(db), intervalMs);
  return () => clearInterval(id);
}