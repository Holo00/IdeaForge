'use client';

import { useAuth } from '@/contexts/AuthContext';

interface TopBarProps {
  sidebarCollapsed: boolean;
}

export default function TopBar({ sidebarCollapsed }: TopBarProps) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header
      className={`fixed top-0 right-0 h-12 bg-surface border-b border-border-subtle flex items-center justify-between px-4 z-30 transition-all duration-200 ${
        isAuthenticated ? (sidebarCollapsed ? 'left-14' : 'left-60') : 'left-0'
      }`}
    >
      {/* Left side - can add breadcrumbs here later */}
      <div className="flex items-center gap-2">
        {!isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-mint to-mint-dark rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-base" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-semibold text-text-primary text-sm">IdeaForge</span>
          </div>
        )}
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-3">
        {isAuthenticated && user && (
          <>
            <span className="text-sm text-text-secondary">{user.username}</span>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
