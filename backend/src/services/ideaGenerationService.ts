import { randomUUID } from 'crypto';
import { callAI, isAIConfigured } from '../lib/aiProvider';
import { IdeaRepository } from '../repositories/ideaRepository';
import { ConfigService } from './configService';
import { PromptBuilder } from './promptBuilder';
import { EmbeddingService } from './embeddingService';
import { Idea, IdeaScores, ConcreteExample, EvaluationDetails, ComplexityScores } from '../types';
import { ExternalServiceError, ConflictError, ValidationError } from '../lib/errors';
import { GenerationLogger, GenerationStage, LogLevel } from '../lib/logger';

export interface GenerationOptions {
  framework?: string;
  /** @deprecated Use framework instead */
  template?: string;
  domain?: string;
  skipDuplicateCheck?: boolean;
  sessionId?: string;
}

export interface GenerationResult {
  idea: Idea;
  logs: any[];
  summary: any;
}

export interface GeneratedIdeaData {
  name: string;
  domain: string;
  problem: string;
  solution: string;
  quickSummary: string;
  concreteExample: ConcreteExample;
  ideaComponents?: {
    monetization: string;
    targetAudience: string;
    technology: string;
    marketSize: string;
    estimatedTeamSize?: number;
    estimatedTeamSizeReasoning?: string;
  };
  evaluation: any;
  evaluationQuestions?: Record<string, { questions: Array<{ question: string; answer: string }> }>;
  quickNotes?: {
    strengths: string[];
    weaknesses: string[];
    keyAssumptions: string[];
    nextSteps: string[];
    references: string[];
  };
  actionPlan?: any; // Will match ActionPlan type
  tags: string[];
  rawAiResponse?: string;
  aiPrompt?: string;
}

export class IdeaGenerationService {
  private promptBuilder: PromptBuilder;
  private embeddingService: EmbeddingService;

  constructor(
    private ideaRepository: IdeaRepository,
    private configService: ConfigService
  ) {
    this.promptBuilder = new PromptBuilder(configService);
    this.embeddingService = new EmbeddingService();
  }

