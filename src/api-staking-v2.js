import express from "express";
import { getStake, getTopStakers } from "./staking-v2-indexer.js";
import { getDelegation, getDelegatePower } from "./delegation-v2-indexer.js";
import { getRewardStats, getClaimInfo } from "./reward-indexer.js";
const router = express.Router();
router.get("/staking-v2/:address", (req, res) => {
  const stake = getStake(req.params.address);
  const delegation = getDelegation(req.params.address);
  res.json({ stake: stake ?? null, delegation: delegation ?? null });
});
router.get("/staking-v2/leaderboard", (req, res) => res.json({ leaderboard: getTopStakers(Math.min(Number(req.query.limit??10),50)) }));
router.get("/staking-v2/delegate-power/:address", (req, res) => res.json({ address: req.params.address, delegated_power: getDelegatePower(req.params.address) }));
router.get("/rewards/stats", (_req, res) => res.json(getRewardStats()));
router.get("/rewards/:address", (req, res) => res.json({ claim: getClaimInfo(req.params.address) ?? null }));
export default router;