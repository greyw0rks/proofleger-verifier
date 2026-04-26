/**
 * ProofLedger Verifier API v2 — updated Apr 30
 * New: /v2/governance, /v2/proposals/:id, /v2/zkp/:hash, /v2/mirror/:hash, /v2/stake/:address
 */
import http from "http";
import Database from "better-sqlite3";
import { applyMiddleware, setCacheHeader, setNoCacheHeader } from "./middleware.js";
import { proofCache, statsCache } from "./cache.js";
import { searchProofs, getRecentByAddress } from "./search.js";
import { getTopScores, getScore } from "./reputation-indexer.js";
import { getActiveDelegations } from "./delegation-indexer.js";
import { buildLeaderboard, getTopDocTypes } from "./leaderboard.js";
import { getProposals, getProposalVotes, getGovernanceStats } from "./governance-indexer.js";
import { getZKPsByHash, getZKPStats } from "./zkp-indexer.js";
import { getMirror, getMirrorStats } from "./mirror-indexer.js";
import { getStake, getTopStakers, getStakingStats } from "./staking-indexer.js";
import { CONFIG } from "./config.js";

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

  // GET /v2/health
  if (parts[1] === "health") {
    setNoCacheHeader(res);
    return json(res, { status: "ok", ts: new Date().toISOString() });
  }

  // GET /v2/verify/:hash
  if (parts[1] === "verify" && parts[2]) {
    const hash   = parts[2];
    const cached = proofCache.get(hash);
    if (cached) { setCacheHeader(res, 60); return json(res, cached); }
    const row = db.prepare("SELECT * FROM proofs WHERE hash = ? LIMIT 1").get(hash);
    let result;
    if (row) {
      result = { found: true, chain: "stacks", data: row };
    } else {
      let celoRow = null;
      try { celoRow = db.prepare("SELECT * FROM celo_proofs WHERE hash = ? LIMIT 1").get(hash); } catch {}
      result = celoRow ? { found: true, chain: "celo", data: celoRow } : { found: false, chain: "all" };
    }
    proofCache.set(hash, result, 120_000);
    setCacheHeader(res, 60);
    return json(res, result);
  }

  // GET /v2/stats
  if (parts[1] === "stats") {
    const cached = statsCache.get("stats");
    if (cached) { setCacheHeader(res, 30); return json(res, cached); }
    const s = db.prepare("SELECT * FROM stats WHERE id = 1").get();
    let celo = {};
    try {
      const ct = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c;
      const cw = db.prepare("SELECT COUNT(DISTINCT from_address) as c FROM celo_proofs").get().c;
      celo = { total: ct, wallets: cw };
    } catch {}
    const result = { stacks: s || {}, celo };
    statsCache.set("stats", result, 30_000);
    setCacheHeader(res, 30);
    return json(res, result);
  }

  // GET /v2/recent?limit=n
  if (parts[1] === "recent") {
    const limit = Math.min(parseInt(url.searchParams.get("limit")) || 20, 100);
    const rows  = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
    setCacheHeader(res, 15);
    return json(res, { results: rows, total: rows.length });
  }

  // GET /v2/search?q=...
  if (parts[1] === "search") {
    const q      = url.searchParams.get("q") || "";
    const offset = parseInt(url.searchParams.get("offset")) || 0;
    const chain  = url.searchParams.get("chain") || "all";
    if (q.length < 2) return json(res, { results: [], total: 0 });
    const result = searchProofs(db, q, { offset, chain });
    setCacheHeader(res, 15);
    return json(res, result);
  }

  // GET /v2/wallet/:address
  if (parts[1] === "wallet" && parts[2]) {
    const result = getRecentByAddress(db, parts[2]);
    setCacheHeader(res, 30);
    return json(res, result);
  }

  // GET /v2/reputation/:address
  if (parts[1] === "reputation" && parts[2]) {
    setCacheHeader(res, 60);
    return json(res, getScore(db, parts[2]) || { address: parts[2], score: 0 });
  }

  // GET /v2/leaderboard[/reputation]
  if (parts[1] === "leaderboard") {
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    if (parts[2] === "reputation") {
      setCacheHeader(res, 60);
      return json(res, { leaderboard: getTopScores(db, limit) });
    }
    if (parts[2] === "staking") {
      setCacheHeader(res, 60);
      return json(res, { leaderboard: getTopStakers(db, limit) });
    }
    setCacheHeader(res, 60);
    return json(res, { leaderboard: buildLeaderboard(db, limit), topDocTypes: getTopDocTypes(db, 5) });
  }

  // GET /v2/delegation/:address
  if (parts[1] === "delegation" && parts[2]) {
    const active = getActiveDelegations(db)
      .filter(d => d.delegator === parts[2] || d.delegate === parts[2]);
    setCacheHeader(res, 30);
    return json(res, { delegations: active });
  }

  // GET /v2/governance
  if (parts[1] === "governance" && !parts[2]) {
    const stats = getGovernanceStats(db);
    const proposals = getProposals(db, { limit: 10 });
    setCacheHeader(res, 30);
    return json(res, { stats, proposals });
  }

  // GET /v2/proposals/:id/votes
  if (parts[1] === "proposals" && parts[2] && parts[3] === "votes") {
    const votes = getProposalVotes(db, parseInt(parts[2]));
    setCacheHeader(res, 30);
    return json(res, { votes, total: votes.length });
  }

  // GET /v2/zkp/:hash
  if (parts[1] === "zkp" && parts[2]) {
    const attestations = getZKPsByHash(db, parts[2]);
    setCacheHeader(res, 60);
    return json(res, { attestations, total: attestations.length });
  }

  // GET /v2/mirror/:hash
  if (parts[1] === "mirror" && parts[2]) {
    const mirror = getMirror(db, parts[2]);
    setCacheHeader(res, 60);
    return json(res, mirror || { found: false });
  }

  // GET /v2/stake/:address
  if (parts[1] === "stake" && parts[2]) {
    const stake = getStake(db, parts[2]);
    setCacheHeader(res, 30);
    return json(res, stake || { address: parts[2], active: false });
  }

  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] API v2 listening on :${PORT}`);
});