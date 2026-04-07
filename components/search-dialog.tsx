'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FileText, Map, MessageSquare, HelpCircle, Layers } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface SearchResult {
  type: 'note' | 'flashcard' | 'quiz' | 'text';
  title: string;
  snippet: string;
  href: string;
}

export default function SearchDialog() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchOpen, setSearchOpen, extractedText, knowledgeTree, flashcards, quizzes } = useAppStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const found: SearchResult[] = [];

    // Search extracted text
    if (extractedText) {
      const idx = extractedText.toLowerCase().indexOf(q);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(extractedText.length, idx + q.length + 60);
        found.push({
          type: 'text',
          title: 'Uploaded Content',
          snippet: (start > 0 ? '...' : '') + extractedText.slice(start, end) + (end < extractedText.length ? '...' : ''),
          href: '/notes',
        });
      }
    }

    // Search knowledge tree
    if (knowledgeTree) {
      for (const topic of knowledgeTree.topics) {
        if (topic.name.toLowerCase().includes(q) || topic.content?.toLowerCase().includes(q)) {
          found.push({
            type: 'note',
            title: topic.name,
            snippet: (topic.summary || topic.content || '').slice(0, 100),
            href: '/notes',
          });
        }
        for (const sub of topic.subtopics || []) {
          if (sub.name.toLowerCase().includes(q) || sub.content?.toLowerCase().includes(q)) {
            found.push({
              type: 'note',
              title: sub.name,
              snippet: (sub.summary || sub.content || '').slice(0, 100),
              href: '/notes',
            });
          }
        }
      }
    }

    // Search flashcards
    for (const card of flashcards) {
      if (card.front.toLowerCase().includes(q) || card.back.toLowerCase().includes(q)) {
        found.push({
          type: 'flashcard',
          title: card.front.slice(0, 60),
          snippet: card.back.slice(0, 80),
          href: '/flashcards',
        });
      }
    }

    // Search quizzes
    for (const quiz of quizzes) {
      for (const qn of quiz.questions) {
        if (qn.question.toLowerCase().includes(q)) {
          found.push({
            type: 'quiz',
            title: qn.question.slice(0, 60),
            snippet: `Answer: ${qn.correctAnswer}`,
            href: '/quiz',
          });
        }
      }
    }

    return found.slice(0, 15);
  }, [query, extractedText, knowledgeTree, flashcards, quizzes]);

  const typeIcon = {
    note: <FileText className="h-4 w-4 text-orange-400" />,
    text: <FileText className="h-4 w-4 text-blue-400" />,
    flashcard: <Layers className="h-4 w-4 text-purple-400" />,
    quiz: <HelpCircle className="h-4 w-4 text-red-400" />,
  };

  const handleSelect = (result: SearchResult) => {
    setSearchOpen(false);
    router.push(result.href);
  };

  if (!searchOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
        onClick={() => setSearchOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="w-full max-w-lg bg-surface-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
            <Search className="h-5 w-5 text-gray-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes, flashcards, quizzes..."
              className="flex-1 bg-transparent text-gray-200 placeholder:text-gray-600 focus:outline-none text-sm"
            />
            <kbd className="px-1.5 py-0.5 rounded text-xs text-gray-600 border border-white/10 bg-white/5">ESC</kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length > 0 ? (
              <div className="p-2 space-y-0.5">
                {results.map((result, i) => (
                  <button
                    key={`${result.type}-${i}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="mt-0.5">{typeIcon[result.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 truncate">{result.snippet}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-8 text-center text-sm text-gray-500">No results found</div>
            ) : (
              <div className="p-8 text-center text-sm text-gray-600">Type to search across all your content</div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
