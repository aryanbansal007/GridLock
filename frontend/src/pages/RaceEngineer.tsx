import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRaceStore } from '../store/useRaceStore';
import { API_BASE } from '../lib/f1';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function AskEngineer() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  const messages = useRaceStore((state) => state.messages);
  const addMessage = useRaceStore((state) => state.addMessage);
  const setMessages = useRaceStore((state) => state.setMessages);

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
  }, [setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    addMessage(userMessage);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ prompt: input }),
      });

      const data = await response.json();
      if (response.ok && data.answer) {
        addMessage({ id: Date.now().toString(), role: 'ai', text: data.answer });
      } else {
        // Show the real reason (auth expired, Gemini failure, etc.) instead of a
        // generic message that hides what actually went wrong.
        addMessage({ id: Date.now().toString(), role: 'ai', text: `⚠️ ${data.error || 'No answer received.'}` });
      }
    } catch (error) {
      addMessage({ id: Date.now().toString(), role: 'ai', text: '⚠️ Comm failure. Check the pit wall connection.' });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/95">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-4 rounded-xl ${
              msg.role === 'user'
                ? 'bg-neutral-800 text-white rounded-br-none'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-bl-none'
            }`}>
              {msg.role === 'ai' && (
                <div className="text-[10px] text-red-500 font-bold tracking-widest uppercase mb-2">
                  Race Engineer
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-p:my-0 prose-strong:text-white">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl rounded-bl-none">
              <span className="text-sm text-neutral-500 animate-pulse">Calculating telemetry...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-neutral-800 bg-neutral-950">
        <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message the pit wall..."
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-600 transition-colors"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="bg-white text-black px-6 py-3 rounded-lg text-sm font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
