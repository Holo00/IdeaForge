'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';

export default function CriteriaEditor() {
  const { showSuccess, showError, showWarning } = useToast();
  const { selectedProfileId } = useConfigProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const result = await api.getCriteria(selectedProfileId);
      setData(result);
      setTextContent(JSON.stringify(result, null, 2));
    } catch (error: any) {
      showError(`Failed to load criteria: ${error.message}`);
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

      await api.updateCriteria(dataToSave, selectedProfileId || undefined);
      showSuccess('Criteria saved successfully!');
    } catch (error: any) {
      showError(`Failed to save criteria: ${error.message}`);
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
        <p className="text-text-secondary text-sm">Loading criteria...</p>
      </div>
    );
  }

  if (!data || (!data.draft_phase_criteria && !data.research_phase_criteria)) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary text-sm">Failed to load criteria</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border-subtle pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary mb-1">
              Evaluation Criteria
            </h2>
            <p className="text-xs text-text-secondary">
              Criteria for evaluating project ideas at different stages.
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
        <div className="space-y-4">
          {/* Draft Phase Criteria */}
          {data.draft_phase_criteria && (
            <div>
              <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-info rounded-full"></span>
                Draft Phase Criteria
              </h3>
              <div className="space-y-2">
                {data.draft_phase_criteria.map((criterion: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-border-subtle rounded p-3 bg-elevated/30"
                  >
                    <h4 className="font-medium text-text-primary text-sm mb-1">
                      {criterion.name}
                    </h4>
                    <p className="text-xs text-text-secondary mb-2">
                      {criterion.description}
                    </p>
                    <p className="text-micro text-text-muted mb-2">
                      <span className="font-medium">Scale:</span> {criterion.scale}
                    </p>
                    {criterion.questions && criterion.questions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border-subtle">
                        <p className="text-micro font-medium text-text-secondary mb-1">Questions:</p>
                        <ul className="list-disc list-inside text-micro text-text-muted space-y-0.5">
                          {criterion.questions.map((q: string, qIdx: number) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Research Phase Criteria */}
          {data.research_phase_criteria && (
            <div>
              <h3 className="text-xs font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full"></span>
                Research Phase Criteria
              </h3>
              <div className="space-y-2">
                {data.research_phase_criteria.map((criterion: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-border-subtle rounded p-3 bg-elevated/30"
                  >
                    <h4 className="font-medium text-text-primary text-sm mb-1">
                      {criterion.name}
                    </h4>
                    <p className="text-xs text-text-secondary mb-2">
                      {criterion.description}
                    </p>
                    {(criterion.validation_methods || criterion.analysis_includes || criterion.projections_include ||
                      criterion.architecture_includes || criterion.strategy_includes || criterion.risks_include) && (
                      <div className="mt-2 pt-2 border-t border-border-subtle">
                        <p className="text-micro font-medium text-text-secondary mb-1">Includes:</p>
                        <ul className="list-disc list-inside text-micro text-text-muted space-y-0.5">
                          {(criterion.validation_methods || criterion.analysis_includes || criterion.projections_include ||
                            criterion.architecture_includes || criterion.strategy_includes || criterion.risks_include || []).map((item: string, iIdx: number) => (
                            <li key={iIdx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision Thresholds */}
          {data.decision_thresholds && (
            <div className="bg-info/5 border border-info/20 rounded p-3">
              <h3 className="text-xs font-semibold text-info mb-2">Decision Thresholds</h3>

              {data.decision_thresholds.draft_to_research && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-info/80">Draft to Research:</p>
                  <p className="text-micro text-info/70 mt-0.5">
                    Min total: {data.decision_thresholds.draft_to_research.minimum_total_score} |
                    Min per criterion: {data.decision_thresholds.draft_to_research.minimum_per_criterion}
                  </p>
                  <p className="text-micro text-info/60 mt-0.5">
                    {data.decision_thresholds.draft_to_research.description}
                  </p>
                </div>
              )}

              {data.decision_thresholds.research_to_build && (
                <div>
                  <p className="text-xs font-medium text-info/80">Research to Build:</p>
                  {data.decision_thresholds.research_to_build.requirements && (
                    <ul className="list-disc list-inside text-micro text-info/70 mt-0.5 space-y-0.5">
                      {data.decision_thresholds.research_to_build.requirements.map((req: string, rIdx: number) => (
                        <li key={rIdx}>{req}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
