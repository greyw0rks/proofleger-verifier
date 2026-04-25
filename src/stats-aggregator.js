/**
 * ProofLedger Verifier Stats Aggregator
 * Compute and persist hourly protocol statistics snapshots
 */
import { appendFileSync } from "fs";

const AGG_LOG = "./aggregator.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [AGG] ${msg}`;
  console.log(line);
  try { appendFileSync(AGG_LOG, line + "\n"); } catch {}
}

export function computeStats(db) {
  const totalAnchors = db.prepare(
    "SELECT COUNT(*) as c FROM proofs WHERE category = anchor"
  ).get().c;

  const totalAttests = db.prepare(
    "SELECT COUNT(*) as c FROM proofs WHERE category = attest"
  ).get().c;

  const totalMints = db.prepare(
    "SELECT COUNT(*) as c FROM proofs WHERE category = mint"
  ).get().c;

  const totalSenders = db.prepare(
    "SELECT COUNT(DISTINCT sender) as c FROM proofs"
  ).get().c;

  const totalVerified = db.prepare(
    "SELECT COUNT(*) as c FROM proofs WHERE verified = 1"
  ).get().c;

  const last24hAnchors = db.prepare(`
    SELECT COUNT(*) as c FROM proofs
    WHERE category = anchor
      AND created_at >= DATETIME("now", "-1 day")
  `).get().c;

  let celoTotal = 0, celoWallets = 0;
  try {
    celoTotal   = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c;
    celoWallets = db.prepare("SELECT COUNT(DISTINCT from_address) as c FROM celo_proofs").get().c;
  } catch {}

  return {
    totalAnchors,
    totalAttests,
    totalMints,
    totalSenders,
    totalVerified,
    last24hAnchors,
    celoTotal,
    celoWallets,
    combinedTotal: (totalAnchors + totalAttests + totalMints) + celoTotal,
    computedAt:    new Date().toISOString(),
  };
}

export function persistSnapshot(db, stats) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats_snapshots (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      computed_at TEXT NOT NULL,
      total_anchors INTEGER,
      total_attests INTEGER,
      total_mints   INTEGER,
      total_senders INTEGER,
      total_verified INTEGER,
      last24h_anchors INTEGER,
      celo_total    INTEGER,
      combined_total INTEGER
    )
  `);

  db.prepare(`
    INSERT INTO stats_snapshots
      (computed_at, total_anchors, total_attests, total_mints,
       total_senders, total_verified, last24h_anchors, celo_total, combined_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    stats.computedAt,
    stats.totalAnchors,
    stats.totalAttests,
    stats.totalMints,
    stats.totalSenders,
    stats.totalVerified,
    stats.last24hAnchors,
    stats.celoTotal,
    stats.combinedTotal,
  );
}

export function runHourlyAggregation(db) {
  log("Starting hourly stats aggregation...");
  const stats = computeStats(db);
  persistSnapshot(db, stats);

  // Update live stats row
  db.prepare(`
    INSERT OR REPLACE INTO stats
      (id, total_anchors, total_attests, total_verified,
       total_senders, last_updated)
    VALUES (1, ?, ?, ?, ?, datetime("now"))
  `).run(
    stats.totalAnchors,
    stats.totalAttests,
    stats.totalVerified,
    stats.totalSenders,
  );

  log(`Done: ${stats.combinedTotal} total txs across Stacks + Celo`);
  return stats;
}