import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import AppShell from '@/components/layout/AppShell';

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
    <html lang="en">
      <body className="min-h-screen bg-base text-text-primary">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
