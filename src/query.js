/**
 * ProofLedger Verifier Query CLI — v1.5
 * Commands: stats | proof | wallet | recent | search | top | export | celo
 *           report | leaderboard | timeline | anomalies | issuers | nfts | batch
 *           audit | whitelist | router | snapshot | reputation | delegation
 */
import Database from "better-sqlite3";
import { exportJSON, exportCSV }                           from "./export.js";
import { generateWalletReport, saveWalletReport }          from "./wallet-report.js";
import { buildLeaderboard, getTopDocTypes }                from "./leaderboard.js";
import { getDailyActivity }                                from "./timeline.js";
import { runAnomalyChecks }                                from "./anomaly-detector.js";
import { getIssuers }                                      from "./issuer-indexer.js";
import { getNFTsByOwner, getNFTStats }                     from "./nft-indexer.js";
import { getBatchStats, getBatchById }                     from "./batch-indexer.js";
import { getTopScores, getScore }                          from "./reputation-indexer.js";
import { getActiveDelegations }                            from "./delegation-indexer.js";
import { getRecentAuditEntries, getAuditStats }            from "./audit-indexer.js";
import { getWhitelistedAddresses, getWhitelistStats }      from "./whitelist-indexer.js";
import { getUnmatchedRoutes, getRouterStats }              from "./router-indexer.js";
import { takeSnapshot }                                    from "./snapshot.js";

const DB_FILE = "./proofs.db";
let db;
try { db = new Database(DB_FILE, { readonly: true }); }
catch { console.error("Database not found. Start the verifier first."); process.exit(1); }

const [,, cmd, sub, ...rest] = process.argv;

