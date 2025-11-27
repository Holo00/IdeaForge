'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load sidebar state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  const handleToggleCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // For unauthenticated users, render without sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-base">
        <TopBar sidebarCollapsed={false} />
        <main className="pt-12">{children}</main>
      </div>
    );
  }

  // For authenticated users, render with sidebar
  return (
    <div className="min-h-screen bg-base">
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapse={handleToggleCollapse} />
      <TopBar sidebarCollapsed={sidebarCollapsed} />
      <main
        className={`pt-12 min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? 'pl-14' : 'pl-60'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
