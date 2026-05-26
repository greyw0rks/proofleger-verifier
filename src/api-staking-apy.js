// generated: jun7  api: api-staking-apy
import express from 'express';
const router = express.Router();
router.get('/staking-apy', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-staking-apy', tag: 'jun7' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-apy/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-staking-apy' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-apy/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-staking-apy', tag: 'jun7' });
});
export default router;
