import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

const nav = [
  { num: '01', label: 'Overview',  to: '/dashboard' },
  { num: '02', label: 'Pipeline',  to: '/pipeline'  },
  { num: '03', label: 'Reviews',   to: '/reviews'   },
];

export default function Layout() {
  const { pathname } = useLocation();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(setHealth).catch(() => setHealth({ ok: false }));
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r border-oxide-700 bg-oxide-900/80 flex flex-col">
        <div className="px-6 py-6 border-b border-oxide-700">
          <div className="section-num mb-1">T H A L A M U S</div>
          <div className="font-display text-3xl text-oxide-50 leading-none tracking-tightest">
            Operating<br/>
            <span className="italic text-signal-400">layer.</span>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-baseline gap-4 px-6 py-3 border-l-2 transition-all ${
                  isActive
                    ? 'border-signal-500 bg-oxide-800/60 text-oxide-50'
                    : 'border-transparent text-oxide-300 hover:text-oxide-100 hover:bg-oxide-800/30'
                }`
              }
            >
              <span className="font-mono text-[11px] tracking-widest text-oxide-400">§ {item.num}</span>
              <span className="font-sans text-[15px]">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-oxide-700 px-6 py-4 text-[11px] font-mono text-oxide-400 space-y-1.5">
          <StatusRow label="Backend" ok={health?.ok} />
          <StatusRow label="Claude"  ok={health?.integrations?.anthropic} />
          <StatusRow label="Twilio"  ok={health?.integrations?.twilio} />
          <div className="pt-2 text-oxide-500">
            Public intake →{' '}
            <a href="/intake" className="text-signal-400 hover:underline">/intake</a>
          </div>
        </div>
      </aside>

      <main key={pathname} className="fade-up overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

function StatusRow({ label, ok }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className={`flex items-center gap-1.5 ${ok ? 'text-moss' : 'text-oxide-400'}`}>
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${ok ? 'bg-moss beacon' : 'bg-oxide-500'}`}></span>
        {ok ? 'LIVE' : 'STUB'}
      </span>
    </div>
  );
}
