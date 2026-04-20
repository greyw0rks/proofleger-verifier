/**
 * ProofLedger Celo Database Module
 * Separate table for Celo-chain proofs
 */

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS celo_proofs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    txid         TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    block_number INTEGER,
    timestamp    TEXT,
    gas_used     INTEGER,
    category     TEXT DEFAULT "anchor",
    verified     INTEGER DEFAULT 1,
    created_at   TEXT DEFAULT (datetime("now"))
  );
  CREATE INDEX IF NOT EXISTS idx_celo_from  ON celo_proofs(from_address);
  CREATE INDEX IF NOT EXISTS idx_celo_block ON celo_proofs(block_number);

  CREATE TABLE IF NOT EXISTS celo_sync_state (
    id           INTEGER PRIMARY KEY CHECK (id = 1),
    last_block   INTEGER DEFAULT 0,
    last_synced  TEXT
  );
  INSERT OR IGNORE INTO celo_sync_state (id) VALUES (1);
`;

export function initCeloDB(db) {
  db.exec(SCHEMA);
}

export function insertCeloProof(db, proof) {
  return db.prepare(`
    INSERT OR IGNORE INTO celo_proofs
      (txid, from_address, block_number, timestamp, gas_used, category, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(proof.txid, proof.from, proof.blockNumber, proof.timestamp,
         proof.gasUsed, proof.category || "anchor", 1);
}

export function getCeloSyncState(db) {
  return db.prepare("SELECT last_block FROM celo_sync_state WHERE id = 1").get();
}

export function setCeloSyncState(db, block) {
  db.prepare("UPDATE celo_sync_state SET last_block = ?, last_synced = ? WHERE id = 1")
    .run(block, new Date().toISOString());
}

export function getCeloStats(db) {
  const total   = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c;
  const wallets = db.prepare("SELECT COUNT(DISTINCT from_address) as c FROM celo_proofs").get().c;
  const recent  = db.prepare("SELECT * FROM celo_proofs ORDER BY block_number DESC LIMIT 5").all();
  return { total, wallets, recent };
}