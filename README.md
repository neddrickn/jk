# Thalamus

The operating layer for the physical economy — starter implementation.

A backend dashboard + public-facing website that delivers the five features of the
**POST** tier from the Thalamus brief:

1. **Smart intake forms** — a 3-step public form that collects service type,
   urgency, and contact info. Submissions run through AI triage that assigns a
   priority score and a one-line summary.
2. **Missed-call text-back** — Twilio webhook catches no-answer / busy / failed
   calls and fires an SMS back within seconds, auto-creating a lead.
3. **AI chatbot** — a floating widget on the public site, backed by Claude. As
   the conversation develops, it extracts contact fields and auto-creates a lead
   the moment it has name + phone.
4. **Centralized lead pipeline** — one unified table of every lead from every
   source (form, missed call, chatbot), sorted by AI-assigned priority, with
   filtering and detail panels.
5. **Automatic review requests** — when a lead is marked `completed`, a review
   SMS can be sent individually or swept in bulk via one button / one cron job.

The server runs with **zero API keys**. Claude calls fall back to rule-based
triage; Twilio calls log to the console. Drop in real keys and the integrations
light up.

---

## Architecture

```
thalamus/
├── backend/          Express + SQLite API
│   ├── server.js     Entry — wires all routes
│   ├── db.js         Schema + query helpers
│   ├── routes/
│   │   ├── intake.js     POST /api/intake
│   │   ├── leads.js      GET/PATCH /api/leads
│   │   ├── chat.js       POST /api/chat
│   │   ├── twilio.js     POST /api/twilio/{voice,status}
│   │   └── reviews.js    POST /api/reviews/{send,auto}
│   └── services/
│       ├── ai.js     Claude wrapper with rule-based fallback
│       └── sms.js    Twilio wrapper with log-to-console fallback
│
└── frontend/         Vite + React + Tailwind
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Layout.jsx       Sidebar shell for operators
        │   └── ChatWidget.jsx   Embeddable floating chatbot
        └── pages/
            ├── Dashboard.jsx    §01 — stats + recent activity
            ├── Pipeline.jsx     §02 — lead table + status drawer
            ├── Reviews.jsx      §03 — review request log
            └── Intake.jsx       Public-facing smart form
```

Tech stack choices, with the reasoning:

| Choice                  | Why                                                |
|-------------------------|----------------------------------------------------|
| Node + Express          | Matches the Node-heavy GHL / n8n / Twilio ecosystem |
| SQLite (better-sqlite3) | Zero-config for your first N clients. Migrate to Postgres when you need multi-writer. |
| Vite + React            | Fastest dev loop. Tailwind for styling velocity.   |
| No auth (yet)           | Dashboard assumes you're the only operator. Add Clerk / Auth0 before client 1. |

---

## Running locally

**Prerequisites:** Node 18+.

```bash
# Backend
cd backend
cp .env.example .env           # edit keys (all optional for dev)
npm install
npm run dev                    # http://localhost:4000

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

Then visit:

- **http://localhost:5173** — operator dashboard
- **http://localhost:5173/intake** — public intake form (what customers see)

Submit a form; watch it appear on the dashboard. Flip its status to
`completed`; fire a review request.

---

## Wiring the real integrations

### Claude (AI chatbot + lead triage)

1. Get a key at https://console.anthropic.com/
2. Set `ANTHROPIC_API_KEY` in `backend/.env`
3. Restart the backend. The `/api/health` endpoint will report `anthropic: true`.

Without a key, leads get rule-based scoring based on keyword matching
(`"gushing"`, `"no heat"`, etc. → emergency), and the chatbot returns a static
fallback message.

### Twilio (missed-call text-back)

1. Buy a phone number in the Twilio console.
2. Under "A call comes in" → set to **Webhook → POST →
   `https://your-server.com/api/twilio/voice`**
3. Under "Call status changes" → **Webhook → POST →
   `https://your-server.com/api/twilio/status`**
4. Set in `backend/.env`:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER` (the number you bought)
   - `BUSINESS_OWNER_PHONE` (your cell — it'll ring before voicemail)

For local testing of webhooks, use [ngrok](https://ngrok.com/) to expose
`localhost:4000` and point Twilio at the ngrok URL.

### Google reviews

Set `GOOGLE_REVIEW_LINK` to the direct review link from your Google Business
Profile (under "Get more reviews"). This is what gets texted to customers after
a completed job.

---

## API surface

| Method | Endpoint                          | Purpose                               |
|--------|-----------------------------------|---------------------------------------|
| GET    | `/api/health`                     | Service + integration status          |
| POST   | `/api/intake`                     | Public: submit a lead from the form   |
| GET    | `/api/leads?status=new`           | List leads (optional status filter)   |
| GET    | `/api/leads/stats`                | Dashboard counters                    |
| GET    | `/api/leads/:id`                  | One lead                              |
| PATCH  | `/api/leads/:id`                  | Update status / any field             |
| POST   | `/api/chat`                       | Public: chatbot message               |
| GET    | `/api/chat/:session_id`           | Retrieve chat history                 |
| POST   | `/api/twilio/voice`               | Twilio inbound-call webhook           |
| POST   | `/api/twilio/status`              | Twilio call-status webhook            |
| POST   | `/api/reviews/send`               | Trigger a review SMS for one lead     |
| POST   | `/api/reviews/auto`               | Sweep all completed leads             |
| GET    | `/api/reviews`                    | List review requests                  |
| GET    | `/api/reviews/click/:id`          | Tracks click + redirects to Google    |

---

## What's deliberately not here

This is the minimum viable skeleton. Before running it for a real client, add:

- **Authentication** on the operator dashboard (Clerk, Auth0, or simple session auth).
- **Rate limiting** on the public endpoints (`/api/intake`, `/api/chat`) —
  start with `express-rate-limit`.
- **Postgres** in place of SQLite the moment you have more than one server or
  need concurrent writes beyond the single-machine limit.
- **Twilio webhook signature validation** — production must verify the
  `X-Twilio-Signature` header; see `twilio.validateRequest`.
- **A proper job queue** for review sweeps and outbound SMS bursts — BullMQ +
  Redis is the standard upgrade path.
- **Per-client tenancy** — currently the schema assumes one business. For a
  multi-client Thalamus, add a `clients` table and a `client_id` FK to leads,
  calls, conversations, and review_requests.

---

## Next features to build out (Relay / Command tier)

The foundation here extends cleanly:

- **Relay** adds: instant auto-estimates (prompt Claude with a rate card),
  self-serve booking (add a `jobs` table + a `/book` endpoint that checks
  availability), smart dispatch (integrate OptimoRoute), customer update SMS
  (hook into job status changes).
- **Command** adds: 24/7 voice receptionist (Vapi or Retell webhook that calls
  into this same `/api/chat` logic), custom AI agents (per-client system
  prompts), strategy dashboard (weekly Claude-generated ops report from the
  SQLite data).

The pattern stays the same: every signal in → triaged → routed → measured.

---

Built for operators, by operators. ⚡
