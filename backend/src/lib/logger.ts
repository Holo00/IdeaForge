import { pool } from './db';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum GenerationStage {
  INIT = 'initialization',
  CONFIG_LOAD = 'config_load',
  PROMPT_BUILD = 'prompt_build',
  API_CALL = 'api_call',
  RESPONSE_PARSE = 'response_parse',
  DUPLICATE_CHECK = 'duplicate_check',
  DB_SAVE = 'database_save',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export interface GenerationLog {
  id: string;
  sessionId: string;
  stage: GenerationStage;
  level: LogLevel;
  message: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
  error?: string;
}

export class GenerationLogger {
  private logs: GenerationLog[] = [];
  private sessionId: string;
  private startTime: Date;
  private stageStartTime: Date;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = new Date();
    this.stageStartTime = new Date();

    // Initialize generation status in database
    this.initializeStatus().catch(err => {
      console.error('Failed to initialize generation status:', err);
    });
  }

  private async initializeStatus(): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO generation_status (session_id, status, current_stage, started_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (session_id) DO UPDATE
         SET status = $2, current_stage = $3, updated_at = NOW()`,
        [this.sessionId, 'in_progress', GenerationStage.INIT]
      );
    } catch (error) {
      console.error('Error initializing generation status:', error);
    }
  }

  private async saveLogToDatabase(log: GenerationLog): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO idea_generation_logs (session_id, stage, level, message, details, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          log.sessionId,
          log.stage,
          log.level,
          log.message,
          log.metadata ? JSON.stringify(log.metadata) : null,
          log.timestamp
        ]
      );

      // Update generation status
      await pool.query(
        `UPDATE generation_status
         SET current_stage = $1, updated_at = NOW()
         WHERE session_id = $2`,
        [log.stage, log.sessionId]
      );
    } catch (error) {
      console.error('Error saving log to database:', error);
    }
  }

  async updateStatus(status: 'in_progress' | 'completed' | 'failed', errorMessage?: string, ideaId?: string): Promise<void> {
    try {
      if (status === 'completed') {
        await pool.query(
          `UPDATE generation_status
           SET status = $1, completed_at = NOW(), updated_at = NOW(), idea_id = $2
           WHERE session_id = $3`,
          [status, ideaId || null, this.sessionId]
        );
      } else if (status === 'failed') {
        await pool.query(
          `UPDATE generation_status
           SET status = $1, error_message = $2, updated_at = NOW()
           WHERE session_id = $3`,
          [status, errorMessage || null, this.sessionId]
        );
      } else {
        await pool.query(
          `UPDATE generation_status
           SET status = $1, updated_at = NOW()
           WHERE session_id = $2`,
          [status, this.sessionId]
        );
      }
    } catch (error) {
      console.error('Error updating generation status:', error);
    }
  }

  log(
    stage: GenerationStage,
    level: LogLevel,
    message: string,
    metadata?: any
  ): void {
    const now = new Date();
    const duration = now.getTime() - this.stageStartTime.getTime();

    const log: GenerationLog = {
      id: `${this.sessionId}-${this.logs.length}`,
      sessionId: this.sessionId,
      stage,
      level,
      message,
      timestamp: now,
      duration,
      metadata,
    };

    this.logs.push(log);

    // Save to database asynchronously
    this.saveLogToDatabase(log).catch(err => {
      console.error('Failed to save log to database:', err);
    });

    // Console output with formatting
    const emoji = this.getLevelEmoji(level);
    const timestamp = now.toLocaleTimeString();
    console.log(
      `[${timestamp}] ${emoji} [${stage.toUpperCase()}] ${message}`,
      metadata ? metadata : ''
    );

    // Reset stage timer for next stage
    this.stageStartTime = now;
  }

  error(stage: GenerationStage, message: string, error: Error): void {
    const now = new Date();
    const duration = now.getTime() - this.stageStartTime.getTime();

    const log: GenerationLog = {
      id: `${this.sessionId}-${this.logs.length}`,
      sessionId: this.sessionId,
      stage,
      level: LogLevel.ERROR,
      message,
      timestamp: now,
      duration,
      error: error.message,
      metadata: {
        stack: error.stack,
        name: error.name,
      },
    };

    this.logs.push(log);

    // Save to database asynchronously
    this.saveLogToDatabase(log).catch(err => {
      console.error('Failed to save log to database:', err);
    });

    // Update status to failed
    this.updateStatus('failed', error.message).catch(err => {
      console.error('Failed to update generation status:', err);
    });

    console.error(
      `[${now.toLocaleTimeString()}] ❌ [${stage.toUpperCase()}] ${message}`,
      error
    );
  }

  success(stage: GenerationStage, message: string, metadata?: any): void {
    this.log(stage, LogLevel.SUCCESS, message, metadata);
  }

  info(stage: GenerationStage, message: string, metadata?: any): void {
    this.log(stage, LogLevel.INFO, message, metadata);
  }

  warning(stage: GenerationStage, message: string, metadata?: any): void {
    this.log(stage, LogLevel.WARNING, message, metadata);
  }

  debug(stage: GenerationStage, message: string, metadata?: any): void {
    this.log(stage, LogLevel.DEBUG, message, metadata);
  }

  getLogs(): GenerationLog[] {
    return this.logs;
  }

  getSummary(): {
    sessionId: string;
    totalDuration: number;
    stages: Record<GenerationStage, number>;
    success: boolean;
    errorCount: number;
    warningCount: number;
  } {
    const now = new Date();
    const totalDuration = now.getTime() - this.startTime.getTime();

    const stages: Record<string, number> = {};
    let errorCount = 0;
    let warningCount = 0;

    this.logs.forEach((log) => {
      if (!stages[log.stage]) {
        stages[log.stage] = 0;
      }
      stages[log.stage] += log.duration || 0;

      if (log.level === LogLevel.ERROR) errorCount++;
      if (log.level === LogLevel.WARNING) warningCount++;
    });

    const lastLog = this.logs[this.logs.length - 1];
    const success =
      lastLog?.stage === GenerationStage.COMPLETE &&
      lastLog?.level === LogLevel.SUCCESS;

    return {
      sessionId: this.sessionId,
      totalDuration,
      stages: stages as Record<GenerationStage, number>,
      success,
      errorCount,
      warningCount,
    };
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.SUCCESS:
        return '✅';
      case LogLevel.ERROR:
        return '❌';
      case LogLevel.WARNING:
        return '⚠️';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.DEBUG:
        return '🔍';
      default:
        return '📝';
    }
  }
}
