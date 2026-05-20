import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS staking_v2 (address TEXT PRIMARY KEY, amount INTEGER, lock_cycles INTEGER, start_block INTEGER, unlock_block INTEGER, auto_renew INTEGER DEFAULT 0, active INTEGER DEFAULT 1, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
const upsert = db.prepare(`INSERT OR REPLACE INTO staking_v2 (address,amount,lock_cycles,start_block,unlock_block,auto_renew) VALUES (@address,@amount,@lock_cycles,@start_block,@unlock_block,@auto_renew)`);
export async function syncStakingV2(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.staking-v2`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="staked") { upsert({address:ev.value.staker,amount:Number(ev.value.amount),lock_cycles:Number(ev.value["lock-cycles"]??1),start_block:ev.block_height,unlock_block:Number(ev.value["unlock-block"]??0),auto_renew:ev.value["auto-renew"]?1:0}); count++; }
    else if (ev.name==="unstaked") { db.prepare("UPDATE staking_v2 SET active=0 WHERE address=?").run(ev.value.staker); count++; }
    else if (ev.name==="auto-renew-toggled") { db.prepare("UPDATE staking_v2 SET auto_renew=((auto_renew+1)%2) WHERE address=?").run(ev.value.staker); count++; }
  }
  return count;
}
export const getStake = (addr) => db.prepare("SELECT * FROM staking_v2 WHERE address=? AND active=1").get(addr);
export const getTopStakers = (limit=10) => db.prepare("SELECT * FROM staking_v2 WHERE active=1 ORDER BY amount DESC LIMIT ?").all(limit);