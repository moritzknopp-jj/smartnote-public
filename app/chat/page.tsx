'use client';

import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import ChatWindow from '@/components/chat-window';
import { useAppStore } from '@/lib/store';
import { AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';

export default function ChatPage() {
  const { extractedText, uploadedDocs } = useAppStore();
  const [lang] = useLanguage();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] flex flex-col h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h1 className="text-xl font-semibold text-gray-100">{t(lang, 'chat.title')}</h1>
              <p className="text-xs text-gray-500">
                {extractedText
                  ? t(lang, 'chat.usingDocs').replace('{count}', String(uploadedDocs.length)).replace('{chars}', extractedText.length.toLocaleString())
                  : t(lang, 'chat.askAnything')}
              </p>
            </div>
            {extractedText ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                <FileText className="h-3.5 w-3.5" />
                {t(lang, 'chat.contextLoaded')}
              </div>
            ) : (
              <Link
                href="/upload"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {t(lang, 'chat.uploadForContext')}
              </Link>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
