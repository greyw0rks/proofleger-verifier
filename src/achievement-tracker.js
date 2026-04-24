/**
 * ProofLedger Achievement Tracker
 * Tracks wallet activity thresholds and flags when achievements are earned
 */
import { appendFileSync } from "fs";

const LOG_FILE  = "./verifier.log";
const ACHV_LOG  = "./achievements.log";

function log(msg) {
  const line = `[${new Date().toISOString()}] [ACHV] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + "\n"); } catch {}
}

const MILESTONES = [
  { type: "first-anchor",  category: "anchor", threshold: 1   },
  { type: "power-user",    category: "anchor", threshold: 10  },
  { type: "century",       category: "anchor", threshold: 100 },
  { type: "first-attest",  category: "attest", threshold: 1   },
  { type: "super-attester",category: "attest", threshold: 25  },
];

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS earned_achievements (
    address        TEXT NOT NULL,
    achievement    TEXT NOT NULL,
    earned_at      TEXT DEFAULT (datetime("now")),
    notified       INTEGER DEFAULT 0,
    PRIMARY KEY(address, achievement)
  );
`;

export function initAchievementsTable(db) {
  db.exec(SCHEMA);
}

export function checkAllAchievements(db) {
  const newlyEarned = [];

  for (const milestone of MILESTONES) {
    const wallets = db.prepare(`
      SELECT sender, COUNT(*) as cnt
      FROM proofs
      WHERE category = ?
      GROUP BY sender
      HAVING cnt >= ?
    `).all(milestone.category, milestone.threshold);

    for (const { sender } of wallets) {
      const alreadyEarned = db.prepare(
        "SELECT 1 FROM earned_achievements WHERE address = ? AND achievement = ?"
      ).get(sender, milestone.type);

      if (!alreadyEarned) {
        db.prepare(
          "INSERT OR IGNORE INTO earned_achievements (address, achievement) VALUES (?, ?)"
        ).run(sender, milestone.type);

        const entry = { address: sender, achievement: milestone.type, earnedAt: new Date().toISOString() };
        newlyEarned.push(entry);
        log(`New achievement: ${milestone.type} → ${sender.slice(0, 12)}...`);
        try { appendFileSync(ACHV_LOG, JSON.stringify(entry) + "\n"); } catch {}
      }
    }
  }

  return newlyEarned;
}

export function getPendingNotifications(db) {
  return db.prepare(
    "SELECT * FROM earned_achievements WHERE notified = 0"
  ).all();
}

export function markNotified(db, address, achievement) {
  db.prepare(
    "UPDATE earned_achievements SET notified = 1 WHERE address = ? AND achievement = ?"
  ).run(address, achievement);
}