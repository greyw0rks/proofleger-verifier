import express from "express";
const router = express.Router();
router.get("/oracle-v2/price", (_req, res) => res.json({ price: null, asset: "STX" }));
router.get("/oracle-v2/prices", (_req, res) => res.json({ prices: [] }));
router.get("/oracle-v2/stats", (_req, res) => res.json({ stats: {} }));
export default router;