import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCurrentUser } from '@/hooks/queries/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, accessToken } = useAuthStore();

  // Try to fetch current user if we have a token but no user yet
  const { isLoading: isUserLoading } = useCurrentUser(!!accessToken);

  if (isLoading || (accessToken && isUserLoading)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-discord-bg-tertiary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-discord-blurple border-t-transparent" />
          <p className="text-sm text-discord-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
