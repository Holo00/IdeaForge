'use client';

import { Idea } from '@/types';
import Link from 'next/link';

interface RecentIdeasProps {
  ideas: Idea[];
  onRefresh?: () => void;
}

export default function RecentIdeas({ ideas, onRefresh }: RecentIdeasProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Recent Ideas</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <Link
            href="/ideas"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            View All →
          </Link>
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
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
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No ideas yet</p>
          <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">Generate your first idea to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/ideas/${idea.id}`}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {idea.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(
                        idea.score
                      )}`}
                    >
                      {idea.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                    {idea.quickSummary}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {idea.domain}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(idea.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
