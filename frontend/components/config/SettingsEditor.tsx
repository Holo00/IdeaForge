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
  }, [selectedProfileId]); // Reload when profile changes

  const loadData = async () => {
    if (!selectedProfileId) {
      // Wait for profile to be loaded
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading settings...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          System Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure AI provider, API keys, and application preferences.
        </p>
      </div>

      {/* API Key Selection */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
              Active API Key
            </label>
            <Link
              href="/config"
              onClick={() => {
                const event = new CustomEvent('switchToApiKeys');
                window.dispatchEvent(event);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
            >
              Manage API Keys →
            </Link>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
            Select the API key to use for idea generation
          </p>

          {apiKeys.length === 0 ? (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 mb-1">
                No API keys configured
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                Click "Manage API Keys" above to add an API key.
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
                    await loadData(); // Reload to get updated active status
                    showSuccess('API key activated successfully!');
                  } catch (error: any) {
                    showError(`Failed to activate API key: ${error.message}`);
                  }
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Temperature: {(data.temperature || 1.0).toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={data.temperature || 1.0}
            onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0.0 (Focused)</span>
            <span>1.0 (Balanced)</span>
            <span>2.0 (Creative)</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Higher values make output more random, lower values more focused and deterministic
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Max Tokens: {data.max_tokens || 4096}
          </label>
          <input
            type="range"
            min="1000"
            max="32000"
            step="1000"
            value={data.max_tokens || 4096}
            onChange={(e) => updateSetting('max_tokens', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1,000</span>
            <span>16,000</span>
            <span>32,000</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Controls the maximum length of AI responses. Higher values allow more detailed responses but cost more.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-gray-700">
        {hasChanges && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </span>
        )}
        <button
          onClick={saveData}
          disabled={saving || !hasChanges}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            hasChanges && !saving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
