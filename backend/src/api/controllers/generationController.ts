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
});

// Global mutex to prevent concurrent idea generation
let isGenerating = false;

export class GenerationController {
  constructor(private generationService: IdeaGenerationService) {}

  /**
   * Get generation status
   */
  getGenerationStatus(req: Request, res: Response): any {
    return res.json({
      success: true,
      data: {
        isGenerating,
      },
    });
  }

  async generateIdea(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      // Check if generation is already in progress
      if (isGenerating) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Idea generation already in progress. Please wait for the current generation to complete.',
            code: 'GENERATION_IN_PROGRESS'
          }
        });
      }

      const options = GenerateIdeaSchema.parse(req.body);

      // Set mutex
      isGenerating = true;
      console.log('[Generation] Starting manual idea generation...');

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
              timestamp: new Date().toISOString(),
            },
          },
        };

        console.log('[Generation] Manual idea generation completed successfully');
        res.status(201).json(response);
      } finally {
        // Always release mutex, even if generation fails
        isGenerating = false;
        console.log('[Generation] Mutex released');
      }
    } catch (error) {
      // Ensure mutex is released on validation errors too
      isGenerating = false;
      next(error);
    }
  }
}
