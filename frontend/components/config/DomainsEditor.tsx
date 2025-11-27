'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

export default function DomainsEditor() {
  const { showSuccess, showError, showWarning } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set([0]));
  const [editMode, setEditMode] = useState<'visual' | 'text'>('visual');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedProfileId]);

  const loadData = async () => {
    if (!selectedProfileId) {
      return;
    }

    try {
      setLoading(true);
      const result = await api.getDomains(selectedProfileId);
      setData(result);
      setTextContent(JSON.stringify(result, null, 2));
    } catch (error: any) {
      showError(`Failed to load domains: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      setSaving(true);
      let dataToSave = data;

      if (editMode === 'text') {
        try {
          dataToSave = JSON.parse(textContent);
          setData(dataToSave);
        } catch (e) {
          showError('Invalid JSON format. Please check your syntax.');
          setSaving(false);
          return;
        }
      }

      await api.updateDomains(dataToSave, selectedProfileId || undefined);
      showSuccess('Domains saved successfully!');
    } catch (error: any) {
      showError(`Failed to save domains: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const switchMode = (newMode: 'visual' | 'text') => {
    if (newMode === 'text' && editMode === 'visual') {
      setTextContent(JSON.stringify(data, null, 2));
    } else if (newMode === 'visual' && editMode === 'text') {
      try {
        const parsed = JSON.parse(textContent);
        setData(parsed);
      } catch (e) {
        showWarning('Invalid JSON format. Cannot switch to visual mode. Please fix the JSON first.');
        return;
      }
    }
    setEditMode(newMode);
  };

  const toggleDomain = (index: number) => {
    const newExpanded = new Set(expandedDomains);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedDomains(newExpanded);
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading domains...</p>
      </div>
    );
  }

  if (!data || !data.domains) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Failed to load domains</p>
      </div>
    );
  }

  const domains = data.domains;

  const filteredDomains = domains.filter((domain: any) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.subdomains?.some((sub: any) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Business Domains
            </h2>
            <p className="text-xs text-text-secondary">
              Browse and manage business domains and subdomains for idea generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex rounded border border-border-default overflow-hidden">
              <button
                onClick={() => switchMode('visual')}
                className={`px-2 py-1 text-xs font-medium transition-colors ${
                  editMode === 'visual'
                    ? 'bg-mint text-base'
                    : 'bg-elevated text-text-secondary hover:bg-hover'
                }`}
              >
                View
              </button>
              <button
                onClick={() => switchMode('text')}
                className={`px-2 py-1 text-xs font-medium transition-colors border-l border-border-default ${
                  editMode === 'text'
                    ? 'bg-mint text-base'
                    : 'bg-elevated text-text-secondary hover:bg-hover'
                }`}
              >
                Edit
              </button>
            </div>
            {/* Save Button */}
            <button
              onClick={saveData}
              disabled={saving}
              className="px-3 py-1 bg-mint text-base rounded hover:bg-mint-dark transition-colors disabled:opacity-50 text-xs font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {editMode === 'visual' ? (
        <>
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search domains and subdomains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 pl-8 border border-border-default bg-base text-text-primary text-sm rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint placeholder-text-muted"
            />
            <svg
              className="w-4 h-4 text-text-muted absolute left-2.5 top-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Domain List */}
          <div className="border border-border-subtle rounded overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {filteredDomains.length === 0 ? (
                <div className="p-6 text-center text-text-muted">
                  <svg className="w-8 h-8 mx-auto mb-2 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">No domains found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredDomains.map((domain: any, idx: number) => (
                  <div key={idx}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 hover:bg-hover cursor-pointer border-b border-border-subtle transition-colors"
                      onClick={() => toggleDomain(idx)}
                    >
                      <svg
                        className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${
                          expandedDomains.has(idx) ? 'rotate-90' : ''
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="flex-1 font-medium text-text-primary text-sm">{domain.name}</span>
                      <span className="text-xs text-text-muted bg-elevated px-2 py-0.5 rounded-full">
                        {domain.subdomains?.length || 0}
                      </span>
                    </div>
                    {expandedDomains.has(idx) && domain.subdomains && (
                      <div className="bg-elevated/50 border-b border-border-subtle">
                        <div className="grid grid-cols-2 gap-1.5 p-3">
                          {domain.subdomains.map((subdomain: any, subIdx: number) => (
                            <div
                              key={subIdx}
                              className="flex items-center gap-1.5 px-2 py-1.5 bg-base border border-border-subtle rounded text-xs text-text-secondary hover:border-mint/30 transition-colors"
                            >
                              <svg className="w-3 h-3 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              {subdomain.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center p-3 bg-info/10 border border-info/20 rounded">
              <p className="text-lg font-bold text-info">{domains.length}</p>
              <p className="text-xs text-text-secondary">Domains</p>
            </div>
            <div className="text-center p-3 bg-success/10 border border-success/20 rounded">
              <p className="text-lg font-bold text-success">
                {domains.reduce((sum: number, d: any) => sum + (d.subdomains?.length || 0), 0)}
              </p>
              <p className="text-xs text-text-secondary">Subdomains</p>
            </div>
            <div className="text-center p-3 bg-mint/10 border border-mint/20 rounded">
              <p className="text-lg font-bold text-mint">
                {domains.length + domains.reduce((sum: number, d: any) => sum + (d.subdomains?.length || 0), 0)}
              </p>
              <p className="text-xs text-text-secondary">Total</p>
            </div>
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-96 px-3 py-2 border border-border-default bg-base text-text-primary rounded focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint font-mono text-xs"
            placeholder="Edit JSON configuration..."
            spellCheck={false}
          />
          <p className="text-micro text-text-muted mt-1">
            Edit the JSON directly. Click "Save" when done.
          </p>
        </div>
      )}
    </div>
  );
}
