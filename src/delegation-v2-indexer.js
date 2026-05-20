import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS vote_delegations (delegator TEXT PRIMARY KEY, delegate TEXT, power INTEGER, expires_at INTEGER, scope TEXT, active INTEGER DEFAULT 1, created_at INTEGER);`);
const upsert = db.prepare(`INSERT OR REPLACE INTO vote_delegations (delegator,delegate,power,expires_at,scope,active,created_at) VALUES (@delegator,@delegate,@power,@expires_at,@scope,1,@created_at)`);
export async function syncDelegationV2(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.vote-delegation`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="vote-delegated") { upsert({delegator:ev.value.delegator,delegate:ev.value.delegate,power:Number(ev.value.power??1),expires_at:Number(ev.value["expires-at"]??0),scope:ev.value.scope??"all",created_at:ev.block_height}); count++; }
    else if (ev.name==="delegation-revoked") { db.prepare("UPDATE vote_delegations SET active=0 WHERE delegator=?").run(ev.value.delegator); count++; }
  }
  return count;
}
export const getDelegation = (addr) => db.prepare("SELECT * FROM vote_delegations WHERE delegator=? AND active=1").get(addr);
export const getDelegatePower = (addr) => db.prepare("SELECT SUM(power) as total FROM vote_delegations WHERE delegate=? AND active=1").get(addr)?.total??0;