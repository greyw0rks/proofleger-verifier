import express from "express";
const router = express.Router();
router.get("/marketplace-v2/listings", (_req, res) => res.json({ listings: [] }));
router.get("/marketplace-v2/listings/:id", (req, res) => res.json({ id: req.params.id, listing: null }));
router.get("/marketplace-v2/stats", (_req, res) => res.json({ stats: {} }));
export default router;