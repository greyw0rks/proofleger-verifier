/**
 * ProofLedger Verifier Reputation Indexer
 * Pull reputation scores from the reputation.clar contract
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./reputation-indexer.log";
const API  = CONFIG.STACKS_API || "https://api.hiro.so";
const C    = CONFIG.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";

function log(msg) {
  const line = `[${new Date().toISOString()}] [REP] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureReputationTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reputation (
      address       TEXT PRIMARY KEY,
      anchor_count  INTEGER NOT NULL DEFAULT 0,
      attest_count  INTEGER NOT NULL DEFAULT 0,
      slash_count   INTEGER NOT NULL DEFAULT 0,
      score         INTEGER NOT NULL DEFAULT 0,
      last_updated  INTEGER,
      synced_at     TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export async function fetchScore(address) {
  try {
    const res = await fetch(
      `${API}/v2/contracts/call-read/${C}/reputation/get-score`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: C,
          arguments: [`0x${Buffer.from(address).toString("hex")}`],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch { return null; }
}

export function upsertScore(db, address, scoreData) {
  db.prepare(`
    INSERT INTO reputation (address, anchor_count, attest_count, slash_count, score, synced_at)
    VALUES (?, ?, ?, ?, ?, datetime("now"))
    ON CONFLICT(address) DO UPDATE SET
      anchor_count = excluded.anchor_count,
      attest_count = excluded.attest_count,
      slash_count  = excluded.slash_count,
      score        = excluded.score,
      synced_at    = excluded.synced_at
  `).run(
    address,
    scoreData.anchorCount || 0,
    scoreData.attestCount || 0,
    scoreData.slashCount  || 0,
    scoreData.score       || 0,
  );
}

export function getTopScores(db, limit = 20) {
  ensureReputationTable(db);
  return db.prepare(`
    SELECT * FROM reputation
    WHERE score > 0
    ORDER BY score DESC
    LIMIT ?
  `).all(limit);
}

export function getScore(db, address) {
  ensureReputationTable(db);
  return db.prepare("SELECT * FROM reputation WHERE address = ?").get(address);
}

export async function syncReputationFromProofs(db) {
  ensureReputationTable(db);
  // Derive scores from local proof records — no extra API calls needed
  const wallets = db.prepare(`
    SELECT sender,
      SUM(CASE WHEN category = "anchor" THEN 1 ELSE 0 END) as anchors,
      SUM(CASE WHEN category = "attest" THEN 1 ELSE 0 END) as attests
    FROM proofs
    GROUP BY sender
  `).all();

  let synced = 0;
  for (const w of wallets) {
    const score = w.anchors * 10 + w.attests * 5;
    db.prepare(`
      INSERT INTO reputation (address, anchor_count, attest_count, score, synced_at)
      VALUES (?, ?, ?, ?, datetime("now"))
      ON CONFLICT(address) DO UPDATE SET
        anchor_count = excluded.anchor_count,
        attest_count = excluded.attest_count,
        score        = excluded.score,
        synced_at    = excluded.synced_at
    `).run(w.sender, w.anchors, w.attests, score);
    synced++;
  }
  log(`Synced ${synced} reputation records from local proofs`);
  return synced;
}