import express from "express";
import { getProposals, getProposalVotes } from "./governance-v2-indexer.js";
const router = express.Router();
router.get("/gov2/proposals", (_req, res) => res.json({ proposals: getProposals() }));
router.get("/gov2/proposals/:id/votes", (req, res) => res.json({ votes: getProposalVotes(Number(req.params.id)) }));
router.get("/gov2/proposals/:id", (req, res) => {
  const proposals = getProposals();
  const p = proposals.find(x => x.proposal_id === Number(req.params.id));
  if (!p) return res.status(404).json({ error: "Not found" });
  res.json({ proposal: p, votes: getProposalVotes(Number(req.params.id)) });
});
export default router;