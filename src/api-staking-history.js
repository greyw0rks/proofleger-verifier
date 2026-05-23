// generated: may22  api: api-staking-history
import express from 'express';
const router = express.Router();
router.get('/staking-history', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-staking-history', tag: 'may22' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-history/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-staking-history' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-history/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-staking-history', tag: 'may22' });
});
export default router;
