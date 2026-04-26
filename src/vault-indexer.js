/**
 * ProofLedger Verifier Vault Indexer
 * Track credential-vault.clar entries and access grants
 */
import { appendFileSync } from "fs";

const LOG = "./vault-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [VAULT] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureVaultTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vault_entries (
      vault_id     INTEGER PRIMARY KEY,
      owner        TEXT NOT NULL,
      cipher_ref   TEXT,
      doc_type     TEXT,
      created_at   INTEGER,
      access_count INTEGER NOT NULL DEFAULT 0,
      indexed_at   TEXT NOT NULL DEFAULT (datetime("now"))
    );
    CREATE TABLE IF NOT EXISTS vault_grants (
      vault_id    INTEGER NOT NULL,
      grantee     TEXT NOT NULL,
      granted_at  INTEGER,
      expires_at  INTEGER,
      active      INTEGER NOT NULL DEFAULT 1,
      indexed_at  TEXT NOT NULL DEFAULT (datetime("now")),
      PRIMARY KEY (vault_id, grantee)
    )
  `);
}

export function insertVaultEntry(db, entry) {
  db.prepare(`
    INSERT OR IGNORE INTO vault_entries
      (vault_id, owner, cipher_ref, doc_type, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(entry.vaultId, entry.owner, entry.cipherRef, entry.docType, entry.createdAt);
}

export function upsertGrant(db, grant) {
  db.prepare(`
    INSERT INTO vault_grants (vault_id, grantee, granted_at, expires_at, active)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(vault_id, grantee) DO UPDATE SET
      active     = excluded.active,
      expires_at = excluded.expires_at,
      indexed_at = datetime("now")
  `).run(grant.vaultId, grant.grantee, grant.grantedAt, grant.expiresAt, grant.active ? 1 : 0);
}

export function getVaultsByOwner(db, owner) {
  ensureVaultTables(db);
  return db.prepare(`
    SELECT ve.*, COUNT(vg.grantee) as grant_count
    FROM vault_entries ve
    LEFT JOIN vault_grants vg ON ve.vault_id = vg.vault_id AND vg.active = 1
    WHERE ve.owner = ?
    GROUP BY ve.vault_id
    ORDER BY ve.created_at DESC
  `).all(owner);
}

export function getVaultStats(db) {
  ensureVaultTables(db);
  const vaults  = db.prepare("SELECT COUNT(*) as c FROM vault_entries").get().c;
  const grants  = db.prepare("SELECT COUNT(*) as c FROM vault_grants WHERE active = 1").get().c;
  const owners  = db.prepare("SELECT COUNT(DISTINCT owner) as c FROM vault_entries").get().c;
  return { vaults, activeGrants: grants, owners };
}