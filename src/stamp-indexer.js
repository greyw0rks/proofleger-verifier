import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS proof_stamps (proof_hash TEXT, stamper TEXT, level TEXT, issued_at INTEGER, expires_at INTEGER, note TEXT, revoked INTEGER DEFAULT 0, PRIMARY KEY(proof_hash,stamper));`);
const upsert = db.prepare(`INSERT OR REPLACE INTO proof_stamps (proof_hash,stamper,level,issued_at,expires_at,note) VALUES (@proof_hash,@stamper,@level,@issued_at,@expires_at,@note)`);
export async function syncStamps(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.proof-stamp`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="stamp-issued") { upsert({proof_hash:ev.value["proof-hash"],stamper:ev.value.stamper,level:ev.value.level??"standard",issued_at:Number(ev.value["issued-at"]??ev.block_height),expires_at:Number(ev.value["expires-at"]??0),note:ev.value.note??""}); count++; }
    else if (ev.name==="stamp-revoked") { db.prepare("UPDATE proof_stamps SET revoked=1 WHERE proof_hash=? AND stamper=?").run(ev.value["proof-hash"],ev.value.stamper); count++; }
  }
  return count;
}
export const getStampsForHash = (hash) => db.prepare("SELECT * FROM proof_stamps WHERE proof_hash=? AND revoked=0 ORDER BY issued_at DESC").all(hash);