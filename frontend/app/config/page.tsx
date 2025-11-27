'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProfileSelector from '@/components/config/ProfileSelector';
import FrameworksEditor from '@/components/config/FrameworksEditor';
import CriteriaEditor from '@/components/config/CriteriaEditor';
import DomainsEditor from '@/components/config/DomainsEditor';
import PromptEditor from '@/components/config/PromptEditor';
import SettingsEditor from '@/components/config/SettingsEditor';
import ExtraFiltersEditor from '@/components/config/ExtraFiltersEditor';
import MonetizationModelsEditor from '@/components/config/MonetizationModelsEditor';
import TargetAudiencesEditor from '@/components/config/TargetAudiencesEditor';
import HowItWorksSection from '@/components/config/HowItWorksSection';
import { ConfigProfileProvider } from '@/contexts/ConfigProfileContext';

type ConfigSection = 'domains' | 'frameworks' | 'criteria' | 'settings' | 'prompt' | 'extraFilters' | 'monetization' | 'audiences';

function ConfigPageContent() {
  const [activeSection, setActiveSection] = useState<ConfigSection>('prompt');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-3 inline-flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Configuration
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Configure how ideas are generated and evaluated
              </p>
            </div>

            {/* Configuration Profile Selector */}
            <ProfileSelector activateOnSwitch={false} showManagementButtons={true} />
          </div>
        </div>

        {/* How It Works - Visual Process Diagram */}
        <HowItWorksSection />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden sticky top-24">
              <button
                onClick={() => setActiveSection('prompt')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'prompt'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="font-medium">Prompt Editor</span>
              </button>
              <button
                onClick={() => setActiveSection('frameworks')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'frameworks'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-medium">Frameworks</span>
              </button>
              <button
                onClick={() => setActiveSection('criteria')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'criteria'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                <span className="font-medium">Criteria</span>
              </button>
              <button
                onClick={() => setActiveSection('domains')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'domains'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span className="font-medium">Domains</span>
              </button>
              <button
                onClick={() => setActiveSection('monetization')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'monetization'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">Monetization</span>
              </button>
              <button
                onClick={() => setActiveSection('audiences')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'audiences'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-medium">Audiences</span>
              </button>
              <button
                onClick={() => setActiveSection('extraFilters')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'extraFilters'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="font-medium">Extra Filters</span>
              </button>
              <button
                onClick={() => setActiveSection('settings')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'settings'
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border-l-4 border-blue-600'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-l-4 border-transparent'
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="font-medium">Settings</span>
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeSection === 'frameworks' && <FrameworksEditor />}
            {activeSection === 'criteria' && <CriteriaEditor />}
            {activeSection === 'prompt' && <PromptEditor />}
            {activeSection === 'domains' && <DomainsEditor />}
            {activeSection === 'settings' && <SettingsEditor />}
            {activeSection === 'extraFilters' && <ExtraFiltersEditor />}
            {activeSection === 'monetization' && <MonetizationModelsEditor />}
            {activeSection === 'audiences' && <TargetAudiencesEditor />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ConfigPage() {
  return (
    <ConfigProfileProvider>
      <ConfigPageContent />
    </ConfigProfileProvider>
  );
}
