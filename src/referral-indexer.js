import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS referrals (referee TEXT PRIMARY KEY, referrer TEXT, rewarded INTEGER DEFAULT 0, block_height INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
const upsert = db.prepare(`INSERT OR IGNORE INTO referrals (referee,referrer,block_height) VALUES (@referee,@referrer,@block_height)`);
export async function syncReferrals(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.referral-registry`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="referral-registered") { upsert({referee:ev.value.referee,referrer:ev.value.referrer,block_height:ev.block_height}); count++; }
    else if (ev.name==="reward-claimed") { db.prepare("UPDATE referrals SET rewarded=1 WHERE referee=?").run(ev.value.referee); count++; }
  }
  return count;
}
export const getReferralStats = (addr) => ({ referred_by: db.prepare("SELECT referrer FROM referrals WHERE referee=?").get(addr)?.referrer??null, referral_count: db.prepare("SELECT COUNT(*) as c FROM referrals WHERE referrer=?").get(addr)?.c??0 });
export const getReferralLeaderboard = (limit=10) => db.prepare("SELECT referrer, COUNT(*) as count FROM referrals GROUP BY referrer ORDER BY count DESC LIMIT ?").all(limit);