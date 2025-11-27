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
  }, [selectedProfileId]); // Reload when profile changes

  const loadData = async () => {
    if (!selectedProfileId) {
      // Wait for profile to be loaded
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
        // Parse the text content as JSON
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
      // Switching from visual to text - convert data to JSON
      setTextContent(JSON.stringify(data, null, 2));
    } else if (newMode === 'visual' && editMode === 'text') {
      // Switching from text to visual - try to parse JSON
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading domains...</p>
      </div>
    );
  }

  if (!data || !data.domains) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Failed to load domains</p>
      </div>
    );
  }

  const domains = data.domains;

  const filteredDomains = domains.filter((domain: any) =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.subdomains?.some((sub: any) => sub.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Business Domains
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Browse and manage the business domains and subdomains used for idea generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                onClick={() => switchMode('visual')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  editMode === 'visual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                View
              </button>
              <button
                onClick={() => switchMode('text')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  editMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Edit
              </button>
            </div>
            {/* Save Button */}
            <button
              onClick={saveData}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {editMode === 'visual' ? (
        <>
          <div className="relative">
            <input
              type="text"
              placeholder="Search domains and subdomains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-11 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-3.5"
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

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              {filteredDomains.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">No domains found</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredDomains.map((domain: any, idx: number) => (
                  <div key={idx}>
                    <div
                      className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-colors"
                      onClick={() => toggleDomain(idx)}
                    >
                      <svg
                        className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ${
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
                      <span className="flex-1 font-semibold text-gray-900 dark:text-gray-100">{domain.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {domain.subdomains?.length || 0} subdomains
                      </span>
                    </div>
                    {expandedDomains.has(idx) && domain.subdomains && (
                      <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-2 p-5">
                          {domain.subdomains.map((subdomain: any, subIdx: number) => (
                            <div
                              key={subIdx}
                              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm transition-all text-sm text-gray-700 dark:text-gray-300"
                            >
                              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
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

          <div className="grid grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{domains.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Parent Domains</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {domains.reduce((sum: number, d: any) => sum + (d.subdomains?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Subdomains</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {domains.length + domains.reduce((sum: number, d: any) => sum + (d.subdomains?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Total Options</p>
            </div>
          </div>
        </>
      ) : (
        <div>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Edit JSON configuration..."
            spellCheck={false}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Tip: Edit the JSON directly. Click "Save" when done.
          </p>
        </div>
      )}
    </div>
  );
}
