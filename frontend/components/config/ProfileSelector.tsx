'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useConfigProfile } from '@/contexts/ConfigProfileContext';
import ConfirmDialog from '@/components/ConfirmDialog';

interface ConfigProfile {
  id: string;
  name: string;
  folder_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProfileSelectorProps {
  /**
   * If true, switching profiles will activate them in the backend (for Dashboard).
   * If false, it only changes which profile's config you're viewing/editing (for Config page).
   * Default: false
   */
  activateOnSwitch?: boolean;
  /**
   * If true, shows the "New Config" and "Delete" buttons (for Config page).
   * If false, only shows the dropdown selector (for Dashboard).
   * Default: false
   */
  showManagementButtons?: boolean;
}

export default function ProfileSelector({ activateOnSwitch = false, showManagementButtons = false }: ProfileSelectorProps) {
  const { showSuccess, showError, showWarning } = useToast();
  const { selectedProfile, setSelectedProfile } = useConfigProfile();
  const [profiles, setProfiles] = useState<ConfigProfile[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileFolderName, setNewProfileFolderName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneProfileName, setCloneProfileName] = useState('');
  const [cloneProfileFolderName, setCloneProfileFolderName] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      const allProfiles = await api.getConfigProfiles();
      setProfiles(allProfiles);
    } catch (error: any) {
      showError(error.message || 'Failed to load configuration profiles');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleProfileSwitch = async (profileId: string) => {
    if (activateOnSwitch) {
      // Dashboard behavior: Actually activate in backend
      try {
        await api.activateConfigProfile(profileId);
        showSuccess('Configuration profile activated successfully');
        // Reload profiles to update active state
        await loadProfiles();
        // Reload the page to fetch new configuration
        window.location.reload();
      } catch (error: any) {
        showError(error.message || 'Failed to activate configuration profile');
      }
    } else {
      // Config page behavior: Just switch which profile's settings to view/edit
      const profile = profiles.find(p => p.id === profileId);
      if (profile) {
        setSelectedProfile(profile);
        showSuccess(`Switched to viewing ${profile.name} configuration`);
      }
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim() || !newProfileFolderName.trim()) {
      showWarning('Please provide both name and folder name');
      return;
    }

    try {
      const newProfile = await api.createConfigProfile({
        name: newProfileName.trim(),
        folder_name: newProfileFolderName.trim(),
        description: newProfileDescription.trim() || undefined,
      });
      showSuccess('Configuration profile created successfully');
      setShowCreateDialog(false);
      setNewProfileName('');
      setNewProfileFolderName('');
      setNewProfileDescription('');
      await loadProfiles();

      // Auto-select the newly created profile on the config page
      if (!activateOnSwitch && newProfile) {
        setSelectedProfile(newProfile);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to create configuration profile');
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      await api.deleteConfigProfile(profileToDelete.id);
      showSuccess('Configuration profile deleted successfully');

      // Reload profiles
      await loadProfiles();

      // If we're on the config page (not activating on switch), select the active profile
      if (!activateOnSwitch) {
        const updatedProfiles = await api.getConfigProfiles();
        const activeProfile = updatedProfiles.find((p: ConfigProfile) => p.is_active);
        if (activeProfile) {
          setSelectedProfile(activeProfile);
        }
      }
    } catch (error: any) {
      showError(error.message || 'Failed to delete configuration profile');
    } finally {
      setProfileToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleCloneProfile = async () => {
    if (!selectedProfile) return;

    if (!cloneProfileName.trim() || !cloneProfileFolderName.trim()) {
      showWarning('Please provide both name and folder name');
      return;
    }

    try {
      const clonedProfile = await api.cloneConfigProfile(selectedProfile.id, {
        name: cloneProfileName.trim(),
        folder_name: cloneProfileFolderName.trim(),
      });
      showSuccess('Configuration profile cloned successfully');
      setShowCloneDialog(false);
      setCloneProfileName('');
      setCloneProfileFolderName('');
      await loadProfiles();

      // Auto-select the cloned profile on the config page
      if (!activateOnSwitch && clonedProfile) {
        setSelectedProfile(clonedProfile);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to clone configuration profile');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative">
          <label className="block text-xs text-text-muted mb-1">Configuration Profile</label>
          <select
            value={selectedProfile?.id || ''}
            onChange={(e) => handleProfileSwitch(e.target.value)}
            disabled={isLoadingProfiles}
            className="w-56 px-3 py-1.5 pr-8 bg-base border border-border-default rounded text-sm font-medium text-text-primary hover:bg-hover focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} {profile.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none mt-5">
            <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showManagementButtons && (
          <>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-5 px-3 py-1.5 bg-mint hover:bg-mint-dark text-base font-medium rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>

            <button
              onClick={() => {
                if (selectedProfile) {
                  setCloneProfileName(`${selectedProfile.name} (Copy)`);
                  setCloneProfileFolderName(`${selectedProfile.folder_name}-copy`);
                  setShowCloneDialog(true);
                }
              }}
              disabled={!selectedProfile}
              className="mt-5 px-3 py-1.5 bg-info/20 hover:bg-info/30 disabled:bg-elevated disabled:cursor-not-allowed text-info font-medium rounded text-xs flex items-center gap-1.5 transition-colors"
              title="Clone selected profile"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Clone
            </button>

            <button
              onClick={() => {
                if (selectedProfile && !selectedProfile.is_active) {
                  setProfileToDelete({ id: selectedProfile.id, name: selectedProfile.name });
                  setShowDeleteConfirm(true);
                }
              }}
              disabled={!selectedProfile || selectedProfile.is_active}
              className="mt-5 px-3 py-1.5 bg-error/20 hover:bg-error/30 disabled:bg-elevated disabled:cursor-not-allowed text-error font-medium rounded text-xs flex items-center gap-1.5 transition-colors"
              title={selectedProfile?.is_active ? 'Cannot delete active profile' : 'Delete selected profile'}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProfileToDelete(null);
        }}
        onConfirm={handleDeleteProfile}
        title="Delete Configuration Profile"
        message={`Are you sure you want to delete the configuration profile "${profileToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Create Profile Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-md border border-border-subtle max-w-md w-full p-5">
            <h3 className="text-base font-semibold text-text-primary mb-4">Create Configuration Profile</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g., Production, Development"
                  className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newProfileFolderName}
                  onChange={(e) => setNewProfileFolderName(e.target.value)}
                  placeholder="e.g., config-prod, config-dev"
                  className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                  placeholder="Brief description of this configuration profile"
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewProfileName('');
                  setNewProfileFolderName('');
                  setNewProfileDescription('');
                }}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-text-secondary bg-elevated border border-border-default rounded hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProfile}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-base bg-mint rounded hover:bg-mint-dark transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Profile Dialog */}
      {showCloneDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-md border border-border-subtle max-w-md w-full p-5">
            <h3 className="text-base font-semibold text-text-primary mb-2">Clone Configuration Profile</h3>
            <p className="text-xs text-text-muted mb-4">
              Create a copy of "{selectedProfile?.name}" with all its settings.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  New Profile Name
                </label>
                <input
                  type="text"
                  value={cloneProfileName}
                  onChange={(e) => setCloneProfileName(e.target.value)}
                  placeholder="e.g., Production Copy"
                  className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:outline-none focus:border-info focus:ring-1 focus:ring-info"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={cloneProfileFolderName}
                  onChange={(e) => setCloneProfileFolderName(e.target.value)}
                  placeholder="e.g., config-prod-copy"
                  className="w-full px-3 py-1.5 text-sm border border-border-default rounded bg-base text-text-primary placeholder-text-muted focus:outline-none focus:border-info focus:ring-1 focus:ring-info"
                />
                <p className="text-micro text-text-muted mt-1">
                  Only letters, numbers, dashes, and underscores allowed.
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCloneDialog(false);
                  setCloneProfileName('');
                  setCloneProfileFolderName('');
                }}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-text-secondary bg-elevated border border-border-default rounded hover:bg-hover transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCloneProfile}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-base bg-info rounded hover:bg-info/80 transition-colors"
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
