'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Domain {
  domain: string;
  subdomains?: string[];
}

interface Framework {
  name: string;
  description?: string;
}

interface Criterion {
  name: string;
  key: string;
}

interface AdvancedFiltersProps {
  // Basic filters
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  domainFilter: string;
  setDomainFilter: (value: string) => void;
  subdomainFilter: string;
  setSubdomainFilter: (value: string) => void;
  minScore: number;
  setMinScore: (value: number) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
  // Advanced filters
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  frameworkFilter: string;
  setFrameworkFilter: (value: string) => void;
  monetizationFilter: string;
  setMonetizationFilter: (value: string) => void;
  targetAudienceFilter: string;
  setTargetAudienceFilter: (value: string) => void;
  maxTeamSizeFilter: number | undefined;
  setMaxTeamSizeFilter: (value: number | undefined) => void;
  minCriteriaScores: Record<string, number>;
  setMinCriteriaScores: (value: Record<string, number>) => void;
  // Actions
  onResetFilters: () => void;
  onApplyFilters: () => void;
}

export default function AdvancedFilters({
  statusFilter,
  setStatusFilter,
  domainFilter,
  setDomainFilter,
  subdomainFilter,
  setSubdomainFilter,
  minScore,
  setMinScore,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  searchQuery,
  setSearchQuery,
  frameworkFilter,
  setFrameworkFilter,
  monetizationFilter,
  setMonetizationFilter,
  targetAudienceFilter,
  setTargetAudienceFilter,
  maxTeamSizeFilter,
  setMaxTeamSizeFilter,
  minCriteriaScores,
  setMinCriteriaScores,
  onResetFilters,
  onApplyFilters,
}: AdvancedFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [subdomains, setSubdomains] = useState<string[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [monetizationModels, setMonetizationModels] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);

  // Load filter options from API
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Update subdomains when domain changes
  useEffect(() => {
    if (domainFilter) {
      const domain = domains.find(d => d.domain === domainFilter);
      setSubdomains(domain?.subdomains || []);
      if (domain?.subdomains && !domain.subdomains.includes(subdomainFilter)) {
        setSubdomainFilter('');
      }
    } else {
      setSubdomains([]);
      setSubdomainFilter('');
    }
  }, [domainFilter, domains]);

  const loadFilterOptions = async () => {
    try {
      // Load all filter options in parallel
      const [domainsData, frameworksData, criteriaData, monetizationData, audiencesData] = await Promise.all([
        api.getDomains().catch(() => ({ domains: [] })),
        api.getFrameworks().catch(() => ({ generation_templates: [] })),
        api.getCriteria().catch(() => ({ draft_phase_criteria: [] })),
        api.getMonetizationModels().catch(() => ({ monetization_models: [] })),
        api.getTargetAudiences().catch(() => ({ target_audiences: [] })),
      ]);

      // Process domains - transform from YAML structure (name, subdomains as objects)
      // to component structure (domain, subdomains as strings)
      if (domainsData?.domains) {
        const transformedDomains = domainsData.domains.map((d: any) => ({
          domain: d.name || d.domain,
          subdomains: d.subdomains?.map((s: any) => s.name || s) || [],
        }));
        setDomains(transformedDomains);
      }

      // Process frameworks
      if (frameworksData?.generation_templates) {
        setFrameworks(frameworksData.generation_templates);
      }

      // Process criteria
      if (criteriaData?.draft_phase_criteria) {
        const criteriaList = criteriaData.draft_phase_criteria.map((c: any) => ({
          name: c.name,
          key: toCamelCase(c.name),
        }));
        setCriteria(criteriaList);
      }

      // Process monetization models
      if (monetizationData?.monetization_models) {
        setMonetizationModels(monetizationData.monetization_models.map((m: any) => m.name || m));
      }

      // Process target audiences
      if (audiencesData?.target_audiences) {
        setTargetAudiences(audiencesData.target_audiences.map((a: any) => a.name || a));
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const toCamelCase = (name: string): string => {
    return name
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  };

  const handleCriterionScoreChange = (key: string, value: number) => {
    setMinCriteriaScores({
      ...minCriteriaScores,
      [key]: value,
    });
  };

  const hasActiveFilters = () => {
    return (
      statusFilter !== 'all' ||
      domainFilter !== '' ||
      subdomainFilter !== '' ||
      minScore > 0 ||
      searchQuery !== '' ||
      frameworkFilter !== '' ||
      monetizationFilter !== '' ||
      targetAudienceFilter !== '' ||
      maxTeamSizeFilter !== undefined ||
      Object.values(minCriteriaScores).some(v => v > 0)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ideas by name or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Basic Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Domain Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Domain
          </label>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Domains</option>
            {domains.map((d, idx) => (
              <option key={`${d.domain}-${idx}`} value={d.domain}>
                {d.domain}
              </option>
            ))}
          </select>
        </div>

        {/* Subdomain Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subdomain
          </label>
          <select
            value={subdomainFilter}
            onChange={(e) => setSubdomainFilter(e.target.value)}
            disabled={!domainFilter || subdomains.length === 0}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <option value="">All Subdomains</option>
            {subdomains.map((s, idx) => (
              <option key={`${s}-${idx}`} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Min Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Score: {minScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full mt-2"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="score">Score</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Advanced Filters */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </button>

        <div className="flex gap-2">
          {hasActiveFilters() && (
            <button
              onClick={onResetFilters}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 font-medium"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={onApplyFilters}
            className="px-4 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Row 1: Framework, Monetization, Target Audience, Team Size */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Framework Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Framework
              </label>
              <select
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Frameworks</option>
                {frameworks.map((f, idx) => (
                  <option key={`${f.name}-${idx}`} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Monetization Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monetization
              </label>
              <select
                value={monetizationFilter}
                onChange={(e) => setMonetizationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Models</option>
                {monetizationModels.map((m, idx) => (
                  <option key={`${m}-${idx}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Audience Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Audience
              </label>
              <select
                value={targetAudienceFilter}
                onChange={(e) => setTargetAudienceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Audiences</option>
                {targetAudiences.map((a, idx) => (
                  <option key={`${a}-${idx}`} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Team Size Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Team Size
              </label>
              <select
                value={maxTeamSizeFilter ?? ''}
                onChange={(e) => setMaxTeamSizeFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Any Size</option>
                <option value="1">Solo (1 person)</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="5">Up to 5</option>
                <option value="10">Up to 10</option>
              </select>
            </div>
          </div>

          {/* Row 2: Criteria Score Filters */}
          {criteria.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Minimum Criteria Scores
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {criteria.map((c) => (
                  <div key={c.key}>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {c.name}: {minCriteriaScores[c.key] || 0}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={minCriteriaScores[c.key] || 0}
                      onChange={(e) => handleCriterionScoreChange(c.key, Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}