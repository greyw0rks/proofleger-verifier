/**
 * ProofLedger Verifier — Query CLI
 * Usage:
 *   node src/query.js stats
 *   node src/query.js proof <hash>
 *   node src/query.js wallet <address>
 *   node src/query.js recent [limit]
 *   node src/query.js search <term>
 *   node src/query.js export [json|csv]
 *   node src/query.js top [limit]
 */
import Database from "better-sqlite3";
import { exportJSON, exportCSV, exportWalletReport } from "./export.js";

const DB_FILE = "./proofs.db";
let db;
try { db = new Database(DB_FILE, { readonly: true }); }
catch { console.error("Database not found. Start the verifier first."); process.exit(1); }

const [,, cmd, ...args] = process.argv;

switch (cmd) {
  case "stats": {
    const s = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    const total = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
    const unverified = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 0 AND category = \"anchor\"").get().c;
    console.log("\nProofLedger Verifier — Database Stats");
    console.log("=".repeat(40));
    console.log(`Total records:     ${total}`);
    console.log(`Anchors:           ${s?.total_anchors || 0}`);
    console.log(`Attestations:      ${s?.total_attests || 0}`);
    console.log(`Mints:             ${s?.total_mints || 0}`);
    console.log(`Verified on-chain: ${s?.total_verified || 0}`);
    console.log(`Unique wallets:    ${s?.total_senders || 0}`);
    console.log(`Unverified backlog:${unverified}`);
    console.log(`Last updated:      ${s?.last_updated || "never"}`);
    break;
  }

  case "proof": {
    const hash = args[0];
    if (!hash) { console.error("Usage: node src/query.js proof <hash>"); break; }
    const p = db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${hash}%`);
    if (!p) { console.log("Not found:", hash); break; }
    console.log("\nProof found:");
    Object.entries(p).forEach(([k,v]) => v != null && console.log(`  ${k.padEnd(14)} ${v}`));
    break;
  }

  case "wallet": {
    const address = args[0];
    if (!address) { console.error("Usage: node src/query.js wallet <address>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC").all(address);
    console.log(`\nProofs for ${address}: ${rows.length} total`);
    rows.slice(0, 20).forEach(p => {
      const verified = p.verified ? "✓" : "✗";
      console.log(`  ${verified} [${p.category}] ${(p.title || p.hash?.slice(0,16) || "—").slice(0,30)} block:${p.block_height}`);
    });
    break;
  }

  case "recent": {
    const limit = parseInt(args[0]) || 20;
    const rows = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
    console.log(`\nRecent ${limit} proofs:`);
    rows.forEach(p => {
      const verified = p.verified ? "✓" : "✗";
      console.log(`  ${verified} [${p.category}] ${p.sender.slice(0,10)}... block:${p.block_height} ${p.title ? `"${p.title.slice(0,20)}"` : ""}`);
    });
    break;
  }

  case "search": {
    const q = args[0];
    if (!q) { console.error("Usage: node src/query.js search <term>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE title LIKE ? OR sender LIKE ? OR hash LIKE ? LIMIT 20")
      .all(`%${q}%`, `%${q}%`, `%${q}%`);
    console.log(`\nSearch results for "${q}": ${rows.length} found`);
    rows.forEach(p => console.log(`  [${p.category}] ${p.sender.slice(0,10)}... "${p.title || p.hash?.slice(0,16) || "—"}" block:${p.block_height}`));
    break;
  }

  case "top": {
    const limit = parseInt(args[0]) || 10;
    const rows = db.prepare("SELECT sender, COUNT(*) as count FROM proofs WHERE category = \"anchor\" GROUP BY sender ORDER BY count DESC LIMIT ?").all(limit);
    console.log(`\nTop ${limit} wallets by anchors:`);
    rows.forEach((r,i) => console.log(`  #${i+1} ${r.sender.slice(0,12)}...  ${r.count} anchors`));
    break;
  }

  case "export": {
    const fmt = args[0] || "json";
    const dbRw = new Database(DB_FILE);
    if (fmt === "csv") exportCSV(dbRw);
    else exportJSON(dbRw);
    break;
  }

  default:
    console.log("Usage: node src/query.js [stats|proof|wallet|recent|search|top|export]");
}

db.close();