'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Login failed');
        return;
      }

      // Update auth context (this also stores to localStorage)
      login(result.data.token, result.data.user);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="bg-surface rounded-md border border-border-subtle p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-text-primary">
              <span className="text-mint">Idea</span>Forge
            </h1>
            <p className="text-xs text-text-secondary mt-1">
              Sign in to access the dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded text-xs text-error">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:border-mint focus:ring-1 focus:ring-mint focus:outline-none"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:border-mint focus:ring-1 focus:ring-mint focus:outline-none"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-gradient-to-r from-mint to-mint-dark text-base font-medium text-sm rounded transition-all hover:from-mint-light hover:to-mint disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Back Link */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs text-text-muted hover:text-mint transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}