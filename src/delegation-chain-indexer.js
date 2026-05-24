// generated: may28  indexer: delegation-chain
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS delegation_chain (
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
  'INSERT OR IGNORE INTO delegation_chain (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncDelegationChain(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.delegation-chain', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE delegation_chain SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getDelegationChainEntries = (lim = 50) =>
  db.prepare('SELECT * FROM delegation_chain WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getDelegationChainStats = () =>
  db.prepare('SELECT COUNT(*) as total FROM delegation_chain').get();
