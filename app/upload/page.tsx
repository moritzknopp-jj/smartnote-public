'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import FileUpload from '@/components/file-upload';
import { useAppStore } from '@/lib/store';
import { FileText, Link as LinkIcon, ArrowRight, CheckCircle, Loader2, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { formatFileSize } from '@/lib/utils';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';
// (Removed duplicate hook/store calls outside component)

export default function UploadPage() {

  const router = useRouter();
  const {
    setProcessing, isProcessing, processingStatus,
    setKnowledgeTree, aiConfig,
    uploadedDocs, addUploadedDoc, removeUploadedDoc, clearUploadedDocs,
    extractedText,
  } = useAppStore();
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [lang] = useLanguage();

  const handleFilesAccepted = async (files: File[]) => {
    if (files.length === 0) return;
    setProcessing(true, 'Uploading and extracting text...');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
        const data = await res.json();
        addUploadedDoc({
          name: file.name,
          size: file.size,
          text: data.text,
          uploadedAt: new Date().toISOString(),
        });
        toast.success(`Extracted ${data.chunkCount} chunks from ${file.name}`);
      }

      if (autoAnalyze) {
        setProcessing(false);
        setTimeout(() => analyzeContent(), 300);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setProcessing(true, 'Fetching content from URL...');
    try {
      const formData = new FormData();
      formData.append('url', urlInput.trim());
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'URL fetch failed');
      }
      const data = await res.json();
      addUploadedDoc({
        name: urlInput.trim().slice(0, 60),
        size: data.text.length,
        text: data.text,
        uploadedAt: new Date().toISOString(),
      });
      toast.success('Content extracted from URL');
      setUrlInput('');
      if (autoAnalyze) {
        setProcessing(false);
        setTimeout(() => analyzeContent(), 300);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'URL fetch failed';
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  const analyzeContent = async () => {
    const text = useAppStore.getState().extractedText;
    if (!text) {
      toast.error('Upload a document first');
      return;
    }
    setIsAnalyzing(true);
    setProcessing(true, 'Analyzing content with AI...');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, config: aiConfig }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Analysis failed');
      }
      const data = await res.json();
      setKnowledgeTree(data.tree);
      toast.success('Content analyzed! Check Mindmap and Notes.');
      router.push('/mindmap');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] flex flex-col h-screen">
        <div className="flex-1 flex flex-col">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-brand-400 mb-4">{t(lang, 'upload.title')}</h1>
            <p className="text-sm text-gray-400 mb-8">{t(lang, 'upload.subtitle')}</p>
            <FileUpload onFilesAccepted={handleFilesAccepted} isProcessing={isProcessing} processingStatus={processingStatus} />
            {/* Text preview */}
            {extractedText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
                <details className="group">
                  <summary className="flex items-center gap-2 text-sm text-green-400 cursor-pointer mb-2">
                    <CheckCircle className="h-4 w-4" />
                    {t(lang, 'upload.previewText').replace('{count}', extractedText.length.toLocaleString())}
                  </summary>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">
                      {extractedText.slice(0, 2000)}
                      {extractedText.length > 2000 && '\n\n... (truncated)'}
                    </pre>
                  </div>
                </details>
              </motion.div>
            )}
            {/* Action buttons */}
            {extractedText && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <button
                  onClick={analyzeContent}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium hover:from-brand-600 hover:to-brand-700 disabled:opacity-60 transition-all shadow-lg shadow-brand-500/20"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                  {isAnalyzing ? t(lang, 'upload.analyzing') : t(lang, 'upload.analyze')}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push('/chat')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-colors"
                >
                  {t(lang, 'upload.goToChat')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}
            {/* Processing overlay */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-6 rounded-2xl bg-brand-500/5 border border-brand-500/20 text-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-brand-400 mx-auto mb-3" />
                <p className="text-sm text-brand-300">{t(lang, 'upload.analyzingStatus')}</p>
                <p className="text-xs text-gray-500 mt-1">{t(lang, 'upload.analyzingHint')}</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
