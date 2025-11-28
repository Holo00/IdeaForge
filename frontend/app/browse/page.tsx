'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Idea } from '@/types';

interface Domain {
  domain: string;
  subdomains: string[];
}

interface Framework {
  name: string;
}

export default function PublicBrowsePage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Filter options from API
  const [domains, setDomains] = useState<Domain[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [monetizationModels, setMonetizationModels] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>([]);

  // Basic Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [subdomainFilter, setSubdomainFilter] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Advanced Filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [frameworkFilter, setFrameworkFilter] = useState<string>('');
  const [monetizationFilter, setMonetizationFilter] = useState<string>('');
  const [targetAudienceFilter, setTargetAudienceFilter] = useState<string>('');
  const [maxTeamSize, setMaxTeamSize] = useState<number | undefined>(undefined);

  // Pagination
  const [limit] = useState<number>(18);
  const [offset, setOffset] = useState<number>(0);

  // Get subdomains for selected domain
  const availableSubdomains = domainFilter
    ? domains.find((d) => d.domain === domainFilter)?.subdomains || []
    : [];

  // Load filter options on mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const [domainsRes, frameworksRes, monetizationRes, audiencesRes] = await Promise.all([
        fetch(`${apiUrl}/config/domains`).then((r) => r.json()).catch(() => ({ domains: [] })),
        fetch(`${apiUrl}/config/frameworks`).then((r) => r.json()).catch(() => ({ generation_templates: [] })),
        fetch(`${apiUrl}/config/monetization-models`).then((r) => r.json()).catch(() => ({ monetization_models: [] })),
        fetch(`${apiUrl}/config/target-audiences`).then((r) => r.json()).catch(() => ({ target_audiences: [] })),
      ]);

      // Process domains
      if (domainsRes?.domains) {
        const transformedDomains = domainsRes.domains.map((d: any) => ({
          domain: d.name || d.domain,
          subdomains: d.subdomains?.map((s: any) => s.name || s) || [],
        }));
        setDomains(transformedDomains);
      }

      // Process frameworks
      if (frameworksRes?.generation_templates) {
        setFrameworks(frameworksRes.generation_templates);
      }

      // Process monetization models
      if (monetizationRes?.monetization_models) {
        setMonetizationModels(monetizationRes.monetization_models.map((m: any) => m.name || m));
      }

      // Process target audiences
      if (audiencesRes?.target_audiences) {
        setTargetAudiences(audiencesRes.target_audiences.map((a: any) => a.name || a));
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        limit: limit.toString(),
        offset: offset.toString(),
      });

      // Basic filters
      if (searchQuery) params.append('search', searchQuery);
      if (domainFilter) params.append('domain', domainFilter);
      if (subdomainFilter) params.append('subdomain', subdomainFilter);
      if (minScore > 0) params.append('minScore', minScore.toString());

      // Advanced filters
      if (frameworkFilter) params.append('framework', frameworkFilter);
      if (monetizationFilter) params.append('monetization', monetizationFilter);
      if (targetAudienceFilter) params.append('targetAudience', targetAudienceFilter);
      if (maxTeamSize !== undefined) params.append('maxTeamSize', maxTeamSize.toString());

      const response = await fetch(`${apiUrl}/ideas?${params}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }
      const data = await response.json();

      setIdeas(data.data?.ideas || []);
      setTotal(data.data?.total || 0);
      abortControllerRef.current = null;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load ideas');
        setIdeas([]);
        setTotal(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    domainFilter,
    subdomainFilter,
    minScore,
    sortBy,
    sortOrder,
    frameworkFilter,
    monetizationFilter,
    targetAudienceFilter,
    maxTeamSize,
    limit,
    offset,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchIdeas();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [fetchIdeas]);

  // Reset subdomain when domain changes
  useEffect(() => {
    if (!domainFilter) {
      setSubdomainFilter('');
    }
  }, [domainFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setDomainFilter('');
    setSubdomainFilter('');
    setMinScore(0);
    setFrameworkFilter('');
    setMonetizationFilter('');
    setTargetAudienceFilter('');
    setMaxTeamSize(undefined);
    setOffset(0);
  };

  const hasActiveFilters =
    searchQuery ||
    domainFilter ||
    subdomainFilter ||
    minScore > 0 ||
    frameworkFilter ||
    monetizationFilter ||
    targetAudienceFilter ||
    maxTeamSize !== undefined;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-success/20 text-success';
    if (score >= 50) return 'bg-warning/20 text-warning';
    return 'bg-error/20 text-error';
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">
                <span className="text-mint">Idea</span>
                <span className="text-text-primary">Forge</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm text-text-secondary hover:text-mint transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Browse Ideas</h1>
          <p className="text-sm text-text-secondary">
            Explore {total} AI-generated startup ideas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-surface rounded-xl border border-border-subtle p-4 mb-6">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
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
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOffset(0);
                }}
                placeholder="Search ideas by name or summary..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-base border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:border-mint focus:outline-none focus:ring-1 focus:ring-mint"
              />
            </div>
          </div>

          {/* Basic Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            {/* Domain */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Domain</label>
              <select
                value={domainFilter}
                onChange={(e) => {
                  setDomainFilter(e.target.value);
                  setSubdomainFilter('');
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none"
              >
                <option value="">All Domains</option>
                {domains.map((d, idx) => (
                  <option key={`${d.domain}-${idx}`} value={d.domain}>
                    {d.domain}
                  </option>
                ))}
              </select>
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Subdomain</label>
              <select
                value={subdomainFilter}
                onChange={(e) => {
                  setSubdomainFilter(e.target.value);
                  setOffset(0);
                }}
                disabled={!domainFilter || availableSubdomains.length === 0}
                className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none disabled:opacity-50"
              >
                <option value="">All Subdomains</option>
                {availableSubdomains.map((s, idx) => (
                  <option key={`${s}-${idx}`} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Framework */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Framework</label>
              <select
                value={frameworkFilter}
                onChange={(e) => {
                  setFrameworkFilter(e.target.value);
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none"
              >
                <option value="">All Frameworks</option>
                {frameworks.map((f, idx) => (
                  <option key={`${f.name}-${idx}`} value={f.name}>
                    {f.name}
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
                onChange={(e) => {
                  setMinScore(parseInt(e.target.value));
                  setOffset(0);
                }}
                className="w-full mt-1.5 accent-mint"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder as 'asc' | 'desc');
                  setOffset(0);
                }}
                className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none"
              >
                <option value="created-desc">Newest</option>
                <option value="created-asc">Oldest</option>
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
            </div>

            {/* Reset/Actions */}
            <div className="flex items-end gap-2">
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary border border-border-subtle rounded-lg hover:bg-hover transition-colors"
                >
                  Reset
                </button>
              )}
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
            <span className="text-xs text-text-muted">
              {total} {total === 1 ? 'idea' : 'ideas'} found
            </span>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Monetization */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Monetization
                  </label>
                  <select
                    value={monetizationFilter}
                    onChange={(e) => {
                      setMonetizationFilter(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none"
                  >
                    <option value="">All Models</option>
                    {monetizationModels.map((m, idx) => (
                      <option key={`${m}-${idx}`} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Target Audience
                  </label>
                  <select
                    value={targetAudienceFilter}
                    onChange={(e) => {
                      setTargetAudienceFilter(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none"
                  >
                    <option value="">All Audiences</option>
                    {targetAudiences.map((a, idx) => (
                      <option key={`${a}-${idx}`} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Team Size */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Max Team Size
                  </label>
                  <select
                    value={maxTeamSize ?? ''}
                    onChange={(e) => {
                      setMaxTeamSize(e.target.value ? Number(e.target.value) : undefined);
                      setOffset(0);
                    }}
                    className="w-full px-3 py-2 text-sm bg-base border border-border-subtle rounded-lg text-text-primary focus:border-mint focus:outline-none"
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
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Ideas Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
              <span className="text-text-secondary">Loading ideas...</span>
            </div>
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-text-primary mb-2">No ideas found</h2>
            <p className="text-sm text-text-secondary mb-4">Try adjusting your filters</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-medium text-mint border border-mint rounded-lg hover:bg-mint/10 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/browse/${idea.id}`}
                  className="group bg-surface hover:bg-elevated rounded-xl border border-border-subtle hover:border-mint/30 p-5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 text-sm font-bold rounded-lg ${getScoreColor(idea.score)}`}
                    >
                      {idea.score}
                    </span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      <span className="px-2 py-0.5 text-xs font-medium bg-mint/10 text-mint rounded-full">
                        {idea.domain}
                      </span>
                      {idea.generationFramework && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-elevated text-text-secondary rounded-full">
                          {idea.generationFramework}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2 group-hover:text-mint transition-colors line-clamp-2">
                    {idea.name}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-3 mb-4">
                    {idea.quickSummary}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <span className="text-xs text-text-muted">
                      {new Date(idea.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-mint font-medium group-hover:translate-x-1 transition-transform">
                      View Details →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-surface rounded-xl border border-border-subtle p-4">
              <span className="text-sm text-text-secondary">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} ideas
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-4 py-2 text-sm font-medium text-text-primary border border-border-default rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-4 py-2 text-sm font-medium text-text-primary border border-border-default rounded-lg hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-8 text-center">
          <p className="text-sm text-text-muted">Powered by AI - Claude & Gemini</p>
        </div>
      </footer>

      {/* CSS for line clamp */}
      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
