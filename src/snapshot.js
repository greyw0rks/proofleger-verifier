/**
 * ProofLedger Verifier Snapshot
 * Export full database to a timestamped JSON backup file
 */
import { writeFileSync, mkdirSync } from "fs";
import { appendFileSync } from "fs";
import Database from "better-sqlite3";

const SNAPSHOT_DIR = "./snapshots";
const LOG          = "./snapshot.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [SNAP] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function takeSnapshot(dbPath = "./proofs.db") {
  const db = new Database(dbPath, { readonly: true });

  const tables = [
    "proofs", "stats", "issuers", "batch_submissions",
    "nft_certs", "delegations", "reputation", "webhooks",
    "stats_snapshots",
  ];

  const snapshot = {
    version:     "1.0",
    capturedAt:  new Date().toISOString(),
    tables:      {},
  };

  for (const table of tables) {
    try {
      snapshot.tables[table] = db.prepare(`SELECT * FROM ${table}`).all();
    } catch {
      snapshot.tables[table] = [];
    }
  }

  db.close();

  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const fname  = `${SNAPSHOT_DIR}/snapshot_${Date.now()}.json`;
  const bytes  = JSON.stringify(snapshot, null, 2);
  writeFileSync(fname, bytes);

  const total = Object.values(snapshot.tables).reduce((s, t) => s + t.length, 0);
  log(`Snapshot written: ${fname} (${total} rows, ${(bytes.length / 1024).toFixed(1)} KB)`);
  return fname;
}

// Run directly
if (process.argv[2] === "--run") {
  const fname = takeSnapshot();
  console.log("Snapshot saved:", fname);
}