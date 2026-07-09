import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useRaceStore } from '../store/useRaceStore';
import { API_BASE } from '../lib/f1';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const STARTER_PROMPTS = [
  'Explain DRS like I\'m new to F1',
  'Verstappen vs Hamilton — compare their championships',
  'What is an undercut strategy?',
  'Why do tyres degrade during a race?',
];

export default function AskEngineer() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  // isBusy spans the whole request (disables the input); streamingId is only
  // set once the AI's reply bubble actually exists, so the bouncing-dots
  // "typing" indicator shows just for the gap between hitting send and the
  // first chunk arriving, and the growing bubble takes over after that.
  const [isBusy, setIsBusy] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  const messages = useRaceStore((state) => state.messages);
  const addMessage = useRaceStore((state) => state.addMessage);
  const setMessages = useRaceStore((state) => state.setMessages);
  const appendToMessage = useRaceStore((state) => state.appendToMessage);

  // A 401/403 means the stored token is missing/expired — bounce back to login
  // instead of leaving the user stuck looking at a cryptic inline error with no
  // way forward.
  const handleAuthFailure = () => {
    localStorage.removeItem('token');
    navigate('/auth');
  };

  // Runs once per mount — without this guard, revisiting the page re-appends the
  // entire saved history on top of whatever's already in the store (which persists
  // across navigation within the session), duplicating the whole conversation.
  useEffect(() => {
    if (hasLoadedHistory.current) return;
    hasLoadedHistory.current = true;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.status === 401 || response.status === 403) return handleAuthFailure();
        if (!response.ok) return;
        const history = await response.json();
        if (Array.isArray(history) && history.length > 0) {
          setMessages(history.map((item: any) => ({ id: item._id, role: item.role, text: item.text })));
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBusy]);

  const send = async (prompt: string) => {
    if (!prompt.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: prompt };
    addMessage(userMessage);
    setInput('');
    setIsBusy(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 401 || response.status === 403) return handleAuthFailure();

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        addMessage({ id: Date.now().toString(), role: 'ai', text: `⚠️ ${data?.error || 'No answer received.'}` });
        return;
      }

      // The backend streams the answer as plain text chunks as Gemini generates
      // them (real streaming, not a simulated typewriter effect) — read the
      // response body progressively and grow one AI bubble in place, the same
      // way ChatGPT-style interfaces render an in-flight reply. isBusy stays
      // true (keeping the input locked) for the whole read; streamingId just
      // swaps the bouncing-dots indicator for the growing bubble once the
      // first chunk has actually arrived.
      const aiMessageId = (Date.now() + 1).toString();
      addMessage({ id: aiMessageId, role: 'ai', text: '' });
      setStreamingId(aiMessageId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        appendToMessage(aiMessageId, decoder.decode(value, { stream: true }));
      }
    } catch (error) {
      addMessage({ id: Date.now().toString(), role: 'ai', text: '⚠️ Comm failure. Check the pit wall connection.' });
    } finally {
      setIsBusy(false);
      setStreamingId(null);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const isFreshConversation = messages.length <= 1;

  return (
    <div className="flex flex-col h-full w-full bg-[#050505]">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[#0d0e12]">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-[#e10600]/10 border border-[#e10600]/20">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e10600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 9h16M4 15h16M6 5l2 14M18 5l-2 14" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-wide text-white">Race Engineer</h1>
          <p className="text-[11px] text-gray-500 font-mono">Ask anything about F1 — stats, strategy, rules, history</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'ai' && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e10600]/10 border border-[#e10600]/20">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e10600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 9h16M4 15h16M6 5l2 14M18 5l-2 14" />
                </svg>
              </div>
            )}
            <div className={`max-w-[75%] p-4 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-white text-black rounded-br-sm'
                : 'bg-[#0d0e12] border border-white/5 text-gray-300 rounded-bl-sm'
            }`}>
              {msg.role === 'ai' && (
                <div className="text-[10px] text-[#e10600] font-bold tracking-widest uppercase mb-2">
                  Race Engineer
                </div>
              )}
              <div className={`text-sm leading-relaxed prose prose-invert prose-p:my-1.5 prose-strong:text-inherit prose-table:text-xs max-w-none ${msg.role === 'user' ? 'prose-invert-0 !text-black' : ''}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isBusy && !streamingId && (
          <div className="flex items-start gap-3 justify-start">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e10600]/10 border border-[#e10600]/20">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e10600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9h16M4 15h16M6 5l2 14M18 5l-2 14" />
              </svg>
            </div>
            <div className="bg-[#0d0e12] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Starter prompts — only shown before the conversation really begins */}
        {isFreshConversation && !isBusy && (
          <div className="pl-10 flex flex-wrap gap-2 pt-1">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-xs font-mono px-3 py-2 rounded-lg bg-[#0d0e12] border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-[#0d0e12]">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the pit wall..."
            className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#e10600]/60 transition-colors"
            disabled={isBusy}
          />
          <button
            type="submit"
            disabled={isBusy || !input.trim()}
            className="flex items-center justify-center w-12 rounded-xl bg-[#e10600] hover:bg-[#c20500] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
