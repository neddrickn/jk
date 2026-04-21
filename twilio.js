// routes/leads.js — Lead pipeline CRUD for the dashboard.

import { Router } from 'express';
import { leads } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const { status } = req.query;
  res.json({ leads: leads.list({ status }) });
});

router.get('/stats', (req, res) => {
  res.json(leads.stats());
});

router.get('/:id', (req, res) => {
  const lead = leads.get(req.params.id);
  if (!lead) return res.status(404).json({ error: 'not found' });
  res.json(lead);
});

router.patch('/:id', (req, res) => {
  const existing = leads.get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const updated = leads.update(req.params.id, req.body || {});
  res.json(updated);
});

export default router;
