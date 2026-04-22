/**
 * ProofLedger Verifier Leaderboard
 * Build wallet rankings from the local proof database
 */

export function buildLeaderboard(db, limit = 20) {
  const rows = db.prepare(`
    SELECT
      sender as address,
      COUNT(CASE WHEN category = anchor THEN 1 END) as anchors,
      COUNT(CASE WHEN category = attest THEN 1 END) as attests,
      COUNT(CASE WHEN category = mint   THEN 1 END) as mints,
      COUNT(*) as total,
      MIN(block_height) as first_block,
      MAX(block_height) as last_block
    FROM proofs
    WHERE category IN (anchor,attest,mint)
    GROUP BY sender
    ORDER BY (COUNT(CASE WHEN category="anchor" THEN 1 END)*10
            + COUNT(CASE WHEN category="attest" THEN 1 END)*5
            + COUNT(CASE WHEN category="mint"   THEN 1 END)*25) DESC
    LIMIT ?
  `).all(limit);

  return rows.map((r, i) => ({
    rank:       i + 1,
    address:    r.address,
    anchors:    r.anchors,
    attests:    r.attests,
    mints:      r.mints,
    total:      r.total,
    score:      r.anchors * 10 + r.attests * 5 + r.mints * 25,
    firstBlock: r.first_block,
    lastBlock:  r.last_block,
  }));
}

export function getWalletRank(db, address) {
  const all = buildLeaderboard(db, 1000);
  const entry = all.find(e => e.address === address);
  return entry || null;
}

export function getTopDocTypes(db, limit = 10) {
  return db.prepare(`
    SELECT doc_type, COUNT(*) as count
    FROM proofs
    WHERE doc_type IS NOT NULL AND category = anchor
    GROUP BY doc_type
    ORDER BY count DESC
    LIMIT ?
  `).all(limit);
}