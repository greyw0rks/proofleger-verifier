/**
 * ProofLedger Verifier Search
 * Flexible search across Stacks and Celo proof records
 */
export function search(db, query, options = {}) {
  const { limit = 20, network = "all", category } = options;
  const q = `%${query.trim()}%`;
  const results = [];

  if (network === "all" || network === "stacks") {
    let sql = "SELECT *, stacks as network FROM proofs WHERE (title LIKE ? OR hash LIKE ? OR sender LIKE ? OR txid LIKE ?)";
    const params = [q, q, q, q];
    if (category) { sql += " AND category = ?"; params.push(category); }
    sql += " ORDER BY block_height DESC LIMIT ?";
    params.push(limit);
    results.push(...db.prepare(sql).all(...params));
  }

  if (network === "all" || network === "celo") {
    try {
      let sql = "SELECT *, celo as network FROM celo_proofs WHERE (from_address LIKE ? OR txid LIKE ?)";
      const params = [q, q];
      sql += " ORDER BY block_number DESC LIMIT ?";
      params.push(limit);
      results.push(...db.prepare(sql).all(...params));
    } catch {}
  }

  return results
    .sort((a, b) => (b.block_height || b.block_number || 0) - (a.block_height || a.block_number || 0))
    .slice(0, limit);
}

export function searchByWallet(db, address) {
  const stacks = db.prepare("SELECT *, stacks as network FROM proofs WHERE sender = ? ORDER BY block_height DESC LIMIT 100").all(address);
  let celo = [];
  try { celo = db.prepare("SELECT *, celo as network FROM celo_proofs WHERE from_address = ? ORDER BY block_number DESC LIMIT 100").all(address); }
  catch {}
  return { stacks, celo, total: stacks.length + celo.length };
}

export function getTopWallets(db, limit = 10) {
  return db.prepare(`
    SELECT sender as address, COUNT(*) as anchor_count,
           SUM(CASE WHEN category = "attest" THEN 1 ELSE 0 END) as attest_count
    FROM proofs
    WHERE category IN ("anchor","attest")
    GROUP BY sender
    ORDER BY anchor_count DESC
    LIMIT ?
  `).all(limit);
}