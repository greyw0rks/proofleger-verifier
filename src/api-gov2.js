import express from "express";
const router = express.Router();
router.get("/gov2/proposals", (_req, res) => res.json({ proposals: [] }));
router.get("/gov2/proposals/:id", (req, res) => res.json({ id: req.params.id, proposal: null }));
router.get("/gov2/proposals/:id/votes", (req, res) => res.json({ votes: [] }));
export default router;