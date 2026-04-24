/**
 * ProofLedger Profile Indexer
 * Mirrors on-chain wallet profiles into the local database for fast querying
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG_FILE = "./verifier.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [PROFILE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS profiles (
    address      TEXT PRIMARY KEY,
    display_name TEXT,
    bio          TEXT,
    website      TEXT,
    has_profile  INTEGER DEFAULT 0,
    anchor_count INTEGER DEFAULT 0,
    reputation   INTEGER DEFAULT 0,
    last_synced  TEXT
  );
`;

export function initProfilesTable(db) {
  db.exec(SCHEMA);
}

export async function fetchOnChainProfile(address) {
  try {
    const encodedAddr = "0x" + "0516" + Buffer.from(address).toString("hex");
    const res = await fetch(
      `${CONFIG.STACKS_API}/v2/contracts/call-read/${CONFIG.STACKS_CONTRACT}/profiles/get-profile`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          sender:    CONFIG.STACKS_CONTRACT,
          arguments: [encodedAddr],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.okay && data.result !== "0x09" ? data.result : null;
  } catch { return null; }
}

export function upsertProfile(db, address, data) {
  db.prepare(`
    INSERT INTO profiles (address, display_name, bio, website, has_profile, anchor_count, reputation, last_synced)
    VALUES (?, ?, ?, ?, 1, ?, ?, datetime("now"))
    ON CONFLICT(address) DO UPDATE SET
      display_name = excluded.display_name,
      bio          = excluded.bio,
      website      = excluded.website,
      has_profile  = 1,
      anchor_count = excluded.anchor_count,
      reputation   = excluded.reputation,
      last_synced  = excluded.last_synced
  `).run(address, data.displayName || "", data.bio || "", data.website || "",
         data.anchorCount || 0, data.reputation || 0);
}

export async function syncActiveWalletProfiles(db, limit = 50) {
  const wallets = db.prepare(
    "SELECT DISTINCT sender FROM proofs WHERE category = anchor ORDER BY block_height DESC LIMIT ?"
  ).all(limit);

  log(`Syncing profiles for ${wallets.length} wallets...`);
  let found = 0;

  for (const { sender } of wallets) {
    const profile = await fetchOnChainProfile(sender);
    if (profile) {
      upsertProfile(db, sender, { displayName: "Unknown", anchorCount: 0 });
      found++;
    }
    await new Promise(r => setTimeout(r, 800));
  }

  log(`Profile sync complete: ${found} profiles found`);
  return found;
}