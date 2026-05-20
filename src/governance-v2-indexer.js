import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS governance_v2_proposals (proposal_id INTEGER PRIMARY KEY, title TEXT, proposer TEXT, for_weight INTEGER DEFAULT 0, against_weight INTEGER DEFAULT 0, start_block INTEGER, end_block INTEGER, executed INTEGER DEFAULT 0, updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS governance_v2_votes (proposal_id INTEGER, voter TEXT, weight INTEGER, support INTEGER, block_height INTEGER, PRIMARY KEY(proposal_id,voter));`);
const upsertP = db.prepare(`INSERT INTO governance_v2_proposals (proposal_id,title,proposer,for_weight,against_weight,start_block,end_block) VALUES (@proposal_id,@title,@proposer,@for_weight,@against_weight,@start_block,@end_block) ON CONFLICT(proposal_id) DO UPDATE SET for_weight=excluded.for_weight,against_weight=excluded.against_weight,updated_at=CURRENT_TIMESTAMP`);
const insertV = db.prepare(`INSERT OR IGNORE INTO governance_v2_votes (proposal_id,voter,weight,support,block_height) VALUES (@proposal_id,@voter,@weight,@support,@block_height)`);
export async function syncGovernanceV2(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.governance-v2`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="proposal-created") { upsertP({proposal_id:Number(ev.value["proposal-id"]),title:ev.value.title??"",proposer:ev.value.proposer??"",for_weight:0,against_weight:0,start_block:Number(ev.value["start-block"]??0),end_block:Number(ev.value["end-block"]??0)}); count++; }
    else if (ev.name==="vote-cast") { insertV({proposal_id:Number(ev.value["proposal-id"]),voter:ev.value.voter,weight:Number(ev.value.weight??1),support:ev.value.support?1:0,block_height:ev.block_height}); count++; }
    else if (ev.name==="proposal-executed") { db.prepare("UPDATE governance_v2_proposals SET executed=1 WHERE proposal_id=?").run(Number(ev.value["proposal-id"])); count++; }
  }
  return count;
}
export const getProposals = () => db.prepare("SELECT * FROM governance_v2_proposals ORDER BY proposal_id DESC").all();
export const getProposalVotes = (id) => db.prepare("SELECT * FROM governance_v2_votes WHERE proposal_id=?").all(id);