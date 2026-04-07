'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Quiz, QuizQuestion, QuizAttempt } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Trophy } from 'lucide-react';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (attempt: QuizAttempt) => void;
}

export default function QuizPlayer({ quiz, onComplete }: QuizPlayerProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [startTime] = useState(Date.now());

  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;

  const selectAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: answer }));
  };

  const nextQuestion = () => {
    if (isLast) {
      // Calculate score
      let score = 0;
      quiz.questions.forEach((q) => {
        if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          score++;
        }
      });

      const attempt: QuizAttempt = {
        id: Date.now().toString(36),
        quizId: quiz.id,
        answers,
        score,
        totalQuestions: quiz.questions.length,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: Math.round((Date.now() - startTime) / 1000),
      };

      setShowResult(true);
      onComplete(attempt);
    } else {
      setCurrentQ((i) => i + 1);
    }
  };

  if (showResult) {
    let score = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        score++;
      }
    });
    const pct = Math.round((score / quiz.questions.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <Trophy className={cn('mx-auto h-16 w-16 mb-4', pct >= 70 ? 'text-yellow-400' : 'text-gray-400')} />
        <h2 className="text-3xl font-bold text-gray-100 mb-2">{pct}%</h2>
        <p className="text-gray-400 mb-6">{score} / {quiz.questions.length} correct</p>

        <div className="space-y-3 max-w-xl mx-auto text-left">
          {quiz.questions.map((q) => {
            const isCorrect = answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
            return (
              <div
                key={q.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border',
                  isCorrect
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-red-500/20 bg-red-500/5'
                )}
              >
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-gray-200">{q.question}</p>
                  {!isCorrect && (
                    <p className="text-xs text-gray-400 mt-1">
                      Correct: <span className="text-green-400">{q.correctAnswer}</span>
                    </p>
                  )}
                  {q.explanation && (
                    <p className="text-xs text-gray-500 mt-1 italic">{q.explanation}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-gray-400">
          {currentQ + 1} / {quiz.questions.length}
        </span>
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
      >
        <div className="flex items-start gap-2">
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            question.type === 'multiple-choice' ? 'bg-blue-500/10 text-blue-400' :
            question.type === 'true-false' ? 'bg-purple-500/10 text-purple-400' :
            'bg-orange-500/10 text-orange-400'
          )}>
            {question.type}
          </span>
          <span className={cn(
            'px-2 py-0.5 rounded text-xs',
            question.difficulty === 'easy' ? 'bg-green-500/10 text-green-400' :
            question.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-red-500/10 text-red-400'
          )}>
            {question.difficulty}
          </span>
        </div>

        <h3 className="text-xl font-medium text-gray-100">{question.question}</h3>

        {/* Options */}
        {question.options ? (
          <div className="space-y-2">
            {question.options.map((opt) => (
              <button
                key={opt}
                onClick={() => selectAnswer(opt)}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border transition-all text-sm',
                  answers[question.id] === opt
                    ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/[0.07]'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => selectAnswer(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        )}

        <button
          onClick={nextQuestion}
          disabled={!answers[question.id]}
          className={cn(
            'px-6 py-2.5 rounded-xl text-sm font-medium transition-all',
            answers[question.id]
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          )}
        >
          {isLast ? 'Finish Quiz' : 'Next Question'}
        </button>
      </motion.div>
    </div>
  );
}
