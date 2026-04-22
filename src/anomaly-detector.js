/**
 * ProofLedger Verifier Anomaly Detector
 * Flag unusual patterns: burst submissions, duplicate titles, new high-volume wallets
 */
import { appendFileSync } from "fs";

const ANOMALY_LOG = "./anomalies.log";

function flag(type, data) {
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), type, ...data });
  console.warn(`[ANOMALY:${type}]`, data);
  try { appendFileSync(ANOMALY_LOG, entry + "\n"); } catch {}
  return entry;
}

export function detectBursts(db, windowMinutes = 60, threshold = 50) {
  const cutoff = new Date(Date.now() - windowMinutes * 60000).toISOString();
  const rows   = db.prepare(`
    SELECT sender, COUNT(*) as count
    FROM proofs
    WHERE created_at >= ?
    GROUP BY sender
    HAVING count >= ?
    ORDER BY count DESC
  `).all(cutoff, threshold);

  return rows.map(r => flag("burst", { sender: r.sender, count: r.count, windowMinutes }));
}

export function detectDuplicateTitles(db, limit = 20) {
  const rows = db.prepare(`
    SELECT title, COUNT(*) as count, COUNT(DISTINCT sender) as wallets
    FROM proofs
    WHERE title IS NOT NULL AND category = anchor
    GROUP BY title
    HAVING count > 3
    ORDER BY count DESC
    LIMIT ?
  `).all(limit);

  return rows.map(r => flag("duplicate-title", { title: r.title, count: r.count, wallets: r.wallets }));
}

export function detectNewHighVolume(db, minTxs = 20) {
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const rows = db.prepare(`
    SELECT sender, COUNT(*) as count, MIN(created_at) as first_seen
    FROM proofs
    WHERE created_at >= ?
    GROUP BY sender
    HAVING count >= ? AND first_seen >= ?
    ORDER BY count DESC
  `).all(oneDayAgo, minTxs, oneDayAgo);

  return rows.map(r => flag("new-high-volume",
    { sender: r.sender, count: r.count, firstSeen: r.first_seen }));
}

export function runAnomalyChecks(db) {
  const bursts  = detectBursts(db);
  const dupTitles = detectDuplicateTitles(db);
  const newHV   = detectNewHighVolume(db);
  return { bursts: bursts.length, duplicateTitles: dupTitles.length, newHighVolume: newHV.length };
}