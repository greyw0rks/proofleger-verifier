/**
 * ProofLedger Verifier API v2 — updated May 3
 * New: /v2/attestations/:hash, /v2/timeline
 */
import http from "http";
import Database from "better-sqlite3";
import { applyMiddleware, setCacheHeader, setNoCacheHeader } from "./middleware.js";
import { proofCache, statsCache }               from "./cache.js";
import { searchProofs, getRecentByAddress }     from "./search.js";
import { getTopScores, getScore }               from "./reputation-indexer.js";
import { getActiveDelegations }                 from "./delegation-indexer.js";
import { buildLeaderboard, getTopDocTypes }     from "./leaderboard.js";
import { getProposals, getProposalVotes, getGovernanceStats } from "./governance-indexer.js";
import { getZKPsByHash }                        from "./zkp-indexer.js";
import { getMirror }                            from "./mirror-indexer.js";
import { getStake, getTopStakers }              from "./staking-indexer.js";
import { getTalentAttestation, getTopBuilders, getTalentStats } from "./talent-indexer.js";
import { getUserAchievements }                  from "./achievement-indexer.js";
import { getBridgeStats }                       from "./bridge-indexer.js";
import { getAttestationsForHash, getHashAttestationStats } from "./attestation-indexer.js";
import { getDailyActivity }                     from "./timeline.js";
import { CONFIG }                               from "./config.js";

const PORT = CONFIG.PORT || 3001;
const db   = new Database("./proofs.db");

function json(res, data, status = 200) {
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  if (!applyMiddleware(req, res)) return;

  const url   = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts[1] === "health") { setNoCacheHeader(res); return json(res, { status: "ok", ts: new Date().toISOString() }); }

  if (parts[1] === "verify" && parts[2]) {
    const hash = parts[2]; const cached = proofCache.get(hash);
    if (cached) { setCacheHeader(res, 60); return json(res, cached); }
    const row = db.prepare("SELECT * FROM proofs WHERE hash = ? LIMIT 1").get(hash);
    let result;
    if (row) { result = { found: true, chain: "stacks", data: row }; }
    else { let c = null; try { c = db.prepare("SELECT * FROM celo_proofs WHERE hash = ? LIMIT 1").get(hash); } catch {}
      result = c ? { found: true, chain: "celo", data: c } : { found: false, chain: "all" }; }
    proofCache.set(hash, result, 120_000); setCacheHeader(res, 60); return json(res, result);
  }

  if (parts[1] === "stats") {
    const cached = statsCache.get("stats");
    if (cached) { setCacheHeader(res, 30); return json(res, cached); }
    const s = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    let celo = {}; try { celo = { total: db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c }; } catch {}
    const result = { stacks: s || {}, celo };
    statsCache.set("stats", result, 30_000); setCacheHeader(res, 30); return json(res, result);
  }

  if (parts[1] === "recent") {
    const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);
    setCacheHeader(res, 15);
    return json(res, { results: db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit) });
  }

  if (parts[1] === "search") {
    const q = url.searchParams.get("q") || "";
    if (q.length < 2) return json(res, { results: [], total: 0 });
    setCacheHeader(res, 15);
    return json(res, searchProofs(db, q, { offset: parseInt(url.searchParams.get("offset")) || 0 }));
  }

  if (parts[1] === "wallet"     && parts[2]) { setCacheHeader(res, 30); return json(res, getRecentByAddress(db, parts[2])); }
  if (parts[1] === "reputation" && parts[2]) { setCacheHeader(res, 60); return json(res, getScore(db, parts[2]) || { address: parts[2], score: 0 }); }

  if (parts[1] === "leaderboard") {
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    if (parts[2] === "reputation") { setCacheHeader(res, 60); return json(res, { leaderboard: getTopScores(db, limit) }); }
    if (parts[2] === "staking")    { setCacheHeader(res, 60); return json(res, { leaderboard: getTopStakers(db, limit) }); }
    if (parts[2] === "talent")     { setCacheHeader(res, 60); return json(res, { leaderboard: getTopBuilders(db, limit) }); }
    setCacheHeader(res, 60); return json(res, { leaderboard: buildLeaderboard(db, limit), topDocTypes: getTopDocTypes(db, 5) });
  }

  if (parts[1] === "delegation"  && parts[2]) { setCacheHeader(res, 30); return json(res, { delegations: getActiveDelegations(db).filter(d => d.delegator === parts[2] || d.delegate === parts[2]) }); }
  if (parts[1] === "governance"  && !parts[2]) { setCacheHeader(res, 30); return json(res, { stats: getGovernanceStats(db), proposals: getProposals(db, { limit: 10 }) }); }
  if (parts[1] === "proposals"   && parts[2] && parts[3] === "votes") { setCacheHeader(res, 30); return json(res, { votes: getProposalVotes(db, parseInt(parts[2])) }); }
  if (parts[1] === "zkp"         && parts[2]) { setCacheHeader(res, 60); return json(res, { attestations: getZKPsByHash(db, parts[2]) }); }
  if (parts[1] === "mirror"      && parts[2]) { setCacheHeader(res, 60); return json(res, getMirror(db, parts[2]) || { found: false }); }
  if (parts[1] === "stake"       && parts[2]) { setCacheHeader(res, 30); return json(res, getStake(db, parts[2]) || { active: false }); }
  if (parts[1] === "talent"      && parts[2]) { setCacheHeader(res, 60); return json(res, getTalentAttestation(db, parts[2]) || { score_valid: false }); }
  if (parts[1] === "talent"      && !parts[2]) { setCacheHeader(res, 60); return json(res, { stats: getTalentStats(db), top: getTopBuilders(db, 10) }); }
  if (parts[1] === "achievements"&& parts[2]) { setCacheHeader(res, 60); return json(res, { achievements: getUserAchievements(db, parts[2]) }); }
  if (parts[1] === "bridge")                  { setCacheHeader(res, 30); return json(res, { stats: getBridgeStats(db) }); }

  // NEW May 3 endpoints
  if (parts[1] === "attestations" && parts[2]) {
    const attestations = getAttestationsForHash(db, parts[2]);
    const stats        = getHashAttestationStats(db, parts[2]);
    setCacheHeader(res, 30);
    return json(res, { attestations, stats });
  }

  if (parts[1] === "timeline") {
    const days = Math.min(parseInt(url.searchParams.get("days")) || 14, 90);
    const timeline = getDailyActivity(db, days);
    setCacheHeader(res, 60);
    return json(res, { timeline, days });
  }

  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] API v2 listening on :${PORT}`);
});