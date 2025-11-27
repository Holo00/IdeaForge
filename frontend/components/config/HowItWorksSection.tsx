'use client';

import { useState } from 'react';

export default function HowItWorksSection() {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setShowHowItWorks(!showHowItWorks)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              How Idea Generation Works
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Click to {showHowItWorks ? 'hide' : 'show'} the process diagram
            </p>
          </div>
        </div>
        <svg
          className={`w-6 h-6 text-gray-400 dark:text-gray-300 transition-transform ${
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
        <div className="px-6 pb-6 border-t dark:border-gray-700">
          <div className="pt-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
              <strong className="text-blue-900 dark:text-blue-200">Summary:</strong> The system builds a custom AI prompt using your editable template,
              gives the AI multiple options to choose from (frameworks, domains, problems, solutions), and receives back a comprehensive, evaluated business idea with deep analysis.
            </p>

            {/* Step 1 */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Load Configuration & Build Prompt
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    The backend loads your configuration files and builds a custom AI prompt. It randomly selects 3 generation frameworks, 3 domains, 3 problems, and 3 solutions to give the AI multiple options.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm font-mono">
                    <div className="text-gray-700 dark:text-gray-200 mb-2">
                      <strong>Frameworks:</strong> Jobs-to-be-Done, Lean Canvas, Blue Ocean Strategy
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 mb-2">
                      <strong>Domains:</strong> Healthcare, FinTech, Education
                    </div>
                    <div className="text-gray-700 dark:text-gray-200 mb-2">
                      <strong>Problems:</strong> Time-consuming, Expensive, Complex
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                      <strong>Solutions:</strong> Automation, Marketplace, AI-powered
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 The prompt template is fully customizable in the <strong>Prompt Editor</strong> tab above.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Give AI Multiple Options
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Instead of forcing specific constraints, the AI receives 3 options for each category and picks the best combination for a compelling business idea.
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-sm text-green-900 dark:text-green-200">
                      <strong>Why this works:</strong> Giving the AI choices (rather than rigid constraints) leads to more creative, coherent ideas. The AI can select the framework that best fits the domain, and the problem-solution pairing that makes the most sense.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    AI Generates Comprehensive Idea
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    The AI analyzes all options, picks the best combination, and generates a complete business idea with deep analysis.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <strong className="text-gray-900 dark:text-gray-100">Basic Info:</strong>
                      <ul className="text-gray-600 dark:text-gray-300 mt-1 space-y-1 text-xs">
                        <li>• Name, domain, problem, solution</li>
                        <li>• Quick summary (elevator pitch)</li>
                        <li>• Concrete example with metrics</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <strong className="text-gray-900 dark:text-gray-100">Idea Components:</strong>
                      <ul className="text-gray-600 dark:text-gray-300 mt-1 space-y-1 text-xs">
                        <li>• Monetization model</li>
                        <li>• Target audience</li>
                        <li>• Technology stack</li>
                        <li>• Market size estimate</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <strong className="text-gray-900 dark:text-gray-100">24 Evaluation Q&As:</strong>
                      <ul className="text-gray-600 dark:text-gray-300 mt-1 space-y-1 text-xs">
                        <li>• 8 criteria (Problem, Market, etc.)</li>
                        <li>• 3 questions per criterion</li>
                        <li>• Detailed answers for each</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded">
                      <strong className="text-gray-900 dark:text-gray-100">Quick Notes:</strong>
                      <ul className="text-gray-600 dark:text-gray-300 mt-1 space-y-1 text-xs">
                        <li>• Strengths (3-5 points)</li>
                        <li>• Weaknesses (3-5 points)</li>
                        <li>• Key assumptions (3-5)</li>
                        <li>• Next steps (3-5)</li>
                        <li>• References (3-5)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="mb-0">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Calculate Score & Save to Database
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    The backend calculates a weighted total score and saves everything to PostgreSQL with full-text search and semantic embeddings.
                  </p>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border-l-4 border-orange-500">
                    <p className="text-sm text-orange-900 dark:text-orange-200 mb-2">
                      <strong>Weighted Scoring Example:</strong>
                    </p>
                    <div className="font-mono text-xs text-orange-800 dark:text-orange-300">
                      Problem Severity (9) × 20% = 1.8<br />
                      Market Size (8) × 20% = 1.6<br />
                      Competition (6) × 15% = 0.9<br />
                      Monetization (9) × 15% = 1.35<br />
                      Technical Feasibility (7) × 10% = 0.7<br />
                      Personal Interest (8) × 10% = 0.8<br />
                      Unfair Advantage (5) × 5% = 0.25<br />
                      Time to Market (6) × 5% = 0.3<br />
                      <strong>Total Score = 7.7 / 10</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What You Can Edit */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                What You Can Edit Here
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">1. Prompt Editor</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Customize the AI prompt template and preview changes</p>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">2. Generation Frameworks</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Enable/disable frameworks, edit descriptions and examples</p>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">3. Evaluation Criteria</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Modify scoring criteria, weights, and decision thresholds</p>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">4. Business Domains</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Add/edit domains and subdomains for idea generation</p>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">5. Generation Settings</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Configure AI provider, model, temperature, and token limits</p>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-gray-100">6. API Keys</strong>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Manage API keys for Claude, OpenAI, and Gemini</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
