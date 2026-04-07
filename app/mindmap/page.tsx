'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import MindmapViewer from '@/components/mindmap-viewer';
import { useAppStore } from '@/lib/store';
import { Map, Loader2, AlertCircle, X, Sparkles, Download, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';

export default function MindmapPage() {
  const { knowledgeTree, extractedText, aiConfig } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<{ id: string; name: string } | null>(null);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [lang] = useLanguage();

  const handleNodeClick = async (topicId: string, topicName: string) => {
    setSelectedNode({ id: topicId, name: topicName });
    setIsExplaining(true);
    setExplanation('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Explain the topic "${topicName}" in detail. Be clear and helpful.`,
          context: extractedText.slice(0, 4000),
          config: aiConfig,
        }),
      });
      if (!res.ok) throw new Error('Failed to get explanation');
      const data = await res.json();
      setExplanation(data.response);
    } catch {
      toast.error('Failed to generate explanation');
      setExplanation('Could not generate explanation. Check your AI settings.');
    } finally {
      setIsExplaining(false);
    }
  };

  const exportAsImage = useCallback(async () => {
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) {
      toast.error('Mindmap not found');
      return;
    }
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `mindmap-${knowledgeTree?.title || 'export'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Mindmap exported as PNG!');
    } catch {
      toast.error('Failed to export mindmap');
    }
  }, [knowledgeTree]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-100 mb-2">{t(lang, 'mindmap.title')}</h1>
                <p className="text-gray-500">
                  {knowledgeTree
                    ? `${t(lang, 'mindmap.visualizing')} ${knowledgeTree.title}`
                    : t(lang, 'mindmap.noMindmap')}
                </p>
              </div>
              {knowledgeTree && (
                <button
                  onClick={exportAsImage}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  {t(lang, 'mindmap.exportPng')}
                </button>
              )}
            </div>

            {knowledgeTree ? (
              <div className="space-y-6">
                <MindmapViewer tree={knowledgeTree} onNodeClick={handleNodeClick} />

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">{t(lang, 'mindmap.summary')}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{knowledgeTree.summary}</p>
                </div>

                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-brand-500/5 border border-brand-500/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-brand-400" />
                        <h3 className="text-lg font-semibold text-gray-200">{selectedNode.name}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {isExplaining ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t(lang, 'mindmap.generatingExplanation')}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{explanation}</div>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Map className="h-16 w-16 text-gray-700 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">{t(lang, 'mindmap.noMindmapYet')}</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t(lang, 'mindmap.noMindmapHint')}
                </p>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  <AlertCircle className="h-4 w-4" />
                  {t(lang, 'mindmap.goToUpload')}
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
