'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ConfigProfile {
  id: string;
  name: string;
  folder_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ConfigProfileContextType {
  selectedProfile: ConfigProfile | null;
  setSelectedProfile: (profile: ConfigProfile | null) => void;
  selectedProfileId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const ConfigProfileContext = createContext<ConfigProfileContextType | undefined>(undefined);

export function ConfigProfileProvider({ children }: { children: ReactNode }) {
  const [selectedProfile, setSelectedProfile] = useState<ConfigProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const loadActiveProfile = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const activeProfile = await api.getActiveConfigProfile();
      setSelectedProfile(activeProfile);
    } catch (error) {
      console.error('Failed to load active profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load profile when auth is ready and user is authenticated
    if (!authLoading) {
      if (isAuthenticated) {
        loadActiveProfile();
      } else {
        // Not authenticated, clear profile and stop loading
        setSelectedProfile(null);
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, authLoading]);

  return (
    <ConfigProfileContext.Provider
      value={{
        selectedProfile,
        setSelectedProfile,
        selectedProfileId: selectedProfile?.id || null,
        isLoading,
        refreshProfile: loadActiveProfile,
      }}
    >
      {children}
    </ConfigProfileContext.Provider>
  );
}

export function useConfigProfile() {
  const context = useContext(ConfigProfileContext);
  if (context === undefined) {
    throw new Error('useConfigProfile must be used within a ConfigProfileProvider');
  }
  return context;
}
