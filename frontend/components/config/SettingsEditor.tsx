'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

export default function SettingsEditor() {
  const { showSuccess, showError } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedProfileId]);

  const loadData = async () => {
    if (!selectedProfileId) {
      return;
    }

    try {
      setLoading(true);
      const [settingsResult, keysResult] = await Promise.all([
        api.getSettings(selectedProfileId),
        api.getApiKeys()
      ]);
      setData(settingsResult);
      setApiKeys(keysResult);
    } catch (error: any) {
      showError(`Failed to load settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);
      await api.updateSettings(data, selectedProfileId || undefined);
      showSuccess('Settings saved successfully!');
      setHasChanges(false);
    } catch (error: any) {
      showError(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    const updated = { ...data };
    updated[key] = value;
    setData(updated);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading settings...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          System Settings
        </h2>
        <p className="text-xs text-text-secondary">
          Configure AI provider, API keys, and application preferences.
        </p>
      </div>

      {/* API Key Selection */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-text-primary">
              Active API Key
            </label>
            <Link
              href="/settings"
              className="text-micro text-mint hover:text-mint-light"
            >
              Manage API Keys →
            </Link>
          </div>
          <p className="text-micro text-text-muted mb-2">
            Select the API key to use for idea generation
          </p>

          {apiKeys.length === 0 ? (
            <div className="bg-error/10 border border-error/30 rounded p-3">
              <p className="text-xs text-error mb-0.5">
                No API keys configured
              </p>
              <p className="text-micro text-error/80">
                Go to Settings → API Keys to add an API key.
              </p>
            </div>
          ) : (
            <select
              value={apiKeys.find(k => k.is_active)?.id || ''}
              onChange={async (e) => {
                const keyId = parseInt(e.target.value);
                if (keyId) {
                  try {
                    await api.activateApiKey(keyId);
                    await loadData();
                    showSuccess('API key activated successfully!');
                  } catch (error: any) {
                    showError(`Failed to activate API key: ${error.message}`);
                  }
                }
              }}
              className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
            >
              <option value="">Select an API key...</option>
              {apiKeys.map((key) => (
                <option key={key.id} value={key.id}>
                  {key.name} ({key.provider}) {key.model ? `- ${key.model}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Temperature: {(data.temperature || 1.0).toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={data.temperature || 1.0}
            onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-elevated rounded appearance-none cursor-pointer accent-mint"
          />
          <div className="flex justify-between text-micro text-text-muted mt-1">
            <span>0.0 (Focused)</span>
            <span>1.0 (Balanced)</span>
            <span>2.0 (Creative)</span>
          </div>
          <p className="text-micro text-text-muted mt-2">
            Higher values make output more random, lower values more focused
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-primary mb-1">
            Max Tokens: {data.max_tokens || 4096}
          </label>
          <input
            type="range"
            min="1000"
            max="32000"
            step="1000"
            value={data.max_tokens || 4096}
            onChange={(e) => updateSetting('max_tokens', parseInt(e.target.value))}
            className="w-full h-1.5 bg-elevated rounded appearance-none cursor-pointer accent-mint"
          />
          <div className="flex justify-between text-micro text-text-muted mt-1">
            <span>1,000</span>
            <span>16,000</span>
            <span>32,000</span>
          </div>
          <p className="text-micro text-text-muted mt-2">
            Maximum length of AI responses. Higher values cost more.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
        {hasChanges && (
          <span className="text-xs text-warning">
            Unsaved changes
          </span>
        )}
        <button
          onClick={saveData}
          disabled={saving || !hasChanges}
          className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
            hasChanges && !saving
              ? 'bg-mint hover:bg-mint-dark text-base'
              : 'bg-elevated text-text-muted cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
