'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function PromptEditor() {
  const { showSuccess, showError } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedProfileId]); // Reload when profile changes

  const loadData = async () => {
    if (!selectedProfileId) {
      // Wait for profile to be loaded
      return;
    }

    try {
      setLoading(true);
      const result = await api.getSettings(selectedProfileId);
      setData(result);
      setPromptText(result?.idea_generation_prompt || await getDefaultPrompt());
    } catch (error: any) {
      showError(`Failed to load prompt: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const getDefaultPrompt = async () => {
    try {
      const response = await api.getDefaultPrompt();
      return response.default_prompt;
    } catch (error) {
      console.error('Failed to fetch default prompt from API, using fallback:', error);
      // Fallback to hardcoded version if API fails
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
    "marketSize": "Market size category with numbers (e.g., 'Mid-Market (500K potential users, $50M TAM)')"
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

  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
\`\`\`

IMPORTANT:
- All 8 evaluation criteria MUST have exactly 3 questions with detailed answers
- Quick notes sections MUST have 3-5 items each (strengths, weaknesses, assumptions, next steps, references)
- Use specific numbers, metrics, and evidence throughout
- Be realistic and honest in scoring - not everything should be 8-10
- Provide actionable insights that help evaluate if this idea is worth pursuing`;
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);
      const updated = { ...data, idea_generation_prompt: promptText };
      await api.updateSettings(updated, selectedProfileId || undefined);
      setData(updated);
      showSuccess('Prompt saved successfully!');
    } catch (error: any) {
      showError(`Failed to save prompt: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    const defaultPrompt = await getDefaultPrompt();
    setPromptText(defaultPrompt);
    setShowResetConfirm(false);
  };

  const getPreviewText = () => {
    return promptText
      .replace(/{framework_name}/g, 'Pain Point Framework')
      .replace(/{framework_description}/g, '**Description**: Focus on identifying a specific pain point')
      .replace(/{framework_template}/g, '**Template**: What if [audience] could [solution] to solve [problem]?')
      .replace(/{framework_example}/g, '**Example**: What if freelancers could automate their invoicing?')
      .replace(/{domains}/g, 'Healthcare → Telemedicine\n- Education → E-Learning\n- Finance → Personal Finance\n- Real Estate → Property Management\n- Retail → E-commerce')
      .replace(/{problems}/g, 'Time consuming manual processes\n- High costs and limited access\n- Poor user experience\n- Lack of transparency\n- Communication barriers')
      .replace(/{solutions}/g, 'Automation and AI\n- Marketplace or platform\n- Analytics and insights\n- Mobile-first application\n- Integration and workflow tools')
      .replace(/{criteria}/g, '- Problem Severity: How painful is this problem?\n- Market Size: How many people have this problem?\n- Competition: How crowded is the market?\n- Monetization: Clear path to revenue?\n- Technical Feasibility: Can this be built?\n- Personal Interest: Will you stay motivated?\n- Unfair Advantage: What makes you unique?\n- Time to Market: How quickly can you launch?');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading prompt...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={resetToDefault}
        title="Reset to Default Prompt"
        message="Are you sure you want to reset to the default prompt? Your current changes will be lost."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              AI Generation Prompt
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Customize the prompt sent to Claude for idea generation. Use placeholders for dynamic content.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
            >
              {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={saveData}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Available Placeholders</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{framework_name}'}</code> - Selected framework name</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{framework_description}'}</code> - Framework description</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{framework_template}'}</code> - Framework template text</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{framework_example}'}</code> - Framework example</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{domains}'}</code> - Multiple domain options (3-5)</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{problems}'}</code> - Multiple problem type options (3-5)</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{solutions}'}</code> - Multiple solution type options (3-5)</div>
          <div><code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">{'{criteria}'}</code> - Evaluation criteria list</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Prompt Template
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter your prompt template..."
            spellCheck={false}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {promptText.length} characters
          </p>
        </div>

        {showPreview && (
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Preview (with example values)
            </label>
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-4 overflow-auto">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {getPreviewText()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
