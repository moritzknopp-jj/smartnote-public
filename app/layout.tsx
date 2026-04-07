import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'react-hot-toast';
import KeyboardShortcuts from '@/components/keyboard-shortcuts';
import SearchDialog from '@/components/search-dialog';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SMARTNOTE — AI-Powered Study System',
  description: 'Transform any content into structured knowledge, visualizations, and learning tools.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <KeyboardShortcuts />
          <SearchDialog />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: '!bg-surface-dark-card !text-gray-100 !border !border-white/10',
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
