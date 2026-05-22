// generated: may13  api: api-staking-rewards
import express from 'express';
const router = express.Router();
router.get('/staking-rewards', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-staking-rewards' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-rewards/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-staking-rewards' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-rewards/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-staking-rewards', tag: 'may13' });
});
export default router;
