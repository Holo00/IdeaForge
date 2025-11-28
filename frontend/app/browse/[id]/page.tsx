'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Idea } from '@/types';

export default function PublicIdeaDetailPage() {
  const params = useParams();
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/ideas/${id}`);
      if (!response.ok) throw new Error('Failed to load idea');
      const data = await response.json();
      setIdea(data.data);
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
    if (score >= 70) return 'bg-success/20 text-success border-success/30';
    if (score >= 50) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-error/20 text-error border-error/30';
  };

  const getCriteriaLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading idea...</span>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">:(</div>
          <h1 className="text-xl font-semibold text-text-primary mb-2">Idea Not Found</h1>
          <p className="text-sm text-text-secondary mb-6">{error || "The idea you're looking for doesn't exist."}</p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-mint to-mint-dark text-base font-medium rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur border-b border-border-subtle sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold">
                <span className="text-mint">Idea</span>
                <span className="text-text-primary">Forge</span>
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/browse" className="text-sm text-text-secondary hover:text-mint transition-colors">
                Browse
              </Link>
              <Link href="/" className="text-sm text-text-secondary hover:text-mint transition-colors">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
        {/* Back Link */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-1 text-sm text-mint hover:text-mint-light mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Browse
        </Link>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
          <div
            className={`w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-bold border ${getScoreBg(idea.score)}`}
          >
            {idea.score}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-medium bg-mint/10 text-mint rounded-full">
                {idea.domain}
              </span>
              {idea.subdomain && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-info/10 text-info rounded-full">
                  {idea.subdomain}
                </span>
              )}
              {idea.generationFramework && (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-elevated text-text-secondary rounded-full">
                  {idea.generationFramework}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{idea.name}</h1>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-surface border-l-4 border-mint rounded-r-lg p-5 mb-6">
          <p className="text-base leading-relaxed" style={{ color: '#f0f6fc' }}>
            {idea.quickSummary}
          </p>
        </div>

        {/* Problem & Solution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-border-subtle p-5 border-l-4 border-l-coral">
            <h2 className="text-sm font-semibold text-coral mb-3 uppercase tracking-wide">Problem</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{idea.problem}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border-subtle p-5 border-l-4 border-l-mint">
            <h2 className="text-sm font-semibold text-mint mb-3 uppercase tracking-wide">Solution</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{idea.solution}</p>
          </div>
        </div>

        {/* Concrete Example */}
        <div className="bg-surface rounded-xl border border-border-subtle p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            Concrete Example
          </h2>

          <div className="space-y-4">
            {/* Step 1: Current State */}
            <div className="bg-coral/5 border border-coral/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center">
                  <span className="text-coral font-bold text-sm">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-coral mb-2">Current State</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {idea.concreteExample.currentState}
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Step 2: With Solution */}
            <div className="bg-mint/5 border border-mint/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-mint/20 rounded-full flex items-center justify-center">
                  <span className="text-mint font-bold text-sm">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-mint mb-2">With This Solution</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {idea.concreteExample.yourSolution}
                  </p>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Step 3: Key Improvement */}
            <div className="bg-success/5 border border-success/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-success mb-2">Key Improvement</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {idea.concreteExample.keyImprovement}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Scores */}
        <div className="bg-surface rounded-xl border border-border-subtle p-5 mb-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Evaluation Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(idea.scores).map(([key, score]) => (
              <div key={key} className="bg-elevated rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary truncate">{getCriteriaLabel(key)}</span>
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

        {/* Evaluation Details */}
        <details className="bg-surface rounded-xl border border-border-subtle mb-6">
          <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text-primary hover:bg-elevated rounded-xl">
            Evaluation Details
          </summary>
          <div className="px-5 pb-5 space-y-4 border-t border-border-subtle pt-4">
            {Object.entries(idea.evaluationDetails).map(([key, detail]) => (
              <div key={key} className="border-l-2 border-mint pl-4">
                <h3 className="text-sm font-medium text-text-primary mb-1">
                  {getCriteriaLabel(key)} ({detail.score}/10)
                </h3>
                <p className="text-sm text-text-secondary mb-2">{detail.reasoning}</p>
                {detail.questions && detail.questions.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {detail.questions.map((qa, index) => (
                      <div key={index} className="bg-elevated rounded-lg p-3">
                        <p className="text-xs font-medium text-text-primary mb-1">Q: {qa.question}</p>
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
          <details className="bg-surface rounded-xl border border-border-subtle mb-6">
            <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text-primary hover:bg-elevated rounded-xl">
              Quick Notes
            </summary>
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border-subtle pt-4">
              <div>
                <h3 className="text-xs font-medium text-success uppercase tracking-wide mb-2">Strengths</h3>
                <ul className="space-y-1">
                  {idea.quickNotes.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-text-secondary pl-3 border-l-2 border-success">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium text-error uppercase tracking-wide mb-2">Weaknesses</h3>
                <ul className="space-y-1">
                  {idea.quickNotes.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-text-secondary pl-3 border-l-2 border-error">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium text-info uppercase tracking-wide mb-2">Key Assumptions</h3>
                <ul className="space-y-1">
                  {idea.quickNotes.keyAssumptions.map((a, i) => (
                    <li key={i} className="text-sm text-text-secondary pl-3 border-l-2 border-info">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-medium text-warning uppercase tracking-wide mb-2">Next Steps</h3>
                <ul className="space-y-1">
                  {idea.quickNotes.nextSteps.map((n, i) => (
                    <li key={i} className="text-sm text-text-secondary pl-3 border-l-2 border-warning">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        )}

        {/* Complexity Scores */}
        {idea.complexityScores && (
          <details className="bg-surface rounded-xl border border-border-subtle mb-6">
            <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text-primary hover:bg-elevated rounded-xl">
              Execution Complexity ({idea.complexityScores.total}/30)
            </summary>
            <div className="px-5 pb-5 border-t border-border-subtle pt-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-info">{idea.complexityScores.technical}</div>
                  <div className="text-xs text-text-muted">Technical</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-warning">{idea.complexityScores.regulatory}</div>
                  <div className="text-xs text-text-muted">Regulatory</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-coral">{idea.complexityScores.sales}</div>
                  <div className="text-xs text-text-muted">Sales</div>
                </div>
              </div>
              <div className="w-full bg-base rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    idea.complexityScores.total < 10
                      ? 'bg-success'
                      : idea.complexityScores.total < 20
                        ? 'bg-warning'
                        : 'bg-error'
                  }`}
                  style={{ width: `${(idea.complexityScores.total / 30) * 100}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary mt-3 text-center">
                {idea.complexityScores.total < 10 && 'Low complexity - Quick to execute'}
                {idea.complexityScores.total >= 10 &&
                  idea.complexityScores.total < 20 &&
                  'Medium complexity - Requires planning'}
                {idea.complexityScores.total >= 20 && 'High complexity - Major undertaking'}
              </p>
            </div>
          </details>
        )}

        {/* Action Plan */}
        {idea.actionPlan && (
          <details className="bg-surface rounded-xl border border-border-subtle mb-6">
            <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text-primary hover:bg-elevated rounded-xl">
              Action Plan
            </summary>
            <div className="px-5 pb-5 border-t border-border-subtle pt-4 space-y-4">
              {/* Timeline */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-info/10 border border-info/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-info font-medium mb-1">MVP Ready</div>
                  <div className="text-sm font-bold text-text-primary">{idea.actionPlan.timeline.mvp}</div>
                </div>
                <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-success font-medium mb-1">First Revenue</div>
                  <div className="text-sm font-bold text-text-primary">{idea.actionPlan.timeline.firstRevenue}</div>
                </div>
                <div className="bg-mint/10 border border-mint/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-mint font-medium mb-1">Break-even</div>
                  <div className="text-sm font-bold text-text-primary">{idea.actionPlan.timeline.breakeven}</div>
                </div>
              </div>

              {/* Next Steps */}
              <div>
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Next Steps</h3>
                <div className="space-y-2">
                  {idea.actionPlan.nextSteps.map((step) => (
                    <div key={step.step} className="bg-elevated rounded-lg p-4 border-l-2 border-mint">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-text-primary">
                          {step.step}. {step.title}
                        </span>
                        <span className="text-xs text-text-muted">{step.duration}</span>
                      </div>
                      <p className="text-sm text-text-secondary">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Path */}
              <div className="bg-error/10 border border-error/30 rounded-lg p-4">
                <h3 className="text-xs font-medium text-error uppercase tracking-wide mb-2">Critical Path</h3>
                <ul className="space-y-1">
                  {idea.actionPlan.criticalPath.map((item, i) => (
                    <li key={i} className="text-sm text-text-secondary pl-3 border-l-2 border-error">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {idea.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 text-sm bg-mint/10 text-mint rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="text-center text-sm text-text-muted space-y-1 pt-6 border-t border-border-subtle">
          <p>Created: {new Date(idea.createdAt).toLocaleString()}</p>
          {idea.generationFramework && <p>Framework: {idea.generationFramework}</p>}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-8 text-center">
          <p className="text-sm text-text-muted">Powered by AI - Claude & Gemini</p>
        </div>
      </footer>
    </div>
  );
}
