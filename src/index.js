/**
 * ProofLedger Verifier — Main Entry Point
 *
 * Usage:
 *   node src/index.js           # sync + API
 *   node src/index.js --no-api  # sync only
 *   node src/index.js --once    # single sync then exit
 */
import { openDB, refreshStats } from "./database.js";
import { initCeloDB } from "./celo-database.js";
import { syncAll } from "./multi-chain-sync.js";
import { startAPIv2 } from "./api-v2.js";
import { SyncScheduler } from "./scheduler.js";
import { startHealthMonitor } from "./health-monitor.js";
import { generateStatsReport, logDailySummary } from "./stats-reporter.js";
import { removeDuplicates } from "./dedup.js";
import { CONFIG, printConfig } from "./config.js";
import { appendFileSync } from "fs";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

const args = process.argv.slice(2);
const noAPI  = args.includes("--no-api");
const once   = args.includes("--once");

async function main() {
  printConfig();

  // Init database
  const db = openDB(CONFIG.DB_PATH);
  initCeloDB(db);
  log("Database ready");

  // Start API server
  if (!noAPI && CONFIG.API_ENABLED) {
    startAPIv2(db);
    log(`API server started on port ${CONFIG.API_PORT}`);
  }

  // Start health monitor
  startHealthMonitor(db);

  // Sync function
  async function runSync() {
    log("Starting sync...");
    const result = await syncAll(db);
    refreshStats(db);
    generateStatsReport(db);
    const daily = logDailySummary(db);
    log(`Daily summary: +${daily.stacksNew} Stacks, +${daily.celoNew} Celo`);
    removeDuplicates(db);
    return result;
  }

  if (once) {
    log("Single sync mode");
    await runSync();
    log("Done. Exiting.");
    process.exit(0);
  }

  // Scheduled sync
  const scheduler = new SyncScheduler(runSync, {
    intervalMs: CONFIG.SYNC_INTERVAL_MS,
  });
  scheduler.start();

  process.on("SIGINT",  () => { scheduler.stop(); log("Shutting down..."); process.exit(0); });
  process.on("SIGTERM", () => { scheduler.stop(); log("Shutting down..."); process.exit(0); });
}

main().catch(e => {
  appendFileSync(LOG_FILE, `FATAL: ${e.message}\n`);
  console.error(e);
  process.exit(1);
});