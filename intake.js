# Thalamus backend environment
# Copy to .env and fill in. The server runs without these, with reduced functionality.

# ─── Server ────────────────────────────────────────────────
PORT=4000
FRONTEND_ORIGIN=http://localhost:5173
BUSINESS_NAME="Acme Plumbing"
BUSINESS_OWNER_PHONE=+14045550199

# ─── Anthropic (AI chatbot + lead triage) ─────────────────
# https://console.anthropic.com/
ANTHROPIC_API_KEY=

# ─── Twilio (SMS textback + review requests) ──────────────
# https://console.twilio.com/
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+14045550100

# ─── Reviews ───────────────────────────────────────────────
# Paste the link customers see when leaving a Google review.
# Find it in Google Business Profile > "Get more reviews".
GOOGLE_REVIEW_LINK=https://g.page/r/your-business-id/review
