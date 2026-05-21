import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS anchor_registry (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_hash TEXT UNIQUE, owner TEXT, value TEXT, block_height INTEGER, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
const upsert = db.prepare(`INSERT OR IGNORE INTO anchor_registry (entry_hash,owner,value,block_height) VALUES (@entry_hash,@owner,@value,@block_height)`);
export async function syncAnchorRegistry(fromBlock=0) {
  const evs = await fetchContractEvents(CONTRACT + '.anchor-registry', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') { upsert({ entry_hash: ev.tx_id, owner: ev.value.owner ?? '', value: JSON.stringify(ev.value), block_height: ev.block_height }); count++; }
    else if (ev.name === 'entry-deactivated') { db.prepare('UPDATE anchor_registry SET active=0 WHERE owner=?').run(ev.value.owner); count++; }
  }
  return count;
}
export const getAnchorRegistryEntries = (lim=50) => db.prepare('SELECT * FROM anchor_registry WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getAnchorRegistryStats = () => db.prepare('SELECT COUNT(*) as total FROM anchor_registry').get();