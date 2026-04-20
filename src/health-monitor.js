/**
 * ProofLedger Verifier Health Monitor
 * Checks sync state, DB size, and API responsiveness
 */
import { appendFileSync } from "fs";

const LOG_FILE  = "./health.log";
const CHECK_MS  = 5 * 60 * 1000; // every 5 minutes
const STALE_MIN = 30;             // alert if sync is > 30 min stale

function log(msg, level = "INFO") {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

export async function runHealthCheck(db) {
  const results = { timestamp: new Date().toISOString(), checks: {} };

  // DB integrity
  try {
    const stacksCount = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
    const celoCount   = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c || 0;
    results.checks.database = { ok: true, stacks: stacksCount, celo: celoCount };
    log(`DB check OK — Stacks: ${stacksCount}, Celo: ${celoCount}`);
  } catch(e) {
    results.checks.database = { ok: false, error: e.message };
    log(`DB check FAILED: ${e.message}`, "ERROR");
  }

  // Sync staleness
  try {
    const stacksSync = db.prepare("SELECT last_synced FROM sync_state LIMIT 1").get();
    const celoSync   = db.prepare("SELECT last_synced FROM celo_sync_state WHERE id = 1").get();

    for (const [name, state] of [["stacks", stacksSync], ["celo", celoSync]]) {
      if (!state?.last_synced) { results.checks[`${name}_sync`] = { ok: false, reason: "never synced" }; continue; }
      const ageMin = (Date.now() - new Date(state.last_synced).getTime()) / 60000;
      const ok = ageMin < STALE_MIN;
      results.checks[`${name}_sync`] = { ok, ageMinutes: Math.round(ageMin) };
      if (!ok) log(`${name} sync stale: ${Math.round(ageMin)}m`, "WARN");
    }
  } catch(e) {
    results.checks.sync = { ok: false, error: e.message };
  }

  const allOk = Object.values(results.checks).every(c => c.ok);
  results.overall = allOk ? "healthy" : "degraded";
  return results;
}

export function startHealthMonitor(db) {
  log("Health monitor started");
  runHealthCheck(db);
  return setInterval(() => runHealthCheck(db), CHECK_MS);
}