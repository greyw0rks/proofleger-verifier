/**
 * ProofLedger Verifier Revocation Checker
 * Cross-references local proof records against the on-chain revocation registry
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [REVOKE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

async function isRevokedOnChain(hashHex) {
  const clean = hashHex.replace("0x", "");
  try {
    const res = await fetch(
      `${CONFIG.STACKS_API}/v2/contracts/call-read/${CONFIG.STACKS_CONTRACT}/revocations/is-revoked`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          sender:    CONFIG.STACKS_CONTRACT,
          arguments: ["0x0200000020" + clean],
        }),
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    // 0x03 = true in Clarity serialized bool
    return data.okay && data.result === "0x03";
  } catch { return false; }
}

export async function checkRevocations(db, limit = 100) {
  const verified = db.prepare(
    "SELECT txid, hash FROM proofs WHERE verified = 1 AND hash IS NOT NULL AND category = anchor LIMIT ?"
  ).all(limit);

  if (!verified.length) { log("No verified proofs to check"); return { revoked: 0, checked: 0 }; }

  log(`Checking ${verified.length} verified proofs for revocations...`);
  let revoked = 0;

  for (const row of verified) {
    const isRevoked = await isRevokedOnChain(row.hash);
    if (isRevoked) {
      db.prepare("UPDATE proofs SET verified = 2 WHERE txid = ?").run(row.txid);
      revoked++;
      log(`Revoked: ${row.hash.slice(0, 16)}...`);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  log(`Done: ${revoked} revocations found out of ${verified.length} checked`);
  return { revoked, checked: verified.length };
}

export async function getRevokedProofs(db) {
  return db.prepare("SELECT * FROM proofs WHERE verified = 2").all();
}