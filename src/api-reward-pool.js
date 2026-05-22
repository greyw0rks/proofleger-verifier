// generated: may18  api: api-reward-pool
import express from 'express';
const router = express.Router();
router.get('/reward-pool', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-reward-pool' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/reward-pool/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-reward-pool' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/reward-pool/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-reward-pool', tag: 'may18' });
});
export default router;
