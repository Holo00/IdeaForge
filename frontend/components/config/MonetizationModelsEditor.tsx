'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

interface MonetizationModel {
  name: string;
  description?: string;
  typical_pricing?: string;
}

export default function MonetizationModelsEditor() {
  const { showSuccess, showError, showWarning } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState<'visual' | 'text'>('visual');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedProfileId]);

  const loadData = async () => {
    if (!selectedProfileId) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.getMonetizationModels(selectedProfileId);
      setData(result);
      setTextContent(JSON.stringify(result, null, 2));
    } catch (error: any) {
      showError(`Failed to load monetization models: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);
      let dataToSave = data;

      if (editMode === 'text') {
        try {
          dataToSave = JSON.parse(textContent);
          setData(dataToSave);
        } catch (e) {
          showError('Invalid JSON format. Please check your syntax.');
          setSaving(false);
          return;
        }
      }

      await api.updateMonetizationModels(dataToSave, selectedProfileId || undefined);
      showSuccess('Monetization models saved successfully!');
    } catch (error: any) {
      showError(`Failed to save monetization models: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const switchMode = (newMode: 'visual' | 'text') => {
    if (newMode === 'text' && editMode === 'visual') {
      setTextContent(JSON.stringify(data, null, 2));
    } else if (newMode === 'visual' && editMode === 'text') {
      try {
        const parsed = JSON.parse(textContent);
        setData(parsed);
      } catch (e) {
        showWarning('Invalid JSON format. Cannot switch to visual mode. Please fix the JSON first.');
        return;
      }
    }
    setEditMode(newMode);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading monetization models...</p>
      </div>
    );
  }

  if (!data || !data.monetization_models) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Failed to load monetization models</p>
      </div>
    );
  }

  const models: MonetizationModel[] = data.monetization_models;

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Monetization Models
            </h2>
            <p className="text-xs text-text-secondary">
              Configure the monetization models available for idea generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded border border-border-default overflow-hidden">
              <button
                onClick={() => switchMode('visual')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  editMode === 'visual'
                    ? 'bg-mint text-base'
                    : 'bg-elevated text-text-secondary hover:bg-hover'
                }`}
              >
                View
              </button>
              <button
                onClick={() => switchMode('text')}
                className={`px-2 py-1 text-xs font-medium transition-colors border-l border-border-default ${
                  editMode === 'text'
                    ? 'bg-mint text-base'
                    : 'bg-elevated text-text-secondary hover:bg-hover'
                }`}
              >
                Edit
              </button>
            </div>
            <button
              onClick={saveData}
              disabled={saving}
              className="px-3 py-1 bg-mint text-base rounded hover:bg-mint-dark transition-colors disabled:opacity-50 text-xs font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {editMode === 'visual' ? (
        <>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search monetization models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 border border-border-default bg-base text-text-primary text-sm rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint placeholder-text-muted"
            />
            <svg
              className="w-4 h-4 text-text-muted absolute left-2.5 top-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Models List */}
          <div className="border border-border-subtle rounded overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {filteredModels.length === 0 ? (
                <div className="p-6 text-center text-text-muted">
                  <svg className="w-8 h-8 mx-auto mb-2 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">No monetization models found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredModels.map((model, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 hover:bg-hover border-b border-border-subtle transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary text-sm">
                          {model.name}
                        </h3>
                        {model.description && (
                          <p className="text-xs text-text-muted mt-0.5 truncate">
                            {model.description}
                          </p>
                        )}
                      </div>
                      {model.typical_pricing && (
                        <span className="text-micro text-success bg-success/10 px-2 py-0.5 rounded ml-2 whitespace-nowrap">
                          {model.typical_pricing}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="text-center p-3 bg-success/10 border border-success/20 rounded">
            <p className="text-lg font-bold text-success">{models.length}</p>
            <p className="text-xs text-text-secondary">Monetization Models</p>
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-96 px-3 py-2 border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint font-mono text-xs"
            placeholder="Edit JSON configuration..."
            spellCheck={false}
          />
          <p className="text-micro text-text-muted mt-1">
            Edit the JSON directly. Click "Save" when done.
          </p>
        </div>
      )}
    </div>
  );
}
