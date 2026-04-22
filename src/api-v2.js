/**
 * ProofLedger Verifier API v2 — Extended
 */
import { createServer } from "http";
import { getCeloStats } from "./celo-database.js";
import { buildLeaderboard, getTopDocTypes } from "./leaderboard.js";
import { getDailyActivity, getWeeklyActivity } from "./timeline.js";

const PORT = process.env.PORT || 3001;

export function startAPIv2(db) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      // ── Stats ────────────────────────────────────────────
      if (url.pathname === "/v2/stats") {
        const stacksStats = db.prepare("SELECT * FROM stats WHERE id = 1").get();
        const stacksTotal = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
        let celoStats = { total: 0, wallets: 0, recent: [] };
        try { celoStats = getCeloStats(db); } catch {}
        res.end(JSON.stringify({
          stacks: { ...stacksStats, total: stacksTotal },
          celo: celoStats,
          combined: { totalTxs: stacksTotal + celoStats.total, networks: 2 },
          updatedAt: new Date().toISOString(),
        }));

      // ── Leaderboard ───────────────────────────────────────
      } else if (url.pathname === "/v2/leaderboard") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        res.end(JSON.stringify({ entries: buildLeaderboard(db, limit) }));

      // ── Timeline ──────────────────────────────────────────
      } else if (url.pathname === "/v2/timeline/daily") {
        const days = Math.min(parseInt(url.searchParams.get("days") || "30"), 90);
        res.end(JSON.stringify({ days, data: getDailyActivity(db, days) }));

      } else if (url.pathname === "/v2/timeline/weekly") {
        const weeks = Math.min(parseInt(url.searchParams.get("weeks") || "12"), 52);
        res.end(JSON.stringify({ weeks, data: getWeeklyActivity(db, weeks) }));

      // ── Doc type breakdown ────────────────────────────────
      } else if (url.pathname === "/v2/doctypes") {
        res.end(JSON.stringify({ doctypes: getTopDocTypes(db, 10) }));

      // ── Wallet (both chains) ──────────────────────────────
      } else if (url.pathname === "/v2/wallet") {
        const address = url.searchParams.get("address");
        if (!address) return res.end(JSON.stringify({ error: "address required" }));
        const stacks = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC LIMIT 50").all(address);
        let celo = [];
        try { celo = db.prepare("SELECT * FROM celo_proofs WHERE from_address = ? ORDER BY block_number DESC LIMIT 50").all(address); } catch {}
        res.end(JSON.stringify({ address, stacks, celo, total: stacks.length + celo.length }));

      // ── Celo ──────────────────────────────────────────────
      } else if (url.pathname === "/v2/celo/recent") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        let proofs = [];
        try { proofs = db.prepare("SELECT * FROM celo_proofs ORDER BY block_number DESC LIMIT ?").all(limit); } catch {}
        res.end(JSON.stringify({ proofs, count: proofs.length }));

      } else if (url.pathname === "/v2/celo/wallet") {
        const address = url.searchParams.get("address");
        if (!address) return res.end(JSON.stringify({ error: "address required" }));
        let proofs = [];
        try { proofs = db.prepare("SELECT * FROM celo_proofs WHERE from_address = ? ORDER BY block_number DESC LIMIT 50").all(address); } catch {}
        res.end(JSON.stringify({ address, proofs, total: proofs.length }));

      // ── Proof lookup ──────────────────────────────────────
      } else if (url.pathname === "/v2/proof") {
        const hash = url.searchParams.get("hash");
        if (!hash) return res.end(JSON.stringify({ error: "hash required" }));
        const proof = db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${hash}%`);
        res.end(JSON.stringify(proof || { found: false }));

      // ── Recent ────────────────────────────────────────────
      } else if (url.pathname === "/v2/recent") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const proofs = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
        res.end(JSON.stringify({ proofs, count: proofs.length }));

      // ── Health ────────────────────────────────────────────
      } else if (url.pathname === "/health") {
        const stacksCount = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
        let celoCount = 0;
        try { celoCount = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c; } catch {}
        res.end(JSON.stringify({ status: "ok", stacks: stacksCount, celo: celoCount,
          timestamp: new Date().toISOString() }));

      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found", routes: [
          "/v2/stats", "/v2/leaderboard", "/v2/timeline/daily", "/v2/timeline/weekly",
          "/v2/doctypes", "/v2/wallet", "/v2/proof", "/v2/recent",
          "/v2/celo/recent", "/v2/celo/wallet", "/health"
        ]}));
      }
    } catch(e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
  });

  server.listen(PORT, () => console.log(`[API v2] http://localhost:${PORT}`));
  return server;
}