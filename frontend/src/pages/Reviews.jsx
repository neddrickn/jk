import { useEffect, useState } from 'react';
import { timeAgo } from './Dashboard.jsx';

export default function Reviews() {
  const [requests, setRequests] = useState([]);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { load(); }, []);
  async function load() {
    const r = await fetch('/api/reviews').then(r => r.json());
    setRequests(r.requests || []);
  }

  async function autoSend() {
    setRunning(true);
    const r = await fetch('/api/reviews/auto', { method: 'POST' }).then(r => r.json());
    setRunning(false);
    setToast(`${r.sent_count} review request${r.sent_count === 1 ? '' : 's'} sent`);
    setTimeout(() => setToast(null), 3500);
    load();
  }

  return (
    <div className="p-10 max-w-[1400px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="section-num mb-3">§ 0 3 &nbsp; R E V I E W S</div>
          <h1 className="font-display text-6xl text-oxide-50 tracking-tightest leading-[0.95]">
            Every finished job,<br/>
            <span className="italic text-signal-400">asked.</span>
          </h1>
        </div>
        <button onClick={autoSend} disabled={running} className="btn-primary">
          {running ? 'Sending…' : 'Auto-send for all completed →'}
        </button>
      </div>

      <p className="text-oxide-300 max-w-2xl mb-10 leading-relaxed">
        When a lead's status flips to <span className="font-mono text-signal-400">completed</span>, a review request is
        queued for that customer. Press the button above to sweep the queue, or wire <span className="font-mono text-signal-400">POST /api/reviews/auto</span> to a cron
        for hands-free operation.
      </p>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-oxide-400 font-mono text-[10px] tracking-widest uppercase">
              <th className="px-4 py-3 font-normal">Customer</th>
              <th className="px-4 py-3 font-normal">Channel</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="px-4 py-3 font-normal">Sent</th>
              <th className="px-4 py-3 font-normal">Clicked</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-oxide-400">
                No review requests yet. Mark a lead as <span className="font-mono text-signal-400">completed</span> to start the loop.
              </td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} className="border-t border-oxide-700">
                <td className="px-4 py-3">
                  <div className="text-oxide-50">{r.lead_name || '—'}</div>
                  <div className="font-mono text-xs text-oxide-400">{r.lead_phone || '—'}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-oxide-300 uppercase">{r.channel}</td>
                <td className="px-4 py-3">
                  <span className={`status-pill ${
                    r.status === 'clicked' || r.status === 'submitted' ? 'bg-moss/20 text-moss'
                    : r.status === 'failed' ? 'bg-ember/20 text-ember'
                    : 'bg-signal-500/20 text-signal-400'
                  }`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-oxide-400">{timeAgo(r.sent_at)}</td>
                <td className="px-4 py-3 font-mono text-xs text-oxide-400">
                  {r.clicked_at ? timeAgo(r.clicked_at) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-oxide-800 border border-signal-500/40 px-4 py-3 text-sm font-mono text-signal-400 fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
