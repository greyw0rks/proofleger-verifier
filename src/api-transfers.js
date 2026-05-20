import express from "express";
import { getHoldings, getTransferHistory } from "./transfer-indexer.js";
const router = express.Router();
router.get("/holdings/:address", (req, res) => res.json({ holdings: getHoldings(req.params.address) }));
router.get("/credentials/:id/transfers", (req, res) => res.json({ transfers: getTransferHistory(Number(req.params.id)) }));
export default router;