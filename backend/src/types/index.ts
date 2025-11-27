// Core idea types
export interface Idea {
  id: string;
  name: string;
  folderName: string;
  status: IdeaStatus;
  score: number;

  // Classification
  domain: string;
  subdomain?: string;
  problem: string;
  solution: string;

  // Scoring breakdown
  scores: IdeaScores;

  // Content
  quickSummary: string;
  concreteExample: ConcreteExample;
  evaluationDetails: EvaluationDetails;
  quickNotes?: QuickNotes;
  complexityScores?: ComplexityScores;
  actionPlan?: ActionPlan;

  // Metadata
  tags: string[];
  generationFramework?: string;
  rawAiResponse?: string;
  aiPrompt?: string;

  // Normalized lookup references (for efficient filtering)
  monetizationModelId?: number;
  targetAudienceId?: number;
  estimatedTeamSize?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  parentIdeaId?: string;
}

// Lookup table types
export interface MonetizationModel {
  id: number;
  name: string;
  description?: string;
  typicalPricing?: string;
  createdAt: Date;
}

export interface TargetAudience {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export type IdeaStatus = 'draft' | 'validation' | 'research' | 'build' | 'archived';

export interface IdeaScores {
  [key: string]: number; // Dynamic criteria support
}

export interface ConcreteExample {
  currentState: string;
  yourSolution: string;
  keyImprovement: string;
}

export interface EvaluationDetails {
  [key: string]: EvaluationCriterion; // Dynamic criteria support
}

export interface EvaluationCriterion {
  score: number;
  reasoning: string;
  questions?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface QuickNotes {
  strengths: string[];
  weaknesses: string[];
  keyAssumptions: string[];
  nextSteps: string[];
  references: string[];
}

export interface ComplexityScores {
  technical: number;      // 1-10, derived from 11 - technicalFeasibility
  regulatory: number;     // 1-10, derived from timeToMarket evaluation
  sales: number;          // 1-10, derived from market accessibility
  total: number;          // 3-30, sum of above
}

export interface ActionStep {
  step: number;
  title: string;
  description: string;
  duration: string;         // e.g., "1-2 weeks"
  blockers?: string[];      // What needs to happen first
  successMetric: string;    // How to know you're done
}

export interface ResourceNeeds {
  technical: string[];      // Languages, frameworks, infrastructure
  financial: string;        // Rough budget estimate
  team: string[];           // Roles needed
  legal: string[];          // Licenses, permits, compliance
}

export interface TimelineEstimate {
  mvp: string;              // e.g., "2-3 months"
  firstRevenue: string;     // e.g., "4-6 months"
  breakeven: string;        // e.g., "12-18 months"
}

export interface ActionPlan {
  nextSteps: ActionStep[];
  requiredResources: ResourceNeeds;
  timeline: TimelineEstimate;
  criticalPath: string[];   // Most important/blocking tasks
}

// Config types
export interface Config {
  id: string;
  category: ConfigCategory;
  data: any; // JSONB - flexible structure
  version: number;
  updatedAt: Date;
}

export type ConfigCategory =
  | 'business_domains'
  | 'problem_types'
  | 'solution_types'
  | 'monetization_models'
  | 'target_audiences'
  | 'technologies'
  | 'market_sizes'
  | 'evaluation_criteria'
  | 'competitive_advantages'
  | 'idea_prompts';

// Generation job types
export interface GenerationJob {
  id: string;
  framework: string;
  /** @deprecated Use framework instead */
  template?: string;
  status: JobStatus;
  ideaId?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Idea history (for tracking evolution)
export interface IdeaHistory {
  id: string;
  ideaId: string;
  changeType: ChangeType;
  description: string;
  beforeData?: any;
  afterData?: any;
  createdAt: Date;
}

export type ChangeType = 'created' | 'updated' | 'status_changed' | 'refined' | 'merged' | 'archived';

// Learning types
export interface Learning {
  id: string;
  domain: string;
  problem: string;
  solution?: string;
  insight: string;
  source: string; // Which idea generated this learning
  tags: string[];
  createdAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Request types
export interface CreateIdeaRequest {
  framework?: string;
  /** @deprecated Use framework instead */
  template?: string;
  domain?: string;
  customPrompt?: string;
}

export interface UpdateIdeaRequest {
  name?: string;
  status?: IdeaStatus;
  scores?: Partial<IdeaScores>;
  evaluationDetails?: Partial<EvaluationDetails>;
  concreteExample?: Partial<ConcreteExample>;
  tags?: string[];
}

export interface RefinementRequest {
  ideaId: string;
  promptType: string; // 'add-concrete-example', 'evaluate-competition', etc.
  customPrompt?: string;
}

export interface GetIdeasQuery {
  status?: IdeaStatus;
  domain?: string;
  subdomain?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  sortBy?: 'score' | 'created' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  // Advanced filters
  search?: string;
  framework?: string;
  monetization?: string;
  targetAudience?: string;
  technology?: string;
  // Criteria score filters (min values for each criterion)
  minCriteriaScores?: Record<string, number>;
  // Team size filter
  maxTeamSize?: number;
}
