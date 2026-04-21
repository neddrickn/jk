import { useEffect, useState } from 'react';
import { timeAgo } from './Dashboard.jsx';

const STATUSES = ['new', 'contacted', 'booked', 'completed', 'dead'];

export default function Pipeline() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, [filter]);
  async function load() {
    const q = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/leads${q}`).then(r => r.json());
    setLeads(res.leads || []);
  }

  async function updateStatus(id, status) {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    flash(`Status → ${status}`);
    load();
  }

  async function sendReview(id) {
    const res = await fetch('/api/reviews/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: id }),
    }).then(r => r.json());
    flash(res.sms?.stub ? 'Review request queued (SMS stub — configure Twilio)' : 'Review request sent');
  }

  function flash(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const selected = leads.find(l => l.id === selectedId);

  return (
    <div className="p-10 max-w-[1400px]">
      <div className="mb-8">
        <div className="section-num mb-3">§ 0 2 &nbsp; P I P E L I N E</div>
        <h1 className="font-display text-6xl text-oxide-50 tracking-tightest leading-[0.95]">
          Every signal.<br/>
          <span className="italic text-signal-400">Triaged.</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <FilterChip label="All"   active={filter === ''} onClick={() => setFilter('')} />
        {STATUSES.map(s => (
          <FilterChip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-oxide-400 font-mono text-[10px] tracking-widest uppercase">
              <th className="px-4 py-3 font-normal w-24">Priority</th>
              <th className="px-4 py-3 font-normal">Contact</th>
              <th className="px-4 py-3 font-normal">Source</th>
              <th className="px-4 py-3 font-normal">Service</th>
              <th className="px-4 py-3 font-normal">Summary</th>
              <th className="px-4 py-3 font-normal w-32">Status</th>
              <th className="px-4 py-3 font-normal w-20">When</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-oxide-400">
                No leads match this filter.
              </td></tr>
            )}
            {leads.map(lead => (
              <tr
                key={lead.id}
                onClick={() => setSelectedId(lead.id === selectedId ? null : lead.id)}
                className={`border-t border-oxide-700 cursor-pointer transition-colors ${
                  selectedId === lead.id ? 'bg-oxide-800/70' : 'hover:bg-oxide-800/40'
                }`}
              >
                <td className="px-4 py-3"><PriorityBar score={lead.priority_score} urgency={lead.urgency} /></td>
                <td className="px-4 py-3">
                  <div className="font-medium text-oxide-50">{lead.name || <em className="text-oxide-400">Unknown</em>}</div>
                  <div className="font-mono text-xs text-oxide-400">{lead.phone || lead.email || '—'}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-oxide-300">{lead.source.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-oxide-200">{lead.service_type || '—'}</td>
                <td className="px-4 py-3 text-oxide-200 max-w-sm truncate">{lead.ai_summary || lead.description || '—'}</td>
                <td className="px-4 py-3"><StatusPill status={lead.status} /></td>
                <td className="px-4 py-3 font-mono text-xs text-oxide-400 whitespace-nowrap">{timeAgo(lead.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-oxide-800 border-l border-oxide-700 p-8 overflow-y-auto fade-up shadow-2xl">
          <button
            onClick={() => setSelectedId(null)}
            className="text-oxide-400 hover:text-oxide-100 text-sm mb-6"
          >
            ← Close
          </button>

          <div className="section-num mb-2">Lead · {selected.id}</div>
          <h2 className="font-display text-4xl text-oxide-50 tracking-tightest mb-1">{selected.name || 'Unknown'}</h2>
          <div className="font-mono text-sm text-oxide-300 mb-6">{selected.phone || selected.email || '—'}</div>

          <Field label="Service"     value={selected.service_type} />
          <Field label="Urgency"     value={selected.urgency} />
          <Field label="Priority"    value={`${selected.priority_score}/100`} />
          <Field label="Address"     value={selected.address} />
          <Field label="AI Summary"  value={selected.ai_summary} multi />
          <Field label="Description" value={selected.description} multi />
          <Field label="Source"      value={selected.source.replace('_', ' ')} />
          <Field label="Created"     value={new Date(selected.created_at.replace(' ', 'T') + 'Z').toLocaleString()} />

          <div className="mt-8 pt-6 border-t border-oxide-700">
            <div className="section-num mb-3">Update status</div>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(selected.id, s)}
                  className={`px-3 py-2 text-xs font-mono uppercase tracking-widest border transition-colors ${
                    selected.status === s
                      ? 'border-signal-500 bg-signal-500/10 text-signal-400'
                      : 'border-oxide-600 text-oxide-300 hover:border-oxide-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {selected.status === 'completed' && (
              <button onClick={() => sendReview(selected.id)} className="btn-primary w-full justify-center">
                Request review via SMS
              </button>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-oxide-800 border border-signal-500/40 px-4 py-3 text-sm font-mono text-signal-400 fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
        active
          ? 'border-signal-500 bg-signal-500/10 text-signal-400'
          : 'border-oxide-600 text-oxide-300 hover:border-oxide-400'
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, value, multi }) {
  return (
    <div className="mb-4">
      <div className="section-num mb-1">{label}</div>
      <div className={`text-oxide-100 ${multi ? '' : 'font-mono text-sm'}`}>{value || <span className="text-oxide-500">—</span>}</div>
    </div>
  );
}

function PriorityBar({ score, urgency }) {
  const s = score ?? 0;
  const color = urgency === 'emergency' ? 'bg-ember' : s >= 70 ? 'bg-signal-500' : s >= 40 ? 'bg-signal-200' : 'bg-oxide-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-1 bg-oxide-700">
        <div className={`h-full ${color}`} style={{ width: `${s}%` }}></div>
      </div>
      <span className="font-mono text-xs text-oxide-300 tabular-nums">{s}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    new:       'bg-signal-500/20 text-signal-400',
    contacted: 'bg-oxide-600 text-oxide-100',
    booked:    'bg-moss/20 text-moss',
    completed: 'bg-moss/30 text-moss',
    dead:      'bg-oxide-700 text-oxide-400',
  };
  return <span className={`status-pill ${map[status] || map.new}`}>{status}</span>;
}
