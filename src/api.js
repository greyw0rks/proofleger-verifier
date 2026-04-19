/**
 * ProofLedger Verifier REST API
 * Exposes verified proof data over HTTP for external consumers
 */
import { createServer } from "http";

const PORT = process.env.PORT || 3001;

export function startAPI(db) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    try {
      if (url.pathname === "/stats") {
        const stats = db.prepare("SELECT * FROM stats WHERE id = 1").get();
        const total = db.prepare("SELECT COUNT(*) as c FROM proofs").get().c;
        res.end(JSON.stringify({ ...stats, total }));

      } else if (url.pathname === "/proof") {
        const hash = url.searchParams.get("hash");
        if (!hash) return res.end(JSON.stringify({ error: "hash required" }));
        const proof = db.prepare("SELECT * FROM proofs WHERE hash LIKE ?").get(`%${hash}%`);
        res.end(JSON.stringify(proof || { found: false }));

      } else if (url.pathname === "/wallet") {
        const address = url.searchParams.get("address");
        if (!address) return res.end(JSON.stringify({ error: "address required" }));
        const proofs = db.prepare("SELECT * FROM proofs WHERE sender = ? ORDER BY block_height DESC LIMIT 50").all(address);
        res.end(JSON.stringify({ address, proofs, total: proofs.length }));

      } else if (url.pathname === "/recent") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const proofs = db.prepare("SELECT * FROM proofs ORDER BY block_height DESC LIMIT ?").all(limit);
        res.end(JSON.stringify({ proofs, count: proofs.length }));

      } else if (url.pathname === "/search") {
        const q = url.searchParams.get("q") || "";
        const proofs = db.prepare("SELECT * FROM proofs WHERE title LIKE ? OR hash LIKE ? OR sender LIKE ? LIMIT 20")
          .all(`%${q}%`, `%${q}%`, `%${q}%`);
        res.end(JSON.stringify({ query: q, proofs, count: proofs.length }));

      } else if (url.pathname === "/health") {
        res.end(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }));

      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } catch(e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: e.message }));
    }
  });

  server.listen(PORT, () => {
    console.log(`[ProofLedger Verifier API] http://localhost:${PORT}`);
  });

  return server;
}