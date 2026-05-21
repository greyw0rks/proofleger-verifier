// generated: may11  api: api-subscriptions
import express from 'express';
const router = express.Router();
router.get('/subscriptions', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-subscriptions' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/subscriptions/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-subscriptions' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/subscriptions/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-subscriptions', tag: 'may11' });
});
export default router;
