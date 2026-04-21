// ChatWidget — drop-in floating chatbot.
// Persists its session_id in sessionStorage so the conversation survives tab
// refresh but not a full browser close. Talks to POST /api/chat.

import { useEffect, useRef, useState } from 'react';

function getSessionId() {
  let id = sessionStorage.getItem('thalamus_chat_sid');
  if (!id) {
    id = 'sid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('thalamus_chat_sid', id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm the assistant here. What's going on today?" },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: text }]);
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId.current, message: text }),
      }).then(r => r.json());
      setMessages(m => [...m, { role: 'assistant', content: res.reply || '…' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry — lost connection. Please try again.' }]);
    } finally {
      setSending(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating trigger */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-signal-500 hover:bg-signal-400 text-oxide-950 px-5 py-3 font-medium shadow-2xl flex items-center gap-2 fade-up"
        >
          <span className="inline-block w-2 h-2 rounded-full bg-oxide-950 beacon"></span>
          Chat with us
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[540px] bg-oxide-800 border border-oxide-600 shadow-2xl flex flex-col fade-up">
          <header className="px-4 py-3 border-b border-oxide-700 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-moss beacon"></span>
              <span className="font-display text-xl text-oxide-50 leading-none">Assistant</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-oxide-400 ml-1">online</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-oxide-400 hover:text-oxide-100 text-lg leading-none">×</button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
            {sending && <Bubble role="assistant" content="…" typing />}
          </div>

          <div className="border-t border-oxide-700 p-3 flex items-end gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Type your message…"
              className="input-field resize-none"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="btn-primary disabled:opacity-40 h-[38px]"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ role, content, typing }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
        isUser
          ? 'bg-signal-500 text-oxide-950'
          : 'bg-oxide-700 text-oxide-100 border border-oxide-600'
      } ${typing ? 'italic opacity-70' : ''}`}>
        {content}
      </div>
    </div>
  );
}
