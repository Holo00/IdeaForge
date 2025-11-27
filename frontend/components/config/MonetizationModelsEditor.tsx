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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading monetization models...</p>
      </div>
    );
  }

  if (!data || !data.monetization_models) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Failed to load monetization models</p>
      </div>
    );
  }

  const models: MonetizationModel[] = data.monetization_models;

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Monetization Models
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Configure the monetization models available for idea generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => switchMode('visual')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  editMode === 'visual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                View
              </button>
              <button
                onClick={() => switchMode('text')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  editMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Edit
              </button>
            </div>
            <button
              onClick={saveData}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {editMode === 'visual' ? (
        <>
          <div className="relative">
            <input
              type="text"
              placeholder="Search monetization models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-11 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-3.5"
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

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {filteredModels.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">No monetization models found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredModels.map((model, idx) => (
                  <div
                    key={idx}
                    className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {model.name}
                        </h3>
                        {model.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {model.description}
                          </p>
                        )}
                      </div>
                      {model.typical_pricing && (
                        <span className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full ml-3 whitespace-nowrap">
                          {model.typical_pricing}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{models.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Monetization Models</p>
            </div>
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Edit JSON configuration..."
            spellCheck={false}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tip: Edit the JSON directly. Click "Save" when done.
          </p>
        </div>
      )}
    </div>
  );
}