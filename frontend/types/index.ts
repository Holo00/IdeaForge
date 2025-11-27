export interface Idea {
  id: string;
  name: string;
  folderName: string;
  status: 'draft' | 'active' | 'archived';
  score: number;
  domain: string;
  subdomain?: string;
  problem: string;
  solution: string;
  scores: IdeaScores;
  quickSummary: string;
  concreteExample: ConcreteExample;
  evaluationDetails: EvaluationDetails;
  quickNotes?: QuickNotes;
  complexityScores?: ComplexityScores;
  actionPlan?: ActionPlan;
  tags: string[];
  generationFramework?: string;
  createdAt: string;
  updatedAt: string;
  parentIdeaId?: string;
  rawAiResponse?: string;
  aiPrompt?: string;
}

export interface IdeaScores {
  [key: string]: number;
}

export interface ConcreteExample {
  currentState: string;
  yourSolution: string;
  keyImprovement: string;
}

export interface EvaluationCriterion {
  score: number;
  reasoning: string;
  questions?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface EvaluationDetails {
  [key: string]: EvaluationCriterion;
}

export interface QuickNotes {
  strengths: string[];
  weaknesses: string[];
  keyAssumptions: string[];
  nextSteps: string[];
  references: string[];
}

export interface ComplexityScores {
  technical: number;      // 1-10, how hard to build
  regulatory: number;     // 1-10, how much red tape
  sales: number;          // 1-10, how hard to sell
  total: number;          // 3-30, overall execution complexity
}

export interface ActionStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  blockers?: string[];
  successMetric: string;
}

export interface ResourceNeeds {
  technical: string[];
  financial: string;
  team: string[];
  legal: string[];
}

export interface TimelineEstimate {
  mvp: string;
  firstRevenue: string;
  breakeven: string;
}

export interface ActionPlan {
  nextSteps: ActionStep[];
  requiredResources: ResourceNeeds;
  timeline: TimelineEstimate;
  criticalPath: string[];
}

export interface GenerationJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  ideaId?: string;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: any;
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

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
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

export interface GenerationSummary {
  sessionId: string;
  totalDuration: number;
  stages: Record<GenerationStage, number>;
  success: boolean;
  errorCount: number;
  warningCount: number;
}

export interface GenerationConfiguration {
  template: string;
  domain?: string;
  skipDuplicateCheck: boolean;
  timestamp: string;
}

export interface GenerationResult {
  idea: Idea;
  logs: GenerationLog[];
  summary: GenerationSummary;
  configuration: GenerationConfiguration;
}
