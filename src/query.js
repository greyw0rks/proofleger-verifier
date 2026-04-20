/**
 * ProofLedger Verifier Query CLI — v1.2
 * Usage:
 *   node src/query.js stats
 *   node src/query.js proof <hash>
 *   node src/query.js wallet <address>
 *   node src/query.js recent [limit]
 *   node src/query.js search <term>
 *   node src/query.js export [json|csv]
 *   node src/query.js top [limit]
 *   node src/query.js celo stats
 *   node src/query.js celo recent [limit]
 *   node src/query.js celo wallet <address>
 *   node src/query.js report <address>
 */
import Database from "better-sqlite3";
import { exportJSON, exportCSV } from "./export.js";
import { getCeloStats } from "./celo-database.js";
import { generateWalletReport, saveWalletReport } from "./wallet-report.js";

const DB_FILE = "./proofs.db";
let db;
try { db = new Database(DB_FILE, { readonly: true }); }
catch { console.error("Database not found. Start the verifier first."); process.exit(1); }

const [,, cmd, sub, ...rest] = process.argv;

if (cmd === "celo") {
  switch(sub) {
    case "stats": {
      let celoStats;
      try { celoStats = getCeloStats(db); }
      catch { console.log("No Celo data yet. Run verifier with Celo sync enabled."); break; }
      console.log("\nCelo ProofLedger Stats");
      console.log("=".repeat(30));
      console.log(`Total txs:     ${celoStats.total}`);
      console.log(`Unique wallets:${celoStats.wallets}`);
      if (celoStats.recent?.length) {
        console.log("\nRecent Celo txs:");
        celoStats.recent.forEach(t => console.log(`  ${t.from?.slice(0,10)}... block:${t.block_number}`));
      }
      break;
    }
    case "recent": {
      const limit = parseInt(rest[0]) || 10;
      let rows;
      try { rows = db.prepare("SELECT * FROM celo_proofs ORDER BY block_number DESC LIMIT ?").all(limit); }
      catch { console.log("No Celo table found."); break; }
      console.log(`\nRecent ${limit} Celo proofs:`);
      rows.forEach(r => console.log(`  ${r.from_address?.slice(0,10)}... block:${r.block_number} ${r.timestamp?.slice(0,10)}`));
      break;
    }
    case "wallet": {
      const addr = rest[0];
      if (!addr) { console.error("Usage: node src/query.js celo wallet <address>"); break; }
      let rows;
      try { rows = db.prepare("SELECT * FROM celo_proofs WHERE from_address = ? ORDER BY block_number DESC").all(addr); }
      catch { console.log("No Celo table found."); break; }
      console.log(`\nCelo proofs for ${addr}: ${rows.length}`);
      rows.forEach(r => console.log(`  block:${r.block_number} tx:${r.txid?.slice(0,16)}...`));
      break;
    }
    default:
      console.log("Usage: node src/query.js celo [stats|recent|wallet]");
  }
  db.close(); process.exit(0);
}

if (cmd === "report") {
  const address = sub;
  if (!address) { console.error("Usage: node src/query.js report <address>"); process.exit(1); }
  const dbRw = new Database(DB_FILE);
  const report = saveWalletReport(dbRw, address);
  console.log("\nReport summary:");
  console.log(`  Stacks: ${report.stacks.totalTxs} txs (${report.stacks.anchors} anchors)`);
  console.log(`  Celo:   ${report.celo.totalTxs} txs`);
  console.log(`  Score:  ${report.score}`);
  dbRw.close(); process.exit(0);
}

switch (cmd) {
  case "stats": {
    const s = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    const total = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
    const unverified = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 0 AND category = \"anchor\"").get().c;
    let celoTotal = 0;
    try { celoTotal = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c; } catch {}
    console.log("\nProofLedger Verifier Stats");
    console.log("=".repeat(40));
    console.log(`Stacks records:    ${total}`);
    console.log(`Celo records:      ${celoTotal}`);
    console.log(`Combined:          ${total + celoTotal}`);
    console.log(`Anchors:           ${s?.total_anchors || 0}`);
    console.log(`Attestations:      ${s?.total_attests || 0}`);
    console.log(`Verified:          ${s?.total_verified || 0}`);
    console.log(`Unique wallets:    ${s?.total_senders || 0}`);
    console.log(`Unverified:        ${unverified}`);
    break;
  }
  case "proof": {
    const hash = sub;
    if (!hash) { console.error("Usage: node src/query.js proof <hash>"); break; }
    const p = db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${hash}%`);
    if (!p) { console.log("Not found:", hash); break; }
    console.log("\nProof found:");
    Object.entries(p).forEach(([k,v]) => v != null && console.log(`  ${k.padEnd(14)} ${v}`));
    break;
  }
  case "wallet": {
    const address = sub;
    if (!address) { console.error("Usage: node src/query.js wallet <address>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC").all(address);
    console.log(`\nProofs for ${address}: ${rows.length}`);
    rows.slice(0,20).forEach(p => {
      console.log(`  ${p.verified?"✓":"✗"} [${p.category}] ${(p.title||p.hash?.slice(0,16)||"—").slice(0,30)} block:${p.block_height}`);
    });
    break;
  }
  case "recent": {
    const limit = parseInt(sub) || 20;
    const rows = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
    console.log(`\nRecent ${limit} proofs:`);
    rows.forEach(p => console.log(`  ${p.verified?"✓":"✗"} [${p.category}] ${p.sender?.slice(0,10)}... block:${p.block_height}`));
    break;
  }
  case "search": {
    if (!sub) { console.error("Usage: node src/query.js search <term>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE title LIKE ? OR sender LIKE ? OR hash LIKE ? LIMIT 20")
      .all(`%${sub}%`, `%${sub}%`, `%${sub}%`);
    console.log(`\nResults for "${sub}": ${rows.length}`);
    rows.forEach(p => console.log(`  [${p.category}] ${p.sender?.slice(0,10)}... "${p.title||p.hash?.slice(0,16)||"—"}" block:${p.block_height}`));
    break;
  }
  case "top": {
    const limit = parseInt(sub) || 10;
    const rows = db.prepare("SELECT sender, COUNT(*) as count FROM proofs WHERE category=\"anchor\" GROUP BY sender ORDER BY count DESC LIMIT ?").all(limit);
    console.log(`\nTop ${limit} wallets:`);
    rows.forEach((r,i) => console.log(`  #${i+1} ${r.sender?.slice(0,12)}...  ${r.count} anchors`));
    break;
  }
  case "export": {
    const fmt = sub || "json";
    const dbRw = new Database(DB_FILE);
    if (fmt === "csv") exportCSV(dbRw);
    else exportJSON(dbRw);
    break;
  }
  default:
    console.log("Commands: stats | proof | wallet | recent | search | top | export | celo | report");
}

db.close();