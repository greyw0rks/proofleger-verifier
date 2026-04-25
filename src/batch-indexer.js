/**
 * ProofLedger Verifier Batch Indexer
 * Expand proof-batch submissions into individual proof records
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./batch-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [BATCH-IDX] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureBatchTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS batch_submissions (
      batch_id     INTEGER NOT NULL,
      index_       INTEGER NOT NULL,
      txid         TEXT,
      hash         TEXT,
      title        TEXT,
      doc_type     TEXT,
      submitter    TEXT,
      block_height INTEGER,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now")),
      PRIMARY KEY (batch_id, index_)
    )
  `);
}

export function insertBatchEntry(db, entry) {
  db.prepare(`
    INSERT OR IGNORE INTO batch_submissions
      (batch_id, index_, txid, hash, title, doc_type, submitter, block_height)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.batchId,
    entry.index,
    entry.txid,
    entry.hash,
    entry.title,
    entry.docType,
    entry.submitter,
    entry.blockHeight,
  );
}

export function getBatchSubmissions(db, limit = 50) {
  return db.prepare(`
    SELECT * FROM batch_submissions
    ORDER BY block_height DESC, batch_id DESC
    LIMIT ?
  `).all(limit);
}

export function getBatchById(db, batchId) {
  return db.prepare(`
    SELECT * FROM batch_submissions
    WHERE batch_id = ?
    ORDER BY index_ ASC
  `).all(batchId);
}

export function getBatchStats(db) {
  const total  = db.prepare("SELECT COUNT(*) as c FROM batch_submissions").get().c;
  const batches = db.prepare("SELECT COUNT(DISTINCT batch_id) as c FROM batch_submissions").get().c;
  return { totalEntries: total, totalBatches: batches };
}