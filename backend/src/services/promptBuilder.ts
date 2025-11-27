import { ConfigService } from './configService';

export class PromptBuilder {
  constructor(private configService: ConfigService) {}

  /**
   * Build idea generation prompt using a framework
   * Returns both the prompt and the actual framework name used (important for random selection)
   */
  async buildGenerationPrompt(frameworkName?: string): Promise<{ prompt: string; frameworkName: string }> {
    // Get framework (random or specific)
    const framework = frameworkName
      ? await this.configService.getFramework(frameworkName)
      : await this.configService.getRandomFramework();

    const actualFrameworkName = framework.name;

    // Get multiple options for each category (3-5 options)
    const domains = await this.configService.getRandomDomains(5);
    const problems = await this.configService.getRandomProblemTypes(5);
    const solutions = await this.configService.getRandomSolutionTypes(5);

    // Get monetization models and target audiences for filtering
    const monetizationModels = await this.configService.getMonetizationModels();
    const targetAudiences = await this.configService.getTargetAudiences();

    // Get evaluation criteria for context
    const criteria = await this.configService.getEvaluationCriteria();

    // Build dynamic evaluation schema
    const evaluationSchema = await this.buildEvaluationSchema();
    const criteriaCount = criteria?.draft_phase_criteria?.length || 10;

    // Get generation settings with prompt template
    const settings = await this.configService.getGenerationSettings();
    let promptTemplate = settings?.idea_generation_prompt || this.getDefaultPromptTemplate();

    // Get extra filters if enabled
    const extraFiltersText = await this.buildExtraFiltersText(settings);

    // Format domains for display
    const domainsDisplay = domains
      .map(d => d.subdomain ? `${d.domain} → ${d.subdomain}` : d.domain)
      .join('\n- ');

    // Format problems and solutions for display
    const problemsDisplay = problems.join('\n- ');
    const solutionsDisplay = solutions.join('\n- ');

    // Format monetization models and target audiences for display
    const monetizationModelsDisplay = monetizationModels.join(', ');
    const targetAudiencesDisplay = targetAudiences.join(', ');

    // Replace placeholders in the template
    const prompt = promptTemplate
      .replace(/{framework_name}/g, framework.name)
      .replace(/{framework_description}/g, framework.description ? `**Description**: ${framework.description}` : '')
      .replace(/{framework_template}/g, framework.template ? `**Template**: ${framework.template}` : '')
      .replace(/{framework_example}/g, framework.example ? `**Example**: ${framework.example}` : '')
      .replace(/{domains}/g, domainsDisplay)
      .replace(/{problems}/g, problemsDisplay)
      .replace(/{solutions}/g, solutionsDisplay)
      .replace(/{criteria}/g, this.formatCriteria(criteria))
      .replace(/{evaluation_schema}/g, evaluationSchema)
      .replace(/{criteria_count}/g, criteriaCount.toString())
      .replace(/{extra_filters}/g, extraFiltersText)
      .replace(/{monetization_models}/g, monetizationModelsDisplay)
      .replace(/{target_audiences}/g, targetAudiencesDisplay);

    return { prompt, frameworkName: actualFrameworkName };
  }

