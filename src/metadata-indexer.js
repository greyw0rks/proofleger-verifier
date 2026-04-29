/**
 * ProofLedger Verifier Metadata Indexer
 * Sync metadata-registry.clar URI entries to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./metadata-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [META] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureMetadataTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata_entries (
      hash          TEXT PRIMARY KEY,
      uri           TEXT NOT NULL,
      content_type  TEXT,
      added_by      TEXT,
      added_at      INTEGER,
      pinned        INTEGER NOT NULL DEFAULT 0,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertMetadata(db, entry) {
  db.prepare(`
    INSERT INTO metadata_entries
      (hash, uri, content_type, added_by, added_at, pinned)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(hash) DO UPDATE SET
      uri          = excluded.uri,
      pinned       = excluded.pinned,
      indexed_at   = datetime("now")
  `).run(
    entry.hash,
    entry.uri,
    entry.contentType,
    entry.addedBy,
    entry.addedAt,
    entry.pinned ? 1 : 0,
  );
  log(`Upserted metadata: ${entry.hash?.slice(0, 14)}... → ${entry.uri?.slice(0, 30)}...`);
}

export function getMetadata(db, hash) {
  ensureMetadataTable(db);
  return db.prepare("SELECT * FROM metadata_entries WHERE hash = ?").get(hash);
}

export function getPinnedEntries(db) {
  ensureMetadataTable(db);
  return db.prepare("SELECT * FROM metadata_entries WHERE pinned = 1 ORDER BY added_at DESC").all();
}

export function getMetadataStats(db) {
  ensureMetadataTable(db);
  const total  = db.prepare("SELECT COUNT(*) as c FROM metadata_entries").get().c;
  const pinned = db.prepare("SELECT COUNT(*) as c FROM metadata_entries WHERE pinned = 1").get().c;
  const byType = db.prepare(`
    SELECT content_type, COUNT(*) as c
    FROM metadata_entries GROUP BY content_type ORDER BY c DESC LIMIT 5
  `).all();
  return { total, pinned, byType };
}