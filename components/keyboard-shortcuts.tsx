'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = useAppStore.getState();

      // Ctrl+K / Cmd+K — toggle search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        store.setSearchOpen(!store.searchOpen);
        return;
      }

      // Escape — close search or exit focus mode
      if (e.key === 'Escape') {
        if (store.searchOpen) {
          store.setSearchOpen(false);
          return;
        }
        if (store.focusMode) {
          store.setFocusMode(false);
          return;
        }
      }

      // Ctrl+F — focus mode toggle (only when not in an input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !isEditing(e)) {
        // We don't prevent default here to preserve browser find
      }

      // Alt+number navigation (only when not editing)
      if (e.altKey && !isEditing(e)) {
        const routes: Record<string, string> = {
          '1': '/',
          '2': '/upload',
          '3': '/chat',
          '4': '/mindmap',
          '5': '/notes',
          '6': '/quiz',
          '7': '/flashcards',
          '8': '/settings',
        };
        if (routes[e.key]) {
          e.preventDefault();
          router.push(routes[e.key]);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router]);

  return null;
}

function isEditing(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}
