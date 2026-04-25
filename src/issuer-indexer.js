/**
 * ProofLedger Verifier Issuer Indexer
 * Sync on-chain issuer registrations to local SQLite for fast lookups
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./issuer-indexer.log";
const API  = CONFIG.STACKS_API || "https://api.hiro.so";
const C    = CONFIG.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ISSUER] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureIssuerTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS issuers (
      address      TEXT PRIMARY KEY,
      name         TEXT,
      url          TEXT,
      issuer_type  TEXT,
      verified     INTEGER NOT NULL DEFAULT 0,
      active       INTEGER NOT NULL DEFAULT 1,
      registered_block INTEGER,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

async function fetchIssuerEvents(offset = 0, limit = 50) {
  try {
    const res = await fetch(
      `${API}/extended/v1/contract/${C}.issuer-registry/events?limit=${limit}&offset=${offset}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function syncIssuers(db) {
  ensureIssuerTable(db);
  let offset = 0; let synced = 0;

  while (true) {
    const data = await fetchIssuerEvents(offset);
    if (!data?.results?.length) break;

    for (const event of data.results) {
      try {
        const cv = event.contract_log?.value?.repr;
        if (!cv) continue;

        // Parse self-register events
        if (event.event_type === "contract_log" && cv.includes("self-register")) {
          const address = event.tx?.sender_address;
          if (!address) continue;
          db.prepare(`
            INSERT OR IGNORE INTO issuers (address, registered_block)
            VALUES (?, ?)
          `).run(address, event.block_height);
          synced++;
        }
      } catch {}
    }

    if (data.results.length < limit) break;
    offset += limit;
    await new Promise(r => setTimeout(r, 500));
  }

  log(`Synced ${synced} issuer events`);
  return synced;
}

export function getIssuers(db, options = {}) {
  const { verifiedOnly = false, limit = 50 } = options;
  const clause = verifiedOnly ? "WHERE verified = 1 AND active = 1" : "WHERE active = 1";
  return db.prepare(`SELECT * FROM issuers ${clause} ORDER BY registered_block DESC LIMIT ?`).all(limit);
}

export function getIssuer(db, address) {
  return db.prepare("SELECT * FROM issuers WHERE address = ?").get(address);
}