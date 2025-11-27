'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Idea } from '@/types';
import { api } from '@/lib/api';

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchIdea(params.id as string);
    }
  }, [params.id]);

  const fetchIdea = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getIdea(id);
      setIdea(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load idea');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600 dark:text-green-400';
    if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getCriteriaLabel = (key: string) => {
    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  const generateMarkdown = (idea: Idea): string => {
    let markdown = `# ${idea.name}\n\n`;
    markdown += `**Domain:** ${idea.domain}\n`;
    markdown += `**Overall Score:** ${idea.score}/100\n`;
    markdown += `**Created:** ${new Date(idea.createdAt).toLocaleString()}\n\n`;

    // Quick Summary
    markdown += `## Quick Summary\n\n${idea.quickSummary}\n\n`;

    // Problem & Solution
    markdown += `## Problem\n\n${idea.problem}\n\n`;
    markdown += `## Solution\n\n${idea.solution}\n\n`;

    // Concrete Example
    markdown += `## Concrete Example\n\n`;
    markdown += `### Current State\n${idea.concreteExample.currentState}\n\n`;
    markdown += `### Your Solution\n${idea.concreteExample.yourSolution}\n\n`;
    markdown += `### Key Improvement\n${idea.concreteExample.keyImprovement}\n\n`;

    // Evaluation Scores
    markdown += `## Evaluation Scores\n\n`;
    Object.entries(idea.scores).forEach(([key, score]) => {
      markdown += `- **${getCriteriaLabel(key)}:** ${score}/10\n`;
    });
    markdown += `\n`;

    // Evaluation Details
    markdown += `## Evaluation Details\n\n`;
    Object.entries(idea.evaluationDetails).forEach(([key, detail]) => {
      markdown += `### ${getCriteriaLabel(key)} (${detail.score}/10)\n\n`;
      markdown += `${detail.reasoning}\n\n`;

      if (detail.questions && detail.questions.length > 0) {
        markdown += `**Questions & Answers:**\n\n`;
        detail.questions.forEach((qa) => {
          markdown += `**Q:** ${qa.question}\n`;
          markdown += `**A:** ${qa.answer}\n\n`;
        });
      }
    });

    // Quick Notes
    if (idea.quickNotes) {
      markdown += `## Quick Notes\n\n`;

      markdown += `### Strengths\n\n`;
      idea.quickNotes.strengths.forEach(strength => {
        markdown += `- ${strength}\n`;
      });
      markdown += `\n`;

      markdown += `### Weaknesses\n\n`;
      idea.quickNotes.weaknesses.forEach(weakness => {
        markdown += `- ${weakness}\n`;
      });
      markdown += `\n`;

      markdown += `### Key Assumptions\n\n`;
      idea.quickNotes.keyAssumptions.forEach(assumption => {
        markdown += `- ${assumption}\n`;
      });
      markdown += `\n`;

      markdown += `### Next Steps\n\n`;
      idea.quickNotes.nextSteps.forEach(step => {
        markdown += `- ${step}\n`;
      });
      markdown += `\n`;

      if (idea.quickNotes.references.length > 0) {
        markdown += `### References\n\n`;
        idea.quickNotes.references.forEach(reference => {
          markdown += `- ${reference}\n`;
        });
        markdown += `\n`;
      }
    }

    // Execution Complexity
    if (idea.complexityScores) {
      markdown += `## Execution Complexity\n\n`;
      markdown += `- **Technical:** ${idea.complexityScores.technical}/10 (How hard to build)\n`;
      markdown += `- **Regulatory:** ${idea.complexityScores.regulatory}/10 (How much red tape)\n`;
      markdown += `- **Sales:** ${idea.complexityScores.sales}/10 (How hard to sell)\n`;
      markdown += `- **Overall Complexity:** ${idea.complexityScores.total}/30\n\n`;

      if (idea.complexityScores.total < 10) {
        markdown += `✅ Low complexity - Quick to execute\n\n`;
      } else if (idea.complexityScores.total < 20) {
        markdown += `⚠️ Medium complexity - Requires planning\n\n`;
      } else {
        markdown += `🚨 High complexity - Major undertaking\n\n`;
      }
    }

    // Action Plan
    if (idea.actionPlan) {
      markdown += `## Action Plan\n\n`;

      markdown += `### Next Steps\n\n`;
      idea.actionPlan.nextSteps.forEach(step => {
        markdown += `**${step.step}. ${step.title}** (${step.duration})\n\n`;
        markdown += `${step.description}\n\n`;

        if (step.blockers && step.blockers.length > 0) {
          markdown += `⚠️ **Blockers:**\n`;
          step.blockers.forEach(blocker => {
            markdown += `- ${blocker}\n`;
          });
          markdown += `\n`;
        }

        markdown += `✓ **Success Metric:** ${step.successMetric}\n\n`;
      });

      markdown += `### Required Resources\n\n`;

      markdown += `**Technical:**\n`;
      idea.actionPlan.requiredResources.technical.forEach(tech => {
        markdown += `- ${tech}\n`;
      });
      markdown += `\n`;

      markdown += `**Team:**\n`;
      idea.actionPlan.requiredResources.team.forEach(role => {
        markdown += `- ${role}\n`;
      });
      markdown += `\n`;

      markdown += `**Financial:** ${idea.actionPlan.requiredResources.financial}\n\n`;

      if (idea.actionPlan.requiredResources.legal.length > 0) {
        markdown += `**Legal/Compliance:**\n`;
        idea.actionPlan.requiredResources.legal.forEach(legal => {
          markdown += `- ${legal}\n`;
        });
        markdown += `\n`;
      }

      markdown += `### Timeline Estimates\n\n`;
      markdown += `- **MVP Ready:** ${idea.actionPlan.timeline.mvp}\n`;
      markdown += `- **First Revenue:** ${idea.actionPlan.timeline.firstRevenue}\n`;
      markdown += `- **Break-even:** ${idea.actionPlan.timeline.breakeven}\n\n`;

      markdown += `### Critical Path\n\n`;
      markdown += `These are the most critical/risky items that could block or delay execution:\n\n`;
      idea.actionPlan.criticalPath.forEach(item => {
        markdown += `- ${item}\n`;
      });
      markdown += `\n`;
    }

    // Tags
    if (idea.tags && idea.tags.length > 0) {
      markdown += `## Tags\n\n`;
      markdown += idea.tags.join(', ') + `\n\n`;
    }

    // Metadata
    markdown += `---\n\n`;
    markdown += `**Generated:** ${new Date(idea.createdAt).toLocaleString()}\n`;
    markdown += `**Last Updated:** ${new Date(idea.updatedAt).toLocaleString()}\n`;
    if (idea.generationFramework) {
      markdown += `**Framework:** ${idea.generationFramework}\n`;
    }

    return markdown;
  };

  const exportToMarkdown = () => {
    if (!idea) return;

    const markdown = generateMarkdown(idea);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename from idea name (sanitized)
    const filename = `${idea.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 dark:border-primary-400 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Idea Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The idea you\'re looking for doesn\'t exist.'}</p>
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ideas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/ideas"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Ideas
          </Link>
          <div className="mt-2 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{idea.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{idea.domain}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={exportToMarkdown}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Export to Markdown file"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to MD
              </button>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(idea.score / 10)}`}>
                  {idea.score}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Quick Summary</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{idea.quickSummary}</p>
        </div>

        {/* Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Problem
            </h2>
            <p className="text-gray-700 dark:text-gray-300">{idea.problem}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Solution
            </h2>
            <p className="text-gray-700 dark:text-gray-300">{idea.solution}</p>
          </div>
        </div>

        {/* Concrete Example */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Concrete Example</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Current State</h3>
              <p className="text-gray-700 dark:text-gray-300">{idea.concreteExample.currentState}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Solution</h3>
              <p className="text-gray-700 dark:text-gray-300">{idea.concreteExample.yourSolution}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Improvement</h3>
              <p className="text-gray-700 dark:text-gray-300">{idea.concreteExample.keyImprovement}</p>
            </div>
          </div>
        </div>

        {/* Evaluation Scores */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Evaluation Scores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(idea.scores).map(([key, score]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getCriteriaLabel(key)}
                  </span>
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-primary-600 dark:bg-primary-400 h-2 rounded-full transition-all"
                    style={{ width: `${(score / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Evaluation Details</h2>
          <div className="space-y-6">
            {Object.entries(idea.evaluationDetails).map(([key, detail]) => (
              <div key={key} className="border-l-4 border-primary-500 pl-4 py-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {getCriteriaLabel(key)} ({detail.score}/10)
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{detail.reasoning}</p>

                {/* Questions & Answers */}
                {detail.questions && detail.questions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {detail.questions.map((qa, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Q: {qa.question}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          A: {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Notes */}
        {idea.quickNotes && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Notes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {idea.quickNotes.strengths.map((strength, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-green-500">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  Weaknesses
                </h3>
                <ul className="space-y-2">
                  {idea.quickNotes.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-red-500">
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Key Assumptions */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  Key Assumptions
                </h3>
                <ul className="space-y-2">
                  {idea.quickNotes.keyAssumptions.map((assumption, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-blue-500">
                      {assumption}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  Next Steps
                </h3>
                <ul className="space-y-2">
                  {idea.quickNotes.nextSteps.map((step, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-purple-500">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {/* References */}
              <div className="md:col-span-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  References
                </h3>
                <ul className="space-y-2">
                  {idea.quickNotes.references.map((reference, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-gray-500">
                      {reference}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Execution Complexity */}
        {idea.complexityScores && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Execution Complexity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Technical Complexity */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  Technical
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {idea.complexityScores.technical}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all"
                        style={{ width: `${(idea.complexityScores.technical / 10) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How hard to build</p>
                  </div>
                </div>
              </div>

              {/* Regulatory Complexity */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">📜</span>
                  Regulatory
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {idea.complexityScores.regulatory}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-purple-600 dark:bg-purple-400 h-3 rounded-full transition-all"
                        style={{ width: `${(idea.complexityScores.regulatory / 10) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How much red tape</p>
                  </div>
                </div>
              </div>

              {/* Sales Complexity */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <span className="text-xl">💼</span>
                  Sales
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {idea.complexityScores.sales}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                      <div
                        className="bg-orange-600 dark:bg-orange-400 h-3 rounded-full transition-all"
                        style={{ width: `${(idea.complexityScores.sales / 10) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How hard to sell</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Complexity */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Overall Complexity</h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  {idea.complexityScores.total}<span className="text-lg text-gray-500 dark:text-gray-400">/30</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      idea.complexityScores.total < 10
                        ? 'bg-green-600'
                        : idea.complexityScores.total < 20
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${(idea.complexityScores.total / 30) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {idea.complexityScores.total < 10 && '✅ Low complexity - Quick to execute'}
                  {idea.complexityScores.total >= 10 && idea.complexityScores.total < 20 && '⚠️ Medium complexity - Requires planning'}
                  {idea.complexityScores.total >= 20 && '🚨 High complexity - Major undertaking'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Plan */}
        {idea.actionPlan && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Action Plan</h2>

            {/* Next Steps */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Next Steps
              </h3>
              <div className="space-y-4">
                {idea.actionPlan.nextSteps.map((step) => (
                  <div key={step.step} className="border-l-4 border-primary-500 pl-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-r">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {step.step}. {step.title}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                        {step.duration}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{step.description}</p>

                    {step.blockers && step.blockers.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">⚠️ Blockers:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 ml-4 list-disc">
                          {step.blockers.map((blocker, idx) => (
                            <li key={idx}>{blocker}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-2">
                      <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">✓ Success Metric:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{step.successMetric}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Required Resources */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-xl">🛠️</span>
                Required Resources
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Technical */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="text-lg">💻</span>
                    Technical
                  </h4>
                  <ul className="space-y-1">
                    {idea.actionPlan.requiredResources.technical.map((tech, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-blue-500">
                        {tech}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Team */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="text-lg">👥</span>
                    Team
                  </h4>
                  <ul className="space-y-1">
                    {idea.actionPlan.requiredResources.team.map((role, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-purple-500">
                        {role}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Financial */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    Financial
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{idea.actionPlan.requiredResources.financial}</p>
                </div>

                {/* Legal */}
                {idea.actionPlan.requiredResources.legal.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                      <span className="text-lg">⚖️</span>
                      Legal/Compliance
                    </h4>
                    <ul className="space-y-1">
                      {idea.actionPlan.requiredResources.legal.map((legal, idx) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-red-500">
                          {legal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                Timeline Estimates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">MVP Ready</h4>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{idea.actionPlan.timeline.mvp}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">First Revenue</h4>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">{idea.actionPlan.timeline.firstRevenue}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                  <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Break-even</h4>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{idea.actionPlan.timeline.breakeven}</p>
                </div>
              </div>
            </div>

            {/* Critical Path */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <span className="text-xl">🚨</span>
                Critical Path
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  These are the most critical/risky items that could block or delay execution:
                </p>
                <ul className="space-y-2">
                  {idea.actionPlan.criticalPath.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-4 border-red-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Created: {new Date(idea.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(idea.updatedAt).toLocaleString()}</p>
          {idea.generationFramework && <p>Framework: {idea.generationFramework}</p>}
        </div>

        {/* AI Prompt (Collapsible Debug Section) */}
        {idea.aiPrompt && (
          <details className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <summary className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400">
              AI Prompt (Debug)
            </summary>
            <div className="mt-4">
              <textarea
                readOnly
                value={idea.aiPrompt}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded"
              />
            </div>
          </details>
        )}

        {/* Raw AI Response (Collapsible Debug Section) */}
        {idea.rawAiResponse && (
          <details className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <summary className="cursor-pointer text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400">
              Raw AI Response (Debug)
            </summary>
            <div className="mt-4">
              <textarea
                readOnly
                value={idea.rawAiResponse}
                className="w-full h-96 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded"
              />
            </div>
          </details>
        )}
      </main>
    </div>
  );
}
