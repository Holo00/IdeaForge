'use client';

import { useState } from 'react';

export default function HowItWorksSection() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="mb-4 bg-surface rounded-md border border-border-subtle overflow-hidden">
      <button
        onClick={() => setShowHowItWorks(!showHowItWorks)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-info/10 rounded">
            <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-sm font-medium text-text-primary">
              How Idea Generation Works
            </h2>
            <p className="text-xs text-text-muted">
              Click to {showHowItWorks ? 'hide' : 'show'} the process diagram
            </p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-text-muted transition-transform ${
            showHowItWorks ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showHowItWorks && (
        <div className="px-4 pb-4 border-t border-border-subtle">
          <div className="pt-4">
            <p className="text-xs text-text-secondary mb-4 bg-info/5 p-3 rounded border-l-2 border-info">
              <strong className="text-info">Summary:</strong> The system builds a custom AI prompt using your editable template,
              gives the AI multiple options to choose from (frameworks, domains, problems, solutions), and receives back a comprehensive, evaluated business idea with deep analysis.
            </p>

            {/* Step 1 */}
            <div className="mb-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-info text-base rounded-full flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    Load Configuration & Build Prompt
                  </h3>
                  <p className="text-xs text-text-secondary mb-2">
                    The backend loads your configuration files and builds a custom AI prompt. It randomly selects 3 generation frameworks, 3 domains, 3 problems, and 3 solutions to give the AI multiple options.
                  </p>
                  <div className="bg-base p-3 rounded text-xs font-mono">
                    <div className="text-text-secondary mb-1">
                      <strong className="text-text-primary">Frameworks:</strong> Jobs-to-be-Done, Lean Canvas, Blue Ocean Strategy
                    </div>
                    <div className="text-text-secondary mb-1">
                      <strong className="text-text-primary">Domains:</strong> Healthcare, FinTech, Education
                    </div>
                    <div className="text-text-secondary mb-1">
                      <strong className="text-text-primary">Problems:</strong> Time-consuming, Expensive, Complex
                    </div>
                    <div className="text-text-secondary">
                      <strong className="text-text-primary">Solutions:</strong> Automation, Marketplace, AI-powered
                    </div>
                  </div>
                  <p className="text-micro text-text-muted mt-1.5">
                    The prompt template is fully customizable in the <strong>Prompt</strong> tab above.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-success text-base rounded-full flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    Give AI Multiple Options
                  </h3>
                  <p className="text-xs text-text-secondary mb-2">
                    Instead of forcing specific constraints, the AI receives 3 options for each category and picks the best combination for a compelling business idea.
                  </p>
                  <div className="bg-success/5 p-3 rounded border-l-2 border-success">
                    <p className="text-xs text-success">
                      <strong>Why this works:</strong> Giving the AI choices (rather than rigid constraints) leads to more creative, coherent ideas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-mint text-base rounded-full flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    AI Generates Comprehensive Idea
                  </h3>
                  <p className="text-xs text-text-secondary mb-2">
                    The AI analyzes all options, picks the best combination, and generates a complete business idea with deep analysis.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-base p-2 rounded">
                      <strong className="text-text-primary text-micro">Basic Info:</strong>
                      <ul className="text-text-muted mt-1 space-y-0.5 text-micro">
                        <li>• Name, domain, problem, solution</li>
                        <li>• Quick summary (elevator pitch)</li>
                        <li>• Concrete example with metrics</li>
                      </ul>
                    </div>
                    <div className="bg-base p-2 rounded">
                      <strong className="text-text-primary text-micro">Idea Components:</strong>
                      <ul className="text-text-muted mt-1 space-y-0.5 text-micro">
                        <li>• Monetization model</li>
                        <li>• Target audience</li>
                        <li>• Technology stack</li>
                      </ul>
                    </div>
                    <div className="bg-base p-2 rounded">
                      <strong className="text-text-primary text-micro">24 Evaluation Q&As:</strong>
                      <ul className="text-text-muted mt-1 space-y-0.5 text-micro">
                        <li>• 8 criteria, 3 questions each</li>
                        <li>• Detailed answers</li>
                      </ul>
                    </div>
                    <div className="bg-base p-2 rounded">
                      <strong className="text-text-primary text-micro">Quick Notes:</strong>
                      <ul className="text-text-muted mt-1 space-y-0.5 text-micro">
                        <li>• Strengths, weaknesses</li>
                        <li>• Assumptions, next steps</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="mb-0">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 bg-warning text-base rounded-full flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary mb-1">
                    Calculate Score & Save to Database
                  </h3>
                  <p className="text-xs text-text-secondary mb-2">
                    The backend calculates a weighted total score and saves everything to PostgreSQL with full-text search and semantic embeddings.
                  </p>
                  <div className="bg-warning/5 p-3 rounded border-l-2 border-warning">
                    <p className="text-micro text-warning mb-1">
                      <strong>Weighted Scoring Example:</strong>
                    </p>
                    <div className="font-mono text-micro text-warning/80">
                      Problem (9) × 20% + Market (8) × 20% + Competition (6) × 15% + ...
                      <strong className="block mt-1">Total Score = 77 / 100</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What You Can Edit */}
            <div className="mt-5 bg-mint/5 p-4 rounded border border-mint/20">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-mint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                What You Can Edit Here
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <strong className="text-text-primary">Prompt Editor</strong>
                  <p className="text-text-muted text-micro mt-0.5">AI prompt template</p>
                </div>
                <div>
                  <strong className="text-text-primary">Frameworks</strong>
                  <p className="text-text-muted text-micro mt-0.5">Enable/disable frameworks</p>
                </div>
                <div>
                  <strong className="text-text-primary">Criteria</strong>
                  <p className="text-text-muted text-micro mt-0.5">Scoring weights</p>
                </div>
                <div>
                  <strong className="text-text-primary">Domains</strong>
                  <p className="text-text-muted text-micro mt-0.5">Business categories</p>
                </div>
                <div>
                  <strong className="text-text-primary">Settings</strong>
                  <p className="text-text-muted text-micro mt-0.5">AI model config</p>
                </div>
                <div>
                  <strong className="text-text-primary">Filters</strong>
                  <p className="text-text-muted text-micro mt-0.5">Extra constraints</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