  /**
   * Generate a new idea using Claude API with detailed logging
   */
  async generateIdea(options: GenerationOptions = {}): Promise<GenerationResult> {
    const sessionId = options.sessionId || randomUUID();
    const logger = new GenerationLogger(sessionId);

    try {
      // Stage 1: Initialization
      const framework = options.framework || options.template; // Support deprecated template param
      logger.info(GenerationStage.INIT, 'Starting idea generation', {
        framework: framework || 'random',
        domain: options.domain,
        skipDuplicateCheck: options.skipDuplicateCheck,
      });

      // Check if AI provider is configured
      if (!(await isAIConfigured())) {
        logger.error(
          GenerationStage.INIT,
          'AI API key not configured',
          new Error('No active AI API key in configuration')
        );
        throw new ExternalServiceError(
          'AI Provider',
          'No AI API key found in configuration. Please add one in the Configuration page and select it in Settings.'
        );
      }

      logger.success(GenerationStage.INIT, 'Configuration verified');

      // Stage 2: Config Load
      logger.info(GenerationStage.CONFIG_LOAD, 'Loading configuration');

      // Stage 3: Build generation prompt
      logger.info(GenerationStage.PROMPT_BUILD, 'Building generation prompt', {
        framework: framework || 'random',
      });

      const { prompt, frameworkName: actualFramework } = await this.promptBuilder.buildGenerationPrompt(framework);

      logger.success(GenerationStage.PROMPT_BUILD, 'Prompt built successfully', {
        promptLength: prompt.length,
        framework: actualFramework,
      });

      // Get AI settings from config
      const generationSettings = await this.configService.getGenerationSettings();
      const temperature = generationSettings.temperature || 1.0;
      const maxTokens = generationSettings.max_tokens || 16384;

      // Stage 4: Call AI API
      logger.info(GenerationStage.API_CALL, 'Calling AI API', {
        temperature,
        maxTokens,
      });

      const apiStartTime = Date.now();
      const response = await callAI(prompt, {
        temperature,
        maxTokens,
      });
      const apiDuration = Date.now() - apiStartTime;

      logger.success(GenerationStage.API_CALL, 'AI API response received', {
        duration: apiDuration,
        responseLength: response.length,
      });

      // Stage 5: Parse the response
      logger.info(GenerationStage.RESPONSE_PARSE, 'Parsing AI response');

      const ideaData = this.parseAIResponse(response, logger);

      // Store raw AI response and prompt for debugging
      ideaData.rawAiResponse = response;
      ideaData.aiPrompt = prompt;

      // Validate that all required criteria are present
      const criteria = await this.configService.getEvaluationCriteria();
      const expectedCriteriaCount = criteria?.draft_phase_criteria?.length || 10;
      const actualCriteriaCount = Object.keys(ideaData.evaluation).length;

      if (actualCriteriaCount < expectedCriteriaCount) {
        const missingCriteria: string[] = [];
        const expectedKeys = criteria?.draft_phase_criteria?.map((c: any) =>
          this.toCamelCase(c.name)
        ) || [];

        for (const expectedKey of expectedKeys) {
          if (!ideaData.evaluation[expectedKey]) {
            missingCriteria.push(expectedKey);
          }
        }

        const errorMsg = `AI response incomplete: Expected ${expectedCriteriaCount} criteria, got ${actualCriteriaCount}. Missing: ${missingCriteria.join(', ')}`;
        logger.error(GenerationStage.RESPONSE_PARSE, errorMsg, new Error(errorMsg));

        throw new ValidationError(
          errorMsg,
          {
            expected: expectedCriteriaCount,
            actual: actualCriteriaCount,
            missing: missingCriteria,
            rawResponse: response.substring(0, 500) + '...'
          }
        );
      }

      // Validate that each criterion has questions
      for (const key of Object.keys(ideaData.evaluation)) {
        if (!ideaData.evaluation[key].questions || ideaData.evaluation[key].questions.length === 0) {
          const errorMsg = `Criterion "${key}" is missing questions array`;
          logger.error(GenerationStage.RESPONSE_PARSE, errorMsg, new Error(errorMsg));

          throw new ValidationError(
            errorMsg,
            { criterion: key, evaluation: ideaData.evaluation[key] }
          );
        }
      }

      logger.success(GenerationStage.RESPONSE_PARSE, 'Response parsed successfully', {
        ideaName: ideaData.name,
        domain: ideaData.domain,
        score: 'pending calculation',
        criteriaCount: actualCriteriaCount,
      });

      // Stage 6: Check for duplicates (unless skipped)
      if (!options.skipDuplicateCheck) {
        logger.info(GenerationStage.DUPLICATE_CHECK, 'Checking for duplicate ideas', {
          domain: ideaData.domain,
          problem: ideaData.problem,
        });

        await this.checkDuplicate(ideaData.domain, ideaData.problem, ideaData.solution);

        logger.success(GenerationStage.DUPLICATE_CHECK, 'No duplicates found');
      } else {
        logger.warning(GenerationStage.DUPLICATE_CHECK, 'Duplicate check skipped');
      }

      // Stage 7: Create idea in database
      logger.info(GenerationStage.DB_SAVE, 'Saving idea to database');

      const idea = await this.createIdeaFromGeneration(ideaData, actualFramework);

      logger.success(GenerationStage.DB_SAVE, 'Idea saved to database', {
        ideaId: idea.id,
        ideaName: idea.name,
        score: idea.score,
      });

      // Stage 8: Complete
      logger.success(GenerationStage.COMPLETE, `Idea generation complete: ${idea.name}`, {
        ideaId: idea.id,
        score: `${idea.score}/100`,
        totalDuration: logger.getSummary().totalDuration,
      });

      // Update status to completed
      await logger.updateStatus('completed', undefined, idea.id);

      return {
        idea,
        logs: logger.getLogs(),
        summary: logger.getSummary(),
      };
    } catch (error: any) {
      const stage = error instanceof ConflictError
        ? GenerationStage.DUPLICATE_CHECK
        : error instanceof ValidationError
        ? GenerationStage.RESPONSE_PARSE
        : error instanceof ExternalServiceError
        ? GenerationStage.API_CALL
        : GenerationStage.FAILED;

      logger.error(stage, `Generation failed: ${error.message}`, error);
      logger.error(GenerationStage.FAILED, 'Idea generation failed', error);

      throw error;
    }
  }

