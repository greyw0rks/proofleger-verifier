// generated: may22  indexer: reputation-history
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS reputation_history (
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
  'INSERT OR IGNORE INTO reputation_history (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncReputationHistory(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.reputation-history', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE reputation_history SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getReputationHistoryEntries = (lim = 50) =>
  db.prepare('SELECT * FROM reputation_history WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getReputationHistoryStats = () =>
  db.prepare('SELECT COUNT(*) as total FROM reputation_history').get();
