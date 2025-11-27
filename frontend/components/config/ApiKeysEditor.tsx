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

  useEffect(() => {
    loadAvailableModels();
  }, []);

  useEffect(() => {
    loadApiKeys();
  }, [selectedProfileId]);

  const loadAvailableModels = async () => {
    try {
      const models = await api.getAIModels();
      if (!Array.isArray(models)) {
        console.error('AI models response is not an array:', models);
        setAvailableModels([]);
        return;
      }
      setAvailableModels(models);
      const defaultGeminiModel = models.find((m: AIModel) => m.provider === 'gemini' && m.is_default);
      if (defaultGeminiModel) {
        setFormData(prev => ({ ...prev, model: defaultGeminiModel.model_id }));
      }
    } catch (error: any) {
      console.error('Failed to load AI models:', error);
      setAvailableModels([]);
    }
  };

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
      api_key: '',
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
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading API keys...</p>
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

      <div className="p-4 space-y-4">
        <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              API Keys Management
            </h2>
            <p className="text-xs text-text-secondary">
              Manage your AI provider API keys
            </p>
          </div>
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
            className="px-3 py-1 bg-mint text-base rounded hover:bg-mint-dark transition-colors text-xs font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add Key'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-elevated/50 rounded p-4 space-y-3 border border-border-subtle">
            <h3 className="text-xs font-semibold text-text-primary mb-2">
              {editingKey ? 'Edit API Key' : 'Add New API Key'}
            </h3>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                placeholder="My API Key"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  required
                >
                  <option value="gemini">Gemini (Google)</option>
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Model</label>
                <select
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  required
                >
                  {getModelOptions(formData.provider).map((option) => (
                    <option key={option.value} value={option.value} title={option.description}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                API Key {editingKey && <span className="text-text-muted">(leave empty to keep current)</span>}
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                placeholder="sk-..."
                required={!editingKey}
              />
            </div>

            {formData.model && availableModels.find(m => m.model_id === formData.model)?.description && (
              <p className="text-micro text-text-muted">
                {availableModels.find(m => m.model_id === formData.model)?.description}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-mint text-base rounded hover:bg-mint-dark transition-colors text-xs font-medium"
              >
                {editingKey ? 'Update' : 'Add'} Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingKey(null);
                }}
                className="px-4 py-1.5 bg-elevated text-text-secondary rounded hover:bg-hover transition-colors text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <svg className="w-8 h-8 mx-auto mb-2 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p className="text-sm">No API keys configured yet.</p>
            <p className="text-xs mt-1">Click "+ Add Key" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="border border-border-subtle rounded p-3 hover:border-border-default transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary text-sm">{key.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span className="capitalize">{key.provider}</span>
                      {key.model && (
                        <>
                          <span className="text-border-default">•</span>
                          <span>{key.model}</span>
                        </>
                      )}
                    </div>
                    <p className="text-micro text-text-muted mt-1">
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleEdit(key)}
                      className="px-2 py-1 bg-info/10 text-info rounded hover:bg-info/20 transition-colors text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setKeyToDelete({ id: key.id.toString(), name: key.name });
                        setShowDeleteConfirm(true);
                      }}
                      className="px-2 py-1 bg-error/10 text-error rounded hover:bg-error/20 transition-colors text-xs"
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
    </>
  );
}
