import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS referral_rewards (address TEXT PRIMARY KEY, amount INTEGER, claimed_at INTEGER);`);
const insert = db.prepare(`INSERT OR IGNORE INTO referral_rewards (address,amount,claimed_at) VALUES (@address,@amount,@claimed_at)`);
export async function syncRewards(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.referral-reward`,fromBlock); let count=0;
  for (const ev of evs) { if (ev.name==="rewards-claimed") { insert({address:ev.value.claimant,amount:Number(ev.value.amount),claimed_at:ev.block_height}); count++; } }
  return count;
}
export const getRewardStats = () => { const r=db.prepare("SELECT COUNT(*) as claimants, SUM(amount) as total FROM referral_rewards").get(); return {total_claimants:r.claimants,total_distributed:r.total??0}; };
export const getClaimInfo = (addr) => db.prepare("SELECT * FROM referral_rewards WHERE address=?").get(addr);