// routes/reviews.js — Automatic review requests.
//
// Two ways to fire:
//   POST /api/reviews/send  { lead_id }  — manually trigger from the dashboard
//   POST /api/reviews/auto                — scan completed jobs, send to any that haven't been asked
//
// The typical flow: a dispatcher marks a lead as `status: completed` in the
// dashboard, which queues a review request. The owner reviews queued requests
// once a day or lets /auto run on a cron.

import { Router } from 'express';
import { leads, reviews } from '../db.js';
import { sendSms } from '../services/sms.js';

const router = Router();
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'our shop';
const REVIEW_LINK = process.env.GOOGLE_REVIEW_LINK || '';

function buildReviewMessage(name) {
  const first = (name || '').split(' ')[0] || 'there';
  const link = REVIEW_LINK || '[configure GOOGLE_REVIEW_LINK]';
  return `Hi ${first} — thanks for choosing ${BUSINESS_NAME}! If we did good work today, a quick 5-star review would mean a lot: ${link}`;
}

router.post('/send', async (req, res) => {
  const { lead_id } = req.body || {};
  if (!lead_id) return res.status(400).json({ error: 'lead_id required' });

  const lead = leads.get(lead_id);
  if (!lead) return res.status(404).json({ error: 'lead not found' });
  if (!lead.phone) return res.status(400).json({ error: 'lead has no phone' });

  const body = buildReviewMessage(lead.name);
  const result = await sendSms(lead.phone, body);
  const record = reviews.create({
    lead_id,
    channel: 'sms',
    status: result.sent || result.stub ? 'sent' : 'failed',
  });

  res.json({ ok: true, review_request: record, sms: result });
});

// Sweep: send review requests for every completed lead that hasn't been asked yet.
router.post('/auto', async (req, res) => {
  const completed = leads.list({ status: 'completed', limit: 500 });
  const sent = [];

  for (const lead of completed) {
    const already = reviews.list(500).some(r => r.lead_id === lead.id);
    if (already || !lead.phone) continue;

    const result = await sendSms(lead.phone, buildReviewMessage(lead.name));
    const record = reviews.create({
      lead_id: lead.id,
      channel: 'sms',
      status: result.sent || result.stub ? 'sent' : 'failed',
    });
    sent.push(record);
  }

  res.json({ ok: true, sent_count: sent.length, sent });
});

router.get('/', (req, res) => {
  res.json({ requests: reviews.list() });
});

// Public click-tracker — stick this in the SMS link if you want CTR metrics.
router.get('/click/:id', (req, res) => {
  reviews.markClicked(req.params.id);
  if (REVIEW_LINK) return res.redirect(REVIEW_LINK);
  res.send('Thanks!');
});

export default router;
