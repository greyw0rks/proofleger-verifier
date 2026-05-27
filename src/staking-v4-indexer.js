// generated: jun11  indexer: staking-v4
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS staking_v4 (
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
  'INSERT OR IGNORE INTO staking_v4 (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncStakingV4(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.staking-v4', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE staking_v4 SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getStakingV4Entries = (lim = 50) =>
  db.prepare('SELECT * FROM staking_v4 WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getStakingV4Stats = () =>
  db.prepare('SELECT COUNT(*) as total FROM staking_v4').get();
