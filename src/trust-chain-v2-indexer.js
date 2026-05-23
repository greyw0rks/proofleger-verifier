// generated: may21  indexer: trust-chain-v2
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS trust_chain_v2 (
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
  'INSERT OR IGNORE INTO trust_chain_v2 (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncTrustChainV2(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.trust-chain-v2', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE trust_chain_v2 SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getTrustChainV2Entries = (lim = 50) =>
  db.prepare('SELECT * FROM trust_chain_v2 WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getTrustChainV2Stats = () =>
  db.prepare('SELECT COUNT(*) as total FROM trust_chain_v2').get();
