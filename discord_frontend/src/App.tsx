import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoginPage } from '@/routes/auth/login';
import { RegisterPage } from '@/routes/auth/register';
import { AppLayout } from '@/routes/app/layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route
              path="/channels/*"
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/channels/@me" replace />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
