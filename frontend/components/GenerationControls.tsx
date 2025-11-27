'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface GenerationControlsProps {
  onGenerationStart?: (sessionId?: string) => string;
  onGenerationComplete?: (idea: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function GenerationControls({
  onGenerationStart,
  onGenerationComplete,
  onError,
  disabled = false,
}: GenerationControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
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
    setIsGenerating(true);

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
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 border-2 border-gray-100 dark:border-gray-700">
      {/* Header with Status Indicator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Generation Control</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  isGenerating
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {isGenerating ? 'GENERATING' : 'IDLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Profile Selector */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <label className="block text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Active Configuration Profile
          </label>
          <select
            value={activeProfile?.id || ''}
            onChange={(e) => handleProfileChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
            This config will be used for all idea generation
          </p>
        </div>
      </div>

      {/* Manual Generation Section */}
      <div className="space-y-4 border dark:border-gray-700 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Manual Generation</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">Generate one idea on demand</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleManualGenerate}
            disabled={isGenerating || disabled}
            className={`w-full font-bold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg ${
              isGenerating || disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-500/50 hover:shadow-xl'
            }`}
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                <span>GENERATING IDEA...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>GENERATE IDEA NOW</span>
              </>
            )}
          </button>

          {lastGeneration && (
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last manual generation: <span className="font-semibold text-gray-700 dark:text-gray-300">{lastGeneration}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
