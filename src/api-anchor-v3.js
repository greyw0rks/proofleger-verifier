import express from "express";
const router = express.Router();
router.get('/anchor-v3', (_req, res) => { try { res.json({ data: [], total: 0 }); } catch(e) { res.status(500).json({ error: e.message }); }});
router.get('/anchor-v3/:id', (req, res) => { try { res.json({ id: req.params.id, data: null }); } catch(e) { res.status(500).json({ error: e.message }); }});
router.get('/anchor-v3/stats', (_req, res) => res.json({ stats: {} }));
export default router;