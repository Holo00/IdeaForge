'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import LogsViewer from './LogsViewer';
import { Idea, LogEntry } from '@/types';

interface GenerationSlotProps {
  slotId: number;
  onIdeaGenerated?: (idea: Idea) => void;
}

export default function GenerationSlot({
  slotId,
  onIdeaGenerated,
}: GenerationSlotProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [lastGeneration, setLastGeneration] = useState<string | null>(null);
  const [isLoadingSlot, setIsLoadingSlot] = useState(true);

  // Auto-generation state
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [autoGenerateInterval, setAutoGenerateInterval] = useState(60);
  const [nextAutoGenerateAt, setNextAutoGenerateAt] = useState<string | null>(null);
  const [isUpdatingAutoGenerate, setIsUpdatingAutoGenerate] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentSessionIdRef = useRef<string | null>(null);
  const lastLogIdRef = useRef<number>(0);
  const countdownPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountdownLogIdRef = useRef<number>(0);

  // Fetch profiles and slot configuration on mount
  useEffect(() => {
    loadSlotData();
    return () => {
      stopPolling();
      stopCountdownPolling();
    };
  }, [slotId]);

  // Poll for countdown logs when auto-generate is enabled and not generating
  useEffect(() => {
    if (autoGenerate && !isGenerating) {
      startCountdownPolling();
    } else {
      stopCountdownPolling();
    }

    return () => {
      stopCountdownPolling();
    };
  }, [autoGenerate, isGenerating]);

  const stopCountdownPolling = () => {
    if (countdownPollIntervalRef.current) {
      clearInterval(countdownPollIntervalRef.current);
      countdownPollIntervalRef.current = null;
    }
  };

  const startCountdownPolling = () => {
    stopCountdownPolling();
    lastCountdownLogIdRef.current = 0;

    // Poll every 30 seconds for countdown updates
    countdownPollIntervalRef.current = setInterval(async () => {
      await pollCountdownLogs();
    }, 30000);

    // Initial poll
    pollCountdownLogs();
  };

  const pollCountdownLogs = async () => {
    const countdownSessionId = `countdown-slot-${slotId}`;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${apiUrl}/logs/session/${countdownSessionId}`, { headers });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Only show logs newer than our last seen
          const newLogs = result.data.filter((log: any) => log.id > lastCountdownLogIdRef.current);

          if (newLogs.length > 0) {
            // Get the most recent countdown log
            const latestLog = newLogs[newLogs.length - 1];
            const formattedLog: LogEntry = {
              id: `countdown-${latestLog.id}`,
              timestamp: new Date(latestLog.created_at).toLocaleTimeString(),
              level: 'info',
              message: `⏱️ ${latestLog.message}`,
              details: latestLog.details,
            };

            // Replace any existing countdown log or add new
            setLogs((prev) => {
              const withoutCountdown = prev.filter((l) => !l.id.startsWith('countdown-'));
              return [...withoutCountdown, formattedLog];
            });

            const maxId = Math.max(...result.data.map((log: any) => log.id));
            lastCountdownLogIdRef.current = maxId;
          }
        }
      }
    } catch (error) {
      console.error(`[Slot ${slotId}] Error polling countdown logs:`, error);
    }
  };

  const loadSlotData = async () => {
    setIsLoadingSlot(true);
    try {
      // Fetch profiles, slot config, and check for active session in parallel
      const [allProfiles, slotConfig, activeSession] = await Promise.all([
        api.getConfigProfiles(),
        api.getGenerationSlot(slotId).catch(() => null),
        api.getSlotActiveSession(slotId).catch(() => null),
      ]);

      setProfiles(allProfiles);

      // Use slot's saved profile, or fall back to active profile
      if (slotConfig?.profile_id) {
        setSelectedProfileId(slotConfig.profile_id);
      } else {
        const active = allProfiles.find((p: any) => p.is_active);
        if (active) {
          setSelectedProfileId(active.id);
        }
      }

      // Load auto-generation settings
      if (slotConfig) {
        setAutoGenerate(slotConfig.auto_generate || false);
        setAutoGenerateInterval(slotConfig.auto_generate_interval_minutes || 60);
        setNextAutoGenerateAt(slotConfig.next_auto_generate_at || null);
      }

      // Resume polling if there's an active generation for this slot
      if (activeSession && activeSession.status === 'in_progress') {
        setIsGenerating(true);
        setIsCollapsed(false); // Auto-expand to show logs
        // Load existing logs and resume polling
        startPolling(activeSession.session_id, true);
      }
    } catch (error) {
      console.error('Failed to load slot data:', error);
    } finally {
      setIsLoadingSlot(false);
    }
  };

  const handleProfileChange = async (newProfileId: string) => {
    setSelectedProfileId(newProfileId);

    // Save to backend
    try {
      await api.updateGenerationSlot(slotId, { profile_id: newProfileId });
    } catch (error) {
      console.error('Failed to save slot profile:', error);
      // Could add toast notification here
    }
  };

  const handleAutoGenerateToggle = async () => {
    // Cannot toggle on if generating
    if (isGenerating && !autoGenerate) {
      return;
    }

    const newValue = !autoGenerate;
    setIsUpdatingAutoGenerate(true);

    try {
      const result = await api.updateGenerationSlot(slotId, {
        auto_generate: newValue,
        auto_generate_interval_minutes: autoGenerateInterval,
      });
      setAutoGenerate(newValue);
      setNextAutoGenerateAt(result.next_auto_generate_at || null);
    } catch (error) {
      console.error('Failed to update auto-generation:', error);
    } finally {
      setIsUpdatingAutoGenerate(false);
    }
  };

  const handleIntervalChange = async (newInterval: number) => {
    if (newInterval < 1 || newInterval > 1440) return;

    setAutoGenerateInterval(newInterval);

    // Always save to database
    try {
      const result = await api.updateGenerationSlot(slotId, {
        auto_generate_interval_minutes: newInterval,
      });
      if (result.next_auto_generate_at) {
        setNextAutoGenerateAt(result.next_auto_generate_at);
      }
    } catch (error) {
      console.error('Failed to update interval:', error);
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    currentSessionIdRef.current = null;
    lastLogIdRef.current = 0;
  };

  const startPolling = (sessionId: string, loadExistingLogs = false) => {
    stopPolling();
    currentSessionIdRef.current = sessionId;
    lastLogIdRef.current = 0;

    // If resuming, load all existing logs first
    if (loadExistingLogs) {
      loadExistingLogsForSession(sessionId);
    }

    pollIntervalRef.current = setInterval(async () => {
      await pollLogsAndStatus();
    }, 3000);

    pollLogsAndStatus();
  };

  const loadExistingLogsForSession = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${apiUrl}/logs/session/${sessionId}`, { headers });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const formattedLogs: LogEntry[] = result.data.map((log: any) => ({
            id: log.id.toString(),
            timestamp: new Date(log.created_at).toLocaleTimeString(),
            level: log.level,
            message: log.message,
            details: log.details,
          }));

          setLogs(formattedLogs);
          const maxId = Math.max(...result.data.map((log: any) => log.id));
          lastLogIdRef.current = maxId;
        }
      }
    } catch (error) {
      console.error('Failed to load existing logs:', error);
    }
  };

  const pollLogsAndStatus = async () => {
    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const fetchWithTimeout = (url: string) => {
        return Promise.race([
          fetch(url, { headers }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Fetch timeout')), 5000)
          ),
        ]);
      };

      const [logsResponse, statusResponse] = await Promise.all([
        fetchWithTimeout(`${apiUrl}/logs/session/${sessionId}`).catch(() => null),
        fetchWithTimeout(`${apiUrl}/logs/status/${sessionId}`).catch(() => null),
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

          if (status.status === 'completed' || status.status === 'failed') {
            setIsGenerating(false);
            stopPolling();

            if (status.status === 'completed') {
              addLog('info', 'Generation completed successfully!');
            } else if (status.status === 'failed') {
              addLog('error', 'Generation failed');
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Slot ${slotId}] Error polling logs/status:`, error);
    }
  };

  const addLog = (level: 'info' | 'warning' | 'error', message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleGenerate = async () => {
    const sessionId = `slot-${slotId}-${Date.now()}`;
    setIsGenerating(true);
    setIsCollapsed(false); // Auto-expand to show logs
    addLog('info', '--- Starting new idea generation ---');
    startPolling(sessionId);

    try {
      const result = await api.generateIdea({
        sessionId,
        profileId: selectedProfileId || undefined,
        slotNumber: slotId,
      });
      setLastGeneration(new Date().toLocaleString());
      onIdeaGenerated?.(result.idea);
    } catch (error: any) {
      addLog('error', error.message || 'Generation failed');
      setIsGenerating(false);
      stopPolling();
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  return (
    <div className="bg-surface rounded-md border border-border-subtle overflow-hidden">
      {/* Header - Always visible */}
      <div
        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-elevated/50 transition-colors ${
          isCollapsed ? '' : 'border-b border-border-subtle'
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          {/* Collapse chevron */}
          <svg
            className={`w-4 h-4 text-text-secondary transition-transform ${
              isCollapsed ? '' : 'rotate-90'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          {/* Slot number */}
          <span className="text-sm font-semibold text-text-primary">Slot {slotId}</span>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated">
            <div
              className={`h-2 w-2 rounded-full ${
                isGenerating ? 'bg-warning animate-pulse' : 'bg-text-muted'
              }`}
            />
            <span className="text-micro font-medium text-text-secondary">
              {isGenerating ? 'GENERATING' : 'IDLE'}
            </span>
          </div>

          {/* Auto-generate indicator */}
          {autoGenerate && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-mint/10 border border-mint/30">
              <svg className="w-3 h-3 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-micro font-medium text-mint">AUTO</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {/* Profile selector (mini) */}
          <select
            value={selectedProfileId || ''}
            onChange={(e) => handleProfileChange(e.target.value)}
            disabled={isGenerating || isLoadingSlot}
            className="text-xs border border-border-default bg-base text-text-primary rounded px-2 py-1 focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint disabled:opacity-50"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>

          {/* Generate button (compact) */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || isLoadingSlot || autoGenerate}
            title={autoGenerate ? 'Manual generation disabled while auto-generate is enabled' : ''}
            className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 ${
              isGenerating || isLoadingSlot || autoGenerate
                ? 'bg-elevated text-text-muted cursor-not-allowed'
                : 'bg-mint text-base hover:bg-mint-light'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Profile info */}
          {selectedProfile && (
            <div className="bg-info/5 border border-info/20 rounded p-2 text-xs">
              <span className="text-info font-medium">Config:</span>{' '}
              <span className="text-text-secondary">{selectedProfile.name}</span>
              {selectedProfile.description && (
                <span className="text-text-muted ml-2">- {selectedProfile.description}</span>
              )}
            </div>
          )}

          {/* Auto-generation controls */}
          <div className="bg-elevated/50 border border-border-subtle rounded p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Toggle switch */}
                <button
                  onClick={handleAutoGenerateToggle}
                  disabled={isUpdatingAutoGenerate || (isGenerating && !autoGenerate)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    autoGenerate ? 'bg-mint' : 'bg-elevated'
                  } ${(isUpdatingAutoGenerate || (isGenerating && !autoGenerate)) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={isGenerating && !autoGenerate ? 'Cannot enable while generation is in progress' : ''}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      autoGenerate ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs font-medium text-text-primary">Auto-generate</span>
                {isGenerating && !autoGenerate && (
                  <span className="text-micro text-warning">(disabled during manual generation)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Every</span>
                <div className="flex items-center border border-border-default rounded overflow-hidden">
                  <button
                    onClick={() => handleIntervalChange(Math.max(1, autoGenerateInterval - 1))}
                    disabled={isUpdatingAutoGenerate || autoGenerateInterval <= 1}
                    className="px-1.5 py-1 bg-elevated hover:bg-hover text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={autoGenerateInterval}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value, 10) || 60)}
                    disabled={isUpdatingAutoGenerate}
                    className="w-12 text-xs bg-base text-text-primary py-1 text-center focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleIntervalChange(Math.min(1440, autoGenerateInterval + 1))}
                    disabled={isUpdatingAutoGenerate || autoGenerateInterval >= 1440}
                    className="px-1.5 py-1 bg-elevated hover:bg-hover text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs text-text-secondary">min</span>
              </div>
            </div>

            {/* Next scheduled time */}
            {autoGenerate && nextAutoGenerateAt && (
              <div className="mt-2 text-micro text-text-muted">
                Next generation scheduled: {new Date(nextAutoGenerateAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Logs Viewer */}
          <LogsViewer logs={logs} />

          {/* Last generation info */}
          {lastGeneration && (
            <p className="text-center text-micro text-text-muted">
              Last generation: <span className="text-text-secondary">{lastGeneration}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
