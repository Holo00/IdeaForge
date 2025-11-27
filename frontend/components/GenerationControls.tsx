'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface GenerationControlsProps {
  onGenerationStart?: (sessionId?: string) => string;
  onGenerationComplete?: (idea: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export default function GenerationControls({
  onGenerationStart,
  onGenerationComplete,
  onError,
  disabled = false,
  isGenerating: externalIsGenerating,
}: GenerationControlsProps) {
  const [localIsGenerating, setLocalIsGenerating] = useState(false);

  // Use external state if provided, otherwise fall back to local state
  const isGenerating = externalIsGenerating ?? localIsGenerating;
  const [lastGeneration, setLastGeneration] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<any>(null);

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const allProfiles = await api.getConfigProfiles();
      setProfiles(allProfiles);
      const active = allProfiles.find((p: any) => p.is_active);
      setActiveProfile(active);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleProfileChange = async (profileId: string) => {
    try {
      await api.activateConfigProfile(profileId);
      await fetchProfiles();
      // Success notification handled by ProfileSelector component
    } catch (error: any) {
      onError?.(error.message || 'Failed to switch profile');
    }
  };

  const handleManualGenerate = async () => {
    setLocalIsGenerating(true);

    // Generate session ID and notify parent to connect to SSE
    const sessionId = `manual-${Date.now()}`;
    onGenerationStart?.(sessionId);

    try {
      // Pass sessionId to API so backend uses the same one
      const result = await api.generateIdea({ sessionId });
      setLastGeneration(new Date().toLocaleString());
      onGenerationComplete?.(result.idea);
    } catch (error: any) {
      onError?.(error.message || 'Generation failed');
    } finally {
      setLocalIsGenerating(false);
    }
  };

  return (
    <div className="bg-surface rounded-md border border-border-subtle p-4 space-y-4">
      {/* Header with Status Indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <h2 className="text-sm font-semibold text-text-primary">Generation Control</h2>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-elevated">
            <div
              className={`h-2 w-2 rounded-full ${
                isGenerating
                  ? 'bg-warning animate-pulse'
                  : 'bg-text-muted'
              }`}
            />
            <span className="text-micro font-medium text-text-secondary">
              {isGenerating ? 'GENERATING' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Configuration Profile Selector */}
        <div className="bg-info/5 border border-info/20 rounded p-3">
          <label className="block text-xs font-medium text-info mb-1.5">
            Active Configuration Profile
          </label>
          <select
            value={activeProfile?.id || ''}
            onChange={(e) => handleProfileChange(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-info/30 bg-base text-text-primary rounded focus:outline-none focus:border-info focus:ring-1 focus:ring-info"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <p className="text-micro text-info/70 mt-1.5">
            This config will be used for all idea generation
          </p>
        </div>
      </div>

      {/* Manual Generation Section */}
      <div className="space-y-3 border border-border-subtle rounded p-3 bg-elevated/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-mint/10">
            <svg
              className="w-4 h-4 text-mint"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">Manual Generation</h3>
            <p className="text-micro text-text-muted">Generate one idea on demand</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleManualGenerate}
            disabled={isGenerating || disabled}
            className={`w-full font-medium py-2.5 px-4 rounded transition-all flex items-center justify-center gap-2 text-sm ${
              isGenerating || disabled
                ? 'bg-elevated text-text-muted cursor-not-allowed'
                : 'bg-gradient-to-r from-mint to-mint-dark text-base hover:from-mint-light hover:to-mint'
            }`}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Generate Idea</span>
              </>
            )}
          </button>

          {lastGeneration && (
            <p className="text-center text-micro text-text-muted">
              Last: <span className="text-text-secondary">{lastGeneration}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
