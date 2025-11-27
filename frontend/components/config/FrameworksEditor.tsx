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
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading frameworks...</p>
      </div>
    );
  }

  if (!data || !data.generation_templates) {
    return null;
  }

  const templates = data.generation_templates;

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <h2 className="text-sm font-semibold text-text-primary mb-1">
          Generation Frameworks
        </h2>
        <p className="text-xs text-text-secondary">
          Enable or disable idea generation frameworks. Enabled frameworks will be randomly selected during generation.
        </p>
      </div>

      <div className="space-y-2">
        {templates.map((template: any, idx: number) => (
          <div
            key={idx}
            className={`border rounded p-3 transition-all ${
              editingIndex === idx
                ? 'border-mint bg-mint/5'
                : template.enabled
                ? 'border-success/30 bg-success/5 hover:border-success/50'
                : 'border-border-subtle bg-elevated/50 hover:border-border-default'
            }`}
          >
            {editingIndex === idx ? (
              // Edit Mode
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Example
                  </label>
                  <textarea
                    value={editForm.example}
                    onChange={(e) => setEditForm({ ...editForm, example: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 text-xs font-medium text-text-secondary bg-elevated border border-border-default rounded hover:bg-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveEdit(idx)}
                    disabled={saving}
                    className="px-3 py-1 text-xs font-medium text-base bg-mint rounded hover:bg-mint-dark transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-text-primary text-sm">{template.name}</h3>
                    <span className={`text-micro px-1.5 py-0.5 rounded font-medium ${
                      template.enabled
                        ? 'bg-success/10 text-success'
                        : 'bg-elevated text-text-muted'
                    }`}>
                      {template.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mb-2 line-clamp-2">{template.description}</p>
                  {template.example && (
                    <div className="bg-base border border-border-subtle rounded p-2">
                      <p className="text-micro text-text-muted mb-0.5">Example:</p>
                      <p className="text-xs text-text-secondary italic line-clamp-2">{template.example}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTemplate(idx);
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      template.enabled ? 'bg-mint' : 'bg-elevated'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        template.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => startEdit(idx, e)}
                    className="px-2 py-0.5 text-micro font-medium text-mint bg-mint/10 rounded hover:bg-mint/20 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-info/5 border border-info/20 rounded p-3">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-info flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs font-medium text-info">Framework Selection</p>
            <p className="text-xs text-info/70 mt-0.5">
              {templates.filter((t: any) => t.enabled).length} of {templates.length} frameworks enabled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
