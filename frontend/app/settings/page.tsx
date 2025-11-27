'use client';

import { useState } from 'react';
import ApiKeysEditor from '@/components/config/ApiKeysEditor';
import AIModelsEditor from '@/components/settings/AIModelsEditor';
import GenerationSettingsEditor from '@/components/settings/GenerationSettingsEditor';

type SettingsSection = 'apiKeys' | 'aiModels' | 'generation';

const tabs: { key: SettingsSection; label: string; icon: React.ReactNode }[] = [
  {
    key: 'apiKeys',
    label: 'API Keys',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  },
  {
    key: 'aiModels',
    label: 'AI Models',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  },
  {
    key: 'generation',
    label: 'Generation',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('apiKeys');

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">System Settings</h1>
          <p className="text-sm text-text-secondary">Manage global settings that apply across all configuration profiles</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/30 rounded text-xs">
          <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-medium text-warning">Admin Only</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-4 bg-surface rounded-md border border-border-subtle p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeSection === tab.key
                ? 'bg-mint/10 text-mint'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-surface rounded-md border border-border-subtle p-4">
        {activeSection === 'apiKeys' && <ApiKeysEditor />}
        {activeSection === 'aiModels' && <AIModelsEditor />}
        {activeSection === 'generation' && <GenerationSettingsEditor />}
      </div>
    </div>
  );
}
