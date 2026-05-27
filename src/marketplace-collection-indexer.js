// generated: jun8  indexer: marketplace-collection
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS marketplace_collection (
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
  'INSERT OR IGNORE INTO marketplace_collection (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncMarketplaceCollection(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.marketplace-collection', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE marketplace_collection SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getMarketplaceCollectionEntries = (lim = 50) =>
  db.prepare('SELECT * FROM marketplace_collection WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getMarketplaceCollectionStats = () =>
  db.prepare('SELECT COUNT(*) as total FROM marketplace_collection').get();
