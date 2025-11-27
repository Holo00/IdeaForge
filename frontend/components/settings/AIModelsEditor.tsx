'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

interface AIModel {
  id: number;
  provider: string;
  model_id: string;
  display_name: string;
  is_default: boolean;
  is_available: boolean;
  description?: string;
  created_at: string;
}

export default function AIModelsEditor() {
  const { showSuccess, showError } = useToast();
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({
    provider: 'gemini',
    model_id: '',
    display_name: '',
    description: '',
    is_default: false,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<AIModel | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await api.getAllAIModels();
      if (!Array.isArray(data)) {
        console.error('AI models response is not an array:', data);
        setModels([]);
        return;
      }
      setModels(data);
    } catch (error: any) {
      showError(`Failed to load AI models: ${error.message}`);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await api.updateAIModel(editingModel.id, formData);
        showSuccess('AI model updated successfully!');
      } else {
        await api.createAIModel(formData);
        showSuccess('AI model created successfully!');
      }
      setShowAddForm(false);
      setEditingModel(null);
      setFormData({
        provider: 'gemini',
        model_id: '',
        display_name: '',
        description: '',
        is_default: false,
      });
      loadModels();
    } catch (error: any) {
      showError(`Failed to save AI model: ${error.message}`);
    }
  };

  const handleEdit = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      provider: model.provider,
      model_id: model.model_id,
      display_name: model.display_name,
      description: model.description || '',
      is_default: model.is_default,
    });
    setShowAddForm(true);
  };

  const handleDelete = async () => {
    if (!modelToDelete) return;
    try {
      await api.deleteAIModel(modelToDelete.id);
      showSuccess('AI model deleted successfully!');
      loadModels();
    } catch (error: any) {
      showError(`Failed to delete AI model: ${error.message}`);
    } finally {
      setModelToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const toggleAvailability = async (model: AIModel) => {
    try {
      await api.updateAIModel(model.id, { is_available: !model.is_available });
      showSuccess(`Model ${model.is_available ? 'disabled' : 'enabled'} successfully!`);
      loadModels();
    } catch (error: any) {
      showError(`Failed to update model: ${error.message}`);
    }
  };

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  const providerNames: Record<string, string> = {
    gemini: 'Google Gemini',
    claude: 'Anthropic Claude',
    openai: 'OpenAI',
  };

  const providerColors: Record<string, { bg: string; text: string; border: string }> = {
    gemini: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30' },
    claude: { bg: 'bg-coral/10', text: 'text-coral', border: 'border-coral/30' },
    openai: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/30' },
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading AI models...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setModelToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete AI Model"
        message={`Are you sure you want to delete "${modelToDelete?.display_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <div className="p-4 space-y-4">
        <div className="border-b border-border-subtle pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              AI Models Management
            </h2>
            <p className="text-xs text-text-secondary">
              Configure available AI models for idea generation
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingModel(null);
              setFormData({
                provider: 'gemini',
                model_id: '',
                display_name: '',
                description: '',
                is_default: false,
              });
            }}
            className="px-3 py-1 bg-mint text-base rounded hover:bg-mint-dark transition-colors text-xs font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add Model'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-elevated/50 rounded p-4 space-y-3 border border-border-subtle">
            <h3 className="text-xs font-semibold text-text-primary mb-2">
              {editingModel ? 'Edit AI Model' : 'Add New AI Model'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  required
                  disabled={!!editingModel}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Model ID</label>
                <input
                  type="text"
                  value={formData.model_id}
                  onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  placeholder="e.g., gemini-1.5-flash"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Display Name</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  placeholder="e.g., Gemini 1.5 Flash"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-3.5 h-3.5 text-mint border-border-default rounded focus:ring-mint accent-mint"
              />
              <label htmlFor="is_default" className="text-xs text-text-secondary">
                Set as default model for this provider
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-1.5 bg-mint text-base rounded hover:bg-mint-dark transition-colors text-xs font-medium"
              >
                {editingModel ? 'Update' : 'Add'} Model
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingModel(null);
                }}
                className="px-4 py-1.5 bg-elevated text-text-secondary rounded hover:bg-hover transition-colors text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {Object.keys(groupedModels).length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <svg className="w-8 h-8 mx-auto mb-2 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No AI models configured yet.</p>
            <p className="text-xs mt-1">Click "+ Add Model" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedModels).map(([provider, providerModels]) => {
              const colors = providerColors[provider] || providerColors.gemini;
              return (
                <div key={provider} className={`rounded border ${colors.border} overflow-hidden`}>
                  <div className={`px-3 py-2 ${colors.bg} border-b ${colors.border}`}>
                    <h3 className={`text-xs font-semibold ${colors.text}`}>
                      {providerNames[provider] || provider}
                    </h3>
                  </div>
                  <div className="divide-y divide-border-subtle">
                    {providerModels.map((model) => (
                      <div
                        key={model.id}
                        className={`px-3 py-2 flex items-center justify-between ${
                          !model.is_available ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-text-primary text-sm">
                              {model.display_name}
                            </span>
                            {model.is_default && (
                              <span className="px-1.5 py-0.5 text-micro bg-success/10 text-success rounded">
                                Default
                              </span>
                            )}
                            {!model.is_available && (
                              <span className="px-1.5 py-0.5 text-micro bg-elevated text-text-muted rounded">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                            <code className="bg-elevated px-1 py-0.5 rounded text-micro">
                              {model.model_id}
                            </code>
                            {model.description && (
                              <span className="truncate">{model.description}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => toggleAvailability(model)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              model.is_available
                                ? 'bg-elevated text-text-secondary hover:bg-hover'
                                : 'bg-success/10 text-success hover:bg-success/20'
                            }`}
                          >
                            {model.is_available ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleEdit(model)}
                            className="px-2 py-1 bg-info/10 text-info rounded hover:bg-info/20 transition-colors text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setModelToDelete(model);
                              setShowDeleteConfirm(true);
                            }}
                            className="px-2 py-1 bg-error/10 text-error rounded hover:bg-error/20 transition-colors text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
