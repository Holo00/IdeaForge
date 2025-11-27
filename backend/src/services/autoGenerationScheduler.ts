import { pool } from '../lib/db';
import { IdeaGenerationService } from './ideaGenerationService';
import { IdeaRepository } from '../repositories/ideaRepository';
import { ConfigService } from './configService';
import { GenerationStage, LogLevel } from '../lib/logger';

interface SlotDueForGeneration {
  slot_number: number;
  profile_id: string | null;
  auto_generate_interval_minutes: number;
}

interface SlotCountdownInfo {
  slot_number: number;
  next_auto_generate_at: Date;
  auto_generate_interval_minutes: number;
}

/**
 * Auto-generation scheduler that periodically checks for and executes
 * scheduled idea generations.
 */
export class AutoGenerationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private countdownIntervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private checkIntervalMs = 30000; // Check every 30 seconds
  private countdownIntervalMs = 60000; // Log countdown every 60 seconds
  private generationService: IdeaGenerationService;
  private lastCountdownMinutes: Map<number, number> = new Map(); // Track last logged minute per slot

  constructor() {
    const ideaRepository = new IdeaRepository();
    const configService = new ConfigService();
    this.generationService = new IdeaGenerationService(ideaRepository, configService);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.log('[AutoGenerationScheduler] Already running');
      return;
    }

    console.log('[AutoGenerationScheduler] Starting scheduler (checking every 30s, countdown logs every 60s)');
    this.intervalId = setInterval(() => this.checkAndGenerate(), this.checkIntervalMs);
    this.countdownIntervalId = setInterval(() => this.logCountdowns(), this.countdownIntervalMs);

    // Run initial checks
    this.checkAndGenerate();
    this.logCountdowns();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.lastCountdownMinutes.clear();
    console.log('[AutoGenerationScheduler] Stopped');
  }

  /**
   * Check for slots due for generation and trigger them
   */
  private async checkAndGenerate(): Promise<void> {
    // Prevent overlapping runs
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      // Find slots that are due for auto-generation
      const dueSlots = await this.getSlotsDueForGeneration();

      if (dueSlots.length === 0) {
        return;
      }

      console.log(`[AutoGenerationScheduler] Found ${dueSlots.length} slot(s) due for generation`);

      // Process each slot (could run in parallel but keeping sequential for simplicity)
      for (const slot of dueSlots) {
        await this.generateForSlot(slot);
      }
    } catch (error) {
      console.error('[AutoGenerationScheduler] Error during check:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get slots that are enabled for auto-generation and are due
   */
  private async getSlotsDueForGeneration(): Promise<SlotDueForGeneration[]> {
    const result = await pool.query(`
      SELECT
        gs.slot_number,
        gs.profile_id,
        gs.auto_generate_interval_minutes
      FROM generation_slots gs
      WHERE gs.auto_generate = true
        AND gs.is_enabled = true
        AND gs.next_auto_generate_at IS NOT NULL
        AND gs.next_auto_generate_at <= NOW()
      ORDER BY gs.next_auto_generate_at ASC
    `);

    return result.rows;
  }

  /**
   * Log countdown messages for all active auto-generation slots
   */
  private async logCountdowns(): Promise<void> {
    try {
      // Get all slots with auto-generation enabled and a scheduled time
      const result = await pool.query(`
        SELECT
          gs.slot_number,
          gs.next_auto_generate_at,
          gs.auto_generate_interval_minutes
        FROM generation_slots gs
        WHERE gs.auto_generate = true
          AND gs.is_enabled = true
          AND gs.next_auto_generate_at IS NOT NULL
          AND gs.next_auto_generate_at > NOW()
        ORDER BY gs.slot_number ASC
      `);

      const slots: SlotCountdownInfo[] = result.rows;

      for (const slot of slots) {
        await this.logSlotCountdown(slot);
      }
    } catch (error) {
      console.error('[AutoGenerationScheduler] Error logging countdowns:', error);
    }
  }

  /**
   * Log countdown for a specific slot
   */
  private async logSlotCountdown(slot: SlotCountdownInfo): Promise<void> {
    const { slot_number, next_auto_generate_at } = slot;
    const now = new Date();
    const nextTime = new Date(next_auto_generate_at);
    const diffMs = nextTime.getTime() - now.getTime();
    const minutesRemaining = Math.ceil(diffMs / 60000);

    // Skip if less than 1 minute (will trigger soon)
    if (minutesRemaining < 1) {
      return;
    }

    // Skip if we already logged this minute for this slot
    const lastLogged = this.lastCountdownMinutes.get(slot_number);
    if (lastLogged === minutesRemaining) {
      return;
    }

    // Update tracking
    this.lastCountdownMinutes.set(slot_number, minutesRemaining);

    // Create session ID for this slot's countdown logs
    const sessionId = `countdown-slot-${slot_number}`;

    // Format the message
    const message = minutesRemaining === 1
      ? `Next auto-generation in 1 minute`
      : `Next auto-generation in ${minutesRemaining} minutes`;

    // Log to console
    console.log(`[AutoGenerationScheduler] Slot ${slot_number}: ${message}`);

    // Save to database so it appears in the UI
    try {
      await pool.query(
        `INSERT INTO idea_generation_logs (session_id, stage, level, message, details, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          sessionId,
          GenerationStage.WAITING,
          LogLevel.INFO,
          message,
          JSON.stringify({ slot_number, minutes_remaining: minutesRemaining, next_at: next_auto_generate_at })
        ]
      );

      // Also ensure there's a generation_status entry for this countdown session
      await pool.query(
        `INSERT INTO generation_status (session_id, status, current_stage, slot_number, started_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (session_id) DO UPDATE
         SET current_stage = $3, updated_at = NOW()`,
        [sessionId, 'waiting', GenerationStage.WAITING, slot_number]
      );
    } catch (error) {
      console.error(`[AutoGenerationScheduler] Failed to save countdown log for slot ${slot_number}:`, error);
    }
  }

  /**
   * Generate an idea for a specific slot
   */
  private async generateForSlot(slot: SlotDueForGeneration): Promise<void> {
    const { slot_number, profile_id, auto_generate_interval_minutes } = slot;
    const sessionId = `auto-slot-${slot_number}-${Date.now()}`;

    console.log(`[AutoGenerationScheduler] Starting auto-generation for slot ${slot_number}`);

    try {
      // Check if there's already an in-progress generation for this slot
      const activeCheck = await pool.query(
        `SELECT session_id FROM generation_status
         WHERE slot_number = $1 AND status = 'in_progress'
         LIMIT 1`,
        [slot_number]
      );

      if (activeCheck.rows.length > 0) {
        console.log(`[AutoGenerationScheduler] Slot ${slot_number} has active generation, skipping`);
        return;
      }

      // Update next_auto_generate_at BEFORE starting to prevent concurrent triggers
      await pool.query(
        `UPDATE generation_slots
         SET next_auto_generate_at = NOW() + INTERVAL '${auto_generate_interval_minutes} minutes',
             updated_at = NOW()
         WHERE slot_number = $1`,
        [slot_number]
      );

      // Trigger the generation
      const result = await this.generationService.generateIdea({
        sessionId,
        profileId: profile_id || undefined,
        slotNumber: slot_number,
      });

      // Update last_auto_generate_at on success
      await pool.query(
        `UPDATE generation_slots
         SET last_auto_generate_at = NOW(),
             updated_at = NOW()
         WHERE slot_number = $1`,
        [slot_number]
      );

      console.log(
        `[AutoGenerationScheduler] Slot ${slot_number} generated idea: ${result.idea.name} (score: ${result.idea.score})`
      );
    } catch (error: any) {
      console.error(
        `[AutoGenerationScheduler] Slot ${slot_number} generation failed:`,
        error.message
      );

      // Still update next_auto_generate_at so we don't keep retrying immediately
      // The next scheduled time was already set before the generation attempt
    }
  }
}

// Singleton instance
let schedulerInstance: AutoGenerationScheduler | null = null;

/**
 * Get or create the scheduler instance
 */
export function getAutoGenerationScheduler(): AutoGenerationScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AutoGenerationScheduler();
  }
  return schedulerInstance;
}

/**
 * Start the auto-generation scheduler
 */
export function startAutoGenerationScheduler(): void {
  const scheduler = getAutoGenerationScheduler();
  scheduler.start();
}

/**
 * Stop the auto-generation scheduler
 */
export function stopAutoGenerationScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.stop();
  }
}
