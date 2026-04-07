'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import { useAppStore } from '@/lib/store';
import { FileText, AlertCircle, Download, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { exportTextToPDF } from '@/lib/export-pdf';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';

export default function NotesPage() {
  const { knowledgeTree, extractedText, studyDocument, setStudyDocument, aiConfig } = useAppStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [lang] = useLanguage();

  const generateDocument = async () => {
    if (!knowledgeTree) return;
    setIsGenerating(true);
    try {
      const treeStr = JSON.stringify(knowledgeTree, null, 2);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Based on this knowledge tree structure, generate a beautifully formatted study document as HTML. Include:
- Title section
- Each topic as a major section with headers
- Subtopics as sub-sections
- Key concepts highlighted in <strong> tags
- Summary bullet points for each section
- Clean, academic formatting

Knowledge tree:
${treeStr.slice(0, 6000)}`,
          config: aiConfig,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      setStudyDocument(data.response);
      toast.success('Study document generated!');
    } catch {
      toast.error('Failed to generate study document');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!knowledgeTree) return;
    const sections = knowledgeTree.topics.map((topic) => ({
      heading: topic.name,
      content: [
        topic.summary || '',
        topic.content || '',
        topic.keyConcepts?.length ? `Key Concepts: ${topic.keyConcepts.join(', ')}` : '',
        ...(topic.subtopics?.map((sub) => `\n  ${sub.name}\n  ${sub.content || sub.summary || ''}`) || []),
      ].filter(Boolean).join('\n'),
    }));
    exportTextToPDF(knowledgeTree.title, sections, `${knowledgeTree.title}.pdf`);
    toast.success('PDF exported!');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-100 mb-2">{t(lang, 'notes.title')}</h1>
                <p className="text-gray-500">{t(lang, 'notes.subtitle')}</p>
              </div>
              {knowledgeTree && (
                <div className="flex gap-2">
                  <button
                    onClick={generateDocument}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {studyDocument ? t(lang, 'notes.regenerate') : t(lang, 'notes.generate')} {t(lang, 'notes.document')}
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {t(lang, 'notes.exportPdf')}
                  </button>
                </div>
              )}
            </div>

            {/* Generated study document */}
            {studyDocument && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10"
              >
                <h3 className="text-sm font-medium text-brand-400 mb-4 uppercase tracking-wider">{t(lang, 'notes.studyDoc')}</h3>
                <div
                  className="prose prose-invert prose-sm max-w-none text-gray-300 [&_h1]:text-brand-300 [&_h2]:text-gray-200 [&_h3]:text-gray-300 [&_strong]:text-brand-300 [&_li]:text-gray-400"
                  dangerouslySetInnerHTML={{ __html: studyDocument }}
                />
              </motion.div>
            )}

            {knowledgeTree ? (
              <div id="notes-content" className="space-y-6">
                {/* Title */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-500/10 to-brand-700/10 border border-brand-500/20">
                  <h2 className="text-2xl font-bold text-brand-300 mb-2">
                    {knowledgeTree.title}
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    {knowledgeTree.summary}
                  </p>
                </div>

                {/* Topics */}
                {knowledgeTree.topics.map((topic, i) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/10"
                  >
                    <h3 className="text-xl font-semibold text-gray-200 mb-3">
                      {i + 1}. {topic.name}
                    </h3>
                    {topic.summary && (
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">{topic.summary}</p>
                    )}
                    {topic.content && (
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{topic.content}</p>
                    )}
                    {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {topic.keyConcepts.map((concept) => (
                          <span key={concept} className="px-2.5 py-1 rounded-lg bg-brand-500/10 text-brand-300 text-xs font-medium">
                            {concept}
                          </span>
                        ))}
                      </div>
                    )}
                    {topic.subtopics && topic.subtopics.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-brand-500/20 space-y-3">
                        {topic.subtopics.map((sub) => (
                          <div key={sub.id}>
                            <h4 className="text-sm font-medium text-gray-300 mb-1">{sub.name}</h4>
                            {sub.content && (
                              <p className="text-xs text-gray-500 leading-relaxed">{sub.content}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : extractedText ? (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <h3 className="text-lg font-medium text-gray-300 mb-3">{t(lang, 'notes.rawText')}</h3>
                <div className="max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono">
                    {extractedText.slice(0, 5000)}
                    {extractedText.length > 5000 && '\n\n... (truncated)'}
                  </pre>
                </div>
                <div className="mt-4">
                  <Link href="/upload" className="text-sm text-brand-400 hover:text-brand-300">
                    {t(lang, 'notes.goBackAnalyze')}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="h-16 w-16 text-gray-700 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">{t(lang, 'notes.noNotes')}</h3>
                <p className="text-sm text-gray-600 mb-6">{t(lang, 'notes.noNotesHint')}</p>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                >
                  <AlertCircle className="h-4 w-4" />
                  {t(lang, 'notes.goToUpload')}
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
