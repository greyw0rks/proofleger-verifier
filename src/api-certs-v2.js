import express from "express";
const router = express.Router();
router.get("/certs-v2/:hash", (req, res) => res.json({ hash: req.params.hash, cert: null }));
router.get("/certs-v2/issuer/:address", (req, res) => res.json({ certs: [] }));
router.get("/certs-v2/stats", (_req, res) => res.json({ stats: {} }));
export default router;