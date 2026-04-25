/**
 * ProofLedger Verifier NFT Indexer
 * Track proof certificate NFT mints and ownership changes
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./nft-indexer.log";
const API  = CONFIG.STACKS_API || "https://api.hiro.so";
const C    = CONFIG.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";

function log(msg) {
  const line = `[${new Date().toISOString()}] [NFT] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureNFTTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nft_certs (
      token_id     INTEGER PRIMARY KEY,
      owner        TEXT NOT NULL,
      hash         TEXT,
      title        TEXT,
      doc_type     TEXT,
      minted_at    INTEGER,
      txid         TEXT,
      transferred  INTEGER NOT NULL DEFAULT 0,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

async function fetchNFTEvents(offset = 0) {
  try {
    const res = await fetch(
      `${API}/extended/v1/contract/${C}.proof-nft/events?limit=50&offset=${offset}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function syncNFTs(db) {
  ensureNFTTable(db);
  let offset = 0; let mints = 0; let transfers = 0;

  while (true) {
    const data = await fetchNFTEvents(offset);
    if (!data?.results?.length) break;

    for (const event of data.results) {
      if (event.event_type === "non_fungible_token_asset") {
        const asset = event.non_fungible_token_asset;
        if (!asset) continue;

        if (asset.asset_event_type === "mint") {
          db.prepare(`
            INSERT OR IGNORE INTO nft_certs (token_id, owner, minted_at, txid)
            VALUES (?, ?, ?, ?)
          `).run(
            parseInt(asset.value?.repr?.replace("u", "") || "0"),
            asset.recipient,
            event.block_height,
            event.tx_id,
          );
          mints++;
        } else if (asset.asset_event_type === "transfer") {
          db.prepare(`
            UPDATE nft_certs SET owner = ?, transferred = transferred + 1
            WHERE token_id = ?
          `).run(
            asset.recipient,
            parseInt(asset.value?.repr?.replace("u", "") || "0"),
          );
          transfers++;
        }
      }
    }

    if (data.results.length < 50) break;
    offset += 50;
    await new Promise(r => setTimeout(r, 400));
  }

  log(`Synced: ${mints} mints, ${transfers} transfers`);
  return { mints, transfers };
}

export function getNFTsByOwner(db, owner) {
  return db.prepare("SELECT * FROM nft_certs WHERE owner = ? ORDER BY minted_at DESC").all(owner);
}

export function getNFTStats(db) {
  const total     = db.prepare("SELECT COUNT(*) as c FROM nft_certs").get().c;
  const holders   = db.prepare("SELECT COUNT(DISTINCT owner) as c FROM nft_certs").get().c;
  const transfers = db.prepare("SELECT SUM(transferred) as s FROM nft_certs").get().s || 0;
  return { total, holders, transfers };
}