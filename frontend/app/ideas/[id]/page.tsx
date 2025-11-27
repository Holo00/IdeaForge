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
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-error';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-success/20 text-success';
    if (score >= 50) return 'bg-warning/20 text-warning';
    return 'bg-error/20 text-error';
  };

  const getCriteriaLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const generateMarkdown = (idea: Idea): string => {
    let markdown = `# ${idea.name}\n\n`;
    markdown += `**Domain:** ${idea.domain}\n`;
    markdown += `**Overall Score:** ${idea.score}/100\n`;
    markdown += `**Created:** ${new Date(idea.createdAt).toLocaleString()}\n\n`;
    markdown += `## Quick Summary\n\n${idea.quickSummary}\n\n`;
    markdown += `## Problem\n\n${idea.problem}\n\n`;
    markdown += `## Solution\n\n${idea.solution}\n\n`;
    markdown += `## Concrete Example\n\n`;
    markdown += `### Current State\n${idea.concreteExample.currentState}\n\n`;
    markdown += `### Your Solution\n${idea.concreteExample.yourSolution}\n\n`;
    markdown += `### Key Improvement\n${idea.concreteExample.keyImprovement}\n\n`;
    markdown += `## Evaluation Scores\n\n`;
    Object.entries(idea.scores).forEach(([key, score]) => {
      markdown += `- **${getCriteriaLabel(key)}:** ${score}/10\n`;
    });
    return markdown;
  };

  const exportToMarkdown = () => {
    if (!idea) return;
    const markdown = generateMarkdown(idea);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${idea.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading idea...</span>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-4xl mb-3">:(</div>
          <h1 className="text-lg font-semibold text-text-primary mb-1">Idea Not Found</h1>
          <p className="text-sm text-text-secondary mb-4">{error || "The idea you're looking for doesn't exist."}</p>
          <Link
            href="/ideas"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-mint to-mint-dark text-base font-medium rounded"
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
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/ideas" className="text-xs text-mint hover:text-mint-light flex items-center gap-1 mb-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Ideas
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-text-primary truncate">{idea.name}</h1>
            <p className="text-sm text-text-secondary">{idea.domain}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToMarkdown}
              className="px-3 py-1.5 text-xs font-medium border border-border-default text-text-primary rounded hover:bg-hover transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
            <div className={`text-2xl font-bold ${getScoreBg(idea.score)} px-3 py-1 rounded`}>
              {idea.score}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-surface rounded-md border border-border-subtle p-4 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-2">Quick Summary</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{idea.quickSummary}</p>
      </div>

      {/* Problem & Solution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-surface rounded-md border border-border-subtle p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <span className="text-coral">Problem</span>
          </h2>
          <p className="text-sm text-text-secondary">{idea.problem}</p>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <span className="text-mint">Solution</span>
          </h2>
          <p className="text-sm text-text-secondary">{idea.solution}</p>
        </div>
      </div>

      {/* Concrete Example */}
      <div className="bg-surface rounded-md border border-border-subtle p-4 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Concrete Example</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Current State</h3>
            <p className="text-sm text-text-secondary">{idea.concreteExample.currentState}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Your Solution</h3>
            <p className="text-sm text-text-secondary">{idea.concreteExample.yourSolution}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Key Improvement</h3>
            <p className="text-sm text-text-secondary">{idea.concreteExample.keyImprovement}</p>
          </div>
        </div>
      </div>

      {/* Evaluation Scores */}
      <div className="bg-surface rounded-md border border-border-subtle p-4 mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Evaluation Scores</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(idea.scores).map(([key, score]) => (
            <div key={key} className="bg-elevated rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-secondary">{getCriteriaLabel(key)}</span>
                <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
              </div>
              <div className="w-full bg-base rounded-full h-1.5">
                <div
                  className="bg-mint h-1.5 rounded-full transition-all"
                  style={{ width: `${(score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Details - Collapsible */}
      <details className="bg-surface rounded-md border border-border-subtle mb-4">
        <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-text-primary hover:bg-hover">
          Evaluation Details
        </summary>
        <div className="px-4 pb-4 space-y-4 border-t border-border-subtle pt-4">
          {Object.entries(idea.evaluationDetails).map(([key, detail]) => (
            <div key={key} className="border-l-2 border-mint pl-3">
              <h3 className="text-sm font-medium text-text-primary mb-1">
                {getCriteriaLabel(key)} ({detail.score}/10)
              </h3>
              <p className="text-xs text-text-secondary mb-2">{detail.reasoning}</p>
              {detail.questions && detail.questions.length > 0 && (
                <div className="space-y-2">
                  {detail.questions.map((qa, index) => (
                    <div key={index} className="bg-elevated rounded p-2">
                      <p className="text-xs font-medium text-text-primary mb-0.5">Q: {qa.question}</p>
                      <p className="text-xs text-text-secondary">A: {qa.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </details>

      {/* Quick Notes */}
      {idea.quickNotes && (
        <details className="bg-surface rounded-md border border-border-subtle mb-4">
          <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-text-primary hover:bg-hover">
            Quick Notes
          </summary>
          <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-border-subtle pt-4">
            <div>
              <h3 className="text-xs font-medium text-success uppercase tracking-wide mb-2">Strengths</h3>
              <ul className="space-y-1">
                {idea.quickNotes.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-success">{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-error uppercase tracking-wide mb-2">Weaknesses</h3>
              <ul className="space-y-1">
                {idea.quickNotes.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-error">{w}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-info uppercase tracking-wide mb-2">Key Assumptions</h3>
              <ul className="space-y-1">
                {idea.quickNotes.keyAssumptions.map((a, i) => (
                  <li key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-info">{a}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-medium text-warning uppercase tracking-wide mb-2">Next Steps</h3>
              <ul className="space-y-1">
                {idea.quickNotes.nextSteps.map((n, i) => (
                  <li key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-warning">{n}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}

      {/* Complexity Scores */}
      {idea.complexityScores && (
        <details className="bg-surface rounded-md border border-border-subtle mb-4">
          <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-text-primary hover:bg-hover">
            Execution Complexity ({idea.complexityScores.total}/30)
          </summary>
          <div className="px-4 pb-4 border-t border-border-subtle pt-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-info">{idea.complexityScores.technical}</div>
                <div className="text-xs text-text-muted">Technical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{idea.complexityScores.regulatory}</div>
                <div className="text-xs text-text-muted">Regulatory</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-coral">{idea.complexityScores.sales}</div>
                <div className="text-xs text-text-muted">Sales</div>
              </div>
            </div>
            <div className="w-full bg-base rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  idea.complexityScores.total < 10 ? 'bg-success' :
                  idea.complexityScores.total < 20 ? 'bg-warning' : 'bg-error'
                }`}
                style={{ width: `${(idea.complexityScores.total / 30) * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-2 text-center">
              {idea.complexityScores.total < 10 && 'Low complexity - Quick to execute'}
              {idea.complexityScores.total >= 10 && idea.complexityScores.total < 20 && 'Medium complexity - Requires planning'}
              {idea.complexityScores.total >= 20 && 'High complexity - Major undertaking'}
            </p>
          </div>
        </details>
      )}

      {/* Action Plan */}
      {idea.actionPlan && (
        <details className="bg-surface rounded-md border border-border-subtle mb-4">
          <summary className="px-4 py-3 cursor-pointer text-sm font-semibold text-text-primary hover:bg-hover">
            Action Plan
          </summary>
          <div className="px-4 pb-4 border-t border-border-subtle pt-4 space-y-4">
            {/* Timeline */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-info/10 border border-info/30 rounded p-3 text-center">
                <div className="text-xs text-info font-medium mb-1">MVP Ready</div>
                <div className="text-sm font-bold text-text-primary">{idea.actionPlan.timeline.mvp}</div>
              </div>
              <div className="bg-success/10 border border-success/30 rounded p-3 text-center">
                <div className="text-xs text-success font-medium mb-1">First Revenue</div>
                <div className="text-sm font-bold text-text-primary">{idea.actionPlan.timeline.firstRevenue}</div>
              </div>
              <div className="bg-mint/10 border border-mint/30 rounded p-3 text-center">
                <div className="text-xs text-mint font-medium mb-1">Break-even</div>
                <div className="text-sm font-bold text-text-primary">{idea.actionPlan.timeline.breakeven}</div>
              </div>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Next Steps</h3>
              <div className="space-y-2">
                {idea.actionPlan.nextSteps.map((step) => (
                  <div key={step.step} className="bg-elevated rounded p-3 border-l-2 border-mint">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-primary">{step.step}. {step.title}</span>
                      <span className="text-xs text-text-muted">{step.duration}</span>
                    </div>
                    <p className="text-xs text-text-secondary">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Path */}
            <div className="bg-error/10 border border-error/30 rounded p-3">
              <h3 className="text-xs font-medium text-error uppercase tracking-wide mb-2">Critical Path</h3>
              <ul className="space-y-1">
                {idea.actionPlan.criticalPath.map((item, i) => (
                  <li key={i} className="text-xs text-text-secondary pl-2 border-l-2 border-error">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      )}

      {/* Tags */}
      {idea.tags && idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {idea.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 text-xs bg-mint/10 text-mint rounded">{tag}</span>
          ))}
        </div>
      )}

      {/* Metadata */}
      <div className="text-center text-xs text-text-muted space-y-0.5">
        <p>Created: {new Date(idea.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(idea.updatedAt).toLocaleString()}</p>
        {idea.generationFramework && <p>Framework: {idea.generationFramework}</p>}
      </div>

      {/* Debug Sections */}
      {idea.aiPrompt && (
        <details className="mt-4 bg-surface rounded-md border border-border-subtle">
          <summary className="px-4 py-3 cursor-pointer text-xs font-medium text-text-muted hover:bg-hover">
            AI Prompt (Debug)
          </summary>
          <div className="px-4 pb-4 border-t border-border-subtle pt-4">
            <textarea
              readOnly
              value={idea.aiPrompt}
              className="w-full h-48 p-3 text-xs font-mono bg-base border border-border-subtle rounded text-text-secondary resize-none"
            />
          </div>
        </details>
      )}

      {idea.rawAiResponse && (
        <details className="mt-2 bg-surface rounded-md border border-border-subtle">
          <summary className="px-4 py-3 cursor-pointer text-xs font-medium text-text-muted hover:bg-hover">
            Raw AI Response (Debug)
          </summary>
          <div className="px-4 pb-4 border-t border-border-subtle pt-4">
            <textarea
              readOnly
              value={idea.rawAiResponse}
              className="w-full h-48 p-3 text-xs font-mono bg-base border border-border-subtle rounded text-text-secondary resize-none"
            />
          </div>
        </details>
      )}
    </div>
  );
}
