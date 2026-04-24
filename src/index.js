/**
 * ProofLedger Verifier — Main Entry Point v1.4
 *
 * Usage:
 *   node src/index.js             # full: sync + API
 *   node src/index.js --no-api    # sync only
 *   node src/index.js --once      # single sync then exit
 */
import { openDB, refreshStats } from "./database.js";
import { initCeloDB } from "./celo-database.js";
import { initEndorsementsTable } from "./endorsement-indexer.js";
import { initProfilesTable } from "./profile-indexer.js";
import { initAchievementsTable, checkAllAchievements } from "./achievement-tracker.js";
import { syncAll } from "./multi-chain-sync.js";
import { batchVerify } from "./batch-verifier.js";
import { checkRevocations } from "./revocation-checker.js";
import { startAPIv2 } from "./api-v2.js";
import { SyncScheduler } from "./scheduler.js";
import { startHealthMonitor } from "./health-monitor.js";
import { generateStatsReport, logDailySummary } from "./stats-reporter.js";
import { removeDuplicates } from "./dedup.js";
import { runAnomalyChecks } from "./anomaly-detector.js";
import { CONFIG, printConfig } from "./config.js";
import { appendFileSync } from "fs";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

const args    = process.argv.slice(2);
const noAPI   = args.includes("--no-api");
const once    = args.includes("--once");
const noAchv  = args.includes("--no-achievements");

async function main() {
  printConfig();

  // Init database tables
  const db = openDB(CONFIG.DB_PATH);
  initCeloDB(db);
  initEndorsementsTable(db);
  initProfilesTable(db);
  initAchievementsTable(db);
  log("Database ready (all tables initialised)");

  // Start API server
  if (!noAPI && CONFIG.API_ENABLED) {
    startAPIv2(db);
    log(`API server on :${CONFIG.API_PORT}`);
  }

  // Health monitor
  startHealthMonitor(db);

  async function runSync() {
    log("Sync starting...");

    // 1. Index new transactions (Stacks + Celo)
    const syncResult = await syncAll(db);
    log(`Indexed — Stacks: ${syncResult.stacks?.processed} · Celo: ${syncResult.celo?.processed}`);

    // 2. Verify unverified Stacks proofs on-chain
    const verifyResult = await batchVerify(db, 30, 3);
    log(`Verified: +${verifyResult.verified} · skipped: ${verifyResult.skipped}`);

    // 3. Check for revocations
    const revResult = await checkRevocations(db, 50);
    log(`Revocations checked: ${revResult.checked} · found: ${revResult.revoked}`);

    // 4. Refresh stats
    refreshStats(db);

    // 5. Achievement tracking
    if (!noAchv) {
      const newAchievements = checkAllAchievements(db);
      if (newAchievements.length > 0) {
        log(`New achievements: ${newAchievements.length}`);
      }
    }

    // 6. Housekeeping
    removeDuplicates(db);
    runAnomalyChecks(db);
    generateStatsReport(db);

    const daily = logDailySummary(db);
    log(`Daily: +${daily.stacksNew} Stacks · +${daily.celoNew} Celo`);
  }

  if (once) {
    log("--once mode");
    await runSync();
    log("Done.");
    process.exit(0);
  }

  const scheduler = new SyncScheduler(runSync, {
    intervalMs: CONFIG.SYNC_INTERVAL_MS,
  });
  scheduler.start();

  process.on("SIGINT",  () => { scheduler.stop(); log("Shutdown"); process.exit(0); });
  process.on("SIGTERM", () => { scheduler.stop(); log("Shutdown"); process.exit(0); });
}

main().catch(e => {
  appendFileSync(LOG_FILE, `FATAL: ${e.message}\n`);
  console.error(e);
  process.exit(1);
});