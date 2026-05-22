// generated: may17  api: api-multisig-v2
import express from 'express';
const router = express.Router();
router.get('/multisig-v2', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-multisig-v2' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/multisig-v2/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-multisig-v2' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/multisig-v2/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-multisig-v2', tag: 'may17' });
});
export default router;
