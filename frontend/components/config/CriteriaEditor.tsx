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
  }, [selectedProfileId]); // Reload when profile changes

  const loadData = async () => {
    if (!selectedProfileId) {
      // Wait for profile to be loaded
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading criteria...</p>
      </div>
    );
  }

  if (!data || (!data.draft_phase_criteria && !data.research_phase_criteria)) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">Failed to load criteria</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b dark:border-gray-700 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Evaluation Criteria
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Criteria for evaluating project ideas at different stages.
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
          {/* Draft Phase Criteria */}
          {data.draft_phase_criteria && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Draft Phase Criteria
              </h3>
              <div className="space-y-4">
                {data.draft_phase_criteria.map((criterion: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-md mb-1">
                      {criterion.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {criterion.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span className="font-medium">Scale:</span> {criterion.scale}
                    </p>
                    {criterion.questions && criterion.questions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Questions to consider:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-8">
                Research Phase Criteria
              </h3>
              <div className="space-y-4">
                {data.research_phase_criteria.map((criterion: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700"
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-md mb-1">
                      {criterion.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {criterion.description}
                    </p>
                    {(criterion.validation_methods || criterion.analysis_includes || criterion.projections_include ||
                      criterion.architecture_includes || criterion.strategy_includes || criterion.risks_include) && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Includes:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-300 space-y-1">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
              <h3 className="text-md font-semibold text-blue-900 dark:text-blue-200 mb-3">Decision Thresholds</h3>

              {data.decision_thresholds.draft_to_research && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Draft to Research:</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Minimum total score: {data.decision_thresholds.draft_to_research.minimum_total_score} |
                    Minimum per criterion: {data.decision_thresholds.draft_to_research.minimum_per_criterion}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                    {data.decision_thresholds.draft_to_research.description}
                  </p>
                </div>
              )}

              {data.decision_thresholds.research_to_build && (
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Research to Build:</p>
                  {data.decision_thresholds.research_to_build.requirements && (
                    <ul className="list-disc list-inside text-xs text-blue-700 dark:text-blue-400 mt-1 space-y-1">
                      {data.decision_thresholds.research_to_build.requirements.map((req: string, rIdx: number) => (
                        <li key={rIdx}>{req}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
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
