'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import { useAppStore } from '@/lib/store';
import { Settings, Check, AlertCircle, Loader2, Wifi, WifiOff, Key, Server, Download, Save, Languages } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { AIMode } from '@/lib/types';

export default function SettingsPage() {

  const { aiConfig, setAIConfig, theme, setTheme } = useAppStore();
  const [language, setLanguage] = useState<'en' | 'de'>(typeof window !== 'undefined' && localStorage.getItem('smartnote-lang') === 'de' ? 'de' : 'en');
  const [ollamaStatus, setOllamaStatus] = useState<{
    available: boolean;
    models: string[];
    checked: boolean;
  }>({ available: false, models: [], checked: false });
  const [isChecking, setIsChecking] = useState(false);
  const [downloadModel, setDownloadModel] = useState('llama3.2');
  const [customModelName, setCustomModelName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [saved, setSaved] = useState(false);

  const popularModels = [
    { name: 'llama3.2', size: '2.0 GB', desc: 'Meta Llama 3.2 3B' },
    { name: 'llama3.2:1b', size: '1.3 GB', desc: 'Meta Llama 3.2 1B' },
    { name: 'qwen3:4b', size: '2.6 GB', desc: 'Qwen 3 4B' },
    { name: 'qwen2.5:0.5b', size: '397 MB', desc: 'Qwen 2.5 0.5B' },
    { name: 'gemma3:4b', size: '3.3 GB', desc: 'Google Gemma 3 4B' },
    { name: 'phi4-mini', size: '2.5 GB', desc: 'Microsoft Phi-4 Mini' },
    { name: 'mistral', size: '4.1 GB', desc: 'Mistral 7B' },
    { name: 'deepseek-r1:7b', size: '4.7 GB', desc: 'DeepSeek R1 7B' },
  ];

  const handleDownloadModel = async () => {
    const modelName = downloadModel === '__custom__' ? customModelName.trim() : downloadModel;
    if (!modelName) {
      toast.error('Enter a model name');
      return;
    }
    setIsDownloading(true);
    setDownloadProgress('Starting download...');
    try {
      const res = await fetch('/api/ollama/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName, ollamaUrl: aiConfig.ollamaBaseUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Download failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            if (json.total && json.completed) {
              const pct = Math.round((json.completed / json.total) * 100);
              setDownloadProgress(`${json.status || 'Downloading'} — ${pct}%`);
            } else if (json.status) {
              setDownloadProgress(json.status);
            }
          } catch { /* ignore parse errors */ }
        }
      }

      toast.success(`Model "${modelName}" downloaded!`);
      setDownloadProgress('');
      setAIConfig({ ollamaModel: modelName });
      checkStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Download failed';
      toast.error(msg);
      setDownloadProgress('');
    } finally {
      setIsDownloading(false);
    }
  };

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(
        `/api/status?ollamaUrl=${encodeURIComponent(aiConfig.ollamaBaseUrl)}&hasGeminiKey=${!!aiConfig.geminiApiKey}`
      );
      const data = await res.json();
      setOllamaStatus({
        available: data.ollama.available,
        models: data.ollama.models,
        checked: true,
      });
      // Auto-select first available model if current model isn't installed
      if (data.ollama.available && data.ollama.models.length > 0) {
        const installed = data.ollama.models as string[];
        if (!installed.includes(aiConfig.ollamaModel)) {
          setAIConfig({ ollamaModel: installed[0] });
        }
      }
    } catch {
      setOllamaStatus({ available: false, models: [], checked: true });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modeOptions: { value: AIMode; label: string; description: string }[] = [
    { value: 'auto', label: 'Auto', description: 'Local for simple, cloud for complex' },
    { value: 'cloud', label: 'Cloud (Gemini)', description: 'Use Google Gemini API' },
    { value: 'local', label: 'Local (Ollama)', description: 'Use local Ollama models' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px]">
        <div className="max-w-2xl mx-auto px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{t(language, 'settings.title')}</h1>
            <p className="text-gray-500 mb-8">{t(language, 'settings.subtitle')}</p>

            <div className="space-y-8">
              {/* Language Toggle */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Languages className="h-5 w-5 text-brand-400" />
                  {t(language, 'settings.languageSection')}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setLanguage('en'); if (typeof window !== 'undefined') localStorage.setItem('smartnote-lang', 'en'); }}
                    className={cn('p-4 rounded-xl border text-center transition-all', language === 'en' ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20')}
                  >
                    {t(language, 'settings.english')}
                  </button>
                  <button
                    onClick={() => { setLanguage('de'); if (typeof window !== 'undefined') localStorage.setItem('smartnote-lang', 'de'); }}
                    className={cn('p-4 rounded-xl border text-center transition-all', language === 'de' ? 'border-brand-500 bg-brand-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20')}
                  >
                    {t(language, 'settings.german')}
                  </button>
                </div>
              </section>
              {/* AI Mode */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-brand-400" />
                  {t(language, 'settings.aiMode')}
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {modeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setAIConfig({ mode: option.value })}
                      className={cn(
                        'p-4 rounded-xl border text-left transition-all',
                        aiConfig.mode === option.value
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-200">{option.label}</span>
                        {aiConfig.mode === option.value && (
                          <Check className="h-4 w-4 text-brand-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Gemini API Key */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-brand-400" />
                  {t(language, 'settings.geminiKey')}
                </h2>
                <input
                  type="password"
                  value={aiConfig.geminiApiKey || ''}
                  onChange={(e) => setAIConfig({ geminiApiKey: e.target.value })}
                  placeholder={t(language, 'settings.geminiKeyPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
                />
                <p className="text-xs text-gray-600 mt-2">
                  {t(language, 'settings.geminiKeyHint')}
                </p>
                {aiConfig.mode !== 'local' && !aiConfig.geminiApiKey && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t(language, 'settings.geminiKeyRequired')}
                  </div>
                )}
              </section>

              {/* Ollama */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Server className="h-5 w-5 text-brand-400" />
                  {t(language, 'settings.ollama')}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t(language, 'settings.baseUrl')}</label>
                    <input
                      type="text"
                      value={aiConfig.ollamaBaseUrl}
                      onChange={(e) => setAIConfig({ ollamaBaseUrl: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t(language, 'settings.model')}</label>
                    {ollamaStatus.models.length > 0 ? (
                      <select
                        value={aiConfig.ollamaModel}
                        onChange={(e) => setAIConfig({ ollamaModel: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      >
                        {ollamaStatus.models.map((model) => (
                          <option key={model} value={model} className="bg-gray-900">
                            {model}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={aiConfig.ollamaModel}
                        onChange={(e) => setAIConfig({ ollamaModel: e.target.value })}
                        placeholder="llama3"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={checkStatus}
                      disabled={isChecking}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      {isChecking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wifi className="h-4 w-4" />
                      )}
                      {t(language, 'settings.checkConnection')}
                    </button>
                    {ollamaStatus.checked && (
                      <span
                        className={cn(
                          'flex items-center gap-1.5 text-xs',
                          ollamaStatus.available ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        {ollamaStatus.available ? (
                          <>
                            <Wifi className="h-3.5 w-3.5" />
                            {t(language, 'settings.connected')} ({ollamaStatus.models.length} models)
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3.5 w-3.5" />
                            {t(language, 'settings.notConnected')}
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </section>

              {/* Download Model */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5 text-brand-400" />
                  {t(language, 'settings.downloadModel')}
                </h2>
                <div className="space-y-3">
                  <select
                    value={downloadModel}
                    onChange={(e) => setDownloadModel(e.target.value)}
                    disabled={isDownloading}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  >
                    {popularModels.map((m) => (
                      <option key={m.name} value={m.name} className="bg-gray-900">
                        {m.name} — {m.desc} ({m.size})
                      </option>
                    ))}
                    <option value="__custom__" className="bg-gray-900">
                      Custom model name...
                    </option>
                  </select>

                  {downloadModel === '__custom__' && (
                    <input
                      type="text"
                      value={customModelName}
                      onChange={(e) => setCustomModelName(e.target.value)}
                      placeholder="e.g. codellama:13b"
                      disabled={isDownloading}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-gray-600"
                    />
                  )}

                  <button
                    onClick={handleDownloadModel}
                    disabled={isDownloading || !ollamaStatus.available}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                      isDownloading
                        ? 'bg-brand-500/20 text-brand-300 cursor-wait'
                        : 'bg-brand-500 hover:bg-brand-600 text-white'
                    )}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {isDownloading ? t(language, 'settings.downloading') : t(language, 'settings.download')}
                  </button>

                  {downloadProgress && (
                    <div className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-brand-300 font-mono">{downloadProgress}</p>
                    </div>
                  )}

                  {!ollamaStatus.available && ollamaStatus.checked && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Ollama must be running to download models
                    </p>
                  )}
                </div>
              </section>

              {/* AI Parameters */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4">{t(language, 'settings.aiParams')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t(language, 'settings.temperature')}</label>
                    <input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={aiConfig.temperature}
                      onChange={(e) => setAIConfig({ temperature: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">{t(language, 'settings.maxTokens')}</label>
                    <input
                      type="number"
                      min={256}
                      max={16384}
                      step={256}
                      value={aiConfig.maxTokens}
                      onChange={(e) => setAIConfig({ maxTokens: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                  </div>
                </div>
              </section>

              {/* Theme */}
              <section>
                <h2 className="text-lg font-semibold text-gray-200 mb-4">{t(language, 'settings.theme')}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {(['dark', 'light'] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => setTheme(themeOption)}
                      className={cn(
                        'p-4 rounded-xl border text-center transition-all',
                        theme === themeOption
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      )}
                    >
                      <span className="text-sm font-medium text-gray-200 capitalize">{themeOption === 'dark' ? t(language, 'settings.dark') : t(language, 'settings.light')}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Save Button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    // Zustand persist auto-saves, but trigger a manual write to confirm
                    useAppStore.persist.rehydrate();
                    setSaved(true);
                    toast.success(t(language, 'settings.saved'));
                    setTimeout(() => setSaved(false), 2000);
                  }}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all',
                    saved
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'
                  )}
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t(language, 'settings.saved')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {t(language, 'settings.save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
