// generated: may23  indexer: proof-cert-chain
import db from './database.js';
import { fetchContractEvents } from './indexer.js';
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`
  CREATE TABLE IF NOT EXISTS proof_cert_chain (
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
  'INSERT OR IGNORE INTO proof_cert_chain (entry_hash,owner,value,block_height) VALUES (?,?,?,?)'
);
export async function syncProofCertChain(fromBlock = 0) {
  const evs = await fetchContractEvents(CONTRACT + '.proof-cert-chain', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') {
      upsert.run(ev.tx_id ?? String(Date.now()), ev.value.owner ?? '', JSON.stringify(ev.value), ev.block_height);
      count++;
    } else if (ev.name === 'entry-deactivated') {
      db.prepare('UPDATE proof_cert_chain SET active=0 WHERE owner=?').run(ev.value.owner ?? '');
      count++;
    }
  }
  return count;
}
export const getProofCertChainEntries = (lim = 50) =>
  db.prepare('SELECT * FROM proof_cert_chain WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getProofCertChainStats = () =>
  db.prepare('SELECT COUNT(*) as total FROM proof_cert_chain').get();
