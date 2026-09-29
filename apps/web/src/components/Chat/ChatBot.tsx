'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  content: string;
}

interface ChatResponse {
  response: string;
  conversation_id: string;
}

const QUICK_QUESTIONS = [
  'What is my flood risk in Miami?',
  'Explain earthquake risk levels',
  'How to prepare for a cyclone?',
  'What does CAPE mean?',
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (msg?: string) => {
    const text = msg ?? input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    if (!conversationId) {
      setConversationId(crypto.randomUUID());
    }

    try {
      const res = await fetch('http://localhost:8000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
        }),
      });
      const data: ChatResponse = await res.json();
      const botMsg: Message = { role: 'bot', content: data.response };
      setMessages(prev => [...prev, botMsg]);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch {
      const botMsg: Message = {
        role: 'bot',
        content: 'Sorry, I am unable to connect to the backend server.',
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-tr from-violet-400 to-indigo-600 px-5 py-3 shadow-lg shadow-violet-500/25 transition-transform hover:scale-105 active:scale-95"
      >
        <MessageSquare className="h-5 w-5 text-slate-950" />
        <span className="text-sm font-semibold text-slate-950">Ask TerraGuard AI</span>
        <span className="absolute inset-0 rounded-full animate-ping bg-violet-400/40" />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex flex-col w-[380px] max-w-[calc(100vw-2rem)] glass-panel-elevated rounded-2xl border border-white/[0.10] shadow-2xl shadow-black/40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-white">TerraGuard AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300 mb-3">Quick questions</p>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="block w-full text-left rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-violet-300/30 hover:bg-violet-300/[0.06] hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-violet-500/80 to-indigo-600/80 text-white font-medium'
                      : 'glass-panel text-slate-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  <span className="text-sm text-slate-400 font-mono">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.08]">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 rounded-lg bg-white/[0.05] border border-white/[0.08] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/20 transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center rounded-lg bg-gradient-to-tr from-violet-400 to-indigo-600 px-3 py-2 text-sm font-medium text-slate-950 transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