  /**
   * Get default prompt template (fallback)
   */
  private getDefaultPromptTemplate(): string {
    return `You are an expert at generating comprehensive software business ideas. Generate a new, specific, well-researched software business idea using the following framework and constraints.

**Generation Framework**: {framework_name}
{framework_description}
{framework_template}
{framework_example}

**Constraints** (choose from the options provided):
- **Domain Options** (pick one or combine related ones):
- {domains}

- **Problem Type Options** (select the most relevant):
- {problems}

- **Solution Type Options** (choose the best fit):
- {solutions}
{extra_filters}

**Evaluation Criteria** (each scored 1-10):
{criteria}

---

Generate a unique, viable idea that addresses a real problem in the specified domain. For each evaluation criterion, provide 2-3 follow-up questions with detailed answers that demonstrate deep thinking about the idea.

Return ONLY valid JSON in this exact format:
\`\`\`json
{
  "name": "Idea Name (max 60 characters)",
  "domain": "Parent Domain → Subdomain",
  "problem": "Brief problem description",
  "solution": "Brief solution description",
  "quickSummary": "1-2 sentence elevator pitch explaining the value proposition",

  "concreteExample": {
    "currentState": "Detailed description of how users handle this problem today (2-3 sentences with specific pain points)",
    "yourSolution": "Step-by-step walkthrough of how they would use your solution (2-3 sentences)",
    "keyImprovement": "Quantifiable improvements with specific metrics (time saved, cost reduction, etc.)"
  },

  "ideaComponents": {
    "monetization": "Revenue model (e.g., 'Monthly subscription ($50-150/user)', 'Commission-based (15%)')",
    "targetAudience": "Specific user segment with demographics (e.g., 'Small business owners (10-50 employees)')",
    "technology": "Core tech stack needed (e.g., 'React/Node.js web app + OpenAI API + Stripe')",
    "marketSize": "Market size category with numbers (e.g., 'Mid-Market (500K potential users, $50M TAM)')",
    "estimatedTeamSize": 2,
    "estimatedTeamSizeReasoning": "Brief explanation of minimum team needed to build and launch MVP"
  },

  "evaluation": {
    "problemSeverity": {
      "score": 8,
      "reasoning": "2-3 sentences explaining the score with specific evidence",
      "questions": [
        {"question": "How often does this problem occur?", "answer": "Specific answer with frequency/impact"},
        {"question": "What's the cost of not solving it?", "answer": "Quantified costs or consequences"},
        {"question": "Do people actively seek solutions?", "answer": "Evidence of demand (searches, complaints, workarounds)"}
      ]
    },
    "marketSize": {
      "score": 7,
      "reasoning": "...",
      "questions": [
        {"question": "What's the total addressable market?", "answer": "Numbers and sources"},
        {"question": "Is the market growing or shrinking?", "answer": "Trends and data"},
        {"question": "How accessible is this market?", "answer": "Distribution channels and reach"}
      ]
    },
    "competition": {
      "score": 6,
      "reasoning": "...",
      "questions": [
        {"question": "Who are the main competitors?", "answer": "List 3-5 competitors with brief descriptions"},
        {"question": "What are their weaknesses?", "answer": "Gaps you can exploit"},
        {"question": "Is there room for a new player?", "answer": "Why you can differentiate"}
      ]
    },
    "monetization": {
      "score": 9,
      "reasoning": "...",
      "questions": [
        {"question": "Will people pay for this?", "answer": "Evidence of willingness to pay"},
        {"question": "What's a realistic price point?", "answer": "Specific pricing with justification"},
        {"question": "Are there multiple revenue streams?", "answer": "List potential revenue sources"}
      ]
    },
    "technicalFeasibility": {
      "score": 7,
      "reasoning": "...",
      "questions": [
        {"question": "What's the technical complexity?", "answer": "Assessment of difficulty"},
        {"question": "Can this be built as an MVP quickly?", "answer": "Realistic timeline"},
        {"question": "Are there technical risks?", "answer": "Potential blockers or challenges"}
      ]
    },
    "personalInterest": {
      "score": 8,
      "reasoning": "...",
      "questions": [
        {"question": "Will I stay motivated long-term?", "answer": "Mission/vision assessment"},
        {"question": "Do I understand this domain?", "answer": "Domain knowledge evaluation"},
        {"question": "Do I have relevant experience?", "answer": "Skills and background match"}
      ]
    },
    "unfairAdvantage": {
      "score": 5,
      "reasoning": "...",
      "questions": [
        {"question": "Do I have domain expertise?", "answer": "Specific expertise or need to acquire"},
        {"question": "Do I have unique access or connections?", "answer": "Network advantages"},
        {"question": "Can competitors easily copy this?", "answer": "Defensibility and moat potential"}
      ]
    },
    "timeToMarket": {
      "score": 7,
      "reasoning": "...",
      "questions": [
        {"question": "What's the MVP timeline?", "answer": "Realistic months to launch"},
        {"question": "Are there regulatory hurdles?", "answer": "Compliance or approval requirements"},
        {"question": "How fast can I validate?", "answer": "Quick validation approach (days/weeks)"}
      ]
    }
  },

  "quickNotes": {
    "strengths": [
      "3-5 bullet points highlighting the strongest aspects of this idea",
      "Focus on unique advantages, market opportunity, clear ROI, etc."
    ],
    "weaknesses": [
      "3-5 bullet points identifying potential risks and challenges",
      "Be honest about gaps, competition, complexity, etc."
    ],
    "keyAssumptions": [
      "3-5 critical assumptions this idea depends on",
      "What needs to be true for this to succeed?"
    ],
    "nextSteps": [
      "3-5 actionable validation steps to test this idea quickly",
      "Include research, interviews, prototypes, etc."
    ],
    "references": [
      "3-5 data points, sources, or facts supporting the analysis",
      "Include market size, competitor info, research citations, etc."
    ]
  },

  "actionPlan": {
    "nextSteps": [
      {
        "step": 1,
        "title": "Brief title of the action (e.g., 'Validate problem with target users')",
        "description": "Detailed description of what to do and why (2-3 sentences)",
        "duration": "Realistic time estimate (e.g., '1-2 weeks')",
        "blockers": ["Optional: What needs to happen first (empty array if none)"],
        "successMetric": "How to know you're done (specific, measurable)"
      },
      {
        "step": 2,
        "title": "Next action title",
        "description": "What to do next",
        "duration": "Time estimate",
        "blockers": ["Step 1: Dependency if needed"],
        "successMetric": "Success criteria"
      }
    ],
    "requiredResources": {
      "technical": ["List 3-5 specific technologies, languages, frameworks, or infrastructure needs"],
      "financial": "Rough budget estimate with breakdown (e.g., '$5K-10K: API costs $1K, infrastructure $2K, legal $2-5K')",
      "team": ["List 2-4 roles needed with specificity (e.g., '1 full-stack dev with AI experience', '1 designer')"],
      "legal": ["List 0-3 legal/compliance requirements (e.g., 'HIPAA compliance', 'BAA agreements')]"
    },
    "timeline": {
      "mvp": "Realistic MVP timeline (e.g., '2-3 months')",
      "firstRevenue": "When could you make first sale (e.g., '4-6 months')",
      "breakeven": "Break-even timeline with assumptions (e.g., '12-18 months assuming 50 customers @$100/mo')"
    },
    "criticalPath": [
      "2-4 most critical/risky items that could block or delay execution",
      "Focus on regulatory blockers, technical unknowns, market validation risks",
      "Be specific about what makes each item critical"
    ]
  },

  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
\`\`\`

IMPORTANT:
- All 8 evaluation criteria MUST have exactly 3 questions with detailed answers
- Quick notes sections MUST have 3-5 items each (strengths, weaknesses, assumptions, next steps, references)
- Action plan MUST have 6-8 next steps with all required fields (step, title, description, duration, successMetric)
- Required resources MUST include specific technologies (3-5), budget breakdown, team roles (2-4), and legal requirements (0-3)
- Timeline estimates MUST be realistic with clear assumptions (e.g., "12-18 months assuming 50 customers @$100/mo")
- Critical path MUST identify 2-4 specific blocking items (regulatory, technical unknowns, market validation risks)
- estimatedTeamSize MUST be a realistic integer (1-10) for minimum team needed to build and launch MVP
- Use specific numbers, metrics, and evidence throughout
- Be realistic and honest in scoring - not everything should be 8-10
- Provide actionable insights that help evaluate if this idea is worth pursuing`;
  }

