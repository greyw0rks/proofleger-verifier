/**
 * ProofLedger Verifier Cleanup
 * Archive and vacuum the database to keep it performant
 */
import { appendFileSync } from "fs";
const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [CLEANUP] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

export function vacuumDB(db) {
  log("Running VACUUM...");
  const before = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get()?.size || 0;
  db.prepare("VACUUM").run();
  const after  = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get()?.size || 0;
  const saved  = Math.max(0, before - after);
  log(`VACUUM complete. Saved ~${(saved/1024).toFixed(1)}KB`);
  return { beforeBytes: before, afterBytes: after, savedBytes: saved };
}

export function pruneOldLogs(db, keepDays = 30) {
  const cutoff = new Date(Date.now() - keepDays * 86400000).toISOString();
  const deleted = db.prepare(
    "DELETE FROM proofs WHERE created_at < ? AND verified = 0 AND category != anchor"
  ).run(cutoff);
  log(`Pruned ${deleted.changes} unverified non-anchor records older than ${keepDays} days`);
  return deleted.changes;
}

export function getDBSize(db) {
  try {
    const size = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()").get()?.size || 0;
    return { bytes: size, mb: (size / (1024*1024)).toFixed(2) };
  } catch { return { bytes: 0, mb: "0.00" }; }
}