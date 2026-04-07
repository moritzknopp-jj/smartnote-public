'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import QuizPlayer from '@/components/quiz-player';
import { useAppStore } from '@/lib/store';
import { HelpCircle, Loader2, AlertCircle, Plus, Play, Download, Trophy, RotateCcw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Quiz, QuizAttempt } from '@/lib/types';
import { exportQuizToPDF } from '@/lib/export-pdf';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';

export default function QuizPage() {
  const { extractedText, aiConfig, quizzes, addQuiz, setQuizzes, quizAttempts, addQuizAttempt } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [lang] = useLanguage();

  const generateQuiz = async () => {
    if (!extractedText) {
      toast.error('Upload a document first');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Study Material',
          content: extractedText,
          count: questionCount,
          config: aiConfig,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Quiz generation failed');
      }
      const data = await res.json();
      addQuiz(data.quiz);
      toast.success(`Quiz generated with ${data.quiz.questions.length} questions`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate quiz';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuizComplete = (attempt: QuizAttempt) => {
    addQuizAttempt(attempt);
    toast.success(`Score: ${attempt.score}/${attempt.totalQuestions}`);
    setActiveQuiz(null);
  };

  const handleExportQuiz = (quiz: Quiz) => {
    exportQuizToPDF(quiz, `quiz-${quiz.title}.pdf`);
    toast.success('Quiz exported as PDF!');
  };

  const getQuizAttempts = (quizId: string) =>
    quizAttempts.filter((a) => a.quizId === quizId);

  const getBestScore = (quizId: string) => {
    const attempts = getQuizAttempts(quizId);
    if (attempts.length === 0) return null;
    return Math.max(...attempts.map((a) => Math.round((a.score / a.totalQuestions) * 100)));
  };

  if (activeQuiz) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-[260px]">
          <div className="max-w-3xl mx-auto px-8 py-12">
            <button onClick={() => setActiveQuiz(null)} className="text-sm text-gray-400 hover:text-gray-200 mb-6">
              ← {t(lang, 'quiz.backToQuizzes')}
            </button>
            <QuizPlayer quiz={activeQuiz} onComplete={handleQuizComplete} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{t(lang, 'quiz.title')}</h1>
            <p className="text-gray-500 mb-8">{t(lang, 'quiz.subtitle')}</p>

            {/* Score history summary */}
            {quizAttempts.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-2xl font-bold text-brand-400">{quizAttempts.length}</p>
                  <p className="text-xs text-gray-500">{t(lang, 'quiz.attempts')}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {Math.round(quizAttempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / quizAttempts.length)}%
                  </p>
                  <p className="text-xs text-gray-500">{t(lang, 'quiz.avgScore')}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {Math.max(...quizAttempts.map((a) => Math.round((a.score / a.totalQuestions) * 100)))}%
                  </p>
                  <p className="text-xs text-gray-500">{t(lang, 'quiz.bestScore')}</p>
                </div>
              </div>
            )}

            {/* Generate section */}
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 mb-8">
              <h3 className="text-lg font-medium text-gray-200 mb-4">{t(lang, 'quiz.generateNew')}</h3>
              <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-400">{t(lang, 'quiz.questions')}</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                >
                  {[3, 5, 10, 15, 20].map((n) => (
                    <option key={n} value={n} className="bg-gray-900">{n} questions</option>
                  ))}
                </select>
              </div>

              {extractedText ? (
                <button
                  onClick={generateQuiz}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 disabled:opacity-60 transition-colors"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          {isGenerating ? t(lang, 'quiz.generating') : t(lang, 'quiz.generateQuiz')}
                </button>
              ) : (
                <Link href="/upload" className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                  <AlertCircle className="h-4 w-4" />
                  {t(lang, 'quiz.uploadFirst')}
                </Link>
              )}
            </div>

            {/* Quiz list */}
            {quizzes.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-400">{t(lang, 'quiz.yourQuizzes').replace('{count}', String(quizzes.length))}</h3>
                  <button
                    onClick={() => setQuizzes([])}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t(lang, 'quiz.clearAll')}
                  </button>
                </div>
                {quizzes.map((quiz) => {
                  const best = getBestScore(quiz.id);
                  const attempts = getQuizAttempts(quiz.id);
                  return (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-brand-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-200">{quiz.title}</h4>
                          <p className="text-xs text-gray-500">{quiz.questions.length} questions</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {best !== null && (
                            <span className={cn(
                              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                              best >= 80 ? 'bg-green-500/10 text-green-400' :
                              best >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            )}>
                              <Trophy className="h-3 w-3" />
                              Best: {best}%
                            </span>
                          )}
                          {attempts.length > 0 && (
                            <span className="text-xs text-gray-500">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveQuiz(quiz)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs hover:bg-brand-500/20 transition-colors"
                        >
                          {attempts.length > 0 ? <RotateCcw className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          {attempts.length > 0 ? t(lang, 'quiz.retry') : t(lang, 'quiz.start')}
                        </button>
                        <button
                          onClick={() => handleExportQuiz(quiz)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 text-xs hover:text-gray-200 transition-colors"
                        >
                          <Download className="h-3 w-3" />
                          {t(lang, 'quiz.pdf')}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">{t(lang, 'quiz.noQuizzes')}</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
