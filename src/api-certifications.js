import express from "express";
const router = express.Router();
router.get('/certifications', (_req, res) => { try { res.json({ data: [], total: 0 }); } catch(e) { res.status(500).json({ error: e.message }); }});
router.get('/certifications/:id', (req, res) => { try { res.json({ id: req.params.id, data: null }); } catch(e) { res.status(500).json({ error: e.message }); }});
router.get('/certifications/stats', (_req, res) => res.json({ stats: {} }));
export default router;