import { useState } from 'react';
import ChatWidget from '../components/ChatWidget.jsx';

const SERVICES = [
  { id: 'plumbing',   label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'hvac',       label: 'HVAC / Heating & Cooling' },
  { id: 'lawn',       label: 'Lawn / Landscape' },
  { id: 'pest',       label: 'Pest Control' },
  { id: 'cleaning',   label: 'Cleaning' },
  { id: 'other',      label: 'Something else' },
];

const URGENCIES = [
  { id: 'emergency', label: 'Emergency — right now', color: 'ember' },
  { id: 'standard',  label: 'This week',             color: 'signal' },
  { id: 'quote',     label: 'Just a quote',          color: 'oxide' },
];

export default function Intake() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    service_type: '', urgency: '', description: '',
    name: '', phone: '', email: '', address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(patch) { setForm(f => ({ ...f, ...patch })); }

  async function submit() {
    setSubmitting(true);
    await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-xl text-center fade-up">
          <div className="section-num mb-4">M E S S A G E &nbsp; R E C E I V E D</div>
          <h1 className="font-display text-7xl text-oxide-50 tracking-tightest leading-[0.95] mb-6">
            Thanks.<br/>
            <span className="italic text-signal-400">We've got it.</span>
          </h1>
          <p className="text-oxide-300 text-lg leading-relaxed">
            A technician will reach out shortly. If you said this is an emergency, expect a call within the next few minutes.
          </p>
        </div>
        <ChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header strip */}
      <header className="border-b border-oxide-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-baseline justify-between">
          <div>
            <div className="section-num">T H A L A M U S</div>
            <div className="font-display text-xl text-oxide-50 -mt-1">Service request</div>
          </div>
          <div className="font-mono text-xs text-oxide-400">
            Step {step} of 3
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 fade-up">
        {step === 1 && (
          <StepPanel
            num="01"
            title="What do you need?"
            italic="Pick one."
          >
            <div className="grid grid-cols-2 gap-3 mb-8">
              {SERVICES.map(s => (
                <button
                  key={s.id}
                  onClick={() => { update({ service_type: s.id }); setStep(2); }}
                  className={`text-left px-4 py-5 border transition-all ${
                    form.service_type === s.id
                      ? 'border-signal-500 bg-signal-500/5 text-oxide-50'
                      : 'border-oxide-600 text-oxide-200 hover:border-oxide-400 hover:bg-oxide-800/30'
                  }`}
                >
                  <div className="font-sans text-base">{s.label}</div>
                </button>
              ))}
            </div>
          </StepPanel>
        )}

        {step === 2 && (
          <StepPanel
            num="02"
            title="How urgent?"
            italic="We'll route accordingly."
          >
            <div className="space-y-3 mb-8">
              {URGENCIES.map(u => (
                <button
                  key={u.id}
                  onClick={() => { update({ urgency: u.id }); setStep(3); }}
                  className={`w-full text-left px-5 py-5 border flex items-center gap-4 transition-all ${
                    form.urgency === u.id
                      ? 'border-signal-500 bg-signal-500/5'
                      : 'border-oxide-600 hover:border-oxide-400 hover:bg-oxide-800/30'
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full bg-${u.color === 'oxide' ? 'oxide-400' : u.color === 'ember' ? 'ember beacon' : 'signal-500'}`}></span>
                  <span className="font-sans text-lg text-oxide-50">{u.label}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} className="text-oxide-400 hover:text-oxide-200 text-sm">← Back</button>
          </StepPanel>
        )}

        {step === 3 && (
          <StepPanel
            num="03"
            title="Where do we reach you?"
            italic="Quick — then we go."
          >
            <div className="space-y-4 mb-8">
              <Labeled label="Your name">
                <input
                  className="input-field"
                  value={form.name}
                  onChange={e => update({ name: e.target.value })}
                  placeholder="First and last"
                />
              </Labeled>
              <div className="grid grid-cols-2 gap-4">
                <Labeled label="Phone">
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={e => update({ phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </Labeled>
                <Labeled label="Email (optional)">
                  <input
                    className="input-field"
                    value={form.email}
                    onChange={e => update({ email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </Labeled>
              </div>
              <Labeled label="Address">
                <input
                  className="input-field"
                  value={form.address}
                  onChange={e => update({ address: e.target.value })}
                  placeholder="Street, city, zip"
                />
              </Labeled>
              <Labeled label="What's going on?">
                <textarea
                  rows={4}
                  className="input-field resize-none"
                  value={form.description}
                  onChange={e => update({ description: e.target.value })}
                  placeholder="Describe the issue in a few sentences — the more detail, the faster we can help."
                />
              </Labeled>
            </div>
            <div className="flex items-center justify-between">
              <button onClick={() => setStep(2)} className="text-oxide-400 hover:text-oxide-200 text-sm">← Back</button>
              <button
                onClick={submit}
                disabled={submitting || !form.name || !form.phone}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Send request →'}
              </button>
            </div>
          </StepPanel>
        )}
      </main>

      <ChatWidget />
    </div>
  );
}

function StepPanel({ num, title, italic, children }) {
  return (
    <div>
      <div className="section-num mb-4">§ {num}</div>
      <h1 className="font-display text-6xl text-oxide-50 tracking-tightest leading-[0.95] mb-2">
        {title}
      </h1>
      <p className="font-display italic text-3xl text-signal-400 mb-10">{italic}</p>
      {children}
    </div>
  );
}

function Labeled({ label, children }) {
  return (
    <label className="block">
      <div className="section-num mb-2">{label}</div>
      {children}
    </label>
  );
}
