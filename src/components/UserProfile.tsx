// ============================================
// User Profile Component
// Displays and allows editing of user information
// Pattern for: Loading states, error handling, forms
// ============================================

import { useState } from 'react';
import { Edit2, Save, X, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useApi';
import type { User } from '../types';

// --------------------------------------------
// Types
// --------------------------------------------

interface EditFormState {
  name: string;
}

// --------------------------------------------
// Component
// --------------------------------------------

export function UserProfile() {
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<EditFormState>({ name: '' });

  // --------------------------------------------
  // Loading State
  // --------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  // --------------------------------------------
  // Error State
  // --------------------------------------------

  if (error) {
    return (
      <div className="py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading profile</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 text-sm text-red-700 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------
  // Empty State
  // --------------------------------------------

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No user data available</p>
      </div>
    );
  }

  // --------------------------------------------
  // Handlers
  // --------------------------------------------

  const handleStartEdit = () => {
    setFormState({ name: user.name });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormState({ name: '' });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement save with API
      console.log('Saving:', formState);
      await new Promise((r) => setTimeout(r, 500)); // Simulated delay
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------
  // Render
  // --------------------------------------------

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        {!isEditing && (
          <button
            onClick={handleStartEdit}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        // Edit Form
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <X size={14} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formState.name.trim()}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        // Display Mode
        <div className="space-y-4">
          <ProfileField label="Name" value={user.name} />
          <ProfileField label="Email" value={user.email} />
          <ProfileField
            label="Role"
            value={
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                {user.role}
              </span>
            }
          />
          <ProfileField
            label="Member since"
            value={new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
        </div>
      )}
    </div>
  );
}

// --------------------------------------------
// Helper Components
// --------------------------------------------

interface ProfileFieldProps {
  label: string;
  value: React.ReactNode;
}

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div className="flex items-baseline">
      <dt className="w-32 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}
