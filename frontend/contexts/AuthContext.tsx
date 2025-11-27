'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  username: string;
  role: 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/config', '/ideas'];

// Routes that should redirect to dashboard if authenticated (admin)
const REDIRECT_IF_AUTHENTICATED = ['/admin/login', '/'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify token with backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/auth/check`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        const result = await response.json();

        if (result.success && result.data.authenticated) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        } else {
          // Token invalid, clear storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, keep stored credentials (offline support)
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    const shouldRedirectToDashboard = REDIRECT_IF_AUTHENTICATED.includes(pathname);

    if (isProtectedRoute && !user) {
      // Redirect to login if trying to access protected route without auth
      router.push('/admin/login');
    } else if (shouldRedirectToDashboard && user) {
      // Redirect to dashboard if already authenticated
      router.push('/dashboard');
    }
  }, [isLoading, user, pathname, router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore logout API errors
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook for getting the auth token (for API calls)
 */
export function useAuthToken(): string | null {
  const { token } = useAuth();
  return token;
}