// ============================================
// Settings Layout
// Shared layout for all settings pages
// ============================================

import { NavLink, Outlet } from 'react-router-dom';
import { User, FolderOpen, Key, Settings } from 'lucide-react';
import { useCurrentUser } from '../hooks/useApi';

// --------------------------------------------
// Types
// --------------------------------------------

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

// --------------------------------------------
// Navigation Items
// --------------------------------------------

const navItems: NavItem[] = [
  {
    label: 'Profile',
    path: '/settings/profile',
    icon: <User size={18} />,
  },
  {
    label: 'Projects',
    path: '/settings/projects',
    icon: <FolderOpen size={18} />,
  },
  // API Keys nav item will be added during demo
  // {
  //   label: 'API Keys',
  //   path: '/settings/api-keys',
  //   icon: <Key size={18} />,
  // },
];

// --------------------------------------------
// Component
// --------------------------------------------

export function SettingsLayout() {
  const { data: user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Settings size={18} className="text-white" />
              </div>
              <span className="font-semibold text-gray-900">DevKit Platform</span>
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{user.name}</span>
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar navigation */}
          <nav className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-2">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
