import { Request, Response, NextFunction } from 'express';
import { IdeaGenerationService } from '../../services/ideaGenerationService';
import { ApiResponse } from '../../types';
import { z } from 'zod';

// Zod schemas for validation
const GenerateIdeaSchema = z.object({
  framework: z.string().optional(),
  template: z.string().optional(), // deprecated but supported for backward compatibility
  domain: z.string().optional(),
  skipDuplicateCheck: z.boolean().optional(),
  sessionId: z.string().optional(),
  profileId: z.string().optional(), // Override active profile with specific profile
  slotNumber: z.number().int().min(1).max(10).optional(), // Links to dashboard slot
});

// Track active generations by sessionId (allows concurrent generations)
const activeGenerations = new Set<string>();

export class GenerationController {
  constructor(private generationService: IdeaGenerationService) {}

  /**
   * Get generation status
   */
  getGenerationStatus(req: Request, res: Response): any {
    return res.json({
      success: true,
      data: {
        isGenerating: activeGenerations.size > 0,
        activeCount: activeGenerations.size,
        activeSessions: Array.from(activeGenerations),
      },
    });
  }

  async generateIdea(req: Request, res: Response, next: NextFunction): Promise<any> {
    const sessionId = req.body.sessionId || `gen-${Date.now()}`;

    try {
      const options = GenerateIdeaSchema.parse(req.body);

      // Track this generation
      activeGenerations.add(sessionId);
      console.log(`[Generation] Starting idea generation for session ${sessionId}...`);

      try {
        const result = await this.generationService.generateIdea(options);

        const framework = options.framework || options.template || 'random';

        const response: ApiResponse<{
          idea: typeof result.idea;
          logs: typeof result.logs;
          summary: typeof result.summary;
          configuration: {
            framework: string;
            domain?: string;
            skipDuplicateCheck: boolean;
            profileId?: string;
            timestamp: string;
          };
        }> = {
          success: true,
          data: {
            idea: result.idea,
            logs: result.logs,
            summary: result.summary,
            configuration: {
              framework: framework,
              domain: options.domain,
              skipDuplicateCheck: options.skipDuplicateCheck || false,
              profileId: options.profileId,
              timestamp: new Date().toISOString(),
            },
          },
        };

        console.log(`[Generation] Idea generation completed for session ${sessionId}`);
        res.status(201).json(response);
      } finally {
        // Remove from active generations
        activeGenerations.delete(sessionId);
        console.log(`[Generation] Session ${sessionId} removed from active generations`);
      }
    } catch (error) {
      // Ensure session is removed on errors too
      activeGenerations.delete(sessionId);
      next(error);
    }
  }
}
