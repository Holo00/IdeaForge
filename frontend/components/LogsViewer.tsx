'use client';

import { useState, useEffect, useRef } from 'react';
import { LogEntry } from '@/types';

interface LogsViewerProps {
  logs: LogEntry[];
}

export default function LogsViewer({ logs }: LogsViewerProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(
    (log) => filter === 'all' || log.level === filter
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Live Logs</h2>
        <div className="flex items-center gap-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Logs</option>
            <option value="info">Info Only</option>
            <option value="warning">Warnings Only</option>
            <option value="error">Errors Only</option>
          </select>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Logs container */}
      <div
        ref={logsContainerRef}
        className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm text-gray-100"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-gray-300 dark:text-gray-400 py-8">
            <p>No logs to display</p>
            <p className="text-xs mt-2">Logs will appear here as operations run</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className={`p-3 rounded border ${getLevelColor(log.level)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold uppercase text-xs">
                        {log.level}
                      </span>
                      <span className="text-xs opacity-75">{log.timestamp}</span>
                    </div>
                    <p className="text-sm break-words">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 text-xs opacity-75 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 pt-2 border-t dark:border-gray-700">
        <span>
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
        <button
          onClick={() => {
            /* TODO: Clear logs */
          }}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
