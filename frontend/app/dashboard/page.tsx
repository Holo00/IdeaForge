'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import GenerationControls from '@/components/GenerationControls';
import LogsViewer from '@/components/LogsViewer';
import { Idea, LogEntry } from '@/types';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const pathname = usePathname();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const lastLogIdRef = useRef<number>(0);

  // Initial load
  useEffect(() => {
    fetchRecentIdeas();
    checkActiveGeneration();

    // Cleanup on unmount
    return () => {
      console.log('[Dashboard] Component unmounting, stopping polling');
      stopPolling();
    };
  }, []);

  // Stop polling when navigating away from dashboard
  useEffect(() => {
    if (pathname !== '/dashboard') {
      console.log('[Dashboard] Navigating away from dashboard to:', pathname);
      console.log('[Dashboard] Stopping polling immediately');
      stopPolling();
      setIsGenerating(false);
      setCurrentStage('');
      console.log('[Dashboard] Polling stopped, cleanup complete');
    } else {
      console.log('[Dashboard] Currently on dashboard, pathname:', pathname);
    }
  }, [pathname]);

  const stopPolling = () => {
    console.log('[Dashboard] stopPolling called, current interval:', pollIntervalRef.current);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log('[Dashboard] Interval cleared');
    } else {
      console.log('[Dashboard] No active interval to clear');
    }
    currentSessionIdRef.current = null;
    lastLogIdRef.current = 0;
    console.log('[Dashboard] All polling state cleared');
  };

  const checkActiveGeneration = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${apiUrl}/logs/active`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();

      if (result.success && result.data) {
        // There's an active generation, start polling
        setIsGenerating(true);
        startPolling(result.data.session_id);
      }
    } catch (error) {
      console.error('Failed to check active generation:', error);
    }
  };

  const startPolling = (sessionId: string) => {
    console.log('[Dashboard] Starting polling for session:', sessionId);

    // Stop any existing polling
    stopPolling();

    // Set current session
    currentSessionIdRef.current = sessionId;
    lastLogIdRef.current = 0;

    // Start polling every 3 seconds (reduced frequency to avoid overwhelming backend)
    pollIntervalRef.current = setInterval(async () => {
      await pollLogsAndStatus();
    }, 3000);

    // Do initial poll immediately
    pollLogsAndStatus();
  };

  const pollLogsAndStatus = async () => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Create timeout for fetch requests (5 seconds)
      const fetchWithTimeout = (url: string) => {
        return Promise.race([
          fetch(url, { headers }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), 5000)
          )
        ]);
      };

      // Fetch logs and status in parallel with timeout
      const [logsResponse, statusResponse] = await Promise.all([
        fetchWithTimeout(`${apiUrl}/logs/session/${sessionId}`).catch(() => {
          // Silently ignore 404s and timeouts - session might not exist yet
          return null;
        }),
        fetchWithTimeout(`${apiUrl}/logs/status/${sessionId}`).catch(() => {
          // Silently ignore 404s and timeouts - session might not exist yet
          return null;
        })
      ]);

      // Process logs
      if (logsResponse && logsResponse.ok) {
        const logsResult = await logsResponse.json();
        if (logsResult.success && logsResult.data) {
          const newLogs = logsResult.data.filter((log: any) => log.id > lastLogIdRef.current);

          if (newLogs.length > 0) {
            const formattedLogs: LogEntry[] = newLogs.map((log: any) => ({
              id: log.id.toString(),
              timestamp: new Date(log.created_at).toLocaleTimeString(),
              level: log.level,
              message: log.message,
              details: log.details,
            }));

            setLogs((prev) => [...prev, ...formattedLogs]);

            // Update last log ID
            const maxId = Math.max(...newLogs.map((log: any) => log.id));
            lastLogIdRef.current = maxId;
          }
        }
      }

      // Process status
      if (statusResponse && statusResponse.ok) {
        const statusResult = await statusResponse.json();
        if (statusResult.success && statusResult.data) {
          const status = statusResult.data;
          setCurrentStage(status.current_stage || '');

          // Check if generation is complete
          if (status.status === 'completed' || status.status === 'failed') {
            console.log('[Dashboard] Generation completed with status:', status.status);
            setIsGenerating(false);
            setCurrentStage('');
            stopPolling();

            // Refresh ideas list
            fetchRecentIdeas();

            if (status.status === 'completed') {
              addLog('info', 'Generation completed successfully!');
            } else if (status.status === 'failed') {
              addLog('error', 'Generation failed');
            }
          }
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error polling logs/status:', error);
    }
  };

  const fetchRecentIdeas = async () => {
    try {
      const response = await api.getIdeas({
        sortBy: 'created',
        sortOrder: 'desc',
        limit: 5,
      });
      setIdeas(response.ideas);
    } catch (error: any) {
      addLog('error', `Failed to fetch ideas: ${error.message}`);
    }
  };

  const addLog = (
    level: 'info' | 'warning' | 'error',
    message: string,
    details?: any
  ) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleGenerationStart = (sessionId?: string) => {
    // Generate a session ID for this generation if not provided
    const finalSessionId = sessionId || `manual-${Date.now()}`;

    setIsGenerating(true);
    // Don't clear logs - keep history
    addLog('info', '--- Starting new idea generation ---');

    // Start polling for logs
    startPolling(finalSessionId);

    return finalSessionId;
  };

  const handleGenerationComplete = (idea: Idea) => {
    // Note: Generation state will be updated by SSE 'complete' event
    setIdeas((prev) => [idea, ...prev.slice(0, 4)]);
  };

  const handleError = (error: string) => {
    addLog('error', error);
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Stats Row - Compact metric cards at top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">Recent Ideas</span>
            <span className="text-xl font-bold text-mint">{ideas.length}</span>
          </div>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">High Score (65+)</span>
            <span className="text-xl font-bold text-success">{ideas.filter((i) => i.score >= 65).length}</span>
          </div>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">Domains</span>
            <span className="text-xl font-bold text-warning">{new Set(ideas.map((i) => i.domain)).size}</span>
          </div>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">Errors</span>
            <span className="text-xl font-bold text-error">{logs.filter((l) => l.level === 'error').length}</span>
          </div>
        </div>
      </div>

      {/* Generation Status - Compact inline indicator */}
      <div className="mb-4 bg-surface rounded-md border border-border-subtle p-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-success animate-pulse' : 'bg-text-muted'}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">
                {isGenerating ? 'Generation in Progress' : 'Idle'}
              </span>
              {currentStage && (
                <span className="text-xs text-text-secondary truncate">
                  — {currentStage}
                </span>
              )}
            </div>
          </div>
          {isGenerating && (
            <div className="w-4 h-4 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1">
          <GenerationControls
            onGenerationStart={handleGenerationStart}
            onGenerationComplete={handleGenerationComplete}
            onError={handleError}
            disabled={isGenerating}
          />
        </div>

        {/* Right Column - Logs */}
        <div className="lg:col-span-2">
          <LogsViewer logs={logs} />
        </div>
      </div>
    </div>
  );
}
