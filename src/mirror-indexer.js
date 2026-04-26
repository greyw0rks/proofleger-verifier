/**
 * ProofLedger Verifier Mirror Indexer
 * Sync proof-mirror.clar events — cross-chain Stacks↔Celo records
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./mirror-indexer.log";
const API  = CONFIG.STACKS_API || "https://api.hiro.so";
const C    = CONFIG.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";

function log(msg) {
  const line = `[${new Date().toISOString()}] [MIRROR] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureMirrorTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS proof_mirrors (
      stacks_hash   TEXT PRIMARY KEY,
      celo_tx       TEXT,
      celo_block    INTEGER,
      mirror_agent  TEXT,
      mirrored_at   INTEGER,
      confirmed     INTEGER NOT NULL DEFAULT 0,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertMirror(db, entry) {
  db.prepare(`
    INSERT INTO proof_mirrors
      (stacks_hash, celo_tx, celo_block, mirror_agent, mirrored_at, confirmed)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(stacks_hash) DO UPDATE SET
      confirmed  = excluded.confirmed,
      indexed_at = datetime("now")
  `).run(
    entry.stacksHash,
    entry.celoTx,
    entry.celoBlock,
    entry.mirrorAgent,
    entry.mirroredAt,
    entry.confirmed ? 1 : 0,
  );
}

export function getMirror(db, stacksHash) {
  ensureMirrorTable(db);
  return db.prepare("SELECT * FROM proof_mirrors WHERE stacks_hash = ?").get(stacksHash);
}

export function getConfirmedMirrors(db, limit = 50) {
  ensureMirrorTable(db);
  return db.prepare(`
    SELECT * FROM proof_mirrors
    WHERE confirmed = 1
    ORDER BY mirrored_at DESC
    LIMIT ?
  `).all(limit);
}

export function getMirrorStats(db) {
  ensureMirrorTable(db);
  const total     = db.prepare("SELECT COUNT(*) as c FROM proof_mirrors").get().c;
  const confirmed = db.prepare("SELECT COUNT(*) as c FROM proof_mirrors WHERE confirmed = 1").get().c;
  const agents    = db.prepare("SELECT COUNT(DISTINCT mirror_agent) as c FROM proof_mirrors").get().c;
  return { total, confirmed, pending: total - confirmed, agents };
}