switch(cmd) {
  case "stats": {
    const s = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    const total = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
    const unverified = db.prepare("SELECT COUNT(*) as c FROM proofs WHERE verified = 0 AND category = anchor").get().c;
    let celoTotal = 0; try { celoTotal = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c; } catch {}
    let nftTotal  = 0; try { nftTotal  = db.prepare("SELECT COUNT(*) as c FROM nft_certs").get().c;  } catch {}
    let issuerTotal = 0; try { issuerTotal = db.prepare("SELECT COUNT(*) as c FROM issuers").get().c; } catch {}
    let wlActive = 0; try { wlActive = db.prepare("SELECT COUNT(*) as c FROM whitelist WHERE active = 1").get().c; } catch {}
    console.log("\nProofLedger Verifier Stats");
    console.log("=".repeat(40));
    console.log(`Stacks records:    ${total}`);
    console.log(`Celo records:      ${celoTotal}`);
    console.log(`NFT certs:         ${nftTotal}`);
    console.log(`Issuers:           ${issuerTotal}`);
    console.log(`Whitelisted:       ${wlActive}`);
    console.log(`Anchors:           ${s?.total_anchors||0}`);
    console.log(`Attestations:      ${s?.total_attests||0}`);
    console.log(`Verified:          ${s?.total_verified||0}`);
    console.log(`Unique wallets:    ${s?.total_senders||0}`);
    console.log(`Unverified queue:  ${unverified}`);
    break;
  }
  case "audit": {
    const limit = parseInt(sub) || 20;
    const entries = getRecentAuditEntries(db, limit);
    const stats   = getAuditStats(db);
    console.log(`\nAudit Log: ${stats.total} entries · ${stats.actors} actors`);
    entries.forEach(e =>
      console.log(`  [${e.action}] ${e.actor?.slice(0,10)}... → ${e.target} "${e.note?.slice(0,30)}"`)
    );
    break;
  }
  case "whitelist": {
    const entries = getWhitelistedAddresses(db);
    const stats   = getWhitelistStats(db);
    console.log(`\nWhitelist: ${stats.active} active / ${stats.total} total`);
    entries.forEach(e => console.log(`  ✓ ${e.address?.slice(0,16)}... "${e.label}"`));
    break;
  }
  case "router": {
    const stats = getRouterStats(db);
    console.log(`\nRouter: ${stats.total} routes · ${stats.matched} matched · ${stats.unmatched} unmatched`);
    if (stats.unmatched > 0) {
      const unmatched = getUnmatchedRoutes(db, 10);
      console.log("Unmatched routes:");
      unmatched.forEach(r =>
        console.log(`  route:${r.route_id} ${r.caller?.slice(0,10)}... hash:${r.hash?.slice(0,14)}...`)
      );
    }
    break;
  }
  case "snapshot": {
    const dbRw = new Database(DB_FILE);
    const fname = takeSnapshot(DB_FILE);
    console.log("Snapshot saved:", fname);
    break;
  }
  case "reputation": {
    if (sub) {
      const score = getScore(db, sub);
      console.log(`\nReputation for ${sub}:`);
      if (score) Object.entries(score).forEach(([k,v]) => v != null && console.log(`  ${k.padEnd(16)} ${v}`));
      else console.log("  No reputation record found.");
    } else {
      const top = getTopScores(db, 10);
      console.log("\nTop Reputation Scores:");
      top.forEach((s,i) => console.log(`  #${i+1} ${s.address?.slice(0,14)}... score:${s.score} anchors:${s.anchor_count}`));
    }
    break;
  }
  case "delegation": {
    const active = getActiveDelegations(db);
    console.log(`\nActive Delegations: ${active.length}`);
    active.forEach(d =>
      console.log(`  ${d.delegator?.slice(0,12)}... → ${d.delegate?.slice(0,12)}... ${d.anchor_only ? "(anchor-only)" : ""}`)
    );
    break;
  }
  case "issuers": {
    const verified = sub === "--verified";
    const issuers  = getIssuers(db, { verifiedOnly: verified, limit: 20 });
    console.log(`\nIssuers${verified ? " (verified)" : ""}: ${issuers.length}`);
    issuers.forEach(i => console.log(`  ${i.verified ? "✓" : "○"} ${i.name||i.address?.slice(0,12)+"..."} [${i.issuer_type||"?"}]`));
    break;
  }
  case "nfts": {
    if (sub) {
      const certs = getNFTsByOwner(db, sub);
      console.log(`\nNFT certs for ${sub}: ${certs.length}`);
      certs.forEach(c => console.log(`  #${c.token_id} "${c.title||"—"}" [${c.doc_type||"?"}] block:${c.minted_at}`));
    } else {
      const stats = getNFTStats(db);
      console.log(`\nNFT Stats: ${stats.total} certs · ${stats.holders} holders · ${stats.transfers} transfers`);
    }
    break;
  }
  case "batch": {
    if (sub) {
      const entries = getBatchById(db, parseInt(sub));
      console.log(`\nBatch #${sub}: ${entries.length} entries`);
      entries.forEach(e => console.log(`  [${e.index_}] "${e.title||"—"}" ${e.hash?.slice(0,16)}...`));
    } else {
      const stats = getBatchStats(db);
      console.log(`\nBatch Stats: ${stats.totalBatches} batches · ${stats.totalEntries} entries`);
    }
    break;
  }
  case "leaderboard": {
    const limit = parseInt(sub) || 10;
    const entries = buildLeaderboard(db, limit);
    console.log(`\nTop ${limit} wallets:`);
    entries.forEach(e =>
      console.log(`  #${e.rank} ${e.address?.slice(0,12)}... A:${e.anchors} T:${e.attests} Score:${e.score}`)
    );
    break;
  }
  case "timeline": {
    const days = parseInt(sub) || 14;
    const data  = getDailyActivity(db, days);
    console.log(`\nDaily activity (last ${days} days):`);
    data.forEach(d => console.log(`  ${d.date}  A:${d.anchors} T:${d.attests} wallets:${d.unique_wallets}`));
    break;
  }
  case "anomalies": {
    const dbRw = new Database(DB_FILE);
    const result = runAnomalyChecks(dbRw);
    console.log(`\nAnomaly scan: bursts:${result.bursts} duplicates:${result.duplicateTitles} highVol:${result.newHighVolume}`);
    break;
  }
  case "proof": {
    const hash = sub;
    if (!hash) { console.error("Usage: node src/query.js proof <hash>"); break; }
    const p = db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${hash}%`);
    if (!p) { console.log("Not found:", hash); break; }
    Object.entries(p).forEach(([k,v]) => v != null && console.log(`  ${k.padEnd(14)} ${v}`));
    break;
  }
  case "wallet": {
    const address = sub;
    if (!address) { console.error("Usage: node src/query.js wallet <address>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC LIMIT 20").all(address);
    console.log(`\nProofs for ${address}: ${rows.length}`);
    rows.forEach(p => console.log(`  ${p.verified?"✓":"✗"} [${p.category}] "${(p.title||"—").slice(0,30)}" block:${p.block_height}`));
    break;
  }
  case "recent": {
    const limit = parseInt(sub) || 20;
    const rows = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
    rows.forEach(p => console.log(`  ${p.verified?"✓":"✗"} [${p.category}] ${p.sender?.slice(0,10)}... block:${p.block_height}`));
    break;
  }
  case "search": {
    if (!sub) { console.error("Usage: node src/query.js search <term>"); break; }
    const rows = db.prepare("SELECT * FROM proofs WHERE title LIKE ? OR sender LIKE ? OR hash LIKE ? LIMIT 20")
      .all(`%${sub}%`, `%${sub}%`, `%${sub}%`);
    console.log(`\nResults for "${sub}": ${rows.length}`);
    rows.forEach(p => console.log(`  [${p.category}] "${p.title||"—"}" block:${p.block_height}`));
    break;
  }
  case "top": {
    const limit = parseInt(sub) || 10;
    const rows = db.prepare(`SELECT sender, COUNT(*) as count FROM proofs WHERE category="anchor" GROUP BY sender ORDER BY count DESC LIMIT ?`).all(limit);
    rows.forEach((r,i) => console.log(`  #${i+1} ${r.sender?.slice(0,12)}...  ${r.count} anchors`));
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
      case "stats":  { let s; try { const ct = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c; console.log(`Celo: ${ct} txs`); } catch { console.log("No Celo data yet."); } break; }
      case "recent": { let rows = []; try { rows = db.prepare("SELECT * FROM celo_proofs ORDER BY block_number DESC LIMIT ?").all(parseInt(rest[0])||10); } catch {} rows.forEach(r => console.log(`  ${r.from_address?.slice(0,10)}... block:${r.block_number}`)); break; }
    }
    break;
  }
  case "report": {
    const address = sub;
    if (!address) { console.error("Usage: node src/query.js report <address>"); break; }
    const dbRw = new Database(DB_FILE);
    const report = saveWalletReport(dbRw, address);
    console.log(`Stacks: ${report.stacks?.totalTxs||0} · Celo: ${report.celo?.totalTxs||0}`);
    break;
  }
  default:
    console.log([
      "Commands:",
      "  stats | proof <hash> | wallet <addr> | recent [n] | search <term>",
      "  top [n] | export [json|csv] | celo [stats|recent] | report <addr>",
      "  leaderboard [n] | timeline [days] | anomalies | snapshot",
      "  issuers [--verified] | nfts [addr] | batch [id]",
      "  reputation [addr] | delegation | audit [n] | whitelist | router",
    ].join("\n"));
}

db.close();