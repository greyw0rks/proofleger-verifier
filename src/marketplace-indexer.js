import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS marketplace_listings (listing_id INTEGER PRIMARY KEY, seller TEXT, credential_hash TEXT, price INTEGER, schema TEXT, active INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS marketplace_purchases (listing_id INTEGER, buyer TEXT, block_height INTEGER, PRIMARY KEY(listing_id,buyer));`);
const upsert = db.prepare(`INSERT INTO marketplace_listings (listing_id,seller,credential_hash,price,schema) VALUES (@listing_id,@seller,@credential_hash,@price,@schema) ON CONFLICT(listing_id) DO UPDATE SET active=excluded.active`);
const insertP = db.prepare(`INSERT OR IGNORE INTO marketplace_purchases (listing_id,buyer,block_height) VALUES (@listing_id,@buyer,@block_height)`);
export async function syncMarketplace(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.credential-marketplace`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="listing-created") { upsert({listing_id:Number(ev.value["listing-id"]),seller:ev.value.seller,credential_hash:ev.value["credential-hash"],price:Number(ev.value.price),schema:ev.value.schema??""}); count++; }
    else if (ev.name==="credential-purchased") { insertP({listing_id:Number(ev.value["listing-id"]),buyer:ev.value.buyer,block_height:ev.block_height}); count++; }
    else if (ev.name==="listing-removed") { db.prepare("UPDATE marketplace_listings SET active=0 WHERE listing_id=?").run(Number(ev.value["listing-id"])); count++; }
  }
  return count;
}
export const getActiveListings = () => db.prepare("SELECT * FROM marketplace_listings WHERE active=1 ORDER BY listing_id DESC").all();
export const getListingPurchases = (id) => db.prepare("SELECT * FROM marketplace_purchases WHERE listing_id=?").all(id);