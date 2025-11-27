import { Request, Response, NextFunction } from 'express';
import { IdeaService } from '../../services/ideaService';
import { ApiResponse, GetIdeasQuery, UpdateIdeaRequest } from '../../types';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '../../lib/errors';

// Zod schemas for validation
const GetIdeasQuerySchema = z.object({
  // Basic filters
  status: z.enum(['draft', 'validation', 'research', 'build', 'archived']).optional(),
  domain: z.string().optional(),
  subdomain: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  // Sorting & pagination
  sortBy: z.enum(['score', 'created', 'updated', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  // Advanced filters
  search: z.string().optional(),
  framework: z.string().optional(),
  monetization: z.string().optional(),
  targetAudience: z.string().optional(),
  technology: z.string().optional(),
  maxTeamSize: z.coerce.number().min(1).max(100).optional(),
  // Criteria score filters (passed as JSON string, parsed below)
  minCriteriaScores: z.string().optional(),
});

const UpdateIdeaSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  status: z.enum(['draft', 'validation', 'research', 'build', 'archived']).optional(),
  scores: z
    .object({
      problemSeverity: z.number().min(1).max(10).optional(),
      marketSize: z.number().min(1).max(10).optional(),
      competition: z.number().min(1).max(10).optional(),
      monetization: z.number().min(1).max(10).optional(),
      technicalFeasibility: z.number().min(1).max(10).optional(),
      personalInterest: z.number().min(1).max(10).optional(),
      unfairAdvantage: z.number().min(1).max(10).optional(),
      timeToMarket: z.number().min(1).max(10).optional(),
    })
    .optional(),
  evaluationDetails: z.any().optional(),
  concreteExample: z
    .object({
      currentState: z.string().optional(),
      yourSolution: z.string().optional(),
      keyImprovement: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
});

export class IdeasController {
  constructor(private ideaService: IdeaService) {}

  async getIdeas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Parse and validate query parameters
      const parsed = GetIdeasQuerySchema.parse({
        ...req.query,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      });

      // Parse minCriteriaScores from JSON string to object
      const query: GetIdeasQuery = {
        ...parsed,
        minCriteriaScores: parsed.minCriteriaScores
          ? JSON.parse(parsed.minCriteriaScores)
          : undefined,
      };

      const result = await this.ideaService.getIdeas(query);

      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const idea = await this.ideaService.getIdea(id);

      if (!idea) {
        throw new NotFoundError('Idea', id);
      }

      const response: ApiResponse<typeof idea> = {
        success: true,
        data: idea,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = UpdateIdeaSchema.parse(req.body);

      const idea = await this.ideaService.updateIdea(id, updates);

      const response: ApiResponse<typeof idea> = {
        success: true,
        data: idea,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async deleteIdea(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await this.ideaService.deleteIdea(id);

      const response: ApiResponse<{ deleted: boolean }> = {
        success: true,
        data: { deleted: true },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getIdeaHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const history = await this.ideaService.getIdeaHistory(id);

      const response: ApiResponse<typeof history> = {
        success: true,
        data: history,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
