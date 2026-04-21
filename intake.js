// routes/chat.js — AI chatbot for the website widget.
// Auto-extracts contact fields as the conversation progresses and creates a lead
// the moment we have name + phone.

import { Router } from 'express';
import { chat, leads } from '../db.js';
import { chatReply, triageLead } from '../services/ai.js';

const router = Router();

router.post('/', async (req, res) => {
  const { session_id, message } = req.body || {};
  if (!session_id || !message) {
    return res.status(400).json({ error: 'session_id and message required' });
  }

  const conv = chat.getOrCreateConversation(session_id);
  chat.addMessage(conv.id, 'user', message);

  const history = chat.getMessages(conv.id).slice(0, -1); // exclude the message we just stored
  const { reply, extracted } = await chatReply(history, message);

  chat.addMessage(conv.id, 'assistant', reply);

  // Auto-create a lead when we've got enough to act on.
  if (extracted && (extracted.phone || extracted.email) && extracted.name && !conv.lead_id) {
    const triage = await triageLead(extracted);
    const lead = leads.create({
      source: 'chatbot',
      name: extracted.name,
      phone: extracted.phone,
      email: extracted.email,
      service_type: extracted.service_type,
      urgency: triage.urgency,
      description: extracted.description,
      address: extracted.address,
      priority_score: triage.priority_score,
      ai_summary: triage.ai_summary,
    });
    chat.linkLead(conv.id, lead.id);
  }

  res.json({ reply });
});

router.get('/:session_id', (req, res) => {
  const conv = chat.getOrCreateConversation(req.params.session_id);
  res.json({ messages: chat.getMessages(conv.id) });
});

export default router;
