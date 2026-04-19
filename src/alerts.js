/**
 * ProofLedger Verifier Alerts
 * Detects unusual patterns and logs alerts
 */
import { appendFileSync } from "fs";
const ALERT_LOG = "./alerts.log";

function alert(level, msg, data = {}) {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), level, msg, ...data });
  console.warn(`[ALERT:${level}] ${msg}`);
  appendFileSync(ALERT_LOG, line + "\n");
}

export function checkHighVolume(db, thresholdPerHour = 100) {
  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const count = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE created_at > ?").get(hourAgo).c;
  if (count > thresholdPerHour) {
    alert("WARN", `High transaction volume: ${count} txs in last hour`, { count, threshold: thresholdPerHour });
  }
  return count;
}

export function checkNewSender(db, sender) {
  const existing = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE sender = ?").get(sender).c;
  if (existing === 1) {
    alert("INFO", "New sender detected", { sender });
  }
}

export function checkUnverifiedBacklog(db, threshold = 100) {
  const unverified = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 0 AND category = \"anchor\"").get().c;
  if (unverified > threshold) {
    alert("WARN", `Large unverified backlog: ${unverified} proofs`, { unverified, threshold });
  }
  return unverified;
}

export function checkSyncHealth(db) {
  const states = db.prepare("SELECT * FROM sync_state").all();
  for (const s of states) {
    const lastSync = new Date(s.last_synced);
    const ageMinutes = (Date.now() - lastSync.getTime()) / 60000;
    if (ageMinutes > 30) {
      alert("WARN", `Sync stale for ${s.contract}`, { contract: s.contract, ageMinutes: Math.round(ageMinutes) });
    }
  }
}