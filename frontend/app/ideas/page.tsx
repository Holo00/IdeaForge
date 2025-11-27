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
    if (score >= 70) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      archived: 'bg-orange-100 text-orange-800',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-2 inline-flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Browse Ideas</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {total} {total === 1 ? 'idea' : 'ideas'} in the database
              </p>
            </div>
            <button
              onClick={fetchIdeas}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Ideas Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
              <p className="text-gray-600 dark:text-gray-300 mt-4">Loading ideas...</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No ideas found</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Try adjusting your filters or generate some ideas
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Idea
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {ideas.map((idea) => (
                      <tr key={idea.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <Link
                              href={`/ideas/${idea.id}`}
                              className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                              {idea.name}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                              {idea.quickSummary}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{idea.domain}</div>
                          {idea.subdomain && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {idea.subdomain}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getScoreColor(
                              idea.score
                            )}`}
                          >
                            {idea.score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                              idea.status
                            )}`}
                          >
                            {idea.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(idea.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/ideas/${idea.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
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
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
                <div className="flex-1 flex justify-between items-center">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">{offset + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(offset + limit, total)}
                    </span>{' '}
                    of <span className="font-medium">{total}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
