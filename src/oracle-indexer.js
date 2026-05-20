import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS oracle_prices (asset TEXT PRIMARY KEY, price INTEGER, sources INTEGER, updated_at INTEGER);
CREATE TABLE IF NOT EXISTS oracle_submissions (asset TEXT, feeder TEXT, price INTEGER, block_height INTEGER, PRIMARY KEY(asset,feeder,block_height));`);
export async function syncOracle(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.oracle-v2`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="price-aggregated") { db.prepare("INSERT OR REPLACE INTO oracle_prices (asset,price,sources,updated_at) VALUES (?,?,?,?)").run(ev.value.asset,Number(ev.value.price),Number(ev.value.sources??1),ev.block_height); count++; }
    else if (ev.name==="price-submitted") { db.prepare("INSERT OR IGNORE INTO oracle_submissions (asset,feeder,price,block_height) VALUES (?,?,?,?)").run(ev.value.asset,ev.value.feeder,Number(ev.value.price),ev.block_height); count++; }
  }
  return count;
}
export const getLatestPrice = (asset) => db.prepare("SELECT * FROM oracle_prices WHERE asset=?").get(asset);
export const getAllPrices = () => db.prepare("SELECT * FROM oracle_prices ORDER BY asset").all();