'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Idea } from '@/types';
import { api } from '@/lib/api';
import AdvancedFilters from '@/components/ideas/AdvancedFilters';

export default function IdeasPage() {
  const pathname = usePathname();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Basic Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [subdomainFilter, setSubdomainFilter] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);

  // Advanced Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('');
  const [monetizationFilter, setMonetizationFilter] = useState<string>('');
  const [targetAudienceFilter, setTargetAudienceFilter] = useState<string>('');
  const [maxTeamSizeFilter, setMaxTeamSizeFilter] = useState<number | undefined>(undefined);
  const [minCriteriaScores, setMinCriteriaScores] = useState<Record<string, number>>({});

  const fetchIdeas = useCallback(async () => {
    console.log('[IdeasPage] Starting fetchIdeas');
    setIsLoading(true);
    setError(null);

    // Abort any previous request
    if (abortControllerRef.current) {
      console.log('[IdeasPage] Aborting previous request');
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const params: any = {
        sortBy,
        sortOrder,
        limit,
        offset,
      };

      // Basic filters
      if (statusFilter !== 'all') params.status = statusFilter;
      if (domainFilter) params.domain = domainFilter;
      if (subdomainFilter) params.subdomain = subdomainFilter;
      if (minScore > 0) params.minScore = minScore;

      // Advanced filters
      if (searchQuery) params.search = searchQuery;
      if (frameworkFilter) params.framework = frameworkFilter;
      if (monetizationFilter) params.monetization = monetizationFilter;
      if (targetAudienceFilter) params.targetAudience = targetAudienceFilter;
      if (maxTeamSizeFilter !== undefined) params.maxTeamSize = maxTeamSizeFilter;

      // Criteria score filters (only include if any are set > 0)
      const activeScores = Object.fromEntries(
        Object.entries(minCriteriaScores).filter(([_, v]) => v > 0)
      );
      if (Object.keys(activeScores).length > 0) {
        params.minCriteriaScores = activeScores;
      }

      console.log('[IdeasPage] Fetching ideas with params:', params);

      // Add timeout to prevent hanging indefinitely
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000);
      });

      const response = await Promise.race([
        api.getIdeas(params),
        timeoutPromise
      ]);

      console.log('[IdeasPage] Ideas fetched successfully:', response);
      setIdeas(response.ideas || []);
      setTotal(response.total || 0);
      abortControllerRef.current = null;
    } catch (error: any) {
      console.error('[IdeasPage] Failed to fetch ideas:', error);
      setError(error.message || 'Failed to load ideas');
      setIdeas([]);
      setTotal(0);
      abortControllerRef.current = null;
    } finally {
      console.log('[IdeasPage] Setting isLoading to false');
      setIsLoading(false);
    }
  }, [statusFilter, domainFilter, subdomainFilter, minScore, sortBy, sortOrder, limit, offset, searchQuery, frameworkFilter, monetizationFilter, targetAudienceFilter, maxTeamSizeFilter, minCriteriaScores]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setDomainFilter('');
    setSubdomainFilter('');
    setMinScore(0);
    setSearchQuery('');
    setFrameworkFilter('');
    setMonetizationFilter('');
    setTargetAudienceFilter('');
    setMaxTeamSizeFilter(undefined);
    setMinCriteriaScores({});
    setOffset(0);
  };

  const handleApplyFilters = () => {
    setOffset(0);
    fetchIdeas();
  };

  // Initial load and when filters change
  useEffect(() => {
    console.log('[IdeasPage] Mount or filter changed, fetching ideas...');

    // Small delay to allow any cleanup from previous page to complete
    const timeoutId = setTimeout(() => {
      fetchIdeas();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchIdeas]);

  // Force refresh when navigating to this page or when it becomes visible
  useEffect(() => {
    console.log('[IdeasPage] Setting up page visibility handlers');

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pathname === '/ideas') {
        console.log('[IdeasPage] Page became visible, refreshing...');
        fetchIdeas();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      console.log('[IdeasPage] Cleaning up visibility handler');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, fetchIdeas]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-success/20 text-success';
    if (score >= 50) return 'bg-warning/20 text-warning';
    return 'bg-error/20 text-error';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-text-muted/20 text-text-secondary',
      active: 'bg-info/20 text-info',
      archived: 'bg-warning/20 text-warning',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Browse Ideas</h1>
          <p className="text-sm text-text-secondary">
            {total} {total === 1 ? 'idea' : 'ideas'} in the database
          </p>
        </div>
        <button
          onClick={fetchIdeas}
          className="px-3 py-1.5 text-sm bg-gradient-to-r from-mint to-mint-dark text-base font-medium rounded hover:from-mint-light hover:to-mint transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        domainFilter={domainFilter}
        setDomainFilter={setDomainFilter}
        subdomainFilter={subdomainFilter}
        setSubdomainFilter={setSubdomainFilter}
        minScore={minScore}
        setMinScore={setMinScore}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        frameworkFilter={frameworkFilter}
        setFrameworkFilter={setFrameworkFilter}
        monetizationFilter={monetizationFilter}
        setMonetizationFilter={setMonetizationFilter}
        targetAudienceFilter={targetAudienceFilter}
        setTargetAudienceFilter={setTargetAudienceFilter}
        maxTeamSizeFilter={maxTeamSizeFilter}
        setMaxTeamSizeFilter={setMaxTeamSizeFilter}
        minCriteriaScores={minCriteriaScores}
        setMinCriteriaScores={setMinCriteriaScores}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-md p-3 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Ideas Table */}
      <div className="bg-surface rounded-md border border-border-subtle overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-mint border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">Loading ideas...</span>
            </div>
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto mb-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm font-medium text-text-primary">No ideas found</p>
            <p className="text-xs text-text-secondary mt-1">Try adjusting your filters or generate some ideas</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-elevated border-b border-border-subtle">
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Idea</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Domain</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Score</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Created</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="border-b border-border-subtle hover:bg-hover transition-colors">
                      <td className="px-3 py-2">
                        <div className="max-w-md">
                          <Link
                            href={`/ideas/${idea.id}`}
                            className="text-sm font-medium text-text-primary hover:text-mint transition-colors"
                          >
                            {idea.name}
                          </Link>
                          <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{idea.quickSummary}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="text-sm text-text-primary">{idea.domain}</span>
                        {idea.subdomain && (
                          <span className="text-xs text-text-muted block">{idea.subdomain}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getScoreColor(idea.score)}`}>
                          {idea.score}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusBadge(idea.status)}`}>
                          {idea.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-text-secondary">
                        {new Date(idea.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <Link
                          href={`/ideas/${idea.id}`}
                          className="text-xs font-medium text-mint hover:text-mint-light transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-3 py-2 flex items-center justify-between border-t border-border-subtle bg-elevated">
              <span className="text-xs text-text-secondary">
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1 text-xs font-medium text-text-primary border border-border-default rounded hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-3 py-1 text-xs font-medium text-text-primary border border-border-default rounded hover:bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
