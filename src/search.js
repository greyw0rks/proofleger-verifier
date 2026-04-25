/**
 * ProofLedger Verifier Search
 * Full-text search across proofs by hash fragment, title, or sender
 */

export function searchProofs(db, query, options = {}) {
  const {
    limit   = 20,
    offset  = 0,
    category = null,
    chain   = "stacks", // "stacks" | "celo" | "all"
  } = options;

  if (!query || query.trim().length < 2) return { results: [], total: 0 };

  const term = `%${query.trim()}%`;
  const results = [];
  let total = 0;

  if (chain !== "celo") {
    const catClause = category ? `AND category = ` : "";
    const rows = db.prepare(`
      SELECT *, stacks as chain
      FROM proofs
      WHERE (hash LIKE ? OR title LIKE ? OR sender LIKE ?)
        ${catClause}
      ORDER BY block_height DESC
      LIMIT ? OFFSET ?
    `).all(term, term, term, limit, offset);

    const countRow = db.prepare(`
      SELECT COUNT(*) as c FROM proofs
      WHERE (hash LIKE ? OR title LIKE ? OR sender LIKE ?)
        ${catClause}
    `).get(term, term, term);

    results.push(...rows);
    total += countRow.c;
  }

  if (chain !== "stacks") {
    try {
      const celoRows = db.prepare(`
        SELECT *, celo as chain
        FROM celo_proofs
        WHERE (hash LIKE ? OR from_address LIKE ? OR tx_hash LIKE ?)
        ORDER BY block_number DESC
        LIMIT ? OFFSET ?
      `).all(term, term, term, limit, offset);

      const celoCount = db.prepare(`
        SELECT COUNT(*) as c FROM celo_proofs
        WHERE (hash LIKE ? OR from_address LIKE ? OR tx_hash LIKE ?)
      `).get(term, term, term);

      results.push(...celoRows);
      total += celoCount.c;
    } catch {}
  }

  return {
    results: results.slice(0, limit),
    total,
    query,
    chain,
  };
}

export function getRecentByAddress(db, address, limit = 50) {
  const stacks = db.prepare(`
    SELECT *, stacks as chain FROM proofs
    WHERE sender = ?
    ORDER BY block_height DESC LIMIT ?
  `).all(address, limit);

  let celo = [];
  try {
    celo = db.prepare(`
      SELECT *, celo as chain FROM celo_proofs
      WHERE from_address = ?
      ORDER BY block_number DESC LIMIT ?
    `).all(address, limit);
  } catch {}

  return {
    address,
    stacks,
    celo,
    total: stacks.length + celo.length,
  };
}