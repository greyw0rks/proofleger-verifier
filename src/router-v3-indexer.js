// generated: may20  indexer: router-v3
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS router_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_hash TEXT UNIQUE,
    owner TEXT,
    value TEXT,
    block_height INTEGER,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);
const upsert = db.prepare(
  'INSERT OR IGNORE INTO router_v3 (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncRouterV3(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.router-v3', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE router_v3 SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getRouterV3Entries = (lim = 50) =>
  db.prepare('SELECT * FROM router_v3 WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getRouterV3Stats = () =>
  db.prepare('SELECT COUNT(*) as total FROM router_v3').get();
