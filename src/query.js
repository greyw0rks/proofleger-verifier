/**
 * ProofLedger Verifier Query CLI — v1.4
 * Commands: stats|proof|wallet|recent|search|top|export|celo|report|leaderboard|timeline|anomalies|revocations|achievements
 */
import Database from "better-sqlite3";
import { exportJSON, exportCSV } from "./export.js";
import { getCeloStats } from "./celo-database.js";
import { saveWalletReport } from "./wallet-report.js";
import { buildLeaderboard, getTopDocTypes } from "./leaderboard.js";
import { getDailyActivity } from "./timeline.js";
import { runAnomalyChecks } from "./anomaly-detector.js";

const DB_FILE = "./proofs.db";
let db;
try { db = new Database(DB_FILE, { readonly: true }); }
catch { console.error("Database not found."); process.exit(1); }

const [,, cmd, sub, ...rest] = process.argv;

switch(cmd) {
  case "stats": {
    const s     = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    const total = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
    const unverified = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 0 AND category = anchor").get().c;
    const revoked    = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 2").get().c;
    let celoTotal = 0;
    try { celoTotal = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c; } catch {}
    console.log("\nProofLedger Verifier Stats");
    console.log("=".repeat(42));
    console.log(`Stacks total:      ${total}`);
    console.log(`Celo total:        ${celoTotal}`);
    console.log(`Combined:          ${total + celoTotal}`);
    console.log(`Anchors:           ${s?.total_anchors || 0}`);
    console.log(`Attestations:      ${s?.total_attests || 0}`);
    console.log(`Verified on-chain: ${s?.total_verified || 0}`);
    console.log(`Revoked:           ${revoked}`);
    console.log(`Unverified queue:  ${unverified}`);
    console.log(`Unique wallets:    ${s?.total_senders || 0}`);
    break;
  }
  case "revocations": {
    const rows = db.prepare("SELECT * FROM proofs WHERE verified = 2").all();
    console.log(`\nRevoked proofs: ${rows.length}`);
    rows.forEach(r => console.log(`  ${r.sender?.slice(0,12)}... hash:${r.hash?.slice(0,16)} block:${r.block_height}`));
    break;
  }
  case "achievements": {
    const address = sub;
    let rows = [];
    try {
      rows = address
        ? db.prepare("SELECT * FROM earned_achievements WHERE address = ?").all(address)
        : db.prepare("SELECT * FROM earned_achievements ORDER BY earned_at DESC LIMIT 30").all();
    } catch { console.log("Achievements table not found — run sync first."); break; }
    console.log(`\nAchievements${address ? ` for ${address.slice(0,14)}...` : " (all)"}: ${rows.length}`);
    rows.forEach(r => console.log(`  ${r.achievement.padEnd(20)} ${r.address?.slice(0,14)}... ${r.earned_at?.slice(0,10)}`));
    break;
  }
  case "leaderboard": {
    const limit = parseInt(sub) || 10;
    const entries = buildLeaderboard(db, limit);
    console.log(`\nTop ${limit} wallets:`);
    entries.forEach(e =>
      console.log(`  #${e.rank} ${e.address.slice(0,12)}... A:${e.anchors} T:${e.attests} N:${e.mints} Score:${e.score}`)
    );
    console.log("\nTop doc types:");
    getTopDocTypes(db, 5).forEach(d => console.log(`  ${d.doc_type}: ${d.count}`));
    break;
  }
  case "timeline": {
    const days = parseInt(sub) || 14;
    getDailyActivity(db, days).forEach(d =>
      console.log(`  ${d.date}  A:${d.anchors} T:${d.attests} wallets:${d.unique_wallets}`)
    );
    break;
  }
  case "anomalies": {
    const dbRw = new Database(DB_FILE);
    const r = runAnomalyChecks(dbRw);
    console.log(`\nBursts: ${r.bursts} · Duplicate titles: ${r.duplicateTitles} · New high-volume: ${r.newHighVolume}`);
    break;
  }
  case "proof": {
    const p = sub ? db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${sub}%`) : null;
    if (!p) { console.log("Not found:", sub); break; }
    Object.entries(p).forEach(([k,v]) => v != null && console.log(`  ${k.padEnd(14)} ${v}`));
    break;
  }
  case "wallet": {
    if (!sub) { console.error("Usage: node src/query.js wallet <address>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC").all(sub);
    console.log(`\nProofs for ${sub}: ${rows.length}`);
    rows.slice(0,20).forEach(p =>
      console.log(`  ${p.verified===2?"🚫":p.verified?"✓":"✗"} [${p.category}] ${(p.title||p.hash?.slice(0,16)||"—").slice(0,30)} block:${p.block_height}`)
    );
    break;
  }
  case "recent": {
    const limit = parseInt(sub) || 20;
    db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit)
      .forEach(p => console.log(`  ${p.verified===2?"🚫":p.verified?"✓":"✗"} [${p.category}] ${p.sender?.slice(0,10)}... block:${p.block_height}`));
    break;
  }
  case "search": {
    if (!sub) { console.error("Usage: node src/query.js search <term>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE title LIKE ? OR sender LIKE ? OR hash LIKE ? LIMIT 20")
      .all(`%${sub}%`, `%${sub}%`, `%${sub}%`);
    console.log(`\nResults for "${sub}": ${rows.length}`);
    rows.forEach(p => console.log(`  [${p.category}] ${p.sender?.slice(0,10)}... "${p.title||"—"}" block:${p.block_height}`));
    break;
  }
  case "top": {
    const limit = parseInt(sub) || 10;
    db.prepare(`SELECT sender, COUNT(*) as cnt FROM proofs WHERE category="anchor" GROUP BY sender ORDER BY cnt DESC LIMIT ?`)
      .all(limit).forEach((r,i) => console.log(`  #${i+1} ${r.sender?.slice(0,14)}... ${r.cnt} anchors`));
    break;
  }
  case "export": {
    const fmt = sub || "json";
    const dbRw = new Database(DB_FILE);
    if (fmt === "csv") exportCSV(dbRw); else exportJSON(dbRw);
    break;
  }
  case "celo": {
    switch(sub) {
      case "stats": {
        let s; try { s = getCeloStats(db); } catch { console.log("No Celo data yet."); break; }
        console.log(`Celo: ${s.total} txs · ${s.wallets} wallets`); break;
      }
      case "recent": {
        let rows = [];
        try { rows = db.prepare("SELECT * FROM celo_proofs ORDER BY block_number DESC LIMIT ?").all(parseInt(rest[0])||10); } catch {}
        rows.forEach(r => console.log(`  ${r.from_address?.slice(0,10)}... block:${r.block_number}`)); break;
      }
      case "wallet": {
        if (!rest[0]) break;
        let rows = [];
        try { rows = db.prepare("SELECT * FROM celo_proofs WHERE from_address = ?").all(rest[0]); } catch {}
        console.log(`Celo proofs for ${rest[0]}: ${rows.length}`); break;
      }
    }
    break;
  }
  case "report": {
    if (!sub) { console.error("Usage: node src/query.js report <address>"); break; }
    const dbRw = new Database(DB_FILE);
    const report = saveWalletReport(dbRw, sub);
    console.log(`Stacks: ${report.stacks.totalTxs} · Celo: ${report.celo.totalTxs} · Score: ${report.score}`);
    break;
  }
  default:
    console.log("Commands: stats|proof|wallet|recent|search|top|export|celo|report|leaderboard|timeline|anomalies|revocations|achievements");
}

db.close();