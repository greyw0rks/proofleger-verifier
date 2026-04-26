/**
 * ProofLedger Verifier Governance Indexer
 * Sync governance.clar proposals and votes to SQLite
 */
import { appendFileSync } from "fs";

const LOG = "./governance-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [GOV] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureGovernanceTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS proposals (
      proposal_id   INTEGER PRIMARY KEY,
      title         TEXT,
      description   TEXT,
      proposer      TEXT,
      votes_for     INTEGER NOT NULL DEFAULT 0,
      votes_against INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER,
      closes_at     INTEGER,
      executed      INTEGER NOT NULL DEFAULT 0,
      passed        INTEGER NOT NULL DEFAULT 0,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now"))
    );
    CREATE TABLE IF NOT EXISTS governance_votes (
      proposal_id   INTEGER NOT NULL,
      voter         TEXT NOT NULL,
      weight        INTEGER NOT NULL DEFAULT 0,
      in_favor      INTEGER NOT NULL DEFAULT 1,
      voted_at      INTEGER,
      indexed_at    TEXT NOT NULL DEFAULT (datetime("now")),
      PRIMARY KEY (proposal_id, voter)
    )
  `);
}

export function upsertProposal(db, p) {
  db.prepare(`
    INSERT INTO proposals
      (proposal_id, title, description, proposer, votes_for, votes_against,
       created_at, closes_at, executed, passed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(proposal_id) DO UPDATE SET
      votes_for     = excluded.votes_for,
      votes_against = excluded.votes_against,
      executed      = excluded.executed,
      passed        = excluded.passed,
      indexed_at    = datetime("now")
  `).run(
    p.proposalId, p.title, p.description, p.proposer,
    p.votesFor, p.votesAgainst, p.createdAt, p.closesAt,
    p.executed ? 1 : 0, p.passed ? 1 : 0,
  );
}

export function insertVote(db, v) {
  db.prepare(`
    INSERT OR IGNORE INTO governance_votes
      (proposal_id, voter, weight, in_favor, voted_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(v.proposalId, v.voter, v.weight, v.inFavor ? 1 : 0, v.votedAt);
}

export function getProposals(db, options = {}) {
  ensureGovernanceTables(db);
  const { activeOnly = false, limit = 20 } = options;
  const clause = activeOnly ? "WHERE executed = 0" : "";
  return db.prepare(`SELECT * FROM proposals ${clause} ORDER BY proposal_id DESC LIMIT ?`).all(limit);
}

export function getProposalVotes(db, proposalId) {
  ensureGovernanceTables(db);
  return db.prepare("SELECT * FROM governance_votes WHERE proposal_id = ?").all(proposalId);
}

export function getGovernanceStats(db) {
  ensureGovernanceTables(db);
  const total   = db.prepare("SELECT COUNT(*) as c FROM proposals").get().c;
  const passed  = db.prepare("SELECT COUNT(*) as c FROM proposals WHERE passed = 1").get().c;
  const active  = db.prepare("SELECT COUNT(*) as c FROM proposals WHERE executed = 0").get().c;
  const voters  = db.prepare("SELECT COUNT(DISTINCT voter) as c FROM governance_votes").get().c;
  return { total, passed, active, voters };
}