/**
 * ProofLedger Verifier Database
 * SQLite wrapper with typed queries
 */
import Database from "better-sqlite3";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS proofs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    txid         TEXT UNIQUE NOT NULL,
    contract     TEXT NOT NULL,
    function     TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT "other",
    sender       TEXT NOT NULL,
    hash         TEXT,
    title        TEXT,
    doc_type     TEXT,
    block_height INTEGER,
    timestamp    TEXT,
    verified     INTEGER DEFAULT 0,
    verified_at  TEXT,
    fee          INTEGER,
    created_at   TEXT DEFAULT (datetime("now"))
  );
  CREATE INDEX IF NOT EXISTS idx_hash     ON proofs(hash);
  CREATE INDEX IF NOT EXISTS idx_sender   ON proofs(sender);
  CREATE INDEX IF NOT EXISTS idx_verified ON proofs(verified);
  CREATE INDEX IF NOT EXISTS idx_category ON proofs(category);
  CREATE INDEX IF NOT EXISTS idx_block    ON proofs(block_height);

  CREATE TABLE IF NOT EXISTS sync_state (
    contract    TEXT PRIMARY KEY,
    last_offset INTEGER DEFAULT 0,
    last_synced TEXT
  );

  CREATE TABLE IF NOT EXISTS stats (
    id             INTEGER PRIMARY KEY CHECK (id = 1),
    total_anchors  INTEGER DEFAULT 0,
    total_attests  INTEGER DEFAULT 0,
    total_mints    INTEGER DEFAULT 0,
    total_verified INTEGER DEFAULT 0,
    total_senders  INTEGER DEFAULT 0,
    last_updated   TEXT
  );
  INSERT OR IGNORE INTO stats (id) VALUES (1);
`;

export function openDB(path = "./proofs.db") {
  const db = new Database(path);
  db.exec(SCHEMA);
  return db;
}

export function insertProof(db, proof) {
  return db.prepare(`
    INSERT OR IGNORE INTO proofs
      (txid, contract, function, category, sender, hash, title, doc_type,
       block_height, timestamp, verified, verified_at, fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    proof.txid, proof.contract, proof.function, proof.category, proof.sender,
    proof.hash, proof.title, proof.docType, proof.blockHeight, proof.timestamp,
    proof.verified ? 1 : 0, proof.verified ? new Date().toISOString() : null,
    proof.fee
  );
}

export function markVerified(db, txid) {
  db.prepare("UPDATE proofs SET verified = 1, verified_at = ? WHERE txid = ?")
    .run(new Date().toISOString(), txid);
}

export function getUnverified(db, limit = 50) {
  return db.prepare("SELECT * FROM proofs WHERE verified = 0 AND hash IS NOT NULL AND category = anchor LIMIT ?").all(limit);
}

export function getSyncState(db, contract) {
  return db.prepare("SELECT last_offset FROM sync_state WHERE contract = ?").get(contract);
}

export function setSyncState(db, contract, offset) {
  db.prepare("INSERT OR REPLACE INTO sync_state (contract, last_offset, last_synced) VALUES (?, ?, ?)")
    .run(contract, offset, new Date().toISOString());
}

export function refreshStats(db) {
  const anchors  = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE category = anchor").get().c;
  const attests  = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE category = attest").get().c;
  const mints    = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE category = mint").get().c;
  const verified = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 1").get().c;
  const senders  = db.prepare("SELECT COUNT(DISTINCT sender) as c FROM proofs").get().c;
  db.prepare("UPDATE stats SET total_anchors=?, total_attests=?, total_mints=?, total_verified=?, total_senders=?, last_updated=? WHERE id=1")
    .run(anchors, attests, mints, verified, senders, new Date().toISOString());
  return { anchors, attests, mints, verified, senders };
}