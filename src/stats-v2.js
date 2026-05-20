import db from "./database.js";
export function getProtocolStatsV2() {
  const tables = ["marketplace_listings","proof_stamps","proof_certifications","referrals","staking_v2","governance_v2_proposals","vote_delegations"];
  const result = {};
  for (const t of tables) {
    try { result[t] = db.prepare(`SELECT COUNT(*) as count FROM ${t}`).get()?.count ?? 0; }
    catch (_) { result[t] = 0; }
  }
  result.active_listings = db.prepare("SELECT COUNT(*) as c FROM marketplace_listings WHERE active=1").get()?.c ?? 0;
  result.active_stakes = db.prepare("SELECT COUNT(*) as c FROM staking_v2 WHERE active=1").get()?.c ?? 0;
  result.open_proposals = db.prepare("SELECT COUNT(*) as c FROM governance_v2_proposals WHERE executed=0").get()?.c ?? 0;
  return result;
}