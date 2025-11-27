import { Router, Request, Response } from 'express';
import { pool } from '../../lib/db';

const router = Router();

/**
 * Get generation logs for a specific session
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT id, session_id, stage, level, message, details, created_at
       FROM idea_generation_logs
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch logs',
    });
  }
});

/**
 * Get generation status for a specific session
 */
router.get('/status/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT session_id, status, current_stage, started_at, updated_at, completed_at, error_message, idea_id
       FROM generation_status
       WHERE session_id = $1`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Generation session not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
    });
  }
});

/**
 * Get current active generation status (if any)
 */
router.get('/active', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT session_id, status, current_stage, started_at, updated_at
       FROM generation_status
       WHERE status = 'in_progress'
       ORDER BY started_at DESC
       LIMIT 1`
    );

    res.json({
      success: true,
      data: result.rows.length > 0 ? result.rows[0] : null,
    });
  } catch (error: any) {
    console.error('Error fetching active status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active status',
    });
  }
});

/**
 * Server-Sent Events endpoint for real-time log streaming
 */
router.get('/stream/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial comment to establish connection
  res.write(': connected\n\n');

  // Track last log ID to avoid sending duplicates
  let lastLogId = 0;

  // Poll database every 500ms for new logs
  const pollInterval = setInterval(async () => {
    try {
      // Get new logs since last poll
      const logsResult = await pool.query(
        `SELECT id, session_id, stage, level, message, details, created_at
         FROM idea_generation_logs
         WHERE session_id = $1 AND id > $2
         ORDER BY created_at ASC`,
        [sessionId, lastLogId]
      );

      // Send each new log as an event
      for (const log of logsResult.rows) {
        const data = {
          id: log.id,
          sessionId: log.session_id,
          stage: log.stage,
          level: log.level,
          message: log.message,
          details: log.details,
          timestamp: log.created_at,
        };

        res.write(`event: log\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);

        lastLogId = log.id;
      }

      // Get current status
      const statusResult = await pool.query(
        `SELECT session_id, status, current_stage, error_message
         FROM generation_status
         WHERE session_id = $1`,
        [sessionId]
      );

      if (statusResult.rows.length > 0) {
        const status = statusResult.rows[0];

        res.write(`event: status\n`);
        res.write(`data: ${JSON.stringify(status)}\n\n`);

        // Close connection if generation is complete or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
          res.write(`event: complete\n`);
          res.write(`data: ${JSON.stringify({ status: status.status })}\n\n`);
          res.end();
        }
      }
    } catch (error) {
      console.error('Error polling logs:', error);
      clearInterval(pollInterval);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: 'Polling error' })}\n\n`);
      res.end();
    }
  }, 500); // Poll every 500ms

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(pollInterval);
    res.end();
  });
});

export default router;
