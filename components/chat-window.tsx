'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Trash2, Bot, User, Sparkles, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export default function ChatWindow() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { chatMessages, addChatMessage, clearChat, extractedText, aiConfig } = useAppStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    addChatMessage({ role: 'user', content: trimmed });
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          context: extractedText.slice(0, 4000),
          config: aiConfig,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      addChatMessage({ role: 'assistant', content: data.response });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      addChatMessage({
        role: 'assistant',
        content: `⚠️ ${message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Sparkles className="h-16 w-16 text-brand-500/30 mb-4" />
            </motion.div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">Ask anything about your notes</h3>
            <p className="text-sm text-gray-600 max-w-md">
              Upload a document first, then ask questions. The AI will use your content as context.
            </p>
            <div className="flex gap-2 mt-6">
              {['Summarize this', 'Key concepts?', 'Explain simply'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-brand-400 hover:border-brand-500/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'flex gap-3 max-w-3xl',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              )}
            >
              <div
                className={cn(
                  'flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center',
                  msg.role === 'user'
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'bg-white/10 text-gray-400'
                )}
              >
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%]',
                  msg.role === 'user'
                    ? 'bg-brand-500/15 text-gray-100 rounded-tr-md'
                    : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-md'
                )}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-gray-400" />
            </div>
            <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex-shrink-0 p-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your notes..."
              rows={1}
              className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 pr-12 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={cn(
                'absolute right-2 bottom-2 p-1.5 rounded-lg transition-all',
                input.trim()
                  ? 'text-brand-400 hover:bg-brand-500/20'
                  : 'text-gray-600'
              )}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-600">
            <Zap className="h-3 w-3" />
            {aiConfig.mode}
          </div>
        </div>
      </div>
    </div>
  );
}
