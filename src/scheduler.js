/**
 * ProofLedger Verifier Scheduler — v1.5
 */
import Database from "better-sqlite3";
import { appendFileSync } from "fs";
import { syncIssuers }              from "./issuer-indexer.js";
import { syncNFTs }                 from "./nft-indexer.js";
import { syncReputationFromProofs } from "./reputation-indexer.js";
import { runHourlyAggregation }     from "./stats-aggregator.js";
import { runAnomalyChecks }         from "./anomaly-detector.js";
import { runHealthCheck }           from "./health-monitor.js";
import { syncCountersFromProofs }   from "./counter-indexer.js";
import { getMirrorStats }           from "./mirror-indexer.js";
import { getStakingStats }          from "./staking-indexer.js";
import { getAttestationStats }      from "./attestation-indexer.js";
import { getBridgeStats }           from "./bridge-indexer.js";
import { CONFIG }                   from "./config.js";

const DB_FILE = CONFIG.DB_FILE || "./proofs.db";
const LOG     = "./scheduler.log";
function log(msg) { const l = `[${new Date().toISOString()}] [SCHED] ${msg}`; console.log(l); try { appendFileSync(LOG, l + "\n"); } catch {} }
function getDb() { return new Database(DB_FILE); }

const MINUTE = 60_000;
const HOUR   = 60 * MINUTE;

const jobs = [
  { name: "health-check",      interval: 5  * MINUTE, fn: async () => { const db = getDb(); try { runHealthCheck(db); } finally { db.close(); } } },
  { name: "stats-aggregation", interval: HOUR,         fn: async () => { const db = getDb(); try { runHourlyAggregation(db); } finally { db.close(); } } },
  { name: "issuer-sync",       interval: 30 * MINUTE,  fn: async () => { const db = getDb(); try { await syncIssuers(db); } finally { db.close(); } } },
  { name: "nft-sync",          interval: 30 * MINUTE,  fn: async () => { const db = getDb(); try { await syncNFTs(db); } finally { db.close(); } } },
  { name: "reputation-sync",   interval: 20 * MINUTE,  fn: async () => { const db = getDb(); try { await syncReputationFromProofs(db); } finally { db.close(); } } },
  { name: "counter-sync",      interval: 15 * MINUTE,  fn: async () => { const db = getDb(); try { syncCountersFromProofs(db); } finally { db.close(); } } },
  { name: "anomaly-check",     interval: 2  * HOUR,    fn: async () => { const db = getDb(); try { runAnomalyChecks(db); } finally { db.close(); } } },
  { name: "cross-chain-stats", interval: 15 * MINUTE,  fn: async () => {
    const db = getDb();
    try {
      const mirrors = getMirrorStats(db);
      const stakes  = getStakingStats(db);
      const attests = getAttestationStats(db);
      const bridge  = getBridgeStats(db);
      log(`Mirrors:${mirrors.total} Stakes:${stakes.total} Attests:${attests.total} Bridge:${bridge.messages}`);
    } finally { db.close(); }
  }},
];

export function startScheduler() {
  log("Scheduler v1.5 starting...");
  for (const job of jobs) {
    job.fn().catch(e => log(`${job.name} startup error: ${e.message}`));
    setInterval(() => job.fn().catch(e => log(`${job.name} error: ${e.message}`)), job.interval);
    log(`Scheduled ${job.name} every ${job.interval / MINUTE}min`);
  }
}

if (process.argv[2] === "--start") { startScheduler(); }