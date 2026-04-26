/**
 * ProofLedger Verifier API v2 — updated Apr 27
 * New: /v2/reputation/:address, /v2/leaderboard/reputation, /v2/search
 */
import http from "http";
import Database from "better-sqlite3";
import { applyMiddleware, setCacheHeader, setNoCacheHeader } from "./middleware.js";
import { proofCache, statsCache } from "./cache.js";
import { searchProofs, getRecentByAddress } from "./search.js";
import { getTopScores, getScore } from "./reputation-indexer.js";
import { isDelegateAuthorized, getActiveDelegations } from "./delegation-indexer.js";
import { buildLeaderboard, getTopDocTypes } from "./leaderboard.js";
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
      result = celoRow
        ? { found: true, chain: "celo", data: celoRow }
        : { found: false, chain: "all" };
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
    const score = getScore(db, parts[2]);
    setCacheHeader(res, 60);
    return json(res, score || { address: parts[2], score: 0 });
  }

  // GET /v2/leaderboard/reputation
  if (parts[1] === "leaderboard" && parts[2] === "reputation") {
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const top   = getTopScores(db, limit);
    setCacheHeader(res, 60);
    return json(res, { leaderboard: top });
  }

  // GET /v2/leaderboard
  if (parts[1] === "leaderboard") {
    const limit = parseInt(url.searchParams.get("limit")) || 10;
    const lb    = buildLeaderboard(db, limit);
    const types = getTopDocTypes(db, 5);
    setCacheHeader(res, 60);
    return json(res, { leaderboard: lb, topDocTypes: types });
  }

  // GET /v2/delegation/:delegator
  if (parts[1] === "delegation" && parts[2]) {
    const active = getActiveDelegations(db)
      .filter(d => d.delegator === parts[2] || d.delegate === parts[2]);
    setCacheHeader(res, 30);
    return json(res, { delegations: active });
  }

  json(res, { error: "Not found" }, 404);
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] API v2 listening on :${PORT}`);
});