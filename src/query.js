/**
 * ProofLedger Verifier Query CLI — v1.6
 */
import Database from "better-sqlite3";
import { exportJSON, exportCSV }                           from "./export.js";
import { saveWalletReport }                                from "./wallet-report.js";
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
import { getMirrorStats }                                  from "./mirror-indexer.js";
import { getStakingStats, getTopStakers }                  from "./staking-indexer.js";
import { getVaultStats }                                   from "./vault-indexer.js";
import { getGovernanceStats, getProposals }                from "./governance-indexer.js";
import { getZKPStats }                                     from "./zkp-indexer.js";
import { getTalentStats, getTopBuilders }                  from "./talent-indexer.js";
import { getSDKStats, getActiveIntegrations }              from "./sdk-indexer.js";
import { takeSnapshot }                                    from "./snapshot.js";

const DB_FILE = "./proofs.db";
let db;
try { db = new Database(DB_FILE, { readonly: true }); }
catch { console.error("Database not found."); process.exit(1); }

const [,, cmd, sub, ...rest] = process.argv;

switch(cmd) {
  case "stats": {
    const s = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    const total = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
    let celoTotal = 0; try { celoTotal = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c; } catch {}
    let nfts = 0;   try { nfts   = db.prepare("SELECT COUNT(*) as c FROM nft_certs").get().c; } catch {}
    let issuers = 0; try { issuers = db.prepare("SELECT COUNT(*) as c FROM issuers").get().c; } catch {}
    const staking  = getStakingStats(db);
    const mirrors  = getMirrorStats(db);
    const govStats = getGovernanceStats(db);
    const talent   = getTalentStats(db);
    const sdkStats = getSDKStats(db);
    console.log("\nProofLedger Verifier — Full Stats");
    console.log("=".repeat(40));
    console.log(`Stacks proofs:     ${total}`);
    console.log(`Celo proofs:       ${celoTotal}`);
    console.log(`NFT certs:         ${nfts}`);
    console.log(`Issuers:           ${issuers}`);
    console.log(`Anchors:           ${s?.total_anchors||0}`);
    console.log(`Attestations:      ${s?.total_attests||0}`);
    console.log(`Unique wallets:    ${s?.total_senders||0}`);
    console.log(`Active stakers:    ${staking.total} (${staking.totalWeight} weight)`);
    console.log(`Mirrors:           ${mirrors.total} (${mirrors.confirmed} confirmed)`);
    console.log(`Gov proposals:     ${govStats.total} (${govStats.active} open)`);
    console.log(`Talent verified:   ${talent.valid} (avg score ${talent.avgScore})`);
    console.log(`SDK integrations:  ${sdkStats.active} active`);
    break;
  }
  case "talent": {
    const stats = getTalentStats(db);
    const top   = getTopBuilders(db, parseInt(sub) || 10);
    console.log(`\nTalent Protocol: ${stats.valid} verified · avg score ${stats.avgScore}`);
    top.forEach((b, i) =>
      console.log(`  #${i+1} ${b.address?.slice(0,12)}... score:${b.builder_score} passport:${b.passport_id}`)
    );
    break;
  }
  case "sdk": {
    const stats = getSDKStats(db);
    const apps  = getActiveIntegrations(db);
    console.log(`\nSDK Integrations: ${stats.active} active · ${stats.totalCalls} total calls`);
    console.log("By plan:", stats.byPlan?.map(p => `${p.plan}:${p.c}`).join(" ") || "none");
    apps.slice(0, 10).forEach(a =>
      console.log(`  [${a.plan}] "${a.name}" · ${a.call_count} calls`)
    );
    break;
  }
  case "governance": {
    const stats = getGovernanceStats(db);
    const props = getProposals(db, { limit: parseInt(sub) || 10 });
    console.log(`\nGovernance: ${stats.total} proposals · ${stats.active} open · ${stats.passed} passed`);
    props.forEach(p =>
      console.log(`  #${p.proposal_id} "${p.title?.slice(0,30)}" FOR:${p.votes_for} AGAINST:${p.votes_against} ${p.executed ? (p.passed ? "✓PASSED" : "✗FAILED") : "OPEN"}`)
    );
    break;
  }
  case "staking": {
    const stats = getStakingStats(db);
    const top   = getTopStakers(db, parseInt(sub) || 10);
    console.log(`\nStaking: ${stats.total} active · ${stats.totalStaked} uSTX · ${stats.totalWeight} weight`);
    top.forEach((s, i) =>
      console.log(`  #${i+1} ${s.staker?.slice(0,12)}... ${s.weight} weight (${(s.amount_ustx/1e6).toFixed(2)} STX)`)
    );
    break;
  }
  case "mirrors": {
    const stats = getMirrorStats(db);
    console.log(`\nMirrors: ${stats.total} total · ${stats.confirmed} confirmed · ${stats.agents} agents`);
    break;
  }
  case "audit": {
    const limit = parseInt(sub) || 20;
    const entries = getRecentAuditEntries(db, limit);
    const stats   = getAuditStats(db);
    console.log(`\nAudit: ${stats.total} entries · ${stats.actors} actors`);
    entries.forEach(e => console.log(`  [${e.action}] ${e.actor?.slice(0,10)}... → ${e.target}`));
    break;
  }
  case "leaderboard": {
    const limit   = parseInt(sub) || 10;
    const entries = buildLeaderboard(db, limit);
    console.log(`\nTop ${limit} by anchors:`);
    entries.forEach(e =>
      console.log(`  #${e.rank} ${e.address?.slice(0,12)}... A:${e.anchors} T:${e.attests} S:${e.score}`)
    );
    break;
  }
  case "timeline": {
    const days = parseInt(sub) || 14;
    const data  = getDailyActivity(db, days);
    console.log(`\nLast ${days} days:`);
    data.forEach(d => console.log(`  ${d.date}  A:${d.anchors} T:${d.attests} W:${d.unique_wallets}`));
    break;
  }
  case "proof": {
    const p = db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${sub}%`);
    if (!p) { console.log("Not found:", sub); break; }
    Object.entries(p).forEach(([k,v]) => v != null && console.log(`  ${k.padEnd(14)} ${v}`));
    break;
  }
  case "wallet": {
    if (!sub) break;
    const rows = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC LIMIT 20").all(sub);
    console.log(`\nProofs for ${sub}: ${rows.length}`);
    rows.forEach(p => console.log(`  ${p.verified?"✓":"✗"} [${p.category}] "${(p.title||"—").slice(0,30)}"`));
    break;
  }
  case "recent": {
    const limit = parseInt(sub) || 20;
    const rows = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
    rows.forEach(p => console.log(`  ${p.verified?"✓":"✗"} [${p.category}] ${p.sender?.slice(0,10)}... blk:${p.block_height}`));
    break;
  }
  case "snapshot": {
    const fname = takeSnapshot(DB_FILE);
    console.log("Snapshot saved:", fname);
    break;
  }
  case "export": {
    const fmt = sub || "json";
    const dbRw = new Database(DB_FILE);
    if (fmt === "csv") exportCSV(dbRw); else exportJSON(dbRw);
    break;
  }
  default:
    console.log([
      "Commands:",
      "  stats | proof <hash> | wallet <addr> | recent [n] | snapshot | export",
      "  leaderboard [n] | timeline [days] | staking [n] | mirrors",
      "  governance [n] | talent [n] | sdk | audit [n]",
      "  issuers | nfts [addr] | batch [id] | whitelist | router",
    ].join("\n"));
}

db.close();