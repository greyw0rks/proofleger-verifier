/**
 * ProofLedger Verifier Scheduler — v1.4
 * Cron-style job runner for all indexer sync tasks
 */
import Database from "better-sqlite3";
import { appendFileSync } from "fs";
import { syncIssuers }            from "./issuer-indexer.js";
import { syncNFTs }               from "./nft-indexer.js";
import { syncReputationFromProofs } from "./reputation-indexer.js";
import { runHourlyAggregation }   from "./stats-aggregator.js";
import { runAnomalyChecks }       from "./anomaly-detector.js";
import { runHealthCheck }         from "./health-monitor.js";
import { getMirrorStats }         from "./mirror-indexer.js";
import { getStakingStats }        from "./staking-indexer.js";
import { getVaultStats }          from "./vault-indexer.js";
import { CONFIG }                  from "./config.js";

const DB_FILE = CONFIG.DB_FILE || "./proofs.db";
const LOG     = "./scheduler.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [SCHED] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

function getDb() { return new Database(DB_FILE); }

// ── Job definitions ───────────────────────────────────────

async function jobStatsAggregation() {
  log("Running hourly stats aggregation");
  const db = getDb();
  try { runHourlyAggregation(db); } finally { db.close(); }
}

async function jobHealthCheck() {
  log("Running health check");
  const db = getDb();
  try { runHealthCheck(db); } finally { db.close(); }
}

async function jobIssuerSync() {
  log("Running issuer sync");
  const db = getDb();
  try { await syncIssuers(db); } finally { db.close(); }
}

async function jobNFTSync() {
  log("Running NFT sync");
  const db = getDb();
  try { await syncNFTs(db); } finally { db.close(); }
}

async function jobReputationSync() {
  log("Running reputation sync from local proofs");
  const db = getDb();
  try { await syncReputationFromProofs(db); } finally { db.close(); }
}

async function jobAnomalyCheck() {
  log("Running anomaly detection");
  const db = getDb();
  try { runAnomalyChecks(db); } finally { db.close(); }
}

async function jobCrossChainStats() {
  log("Cross-chain stats summary");
  const db = getDb();
  try {
    const mirrors = getMirrorStats(db);
    const stakes  = getStakingStats(db);
    const vaults  = getVaultStats(db);
    log(`Mirrors: ${mirrors.total} (${mirrors.confirmed} confirmed)`);
    log(`Stakes:  ${stakes.total} active · ${stakes.totalWeight} total weight`);
    log(`Vaults:  ${vaults.vaults} entries · ${vaults.activeGrants} active grants`);
  } finally { db.close(); }
}

// ── Simple interval scheduler ─────────────────────────────

const MINUTE = 60 * 1000;
const HOUR   = 60 * MINUTE;

const jobs = [
  { name: "health-check",      fn: jobHealthCheck,      interval: 5 * MINUTE },
  { name: "issuer-sync",       fn: jobIssuerSync,       interval: 30 * MINUTE },
  { name: "nft-sync",          fn: jobNFTSync,          interval: 30 * MINUTE },
  { name: "reputation-sync",   fn: jobReputationSync,   interval: 20 * MINUTE },
  { name: "stats-aggregation", fn: jobStatsAggregation, interval: HOUR },
  { name: "anomaly-check",     fn: jobAnomalyCheck,     interval: 2 * HOUR },
  { name: "cross-chain-stats", fn: jobCrossChainStats,  interval: 15 * MINUTE },
];

export function startScheduler() {
  log("Scheduler v1.4 starting...");

  // Run all jobs immediately on startup
  for (const job of jobs) {
    job.fn().catch(e => log(`${job.name} startup error: ${e.message}`));
  }

  // Schedule recurring runs
  for (const job of jobs) {
    setInterval(() => {
      job.fn().catch(e => log(`${job.name} error: ${e.message}`));
    }, job.interval);
    log(`Scheduled ${job.name} every ${job.interval / MINUTE}min`);
  }
}

// Run directly
if (process.argv[2] === "--start") {
  startScheduler();
}