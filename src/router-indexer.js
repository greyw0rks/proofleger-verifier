/**
 * ProofLedger Verifier Router Indexer
 * Parse proof-router.clar events and cross-reference with proof records
 */
import { appendFileSync } from "fs";

const LOG = "./router-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ROUTER] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureRouterTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS routed_anchors (
      route_id     INTEGER PRIMARY KEY,
      caller       TEXT NOT NULL,
      hash         TEXT,
      target       TEXT,
      routed_at    INTEGER,
      matched_proof INTEGER NOT NULL DEFAULT 0,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function insertRoutedAnchor(db, entry) {
  // Cross-reference: check if this hash exists in proofs
  let matched = 0;
  try {
    const proof = db.prepare("SELECT id FROM proofs WHERE hash = ? LIMIT 1").get(entry.hash);
    matched = proof ? 1 : 0;
  } catch {}

  db.prepare(`
    INSERT OR IGNORE INTO routed_anchors
      (route_id, caller, hash, target, routed_at, matched_proof)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.routeId,
    entry.caller,
    entry.hash,
    entry.target,
    entry.routedAt,
    matched,
  );

  if (!matched) {
    log(`Unmatched route ${entry.routeId}: hash ${entry.hash?.slice(0, 16)}... not in proofs`);
  }
}

export function getUnmatchedRoutes(db, limit = 20) {
  ensureRouterTable(db);
  return db.prepare(`
    SELECT * FROM routed_anchors
    WHERE matched_proof = 0
    ORDER BY routed_at DESC
    LIMIT ?
  `).all(limit);
}

export function getRouterStats(db) {
  ensureRouterTable(db);
  const total     = db.prepare("SELECT COUNT(*) as c FROM routed_anchors").get().c;
  const matched   = db.prepare("SELECT COUNT(*) as c FROM routed_anchors WHERE matched_proof = 1").get().c;
  const unmatched = total - matched;
  return { total, matched, unmatched };
}