import { useState, useEffect } from 'react';

export function useLanguage(): ["en" | "de", (lang: "en" | "de") => void] {
  const [language, setLanguage] = useState<'en' | 'de'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('smartnote-lang');
      if (stored === 'de' || stored === 'en') return stored;
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('smartnote-lang', language);
      window.dispatchEvent(new Event('smartnote-lang-change'));
    }
  }, [language]);

  return [language, setLanguage];
}
