'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import FlashcardViewer from '@/components/flashcard-viewer';
import { useAppStore } from '@/lib/store';
import { Layers, Loader2, AlertCircle, Plus, Download, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { exportFlashcardsToPDF } from '@/lib/export-pdf';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';

type FilterMode = 'all' | 'due' | 'easy' | 'medium' | 'hard';

export default function FlashcardsPage() {
  const { extractedText, aiConfig, flashcards, setFlashcards, updateFlashcard } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardCount, setCardCount] = useState(10);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [lang] = useLanguage();

  const generateFlashcards = async () => {
    if (!extractedText) {
      toast.error('Upload a document first');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Study Material',
          content: extractedText,
          count: cardCount,
          config: aiConfig,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Flashcard generation failed');
      }
      const data = await res.json();
      // Add spaced repetition defaults
      const newCards = data.flashcards.map((f: Record<string, unknown>) => ({
        ...f,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 0,
        nextReview: new Date().toISOString(),
      }));
      setFlashcards([...flashcards, ...newCards]);
      toast.success(`Generated ${newCards.length} flashcards`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate flashcards';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRateCard = (cardId: string, rating: 'easy' | 'good' | 'hard' | 'forgot') => {
    const card = flashcards.find((f) => f.id === cardId);
    if (!card) return;

    let { interval, easeFactor, repetitions } = card;

    if (rating === 'forgot') {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 3;
      else interval = Math.round(interval * easeFactor);

      if (rating === 'easy') easeFactor = Math.min(easeFactor + 0.15, 3.0);
      else if (rating === 'hard') easeFactor = Math.max(easeFactor - 0.2, 1.3);
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    updateFlashcard(cardId, {
      interval,
      easeFactor,
      repetitions,
      nextReview: nextReview.toISOString(),
    });
  };

  const filteredCards = useMemo(() => {
    const now = new Date();
    switch (filterMode) {
      case 'due':
        return flashcards.filter((f) => !f.nextReview || new Date(f.nextReview) <= now);
      case 'easy':
        return flashcards.filter((f) => f.difficulty === 'easy');
      case 'medium':
        return flashcards.filter((f) => f.difficulty === 'medium');
      case 'hard':
        return flashcards.filter((f) => f.difficulty === 'hard');
      default:
        return flashcards;
    }
  }, [flashcards, filterMode]);

  const dueCount = useMemo(() => {
    const now = new Date();
    return flashcards.filter((f) => !f.nextReview || new Date(f.nextReview) <= now).length;
  }, [flashcards]);

  const handleExportPDF = () => {
    exportFlashcardsToPDF(flashcards, 'smartnote-flashcards.pdf');
    toast.success('Flashcards exported as PDF!');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-100 mb-2">{t(lang, 'flashcards.title')}</h1>
                <p className="text-gray-500">{t(lang, 'flashcards.subtitle')}</p>
              </div>
              {flashcards.length > 0 && (
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {t(lang, 'flashcards.exportPdf')}
                </button>
              )}
            </div>

            {/* Stats */}
            {flashcards.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-xl font-bold text-brand-400">{flashcards.length}</p>
                  <p className="text-xs text-gray-500">{t(lang, 'flashcards.total')}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-xl font-bold text-amber-400">{dueCount}</p>
                  <p className="text-xs text-gray-500">{t(lang, 'flashcards.due')}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-xl font-bold text-green-400">
                    {flashcards.filter((f) => f.repetitions > 0).length}
                  </p>
                  <p className="text-xs text-gray-500">{t(lang, 'flashcards.reviewed')}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-xl font-bold text-purple-400">
                    {flashcards.filter((f) => f.repetitions >= 3).length}
                  </p>
                  <p className="text-xs text-gray-500">{t(lang, 'flashcards.mastered')}</p>
                </div>
              </div>
            )}

            {/* Generate section */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 mb-8">
              <h3 className="text-lg font-medium text-gray-200 mb-4">{t(lang, 'flashcards.generate')}</h3>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-400">{t(lang, 'flashcards.count')}</label>
                <select
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n} cards</option>
                  ))}
                </select>
              </div>
              {extractedText ? (
                <button
                  onClick={generateFlashcards}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isGenerating ? t(lang, 'flashcards.generating') : t(lang, 'flashcards.generateBtn')}
                </button>
              ) : (
                <Link href="/upload" className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                  <AlertCircle className="h-4 w-4" />
                  {t(lang, 'flashcards.uploadFirst')}
                </Link>
              )}
            </div>

            {/* Flashcard viewer */}
            {flashcards.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <div className="flex gap-1">
                      {(['all', 'due', 'easy', 'medium', 'hard'] as FilterMode[]).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setFilterMode(mode)}
                          className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                            filterMode === mode
                              ? 'bg-brand-500/20 text-brand-400'
                              : 'bg-white/5 text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {mode === 'due' ? `${t(lang, 'flashcards.due')} (${dueCount})` : t(lang, `flashcards.${mode}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setFlashcards([])}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t(lang, 'flashcards.clear')}
                  </button>
                </div>
                {filteredCards.length > 0 ? (
                  <FlashcardViewer flashcards={filteredCards} onRate={handleRateCard} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">{t(lang, 'flashcards.noMatch')}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Layers className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t(lang, 'flashcards.noFlashcards')}</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
