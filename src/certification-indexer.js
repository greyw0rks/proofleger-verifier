import db from "./database.js";
import { fetchContractEvents } from "./indexer.js";
const CONTRACT = process.env.STACKS_CONTRACT;
db.exec(`CREATE TABLE IF NOT EXISTS proof_certifications (proof_hash TEXT PRIMARY KEY, issuer TEXT, tier TEXT, certified_at INTEGER, metadata_uri TEXT, revoked INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS certification_issuers (address TEXT PRIMARY KEY, tier_limit INTEGER, total_issued INTEGER DEFAULT 0);`);
const upsertC = db.prepare(`INSERT OR REPLACE INTO proof_certifications (proof_hash,issuer,tier,certified_at,metadata_uri) VALUES (@proof_hash,@issuer,@tier,@certified_at,@metadata_uri)`);
const upsertI = db.prepare(`INSERT OR IGNORE INTO certification_issuers (address,tier_limit) VALUES (@address,@tier_limit)`);
export async function syncCertifications(fromBlock=0) {
  const evs = await fetchContractEvents(`${CONTRACT}.proof-certification`,fromBlock); let count=0;
  for (const ev of evs) {
    if (ev.name==="issuer-added") { upsertI({address:ev.value.issuer,tier_limit:Number(ev.value["tier-limit"]??1)}); count++; }
    else if (ev.name==="proof-certified") { upsertC({proof_hash:ev.value["proof-hash"],issuer:ev.value.issuer,tier:ev.value.tier??"standard",certified_at:ev.block_height,metadata_uri:ev.value["metadata-uri"]??""}); db.prepare("UPDATE certification_issuers SET total_issued=total_issued+1 WHERE address=?").run(ev.value.issuer); count++; }
    else if (ev.name==="certification-revoked") { db.prepare("UPDATE proof_certifications SET revoked=1 WHERE proof_hash=?").run(ev.value["proof-hash"]); count++; }
  }
  return count;
}
export const getCertification = (h) => db.prepare("SELECT * FROM proof_certifications WHERE proof_hash=? AND revoked=0").get(h);
export const getIssuerCertifications = (i) => db.prepare("SELECT * FROM proof_certifications WHERE issuer=? ORDER BY certified_at DESC").all(i);