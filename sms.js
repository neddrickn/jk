// routes/twilio.js — Twilio webhook endpoints.
//
// Two hookups to configure in the Twilio console for your business line:
//
// 1) "A call comes in" webhook  →  POST {host}/api/twilio/voice
//    (TwiML returns a dial to the owner's cell; falls through to voicemail)
//
// 2) "Call status changes" webhook  →  POST {host}/api/twilio/status
//    (Fires when the call ends. If no-answer/busy/failed, we text them back.)
//
// The text-back fires within seconds of the status webhook; in practice that's
// well under the 60-second target from the POST tier spec.

import { Router } from 'express';
import { calls, leads } from '../db.js';
import { sendSms } from '../services/sms.js';

const router = Router();
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'our shop';
const OWNER = process.env.BUSINESS_OWNER_PHONE;

// Inbound-call webhook — return TwiML that rings the owner, falling back to voicemail.
router.post('/voice', (req, res) => {
  res.type('text/xml');
  const statusCb = `${req.protocol}://${req.get('host')}/api/twilio/status`;

  // If no owner phone is configured, go straight to voicemail.
  const dial = OWNER
    ? `<Dial timeout="20" action="${statusCb}" method="POST"><Number>${OWNER}</Number></Dial>`
    : '';

  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${dial}
  <Say voice="alice">You've reached ${BUSINESS_NAME}. Please leave a message after the beep and we'll text you right back.</Say>
  <Record maxLength="90" action="${statusCb}" transcribe="true" transcribeCallback="${statusCb}" />
</Response>`);
});

// Status webhook — fires when the call ends. We text back on no-answer/busy/failed.
router.post('/status', async (req, res) => {
  const from = req.body.From || req.body.Caller;
  const to   = req.body.To;
  const status = (req.body.CallStatus || req.body.DialCallStatus || '').toLowerCase();
  const duration = parseInt(req.body.CallDuration || req.body.DialCallDuration || '0', 10);

  const event = calls.create({
    from_number: from,
    to_number: to,
    call_status: status,
    duration_sec: duration,
  });

  const missed = ['no-answer', 'busy', 'failed', 'canceled'].includes(status);
  if (missed && from) {
    const body = `Hi — this is ${BUSINESS_NAME}. Sorry we missed you! Reply here with what you need and your address and we'll get a tech scheduled. For emergencies, text "URGENT".`;
    const result = await sendSms(from, body);
    if (result.sent || result.stub) {
      calls.markTextback(event.id);
      // Create a "missed_call" lead so it hits the pipeline immediately.
      leads.create({
        source: 'missed_call',
        phone: from,
        description: 'Missed call — automated text-back sent',
        urgency: 'standard',
        priority_score: 65,
        ai_summary: `Missed call from ${from}`,
      });
    }
  }

  res.type('text/xml').send('<Response></Response>');
});

export default router;
