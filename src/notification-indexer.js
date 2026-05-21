import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS notification (id INTEGER PRIMARY KEY AUTOINCREMENT, entry_hash TEXT UNIQUE, owner TEXT, value TEXT, block_height INTEGER, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);
const upsert = db.prepare(`INSERT OR IGNORE INTO notification (entry_hash,owner,value,block_height) VALUES (@entry_hash,@owner,@value,@block_height)`);
export async function syncNotification(fromBlock=0) {
  const evs = await fetchContractEvents(CONTRACT + '.notification', fromBlock);
  let count = 0;
  for (const ev of evs) {
    if (ev.name === 'entry-added') { upsert({ entry_hash: ev.tx_id, owner: ev.value.owner ?? '', value: JSON.stringify(ev.value), block_height: ev.block_height }); count++; }
    else if (ev.name === 'entry-deactivated') { db.prepare('UPDATE notification SET active=0 WHERE owner=?').run(ev.value.owner); count++; }
  }
  return count;
}
export const getNotificationEntries = (lim=50) => db.prepare('SELECT * FROM notification WHERE active=1 ORDER BY block_height DESC LIMIT ?').all(lim);
export const getNotificationStats = () => db.prepare('SELECT COUNT(*) as total FROM notification').get();