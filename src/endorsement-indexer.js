/**
 * ProofLedger Endorsement Indexer
 * Indexes on-chain endorsement activity for anchored documents
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ENDORSE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS endorsements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    hash         TEXT NOT NULL,
    endorser     TEXT NOT NULL,
    weight       INTEGER DEFAULT 1,
    comment      TEXT,
    block_height INTEGER,
    created_at   TEXT DEFAULT (datetime("now")),
    UNIQUE(hash, endorser)
  );
  CREATE INDEX IF NOT EXISTS idx_endorse_hash ON endorsements(hash);
`;

export function initEndorsementsTable(db) {
  db.exec(SCHEMA);
}

export async function fetchEndorsementCount(hashHex) {
  const clean = hashHex.replace("0x", "");
  try {
    const res = await fetch(
      `${CONFIG.STACKS_API}/v2/contracts/call-read/${CONFIG.STACKS_CONTRACT}/endorsements/get-endorsement-count`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          sender:    CONFIG.STACKS_CONTRACT,
          arguments: ["0x0200000020" + clean],
        }),
      }
    );
    if (!res.ok) return 0;
    const data = await res.json();
    if (!data.okay || !data.result) return 0;
    return parseInt(data.result.replace("0x", ""), 16) || 0;
  } catch { return 0; }
}

export async function syncEndorsementsForTopProofs(db, limit = 20) {
  const topProofs = db.prepare(
    "SELECT hash FROM proofs WHERE verified = 1 AND category = anchor AND hash IS NOT NULL ORDER BY block_height DESC LIMIT ?"
  ).all(limit);

  log(`Syncing endorsement counts for ${topProofs.length} proofs...`);
  let updated = 0;

  for (const row of topProofs) {
    const count = await fetchEndorsementCount(row.hash);
    if (count > 0) {
      db.prepare(
        "UPDATE proofs SET verified = 1 WHERE hash LIKE ? AND verified = 1"
      ).run(`%${row.hash}%`);
      updated++;
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  log(`Endorsement sync done: ${updated} proofs with endorsements`);
  return updated;
}