'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ideaforge_max_generation_slots';
const DEFAULT_MAX_SLOTS = 3;
const MIN_SLOTS = 1;
const MAX_SLOTS = 10;

interface GenerationSettingsEditorProps {
  onSave?: () => void;
}

export default function GenerationSettingsEditor({ onSave }: GenerationSettingsEditorProps) {
  const [maxSlots, setMaxSlots] = useState(DEFAULT_MAX_SLOTS);
  const [savedMaxSlots, setSavedMaxSlots] = useState(DEFAULT_MAX_SLOTS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = parseInt(stored, 10);
      if (!isNaN(value) && value >= MIN_SLOTS && value <= MAX_SLOTS) {
        setMaxSlots(value);
        setSavedMaxSlots(value);
      }
    }
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(maxSlots !== savedMaxSlots);
    setSaveSuccess(false);
  }, [maxSlots, savedMaxSlots]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, maxSlots.toString());
    setSavedMaxSlots(maxSlots);
    setHasChanges(false);
    setSaveSuccess(true);
    onSave?.();

    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setMaxSlots(savedMaxSlots);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Generation Settings</h3>
        <p className="text-sm text-text-secondary">
          Configure how idea generation works on the dashboard.
        </p>
      </div>

      {/* Max Generation Slots */}
      <div className="bg-surface rounded-md border border-border-subtle p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Maximum Generation Slots
            </label>
            <p className="text-xs text-text-secondary mb-3">
              Control how many parallel generation slots are available on the dashboard. Each slot
              can run an independent generation with its own configuration profile.
            </p>

            <div className="flex items-center gap-4">
              {/* Slider */}
              <input
                type="range"
                min={MIN_SLOTS}
                max={MAX_SLOTS}
                value={maxSlots}
                onChange={(e) => setMaxSlots(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-elevated rounded-lg appearance-none cursor-pointer accent-mint"
              />

              {/* Number display */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMaxSlots((v) => Math.max(MIN_SLOTS, v - 1))}
                  className="p-1 rounded bg-elevated hover:bg-border-subtle text-text-secondary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 12H4"
                    />
                  </svg>
                </button>
                <span className="w-8 text-center text-lg font-bold text-mint">{maxSlots}</span>
                <button
                  onClick={() => setMaxSlots((v) => Math.min(MAX_SLOTS, v + 1))}
                  className="p-1 rounded bg-elevated hover:bg-border-subtle text-text-secondary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <p className="text-micro text-text-muted mt-2">
              Range: {MIN_SLOTS} - {MAX_SLOTS} slots
            </p>
          </div>

          {/* Info box */}
          <div className="bg-info/5 border border-info/20 rounded p-3">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-info flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-xs text-text-secondary">
                <p className="font-medium text-info mb-1">How it works:</p>
                <ul className="list-disc list-inside space-y-0.5 text-text-muted">
                  <li>Each slot runs independently with its own logs</li>
                  <li>Different slots can use different configuration profiles</li>
                  <li>Slots cannot be removed while a generation is running</li>
                  <li>API rate limits still apply across all slots</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save/Reset buttons */}
      <div className="flex items-center justify-between">
        <div>
          {saveSuccess && (
            <span className="text-sm text-success flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Settings saved successfully
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              hasChanges
                ? 'bg-elevated text-text-secondary hover:bg-border-subtle'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            }`}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              hasChanges
                ? 'bg-mint text-base hover:bg-mint-light'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
