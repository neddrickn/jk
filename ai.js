// server.js — Thalamus unified server.
// Serves the built React frontend AND the API from one process.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import intakeRoutes from './routes/intake.js';
import leadsRoutes  from './routes/leads.js';
import chatRoutes   from './routes/chat.js';
import twilioRoutes from './routes/twilio.js';
import reviewsRoutes from './routes/reviews.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// In dev, the React dev server runs on :5173 and we allow CORS.
// In production, the frontend is served from the same origin, so CORS is a no-op.
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Twilio webhooks use form-encoded

// ─── API routes ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'thalamus',
    integrations: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    },
  });
});

app.use('/api/intake',  intakeRoutes);
app.use('/api/leads',   leadsRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/twilio',  twilioRoutes);
app.use('/api/reviews', reviewsRoutes);

// API 404
app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }));

// ─── Frontend static serving ────────────────────────────
// The built React app lives at ../frontend/dist after `npm run build`.
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// For any non-API route, serve index.html so React Router handles it client-side.
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'), err => {
    if (err) {
      res.status(500).send('Frontend not built. Run `npm run build` first.');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'internal error' });
});

app.listen(PORT, () => {
  console.log(`\n  Thalamus listening on :${PORT}`);
  console.log(`  Anthropic: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'stub (rule-based)'}`);
  console.log(`  Twilio:    ${process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'stub (console only)'}\n`);
});
