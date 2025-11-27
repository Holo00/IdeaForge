'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProfileProvider } from '@/contexts/ConfigProfileContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConfigProfileProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ConfigProfileProvider>
    </AuthProvider>
  );
}
