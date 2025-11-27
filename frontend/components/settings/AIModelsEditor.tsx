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

      // Ensure data is an array before using it
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
    gemini: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
    claude: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
    openai: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="text-gray-600 dark:text-gray-300">Loading AI models...</div>
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">AI Models Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showAddForm ? 'Cancel' : '+ Add Model'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingModel ? 'Edit AI Model' : 'Add New AI Model'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingModel}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model ID</label>
                  <input
                    type="text"
                    value={formData.model_id}
                    onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., gemini-1.5-flash"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Gemini 1.5 Flash"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">
                  Set as default model for this provider
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingModel ? 'Update' : 'Add'} Model
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingModel(null);
                  }}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {Object.keys(groupedModels).length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>No AI models configured yet.</p>
              <p className="text-sm mt-2">Click "Add Model" to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedModels).map(([provider, providerModels]) => {
                const colors = providerColors[provider] || providerColors.gemini;
                return (
                  <div key={provider} className={`rounded-lg border ${colors.border} overflow-hidden`}>
                    <div className={`px-4 py-3 ${colors.bg} border-b ${colors.border}`}>
                      <h3 className={`font-semibold ${colors.text}`}>
                        {providerNames[provider] || provider}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {providerModels.map((model) => (
                        <div
                          key={model.id}
                          className={`px-4 py-4 flex items-center justify-between ${
                            !model.is_available ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {model.display_name}
                              </span>
                              {model.is_default && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                  Default
                                </span>
                              )}
                              {!model.is_available && (
                                <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                  Disabled
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                                {model.model_id}
                              </code>
                              {model.description && (
                                <span className="ml-2">{model.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleAvailability(model)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                model.is_available
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {model.is_available ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleEdit(model)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setModelToDelete(model);
                                setShowDeleteConfirm(true);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
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
      </div>
    </>
  );
}