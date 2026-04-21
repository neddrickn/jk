// db.js — SQLite store for Thalamus
// One file, one database. Zero config. Swap for Postgres when you need multi-writer.

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Respect DB_PATH if set (Railway volume mount), otherwise store alongside the backend.
const dbPath = process.env.DB_PATH || path.join(__dirname, 'thalamus.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id              TEXT PRIMARY KEY,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    source          TEXT NOT NULL,          -- intake_form | missed_call | chatbot | manual
    name            TEXT,
    phone           TEXT,
    email           TEXT,
    service_type    TEXT,                   -- plumbing | electrical | hvac | other
    urgency         TEXT,                   -- emergency | standard | quote
    description     TEXT,
    address         TEXT,
    status          TEXT NOT NULL DEFAULT 'new', -- new | contacted | booked | completed | dead
    priority_score  INTEGER DEFAULT 50,     -- 0-100, AI-generated
    ai_summary      TEXT,
    assigned_to     TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);
  CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

  CREATE TABLE IF NOT EXISTS call_events (
    id                TEXT PRIMARY KEY,
    received_at       TEXT NOT NULL DEFAULT (datetime('now')),
    from_number       TEXT,
    to_number         TEXT,
    call_status       TEXT,                 -- no-answer | busy | completed | failed
    duration_sec      INTEGER DEFAULT 0,
    textback_sent     INTEGER DEFAULT 0,    -- boolean
    textback_sent_at  TEXT,
    lead_id           TEXT REFERENCES leads(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    session_id  TEXT UNIQUE NOT NULL,
    started_at  TEXT NOT NULL DEFAULT (datetime('now')),
    lead_id     TEXT REFERENCES leads(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,          -- user | assistant
    content         TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

  CREATE TABLE IF NOT EXISTS review_requests (
    id                TEXT PRIMARY KEY,
    lead_id           TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    channel           TEXT NOT NULL,        -- sms | email
    sent_at           TEXT NOT NULL DEFAULT (datetime('now')),
    clicked_at        TEXT,
    review_submitted  INTEGER DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'sent' -- sent | clicked | submitted | failed
  );
`);

// ─── Leads ────────────────────────────────────────────────
export const leads = {
  create(data) {
    const id = nanoid(12);
    db.prepare(`
      INSERT INTO leads (id, source, name, phone, email, service_type, urgency,
                         description, address, priority_score, ai_summary)
      VALUES (@id, @source, @name, @phone, @email, @service_type, @urgency,
              @description, @address, @priority_score, @ai_summary)
    `).run({
      id,
      source: data.source,
      name: data.name ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      service_type: data.service_type ?? null,
      urgency: data.urgency ?? 'standard',
      description: data.description ?? null,
      address: data.address ?? null,
      priority_score: data.priority_score ?? 50,
      ai_summary: data.ai_summary ?? null,
    });
    return this.get(id);
  },

  get(id) {
    return db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  },

  list({ status, limit = 100 } = {}) {
    if (status) {
      return db.prepare('SELECT * FROM leads WHERE status = ? ORDER BY priority_score DESC, created_at DESC LIMIT ?').all(status, limit);
    }
    return db.prepare('SELECT * FROM leads ORDER BY priority_score DESC, created_at DESC LIMIT ?').all(limit);
  },

  update(id, patch) {
    const allowed = ['status', 'name', 'phone', 'email', 'service_type',
                     'urgency', 'description', 'address', 'priority_score',
                     'ai_summary', 'assigned_to'];
    const fields = Object.keys(patch).filter(k => allowed.includes(k));
    if (fields.length === 0) return this.get(id);
    const set = fields.map(f => `${f} = @${f}`).join(', ');
    db.prepare(`UPDATE leads SET ${set}, updated_at = datetime('now') WHERE id = @id`)
      .run({ ...patch, id });
    return this.get(id);
  },

  stats() {
    const row = db.prepare(`
      SELECT
        COUNT(*)                                                  AS total,
        SUM(CASE WHEN status = 'new'       THEN 1 ELSE 0 END)     AS new_count,
        SUM(CASE WHEN status = 'booked'    THEN 1 ELSE 0 END)     AS booked_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)     AS completed_count,
        SUM(CASE WHEN urgency = 'emergency' AND status != 'completed' AND status != 'dead' THEN 1 ELSE 0 END) AS emergencies_open,
        SUM(CASE WHEN date(created_at) = date('now') THEN 1 ELSE 0 END) AS today_count
      FROM leads
    `).get();
    return row;
  },
};

// ─── Call events ──────────────────────────────────────────
export const calls = {
  create(data) {
    const id = nanoid(12);
    db.prepare(`
      INSERT INTO call_events (id, from_number, to_number, call_status, duration_sec, lead_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, data.from_number, data.to_number, data.call_status, data.duration_sec ?? 0, data.lead_id ?? null);
    return db.prepare('SELECT * FROM call_events WHERE id = ?').get(id);
  },

  markTextback(id) {
    db.prepare("UPDATE call_events SET textback_sent = 1, textback_sent_at = datetime('now') WHERE id = ?").run(id);
  },

  recent(limit = 50) {
    return db.prepare('SELECT * FROM call_events ORDER BY received_at DESC LIMIT ?').all(limit);
  },
};

// ─── Conversations / chat ─────────────────────────────────
export const chat = {
  getOrCreateConversation(sessionId) {
    let conv = db.prepare('SELECT * FROM conversations WHERE session_id = ?').get(sessionId);
    if (!conv) {
      const id = nanoid(12);
      db.prepare('INSERT INTO conversations (id, session_id) VALUES (?, ?)').run(id, sessionId);
      conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    }
    return conv;
  },

  addMessage(conversationId, role, content) {
    const id = nanoid(12);
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)'
    ).run(id, conversationId, role, content);
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
  },

  getMessages(conversationId) {
    return db.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId);
  },

  linkLead(conversationId, leadId) {
    db.prepare('UPDATE conversations SET lead_id = ? WHERE id = ?').run(leadId, conversationId);
  },
};

// ─── Review requests ──────────────────────────────────────
export const reviews = {
  create(data) {
    const id = nanoid(12);
    db.prepare(`
      INSERT INTO review_requests (id, lead_id, channel, status)
      VALUES (?, ?, ?, ?)
    `).run(id, data.lead_id, data.channel, data.status ?? 'sent');
    return db.prepare('SELECT * FROM review_requests WHERE id = ?').get(id);
  },

  markClicked(id) {
    db.prepare("UPDATE review_requests SET clicked_at = datetime('now'), status = 'clicked' WHERE id = ?").run(id);
  },

  list(limit = 50) {
    return db.prepare(`
      SELECT r.*, l.name AS lead_name, l.phone AS lead_phone
      FROM review_requests r
      LEFT JOIN leads l ON l.id = r.lead_id
      ORDER BY r.sent_at DESC
      LIMIT ?
    `).all(limit);
  },

  countSentInLast(hours) {
    return db.prepare(
      `SELECT COUNT(*) AS n FROM review_requests WHERE sent_at > datetime('now', ?)`
    ).get(`-${hours} hours`).n;
  },
};

export default db;
