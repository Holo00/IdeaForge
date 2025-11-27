import { IdeaRepository } from '../repositories/ideaRepository';
import {
  Idea,
  CreateIdeaRequest,
  UpdateIdeaRequest,
  GetIdeasQuery,
  IdeaHistory,
  IdeaScores,
  EvaluationDetails,
} from '../types';
import { ConflictError, ValidationError } from '../lib/errors';
import { ConfigService } from './configService';

export interface IIdeaService {
  createIdea(request: CreateIdeaRequest): Promise<Idea>;
  getIdea(id: string): Promise<Idea | null>;
  getIdeas(query: GetIdeasQuery): Promise<{ ideas: Idea[]; total: number }>;
  updateIdea(id: string, request: UpdateIdeaRequest): Promise<Idea>;
  deleteIdea(id: string): Promise<void>;
  getIdeaHistory(id: string): Promise<IdeaHistory[]>;
}

export class IdeaService implements IIdeaService {
  constructor(
    private ideaRepository: IdeaRepository,
    private configService?: ConfigService
  ) {}

  async createIdea(request: CreateIdeaRequest): Promise<Idea> {
    // For now, we'll implement manual idea creation
    // Idea generation via Claude API will be implemented later
    throw new ValidationError(
      'Manual idea creation not yet implemented. Use generate endpoint instead.'
    );
  }

  async getIdea(id: string): Promise<Idea | null> {
    return this.ideaRepository.findById(id);
  }

  async getIdeas(query: GetIdeasQuery): Promise<{ ideas: Idea[]; total: number }> {
    return this.ideaRepository.findAll(query);
  }

  async updateIdea(id: string, request: UpdateIdeaRequest): Promise<Idea> {
    const existing = await this.ideaRepository.findById(id);
    if (!existing) {
      throw new ValidationError('Idea not found');
    }

    const updates: Partial<Idea> = {};

    if (request.name !== undefined) {
      updates.name = request.name;
    }

    if (request.status !== undefined) {
      updates.status = request.status;

      // Track status change in history
      await this.ideaRepository.addHistory(
        id,
        'status_changed',
        `Status changed from ${existing.status} to ${request.status}`,
        { status: existing.status },
        { status: request.status }
      );
    }

    if (request.scores !== undefined) {
      updates.scores = { ...existing.scores, ...request.scores } as IdeaScores;
      // Recalculate total score
      updates.score = await this.calculateTotalScore(updates.scores);
    }

    if (request.evaluationDetails !== undefined) {
      updates.evaluationDetails = {
        ...existing.evaluationDetails,
        ...request.evaluationDetails,
      } as EvaluationDetails;
    }

    if (request.concreteExample !== undefined) {
      updates.concreteExample = {
        ...existing.concreteExample,
        ...request.concreteExample,
      };
    }

    if (request.tags !== undefined) {
      updates.tags = request.tags;
    }

    const updated = await this.ideaRepository.update(id, updates);

    // Track general update in history
    await this.ideaRepository.addHistory(
      id,
      'updated',
      'Idea details updated',
      existing,
      updated
    );

    return updated;
  }

  async deleteIdea(id: string): Promise<void> {
    const existing = await this.ideaRepository.findById(id);
    if (!existing) {
      throw new ValidationError('Idea not found');
    }

    await this.ideaRepository.delete(id);
  }

  async getIdeaHistory(id: string): Promise<IdeaHistory[]> {
    return this.ideaRepository.getHistory(id);
  }

  private async getWeightsFromConfig(): Promise<Record<string, number>> {
    if (!this.configService) {
      // Fallback to hardcoded weights if no config service
      return {
        problemSeverity: 2,
        marketSize: 1.5,
        competition: 1,
        monetization: 2,
        technicalFeasibility: 1,
        personalInterest: 1,
        unfairAdvantage: 2,
        timeToMarket: 1,
        scalabilityPotential: 1,
        networkEffects: 1,
      };
    }

    try {
      const criteria = await this.configService.getEvaluationCriteria();
      const weights: Record<string, number> = {};

      if (criteria?.draft_phase_criteria) {
        for (const criterion of criteria.draft_phase_criteria) {
          // Convert criterion name to camelCase
          const key = this.toCamelCase(criterion.name);
          weights[key] = criterion.weight || 1;
        }
      }

      return Object.keys(weights).length > 0 ? weights : this.getDefaultWeights();
    } catch (error) {
      console.error('Error loading weights from config:', error);
      return this.getDefaultWeights();
    }
  }

  private toCamelCase(name: string): string {
    return name
      .split(' ')
      .map((word, index) => {
        if (index === 0) {
          return word.toLowerCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join('');
  }

  private getDefaultWeights(): Record<string, number> {
    return {
      problemSeverity: 2,
      marketSize: 1.5,
      competition: 1,
      monetization: 2,
      technicalFeasibility: 1,
      personalInterest: 1,
      unfairAdvantage: 2,
      timeToMarket: 1,
      scalabilityPotential: 1,
      networkEffects: 1,
    };
  }

  private async calculateTotalScore(scores: any): Promise<number> {
    // Load weights dynamically from config
    const weights = await this.getWeightsFromConfig();

    let total = 0;
    let weightSum = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (scores[key] !== undefined) {
        total += scores[key] * weight;
        weightSum += weight * 10; // Max score is 10 for each criterion
      }
    }

    if (weightSum === 0) {
      return 0;
    }

    // Normalize to 0-100 scale
    return Math.round((total / weightSum) * 100);
  }
}
