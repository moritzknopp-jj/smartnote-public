'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/useLanguage';
import { t } from '@/lib/i18n';
import {
  Brain,
  Upload,
  MessageSquare,
  Map,
  FileText,
  HelpCircle,
  Layers,
  Settings,
  Sun,
  Moon,
  Focus,
  Search,
} from 'lucide-react';

const navItems = [
  { href: '/', labelKey: 'sidebar.home', icon: Brain },
  { href: '/upload', labelKey: 'sidebar.upload', icon: Upload },
  { href: '/chat', labelKey: 'sidebar.chat', icon: MessageSquare },
  { href: '/mindmap', labelKey: 'sidebar.mindmap', icon: Map },
  { href: '/notes', labelKey: 'sidebar.notes', icon: FileText },
  { href: '/quiz', labelKey: 'sidebar.quiz', icon: HelpCircle },
  { href: '/flashcards', labelKey: 'sidebar.flashcards', icon: Layers },
  { href: '/settings', labelKey: 'sidebar.settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, focusMode, setFocusMode } = useAppStore();
  const [lang] = useLanguage();

  if (focusMode) return null;

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-screen w-[260px] z-40 flex flex-col border-r border-white/10 bg-surface-dark/95 backdrop-blur-xl dark:bg-surface-dark/95 light:bg-white/95"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
          <Brain className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          SMARTNOTE
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {/* Search button */}
        <button
          onClick={() => useAppStore.getState().setSearchOpen(true)}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-200 mb-2"
        >
          <Search className="h-[18px] w-[18px]" />
          {t(lang, 'sidebar.search')}
          <kbd className="ml-auto px-1.5 py-0.5 rounded text-[10px] text-gray-600 border border-white/10 bg-white/5">Ctrl+K</kbd>
        </button>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {t(lang, item.labelKey)}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-[3px] h-6 rounded-r-full bg-brand-500"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="px-4 py-4 border-t border-white/10 space-y-2">
        <button
          onClick={() => setFocusMode(true)}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
        >
          <Focus className="h-[18px] w-[18px]" />
          {t(lang, 'sidebar.focusMode')}
        </button>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
          {theme === 'dark' ? t(lang, 'sidebar.lightMode') : t(lang, 'sidebar.darkMode')}
        </button>
      </div>
    </motion.aside>
  );
}
