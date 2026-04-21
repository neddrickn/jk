import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => { load(); }, []);
  async function load() {
    const [s, l] = await Promise.all([
      fetch('/api/leads/stats').then(r => r.json()),
      fetch('/api/leads?limit=8').then(r => r.json()),
    ]);
    setStats(s);
    setLeads(l.leads || []);
  }

  return (
    <div className="p-10 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <div className="section-num mb-3">§ 0 1 &nbsp; O V E R V I E W</div>
          <h1 className="font-display text-6xl text-oxide-50 tracking-tightest leading-[0.95]">
            What's happening<br/>
            <span className="italic text-signal-400">right now.</span>
          </h1>
        </div>
        <div className="text-right font-mono text-xs text-oxide-400 space-y-1">
          <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
          <div>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-4 gap-px bg-oxide-700 mb-12 border border-oxide-700">
        <Stat label="New today"          value={stats?.today_count}     big />
        <Stat label="Emergencies open"   value={stats?.emergencies_open} accent={stats?.emergencies_open > 0} />
        <Stat label="Booked"             value={stats?.booked_count} />
        <Stat label="Completed (total)"  value={stats?.completed_count} />
      </div>

      {/* Recent leads */}
      <div className="mb-16">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="section-num mb-2">I N C O M I N G</div>
            <h2 className="font-display text-3xl text-oxide-50">Recent leads</h2>
          </div>
          <Link to="/pipeline" className="btn-ghost">View all →</Link>
        </div>

        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-oxide-400 font-mono text-[10px] tracking-widest uppercase">
                <th className="px-4 py-3 font-normal">Priority</th>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="px-4 py-3 font-normal">Source</th>
                <th className="px-4 py-3 font-normal">Summary</th>
                <th className="px-4 py-3 font-normal">Status</th>
                <th className="px-4 py-3 font-normal">When</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-oxide-400">
                  No leads yet. Submit one at{' '}
                  <Link to="/intake" className="text-signal-400 underline">/intake</Link> to see it flow through.
                </td></tr>
              )}
              {leads.map(lead => <LeadRow key={lead.id} lead={lead} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, big, accent }) {
  const v = value ?? 0;
  return (
    <div className="bg-oxide-900 p-6">
      <div className="section-num mb-3">{label}</div>
      <div className={`font-display leading-none tracking-tightest ${big ? 'text-7xl' : 'text-6xl'} ${accent ? 'text-ember' : 'text-oxide-50'}`}>
        {String(v).padStart(2, '0')}
      </div>
    </div>
  );
}

function LeadRow({ lead }) {
  return (
    <tr className="border-t border-oxide-700 hover:bg-oxide-800/40 transition-colors">
      <td className="px-4 py-3">
        <PriorityBar score={lead.priority_score} urgency={lead.urgency} />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-oxide-50">{lead.name || <em className="text-oxide-400">Unknown</em>}</div>
        <div className="font-mono text-xs text-oxide-400">{lead.phone || lead.email || '—'}</div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-oxide-300">
        {lead.source.replace('_', ' ')}
      </td>
      <td className="px-4 py-3 text-oxide-200 max-w-sm truncate">
        {lead.ai_summary || lead.description || '—'}
      </td>
      <td className="px-4 py-3">
        <StatusPill status={lead.status} />
      </td>
      <td className="px-4 py-3 font-mono text-xs text-oxide-400 whitespace-nowrap">
        {timeAgo(lead.created_at)}
      </td>
    </tr>
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

export function timeAgo(ts) {
  // SQLite stores UTC in 'YYYY-MM-DD HH:MM:SS' format; treat as UTC.
  const d = new Date(ts.replace(' ', 'T') + 'Z');
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}
