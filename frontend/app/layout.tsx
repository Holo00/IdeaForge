import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'IdeaForge',
  description: 'AI-powered software business idea generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