  /**
   * Build refinement prompt for an existing idea
   */
  async buildRefinementPrompt(
    ideaName: string,
    ideaContent: string,
    refinementType: string
  ): Promise<string> {
    const refinementPrompts: Record<string, string> = {
      'add-concrete-example': `Review this business idea and enhance the "Concrete Example" section to make it more specific and compelling.

**Current Idea**: ${ideaName}

${ideaContent}

**Task**: Rewrite or expand the Concrete Example section with:
1. More specific details about the current state
2. Clearer description of the solution user experience
3. Quantifiable improvements with realistic metrics

Return the enhanced concrete example in JSON format:
\`\`\`json
{
  "currentState": "...",
  "yourSolution": "...",
  "keyImprovement": "..."
}
\`\`\``,

      'evaluate-competition': `Analyze the competitive landscape for this business idea.

**Idea**: ${ideaName}

${ideaContent}

**Task**: Research and provide:
1. List of 3-5 existing competitors
2. Their strengths and weaknesses
3. Market gaps this idea could fill
4. Recommended differentiation strategy

Return in JSON format:
\`\`\`json
{
  "competitors": [
    {
      "name": "Competitor 1",
      "strengths": ["..."],
      "weaknesses": ["..."]
    }
  ],
  "marketGaps": ["..."],
  "differentiationStrategy": "..."
}
\`\`\``,

      'financial-analysis': `Provide a detailed financial analysis for this business idea.

**Idea**: ${ideaName}

${ideaContent}

**Task**: Estimate:
1. Customer Acquisition Cost (CAC)
2. Lifetime Value (LTV)
3. Monthly Revenue Potential (first year)
4. Break-even timeline
5. Key cost drivers

Return in JSON format:
\`\`\`json
{
  "cac": {"estimate": 100, "reasoning": "..."},
  "ltv": {"estimate": 500, "reasoning": "..."},
  "ltvCacRatio": 5.0,
  "monthlyRevenue": {"year1": 10000, "reasoning": "..."},
  "breakEvenMonths": 12,
  "costDrivers": ["..."]
}
\`\`\``,

      'improve-scoring': `Re-evaluate the scores for this business idea and suggest improvements.

**Idea**: ${ideaName}

${ideaContent}

**Task**: Review all 8 criteria scores and:
1. Identify which scores might be too optimistic or pessimistic
2. Provide updated scores with detailed reasoning
3. Suggest ways to improve low-scoring areas

Return in JSON format with updated evaluation.`,
    };

    const basePrompt =
      refinementPrompts[refinementType] ||
      `Analyze and improve this business idea:\n\n${ideaName}\n\n${ideaContent}\n\nProvide specific, actionable recommendations.`;

    return basePrompt;
  }

