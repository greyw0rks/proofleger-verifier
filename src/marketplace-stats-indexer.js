// generated: jun6  indexer: marketplace-stats
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS marketplace_stats (
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
  'INSERT OR IGNORE INTO marketplace_stats (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncMarketplaceStats(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.marketplace-stats', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE marketplace_stats SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getMarketplaceStatsEntries = (lim = 50) =>
  db.prepare('SELECT * FROM marketplace_stats WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getMarketplaceStatsStats = () =>
  db.prepare('SELECT COUNT(*) as total FROM marketplace_stats').get();
