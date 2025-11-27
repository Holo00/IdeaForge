'use client';

import { useState } from 'react';
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

const tabs: { key: ConfigSection; label: string; icon: React.ReactNode }[] = [
  {
    key: 'prompt',
    label: 'Prompt',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    key: 'frameworks',
    label: 'Frameworks',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    key: 'criteria',
    label: 'Criteria',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    key: 'domains',
    label: 'Domains',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  },
  {
    key: 'monetization',
    label: 'Monetization',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    key: 'audiences',
    label: 'Audiences',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  },
  {
    key: 'extraFilters',
    label: 'Filters',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

function ConfigPageContent() {
  const [activeSection, setActiveSection] = useState<ConfigSection>('prompt');

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Configuration</h1>
          <p className="text-sm text-text-secondary">Configure how ideas are generated and evaluated</p>
        </div>
        <ProfileSelector activateOnSwitch={false} showManagementButtons={true} />
      </div>

      {/* How It Works - Compact */}
      <HowItWorksSection />

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-4 bg-surface rounded-md border border-border-subtle p-1">
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
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-surface rounded-md border border-border-subtle">
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
  );
}

export default function ConfigPage() {
  return (
    <ConfigProfileProvider>
      <ConfigPageContent />
    </ConfigProfileProvider>
  );
}
