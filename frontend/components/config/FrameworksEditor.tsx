'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

export default function FrameworksEditor() {
  const { showSuccess, showError } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', example: '', prompt: '' });
  const [saving, setSaving] = useState(false);

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
      const result = await api.getFrameworks(selectedProfileId);
      setData(result);
    } catch (error: any) {
      // Only show error if it's not a network error (backend not running)
      if (error.message !== 'Failed to fetch') {
        showError(`Failed to load frameworks: ${error.message}`);
      }
      console.log('Backend not available:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);
      await api.updateFrameworks(data, selectedProfileId || undefined);
      showSuccess('Frameworks saved successfully!');
    } catch (error: any) {
      showError(`Failed to save frameworks: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = async (index: number) => {
    const updated = { ...data };
    updated.generation_templates[index].enabled = !updated.generation_templates[index].enabled;
    setData(updated);
    await saveData();
  };

  const startEdit = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const template = data.generation_templates[index];
    setEditingIndex(index);
    setEditForm({
      name: template.name,
      description: template.description,
      example: template.example || '',
      prompt: template.prompt || '',
    });
  };

  const saveEdit = async (index: number) => {
    const updated = { ...data };
    updated.generation_templates[index] = {
      ...updated.generation_templates[index],
      name: editForm.name,
      description: editForm.description,
      example: editForm.example,
      prompt: editForm.prompt,
    };
    setData(updated);
    setEditingIndex(null);
    await saveData();
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ name: '', description: '', example: '', prompt: '' });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading frameworks...</p>
      </div>
    );
  }

  if (!data || !data.generation_templates) {
    return null;
  }

  const templates = data.generation_templates;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Generation Frameworks
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enable or disable idea generation frameworks. Enabled frameworks will be randomly selected during generation.
        </p>
      </div>

      <div className="space-y-3">
        {templates.map((template: any, idx: number) => (
          <div
            key={idx}
            className={`border-2 rounded-lg p-5 transition-all ${
              editingIndex === idx
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-gray-700'
                : template.enabled
                ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {editingIndex === idx ? (
              // Edit Mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Example
                  </label>
                  <textarea
                    value={editForm.example}
                    onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(idx)}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{template.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      template.enabled
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {template.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{template.description}</p>
                  {template.example && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1">Example:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">{template.example}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTemplate(idx);
                    }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      template.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        template.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => startEdit(idx, e)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">Framework Selection</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {templates.filter((t: any) => t.enabled).length} of {templates.length} frameworks enabled.
              The system will randomly select from enabled frameworks when generating ideas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
