/**
 * ProofLedger Verifier Talent Protocol Indexer
 * Sync talent-verifier.clar attestations to SQLite
 */
import { appendFileSync } from "fs";
import { CONFIG } from "./config.js";

const LOG = "./talent-indexer.log";
const API  = CONFIG.STACKS_API || "https://api.hiro.so";
const C    = CONFIG.STACKS_CONTRACT || "SP1SY1E599GN04XRD2DQBKV7E62HYBJR2CT9S5QKK";

function log(msg) {
  const line = `[${new Date().toISOString()}] [TALENT] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureTalentTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS talent_attestations (
      address       TEXT PRIMARY KEY,
      builder_score INTEGER NOT NULL DEFAULT 0,
      passport_id   TEXT,
      attested_by   TEXT,
      attested_at   INTEGER,
      score_valid   INTEGER NOT NULL DEFAULT 1,
      last_updated  INTEGER,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    )
  `);
}

export function upsertTalentAttestation(db, entry) {
  db.prepare(`
    INSERT INTO talent_attestations
      (address, builder_score, passport_id, attested_by,
       attested_at, score_valid, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET
      builder_score = excluded.builder_score,
      passport_id   = excluded.passport_id,
      score_valid   = excluded.score_valid,
      last_updated  = excluded.last_updated,
      indexed_at    = datetime("now")
  `).run(
    entry.address,
    entry.builderScore,
    entry.passportId,
    entry.attestedBy,
    entry.attestedAt,
    entry.scoreValid ? 1 : 0,
    entry.lastUpdated,
  );
  log(`Upserted talent attestation: ${entry.address} score=${entry.builderScore}`);
}

export function getTalentAttestation(db, address) {
  ensureTalentTable(db);
  return db.prepare("SELECT * FROM talent_attestations WHERE address = ?").get(address);
}

export function getTopBuilders(db, limit = 20) {
  ensureTalentTable(db);
  return db.prepare(`
    SELECT * FROM talent_attestations
    WHERE score_valid = 1
    ORDER BY builder_score DESC
    LIMIT ?
  `).all(limit);
}

export function getTalentStats(db) {
  ensureTalentTable(db);
  const total   = db.prepare("SELECT COUNT(*) as c FROM talent_attestations").get().c;
  const valid   = db.prepare("SELECT COUNT(*) as c FROM talent_attestations WHERE score_valid = 1").get().c;
  const avgScore = db.prepare("SELECT AVG(builder_score) as avg FROM talent_attestations WHERE score_valid = 1").get().avg || 0;
  return { total, valid, avgScore: Math.round(avgScore) };
}