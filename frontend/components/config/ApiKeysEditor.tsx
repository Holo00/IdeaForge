'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';
import ConfirmDialog from '@/components/ConfirmDialog';

interface AIModel {
  id: number;
  provider: string;
  model_id: string;
  display_name: string;
  is_default: boolean;
  description?: string;
}

export default function ApiKeysEditor() {
  const { showSuccess, showError } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'gemini',
    api_key: '',
    model: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);

  // Fetch available models from backend
  useEffect(() => {
    loadAvailableModels();
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [selectedProfileId]); // Reload when profile changes (for consistency)

  const loadAvailableModels = async () => {
    try {
      const models = await api.getAIModels();

      // Ensure models is an array before using it
      if (!Array.isArray(models)) {
        console.error('AI models response is not an array:', models);
        setAvailableModels([]);
        return;
      }

      setAvailableModels(models);

      // Set default model for initial provider (gemini)
      const defaultGeminiModel = models.find((m: AIModel) => m.provider === 'gemini' && m.is_default);
      if (defaultGeminiModel) {
        setFormData(prev => ({ ...prev, model: defaultGeminiModel.model_id }));
      }
    } catch (error: any) {
      console.error('Failed to load AI models:', error);
      setAvailableModels([]);
      // Don't show error toast here - the models list will just be empty
      // This prevents showing errors during initial auth loading
    }
  };

  // Get model options based on provider from the database
  const getModelOptions = (provider: string) => {
    return availableModels
      .filter(model => model.provider === provider)
      .map(model => ({
        value: model.model_id,
        label: model.display_name,
        description: model.description
      }));
  };

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const keys = await api.getApiKeys();
      setApiKeys(keys);
    } catch (error: any) {
      showError(`Failed to load API keys: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKey) {
        await api.updateApiKey(editingKey.id, formData);
        showSuccess('API key updated successfully!');
      } else {
        await api.createApiKey(formData);
        showSuccess('API key created successfully!');
      }
      setShowAddForm(false);
      setEditingKey(null);

      // Reset form with default model for gemini
      const defaultGeminiModel = availableModels.find(m => m.provider === 'gemini' && m.is_default);
      setFormData({
        name: '',
        provider: 'gemini',
        api_key: '',
        model: defaultGeminiModel?.model_id || ''
      });

      loadApiKeys();
    } catch (error: any) {
      showError(`Failed to save API key: ${error.message}`);
    }
  };

  // Handle provider change - automatically set default model for that provider
  const handleProviderChange = (newProvider: string) => {
    const defaultModel = availableModels.find(m => m.provider === newProvider && m.is_default);
    setFormData(prev => ({
      ...prev,
      provider: newProvider,
      model: defaultModel?.model_id || ''
    }));
  };

  const handleEdit = (key: any) => {
    setEditingKey(key);
    setFormData({
      name: key.name,
      provider: key.provider,
      api_key: '', // Don't populate the actual key for security
      model: key.model || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (!keyToDelete) return;

    try {
      await api.deleteApiKey(Number(keyToDelete.id));
      showSuccess('API key deleted successfully!');
      loadApiKeys();
    } catch (error: any) {
      showError(`Failed to delete API key: ${error.message}`);
    } finally {
      setKeyToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-gray-600 dark:text-gray-300">Loading API keys...</div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setKeyToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete API Key"
        message={`Are you sure you want to delete the API key "${keyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">API Keys Management</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingKey(null);
            const defaultGeminiModel = availableModels.find(m => m.provider === 'gemini' && m.is_default);
            setFormData({
              name: '',
              provider: 'gemini',
              api_key: '',
              model: defaultGeminiModel?.model_id || ''
            });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add API Key'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {editingKey ? 'Edit API Key' : 'Add New API Key'}
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My API Key"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="gemini">Gemini (Google)</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key {editingKey && <span className="text-xs text-gray-500 dark:text-gray-400">(leave empty to keep current)</span>}
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
                required={!editingKey}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {getModelOptions(formData.provider).map((option) => (
                  <option key={option.value} value={option.value} title={option.description}>
                    {option.label}
                  </option>
                ))}
              </select>
              {formData.model && availableModels.find(m => m.model_id === formData.model)?.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {availableModels.find(m => m.model_id === formData.model)?.description}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingKey ? 'Update' : 'Add'} API Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingKey(null);
                  setFormData({ name: '', provider: 'gemini', api_key: '', model: 'gemini-1.5-flash' });
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {apiKeys.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No API keys configured yet.</p>
            <p className="text-sm mt-2">Click "Add API Key" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{key.name}</h3>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <p>
                        <span className="font-medium">Provider:</span> {key.provider}
                      </p>
                      {key.model && (
                        <p>
                          <span className="font-medium">Model:</span> {key.model}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(key.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(key)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setKeyToDelete({ id: key.id.toString(), name: key.name });
                        setShowDeleteConfirm(true);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
