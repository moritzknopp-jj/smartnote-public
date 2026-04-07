'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Flashcard as FlashcardType } from '@/lib/types';
import { RotateCcw, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Zap, Target } from 'lucide-react';

interface FlashcardViewerProps {
  flashcards: FlashcardType[];
  onRate?: (cardId: string, rating: 'easy' | 'good' | 'hard' | 'forgot') => void;
}

export default function FlashcardViewer({ flashcards, onRate }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIndex % flashcards.length];

  const next = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i + 1) % flashcards.length);
  };

  const prev = () => {
    setIsFlipped(false);
    setCurrentIndex((i) => (i - 1 + flashcards.length) % flashcards.length);
  };

  const handleRate = (rating: 'easy' | 'good' | 'hard' | 'forgot') => {
    if (onRate) onRate(card.id, rating);
    next();
  };

  const difficultyColor = {
    easy: 'text-green-400 bg-green-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    hard: 'text-red-400 bg-red-500/10',
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>{(currentIndex % flashcards.length) + 1} / {flashcards.length}</span>
        <span className={cn('px-2 py-0.5 rounded-full text-xs', difficultyColor[card.difficulty])}>
          {card.difficulty}
        </span>
        {card.repetitions > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400">
            reviewed {card.repetitions}x
          </span>
        )}
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-lg h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isFlipped ? 'back' : 'front'}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'absolute inset-0 rounded-2xl border border-white/10 flex flex-col items-center justify-center p-8 text-center',
              isFlipped
                ? 'bg-gradient-to-br from-brand-500/10 to-brand-700/10'
                : 'bg-white/5'
            )}
          >
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
              {isFlipped ? 'Answer' : 'Question'}
            </p>
            <p className={cn(
              'text-lg leading-relaxed',
              isFlipped ? 'text-brand-300' : 'text-gray-200'
            )}>
              {isFlipped ? card.back : card.front}
            </p>
            <p className="text-xs text-gray-600 mt-4">Click to flip</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Nav controls */}
      <div className="flex items-center gap-4">
        <button onClick={prev} className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-brand-400 hover:border-brand-500/30 transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setIsFlipped(!isFlipped)} className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 hover:bg-brand-500/20 transition-colors">
          <RotateCcw className="h-5 w-5" />
        </button>
        <button onClick={next} className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-brand-400 hover:border-brand-500/30 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Spaced repetition rating */}
      {onRate && isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-gray-500 mr-2">How well did you know it?</span>
          <button
            onClick={() => handleRate('forgot')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
          >
            <ThumbsDown className="h-3 w-3" />
            Forgot
          </button>
          <button
            onClick={() => handleRate('hard')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs hover:bg-orange-500/20 transition-colors"
          >
            <Target className="h-3 w-3" />
            Hard
          </button>
          <button
            onClick={() => handleRate('good')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20 transition-colors"
          >
            <ThumbsUp className="h-3 w-3" />
            Good
          </button>
          <button
            onClick={() => handleRate('easy')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs hover:bg-green-500/20 transition-colors"
          >
            <Zap className="h-3 w-3" />
            Easy
          </button>
        </motion.div>
      )}
    </div>
  );
}
