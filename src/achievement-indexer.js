/**
 * ProofLedger Verifier Achievement Indexer
 * Sync achievement.clar awards to SQLite and compute who earns what
 */
import { appendFileSync } from "fs";

const LOG = "./achievement-indexer.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ACH] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
}

export function ensureAchievementTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      achievement_id  INTEGER PRIMARY KEY,
      name            TEXT NOT NULL,
      description     TEXT,
      threshold       INTEGER NOT NULL DEFAULT 1,
      action_type     TEXT NOT NULL DEFAULT "anchor"
    );
    CREATE TABLE IF NOT EXISTS user_achievements (
      holder          TEXT NOT NULL,
      achievement_id  INTEGER NOT NULL,
      earned_at       INTEGER,
      count_at_earn   INTEGER,
      indexed_at      TEXT NOT NULL DEFAULT (datetime("now")),
      PRIMARY KEY (holder, achievement_id)
    )
  `);

  // Seed default achievements
  const seeds = [
    [1, "First Anchor",     "Anchored your first document",     1,   "anchor"],
    [2, "Active Anchorer",  "Anchored 10 documents",            10,  "anchor"],
    [3, "Power User",       "Anchored 50 documents",            50,  "anchor"],
    [4, "Attester",         "Attested 5 credentials",           5,   "attest"],
    [5, "Verifier",         "Verified 20 hashes",               20,  "verify"],
    [6, "Early Adopter",    "Joined in first 1000 anchors",     1000, "anchor"],
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO achievements
      (achievement_id, name, description, threshold, action_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  seeds.forEach(s => stmt.run(...s));
}

export function checkAndAwardAchievements(db, address) {
  ensureAchievementTables(db);

  const anchors = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE sender = ? AND category = anchor").get(address)?.c || 0;
  const attests = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE sender = ? AND category = attest").get(address)?.c || 0;

  const achieves = db.prepare("SELECT * FROM achievements").all();
  const awarded  = [];

  for (const a of achieves) {
    // Skip if already has
    const has = db.prepare("SELECT 1 FROM user_achievements WHERE holder = ? AND achievement_id = ?").get(address, a.achievement_id);
    if (has) continue;

    let count = 0;
    if (a.action_type === "anchor") count = anchors;
    if (a.action_type === "attest") count = attests;

    if (count >= a.threshold) {
      db.prepare(`
        INSERT OR IGNORE INTO user_achievements
          (holder, achievement_id, earned_at, count_at_earn)
        VALUES (?, ?, ?, ?)
      `).run(address, a.achievement_id, Date.now(), count);
      awarded.push(a.name);
      log(`Awarded "${a.name}" to ${address}`);
    }
  }
  return awarded;
}

export function getUserAchievements(db, address) {
  ensureAchievementTables(db);
  return db.prepare(`
    SELECT a.*, ua.earned_at, ua.count_at_earn
    FROM user_achievements ua
    JOIN achievements a ON ua.achievement_id = a.achievement_id
    WHERE ua.holder = ?
    ORDER BY ua.earned_at DESC
  `).all(address);
}

export function getAchievementStats(db) {
  ensureAchievementTables(db);
  const total    = db.prepare("SELECT COUNT(*) as c FROM user_achievements").get().c;
  const holders  = db.prepare("SELECT COUNT(DISTINCT holder) as c FROM user_achievements").get().c;
  return { total, holders };
}