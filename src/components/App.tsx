// ============================================
// App Component
// Root component with providers and routing
// ============================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsLayout } from './SettingsLayout';
import { UserProfile } from './UserProfile';
import { ProjectsList } from './ProjectsList';
// ApiKeysPage will be added during demo

// --------------------------------------------
// Query Client
// --------------------------------------------

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// --------------------------------------------
// App Component
// --------------------------------------------

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Redirect root to settings */}
          <Route path="/" element={<Navigate to="/settings/profile" replace />} />
          
          {/* Settings routes */}
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="projects" element={<ProjectsList />} />
            {/* api-keys route will be added during demo */}
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
