/**
 * ProofLedger Verifier API v2
 * Extended endpoints with Celo data and combined multi-chain stats
 */
import { createServer } from "http";
import { getCeloStats } from "./celo-database.js";

const PORT = process.env.PORT || 3001;

export function startAPIv2(db) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      if (url.pathname === "/v2/stats") {
        const stacksStats = db.prepare("SELECT * FROM stats WHERE id = 1").get();
        const stacksTotal = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
        const celoStats   = getCeloStats(db);
        res.end(JSON.stringify({
          stacks: { ...stacksStats, total: stacksTotal },
          celo:   celoStats,
          combined: {
            totalTxs:    stacksTotal + celoStats.total,
            totalWallets: (stacksStats?.total_senders || 0) + celoStats.wallets,
            networks: 2,
          },
          updatedAt: new Date().toISOString(),
        }));

      } else if (url.pathname === "/v2/celo/recent") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const proofs = db.prepare("SELECT * FROM celo_proofs ORDER BY block_number DESC LIMIT ?").all(limit);
        res.end(JSON.stringify({ proofs, count: proofs.length }));

      } else if (url.pathname === "/v2/celo/wallet") {
        const address = url.searchParams.get("address");
        if (!address) return res.end(JSON.stringify({ error: "address required" }));
        const proofs = db.prepare("SELECT * FROM celo_proofs WHERE from_address = ? ORDER BY block_number DESC LIMIT 50").all(address);
        res.end(JSON.stringify({ address, proofs, total: proofs.length }));

      } else if (url.pathname === "/v2/wallet") {
        const address = url.searchParams.get("address");
        if (!address) return res.end(JSON.stringify({ error: "address required" }));
        const stacks = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC LIMIT 50").all(address);
        const celo   = db.prepare("SELECT * FROM celo_proofs WHERE from_address = ? ORDER BY block_number DESC LIMIT 50").all(address);
        res.end(JSON.stringify({ address, stacks, celo, total: stacks.length + celo.length }));

      } else if (url.pathname === "/health") {
        const stacksCount = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
        const celoCount   = db.prepare("SELECT COUNT(*) as c FROM celo_proofs").get().c;
        res.end(JSON.stringify({ status:"ok", stacks: stacksCount, celo: celoCount,
          timestamp: new Date().toISOString() }));

      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error:"Not found", availableRoutes:[
          "/v2/stats", "/v2/wallet", "/v2/celo/recent", "/v2/celo/wallet", "/health"
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