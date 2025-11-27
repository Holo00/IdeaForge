'use client';

import { useState } from 'react';
import Link from 'next/link';
import ApiKeysEditor from '@/components/config/ApiKeysEditor';
import AIModelsEditor from '@/components/settings/AIModelsEditor';

type SettingsSection = 'apiKeys' | 'aiModels';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('apiKeys');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
                System Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Manage global settings that apply across all configuration profiles
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Admin Only</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden sticky top-24">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Global Settings
                </h3>
              </div>
              <button
                onClick={() => setActiveSection('apiKeys')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'apiKeys'
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
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span className="font-medium">API Keys</span>
              </button>
              <button
                onClick={() => setActiveSection('aiModels')}
                className={`w-full px-6 py-4 text-left flex items-center gap-3 transition-colors ${
                  activeSection === 'aiModels'
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">AI Models</span>
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {activeSection === 'apiKeys' && <ApiKeysEditor />}
            {activeSection === 'aiModels' && <AIModelsEditor />}
          </div>
        </div>
      </main>
    </div>
  );
}