import express from "express";
import { getLatestPrice, getAllPrices } from "./oracle-indexer.js";
const router = express.Router();
router.get("/oracle/price", (req, res) => {
  const asset = (req.query.asset ?? "STX").toUpperCase();
  const price = getLatestPrice(asset);
  if (!price) return res.status(404).json({ error: "Asset not found" });
  res.json({ asset, price_usd: price.price / 1e6, sources: price.sources, updated_at: price.updated_at });
});
router.get("/oracle/prices", (_req, res) => res.json({ prices: getAllPrices().map(p => ({ asset: p.asset, price_usd: p.price / 1e6 })) }));
export default router;