'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

interface FilterOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  value?: number | string;
  type: 'toggle' | 'number' | 'select';
  options?: string[];
  promptText: string;
}

const defaultFilters: FilterOption[] = [
  {
    id: 'maxTeamSize',
    label: 'Maximum Team Size',
    description: 'Limit the number of people needed to build the business',
    enabled: false,
    value: 1,
    type: 'number',
    promptText: 'The idea must be buildable by a team of {value} person(s) or less.',
  },
  {
    id: 'lowInitialCapital',
    label: 'Low Initial Capital',
    description: 'Require minimal upfront investment',
    enabled: false,
    value: 10000,
    type: 'number',
    promptText: 'The idea must require less than ${value} in initial capital to start.',
  },
  {
    id: 'fastTimeToMarket',
    label: 'Fast Time to Market',
    description: 'Ideas that can launch quickly',
    enabled: false,
    value: 3,
    type: 'number',
    promptText: 'The idea must be launchable within {value} months or less.',
  },
  {
    id: 'noRegulation',
    label: 'Minimal Regulatory Requirements',
    description: 'Avoid heavily regulated industries',
    enabled: false,
    type: 'toggle',
    promptText: 'The idea must not require significant regulatory approvals or licenses.',
  },
  {
    id: 'remoteFirst',
    label: 'Remote-First Business',
    description: 'Can be operated entirely remotely',
    enabled: false,
    type: 'toggle',
    promptText: 'The business must be fully operable remotely without physical location requirements.',
  },
  {
    id: 'saasModel',
    label: 'SaaS Business Model',
    description: 'Focus on software-as-a-service',
    enabled: false,
    type: 'toggle',
    promptText: 'The idea must follow a Software-as-a-Service (SaaS) business model with recurring revenue.',
  },
  {
    id: 'b2bFocus',
    label: 'B2B Focus',
    description: 'Target business customers instead of consumers',
    enabled: false,
    type: 'toggle',
    promptText: 'The idea must target business customers (B2B) rather than individual consumers.',
  },
  {
    id: 'provenMarket',
    label: 'Proven Market Demand',
    description: 'Target markets with existing demand',
    enabled: false,
    type: 'toggle',
    promptText: 'The idea must address a market with proven, existing demand (not creating new market).',
  },
  {
    id: 'lowTechComplexity',
    label: 'Low Technical Complexity',
    description: 'Avoid highly technical solutions',
    enabled: false,
    type: 'toggle',
    promptText: 'The technical implementation must be straightforward, avoiding complex algorithms or infrastructure.',
  },
  {
    id: 'profitableFirstYear',
    label: 'First Year Profitability',
    description: 'Achieve profitability within 12 months',
    enabled: false,
    type: 'toggle',
    promptText: 'The business model must be designed to achieve profitability within the first year.',
  },
];

export default function ExtraFiltersEditor() {
  const { selectedProfile } = useConfigProfile();
  const [filters, setFilters] = useState<FilterOption[]>(defaultFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (selectedProfile) {
      loadFilters();
    }
  }, [selectedProfile]);

  const loadFilters = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSettings(selectedProfile?.id);

      if (data.extraFilters) {
        // Merge loaded filters with defaults (in case new filters were added)
        const loadedFilters = data.extraFilters;
        const mergedFilters = defaultFilters.map(defaultFilter => {
          const loaded = loadedFilters.find((f: FilterOption) => f.id === defaultFilter.id);
          return loaded || defaultFilter;
        });
        setFilters(mergedFilters);
      }
    } catch (error: any) {
      console.error('Failed to load extra filters:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load filters' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFilters = async () => {
    try {
      setIsSaving(true);
      setMessage(null);

      // Get current settings and merge with filters
      const currentSettings = await api.getSettings(selectedProfile?.id);
      await api.updateSettings(
        {
          ...currentSettings,
          extraFilters: filters,
        },
        selectedProfile?.id
      );

      setMessage({ type: 'success', text: 'Extra filters saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to save extra filters:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save filters' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFilter = (id: string) => {
    setFilters(filters.map(filter =>
      filter.id === id ? { ...filter, enabled: !filter.enabled } : filter
    ));
  };

  const updateFilterValue = (id: string, value: number | string) => {
    setFilters(filters.map(filter =>
      filter.id === id ? { ...filter, value } : filter
    ));
  };

  const getActiveFiltersPrompt = () => {
    const activeFilters = filters.filter(f => f.enabled);
    if (activeFilters.length === 0) {
      return 'No extra filters active';
    }

    return activeFilters.map(filter => {
      let text = filter.promptText;
      if (filter.value !== undefined) {
        text = text.replace('{value}', String(filter.value));
      }
      return `• ${text}`;
    }).join('\n');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Extra Filters
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Add optional constraints to idea generation prompts
            </p>
          </div>
          <button
            onClick={saveFilters}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Filters'}
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Available Filters
        </h3>
        <div className="space-y-4">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={`border rounded-lg p-4 transition-colors ${
                filter.enabled
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => toggleFilter(filter.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        filter.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          filter.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {filter.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {filter.description}
                      </p>
                    </div>
                  </div>

                  {/* Value input for number type filters */}
                  {filter.enabled && filter.type === 'number' && (
                    <div className="mt-3 ml-14">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Value
                      </label>
                      <input
                        type="number"
                        value={filter.value as number}
                        onChange={(e) => updateFilterValue(filter.id, parseInt(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  )}

                  {/* Prompt text preview */}
                  {filter.enabled && (
                    <div className="mt-3 ml-14 p-3 bg-gray-100 dark:bg-gray-700 rounded border-l-4 border-blue-500">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                        {filter.promptText.replace(
                          '{value}',
                          String(filter.value || '')
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Prompt Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Active Filters - Prompt Addition
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          This text will be added to the generation prompt when enabled filters are active:
        </p>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
            {getActiveFiltersPrompt()}
          </pre>
        </div>
      </div>
    </div>
  );
}
