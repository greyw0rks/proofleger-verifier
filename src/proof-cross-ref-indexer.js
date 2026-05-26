// generated: jun6  indexer: proof-cross-ref
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS proof_cross_ref (
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
  'INSERT OR IGNORE INTO proof_cross_ref (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncProofCrossRef(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.proof-cross-ref', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE proof_cross_ref SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getProofCrossRefEntries = (lim = 50) =>
  db.prepare('SELECT * FROM proof_cross_ref WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getProofCrossRefStats = () =>
  db.prepare('SELECT COUNT(*) as total FROM proof_cross_ref').get();
