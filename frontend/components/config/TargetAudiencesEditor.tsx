'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

interface TargetAudience {
  name: string;
  description?: string;
}

export default function TargetAudiencesEditor() {
  const { showSuccess, showError, showWarning } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
      const result = await api.getTargetAudiences(selectedProfileId);
      setData(result);
      setTextContent(JSON.stringify(result, null, 2));
    } catch (error: any) {
      showError(`Failed to load target audiences: ${error.message}`);
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

      await api.updateTargetAudiences(dataToSave, selectedProfileId || undefined);
      showSuccess('Target audiences saved successfully!');
    } catch (error: any) {
      showError(`Failed to save target audiences: ${error.message}`);
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

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Loading target audiences...</p>
      </div>
    );
  }

  if (!data || !data.target_audiences) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Failed to load target audiences</p>
      </div>
    );
  }

  const audiences: TargetAudience[] = data.target_audiences;

  const filteredAudiences = audiences.filter((audience) =>
    audience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audience.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Target Audiences
            </h2>
            <p className="text-xs text-text-secondary">
              Configure the target audience categories for idea generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              placeholder="Search target audiences..."
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

          {/* Audiences List */}
          <div className="border border-border-subtle rounded overflow-hidden">
            <div className="max-h-80 overflow-y-auto">
              {filteredAudiences.length === 0 ? (
                <div className="p-6 text-center text-text-muted">
                  <svg className="w-8 h-8 mx-auto mb-2 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium">No target audiences found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                filteredAudiences.map((audience, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2 hover:bg-hover border-b border-border-subtle transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-7 h-7 rounded-full bg-info/10 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-text-primary text-sm">
                          {audience.name}
                        </h3>
                        {audience.description && (
                          <p className="text-xs text-text-muted mt-0.5">
                            {audience.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="text-center p-3 bg-info/10 border border-info/20 rounded">
            <p className="text-lg font-bold text-info">{audiences.length}</p>
            <p className="text-xs text-text-secondary">Target Audiences</p>
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