  /**
   * Build extra filters text from settings
   */
  private async buildExtraFiltersText(settings: any): Promise<string> {
    if (!settings || !settings.extraFilters) {
      return 'None';
    }

    const activeFilters = settings.extraFilters.filter((f: any) => f.enabled);

    if (activeFilters.length === 0) {
      return 'None';
    }

    const filterTexts = activeFilters.map((filter: any) => {
      let text = filter.promptText;
      if (filter.value !== undefined) {
        text = text.replace('{value}', String(filter.value));
      }
      return `- ${text}`;
    });

    return filterTexts.join('\n  ');
  }

  /**
   * Format criteria for display in prompt
   */
  private formatCriteria(criteria: any): string {
    if (!criteria || !criteria.draft_phase_criteria) {
      return '- Problem Severity\n- Market Size\n- Competition\n- Monetization\n- Technical Feasibility\n- Personal Interest\n- Unfair Advantage\n- Time to Market';
    }

    return criteria.draft_phase_criteria
      .map((c: any) => `- ${c.name}: ${c.description}`)
      .join('\n');
  }

  /**
   * Convert criterion name to camelCase key for JSON
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

  /**
   * Build dynamic evaluation JSON schema from criteria config
   */
  private async buildEvaluationSchema(): Promise<string> {
    const criteria = await this.configService.getEvaluationCriteria();

    if (!criteria || !criteria.draft_phase_criteria) {
      // Fallback to default schema
      return this.getDefaultEvaluationSchema();
    }

    const criteriaSchemas = criteria.draft_phase_criteria.map((criterion: any) => {
      const key = this.toCamelCase(criterion.name);
      const questions = criterion.questions || [];

      return `    "${key}": {
      "score": 7,
      "reasoning": "2-3 sentences explaining the score with specific evidence",
      "questions": [
${questions.map((q: string) => `        {"question": "${q}", "answer": "Specific detailed answer"}`).join(',\n')}
      ]
    }`;
    }).join(',\n');

    return `  "evaluation": {\n${criteriaSchemas}\n  }`;
  }

