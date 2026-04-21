// routes/intake.js — Smart intake form endpoint.
// Public endpoint (no auth). The form POSTs here; we triage via AI and create a lead.

import { Router } from 'express';
import { leads } from '../db.js';
import { triageLead } from '../services/ai.js';
import { sendSms } from '../services/sms.js';

const router = Router();

router.post('/', async (req, res) => {
  const { name, phone, email, service_type, urgency, description, address } = req.body || {};

  if (!name && !phone && !email) {
    return res.status(400).json({ error: 'at minimum, name + phone or email required' });
  }

  // AI triage: assigns priority score + refined urgency + short summary.
  const triage = await triageLead({ name, phone, email, service_type, urgency, description, address });

  const lead = leads.create({
    source: 'intake_form',
    name, phone, email, service_type,
    urgency: triage.urgency,
    description, address,
    priority_score: triage.priority_score,
    ai_summary: triage.ai_summary,
  });

  // If it's an emergency, SMS the owner immediately.
  if (triage.urgency === 'emergency' && process.env.BUSINESS_OWNER_PHONE) {
    await sendSms(
      process.env.BUSINESS_OWNER_PHONE,
      `🚨 EMERGENCY LEAD: ${name || 'Unknown'} (${phone || 'no phone'}) — ${triage.ai_summary}`
    );
  }

  res.status(201).json({ ok: true, lead });
});

export default router;
