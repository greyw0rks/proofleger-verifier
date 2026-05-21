// generated: may11  api: api-doc-types
import express from 'express';
const router = express.Router();
router.get('/doc-types', (_req, res) => {
  try { res.json({ data: [], total: 0, module: 'api-doc-types' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/doc-types/:id', (req, res) => {
  try { res.json({ id: req.params.id, data: null, module: 'api-doc-types' }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/doc-types/stats', (_req, res) => {
  res.json({ stats: {}, module: 'api-doc-types', tag: 'may11' });
});
export default router;