  /**
   * Get default evaluation schema (fallback)
   */
  private getDefaultEvaluationSchema(): string {
    return `  "evaluation": {
    "problemSeverity": {
      "score": 8,
      "reasoning": "2-3 sentences explaining the score with specific evidence",
      "questions": [
        {"question": "How often does this problem occur?", "answer": "Specific answer with frequency/impact"},
        {"question": "What's the cost of not solving it?", "answer": "Quantified costs or consequences"},
        {"question": "Do people actively seek solutions?", "answer": "Evidence of demand (searches, complaints, workarounds)"}
      ]
    },
    "marketSize": {
      "score": 7,
      "reasoning": "...",
      "questions": [
        {"question": "What's the total addressable market?", "answer": "Numbers and sources"},
        {"question": "Is the market growing or shrinking?", "answer": "Trends and data"},
        {"question": "How accessible is this market?", "answer": "Distribution channels and reach"}
      ]
    },
    "competition": {
      "score": 6,
      "reasoning": "...",
      "questions": [
        {"question": "Who are the main competitors?", "answer": "List 3-5 competitors with brief descriptions"},
        {"question": "What are their weaknesses?", "answer": "Gaps you can exploit"},
        {"question": "Is there room for a new player?", "answer": "Why you can differentiate"}
      ]
    },
    "monetization": {
      "score": 9,
      "reasoning": "...",
      "questions": [
        {"question": "Will people pay for this?", "answer": "Evidence of willingness to pay"},
        {"question": "What's a realistic price point?", "answer": "Specific pricing with justification"},
        {"question": "Are there multiple revenue streams?", "answer": "List potential revenue sources"}
      ]
    },
    "technicalFeasibility": {
      "score": 7,
      "reasoning": "...",
      "questions": [
        {"question": "What's the technical complexity?", "answer": "Assessment of difficulty"},
        {"question": "Can this be built as an MVP quickly?", "answer": "Realistic timeline"},
        {"question": "Are there technical risks?", "answer": "Potential blockers or challenges"}
      ]
    },
    "personalInterest": {
      "score": 8,
      "reasoning": "...",
      "questions": [
        {"question": "Will I stay motivated long-term?", "answer": "Mission/vision assessment"},
        {"question": "Do I understand this domain?", "answer": "Domain knowledge evaluation"},
        {"question": "Do I have relevant experience?", "answer": "Skills and background match"}
      ]
    },
    "unfairAdvantage": {
      "score": 5,
      "reasoning": "...",
      "questions": [
        {"question": "Do I have domain expertise?", "answer": "Specific expertise or need to acquire"},
        {"question": "Do I have unique access or connections?", "answer": "Network advantages"},
        {"question": "Can competitors easily copy this?", "answer": "Defensibility and moat potential"}
      ]
    },
    "timeToMarket": {
      "score": 7,
      "reasoning": "...",
      "questions": [
        {"question": "What's the MVP timeline?", "answer": "Realistic months to launch"},
        {"question": "Are there regulatory hurdles?", "answer": "Compliance or approval requirements"},
        {"question": "How fast can I validate?", "answer": "Quick validation approach (days/weeks)"}
      ]
    }
  }`;
  }
}
