'use client';

import { useState, useEffect } from 'react';
import GenerationSlot from '@/components/GenerationSlot';
import { Idea } from '@/types';
import { api } from '@/lib/api';

const STORAGE_KEY = 'ideaforge_max_generation_slots';
const DEFAULT_SLOTS = 3;

export default function DashboardPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [slotCount, setSlotCount] = useState(DEFAULT_SLOTS);

  // Load settings and fetch data
  useEffect(() => {
    // Load slot count from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = parseInt(stored, 10);
      if (!isNaN(value) && value >= 1 && value <= 10) {
        setSlotCount(value);
      }
    }

    // Fetch recent ideas
    fetchRecentIdeas();
  }, []);

  const fetchRecentIdeas = async () => {
    try {
      const response = await api.getIdeas({
        sortBy: 'created',
        sortOrder: 'desc',
        limit: 5,
      });
      setIdeas(response.ideas);
    } catch (error: any) {
      console.error('Failed to fetch ideas:', error);
    }
  };

  const handleIdeaGenerated = (idea: Idea) => {
    setIdeas((prev) => [idea, ...prev.slice(0, 4)]);
  };

  // Generate slot array based on slotCount
  const slots = Array.from({ length: slotCount }, (_, i) => i + 1);

  return (
    <div className="p-4 lg:p-6">
      {/* Stats Row - Compact metric cards at top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">Recent Ideas</span>
            <span className="text-xl font-bold text-mint">{ideas.length}</span>
          </div>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">High Score (65+)</span>
            <span className="text-xl font-bold text-success">{ideas.filter((i) => i.score >= 65).length}</span>
          </div>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">Domains</span>
            <span className="text-xl font-bold text-warning">{new Set(ideas.map((i) => i.domain)).size}</span>
          </div>
        </div>
        <div className="bg-surface rounded-md border border-border-subtle p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary uppercase tracking-wide">Generation Slots</span>
            <span className="text-xl font-bold text-info">{slotCount}</span>
          </div>
        </div>
      </div>

      {/* Generation Slots Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">Generation Slots</h2>
        <p className="text-xs text-text-secondary">
          Run multiple generations in parallel with different configurations. Configure slot count in Settings.
        </p>
      </div>

      {/* Generation Slots - 2 per row grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {slots.map((slotId) => (
          <GenerationSlot
            key={`slot-${slotId}`}
            slotId={slotId}
            onIdeaGenerated={handleIdeaGenerated}
          />
        ))}
      </div>
    </div>
  );
}
