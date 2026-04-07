'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Sidebar from '@/components/sidebar';
import { useAppStore } from '@/lib/store';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';
import {
  Upload,
  MessageSquare,
  Map,
  FileText,
  HelpCircle,
  Layers,
  Brain,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Upload,
    titleKey: 'home.uploadTitle',
    descKey: 'home.uploadDesc',
    href: '/upload',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: MessageSquare,
    titleKey: 'home.chatTitle',
    descKey: 'home.chatDesc',
    href: '/chat',
    color: 'from-brand-500 to-pink-500',
  },
  {
    icon: Map,
    titleKey: 'home.mindmapTitle',
    descKey: 'home.mindmapDesc',
    href: '/mindmap',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: FileText,
    titleKey: 'home.notesTitle',
    descKey: 'home.notesDesc',
    href: '/notes',
    color: 'from-orange-500 to-amber-500',
  },
  {
    icon: HelpCircle,
    titleKey: 'home.quizTitle',
    descKey: 'home.quizDesc',
    href: '/quiz',
    color: 'from-red-500 to-rose-500',
  },
  {
    icon: Layers,
    titleKey: 'home.flashcardsTitle',
    descKey: 'home.flashcardsDesc',
    href: '/flashcards',
    color: 'from-violet-500 to-purple-500',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function HomePage() {
  const { extractedText, knowledgeTree } = useAppStore();
  const [lang] = useLanguage();
  const hasContent = extractedText.length > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <div className="max-w-5xl mx-auto px-8 py-12">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 mb-6 shadow-xl shadow-brand-500/20"
            >
              <Brain className="h-10 w-10 text-white" />
            </motion.div>

            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 bg-clip-text text-transparent">
                SMARTNOTE
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
              {t(lang, 'home.heroDesc')}
            </p>

            {!hasContent ? (
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-medium hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
              >
                <Upload className="h-5 w-5" />
                {t(lang, 'home.uploadCta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <Sparkles className="h-4 w-4" />
                {t(lang, 'home.contentLoaded')}
              </div>
            )}
          </motion.div>

          {/* Status bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 mb-12 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${hasContent ? 'bg-green-400' : 'bg-gray-600'}`} />
              {hasContent ? t(lang, 'home.statusDocLoaded') : t(lang, 'home.statusNoDoc')}
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${knowledgeTree ? 'bg-green-400' : 'bg-gray-600'}`} />
              {knowledgeTree ? t(lang, 'home.statusAnalyzed') : t(lang, 'home.statusNotAnalyzed')}
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              {t(lang, 'home.statusAiReady')}
            </div>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.href} variants={item}>
                  <Link href={feature.href}>
                    <motion.div
                      whileHover={{ scale: 1.03, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className="group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-brand-500/30 transition-all duration-300 cursor-pointer h-full"
                    >
                      <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-200 mb-1 group-hover:text-brand-400 transition-colors">
                        {t(lang, feature.titleKey)}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed">
                        {t(lang, feature.descKey)}
                      </p>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
