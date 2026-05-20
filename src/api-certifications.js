import express from "express";
import { getCertification, getIssuerCertifications } from "./certification-indexer.js";
const router = express.Router();
router.get("/certifications/:hash", (req, res) => {
  const cert = getCertification(req.params.hash);
  if (!cert) return res.status(404).json({ error: "Not found" });
  res.json({ certification: cert });
});
router.get("/issuers/:address/certifications", (req, res) => res.json({ certifications: getIssuerCertifications(req.params.address) }));
export default router;