'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X, Loader2 } from 'lucide-react';
import { trackEvent } from '@/hooks/useAnalytics';

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

    const activeConversationId = conversationId ?? crypto.randomUUID();
    if (!conversationId) {
      setConversationId(activeConversationId);
    }

    try {
      const apiUrl = '';
      const res = await fetch(`${apiUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: activeConversationId,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(
          errBody?.detail ? JSON.stringify(errBody.detail) : `Request failed with ${res.status}`
        );
      }

      const data: ChatResponse = await res.json();
      const botMsg: Message = { role: 'bot', content: data.response };
      setMessages(prev => [...prev, botMsg]);
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Sorry, I am unable to connect to the backend server.';
      const botMsg: Message = {
        role: 'bot',
        content: `Sorry, the chat request failed: ${message}`,
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
              const next = !isOpen;
              setIsOpen(next);
              if (next) trackEvent('/chatbot/open');
            }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded bg-gradient-to-tr from-accent-bright to-accent-deep px-5 py-3 shadow-raised transition-transform hover:scale-105 active:scale-95"
      >
        <MessageSquare className="h-5 w-5 text-ink-bg" />
        <span className="text-sm font-semibold text-ink-bg">Ask TerraGuard AI</span>
      </button>

      {isOpen && (
        <div role="dialog" aria-label="TerraGuard assistant" className="fixed bottom-20 right-6 z-50 flex flex-col w-[420px] max-w-[calc(100vw-2rem)] max-h-[80vh] glass-panel-elevated rounded-lg border border-ink-border shadow-raised overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-border">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-ok opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-ok" />
              </div>
              <span className="text-sm font-semibold text-content-primary">TerraGuard AI</span>
            </div>
            <button disabled={loading} onClick={() => {setMessages([]);setConversationId(null);}} className="text-xs text-content-secondary">New chat</button>
            <button aria-label="Close assistant"
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-content-secondary transition hover:bg-ink-raised hover:text-content-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] p-4 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-bright mb-3">Quick questions</p>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="block w-full text-left rounded border border-ink-border bg-ink-raised/50 px-3 py-2 text-sm text-content-secondary transition hover:border-accent/40 hover:bg-accent/[0.06] hover:text-content-primary"
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
                  className={`max-w-[80%] rounded-md px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-accent to-accent-deep text-content-primary font-medium'
                      : 'glass-panel text-content-primary'
                  }`}
                >
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="glass-panel rounded-md px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-accent-bright" />
                  <span className="text-sm text-content-secondary font-mono">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 px-4 py-3 border-t border-ink-border">
            <input
              aria-label="Your message to TerraGuard"
              maxLength={2000}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..."
              className="flex-1 rounded bg-ink-raised/50 border border-ink-border px-3 py-2 text-sm text-content-primary placeholder-content-tertiary outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center rounded bg-gradient-to-tr from-accent-bright to-accent-deep px-3 py-2 text-sm font-medium text-ink-bg transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
