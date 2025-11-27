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
    <div className="bg-surface rounded-md border border-border-subtle p-4 mb-4">
      {/* Search Bar */}
      <div className="mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search ideas by name or summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-border-default bg-base text-text-primary placeholder-text-muted rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
          />
          <svg
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Basic Filters Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Domain Filter */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Domain
          </label>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
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
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Subdomain
          </label>
          <select
            value={subdomainFilter}
            onChange={(e) => setSubdomainFilter(e.target.value)}
            disabled={!domainFilter || subdomains.length === 0}
            className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint disabled:opacity-50"
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
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Min Score: {minScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full mt-1 accent-mint"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Sort By
          </label>
          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
            >
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="score">Score</option>
              <option value="name">Name</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1.5 border border-border-default bg-base text-text-primary rounded hover:bg-hover"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Toggle Advanced Filters */}
      <div className="flex items-center justify-between border-t border-border-subtle pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-mint hover:text-mint-light font-medium flex items-center gap-1"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
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
              className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary font-medium"
            >
              Reset Filters
            </button>
          )}
          <button
            onClick={onApplyFilters}
            className="px-3 py-1 text-xs bg-mint text-base rounded hover:bg-mint-dark font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          {/* Row 1: Framework, Monetization, Target Audience, Team Size */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {/* Framework Filter */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Framework
              </label>
              <select
                value={frameworkFilter}
                onChange={(e) => setFrameworkFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
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
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Monetization
              </label>
              <select
                value={monetizationFilter}
                onChange={(e) => setMonetizationFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
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
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Target Audience
              </label>
              <select
                value={targetAudienceFilter}
                onChange={(e) => setTargetAudienceFilter(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
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
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Max Team Size
              </label>
              <select
                value={maxTeamSizeFilter ?? ''}
                onChange={(e) => setMaxTeamSizeFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-2 py-1.5 text-sm border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
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
              <h4 className="text-xs font-medium text-text-secondary mb-2">
                Minimum Criteria Scores
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {criteria.map((c) => (
                  <div key={c.key}>
                    <label className="block text-micro text-text-muted mb-1">
                      {c.name}: {minCriteriaScores[c.key] || 0}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={minCriteriaScores[c.key] || 0}
                      onChange={(e) => handleCriterionScoreChange(c.key, Number(e.target.value))}
                      className="w-full accent-mint"
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