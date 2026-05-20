import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS credential_transfers (tx_id TEXT PRIMARY KEY, credential_id INTEGER, from_address TEXT, to_address TEXT, block_height INTEGER, schema TEXT);
CREATE TABLE IF NOT EXISTS credential_holdings (credential_id INTEGER PRIMARY KEY, holder TEXT, schema TEXT, issuer TEXT, transfers INTEGER DEFAULT 0, revoked INTEGER DEFAULT 0);`);
export async function syncTransfers(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.credential-transfer`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="credential-transferred") {
      db.prepare("INSERT OR IGNORE INTO credential_transfers (tx_id,credential_id,from_address,to_address,block_height,schema) VALUES (?,?,?,?,?,?)").run(`${ev.block_height}-${ev.value["credential-id"]}`,Number(ev.value["credential-id"]),ev.value.from,ev.value.to,ev.block_height,ev.value.schema??"");
      db.prepare("UPDATE credential_holdings SET holder=?, transfers=transfers+1 WHERE credential_id=?").run(ev.value.to,Number(ev.value["credential-id"])); count++;
    } else if (ev.name==="credential-issued") {
      db.prepare("INSERT OR IGNORE INTO credential_holdings (credential_id,holder,schema,issuer) VALUES (?,?,?,?)").run(Number(ev.value["credential-id"]),ev.value.holder,ev.value.schema??"",ev.value.issuer??""); count++;
    }
  }
  return count;
}
export const getHoldings = (addr) => db.prepare("SELECT * FROM credential_holdings WHERE holder=? AND revoked=0").all(addr);
export const getTransferHistory = (credId) => db.prepare("SELECT * FROM credential_transfers WHERE credential_id=? ORDER BY block_height DESC").all(credId);