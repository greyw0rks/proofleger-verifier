// generated: jun8  api: api-staking-pool
import express from 'express';
const router = express.Router();
router.get('/staking-pool', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-staking-pool', tag: 'jun8' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-pool/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-staking-pool' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/staking-pool/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-staking-pool', tag: 'jun8' });
});
export default router;