  /**
   * Parse AI's JSON response (works for both Claude and Gemini)
   */
  private parseAIResponse(response: string, logger?: GenerationLogger): GeneratedIdeaData {
    try {
      // Extract JSON from response (AI providers might include markdown code blocks)
      let jsonStr = response.trim();

      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      // Trim whitespace
      jsonStr = jsonStr.trim();

      // Try to parse JSON, with fallback for incomplete responses
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError: any) {
        // If JSON is incomplete, try to salvage it
        logger?.warning(
          GenerationStage.RESPONSE_PARSE,
          `Initial JSON parse failed: ${parseError.message}. Attempting to repair...`
        );

        // Try to fix common issues:
        // 1. Missing closing braces/brackets
        // 2. Unterminated strings
        // 3. Trailing commas

        // Count opening and closing braces
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;

        // Add missing closing brackets/braces
        for (let i = 0; i < openBrackets - closeBrackets; i++) {
          jsonStr += ']';
        }
        for (let i = 0; i < openBraces - closeBraces; i++) {
          jsonStr += '}';
        }

        // Try parsing again
        try {
          parsed = JSON.parse(jsonStr);
          logger?.success(GenerationStage.RESPONSE_PARSE, 'Successfully repaired malformed JSON', {});
        } catch (retryError: any) {
          // If still failing, log the full response for debugging
          logger?.error(
            GenerationStage.RESPONSE_PARSE,
            `Failed to parse JSON even after repair: ${retryError.message}`,
            retryError
          );

          // Log the full AI response in the error message itself
          const responsePreview = jsonStr.length > 1000 ? jsonStr.substring(0, 1000) + '... (truncated)' : jsonStr;
          logger?.error(
            GenerationStage.RESPONSE_PARSE,
            `Full AI response: ${responsePreview}`,
            parseError
          );

          throw parseError; // Throw original error
        }
      }

      // Validate required fields
      if (!parsed.name || !parsed.quickSummary || !parsed.concreteExample || !parsed.evaluation) {
        throw new Error('Missing required fields in Claude response');
      }

      // Validate concrete example structure
      if (
        !parsed.concreteExample.currentState ||
        !parsed.concreteExample.yourSolution ||
        !parsed.concreteExample.keyImprovement
      ) {
        throw new Error('Concrete example missing required fields');
      }

      // Validate idea components (optional but recommended)
      if (parsed.ideaComponents) {
        if (!parsed.ideaComponents.monetization || !parsed.ideaComponents.targetAudience ||
            !parsed.ideaComponents.technology || !parsed.ideaComponents.marketSize) {
          logger?.warning(
            GenerationStage.RESPONSE_PARSE,
            'Idea components present but incomplete',
            { ideaComponents: parsed.ideaComponents }
          );
        }
      }

      // Validate evaluation questions (optional but recommended)
      if (parsed.evaluation) {
        // Get all criteria keys dynamically from the parsed evaluation
        const criteriaKeys = Object.keys(parsed.evaluation);

        const evaluationQuestions: Record<string, { questions: Array<{ question: string; answer: string }> }> = {};

        for (const key of criteriaKeys) {
          if (parsed.evaluation[key]?.questions) {
            evaluationQuestions[key] = {
              questions: parsed.evaluation[key].questions
            };

            // Validate that each question has question and answer
            if (!Array.isArray(parsed.evaluation[key].questions)) {
              logger?.warning(
                GenerationStage.RESPONSE_PARSE,
                `Evaluation questions for ${key} is not an array`
              );
            } else {
              for (const q of parsed.evaluation[key].questions) {
                if (!q.question || !q.answer) {
                  logger?.warning(
                    GenerationStage.RESPONSE_PARSE,
                    `Incomplete question/answer pair in ${key}`,
                    { question: q }
                  );
                }
              }
            }
          }
        }
      }

      // Validate quick notes (optional but recommended)
      if (parsed.quickNotes) {
        const requiredSections = ['strengths', 'weaknesses', 'keyAssumptions', 'nextSteps', 'references'];
        for (const section of requiredSections) {
          if (!parsed.quickNotes[section] || !Array.isArray(parsed.quickNotes[section])) {
            logger?.warning(
              GenerationStage.RESPONSE_PARSE,
              `Quick notes section '${section}' missing or not an array`
            );
          }
        }
      }

      // Extract domain parts
      const domainParts = parsed.domain.split('→').map((s: string) => s.trim());
      const domain = domainParts[0];
      const subdomain = domainParts[1];

      // Build evaluation questions from parsed data (dynamically from all criteria)
      const evaluationQuestions: Record<string, { questions: Array<{ question: string; answer: string }> }> = {};
      if (parsed.evaluation) {
        // Get all criteria keys dynamically
        const criteriaKeys = Object.keys(parsed.evaluation);

        for (const key of criteriaKeys) {
          if (parsed.evaluation[key]?.questions && Array.isArray(parsed.evaluation[key].questions)) {
            evaluationQuestions[key] = {
              questions: parsed.evaluation[key].questions
            };
          }
        }
      }

      return {
        name: parsed.name,
        domain: subdomain ? `${domain} → ${subdomain}` : domain,
        problem: parsed.problem || 'Unknown',
        solution: parsed.solution || 'Unknown',
        quickSummary: parsed.quickSummary,
        concreteExample: parsed.concreteExample,
        ideaComponents: parsed.ideaComponents,
        evaluation: parsed.evaluation,
        evaluationQuestions: Object.keys(evaluationQuestions).length > 0 ? evaluationQuestions : undefined,
        quickNotes: parsed.quickNotes,
        actionPlan: parsed.actionPlan,
        tags: parsed.tags || [],
      };
    } catch (error: any) {
      console.error('Failed to parse AI response:', error);
      console.error('Response was:', response);
      throw new ExternalServiceError(
        'AI Provider',
        `Failed to parse response: ${error.message}`,
        { response }
      );
    }
  }

  /**
   * Check if similar idea already exists
   */
  private async checkDuplicate(
    domain: string,
    problem: string,
    solution: string
  ): Promise<void> {
    // Extract base domain (before →)
    const baseDomain = domain.split('→')[0].trim();

    const existing = await this.ideaRepository.checkDuplicate(
      baseDomain,
      problem,
      solution
    );

    if (existing) {
      throw new ConflictError(
        `Similar idea already exists: ${existing.name}`,
        { existingId: existing.id }
      );
    }
  }

  /**
   * Create idea from generated data
   */
  private async createIdeaFromGeneration(data: GeneratedIdeaData, framework?: string): Promise<Idea> {
    // Extract domain and subdomain
    const domainParts = data.domain.split('→').map((s: string) => s.trim());
    const domain = domainParts[0];
    const subdomain = domainParts[1];

    // Build scores object dynamically from all criteria in evaluation
    const scores: IdeaScores = {};
    const evaluationDetails: EvaluationDetails = {};

    for (const [key, criterion] of Object.entries(data.evaluation)) {
      const evalCriterion = criterion as any;
      scores[key] = evalCriterion?.score || 5;
      evaluationDetails[key] = {
        score: evalCriterion?.score || 5,
        reasoning: evalCriterion?.reasoning || '',
        questions: evalCriterion?.questions || [],
      };
    }

    // Calculate total weighted score
    const totalScore = await this.calculateWeightedScore(scores);

    // Calculate complexity scores (derived from existing evaluations)
    const complexityScores = this.calculateComplexityScores(scores, evaluationDetails);

    // Generate folder name
    const folderName = this.generateFolderName(data.name);

    // Create idea
    const idea = await this.ideaRepository.create({
      name: data.name,
      folderName,
      status: 'draft',
      score: totalScore,
      domain,
      subdomain,
      problem: data.problem,
      solution: data.solution,
      scores,
      quickSummary: data.quickSummary,
      concreteExample: data.concreteExample,
      evaluationDetails,
      complexityScores,
      tags: data.tags,
      generationFramework: framework, // Track which framework was used for filtering
      ideaComponents: data.ideaComponents,
      evaluationQuestions: data.evaluationQuestions,
      quickNotes: data.quickNotes,
      actionPlan: data.actionPlan,
      rawAiResponse: data.rawAiResponse,
      aiPrompt: data.aiPrompt,
    } as any);

    // Add creation history
    await this.ideaRepository.addHistory(idea.id, 'created', 'Idea generated by Claude API');

    // Generate and store embedding for semantic duplicate detection
    try {
      const embedding = await this.embeddingService.generateEmbedding({
        domain: idea.domain,
        subdomain: idea.subdomain,
        problem: idea.problem,
        solution: idea.solution,
        summary: idea.quickSummary,
      });
      await this.embeddingService.storeEmbedding(idea.id, embedding);
    } catch (error) {
      // Log but don't fail idea creation if embedding generation fails
      console.error('Failed to generate/store embedding for idea:', error);
    }

    return idea;
  }

  /**
   * Load weights from configuration
   */
  private async getWeightsFromConfig(): Promise<Record<string, number>> {
    try {
      const evalCriteria = await this.configService.getEvaluationCriteria();
      const criteria = evalCriteria?.draft_phase_criteria || [];

      const weights: Record<string, number> = {};
      for (const criterion of criteria) {
        // Convert criterion name to camelCase key dynamically
        const key = this.toCamelCase(criterion.name);
        if (criterion.weight !== undefined) {
          weights[key] = criterion.weight;
        }
      }

      return weights;
    } catch (error) {
      console.error('Failed to load weights from config, using defaults:', error);
      // Return default weights as fallback (all equal weight)
      return {
        problemSeverity: 1,
        marketSize: 1,
        competitionLevel: 1,
        monetizationClarity: 1,
        technicalFeasibility: 1,
        personalInterest: 1,
        unfairAdvantage: 1,
        timeToMarket: 1,
        scalabilityPotential: 1,
        networkEffects: 1,
      };
    }
  }

  /**
   * Calculate weighted total score (0-100)
   */
  private async calculateWeightedScore(scores: IdeaScores): Promise<number> {
    const weights = await this.getWeightsFromConfig();

    let total = 0;
    let weightSum = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const score = scores[key as keyof IdeaScores];
      if (score !== undefined) {
        total += score * weight;
        weightSum += weight * 10; // Max score is 10 for each criterion
      }
    }

    // Normalize to 0-100 scale
    return Math.round((total / weightSum) * 100);
  }

  /**
   * Calculate execution complexity scores (derived from existing evaluations)
   */
  private calculateComplexityScores(scores: IdeaScores, evaluationDetails: EvaluationDetails): ComplexityScores {
    // Technical Complexity: Inverse of Technical Feasibility
    // If something is very feasible (10), it's not complex (1)
    const technicalFeasibility = scores.technicalFeasibility || 5;
    const technical = 11 - technicalFeasibility;

    // Regulatory Complexity: Derived from Time to Market evaluation
    // Check if regulatory issues are mentioned in the reasoning
    const timeToMarketReasoning = evaluationDetails.timeToMarket?.reasoning || '';
    const hasRegulatoryMentions = /regulat|complia|licens|legal|permit|approval|certif/i.test(timeToMarketReasoning);

    // If regulatory mentions found, complexity scales with timeToMarket score
    // Higher timeToMarket score = easier/faster = lower regulatory complexity
    const regulatory = hasRegulatoryMentions
      ? 11 - (scores.timeToMarket || 5)
      : 3; // Default low complexity if no regulatory mentions

    // Sales Complexity: Inverse of market accessibility
    // Market accessibility = (Market Size + Monetization Clarity) / 2
    // Larger market + clearer monetization = easier to sell = lower complexity
    const marketSize = scores.marketSize || 5;
    const monetizationClarity = scores.monetizationClarity || 5;
    const marketAccessibility = (marketSize + monetizationClarity) / 2;
    const sales = 11 - marketAccessibility;

    // Total complexity (3-30 range)
    const total = technical + regulatory + sales;

    return {
      technical: Math.round(technical * 10) / 10,  // Round to 1 decimal
      regulatory: Math.round(regulatory * 10) / 10,
      sales: Math.round(sales * 10) / 10,
      total: Math.round(total * 10) / 10,
    };
  }

  /**
   * Generate unique folder name
   */
  private generateFolderName(name: string): string {
    // Convert to lowercase, replace spaces with hyphens, remove special chars
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    // Add date suffix
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${slug}-${year}-${month}`;
  }

  /**
   * Convert "Problem Severity" to "problemSeverity"
   */
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
}
