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
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading filters...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-border-subtle pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Extra Filters
            </h2>
            <p className="text-xs text-text-secondary">
              Add optional constraints to idea generation prompts
            </p>
          </div>
          <button
            onClick={saveFilters}
            disabled={isSaving}
            className="px-3 py-1 bg-mint text-base rounded hover:bg-mint-dark transition-colors disabled:opacity-50 text-xs font-medium"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {message && (
          <div
            className={`mt-3 p-2 rounded text-xs ${
              message.type === 'success'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-error/10 text-error border border-error/20'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* Filter Options */}
      <div>
        <h3 className="text-xs font-medium text-text-secondary mb-3">
          Available Filters
        </h3>
        <div className="space-y-2">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={`border rounded p-3 transition-colors ${
                filter.enabled
                  ? 'border-mint/30 bg-mint/5'
                  : 'border-border-subtle'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleFilter(filter.id)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                    filter.enabled ? 'bg-mint' : 'bg-elevated'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      filter.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-text-primary text-sm">
                    {filter.label}
                  </h4>
                  <p className="text-xs text-text-muted">
                    {filter.description}
                  </p>

                  {/* Value input for number type filters */}
                  {filter.enabled && filter.type === 'number' && (
                    <div className="mt-2">
                      <label className="block text-micro font-medium text-text-secondary mb-1">
                        Value
                      </label>
                      <input
                        type="number"
                        value={filter.value as number}
                        onChange={(e) => updateFilterValue(filter.id, parseInt(e.target.value))}
                        className="w-24 px-2 py-1 text-xs border border-border-default rounded bg-base text-text-primary focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                      />
                    </div>
                  )}

                  {/* Prompt text preview */}
                  {filter.enabled && (
                    <div className="mt-2 p-2 bg-elevated/50 rounded border-l-2 border-mint">
                      <p className="text-micro text-text-secondary font-mono">
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
      <div className="bg-info/5 border border-info/20 rounded p-3">
        <h3 className="text-xs font-semibold text-info mb-2">
          Active Filters - Prompt Addition
        </h3>
        <p className="text-micro text-text-secondary mb-2">
          This text will be added to generation prompts when active:
        </p>
        <div className="p-2 bg-base rounded border border-border-subtle">
          <pre className="text-micro text-text-primary whitespace-pre-wrap font-mono">
            {getActiveFiltersPrompt()}
          </pre>
        </div>
      </div>
    </div>
  );
}
