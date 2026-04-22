/**
 * ProofLedger Batch Verifier
 * Verify multiple hashes concurrently against the on-chain contract
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";
import { markVerified } from "./database.js";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [BATCH] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

async function verifySingle(hashHex) {
  const clean = hashHex.replace("0x", "");
  try {
    const res = await fetch(
      `${CONFIG.STACKS_API}/v2/contracts/call-read/${CONFIG.STACKS_CONTRACT}/proofleger3/get-doc`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sender: CONFIG.STACKS_CONTRACT, arguments: ["0x0200000020" + clean] }),
      }
    );
    if (res.status === 429) return null; // rate limited — skip
    if (!res.ok) return false;
    const data = await res.json();
    return data.okay && data.result && data.result !== "0x09";
  } catch { return false; }
}

export async function batchVerify(db, limit = 50, concurrency = 3) {
  const unverified = db.prepare(
    "SELECT txid, hash FROM proofs WHERE verified = 0 AND hash IS NOT NULL AND category = anchor LIMIT ?"
  ).all(limit);

  if (unverified.length === 0) {
    log("No unverified proofs in queue");
    return { verified: 0, failed: 0, skipped: 0 };
  }

  log(`Verifying ${unverified.length} proofs (concurrency: ${concurrency})...`);

  let verified = 0, failed = 0, skipped = 0;
  const delay = ms => new Promise(r => setTimeout(r, ms));

  // Process in concurrent batches
  for (let i = 0; i < unverified.length; i += concurrency) {
    const batch   = unverified.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(row => verifySingle(row.hash))
    );

    for (let j = 0; j < batch.length; j++) {
      const { txid } = batch[j];
      const result   = results[j];

      if (result.status === "rejected" || result.value === null) {
        skipped++;
      } else if (result.value === true) {
        markVerified(db, txid);
        verified++;
      } else {
        failed++;
      }
    }

    // Polite delay between batches to respect rate limits
    if (i + concurrency < unverified.length) await delay(2000);
  }

  log(`Done: ${verified} verified, ${failed} not found, ${skipped} skipped`);
  return { verified, failed, skipped };
}