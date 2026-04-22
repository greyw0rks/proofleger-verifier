/**
 * ProofLedger Verifier Timeline
 * Generate time-series data from the local proof database
 */

export function getDailyActivity(db, days = 30) {
  const rows = db.prepare(`
    SELECT
      DATE(timestamp) as date,
      COUNT(CASE WHEN category = anchor THEN 1 END) as anchors,
      COUNT(CASE WHEN category = attest THEN 1 END) as attests,
      COUNT(CASE WHEN category = mint   THEN 1 END) as mints,
      COUNT(DISTINCT sender) as unique_wallets
    FROM proofs
    WHERE timestamp IS NOT NULL
      AND timestamp >= DATE("now", "-" || ? || " days")
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `).all(days);
  return rows;
}

export function getWeeklyActivity(db, weeks = 12) {
  const rows = db.prepare(`
    SELECT
      STRFTIME("%Y-W%W", timestamp) as week,
      COUNT(*) as total,
      COUNT(DISTINCT sender) as unique_wallets
    FROM proofs
    WHERE timestamp IS NOT NULL
      AND timestamp >= DATE("now", "-" || ? || " days")
    GROUP BY STRFTIME("%Y-W%W", timestamp)
    ORDER BY week ASC
  `).all(weeks * 7);
  return rows;
}

export function getHourlyDistribution(db) {
  return db.prepare(`
    SELECT
      CAST(STRFTIME("%H", timestamp) AS INTEGER) as hour,
      COUNT(*) as count
    FROM proofs
    WHERE timestamp IS NOT NULL
    GROUP BY hour
    ORDER BY hour
  `).all();
}

export function getPeakBlocks(db, limit = 5) {
  return db.prepare(`
    SELECT block_height, COUNT(*) as tx_count
    FROM proofs
    WHERE block_height IS NOT NULL
    GROUP BY block_height
    ORDER BY tx_count DESC
    LIMIT ?
  `).all(limit);
}