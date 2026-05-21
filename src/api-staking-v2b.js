import express from "express";
const router = express.Router();
router.get("/staking-v2/:address", (req, res) => res.json({ stake: null, address: req.params.address }));
router.get("/staking-v2/leaderboard", (_req, res) => res.json({ leaderboard: [] }));
router.get("/staking-v2/stats", (_req, res) => res.json({ stats: {} }));
export default router;