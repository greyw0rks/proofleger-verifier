/**
 * ProofLedger Verifier Deduplication
 * Find and remove duplicate txid entries from both tables
 */
import { appendFileSync } from "fs";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [DEDUP] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

export function findDuplicates(db) {
  const stacksDups = db.prepare(`
    SELECT txid, COUNT(*) as cnt FROM proofs
    GROUP BY txid HAVING cnt > 1
  `).all();

  let celoDups = [];
  try {
    celoDups = db.prepare(`
      SELECT txid, COUNT(*) as cnt FROM celo_proofs
      GROUP BY txid HAVING cnt > 1
    `).all();
  } catch {}

  return { stacks: stacksDups, celo: celoDups };
}

export function removeDuplicates(db) {
  const { stacks, celo } = findDuplicates(db);

  let removed = 0;
  for (const dup of stacks) {
    const rows = db.prepare("SELECT id FROM proofs WHERE txid = ? ORDER BY id").all(dup.txid);
    for (const row of rows.slice(1)) {
      db.prepare("DELETE FROM proofs WHERE id = ?").run(row.id);
      removed++;
    }
  }
  log(`Stacks: removed ${removed} duplicates`);

  let celoRemoved = 0;
  try {
    for (const dup of celo) {
      const rows = db.prepare("SELECT id FROM celo_proofs WHERE txid = ? ORDER BY id").all(dup.txid);
      for (const row of rows.slice(1)) {
        db.prepare("DELETE FROM celo_proofs WHERE id = ?").run(row.id);
        celoRemoved++;
      }
    }
    log(`Celo: removed ${celoRemoved} duplicates`);
  } catch {}

  return { stacksRemoved: removed, celoRemoved };
}