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
        return 'text-error bg-error/10 border-error/30';
      case 'warning':
        return 'text-warning bg-warning/10 border-warning/30';
      default:
        return 'text-text-secondary bg-surface border-border-subtle';
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
    <div className="bg-surface rounded-md border border-border-subtle p-4 space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Live Logs</h2>
        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs border border-border-default bg-base text-text-primary rounded px-2 py-1 focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
          >
            <option value="all">All Logs</option>
            <option value="info">Info Only</option>
            <option value="warning">Warnings Only</option>
            <option value="error">Errors Only</option>
          </select>

          {/* Auto-scroll toggle */}
          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-border-default bg-base text-mint focus:ring-mint focus:ring-offset-0 w-3.5 h-3.5"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Logs container */}
      <div
        ref={logsContainerRef}
        className="bg-base rounded p-3 h-80 overflow-y-auto font-mono text-xs text-text-primary"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center text-text-muted py-8">
            <p>No logs to display</p>
            <p className="text-xs mt-1">Logs will appear here as operations run</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.id}-${index}`}
                className={`p-2 rounded border ${getLevelColor(log.level)}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-semibold uppercase text-micro">
                        {log.level}
                      </span>
                      <span className="text-micro opacity-75">{log.timestamp}</span>
                    </div>
                    <p className="text-xs break-words">{log.message}</p>
                    {log.details && (
                      <pre className="mt-1 text-micro opacity-75 overflow-x-auto">
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
      <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-border-subtle">
        <span>
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
        <button
          onClick={() => {
            /* TODO: Clear logs */
          }}
          className="text-mint hover:text-mint-light font-medium transition-colors"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
