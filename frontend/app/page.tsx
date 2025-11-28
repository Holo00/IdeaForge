'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Idea } from '@/types';

interface LandingData {
  featuredIdea: Idea | null;
  latestIdeas: Idea[];
  stats: {
    totalIdeas: number;
    averageScore: number;
    generatedToday: number;
  };
}

// Animated counter component
function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1500,
}: {
  value: number;
  decimals?: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(easeOut * value);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration]);

  return <>{decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue)}</>;
}

// Score bar with animation
function AnimatedScoreBar({
  label,
  score,
  maxScore = 10,
  delay = 0,
}: {
  label: string;
  score: number;
  maxScore?: number;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const percentage = (score / maxScore) * 100;
  const getBarColor = () => {
    if (score >= 7) return 'bg-success';
    if (score >= 5) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-secondary w-32 truncate">{label}</span>
      <div className="flex-1 h-2 bg-base rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor()} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: isVisible ? `${percentage}%` : '0%' }}
        />
      </div>
      <span className="text-sm font-bold text-text-primary w-8 text-right">{score}</span>
    </div>
  );
}

// Score badge component
function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const getScoreStyle = () => {
    if (score >= 70) return 'bg-success/20 text-success border-success/30';
    if (score >= 50) return 'bg-warning/20 text-warning border-warning/30';
    return 'bg-error/20 text-error border-error/30';
  };

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center font-bold border ${getScoreStyle()}`}
    >
      {score}
    </div>
  );
}

// Format criteria label
function getCriteriaLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export default function LandingPage() {
  const [data, setData] = useState<LandingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/ideas/landing`);
      if (!response.ok) throw new Error('Failed to fetch landing data');
      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin" />
          <span className="text-text-secondary">Loading amazing ideas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchLandingData();
            }}
            className="px-4 py-2 bg-mint text-base font-medium rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { featuredIdea, latestIdeas, stats } = data || {
    featuredIdea: null,
    latestIdeas: [],
    stats: { totalIdeas: 0, averageScore: 0, generatedToday: 0 },
  };

  return (
    <div className="min-h-screen bg-base">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-mint/5 via-transparent to-coral/5 pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-10 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary mb-4 animate-fade-in">
            <span className="text-mint">Idea</span>Forge
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
            AI-generated startup ideas, scored and evaluated across multiple criteria
          </p>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-16">
          <div className="bg-surface/50 backdrop-blur rounded-xl border border-border-subtle p-4 sm:p-6 text-center group hover:border-mint/30 transition-all">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mint mb-1">
              <AnimatedNumber value={stats.totalIdeas} />
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Ideas Generated</div>
          </div>
          <div className="bg-surface/50 backdrop-blur rounded-xl border border-border-subtle p-4 sm:p-6 text-center group hover:border-warning/30 transition-all">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-warning mb-1">
              <AnimatedNumber value={stats.averageScore} decimals={1} />
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Average Score</div>
          </div>
          <div className="bg-surface/50 backdrop-blur rounded-xl border border-border-subtle p-4 sm:p-6 text-center group hover:border-info/30 transition-all">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-info mb-1">
              <AnimatedNumber value={stats.generatedToday} />
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Generated Today</div>
          </div>
        </div>

        {/* Featured Idea Section */}
        {featuredIdea && (
          <section className="mb-12 sm:mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <span className="text-lg sm:text-xl font-semibold text-text-primary">
                  Today&apos;s Featured Idea
                </span>
                {/* Sparkle effect */}
                <span className="absolute -top-1 -right-6 text-warning animate-pulse">✦</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-surface via-surface to-elevated rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-lg animate-slide-up">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 mb-6">
                <ScoreBadge score={featuredIdea.score} size="xl" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs font-medium bg-mint/10 text-mint rounded-full">
                      {featuredIdea.domain}
                    </span>
                    {featuredIdea.subdomain && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-info/10 text-info rounded-full">
                        {featuredIdea.subdomain}
                      </span>
                    )}
                    {featuredIdea.generationFramework && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-elevated text-text-secondary rounded-full">
                        {featuredIdea.generationFramework}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary mb-3">
                    {featuredIdea.name}
                  </h2>
                </div>
              </div>

              {/* Quick Summary - highlighted quote style */}
              <div className="bg-surface border-l-4 border-mint rounded-r-lg p-4 mb-6">
                <p className="text-sm sm:text-base leading-relaxed italic" style={{ color: '#f0f6fc' }}>
                  &ldquo;{featuredIdea.quickSummary}&rdquo;
                </p>
              </div>

              {/* Problem & Solution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-base/50 rounded-lg p-4 border-l-4 border-coral">
                  <h3 className="text-sm font-semibold text-coral mb-2">Problem</h3>
                  <p className="text-sm text-text-secondary">{featuredIdea.problem}</p>
                </div>
                <div className="bg-base/50 rounded-lg p-4 border-l-4 border-mint">
                  <h3 className="text-sm font-semibold text-mint mb-2">Solution</h3>
                  <p className="text-sm text-text-secondary">{featuredIdea.solution}</p>
                </div>
              </div>

              {/* Concrete Example */}
              {featuredIdea.concreteExample && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-info"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Concrete Example
                  </h3>

                  {/* Step-by-step cards */}
                  <div className="space-y-4">
                    {/* Step 1: Current State */}
                    <div className="bg-coral/5 border border-coral/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center">
                          <span className="text-coral font-bold text-sm">1</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-coral mb-2">
                            Current State (The Problem)
                          </h4>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {featuredIdea.concreteExample.currentState}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow connector */}
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
                          <h4 className="text-sm font-semibold text-mint mb-2">
                            With This Solution
                          </h4>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {featuredIdea.concreteExample.yourSolution}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow connector */}
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
                          <h4 className="text-sm font-semibold text-success mb-2">
                            Key Improvement
                          </h4>
                          <p className="text-sm text-text-secondary leading-relaxed">
                            {featuredIdea.concreteExample.keyImprovement}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Notes */}
              {featuredIdea.quickNotes && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Quick Notes
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Strengths */}
                    <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-success mb-2 uppercase tracking-wide">Strengths</h4>
                      <ul className="space-y-1">
                        {featuredIdea.quickNotes.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-success mt-0.5">+</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-error/5 border border-error/20 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-error mb-2 uppercase tracking-wide">Weaknesses</h4>
                      <ul className="space-y-1">
                        {featuredIdea.quickNotes.weaknesses.slice(0, 3).map((w, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-error mt-0.5">-</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Key Assumptions */}
                    <div className="bg-info/5 border border-info/20 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-info mb-2 uppercase tracking-wide">Key Assumptions</h4>
                      <ul className="space-y-1">
                        {featuredIdea.quickNotes.keyAssumptions.slice(0, 3).map((a, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-info mt-0.5">?</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-warning mb-2 uppercase tracking-wide">Next Steps</h4>
                      <ul className="space-y-1">
                        {featuredIdea.quickNotes.nextSteps.slice(0, 3).map((n, i) => (
                          <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                            <span className="text-warning mt-0.5">→</span>
                            <span>{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              <div className="bg-base/30 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-text-primary mb-3">Score Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(featuredIdea.scores)
                    .slice(0, 6)
                    .map(([key, score], index) => (
                      <AnimatedScoreBar
                        key={key}
                        label={getCriteriaLabel(key)}
                        score={score}
                        delay={index * 100}
                      />
                    ))}
                </div>
              </div>

              {/* Complexity Scores */}
              {featuredIdea.complexityScores && (
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border-subtle">
                  <div className="text-sm">
                    <span className="text-text-muted">Complexity: </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-secondary">Technical</span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-info/20 text-info rounded">
                        {featuredIdea.complexityScores.technical}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-secondary">Regulatory</span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-warning/20 text-warning rounded">
                        {featuredIdea.complexityScores.regulatory}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-text-secondary">Sales</span>
                      <span className="px-2 py-0.5 text-xs font-bold bg-coral/20 text-coral rounded">
                        {featuredIdea.complexityScores.sales}/10
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* View full idea link */}
              <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
                <Link
                  href={`/browse/${featuredIdea.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-mint hover:text-mint-light transition-colors"
                >
                  View Full Details
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Latest Ideas Section */}
        {latestIdeas.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Latest Ideas</h2>
              <Link
                href="/browse"
                className="text-sm text-mint hover:text-mint-light transition-colors flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Horizontal scrolling cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-elevated scrollbar-track-transparent">
              {latestIdeas.map((idea, index) => (
                <Link
                  key={idea.id}
                  href={`/browse/${idea.id}`}
                  className="group bg-surface hover:bg-elevated rounded-xl border border-border-subtle hover:border-mint/30 p-4 transition-all min-w-[260px] max-w-[260px] flex-shrink-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <ScoreBadge score={idea.score} size="sm" />
                    <span className="px-2 py-0.5 text-xs font-medium bg-mint/10 text-mint rounded-full truncate max-w-[120px]">
                      {idea.domain}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-mint transition-colors">
                    {idea.name}
                  </h3>
                  <p className="text-xs text-text-secondary line-clamp-3">{idea.quickSummary}</p>
                  <div className="mt-3 pt-3 border-t border-border-subtle">
                    <span className="text-micro text-text-muted">
                      {new Date(idea.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border-subtle">
          <p className="text-sm text-text-muted">
            Powered by AI - Claude & Gemini
          </p>
          <p className="text-xs text-text-muted mt-1">
            New ideas generated automatically every day
          </p>
        </footer>
      </main>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Custom scrollbar for horizontal scroll */
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }

        .scrollbar-thumb-elevated::-webkit-scrollbar-thumb {
          background-color: var(--color-elevated, #1a1a24);
          border-radius: 3px;
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}
