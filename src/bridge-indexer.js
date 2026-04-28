/**
 * ProofLedger Verifier Bridge Indexer
 * Sync cross-chain-bridge.clar relay messages to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./bridge-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [BRIDGE] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureBridgeTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS relay_operators (
      operator      TEXT PRIMARY KEY,
      label         TEXT,
      registered_at INTEGER,
      active        INTEGER NOT NULL DEFAULT 1,
      relay_count   INTEGER NOT NULL DEFAULT 0,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    );
    CREATE TABLE IF NOT EXISTS relay_messages (
      message_id    INTEGER PRIMARY KEY,
      operator      TEXT NOT NULL,
      source_chain  TEXT,
      dest_chain    TEXT,
      payload_hash  TEXT,
      relayed_at    INTEGER,
      confirmed     INTEGER NOT NULL DEFAULT 0,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertOperator(db, entry) {
  db.prepare(`
    INSERT INTO relay_operators (operator, label, registered_at, active, relay_count)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(operator) DO UPDATE SET
      relay_count = excluded.relay_count,
      active      = excluded.active,
      indexed_at  = datetime("now")
  `).run(entry.operator, entry.label, entry.registeredAt, entry.relayCount || 0);
}

export function insertRelayMessage(db, msg) {
  db.prepare(`
    INSERT OR IGNORE INTO relay_messages
      (message_id, operator, source_chain, dest_chain, payload_hash, relayed_at, confirmed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    msg.messageId, msg.operator,
    msg.sourceChain, msg.destChain,
    msg.payloadHash, msg.relayedAt,
    msg.confirmed ? 1 : 0,
  );
  log(`Indexed relay message #${msg.messageId} ${msg.sourceChain}→${msg.destChain}`);
}

export function getBridgeStats(db) {
  ensureBridgeTables(db);
  const messages   = db.prepare("SELECT COUNT(*) as c FROM relay_messages").get().c;
  const confirmed  = db.prepare("SELECT COUNT(*) as c FROM relay_messages WHERE confirmed = 1").get().c;
  const operators  = db.prepare("SELECT COUNT(*) as c FROM relay_operators WHERE active = 1").get().c;
  return { messages, confirmed, pending: messages - confirmed, operators };
}